import logging
import time
import os
import json
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

                # Use stack-detected image & command (supports Python / JS / Gradle / Maven)
                image = stack_info.get("docker_image", "python:3.9-slim")
                cmd = stack_info.get("test_command", "pytest")
                
                # Execute Tests — always from repo root (/app)
                test_result = self.docker_executor.execute(
                    image, cmd,
                    volumes={repo_path: {'bind': '/app', 'mode': 'rw'}},
                    working_dir='/app'
                )
                job_ref["raw_logs"] += f"Iteration {iteration} Logs:\n{test_result['logs']}\n"

                # Infrastructure error (Docker itself failed, not the tests)
                if test_result.get("infra_error"):
                    logger.error(f"Docker infrastructure error on iteration {iteration}. Stopping loop.")
                    job_ref["status"] = "ERROR"
                    job_ref["raw_logs"] += f"\nInfra Error: {test_result['logs']}\n"
                    break

                # No tests found — stop immediately, retrying won't help
                logs_lower = test_result["logs"].lower()
                no_tests = (
                    "collected 0 items" in logs_lower
                    or "no tests ran" in logs_lower
                    or "no test framework detected" in logs_lower
                    or test_result.get("exit_code") == 5  # pytest: no tests collected
                )
                if no_tests:
                    logger.error("No tests found in the repository. Cannot proceed.")
                    job_ref["status"] = "ERROR"
                    job_ref["raw_logs"] += "\nNo test files were discovered. Ensure test files follow naming conventions (test_*.py, *.test.js, etc.)\n"
                    break

                # Parse Errors (AI Layer 2)
                errors = self.error_agent.parse_logs(test_result["logs"])

                # Guard: if Docker ran but tests produced no parseable errors AND
                # the run was not successful, inject a synthetic error.
                if not test_result["success"] and not errors:
                    errors = [{
                        "file": "unknown",
                        "line": 0,
                        "type": "LOGIC",
                        "message": f"Test runner exited with code {test_result['exit_code']} but produced no parseable errors.",
                    }]
                    logger.warning("Injected synthetic error — test runner crash produced no structured output.")

                job_ref["failures_detected"] += len(errors)

                # If genuinely passing, stop
                if test_result["success"] and not errors:
                    job_ref["status"] = "PASSED"
                    break
                
                # Generate & Apply Fixes (AI Layer 3)
                raw_logs_this_iter = test_result["logs"]
                fixes_this_iteration = 0

                for err in errors:
                    # ── Resolve target file ──
                    # For assertion errors in test files, the real bug is in the
                    # source file. If we detected "source function: X", look for
                    # the file that defines X and target THAT instead.
                    target_file = err["file"]
                    source_func = ""

                    # Extract source function from error message
                    import re as _re
                    sf_match = _re.search(r'source function: (\w+)', err.get("message", ""))
                    if sf_match:
                        source_func = sf_match.group(1)

                    # If the error is in a test file, find the actual source file
                    if source_func and ("test_" in target_file or "_test." in target_file):
                        for root_dir, _, dir_files in os.walk(repo_path):
                            for df in dir_files:
                                if df.endswith(".py") and not df.startswith("test_") and "_test." not in df:
                                    candidate = os.path.join(root_dir, df)
                                    try:
                                        with open(candidate, "r", encoding="utf-8", errors="replace") as cf:
                                            if f"def {source_func}" in cf.read():
                                                target_file = os.path.relpath(candidate, repo_path)
                                                logger.info(f"Resolved fix target: {err['file']} -> {target_file} (function: {source_func})")
                                                break
                                    except Exception:
                                        pass

                    file_path = os.path.join(repo_path, target_file)
                    patch_applied = False

                    # Dedup: skip if already annotated this file+line in a previous iteration
                    dedup_key = f"{target_file}:{err['line']}"
                    if dedup_key in annotated_set:
                        logger.info(f"Skipping duplicate annotation for {dedup_key}")
                        continue

                    # Read current file content
                    original_content = ""
                    if os.path.exists(file_path):
                        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                            original_content = f.read()

                    # AI rewrites actual code (primary) or appends comment (fallback)
                    # Update the error dict with the resolved target for AI context
                    resolved_err = {**err, "file": target_file}

                    new_content, commit_msg, ai_fixed = self.fix_agent.apply_fix(
                        error=resolved_err,
                        file_content=original_content,
                        test_logs=raw_logs_this_iter,
                    )

                    if os.path.exists(file_path):
                        # Diff limit only applies to AI rewrites (safety gate).
                        safe_to_write = (not ai_fixed) or self.fix_agent.check_diff_limit(original_content, new_content)

                        if safe_to_write:
                            with open(file_path, "w", encoding="utf-8", errors="replace") as f:
                                f.write(new_content)
                            patch_applied = True
                            fix_mode = "AI_REWRITE" if ai_fixed else "ANNOTATED"
                            logger.info(f"FixAgent [{fix_mode}]: {commit_msg}")
                            if not ai_fixed:
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
                        fixes_this_iteration += 1

                # If nothing was changed this iteration, stop — retrying won't help
                if fixes_this_iteration == 0:
                    logger.info("No new fixes applied this iteration — all errors already annotated. Stopping.")
                    job_ref["status"] = "FINISHED"
                    break

                # Verify Continuation (AI Layer 4)
                if not self.verify_agent.should_continue(len(errors), iteration, retry_limit):
                    job_ref["status"] = "FINISHED"
                    break
                    
                iteration += 1

            # 4. Finalize
            job_ref["score"] = calculate_repair_score(
                job_ref["failures_detected"], 
                job_ref["fixes_applied"], 
                job_ref["iterations_used"]
            )
            self.git_service.push(repo_path, branch_name)
            
            # Generate results.json
            results_path = os.path.join(repo_path, "results.json")
            with open(results_path, "w") as f:
                json.dump(job_ref, f, indent=2, default=str)

        except Exception as e:
            logger.error(f"Loop failed: {e}")
            job_ref["status"] = "ERROR"
            job_ref["raw_logs"] += f"\nCritical Error: {str(e)}"
        finally:
            job_ref["total_time_seconds"] = round(time.time() - start_time, 2)
            if repo_path:
                self.git_service.cleanup(repo_path)
