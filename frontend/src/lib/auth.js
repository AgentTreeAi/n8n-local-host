/**
 * Client-side app-password gate.
 *
 * The password is the shared secret that the serverless proxy (/api/proxy.js)
 * checks via the x-app-auth header before it will ever attach the real n8n API
 * key. We keep it only in sessionStorage (cleared when the tab closes) and send
 * it on every API request. The n8n API key itself NEVER reaches the browser.
 */

const KEY = 'n8n_app_auth';

export function getAppPassword() {
  try {
    return sessionStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}

export function setAppPassword(value) {
  try {
    sessionStorage.setItem(KEY, value);
  } catch {
    /* ignore */
  }
}

export function clearAppPassword() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function isAuthenticated() {
  return getAppPassword().length > 0;
}

/** Fired when the proxy rejects our password (401) so the UI can re-prompt. */
export function notifyAuthExpired() {
  clearAppPassword();
  window.dispatchEvent(new CustomEvent('app-auth-expired'));
}
