import { StrictMode, useEffect } from "react";
import { Toast, toast } from "@heroui/react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter, Routes, Route } from "react-router";
import { GeneralContext } from "./Context/GeneralContext.jsx";
import { ErrorBoundary, OnlineProvider } from "./components/ErrorBoundary.jsx";
import { AuthProvider } from "./Auth/AuthContext.jsx";
import { SelectedCompanyProvider } from "./Context/SelectedCompanyContext.jsx";
// import ScrollToTop from "./Pages/ScrollToTop.js";
function GlobalToastController() {
  useEffect(() => {
    const queue = toast.getQueue();
    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    const syncToastTimers = () => {
      const visibleKeys = new Set(
        queue.visibleToasts.map((item) => String(item.key)),
      );

      queue.visibleToasts.forEach((item) => {
        const key = String(item.key);

        if (!timers.has(key)) {
          const timer = setTimeout(() => {
            toast.close(key);
            timers.delete(key);
          }, 2000);

          timers.set(key, timer);
        }
      });

      timers.forEach((timer, key) => {
        if (!visibleKeys.has(key)) {
          clearTimeout(timer);
          timers.delete(key);
        }
      });
    };

    const unsubscribe = queue.subscribe(syncToastTimers);
    syncToastTimers();

    return () => {
      unsubscribe();
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return null;
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <OnlineProvider>
        <GeneralContext>
          <GlobalToastController />

          <Toast.Provider
            placement="top"
            maxVisibleToasts={1}
            width="min(92vw, 380px)"
          />
          <BrowserRouter>
            <AuthProvider>
              <SelectedCompanyProvider>
                {/* <ScrollToTop /> */}
                <Routes>
                  <Route path="/*" element={<App />} />
                </Routes>
              </SelectedCompanyProvider>
            </AuthProvider>
          </BrowserRouter>
        </GeneralContext>
      </OnlineProvider>
    </ErrorBoundary>
  </StrictMode>,
);
