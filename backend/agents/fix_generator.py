from utils import get_logger

logger = get_logger(__name__)

class FixGenerationAgent:
    def generate_fix(self, error: dict) -> str:
        # BUGTYPE error in file_path line LINE_NUMBER → Fix: description
        
        bug_type = error["type"].upper()
        file_path = error["file"]
        line_num = error["line"]
        
        # Simple rule-based description generation
        description = "Resolve the issue."
        
        if bug_type == "LINTING":
             description = "Format code to comply with linting rules."
        elif bug_type == "SYNTAX":
             description = "Correct the syntax error."
        elif bug_type == "LOGIC":
             description = "Adjust logic to satisfy assertion."
        elif bug_type == "TYPE_ERROR":
             description = "Fix type mismatch or undefined variable."
        elif bug_type == "IMPORT":
             description = "Install missing module or fix import path."
        elif bug_type == "INDENTATION":
             description = "Correct indentation level."
             
        fix_string = f"{bug_type} error in {file_path} line {line_num} → Fix: {description}"
        return fix_string
