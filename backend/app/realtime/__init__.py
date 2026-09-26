"""
Realtime package — export the global RoomManager singleton.
"""

from app.realtime.manager import RoomManager

manager = RoomManager()

__all__ = ["RoomManager", "manager"]
