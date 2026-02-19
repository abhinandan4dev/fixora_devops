import re
from typing import List, Dict
from utils import get_logger

logger = get_logger(__name__)

class ErrorParserAgent:
    def parse(self, logs: str) -> List[Dict]:
        errors = []
        
        # Regex patterns for Python (Pytest) and generic
        # Pattern: File path:line number: Error message
        # Example: test_main.py:15: AssertionError: ...
        
        # Very specific patterns to catch rigid types
        
        # 1. Python SyntaxError
        syntax_matches = re.finditer(r'File "([^"]+)", line (\d+)\n(.*SyntaxError:.*)', logs)
        for m in syntax_matches:
            errors.append({
                "file": m.group(1),
                "line": int(m.group(2)),
                "current_code": "", # Context reading would happen here in a full system
                "error_msg": m.group(3).strip(),
                "type": "SYNTAX"
            })

        # 2. Python IndentationError
        indent_matches = re.finditer(r'File "([^"]+)", line (\d+)\n(.*IndentationError:.*)', logs)
        for m in indent_matches:
            errors.append({
                "file": m.group(1),
                "line": int(m.group(2)),
                "current_code": "",
                "error_msg": m.group(3).strip(),
                "type": "INDENTATION"
            })
            
        # 3. Python ImportError / ModuleNotFoundError
        import_matches = re.finditer(r'File "([^"]+)", line (\d+)\n(.*(ImportError|ModuleNotFoundError):.*)', logs)
        for m in import_matches:
             errors.append({
                "file": m.group(1),
                "line": int(m.group(2)),
                "current_code": "",
                "error_msg": m.group(3).strip(),
                "type": "IMPORT"
            })

        # 4. Python TypeError or NameError (Grouping under TYPE_ERROR for simplicity or split)
        type_matches = re.finditer(r'File "([^"]+)", line (\d+)\n(.*(TypeError|NameError):.*)', logs)
        for m in type_matches:
             errors.append({
                "file": m.group(1),
                "line": int(m.group(2)),
                "current_code": "",
                "error_msg": m.group(3).strip(),
                "type": "TYPE_ERROR"
            })
            
        # 5. Pytest Assertions (LOGIC)
        # E       assert ...
        # backend/test_main.py:15: AssertionError
        # Parsing pytest output is tricky, looking for the failure line summary often at the bottom or the E block
        logic_matches = re.finditer(r'([^:\n]+):(\d+): AssertionError', logs)
        for m in logic_matches:
             errors.append({
                "file": m.group(1),
                "line": int(m.group(2)),
                "current_code": "",
                "error_msg": "AssertionError detected",
                "type": "LOGIC"
            })

        # 6. JavaScript / React / Node Errors
        # Patterns like: src/App.js:10:5
        # Or: Error: ... at ... (src/App.js:10:5)
        # Or: Failed to compile.
        # ./src/App.js
        # Syntax error: ... (10:5)
        
        # Pattern 6a: [path]:[line]:[col] - Generic for many JS tools
        js_generic_matches = re.finditer(r'([./\w-]+\.(?:js|ts|jsx|tsx)):(\d+):(\d+)', logs)
        for m in js_generic_matches:
             errors.append({
                "file": m.group(1),
                "line": int(m.group(2)),
                "current_code": "",
                "error_msg": "JS/TS Error detected",
                "type": "SYNTAX" # Generic fallback
            })

        # Pattern 6b: Reference/Type errors in Node/Jest
        node_error_matches = re.finditer(r'(ReferenceError|TypeError|SyntaxError): (.*)\n\s+at (?:.* \()?([./\w-]+\.(?:js|ts|jsx|tsx)):(\d+):(\d+)\)?', logs)
        for m in node_error_matches:
            errors.append({
                "file": m.group(3),
                "line": int(m.group(4)),
                "current_code": "",
                "error_msg": f"{m.group(1)}: {m.group(2)}",
                "type": m.group(1).split('Error')[0].upper() if 'Error' in m.group(1) else "SYNTAX"
            })

        # Remove duplicates
        unique_errors = []
        seen = set()
        for e in errors:
            key = f"{e['file']}:{e['line']}:{e['type']}"
            if key not in seen:
                seen.add(key)
                unique_errors.append(e)

        logger.info(f"Parsed {len(unique_errors)} errors")
        return unique_errors
