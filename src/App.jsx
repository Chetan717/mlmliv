import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router";
import Layout from "./Layout";
import ProtectedRoute from "./Auth/ProtectedR";
import PublicRoute from "./Auth/PublicRoute";
import ProtectMlmProfile from "./pages/SelectCompany/ProtectMlmProfile";
import ProtectSelectComp from "./pages/SelectCompany/ProtectSelectComp";
import Onboarding from "./Onboarding";
import SplashScreen from "./SplashScreen";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { useAuth } from "./Auth/AuthContext";
import { useSelectedCompany } from "./Context/SelectedCompanyContext";
import { runAppBackNavigation } from "./utils/appBackNavigation";

const Home = lazy(() => import("./pages/Home"));
const AllTemplates = lazy(
  () => import("./pages/Homepage/Component/AllTemplates"),
);

const Login = lazy(() =>
  import("./Auth/Login").then((m) => ({ default: m.Login })),
);
const Signup = lazy(() =>
  import("./Auth/Signup").then((m) => ({ default: m.Signup })),
);
const Forgetpin = lazy(() =>
  import("./Auth/ForgetPin").then((m) => ({ default: m.Forgetpin })),
);
const Logout = lazy(() =>
  import("./Auth/Logout").then((m) => ({ default: m.Logout })),
);
const MainSubscription = lazy(
  () => import("./pages/Subscription/MainSubscription"),
);
const MlmProfile = lazy(() => import("./pages/Mymlmprofile/MlmProfile"));
const SelectComp = lazy(() => import("./pages/SelectCompany/SelectComp"));
const SalesExecutiveForm = lazy(
  () => import("./pages/mainform/components/SalesExecutiveForm"),
);
const MainEditor = lazy(() => import("./pages/Editor/MainEditor"));
const Myprofile = lazy(() => import("./pages/Profile/Myprofile"));
const Reporting = lazy(() => import("./pages/Reporting/Reporting"));
const AskAi = lazy(() => import("./pages/AskAi/AskAi"));

const progressStyle = `
  @keyframes routeBarFill {
    0%   { transform: scaleX(0);   opacity: 1; }
    70%  { transform: scaleX(0.8); opacity: 1; }
    100% { transform: scaleX(0.95); opacity: 1; }
  }
  @keyframes routeBarDone {
    0%   { transform: scaleX(1); opacity: 1; }
    100% { transform: scaleX(1); opacity: 0; }
  }
  .route-bar-fill {
    position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 9999;
    background: linear-gradient(90deg, #0088DA 0%, #4f6fcf 50%, #0088DA 100%);
    background-size: 200% 100%;
    transform-origin: left center;
    transform: scaleX(0);
    box-shadow: 0 0 8px rgba(26,58,138,0.4);
  }
  .route-bar-fill.active {
    animation: routeBarFill 6s cubic-bezier(0.1, 0.05, 0.3, 1) forwards;
  }
  .route-bar-fill.done {
    transform: scaleX(1);
    animation: routeBarDone 0.3s ease forwards;
  }
`;

function RouteProgressBar() {
  const location = useLocation();
  const [phase, setPhase] = useState(null);
  const timerRef = useRef(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    clearTimeout(timerRef.current);
    setPhase("active");
    timerRef.current = setTimeout(() => {
      setPhase("done");
      timerRef.current = setTimeout(() => setPhase(null), 320);
    }, 400);
    return () => clearTimeout(timerRef.current);
  }, [location.pathname]);

  if (!phase) return null;
  return (
    <>
      <style>{progressStyle}</style>
      <div className={`route-bar-fill ${phase}`} />
    </>
  );
}

function PageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-border border-t-accent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}

function PersistentPages({ pathname, authenticated, ready }) {
  const isHome    = pathname === "/";
  const isAllTemp = pathname === "/alltemp";

  const [homeReady, setHomeReady] = useState(
    () => isHome && authenticated && ready,
  );
  const [allTempReady, setAllTempReady] = useState(
    () => isAllTemp && authenticated && ready,
  );

  useEffect(() => {
    if (!authenticated) {
      setHomeReady(false);
      setAllTempReady(false);
      return;
    }
    if (!ready) return;
    if (isHome    && !homeReady)    setHomeReady(true);
    if (isAllTemp && !allTempReady) setAllTempReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, isHome, isAllTemp, ready]);
  
  if (!homeReady && !allTempReady) return null;

  const isKeepAlive = isHome || isAllTemp;

  return (
    // Outer wrapper covers full screen.
    // display:none when on any other route so it never overlaps regular pages.
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        display: isKeepAlive ? "block" : "none",
        zIndex: isKeepAlive ? 1 : -1,
      }}
    >
      {(homeReady || allTempReady) && (
        <Layout>
          <Suspense fallback={<PageSpinner />}>
            {homeReady && (
              <div
                style={{ height: "100%", display: isHome ? "block" : "none" }}
              >
                <Home />
              </div>
            )}
            {allTempReady && (
              <div
                style={{ height: "100%", display: isAllTemp ? "block" : "none" }}
              >
                <AllTemplates />
              </div>
            )}
          </Suspense>
        </Layout>
      )}
    </div>
  );
}

