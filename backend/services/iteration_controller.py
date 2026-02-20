import logging
import time
import os
import json
import re as _re
from typing import Dict, List
from agents.repo_agent import RepoAgent
from agents.error_agent import ErrorAgent
from agents.fix_agent import FixAgent
from agents.verify_agent import VerifyAgent
from services.docker_executor import DockerExecutor
from services.git_service import GitService
from services.scoring import calculate_repair_score
from services.formatter import format_ps3_output  # noqa: F401 — kept for external callers

logger = logging.getLogger(__name__)

class IterationController:
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.repo_agent = RepoAgent()
        self.error_agent = ErrorAgent()
        self.fix_agent = FixAgent()
        self.verify_agent = VerifyAgent()
        self.docker_executor = DockerExecutor()
        self.git_service = GitService()

    def run_loop(self, repo_url: str, team: str, leader: str, retry_limit: int, job_ref: Dict):
        start_time = time.time()
        repo_path = None
        
        try:
            # 1. Clone & Branch
            repo_path = self.git_service.clone(repo_url, self.job_id)
            branch_name = self.git_service.setup_branch(repo_path, team, leader)
            job_ref["branch_name"] = branch_name
            
            # 2. Analyze (AI Layer 1)
            stack_info = self.repo_agent.analyze(repo_path)
            job_ref["raw_logs"] += f"Analyzed stack: {stack_info['language']}\n"
            
            # 3. Iterative Loop
            iteration = 1
            annotated_set = set()  # Track file:line combos to avoid duplicate annotations
            while True:
                logger.info(f"Loop: Iteration {iteration}/{retry_limit}")
                job_ref["iterations_used"] = iteration
                job_ref["timeline"].append({
                    "iteration": iteration,
                    "status": "RUNNING",
                    "timestamp": time.strftime("%H:%M:%S")
                })

                # Use stack-detected image & command
                image = stack_info.get("docker_image", "python:3.9-slim")
                cmd = stack_info.get("test_command", "pytest")
                
                # Execute Tests
                test_result = self.docker_executor.execute(
                    image, cmd,
                    volumes={repo_path: {'bind': '/app', 'mode': 'rw'}},
                    working_dir='/app'
                )
                job_ref["raw_logs"] += f"Iteration {iteration} Logs:\n{test_result['logs']}\n"

                if test_result.get("infra_error"):
                    job_ref["status"] = "ERROR"
                    break

                # Parse Errors
                errors = self.error_agent.parse_logs(test_result["logs"])

                if not test_result["success"] and not errors:
                    errors = [{
                        "file": "unknown",
                        "line": 0,
                        "type": "LOGIC",
                        "message": f"Test runner exited with code {test_result['exit_code']} but produced no parseable errors.",
                    }]

                job_ref["failures_detected"] += len(errors)

                if test_result["success"] and not errors:
                    job_ref["status"] = "PASSED"
                    break
                
                raw_logs_this_iter = test_result["logs"]
                fixes_this_iteration = 0

                for err in errors:
                    target_file = err["file"]
                    
                    # Clean absolute paths from docker (/app/) or local executors (/tmp/...)
                    if target_file.startswith("/app/"):
                        target_file = target_file.replace("/app/", "", 1)
                    elif os.path.isabs(target_file) and target_file.startswith(repo_path):
                        target_file = os.path.relpath(target_file, repo_path)
                    
                    source_func = ""

                    sf_match = _re.search(r'source function: (\w+)', err.get("message", ""))
                    if sf_match:
                        source_func = sf_match.group(1)

                    if source_func and ("test_" in target_file or "_test." in target_file):
                        for root_dir, _, dir_files in os.walk(repo_path):
                            for df in dir_files:
                                if df.endswith(".py") and not df.startswith("test_") and "_test." not in df:
                                    candidate = os.path.join(root_dir, df)
                                    try:
                                        with open(candidate, "r", encoding="utf-8", errors="replace") as cf:
                                            if f"def {source_func}" in cf.read():
                                                target_file = os.path.relpath(candidate, repo_path)
                                                break
                                    except Exception:
                                        pass

                    file_path = os.path.join(repo_path, target_file)
                    patch_applied = False
                    
                    # Dedup Logic: prevent repeating the same annotation without progress
                    dedup_key = f"{target_file}:{err['line']}"

                    original_content = ""
                    if os.path.exists(file_path):
                        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                            original_content = f.read()
                        original_content = _re.sub(r'\n+#={10,}.*?\[AI-AGENT FIX REQUIRED.*?\n#+={10,}\n?', '', original_content, flags=_re.DOTALL)

                    resolved_err = {**err, "file": target_file}
                    new_content, commit_msg, ai_fixed = self.fix_agent.apply_fix(
                        error=resolved_err,
                        file_content=original_content,
                        test_logs=raw_logs_this_iter,
                    )

                    if os.path.exists(file_path):
                        safe_to_write = (not ai_fixed) or self.fix_agent.check_diff_limit(original_content, new_content)

                        if safe_to_write:
                            with open(file_path, "w", encoding="utf-8", errors="replace") as f:
                                f.write(new_content)
                            patch_applied = True
                            
                            # Log and track progress
                            if ai_fixed:
                                fixes_this_iteration += 1 # Real progress
                            elif dedup_key not in annotated_set:
                                fixes_this_iteration += 1 # New annotation is progress
                                annotated_set.add(dedup_key)
                            
                        else:
                            job_ref["raw_logs"] += f"Safety: Rejected oversized AI rewrite for {target_file}\n"

                    self.git_service.commit_fix(repo_path, commit_msg)
                    job_ref["fixes"].append({
                        "file": target_file,
                        "bug_type": err["type"],
                        "line_number": err["line"],
                        "commit_message": f"[AI-AGENT] {commit_msg}",
                        "status": "AI_FIXED" if (patch_applied and ai_fixed) else ("ANNOTATED" if patch_applied else "SKIPPED"),
                    })
                    if patch_applied:
                        job_ref["fixes_applied"] += 1

                if fixes_this_iteration == 0:
                    logger.info("No NEW fixes or unique annotations applied. Breaking loop to prevent infinite cycle.")
                    job_ref["status"] = "FINISHED"
                    break

                if not self.verify_agent.should_continue(len(errors), iteration, retry_limit):
                    job_ref["status"] = "FINISHED"
                    break
                    
                iteration += 1
                time.sleep(1.5)

            # 4. Finalize
            elapsed = round(time.time() - start_time, 2)
            job_ref["total_time_seconds"] = elapsed
            job_ref["score"] = calculate_repair_score(
                job_ref["failures_detected"], 
                job_ref["fixes_applied"], 
                job_ref["iterations_used"],
                total_time_seconds=elapsed,
                total_commits=len(job_ref["fixes"]),
            )
            self.git_service.push(repo_path, branch_name)
            
            # Generate results.json (PS3 required)
            from services.formatter import format_ps3_output
            ps3_fixes = []
            for fix in job_ref["fixes"]:
                # Extract fix description from commit message
                msg = fix.get("commit_message", "")
                arrow_idx = msg.find("→")
                desc = msg[arrow_idx + 1:].strip() if arrow_idx >= 0 else "applied fix"
                desc = desc.replace("Fix:", "").replace("Fixed:", "").replace("Annotated:", "").strip()

                ps3_fixes.append({
                    "formatted_output": f"[AI-AGENT] {format_ps3_output(fix['bug_type'], fix['file'], fix['line_number'], desc)}",
                    **fix,
                })

            results = {
                "job_id": self.job_id,
                "repo_url": job_ref["repo_url"],
                "branch_name": job_ref["branch_name"],
                "failures_detected": job_ref["failures_detected"],
                "fixes_applied": job_ref["fixes_applied"],
                "iterations_used": job_ref["iterations_used"],
                "total_time_seconds": elapsed,
                "status": job_ref["status"],
                "score": job_ref["score"],
                "fixes": ps3_fixes,
                "timeline": job_ref["timeline"],
            }
            results_path = os.path.join(repo_path, "results.json")
            with open(results_path, "w", encoding="utf-8") as f:
                json.dump(results, f, indent=2, default=str)

        except Exception as e:
            logger.error(f"Loop failed: {e}")
            job_ref["status"] = "ERROR"
            job_ref["raw_logs"] += f"\nCritical Error: {str(e)}"
        finally:
            job_ref["total_time_seconds"] = round(time.time() - start_time, 2)
            if repo_path:
                self.git_service.cleanup(repo_path)
