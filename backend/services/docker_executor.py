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
        if not self.client:
            return {
                "success": False,
                "logs": "Docker client unavailable. Is Docker Desktop running?",
                "exit_code": -1,
                "infra_error": True,
            }

        container = None
        try:
            logger.info(f"Docker: Running {image} with command: {command}")

            # The Docker Python SDK doesn't use a shell by default.
            # Commands prefixed with 'sh -c' must be passed as a list.
            if command.startswith("sh -c "):
                shell_cmd = command[len("sh -c "):]
                # Strip surrounding quotes if present
                if (shell_cmd.startswith("'") and shell_cmd.endswith("'")) or \
                   (shell_cmd.startswith('"') and shell_cmd.endswith('"')):
                    shell_cmd = shell_cmd[1:-1]
                docker_command = ["sh", "-c", shell_cmd]
            else:
                docker_command = command

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
            err_str = str(e)
            logger.error(f"Docker execution error: {err_str[:200]}")
            if container:
                try:
                    container.kill()
                except Exception:
                    pass
            return {
                "success": False,
                "logs": err_str,
                "exit_code": -1,
                "infra_error": True,  # <-- key flag: Docker failed, NOT the tests
            }
        finally:
            if container:
                try:
                    container.remove(force=True)
                except Exception:
                    pass
