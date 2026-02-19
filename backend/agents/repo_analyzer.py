import os
import git
import shutil
import tempfile
from config import settings
from utils import get_logger

logger = get_logger(__name__)

class RepoAnalyzerAgent:
    def clone_repository(self, repo_url: str, job_id: str) -> str:
        # Construct Authenticated URL
        auth_url = repo_url
        if settings.GITHUB_TOKEN:
            if "https://" in repo_url:
                clean_url = repo_url.replace("https://", "")
                auth_url = f"https://{settings.GITHUB_TOKEN}@{clean_url}"
            else:
                 # Handle generic case or SSH if needed, but requirements say HTTPS
                 pass
        
        # Use platform-independent temp dir
        base_dir = tempfile.gettempdir()
        repo_path = os.path.join(base_dir, "healing-agent-repos", job_id)
        
        if os.path.exists(repo_path):
            self._cleanup_path(repo_path)
            
        logger.info(f"Cloning {repo_url} to {repo_path}")
        try:
            git.Repo.clone_from(auth_url, repo_path)
            return repo_path
        except git.GitCommandError as e:
            if "403" in str(e):
                raise PermissionError("Write access denied for this repository.")
            raise e

    def _cleanup_path(self, path):
         try:
            # Handle readonly files on Windows
            def onerror(func, path, exc_info):
                import stat
                if not os.access(path, os.W_OK):
                    os.chmod(path, stat.S_IWUSR)
                    func(path)
                else:
                    raise
            shutil.rmtree(path, onerror=onerror)
         except Exception as e:
            logger.error(f"Error cleaning up {path}: {e}")

    def analyze(self, repo_path: str) -> dict:
        info = {
            "language": "unknown",
            "test_framework": "unknown",
            "test_files": [],
            "ci_config": None,
            "total_files": 0
        }

        file_count = 0
        for root, dirs, files in os.walk(repo_path):
            if ".git" in dirs:
                dirs.remove(".git") # Don't traverse git
            
            file_count += len(files)
            
            for file in files:
                # Detect Language
                if file == "requirements.txt" or file == "setup.py":
                    info["language"] = "python"
                elif file == "package.json":
                    info["language"] = "javascript"

                # Detect Test Files
                full_path = os.path.join(root, file)
                if info["language"] == "python" or info["language"] == "unknown":
                    if file.startswith("test_") or file.endswith("_test.py"):
                        info["test_files"].append(full_path)
                        info["test_framework"] = "pytest"
                
                if info["language"] == "javascript" or info["language"] == "unknown":
                    if file.endswith(".test.js") or file.endswith(".spec.js"):
                        info["test_files"].append(full_path)
                        info["test_framework"] = "jest"

        info["total_files"] = file_count

        # Detect CI Config
        github_workflows = os.path.join(repo_path, ".github", "workflows")
        if os.path.exists(github_workflows):
            info["ci_config"] = "github-actions"

        logger.info(f"Analysis complete: {info}")
        return info
