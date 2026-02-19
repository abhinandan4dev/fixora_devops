def calculate_file_diff_percentage(original: str, modified: str) -> float:
    """
    Computes the percentage of change between two file versions.
    Used for the 30% diff constraint.
    """
    import difflib
    
    orig_lines = original.splitlines()
    mod_lines = modified.splitlines()
    
    diff = list(difflib.unified_diff(orig_lines, mod_lines))
    # Simple heuristic: number of changed lines relative to total
    changed_lines = len([l for l in diff if l.startswith('+') or l.startswith('-')])
    
    if len(orig_lines) == 0: return 0.0
    return (changed_lines / len(orig_lines)) * 100
