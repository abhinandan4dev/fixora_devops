import re

class BranchManagerAgent:
    def generate_branch_name(self, team_name: str, leader_name: str) -> str:
        # Format: TEAM_NAME_LEADER_NAME_AI_Fix
        # Rules: ALL UPPERCASE, Replace spaces with underscores, End with _AI_Fix
        
        team = team_name.upper().replace(" ", "_")
        leader = leader_name.upper().replace(" ", "_")
        
        # Remove special characters (keep only A-Z, 0-9, _)
        team = re.sub(r'[^A-Z0-9_]', '', team)
        leader = re.sub(r'[^A-Z0-9_]', '', leader)
        
        branch_name = f"{team}_{leader}_AI_Fix"
        return branch_name

    def create_branch(self, repo_path: str, branch_name: str):
        import git
        repo = git.Repo(repo_path)
        new_branch = repo.create_head(branch_name)
        new_branch.checkout()
        
        # Push the new branch to remote immediately
        try:
            origin = repo.remote(name='origin')
            origin.push(new_branch)
            print(f"Pushed new branch {branch_name} to remote")
        except Exception as e:
            print(f"Failed to push initial branch: {e}")
