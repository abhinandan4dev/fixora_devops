class FixGenerationAgent:
    def generate_fix(self, error: dict) -> str:
        # Format: BUG_TYPE error in file line X → Fix: ...
        
        bug_type = error["type"]
        file_path = error["file"]
        line_num = error["line"]
        
        fix_suggestion = "check the code"
        
        if bug_type == "LINTING":
            fix_suggestion = "remove the import statement"
        elif bug_type == "SYNTAX":
            fix_suggestion = "add the colon at the correct position"
        elif bug_type == "TYPE_ERROR":
            fix_suggestion = "cast the variable to the correct type"
        elif bug_type == "INDENTATION":
            fix_suggestion = "fix the indentation level"
        elif bug_type == "IMPORT":
            fix_suggestion = "install the missing module"
        elif bug_type == "LOGIC":
            fix_suggestion = "update the assertion logic"
            
        return f"{bug_type} error in {file_path} line {line_num} → Fix: {fix_suggestion}"
