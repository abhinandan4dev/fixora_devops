import re

def format_branch_name(team_name: str, leader_name: str) -> str:
    """
    Requirements: TEAM_NAME_LEADER_NAME_AI_Fix (UPPERCASE, underscores only)
    """
    team = team_name.upper().strip()
    leader = leader_name.upper().strip()
    
    # Replace anything not A-Z or 0-9 with underscores
    team = re.sub(r'[^A-Z0-9]', '_', team)
    leader = re.sub(r'[^A-Z0-9]', '_', leader)
    
    # Clean up double underscores
    team = re.sub(r'_+', '_', team).strip('_')
    leader = re.sub(r'_+', '_', leader).strip('_')
    
    return f"{team}_{leader}_AI_Fix"
