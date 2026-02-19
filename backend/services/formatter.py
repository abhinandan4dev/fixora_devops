from typing import Dict

def format_ps3_output(bug_type: str, file_path: str, line_number: int, fix_desc: str) -> str:
    """
    Strict PS3 output formatting compliance.
    Example: "LINTING error in src/utils.py line 15 → Fix: remove the import statement"
    """
    # Unicode arrow: \u2192
    return f"{bug_type} error in {file_path} line {line_number} \u2192 Fix: {fix_desc}"
