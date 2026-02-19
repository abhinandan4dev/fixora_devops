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
