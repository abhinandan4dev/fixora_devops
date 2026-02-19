"""
AI Layer 2: Error Parser
Extracts structured error data from test output logs.
Tries AI parsing first; falls back to deterministic regex on any failure.
"""

import re
import json
import logging
from typing import List, Dict

from config import settings
from services.ai_client import call_ai, sanitize_bug_type
from models.schemas import AIErrorResponse

logger = logging.getLogger(__name__)


class ErrorAgent:
    def __init__(self):
        self.api_key = settings.AI_ERROR_KEY

    def parse_logs(self, logs: str) -> List[Dict]:
        """
        Returns a list of error dicts: {file, line, type, message}.
        AI path is attempted first; deterministic regex is the fallback.
        """
        if self.api_key:
            ai_errors = self._ai_parse(logs)
            if ai_errors is not None:
                return ai_errors

        logger.info("ErrorAgent: Using deterministic regex parser.")
        return self._regex_parse(logs)

    # ── AI Layer ─────────────────────────────────────────────────────────────

    def _ai_parse(self, logs: str) -> List[Dict] | None:
        prompt = (
            "You are a CI/CD log parser. Analyze the following test output logs and "
            "return ONLY a JSON object in this exact format:\n"
            '{"errors": [{"file": "path/to/file.py", "line": 42, '
            '"type": "SYNTAX", "message": "description"}]}\n\n'
            "Allowed types: LINTING, SYNTAX, LOGIC, TYPE_ERROR, IMPORT, INDENTATION.\n"
            "If no errors exist, return: {\"errors\": []}\n\n"
            f"LOGS:\n{logs[:4000]}"  # Truncate to stay within token limits
        )
        raw = call_ai(self.api_key, prompt)
        if not raw:
            return None

        try:
            validated = AIErrorResponse.model_validate_json(raw)
            return [e.model_dump() for e in validated.errors]
        except Exception as e:
            logger.warning(f"ErrorAgent: AI response failed Pydantic validation: {e}. Falling back.")
            return None

    # ── Deterministic Regex Fallback ─────────────────────────────────────────

    def _regex_parse(self, logs: str) -> List[Dict]:
        errors = []

        # Python / Pytest tracebacks
        py_pattern = re.finditer(
            r'File "([^"]+)", line (\d+)(?:, in .*)?\n(?:.*)\n(?:.*)'
            r'((?:SyntaxError|IndentationError|ImportError|ModuleNotFoundError|TypeError|NameError): .*)',
            logs
        )
        for m in py_pattern:
            errors.append({
                "file": m.group(1),
                "line": int(m.group(2)),
                "type": self._classify_error(m.group(3)),
                "message": m.group(3).strip(),
            })

        # JS / TS compilation errors
        js_pattern = re.finditer(r'([./\w-]+\.(?:js|ts|jsx|tsx)):(\d+):\d+', logs)
        for m in js_pattern:
            errors.append({
                "file": m.group(1),
                "line": int(m.group(2)),
                "type": "SYNTAX",
                "message": "JS/TS syntax or compilation error detected",
            })

        # Assertion errors (Logic) — extract full pytest failure details
        if "AssertionError" in logs or "assert" in logs:
            # Match each FAILED block: file:line: AssertionError
            for m in re.finditer(r'([^:\n\s]+\.py):(\d+): Assertion\w*Error', logs):
                test_file = m.group(1).strip()
                test_line = int(m.group(2))

                # Extract the assertion details from the surrounding context
                # e.g., "assert -1 == 5" and "where -1 = add(2, 3)"
                block_start = max(0, logs.rfind("___", 0, m.start()))
                block = logs[block_start:m.end() + 200]

                # Get the assertion line
                assert_match = re.search(r'assert (.+)', block)
                assert_detail = assert_match.group(0).strip() if assert_match else ""

                # Get the 'where' line — tells us which source function failed
                where_match = re.search(r'\+\s+where .+ = (\w+)\(', block)
                source_func = where_match.group(1) if where_match else ""

                message = f"Assertion failed: {assert_detail}"
                if source_func:
                    message += f" (source function: {source_func})"

                errors.append({
                    "file": test_file,
                    "line": test_line,
                    "type": "LOGIC",
                    "message": message,
                })

        # Gradle / JUnit failures
        if "BUILD FAILURE" in logs or "FAILED" in logs:
            for m in re.finditer(r'> Task :(\S+) FAILED', logs):
                errors.append({
                    "file": m.group(1),
                    "line": 0,
                    "type": "LOGIC",
                    "message": f"Gradle task failed: :{m.group(1)}",
                })

        return errors

    def _classify_error(self, msg: str) -> str:
        msg = msg.upper()
        if "SYNTAX" in msg:        return "SYNTAX"
        if "INDENTATION" in msg:   return "INDENTATION"
        if "IMPORT" in msg or "MODULE" in msg: return "IMPORT"
        if "TYPE" in msg or "NAME" in msg:     return "TYPE_ERROR"
        return "LOGIC"
