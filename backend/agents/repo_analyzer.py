import os
import git
import shutil
import uuid

class RepoAnalyzerAgent:
    def clone_repository(self, repo_url: str, job_id: str) -> str:
        # Create a unique directory for this job
        import tempfile
        base_dir = tempfile.gettempdir()
        repo_path = os.path.join(base_dir, "healing-agent-repos", job_id)
        
        if os.path.exists(repo_path):
            try:
                # Handle readonly files on Windows
                def onerror(func, path, exc_info):
                    import stat
                    if not os.access(path, os.W_OK):
                        os.chmod(path, stat.S_IWUSR)
                        func(path)
                    else:
                        raise
                shutil.rmtree(repo_path, onerror=onerror)
            except Exception as e:
                print(f"Error cleaning up existing directory: {e}")
        
        git.Repo.clone_from(repo_url, repo_path)
        return repo_path

    def analyze(self, repo_path: str) -> dict:
        info = {
            "language": "unknown",
            "test_framework": "unknown",
            "test_files": [],
            "ci_config": None
        }

        # Detect Language
        if os.path.exists(os.path.join(repo_path, "requirements.txt")) or \
           os.path.exists(os.path.join(repo_path, "setup.py")):
            info["language"] = "python"
        elif os.path.exists(os.path.join(repo_path, "package.json")):
            info["language"] = "javascript"

        # Detect Test Framework & Files
        test_files = []
        for root, dirs, files in os.walk(repo_path):
            for file in files:
                if info["language"] == "python":
                    if file.startswith("test_") or file.endswith("_test.py"):
                        test_files.append(os.path.join(root, file))
                        info["test_framework"] = "pytest" # Default assumption
                elif info["language"] == "javascript":
                    if file.endswith(".test.js") or file.endswith(".spec.js"):
                        test_files.append(os.path.join(root, file))
                        info["test_framework"] = "jest" # Default assumption

        info["test_files"] = test_files

        # Detect CI Config
        github_workflows = os.path.join(repo_path, ".github", "workflows")
        if os.path.exists(github_workflows):
            info["ci_config"] = "github-actions"

        return info
