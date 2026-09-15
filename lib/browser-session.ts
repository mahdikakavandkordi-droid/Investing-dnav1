/**
 * Privacy-minimized browser identifiers used by pilot analytics.
 *
 * Visitor ID persists in localStorage; browser-session ID persists only for the
 * current tab/session. These identifiers are not account ownership signals and
 * must never be used as authorization credentials.
 * See `docs/DATABASE-AND-API.md` and `app/privacy/page.tsx`.
 */
const VISITOR_KEY = 'investing-dna:visitor:v1';
const SESSION_KEY = 'investing-dna:session:v1';
const SEEN_KEY = 'investing-dna:seen:v1';

function getOrCreateId(storage: Storage, key: string) {
  let value = storage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    storage.setItem(key, value);
  }
  return value;
}

/** Stable anonymous identifier for a browser profile. */
export function getVisitorId() {
  if (typeof window === 'undefined') return null;
  return getOrCreateId(localStorage, VISITOR_KEY);
}

/** Anonymous identifier scoped to the current browser session/tab. */
export function getBrowserSessionId() {
  if (typeof window === 'undefined') return null;
  return getOrCreateId(sessionStorage, SESSION_KEY);
}

/** Product-return marker used only for analytics metadata. */
export function isReturningVisitor() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SEEN_KEY) === '1';
}

export function markVisitorSeen() {
  if (typeof window !== 'undefined') localStorage.setItem(SEEN_KEY, '1');
}
