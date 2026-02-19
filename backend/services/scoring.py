def calculate_repair_score(
    failures_found: int, 
    fixes_applied: int, 
    iterations: int,
    total_time_seconds: float = 0.0,
    total_commits: int = 0,
) -> float:
    """
    PS3 Scoring Logic:
    - Base = 100
    - +10 if total time < 5 minutes
    - -2 per commit over 20
    """
    score = 100.0
    
    # Time bonus
    if total_time_seconds > 0 and total_time_seconds < 300:
        score += 10.0
    
    # Commit penalty
    if total_commits > 20:
        score -= (total_commits - 20) * 2.0
    
    return max(0.0, min(110.0, score))
