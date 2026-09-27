import { getToken, clearAuth } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Fetch wrapper for the RAC backend API.
 * Reads VITE_API_URL, attaches Authorization header from sessionStorage if present,
 * and handles 401 unauthenticated redirects cleanly.
 */
export async function apiRequest(endpoint, options = {}) {
  const normalizedBase = API_URL.replace(/\/$/, '');
  const normalizedPath = endpoint.replace(/^\//, '');
  const url = `${normalizedBase}/${normalizedPath}`;

  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
        clearAuth();
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register') &&
          !window.location.pathname.startsWith('/dev/')
        ) {
          window.location.href = '/login';
        }
      }

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
 * Auth API calls
 */
export async function loginApi(email, password) {
  return await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerApi(email, password, full_name) {
  return await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, full_name }),
  });
}

export async function getMeApi() {
  return await apiRequest('/api/auth/me');
}

/**
 * Admin Summary
 */
export async function getAdminSummaryApi() {
  return await apiRequest('/api/admin/summary');
}

/**
 * Posts / Advertisements API
 */
export async function getPostsApi() {
  return await apiRequest('/api/posts');
}

export async function createPostApi(postData) {
  return await apiRequest('/api/posts', {
    method: 'POST',
    body: JSON.stringify(postData),
  });
}

export async function getPostApi(id) {
  return await apiRequest(`/api/posts/${id}`);
}

export async function updatePostApi(id, postData) {
  return await apiRequest(`/api/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(postData),
  });
}

export async function publishPostApi(id) {
  return await apiRequest(`/api/posts/${id}/publish`, {
    method: 'POST',
  });
}

export async function closePostApi(id) {
  return await apiRequest(`/api/posts/${id}/close`, {
    method: 'POST',
  });
}

/**
 * Open Posts API (Applicant)
 */
export async function getOpenPostsApi() {
  return await apiRequest('/api/open-posts');
}

export async function getOpenPostApi(id) {
  return await apiRequest(`/api/open-posts/${id}`);
}

/**
 * Interview session shortcuts
 */
export async function createSession(mode = 'live') {
  return await apiRequest('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ mode }),
  });
}

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

export async function getSession(roomCode) {
  return await apiRequest(`/api/sessions/${roomCode.toUpperCase()}`);
}
