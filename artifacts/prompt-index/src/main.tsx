import { lazy, Suspense, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { Route, Router, Switch, useLocation } from 'wouter';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

// Loaded on demand: keeps Stripe.js and the payment code entirely off the
// index pages, which is most of the JS a visitor would otherwise download.
// A failed chunk load is almost always a stale build cached after a publish,
// so retry once with a hard reload before surfacing the error.
function lazyWithReload<T extends ComponentType>(
  load: () => Promise<{ default: T }>,
  retriedKey: string,
) {
  return lazy(async () => {
    try {
      const mod = await load();
      try {
        sessionStorage.removeItem(retriedKey);
      } catch {
        /* storage blocked: nothing to clean up */
      }
      return mod;
    } catch (error) {
      let alreadyRetried = true;
      try {
        alreadyRetried = sessionStorage.getItem(retriedKey) === '1';
        if (!alreadyRetried) sessionStorage.setItem(retriedKey, '1');
      } catch {
        /* storage blocked: skip the reload and surface the error */
      }
      if (!alreadyRetried) {
        window.location.reload();
        return new Promise<never>(() => {});
      }
      throw error;
    }
  });
}

const PayPage = lazyWithReload(() => import('@/pages/pay'), 'pay-chunk-reloaded');
// Unlisted newsletter admin page; same stale-chunk reload treatment.
const AdminPage = lazyWithReload(() => import('@/pages/admin'), 'admin-chunk-reloaded');

// wouter expects the base without a trailing slash ("" when served at root).
const routerBase = import.meta.env.BASE_URL.replace(/\/+$/, '');

// The boundary lives inside the router and resets on navigation, so a crash
// on one route (e.g. the pay chunk failing to load) never traps the whole app.
function RoutedApp() {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location}>
      <Switch>
        <Route path="/pay">
          <Suspense fallback={<div className="min-h-[100dvh] bg-background" />}>
            <PayPage />
          </Suspense>
        </Route>
        <Route path="/admin">
          <Suspense fallback={<div className="min-h-[100dvh] bg-background" />}>
            <AdminPage />
          </Suspense>
        </Route>
        {/* Everything else renders the index, matching previous behavior. */}
        <Route component={App} />
      </Switch>
    </ErrorBoundary>
  );
}

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <Router base={routerBase}>
    <RoutedApp />
  </Router>,
);
