def calculate_repair_score(failures_found: int, fixes_applied: int, iterations: int) -> float:
    """
    Scoring logic:
    - Base score for finding failures
    - High weight for applied fixes
    - Negative weight for excessive iterations
    """
    if failures_found == 0:
        return 100.0 if iterations == 1 else 90.0
        
    base = 50.0
    fix_bonus = (fixes_applied / failures_found) * 50.0 if failures_found > 0 else 0
    iteration_penalty = (iterations - 1) * 5.0
    
    score = base + fix_bonus - iteration_penalty
    return max(0.0, min(100.0, score))
