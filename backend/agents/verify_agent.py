"""
AI Layer 4: Verification Agent
Decides whether the iteration loop should continue.
Tries AI judgment first; falls back to deterministic rule.
"""

import json
import logging
from typing import Dict

from config import settings
from services.ai_client import call_ai
from models.schemas import AIVerifyDecision

logger = logging.getLogger(__name__)


class VerifyAgent:
    def __init__(self):
        self.api_key = settings.AI_VERIFY_KEY

    def should_continue(self, failures: int, iteration: int, retry_limit: int) -> bool:
        """
        Returns True if the loop should keep iterating, False to stop.
        """
        # Hard limits — always enforced regardless of AI
        if iteration >= retry_limit:
            logger.info("VerifyAgent: Max retries reached. Stopping.")
            return False
        if failures == 0:
            logger.info("VerifyAgent: All tests passed. Stopping.")
            return False

        # Ask AI for contextual judgment
        if self.api_key:
            ai_decision = self._ai_decide(failures, iteration, retry_limit)
            if ai_decision is not None:
                return ai_decision

        # Deterministic fallback: continue while there are failures and budget remains
        logger.info(f"VerifyAgent: {failures} failure(s) remain, iteration {iteration}/{retry_limit}. Continuing.")
        return True

    # ── AI Layer ─────────────────────────────────────────────────────────────

    def _ai_decide(self, failures: int, iteration: int, retry_limit: int) -> bool | None:
        prompt = (
            "You are a CI/CD repair verification agent. Given the current state, "
            "decide whether to continue the repair loop.\n"
            "Return ONLY a JSON object:\n"
            '{"should_continue": true, "reason": "brief explanation"}\n\n'
            f"State: {json.dumps({'failures_remaining': failures, 'current_iteration': iteration, 'retry_limit': retry_limit})}"
        )
        raw = call_ai(self.api_key, prompt)
        if not raw:
            return None

        try:
            decision = AIVerifyDecision.model_validate_json(raw)
            logger.info(f"VerifyAgent (AI): should_continue={decision.should_continue} — {decision.reason}")
            return decision.should_continue
        except Exception as e:
            logger.warning(f"VerifyAgent: AI response failed validation: {e}. Using deterministic rule.")
            return None
