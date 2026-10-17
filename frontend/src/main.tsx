import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { MonitoringService } from "./services/MonitoringService";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";

// Initialize Sentry Monitoring Service
MonitoringService.init();

console.log('🚀 Bootstrapping Djati...');



createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <App />
  </ThemeProvider>
);
