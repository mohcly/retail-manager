import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { MonitoringService } from "./services/MonitoringService";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";

// Initialize Sentry Monitoring Service
MonitoringService.init();

// Suppress benign ResizeObserver loop notifications from triggering runtime error screens
const resizeObserverLoopErr = /ResizeObserver loop/;
window.addEventListener('error', (e) => {
  if (e.message && resizeObserverLoopErr.test(e.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && typeof e.reason.message === 'string' && resizeObserverLoopErr.test(e.reason.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

console.log('🚀 Bootstrapping Djati...');


createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <App />
  </ThemeProvider>
);
