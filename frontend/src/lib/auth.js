/**
 * Auth state storage helper using sessionStorage so each browser tab
 * can act as a separate logged-in identity (Admin / Board / Applicant).
 */

const TOKEN_KEY = 'rac_auth_token';
const USER_KEY = 'rac_auth_user';

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function getUser() {
  try {
    const data = sessionStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function getUserRole() {
  const u = getUser();
  return u ? u.role : null;
}

export function setAuth(token, user) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save auth to sessionStorage:', err);
  }
}

export function clearAuth() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch (err) {
    console.error('Failed to clear auth from sessionStorage:', err);
  }
}

export function isAuthenticated() {
  return Boolean(getToken() && getUser());
}

export function getRoleDefaultRoute(role) {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'board':
      return '/board';
    case 'applicant':
      return '/applicant/advertisements';
    default:
      return '/login';
  }
}
