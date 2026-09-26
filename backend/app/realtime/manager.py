"""
In-memory WebSocket connection manager for interview rooms.

Tracks active connections per room and participant, supporting:
- Direct sending to a specific participant
- Targeted sending to roles (e.g. board = chairman + expert)
- Broadcasting to all or with exclusions
- Safe reconnect handling (only disconnect matching websocket object)
- Resilient async sends with warning logs on closed connections
"""

import logging
from typing import Any, Dict, Optional, Set, Tuple
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class RoomManager:
    def __init__(self) -> None:
        # room_code -> {participant_id: (WebSocket, seat_role)}
        self._rooms: Dict[str, Dict[int, Tuple[WebSocket, str]]] = {}

    def connect(
        self,
        room_code: str,
        participant_id: int,
        websocket: WebSocket,
        seat_role: str,
    ) -> Optional[WebSocket]:
        """
        Register a participant connection.
        If a previous connection exists for this participant in this room,
        return the old WebSocket so the caller can cleanly close it.
        """
        code = room_code.upper()
        if code not in self._rooms:
            self._rooms[code] = {}

        old_entry = self._rooms[code].get(participant_id)
        old_ws = old_entry[0] if old_entry else None

        self._rooms[code][participant_id] = (websocket, seat_role)
        return old_ws

    def disconnect(
        self,
        room_code: str,
        participant_id: int,
        websocket: WebSocket,
    ) -> bool:
        """
        Unregister a participant connection ONLY if the stored websocket
        matches the closing websocket object (reconnect safety).
        Returns True if the connection was removed, False otherwise.
        """
        code = room_code.upper()
        room = self._rooms.get(code)
        if not room:
            return False

        entry = room.get(participant_id)
        if entry is not None and entry[0] is websocket:
            del room[participant_id]
            if not room:
                del self._rooms[code]
            return True

        return False

    def online_ids(self, room_code: str) -> Set[int]:
        """Return the set of participant IDs currently connected in room_code."""
        code = room_code.upper()
        room = self._rooms.get(code)
        if not room:
            return set()
        return set(room.keys())

    async def _send_safe(
        self,
        room_code: str,
        participant_id: int,
        websocket: WebSocket,
        message: Dict[str, Any],
    ) -> bool:
        try:
            await websocket.send_json(message)
            return True
        except Exception as exc:
            logger.warning(
                "Failed to send to participant %s in room %s: %s. Removing connection.",
                participant_id,
                room_code,
                exc,
            )
            self.disconnect(room_code, participant_id, websocket)
            return False

    async def send_to(
        self,
        participant_id: int,
        message: Dict[str, Any],
        room_code: Optional[str] = None,
    ) -> bool:
        """Send message to a specific participant_id. Searches all rooms if room_code not given."""
        if room_code:
            code = room_code.upper()
            room = self._rooms.get(code)
            if room and participant_id in room:
                ws, _ = room[participant_id]
                return await self._send_safe(code, participant_id, ws, message)
            return False

        # Search across rooms if room_code is omitted
        for code, room in list(self._rooms.items()):
            if participant_id in room:
                ws, _ = room[participant_id]
                return await self._send_safe(code, participant_id, ws, message)
        return False

    async def send_to_roles(
        self,
        room_code: str,
        roles: Set[str] | list[str],
        message: Dict[str, Any],
    ) -> None:
        """Send message to all participants in room_code matching any of the given roles."""
        code = room_code.upper()
        room = self._rooms.get(code)
        if not room:
            return

        target_roles = set(roles)
        items = list(room.items())
        for pid, (ws, seat_role) in items:
            if seat_role in target_roles:
                await self._send_safe(code, pid, ws, message)

    async def broadcast(
        self,
        room_code: str,
        message: Dict[str, Any],
        exclude: Optional[int] = None,
    ) -> None:
        """Broadcast message to all connected participants in room_code, optionally excluding one."""
        code = room_code.upper()
        room = self._rooms.get(code)
        if not room:
            return

        items = list(room.items())
        for pid, (ws, _) in items:
            if exclude is not None and pid == exclude:
                continue
            await self._send_safe(code, pid, ws, message)
