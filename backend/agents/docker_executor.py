import docker
import os

class DockerExecutor:
    def __init__(self):
        try:
            self.client = docker.from_env()
        except Exception:
            self.client = None

    def run_container(self, image: str, command: str, volumes: dict, working_dir: str) -> dict:
        if not self.client:
            raise Exception("Docker client not available")

        try:
            container = self.client.containers.run(
                image,
                command=f"bash -c '{command}'",
                volumes=volumes,
                working_dir=working_dir,
                detach=True
                # remove=True # We might want to inspect logs if it fails immediately
            )
            
            result = container.wait()
            logs = container.logs().decode('utf-8')
            container.remove()
            
            return {
                "success": result['StatusCode'] == 0,
                "exit_code": result['StatusCode'],
                "logs": logs
            }
        except Exception as e:
            return {
                "success": False,
                "exit_code": 1,
                "logs": str(e)
            }
