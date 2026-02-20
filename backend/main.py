import uuid
import logging
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models.schemas import RunAgentRequest, RunStatusResponse
from services.iteration_controller import IterationController

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Fixora Autonomous CI/CD Healing Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
# In-memory session storage
jobs = {}

@app.get("/")
async def root():
    """Health check endpoint to ensure API is online (Prevents 502 on root visits)."""
    return {"status": "Fixora Engine Online", "version": "1.0.0"}

@app.get("/debug-env")
async def debug_env():
    import os
    return {
        "GITHUB_TOKEN_PRESENT": bool(os.getenv("GITHUB_TOKEN")),
        "GEMINI_KEY_PRESENT": bool(os.getenv("GEMINI_API_KEY")),
        "AI_REPO_KEY_PRESENT": bool(os.getenv("AI_REPO_KEY")),
    }

@app.options("/run-agent")
async def run_agent_options():
    return {"message": "OK"}

@app.post("/run-agent")
async def run_agent(request: RunAgentRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    
    # Initialize job state
    jobs[job_id] = {
        "job_id": job_id,
        "repo_url": request.repo_url,
        "branch_name": "",
        "failures_detected": 0,
        "fixes_applied": 0,
        "iterations_used": 0,
        "retry_limit": request.retry_limit,
        "total_time_seconds": 0.0,
        "status": "QUEUED",
        "score": 0.0,
        "fixes": [],
        "timeline": [],
        "raw_logs": "System initialized...\n"
    }
    
    controller = IterationController(job_id)
    background_tasks.add_task(
        controller.run_loop, 
        request.repo_url, 
        request.team_name, 
        request.leader_name, 
        request.retry_limit, 
        jobs[job_id],
        api_key=request.api_key,
        github_token=request.github_token
    )
    
    return {"job_id": job_id}

@app.get("/run-status/{job_id}", response_model=RunStatusResponse)
async def get_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]

if __name__ == "__main__":
    import uvicorn
    import os
    # Read the PORT environment variable injected by Railway, defaulting to 8000
    port = int(os.environ.get("PORT", 8000))
    # Production configuration: non-reload
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False, workers=1)
