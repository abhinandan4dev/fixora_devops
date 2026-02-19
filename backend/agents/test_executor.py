from .docker_executor import DockerExecutor
import os
import subprocess

class TestExecutionAgent:
    def __init__(self):
        self.docker_executor = DockerExecutor()

    def run_tests(self, repo_path: str, repo_info: dict) -> dict:
        # Try Docker first
        if self.docker_executor.client:
            try:
                image = "python:3.9" if repo_info["language"] == "python" else "node:16"
                
                command = "echo 'No tests found'"
                if repo_info["language"] == "python":
                    command = "pip install -r requirements.txt && pytest"
                elif repo_info["language"] == "javascript":
                    command = "npm install && npm test"

                volumes = {repo_path: {'bind': '/app', 'mode': 'rw'}}
                
                return self.docker_executor.run_container(
                    image, command, volumes, '/app'
                )
            except Exception as e:
                print(f"Docker failed, falling back to host: {e}")
        
        # Fallback to Host
        return self._run_tests_host(repo_path, repo_info)

    
    def _run_tests_host(self, repo_path: str, repo_info: dict) -> dict:
        import sys
        
        install_cmd = []
        test_cmd = []
        
        if repo_info["language"] == "python":
            # Use 'sys.executable' to ensure we use the same Python environment
            install_cmd = [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"]
            test_cmd = [sys.executable, "-m", "pytest"] 
        elif repo_info["language"] == "javascript":
            # For Windows compatibility with npm (which is a .cmd file)
            npm_cmd = "npm.cmd" if os.name == 'nt' else "npm"
            install_cmd = [npm_cmd, "install"]
            test_cmd = [npm_cmd, "test"]
            
        logs = ""
        try:
            # 1. Install Dependencies
            if install_cmd:
                logs += f"Running: {' '.join(install_cmd)}\n"
                install_result = subprocess.run(
                    install_cmd,
                    cwd=repo_path,
                    capture_output=True,
                    text=True
                )
                logs += install_result.stdout + "\n" + install_result.stderr + "\n"
                if install_result.returncode != 0:
                    return {
                        "success": False,
                        "exit_code": install_result.returncode,
                        "logs": logs + f"\nDependency installation failed with code {install_result.returncode}"
                    }

            # 2. Run Tests
            logs += f"Running: {' '.join(test_cmd)}\n"
            test_result = subprocess.run(
                test_cmd, 
                cwd=repo_path, 
                capture_output=True, 
                text=True
            )
            logs += test_result.stdout + "\n" + test_result.stderr
            
            return {
                "success": test_result.returncode == 0,
                "exit_code": test_result.returncode,
                "logs": logs
            }
        except Exception as e:
             return {
                "success": False,
                "exit_code": 1,
                "logs": logs + f"\nHost execution failed: {str(e)}"
            }
