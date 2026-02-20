"""
Git Service — clone, branch, commit, push, cleanup.
Injects GITHUB_TOKEN into the clone URL so pushes authenticate automatically.
"""

import os
import git
import shutil
import logging
import tempfile
import stat
import time

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
        
        # Cloud environments don't have global git configs, we must set them per-repo
        with repo.config_writer() as git_config:
            git_config.set_value('user', 'email', 'bot@fixora.ai')
            git_config.set_value('user', 'name', f'Fixora Agent ({leader})')
            
        logger.info(f"Git: Creating branch {branch_name}")
        repo.git.checkout("-B", branch_name)
        return branch_name

    def commit_fix(self, repo_path: str, message: str):
        repo = git.Repo(repo_path)
        # Stage all changes (modified and untracked fixes)
        repo.git.add(A=True)
        full_msg = message if message.startswith("[AI-AGENT]") else f"[AI-AGENT] {message}"
        
        # Check if there are actually changes staged to commit
        if repo.is_dirty(untracked_files=True) or len(repo.index.diff("HEAD")) > 0:
            repo.index.commit(full_msg)
            logger.info(f"Git: Committed -> {full_msg}")
        else:
            logger.warning("Git: No changes detected to commit.")

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
        if not os.path.exists(path):
            return
        logger.info(f"Git: Cleaning up {path}")
        
        # Close any git handles to prevent locking on Windows
        try:
            repo = git.Repo(path)
            repo.close()
        except:
            pass

        def on_rm_error(func, fpath, exc_info):
            try:
                os.chmod(fpath, stat.S_IWRITE)
                func(fpath)
            except:
                pass

        # Robust retry for Windows file locks
        for i in range(3):
            try:
                shutil.rmtree(path, onerror=on_rm_error)
                if not os.path.exists(path):
                    return
            except:
                time.sleep(0.5)

    def get_owner_email(self, repo_path: str) -> str | None:
        """Attempts to get the email of the last commit author."""
        try:
            repo = git.Repo(repo_path)
            last_commit = repo.head.commit
            return last_commit.author.email
        except Exception as e:
            logger.error(f"Failed to get owner email: {e}")
            return None
