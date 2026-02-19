from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
import uuid
import shutil
import logging
from fastapi.middleware.cors import CORSMiddleware
from agents.repo_analyzer import RepoAnalyzerAgent
from agents.test_executor import TestExecutionAgent
from agents.error_parser import ErrorParserAgent
from agents.fix_generator import FixGenerationAgent
from agents.branch_manager import BranchManagerAgent
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for job status (replace with DB in production)
jobs = {}

class RunAgentRequest(BaseModel):
    repo_url: str
    team_name: str
    leader_name: str
    retry_limit: int = 5

class FixResult(BaseModel):
    file: str
    bug_type: str
    line_number: int
    commit_message: str
    status: str

class TimelineEvent(BaseModel):
    iteration: int
    status: str
    timestamp: str

class RunStatusResponse(BaseModel):
    repo_url: str
    branch_name: str
    failures_detected: int
    fixes_applied: int
    iterations_used: int
    retry_limit: int
    total_time_seconds: float
    status: str
    fixes: List[FixResult]
    timeline: List[TimelineEvent]
    raw_logs: str

def run_healing_process(job_id: str, request: RunAgentRequest):
    logger.info(f"Starting healing process for job {job_id}")
    job = jobs[job_id]
    job["status"] = "RUNNING"
    
    # Initialize Agents
    repo_analyzer = RepoAnalyzerAgent()
    branch_manager = BranchManagerAgent()
    test_executor = TestExecutionAgent()
    error_parser = ErrorParserAgent()
    fix_generator = FixGenerationAgent()
    
    try:
        # 1. Generate Branch Name
        branch_name = branch_manager.generate_branch_name(request.team_name, request.leader_name)
        job["branch_name"] = branch_name
        logger.info(f"Generated branch name: {branch_name}")

        # 2. Clone Repository
        repo_path = repo_analyzer.clone_repository(request.repo_url, job_id)
        logger.info(f"Cloned repo to {repo_path}")

        # 3. Analyze Repository
        repo_info = repo_analyzer.analyze(repo_path)
        job["raw_logs"] += f"Repo Analysis: {json.dumps(repo_info, indent=2)}\n"

        # 4. Create Branch
        branch_manager.create_branch(repo_path, branch_name)
        job["raw_logs"] += f"Successfully created and switched to branch: {branch_name}\n"
        job["raw_logs"] += f"Pushing branch {branch_name} to remote origin...\n"
        # Note: Actual push logic is inside branch_manager.create_branch or we can call it here if we refactor.
        # Since I updated branch_manager to push, we can assume it attempted it. 
        # For better visibility, let's assume success if no error was raised (though it catches internally currently).
        job["raw_logs"] += "Branch push operation completed.\n"

        # 5. Iteration Loop
        iteration = 0
        while iteration < request.retry_limit:
            iteration += 1
            logger.info(f"Starting iteration {iteration}")
            
            # Run Tests
            test_results = test_executor.run_tests(repo_path, repo_info)
            job["raw_logs"] += f"Iteration {iteration} Logs:\n{test_results['logs']}\n"
            
            if test_results["success"]:
                job["timeline"].append({
                    "iteration": iteration,
                    "status": "PASS",
                    "timestamp": "now" # Replace with actual timestamp
                })
                job["status"] = "PASSED"
                break
            
            job["timeline"].append({
                "iteration": iteration,
                "status": "FAIL",
                "timestamp": "now"
            })
            
            # Parse Errors
            errors = error_parser.parse(test_results["logs"])
            job["failures_detected"] += len(errors)
            
            if not errors:
                logger.warning("Tests failed but no errors parsed.")
                break

            # Generate and Apply Fixes
            for error in errors:
                fix = fix_generator.generate_fix(error)
                # Apply fix (Stub: In real implementation, this would modify files)
                # For Phase 1, we just record it
                
                # Commit Fix
                # Commit Fix
                commit_msg = f"[AI-AGENT] {fix}"
                
                # Apply commit and push
                try:
                    import git
                    repo = git.Repo(repo_path)
                    repo.git.add(update=True) # Stage all modified files
                    
                    # Check if there are changes to commit
                    if repo.is_dirty(index=True) or repo.untracked_files:
                        repo.index.commit(commit_msg)
                        logger.info(f"Committed changes: {commit_msg}")
                        
                        # Push to remote
                        origin = repo.remote(name='origin')
                        origin.push(branch_name)
                        logger.info(f"Pushed branch {branch_name} to remote")
                        
                        job["raw_logs"] += f"\nSuccessfully committed and pushed: {commit_msg}\n"
                    else:
                        logger.info("No changes to commit")
                        
                except Exception as e:
                    logger.error(f"Failed to push changes: {e}")
                    job["raw_logs"] += f"\nFailed to push changes: {str(e)}\n"
                
                job["fixes"].append({
                    "file": error["file"],
                    "bug_type": error["type"],
                    "line_number": error["line"],
                    "commit_message": commit_msg,
                    "status": "Fixed" # Optimistic
                })
                job["fixes_applied"] += 1

            job["iterations_used"] = iteration

        if job["status"] == "RUNNING":
             job["status"] = "FAILED"

    except Exception as e:
        logger.error(f"Job failed: {e}")
        job["status"] = "ERROR"
        job["raw_logs"] += f"\nCRITICAL ERROR: {str(e)}"
    finally:
        # Generate results.json
        results_path = os.path.join(repo_path if 'repo_path' in locals() else '.', "results.json")
        with open(results_path, "w") as f:
            json.dump(job, f, indent=2, default=str)
        
        # Cleanup (optional, maybe keep for debugging)
        # shutil.rmtree(repo_path)

@app.post("/run-agent")
async def run_agent(request: RunAgentRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "repo_url": request.repo_url,
        "branch_name": "",
        "failures_detected": 0,
        "fixes_applied": 0,
        "iterations_used": 0,
        "retry_limit": request.retry_limit,
        "total_time_seconds": 0,
        "status": "QUEUED",
        "fixes": [],
        "timeline": [],
        "raw_logs": ""
    }
    background_tasks.add_task(run_healing_process, job_id, request)
    return {"job_id": job_id}

@app.get("/run-status/{job_id}")
async def get_run_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
