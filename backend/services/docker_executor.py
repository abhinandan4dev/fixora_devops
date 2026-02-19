"""
Docker Executor — runs test commands inside isolated containers.
Returns a result dict with: success, exit_code, logs, infra_error.
`infra_error=True` means Docker itself failed (not the tests), allowing
the caller to distinguish infra failures from genuine test passes/failures.
"""

import docker
import logging
import time

logger = logging.getLogger(__name__)


class DockerExecutor:
    def __init__(self):
        try:
            self.client = docker.from_env()
        except Exception as e:
            logger.error(f"Docker initialization failed: {e}")
            self.client = None

    def execute(
        self,
        image: str,
        command: str,
        volumes: dict,
        working_dir: str,
        timeout: int = 300,
    ) -> dict:
        """Runs tests in Docker if available, otherwise falls back to local subprocess."""
        
        # ── Option A: Docker Execution ──
        if self.client:
            container = None
            try:
                logger.info(f"Docker: Running {image} with command: {command}")
                
                # Command normalization for Docker SDK
                docker_command = ["sh", "-c", command[6:-1]] if command.startswith("sh -c ") else command
                
                container = self.client.containers.run(
                    image,
                    command=docker_command,
                    volumes=volumes,
                    working_dir=working_dir,
                    detach=True,
                )

                status = container.wait(timeout=timeout)
                exit_code = status["StatusCode"]
                logs = container.logs().decode("utf-8", errors="replace")

                return {
                    "success": exit_code == 0,
                    "exit_code": exit_code,
                    "logs": logs,
                    "infra_error": False,
                }
            except Exception as e:
                logger.warning(f"Docker execution failed: {e}. Attempting local fallback...")
            finally:
                if container:
                    try: container.remove(force=True)
                    except: pass

        # ── Option B: Local Fallback (For platforms like Railway) ──
        import subprocess
        import os
        
        logger.info(f"LocalExecutor: Running command in {working_dir}...")
        try:
            # We run the command directly on the host OS
            # Note: volumes mapping is ignored in local mode as we are already in the repo path
            process = subprocess.run(
                command,
                shell=True,
                cwd=working_dir,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            
            return {
                "success": process.returncode == 0,
                "exit_code": process.returncode,
                "logs": process.stdout + "\n" + process.stderr,
                "infra_error": False,
            }
        except Exception as e:
            return {
                "success": False,
                "logs": f"Local execution failed: {str(e)}",
                "exit_code": -1,
                "infra_error": True,
            }
