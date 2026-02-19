import re

class ErrorParserAgent:
    def parse(self, logs: str) -> list:
        errors = []
        
        # Split logs into lines
        lines = logs.split('\n')
        
        for i, line in enumerate(lines):
            # Rule-based classification
            bug_type = None
            if "Unused import" in line:
                bug_type = "LINTING"
            elif "SyntaxError" in line:
                bug_type = "SYNTAX"
            elif "TypeError" in line:
                bug_type = "TYPE_ERROR"
            elif "IndentationError" in line:
                bug_type = "INDENTATION"
            elif "ModuleNotFoundError" in line:
                bug_type = "IMPORT"
            elif "AssertionError" in line:
                bug_type = "LOGIC"
            
            if bug_type:
                # Extract file and line number
                # Common format: File "src/utils.py", line 15
                match = re.search(r'File "(.*?)", line (\d+)', line)
                if match:
                    file_path = match.group(1)
                    line_num = int(match.group(2))
                    errors.append({
                        "type": bug_type,
                        "file": file_path,
                        "line": line_num,
                        "raw": line
                    })
                else:
                    # Try other formats or fallback
                    # Pytest often shows: src/utils.py:15: AssertionError
                    match_alt = re.search(r'(.*?):(\d+):', line)
                    if match_alt:
                        file_path = match_alt.group(1)
                        line_num = int(match_alt.group(2))
                        errors.append({
                            "type": bug_type,
                            "file": file_path,
                            "line": line_num,
                            "raw": line
                        })

        return errors
