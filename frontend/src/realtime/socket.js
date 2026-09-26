/**
 * Realtime WebSocket client for interview rooms.
 *
 * Enforces strict single-socket lifecycle per tab, clean cleanup for React StrictMode,
 * exponential backoff reconnection for unexpected disconnects, and zero reconnects
 * on deliberate close or terminal server rejects (4403, 4404).
 */

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const RECONNECT_DELAYS = [1000, 2000, 5000];

function getWsUrl(roomCode, participantId) {
  const httpUrl = VITE_API_URL.replace(/\/$/, '');
  const wsBase = httpUrl.replace(/^http/, 'ws');
  return `${wsBase}/ws/sessions/${roomCode.toUpperCase()}?participant_id=${participantId}`;
}

let activeSocketInstance = null;

export function connectRoomSocket({
  roomCode,
  participantId,
  onMessage,
  onStatusChange,
}) {
  // If an active connection exists, tear it down cleanly first
  if (activeSocketInstance) {
    activeSocketInstance.disconnect();
    activeSocketInstance = null;
  }

  let ws = null;
  let reconnectTimer = null;
  let reconnectAttempt = 0;
  let isDeliberateClose = false;

  function setStatus(status) {
    if (onStatusChange) {
      onStatusChange(status);
    }
  }

  function connect() {
    if (isDeliberateClose) return;

    const url = getWsUrl(roomCode, participantId);
    setStatus(reconnectAttempt === 0 ? 'connecting' : 'reconnecting');

    try {
      ws = new WebSocket(url);
    } catch (err) {
      console.error('Failed to construct WebSocket:', err);
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      if (isDeliberateClose) {
        ws.close();
        return;
      }
      reconnectAttempt = 0;
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) {
          onMessage(data);
        }
      } catch (err) {
        console.warn('Failed to parse WebSocket message:', err, event.data);
      }
    };

    ws.onerror = (err) => {
      console.warn('WebSocket error observed:', err);
    };

    ws.onclose = (event) => {
      // 4403 = participant does not belong to room; 4404 = room not found
      const isTerminalRejection = event.code === 4403 || event.code === 4404;

      if (isDeliberateClose || isTerminalRejection) {
        setStatus('disconnected');
        return;
      }

      // Unexpected disconnect -> auto-reconnect with backoff
      scheduleReconnect();
    };
  }

  function scheduleReconnect() {
    if (isDeliberateClose) return;

    setStatus('reconnecting');
    const delay =
      reconnectAttempt < RECONNECT_DELAYS.length
        ? RECONNECT_DELAYS[reconnectAttempt]
        : 5000;
    reconnectAttempt += 1;

    reconnectTimer = setTimeout(() => {
      connect();
    }, delay);
  }

  function send(type, payload = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
      return true;
    }
    console.warn(`Cannot send message "${type}", WebSocket is not open.`);
    return false;
  }

  function disconnect() {
    isDeliberateClose = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      // Prevent further close event handling
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      try {
        ws.close();
      } catch {
        // Ignored
      }
      ws = null;
    }
    setStatus('disconnected');
    if (activeSocketInstance === instance) {
      activeSocketInstance = null;
    }
  }

  const instance = {
    send,
    disconnect,
  };

  activeSocketInstance = instance;
  connect();

  return instance;
}
