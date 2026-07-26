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
import DownloadConfetti from "./components/DownloadConfetti.jsx";
import { installModalKeyboardGuard } from "./utils/modalKeyboard.js";
// import ScrollToTop from "./Pages/ScrollToTop.js";

function BackgroundModelWarmup() {
  useEffect(() => {
    let cancelled = false;
    const networkNavigator = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
      mozConnection?: { saveData?: boolean; effectiveType?: string };
      webkitConnection?: { saveData?: boolean; effectiveType?: string };
      deviceMemory?: number;
    };
    const connection =
      networkNavigator.connection ||
      networkNavigator.mozConnection ||
      networkNavigator.webkitConnection;

    // Do not spend mobile data in data-saver/very-slow-network mode. In that
    // case the model starts only when the user actually selects a photo.
    if (
      connection?.saveData ||
      /(^|-)2g$/.test(connection?.effectiveType || "") ||
      (Number(networkNavigator.deviceMemory) > 0 &&
        Number(networkNavigator.deviceMemory) <= 2) ||
      (Number(networkNavigator.hardwareConcurrency) > 0 &&
        Number(networkNavigator.hardwareConcurrency) <= 2)
    ) {
      return undefined;
    }

    const warmUp = () => {
      if (cancelled) return;
      import("./pages/mainform/utils/removeBg.js")
        .then(({ preloadBgModel }) => preloadBgModel())
        .catch(() => {
          // Silent by design: selecting a photo retries and shows a useful
          // message if the one-time model download is still unavailable.
        });
    };

    const browserWindow = window as unknown as {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number },
      ) => number;
      cancelIdleCallback?: (id: number) => void;
      setTimeout: (callback: () => void, timeout: number) => number;
      clearTimeout: (id: number) => void;
    };
    let timer: number | undefined;
    let idleId: number | undefined;
    if (browserWindow.requestIdleCallback) {
      idleId = browserWindow.requestIdleCallback(warmUp, { timeout: 10000 });
    } else {
      timer = browserWindow.setTimeout(warmUp, 5000);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined) browserWindow.cancelIdleCallback?.(idleId);
      if (timer !== undefined) browserWindow.clearTimeout(timer);
    };
  }, []);

  return null;
}

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

function GlobalKeyboardController() {
  useEffect(() => {
    const dismissKeyboard = () => {
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLElement &&
        activeElement.matches(
          "input, textarea, select, [contenteditable='true']",
        )
      ) {
        activeElement.blur();
      }
    };

    // Covers submit buttons as well as the mobile keyboard's Go/Next/arrow
    // action when it triggers a native form submission.
    const handleSubmit = () => dismissKeyboard();

    // Some mobile WebViews send Enter to React handlers without dispatching a
    // native submit event. Keep textarea/contenteditable multi-line behavior.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Enter" &&
        event.target instanceof HTMLInputElement
      ) {
        dismissKeyboard();
      }
    };

    document.addEventListener("submit", handleSubmit, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("submit", handleSubmit, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  return null;
}

function ModalKeyboardController() {
  useEffect(() => installModalKeyboardGuard(), []);
  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <OnlineProvider>
        <GeneralContext>
          <GlobalToastController />
          <GlobalKeyboardController />
          <ModalKeyboardController />
          <BackgroundModelWarmup />
          <DownloadConfetti />

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
