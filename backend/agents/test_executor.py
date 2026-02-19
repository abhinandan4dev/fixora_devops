from .docker_executor import DockerExecutor
from utils import get_logger
import os

logger = get_logger(__name__)

class TestExecutionAgent:
    def __init__(self):
        self.docker_executor = DockerExecutor()

    def run_tests(self, repo_path: str, repo_info: dict) -> dict:
        # Determine Image and Command based on language
        image = "python:3.9" 
        command = "echo 'No configuration found'"
        
        if repo_info["language"] == "python":
            image = "python:3.9-slim"
            command = "bash -c 'pip install -r requirements.txt && pytest'"
        elif repo_info["language"] == "javascript":
            image = "node:16-slim" 
            command = "bash -c 'npm install && npm test'"
            
        # Mount the repo
        # Windows formatting for Docker Desktop usually works with absolute paths, 
        # but sometimes needs /c/Users/... format. Assuming standard Docker Desktop for Windows here.
        volumes = {repo_path: {'bind': '/app', 'mode': 'rw'}}
        
        try:
            logger.info(f"Running tests in Docker for {repo_info['language']}")
            return self.docker_executor.run_container(image, command, volumes, '/app')
        except Exception as e:
             logger.error(f"Test execution failed: {e}")
             return {
                "success": False,
                "exit_code": 1,
                "logs": f"Execution failed: {str(e)}"
            }
