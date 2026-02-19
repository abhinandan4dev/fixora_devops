from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
import re

ALLOWED_BUG_TYPES = {"LINTING", "SYNTAX", "LOGIC", "TYPE_ERROR", "IMPORT", "INDENTATION"}

# ── Request / Response Schemas ────────────────────────────────────────────────

class RunAgentRequest(BaseModel):
    repo_url: str = Field(..., description="The GitHub repository URL to clone")
    team_name: str = Field(..., description="Team name for branch generation")
    leader_name: str = Field(..., description="Leader name for branch generation")
    retry_limit: Optional[int] = Field(5, description="Maximum number of repair iterations")

class FixResult(BaseModel):
    file: str
    bug_type: str
    line_number: int
    commit_message: str
    status: str

class TimelineEvent(BaseModel):
    iteration: int
    status: str
    timestamp: str

class RunStatusResponse(BaseModel):
    job_id: str
    repo_url: str
    branch_name: str
    failures_detected: int
    fixes_applied: int
    iterations_used: int
    retry_limit: int
    total_time_seconds: float
    status: str
    score: float = 0.0
    fixes: List[FixResult]
    timeline: List[TimelineEvent]
    raw_logs: str

# ── AI Output Validation Schemas ─────────────────────────────────────────────

class ErrorDetail(BaseModel):
    """Used both internally and to validate AI Layer 2 (error_agent) output."""
    file: str
    line: int
    type: str
    message: str
    context: Optional[str] = ""

    @field_validator("type", mode="before")
    @classmethod
    def enforce_allowed_type(cls, v):
        normalized = str(v).strip().upper()
        if normalized not in ALLOWED_BUG_TYPES:
            return "LOGIC"  # Safe fallback; never crash
        return normalized


class AIErrorResponse(BaseModel):
    """Expected JSON shape from AI Layer 2 (error parser)."""
    errors: List[ErrorDetail]


class AIFixInstruction(BaseModel):
    """Expected JSON shape from AI Layer 3 (fix generator)."""
    file: str
    line: int
    bug_type: str
    fix_description: str

    @field_validator("bug_type", mode="before")
    @classmethod
    def enforce_allowed_type(cls, v):
        normalized = str(v).strip().upper()
        if normalized not in ALLOWED_BUG_TYPES:
            return "LOGIC"
        return normalized


class AIVerifyDecision(BaseModel):
    """Expected JSON shape from AI Layer 4 (verify agent)."""
    should_continue: bool
    reason: str

