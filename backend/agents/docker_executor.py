import docker
import os
from utils import get_logger

logger = get_logger(__name__)

class DockerExecutor:
    def __init__(self):
        try:
            self.client = docker.from_env()
        except Exception as e:
            logger.error(f"Failed to initialize Docker client: {e}")
            self.client = None

    def run_container(self, image: str, command: str, volumes: dict, working_dir: str) -> dict:
        if not self.client:
            raise RuntimeError("Docker client not initialized")

        try:
            logger.info(f"Starting container with image {image}")
            container = self.client.containers.run(
                image,
                command=command,
                volumes=volumes,
                working_dir=working_dir,
                detach=True,
                # remove=True # Don't auto-remove instantly so we can get logs, handle manually
            )
            
            exit_code = container.wait()['StatusCode']
            logs = container.logs().decode('utf-8')
            
            container.remove()
            
            return {
                "success": exit_code == 0,
                "exit_code": exit_code,
                "logs": logs
            }
        except Exception as e:
            logger.error(f"Docker execution failed: {e}")
            return {
                "success": False,
                "exit_code": 1,
                "logs": str(e)
            }
