const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Small fetch wrapper for the RAC backend API.
 * Reads VITE_API_URL and returns JSON or throws a clear error.
 */
export async function apiRequest(endpoint, options = {}) {
  const normalizedBase = API_URL.replace(/\/$/, '');
  const normalizedPath = endpoint.replace(/^\//, '');
  const url = `${normalizedBase}/${normalizedPath}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let message = `API request failed with status ${response.status} (${response.statusText})`;
      try {
        const errorData = await response.json();
        if (errorData?.detail) {
          message = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else if (errorData?.message) {
          message = errorData.message;
        }
      } catch {
        // Non-JSON response body
      }
      throw new Error(message);
    }

    return await response.json();
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Network or API error: ${String(err)}`);
  }
}

/**
 * Create a new interview session.
 */
export async function createSession(mode = 'live') {
  return await apiRequest('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ mode }),
  });
}

/**
 * Join an existing interview session.
 */
export async function joinSession(roomCode, { display_name, seat_role, specialisation = null }) {
  const body = {
    display_name,
    seat_role,
    ...(specialisation ? { specialisation } : {}),
  };
  return await apiRequest(`/api/sessions/${roomCode.toUpperCase()}/join`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Get interview session details and participant list.
 */
export async function getSession(roomCode) {
  return await apiRequest(`/api/sessions/${roomCode.toUpperCase()}`);
}
