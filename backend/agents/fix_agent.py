"""
AI Layer 3: Fix Agent
PRIMARY: Sends broken code to AI and receives a fully fixed version back.
         The real fixed code is written to the file — not just a comment.

FALLBACK (no API key): Writes a rich comment block so a human/AI dev can fix it.

Safety: 30% diff limit, bug-type allowlist enforced.
"""

import re
import json
import textwrap
import logging
from typing import Dict, Optional, Tuple

from config import settings
from services.ai_client import call_ai, sanitize_bug_type

logger = logging.getLogger(__name__)

MAX_DIFF_PERCENT = 0.30
CONTEXT_LINES    = 5
COMMENT_WIDTH    = 66


class FixAgent:
    def __init__(self):
        self.api_key = settings.AI_FIX_KEY

    # ─────────────────────────────────────────────────────────────────────────
    # Public interface called by iteration_controller
    # ─────────────────────────────────────────────────────────────────────────

    def apply_fix(
        self,
        error: Dict,
        file_content: str,
        test_logs: str,
    ) -> Tuple[str, str, bool]:
        """
        Attempts to fix the broken file.

        Returns
        -------
        (new_content, commit_msg, ai_fixed)
        new_content : the content to write back to the file
        commit_msg  : short string for the git commit message
        ai_fixed    : True if AI rewrote the code, False if only a comment was added
        """
        bug_type = sanitize_bug_type(error.get("type", "LOGIC"))
        file     = error.get("file", "unknown")
        line     = error.get("line", 0)

        if self.api_key:
            fixed_code, desc = self._ai_rewrite(error, file_content, test_logs)
            if fixed_code and self.check_diff_limit(file_content, fixed_code):
                commit_msg = f"{bug_type} error in {file} line {line} → Fixed: {desc}"
                return fixed_code, commit_msg, True
            elif fixed_code:
                logger.warning("FixAgent: AI fix exceeded 30% diff limit — falling back to comment.")

        # Fallback: append a rich comment so a human/AI dev can apply it later
        comment   = self._build_comment_block(error, file_content, test_logs)
        new_content = file_content + comment
        short_desc  = self._deterministic_desc_short(error)
        commit_msg  = f"{bug_type} error in {file} line {line} → Annotated: {short_desc}"
        return new_content, commit_msg, False

    def check_diff_limit(self, original: str, modified: str) -> bool:
        """Safety gate: reject rewrites that change too much of the file."""
        orig_len = len(original)
        if orig_len == 0:
            return True

        # Small files get a more generous limit since even 1-line fixes are big %
        limit = 0.80 if orig_len < 500 else MAX_DIFF_PERCENT
        ratio = abs(len(modified) - orig_len) / orig_len

        if ratio > limit:
            logger.warning(
                f"FixAgent: Rejected — diff ratio {ratio:.1%} exceeds {limit:.0%} (file size: {orig_len} bytes)."
            )
            return False
        return True

    # ─────────────────────────────────────────────────────────────────────────
    # AI Rewrite (primary path)
    # ─────────────────────────────────────────────────────────────────────────

    def _ai_rewrite(
        self, error: Dict, file_content: str, test_logs: str
    ) -> Tuple[Optional[str], str]:
        """
        Sends the full broken file and error context to the AI.
        Expects the AI to return only the corrected file content — no explanations.
        """
        bug_type = error.get("type", "LOGIC")
        line_num = error.get("line", 0)
        message  = error.get("message", "")
        context  = self._extract_context(file_content, line_num)

        prompt = (
            "You are an autonomous code repair agent.\n"
            "A CI/CD test run failed. Your job is to fix ONLY the broken part.\n\n"
            "Rules (MUST follow):\n"
            "- Return ONLY the complete corrected file content. No markdown, no explanations.\n"
            "- Do NOT add import statements that did not exist before.\n"
            "- Do NOT rename functions, classes, or variables.\n"
            "- Do NOT rewrite more than 30% of the file.\n"
            "- Fix exactly the reported error and nothing else.\n"
            "- Keep every other line identical to the original.\n\n"
            f"BUG TYPE : {bug_type}\n"
            f"FILE     : {error.get('file', 'unknown')}\n"
            f"LINE     : {line_num}\n"
            f"ERROR    : {message}\n\n"
            f"CODE CONTEXT (around line {line_num}):\n{context}\n\n"
            f"TEST LOG (last 800 chars):\n{test_logs[-800:]}\n\n"
            f"FULL FILE CONTENT:\n{file_content}"
        )

        raw = call_ai(self.api_key, prompt)
        if not raw:
            return None, ""

        # Strip accidental markdown code fences the AI might wrap output in
        fixed_code = self._strip_markdown_fences(raw)

        # Generate a short description for the commit message
        desc_prompt = (
            f"In one sentence, describe what code change was made to fix this error: "
            f"{bug_type} at line {line_num} — {message}"
        )
        desc_raw = call_ai(self.api_key, desc_prompt) or f"Fix {bug_type} at line {line_num}"
        desc = desc_raw.strip().split("\n")[0][:120]  # Keep commit msg short

        return fixed_code, desc

    def _strip_markdown_fences(self, text: str) -> str:
        """Remove ```python ... ``` or ``` ... ``` wrappers if AI added them."""
        text = text.strip()
        # Match opening fence (with optional language tag) and closing fence
        pattern = r'^```[a-zA-Z]*\n(.*?)\n?```$'
        match = re.match(pattern, text, re.DOTALL)
        if match:
            return match.group(1)
        return text

    # ─────────────────────────────────────────────────────────────────────────
    # Fallback: Rich Comment Block
    # ─────────────────────────────────────────────────────────────────────────

    def _build_comment_block(
        self, error: Dict, file_content: str, test_logs: str
    ) -> str:
        """Fallback: writes a detailed annotation for a human/AI dev to act on."""
        bug_type    = sanitize_bug_type(error.get("type", "LOGIC"))
        file_path   = error.get("file", "unknown")
        line_num    = error.get("line", 0)
        message     = error.get("message", "—")
        instruction = self._deterministic_desc_long(error)
        context     = self._extract_context(file_content, line_num)

        wrapped_inst = "\n".join(
            f"#   {l}" for l in textwrap.wrap(instruction, width=60)
        )
        log_tail = "\n".join(
            f"#   {l}" for l in test_logs.strip().splitlines()[-5:] if l.strip()
        ) or "#   (no log output)"

        border = "#" + "=" * COMMENT_WIDTH
        dash   = "# " + "─" * (COMMENT_WIDTH - 2)

        return (
            f"\n\n"
            f"{border}\n"
            f"# [AI-AGENT FIX REQUIRED — NO API KEY / AI FIX FAILED]\n"
            f"{dash}\n"
            f"#   Bug Type   : {bug_type}\n"
            f"#   File       : {file_path}\n"
            f"#   Line       : {line_num}\n"
            f"#   Error      : {message}\n"
            f"{dash}\n"
            f"#   INSTRUCTION:\n"
            f"{wrapped_inst}\n"
            f"{dash}\n"
            f"#   CODE CONTEXT:\n"
            f"{context}\n"
            f"{dash}\n"
            f"#   TEST OUTPUT (tail):\n"
            f"{log_tail}\n"
            f"{border}\n"
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Helpers
    # ─────────────────────────────────────────────────────────────────────────

    def _extract_context(self, file_content: str, line_num: int) -> str:
        if not file_content or not line_num:
            return "#   (no source context available)"
        lines = file_content.splitlines()
        total = len(lines)
        start = max(0, line_num - 1 - CONTEXT_LINES)
        end   = min(total, line_num + CONTEXT_LINES)
        result = []
        for i, ln in enumerate(lines[start:end], start=start + 1):
            marker = ">>>" if i == line_num else "   "
            result.append(f"#   {marker} {i:4d} | {ln}")
        return "\n".join(result)

    def _deterministic_desc_long(self, error: Dict) -> str:
        bug_type = sanitize_bug_type(error.get("type", "LOGIC"))
        line     = error.get("line", 0)
        message  = error.get("message", "")
        desc_map = {
            "SYNTAX":      f"Fix the syntax error at line {line}. Check for missing colons, parentheses, or quotes.",
            "INDENTATION": f"Correct the indentation at line {line}. Ensure consistent spaces (no mixed tabs/spaces).",
            "IMPORT":      f"Resolve the import failure at line {line}. Install the missing package or fix the module path.",
            "TYPE_ERROR":  f"Fix the type mismatch at line {line}. Check variable types, None returns, and undefined references.",
            "LINTING":     f"Clean up the code style issue at line {line}. Remove unused imports or fix whitespace.",
            "LOGIC":       f"Fix the logic error at line {line}. Review the failing assertion and ensure the correct output is produced.",
        }
        base = desc_map.get(bug_type, f"Resolve the issue at line {line}.")
        if message:
            base += f" Error: {message}"
        return base

    def _deterministic_desc_short(self, error: Dict) -> str:
        bug_type = sanitize_bug_type(error.get("type", "LOGIC"))
        desc_map = {
            "SYNTAX":      "fix the syntax error",
            "INDENTATION": "align indentation",
            "IMPORT":      "resolve missing import",
            "TYPE_ERROR":  "fix type mismatch",
            "LINTING":     "clean code style",
            "LOGIC":       "correct the logic",
        }
        return desc_map.get(bug_type, "resolve the issue")

    # Kept for backward compat (used in commit messages from old code)
    def generate_instruction(self, error: Dict) -> str:
        bug_type = sanitize_bug_type(error.get("type", "LOGIC"))
        file = error.get("file", "unknown")
        line = error.get("line", 0)
        desc = self._deterministic_desc_short(error)
        return f"{bug_type} error in {file} line {line} \u2192 Fix: {desc}"

    def build_comment_block(self, error, test_logs="", file_content=""):
        return self._build_comment_block(error, file_content, test_logs)
