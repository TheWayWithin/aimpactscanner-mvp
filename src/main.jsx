import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// CRITICAL FIX: Defer CSS import to prevent blocking LCP
// App.css is already preloaded in index.html, so React will use it when ready
import App from './App.jsx'
// import App from './AppNew.jsx' // Testing new conversion flow

// Progressive enhancement - transition from static to React
const initReactApp = () => {
  // Check if there's a pending URL from static interaction
  const pendingUrl = window.__pendingUrl;

  // Create React root
  const root = createRoot(document.getElementById('root'));

  // Render React app
  // CRITICAL FIX: Remove StrictMode in production to prevent duplicate component mounting
  // StrictMode intentionally double-renders components to detect side effects in development
  // This was causing TWO consent banners to appear in production
  const isDevelopment = import.meta.env.MODE === 'development';

  root.render(
    isDevelopment ? (
      <StrictMode>
        <App initialUrl={pendingUrl} />
      </StrictMode>
    ) : (
      <App initialUrl={pendingUrl} />
    )
  );

  // Transition from static to React
  if (window.__showReactRoot) {
    // Small delay to ensure React is ready
    requestAnimationFrame(() => {
      window.__showReactRoot();
    });
  }
};

// Initialize immediately
initReactApp();
