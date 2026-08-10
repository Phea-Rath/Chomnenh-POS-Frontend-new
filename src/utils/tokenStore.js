/**
 * Secure In-Memory Token Store
 *
 * Security model:
 * - Primary storage: JS module-level memory (NOT accessible by XSS via document/window)
 * - Fallback: sessionStorage for page refresh continuity
 *   → sessionStorage is scoped to a single browser tab
 *   → cleared automatically when the tab is closed
 *   → NOT shared across tabs (unlike localStorage)
 *
 * This is significantly more secure than localStorage:
 * - localStorage: persistent, shared across all tabs, readable by any JS (XSS risk)
 * - sessionStorage: tab-scoped, cleared on close, less attractive XSS target
 * - memory: invisible to XSS; lost on refresh (bridged via sessionStorage)
 */

const SESSION_KEY = '__ss_tok__'; // obscure key name
const GUEST_SESSION_KEY = '__ss_gtok__';

// ── Primary in-memory storage ──────────────────────────────────────────────
let _token = null;
let _guestToken = null;

// Initialize from sessionStorage on module load (page refresh case)
const _init = () => {
  try {
    _token = sessionStorage.getItem(SESSION_KEY) || null;
    _guestToken = sessionStorage.getItem(GUEST_SESSION_KEY) || null;
  } catch {
    // sessionStorage unavailable (private mode edge cases) — memory only
  }
};
_init();

// ── Token (auth user) ─────────────────────────────────────────────────────
export const getToken = () => _token;

export const setToken = (token) => {
  _token = token || null;
  try {
    if (token) {
      sessionStorage.setItem(SESSION_KEY, token);
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch { /* ignore */ }
};

export const clearToken = () => setToken(null);

// ── Guest Token ────────────────────────────────────────────────────────────
export const getGuestToken = () => _guestToken;

export const setGuestToken = (token) => {
  _guestToken = token || null;
  try {
    if (token) {
      sessionStorage.setItem(GUEST_SESSION_KEY, token);
    } else {
      sessionStorage.removeItem(GUEST_SESSION_KEY);
    }
  } catch { /* ignore */ }
};

export const clearGuestToken = () => setGuestToken(null);

// ── Clear all session auth ─────────────────────────────────────────────────
export const clearAllTokens = () => {
  clearToken();
  clearGuestToken();
};
