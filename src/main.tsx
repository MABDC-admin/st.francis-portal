import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA
registerSW({
  onNeedRefresh() {
    if (confirm("A new version is available. Reload to update?")) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    // App is ready for offline use
    // In production, this could trigger a toast notification
  },
});

createRoot(document.getElementById("root")!).render(<App />);
