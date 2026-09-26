"""
WebSocket message schemas and validators.
Envelope structure: {"type": str, "payload": dict}
"""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


# Recognized incoming message types across the platform
VALID_CLIENT_MESSAGE_TYPES = {
    "ping",
    "lobby_ready",
    "admit_candidate",
    "set_phase",
    "ask_question",
    "request_clarification",
    "give_clarification",
    "submit_answer",
    "pass_question",
    "set_mark",
    "proctor_event",
    "end_interview",
    "rtc_signal",
    "video_frame",
}


class WsMessage(BaseModel):
    type: str
    payload: Dict[str, Any] = Field(default_factory=dict)


def make_ws_message(msg_type: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Helper to produce a standardized envelope dictionary."""
    return {
        "type": msg_type,
        "payload": payload if payload is not None else {},
    }


def make_error_message(message: str) -> Dict[str, Any]:
    """Helper to produce a standardized error message."""
    return make_ws_message("error", {"message": message})
