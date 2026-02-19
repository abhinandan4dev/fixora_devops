"""
Git Service — clone, branch, commit, push, cleanup.
Injects GITHUB_TOKEN into the clone URL so pushes authenticate automatically.
"""

import os
import git
import shutil
import logging
import tempfile

from config import settings
from utils.branch_naming import format_branch_name

logger = logging.getLogger(__name__)


class GitService:
    def _auth_url(self, repo_url: str) -> str:
        """Inject GITHUB_TOKEN into HTTPS URL for authenticated push."""
        token = settings.GITHUB_TOKEN
        if token and "https://" in repo_url:
            clean = repo_url.replace("https://", "")
            return f"https://{token}@{clean}"
        return repo_url

    def clone(self, repo_url: str, job_id: str) -> str:
        base_dir = tempfile.gettempdir()
        target_path = os.path.join(base_dir, "fixtora_hackathon", job_id)

        if os.path.exists(target_path):
            self.cleanup(target_path)

        auth_url = self._auth_url(repo_url)
        # Log original URL (never the token)
        logger.info(f"Git: Cloning {repo_url}")
        git.Repo.clone_from(auth_url, target_path)
        return target_path

    def setup_branch(self, repo_path: str, team: str, leader: str) -> str:
        branch_name = format_branch_name(team, leader)
        repo = git.Repo(repo_path)
        logger.info(f"Git: Creating branch {branch_name}")
        repo.git.checkout("-B", branch_name)
        return branch_name

    def commit_fix(self, repo_path: str, message: str):
        repo = git.Repo(repo_path)
        # Only stage files that are already tracked and modified — never add new artifacts
        repo.git.add(u=True)
        full_msg = f"[AI-AGENT] {message}"
        if repo.is_dirty():
            repo.index.commit(full_msg)
            logger.info(f"Git: Committed -> {full_msg}")

    def push(self, repo_path: str, branch_name: str):
        repo = git.Repo(repo_path)
        origin = repo.remote(name='origin')
        logger.info(f"Git: Pushing {branch_name} to origin")
        try:
            origin.push(branch_name, force=True)
        except git.GitCommandError as e:
            if "403" in str(e):
                logger.error("Git: Push failed — 403 Forbidden. Check GITHUB_TOKEN permissions.")
                raise PermissionError(
                    "Push denied (403). Your GITHUB_TOKEN needs write access to this repo."
                )
            raise

    def cleanup(self, path: str):
        def on_rm_error(func, fpath, exc_info):
            import stat
            os.chmod(fpath, stat.S_IWRITE)
            func(fpath)
        if os.path.exists(path):
            shutil.rmtree(path, onerror=on_rm_error)
