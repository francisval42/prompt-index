import { createRoot } from 'react-dom/client';
import { Route, Router, Switch } from 'wouter';

import App from './App';
import PayPage from '@/pages/pay';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

// wouter expects the base without a trailing slash ("" when served at root).
const routerBase = import.meta.env.BASE_URL.replace(/\/+$/, '');

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <Router base={routerBase}>
      <Switch>
        <Route path="/pay" component={PayPage} />
        {/* Everything else renders the index, matching previous behavior. */}
        <Route component={App} />
      </Switch>
    </Router>
  </ErrorBoundary>,
);
