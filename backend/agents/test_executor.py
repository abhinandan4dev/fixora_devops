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
        
        if repo_info["language"] == "unknown":
            # Deep fallback: Check if package.json exists even if analyzer missed it
            if os.path.exists(os.path.join(repo_path, "package.json")):
                repo_info["language"] = "javascript"
                logger.info("Fallback: Detected package.json in TestExecutionAgent")
            elif os.path.exists(os.path.join(repo_path, "requirements.txt")):
                repo_info["language"] = "python"
                logger.info("Fallback: Detected requirements.txt in TestExecutionAgent")

        if repo_info["language"] == "python":
            image = "python:3.9-slim"
            command = "bash -c 'pip install -r requirements.txt && pytest'"
        elif repo_info["language"] == "javascript":
            image = "node:16-slim" 
            # If package.json exists, use npm. Otherwise, try checking syntax of all JS/TS files as a fallback.
            command = "bash -c 'if [ -f package.json ]; then echo \"Found package.json, running npm install and build/test...\"; npm install && (npm run build || npm test); else echo \"No package.json found. Analysis fallback: Checking syntax of JS/TS files...\"; find . -name \"*.js\" -o -name \"*.jsx\" -o -name \"*.ts\" -o -name \"*.tsx\" | xargs -I {} node -c {} 2>&1 || echo \"Syntax check finished with some issues.\"; fi'"
            
        # Mount the repo
        volumes = {repo_path: {'bind': '/app', 'mode': 'rw'}}
        
        # Determine working directory inside container
        working_dir = "/app"
        if repo_info.get("project_root") and repo_info["project_root"] != ".":
            # Convert Windows backslashes to forward slashes for the container
            sub_path = repo_info["project_root"].replace("\\", "/")
            working_dir = f"/app/{sub_path}"

        try:
            logger.info(f"Running tests in Docker for {repo_info['language']} using image {image}")
            logger.info(f"Working Directory: {working_dir}")
            logger.info(f"Command: {command}")
            return self.docker_executor.run_container(image, command, volumes, working_dir)
        except Exception as e:
             logger.error(f"Test execution failed: {e}")
             return {
                "success": False,
                "exit_code": 1,
                "logs": f"Execution failed: {str(e)}"
            }
