import re
import git
from utils import get_logger
from config import settings

logger = get_logger(__name__)

class BranchManagerAgent:
    def generate_branch_name(self, team_name: str, leader_name: str) -> str:
        # Format: AI_AGENT_TEAM_NAME_LEADER_NAME_AI_Fix
        # Note: We use AI_AGENT_ instead of [AI_AGENT] because Git forbids '[' and ']' in branch names.
        
        team = team_name.upper().replace(" ", "_")
        leader = leader_name.upper().replace(" ", "_")
        
        # Remove special characters from team and leader names (keep only A-Z, 0-9, _)
        team = re.sub(r'[^A-Z0-9_]', '', team)
        leader = re.sub(r'[^A-Z0-9_]', '', leader)
        
        branch_name = f"AI_AGENT_{team}_{leader}_AI_Fix"
        logger.info(f"Generated branch name: {branch_name}")
        return branch_name

    def create_and_push_branch(self, repo_path: str, branch_name: str):
        repo = git.Repo(repo_path)
        logger.info(f"Creating and checking out branch: {branch_name}")
        
        try:
            # Use -B to create or reset the branch, ensuring it exists and we are on it.
            # This is more robust than create_head + checkout.
            repo.git.checkout('-B', branch_name)
            logger.info(f"Successfully checked out branch: {branch_name}")
            
            # Push to remote
            origin = repo.remote(name='origin')
            logger.info(f"Pushing branch {branch_name} to remote...")
            origin.push(branch_name)
            logger.info(f"Successfully pushed branch {branch_name} to remote")
            
        except git.GitCommandError as e:
            logger.error(f"Git operation failed for branch {branch_name}: {e}")
            raise e
        except Exception as e:
            logger.error(f"Unexpected error during branch management: {e}")
            raise e
