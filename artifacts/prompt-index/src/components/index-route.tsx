import { useEffect, useLayoutEffect, useState } from 'react';
import { useLocation } from 'wouter';
import App from '../App';

const BROKEN_LINK_FLAG = 'index:broken-link-redirect';
const LEGACY_PATHS = new Set(['/brand', '/launch', '/connect', '/explainers']);

function ManifestHome() {
  const [showNotice, setShowNotice] = useState(false);
  // Consume only after a committed mount, not inside a state initializer
  // which React can run speculatively without ever displaying its result.
  useEffect(() => {
    try {
      const flagged = sessionStorage.getItem(BROKEN_LINK_FLAG) === '1';
      if (flagged) {
        sessionStorage.removeItem(BROKEN_LINK_FLAG);
        setShowNotice(true);
      }
    } catch {
      // Storage unavailable: keep the redirect, omit the optional notice.
    }
  }, []);

  return (
    <>
      {showNotice && (
        <div role="status" className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm text-muted sm:px-8">
          <span>That page doesn't exist, so we brought you to the index.</span>
          <button
            type="button"
            onClick={() => setShowNotice(false)}
            className="min-h-11 shrink-0 font-bold hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            DISMISS
          </button>
        </div>
      )}
      <App />
    </>
  );
}

// Remove dead URLs from history. Only genuinely unknown paths get the
// existing one-time notice; retired tabs redirect silently to the manifest.
export function IndexRoute() {
  const [location, navigate] = useLocation();
  const normalized = location.replace(/\/+$/, '') || '/';

  useLayoutEffect(() => {
    document.title = 'Index';
    if (normalized === '/') return;
    if (!LEGACY_PATHS.has(normalized)) {
      try {
        sessionStorage.setItem(BROKEN_LINK_FLAG, '1');
      } catch {
        // Redirect still works when session storage is unavailable.
      }
    }
    navigate('/', { replace: true });
  }, [normalized, navigate]);

  return normalized === '/' ? <ManifestHome /> : null;
}