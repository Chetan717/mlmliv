import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import TabBar from "./components/TabBar";
import ExpiryAlertBanner from "./components/ExpiryAlertBanner";
import AppGuide from "./components/AppGuide";
import DeviceImageUploadLoader from "./components/DeviceImageUploadLoader";
export default function Layout({ children }) {
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const { pathname }                  = useLocation();
  const hideTabBar                    = pathname.startsWith("/editor");

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background text-foreground transition-colors duration-300">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex flex-col h-full overflow-hidden flex-1 min-w-0 relative">
        <Header
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          setMobileOpen={setMobileOpen}
        />

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain layout-scroll-container mlm-main-scroll-container bg-background">
          <div className={`mx-auto w-full max-w-7xl ${hideTabBar ? "pb-0" : "pb-20 md:pb-4"}`}>
            {children}
          </div>
        </div>

        {!hideTabBar && <TabBar />}
        {!hideTabBar && <ExpiryAlertBanner />}
      </div>

      <AppGuide />
      <DeviceImageUploadLoader />

    </div>
  );
}