function App() {
  const { user: firebaseUser, loading: authLoading } = useAuth();
  const {
    selectedCompany,
    loading: companyLoading,
  } = useSelectedCompany();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const [splashDone, setSplashDone] = useState(false);
  const nativeBackBusyRef = useRef(false);

  const showOnboarding =
    !localStorage.getItem("onboardingDone") &&
    !authLoading && !firebaseUser;

  useEffect(() => {
    const handleBackPressed = (event) => {
      if (nativeBackBusyRef.current) {
        event?.preventDefault?.();
        return;
      }

      const handled = runAppBackNavigation({
        pathname,
        search: location.search,
        navigationState: location.state,
        navigate,
      });
      if (!handled) return;

      nativeBackBusyRef.current = true;
      event?.preventDefault?.();
      event?.stopPropagation?.();
      window.setTimeout(() => {
        nativeBackBusyRef.current = false;
      }, 500);
    };
    window.addEventListener("webviewBackPressed", handleBackPressed);
    return () =>
      window.removeEventListener("webviewBackPressed", handleBackPressed);
  }, [location.search, location.state, navigate, pathname]);

  if (!splashDone) return <SplashScreen onDone={() => setSplashDone(true)} />;

  if (showOnboarding) return <Onboarding />;

  return (
    <>
      <RouteProgressBar />

      {/* ── Standard routes — mount/unmount normally ── */}
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route
            path="/forgetpin"
            element={
              <PublicRoute>
                <Forgetpin />
              </PublicRoute>
            }
          />
          <Route path="/logout" element={<Logout />} />

          <Route
            path="/selectcomp"
            element={
              <ProtectedRoute>
                <ProtectSelectComp>
                  <Layout>
                    <SelectComp />
                  </Layout>
                </ProtectSelectComp>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mlmprofile"
            element={
              <ProtectedRoute>
                <ProtectMlmProfile>
                  <Layout>
                    <MlmProfile />
                  </Layout>
                </ProtectMlmProfile>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mlmform"
            element={
              <ProtectedRoute>
                <ProtectMlmProfile requireProfile>
                  <Layout>
                    <SalesExecutiveForm />
                  </Layout>
                </ProtectMlmProfile>
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <ProtectMlmProfile requireProfile>
                  <Layout>
                    <ErrorBoundary compact resetable>
                      <MainEditor />
                    </ErrorBoundary>
                  </Layout>
                </ProtectMlmProfile>
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <ProtectMlmProfile requireProfile>
                  <Layout>
                    <MainSubscription />
                  </Layout>
                </ProtectMlmProfile>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProtectMlmProfile requireProfile>
                  <Layout>
                    <Myprofile />
                  </Layout>
                </ProtectMlmProfile>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reporting"
            element={
              <ProtectedRoute>
                <ProtectMlmProfile requireProfile>
                  <Layout>
                    <Reporting />
                  </Layout>
                </ProtectMlmProfile>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ask-ai"
            element={
              <ProtectedRoute>
                <ProtectMlmProfile requireProfile>
                  <Layout>
                    <AskAi />
                  </Layout>
                </ProtectMlmProfile>
              </ProtectedRoute>
            }
          />

          {/* "/" and "/alltemp" — auth guard only; actual content rendered by PersistentPages.
              The null child means authorised users see nothing from Routes here — PersistentPages
              renders the real Layout+page via the keep-alive layer above. */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProtectMlmProfile>{null}</ProtectMlmProfile>
              </ProtectedRoute>
            }
          />
          <Route
            path="/alltemp"
            element={
              <ProtectedRoute>
                <ProtectMlmProfile>{null}</ProtectMlmProfile>
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={<Navigate to={firebaseUser ? "/" : "/login"} replace />}
          />
        </Routes>
      </Suspense>

      {/* ── Keep-alive pages: Home + AllTemplates always stay in DOM ── */}
      <PersistentPages
        pathname={pathname}
        authenticated={!!firebaseUser}
        ready={!!firebaseUser && !companyLoading && !!selectedCompany}
      />
    </>
  );
}

export default App;
