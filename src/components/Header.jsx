import { useState, useEffect, useCallback, useRef } from "react";
import {
  Moon,
  Sun,
  ListUl,
  Gear,
  ChevronLeft,
  ArrowRotateLeft,
} from "@gravity-ui/icons";
import { useGeneralData } from "../Context/GeneralContext";
import { useNavigate, useLocation, useSearchParams } from "react-router";
import {
  LayoutDashboard,
  PlusCircle,
  Eye,
  ChevronRight,
  X,
  ClipboardList,
  Users,
  UserCheck,
  Trophy,
  GitBranch,
  UserPlus,
} from "lucide-react";
import { db } from "../Firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { COLLECTIONS } from "../collections";
import { getLocalLogo } from "../utils/getCompanyLogo";
import { getUser } from "../utils/authStorage";
import { runAppBackNavigation } from "../utils/appBackNavigation";
import { auth } from "../Firebase";
import { toast } from "@heroui/react";
import { useSelectedCompany } from "../Context/SelectedCompanyContext";
import {
  PAGE_REFRESH_EVENT,
  consumeRefreshAttempt,
  refreshLimitMessage,
} from "../utils/pageRefresh";
import {
  BANNER_SETTINGS_PATH,
  createBannerSettingsNavigationState,
} from "../utils/bannerSettingsNavigation";

const REFRESH_TARGETS = {
  "/": "home",
  "/editor": "editor-templates",
  "/mlmprofile": "mlm-profile",
};
function getStoredUserName() {
  const mlmProfile = JSON.parse(sessionStorage.getItem("mlmProfile") || "{}");
  const userMlm = getUser() || {};
  return mlmProfile?.name || userMlm?.name || "";
}
const PAGE_TITLES = {
  "/subscription": "My Subscription",
  "/mlmprofile": "Company Profile",
  "/alltemp": "Templates",
  "/mlmform": "Create Design",
  "/selectcomp": "Select Company",
};

const REPORTING_TAB_LABELS = {
  dashboard: "Dashboard",
  "add-work": "Add Work Reporting",
  "add-patient": "Add Patient Reporting",
  "add-guest": "Add Guest",
  "add-team": "Add Reporting Team",
  "view-work": "View Work Reporting",
  "view-patient": "View Patient Reporting",
  "view-guest-list": "View Guest List",
  "view-team": "View Reporting Team",
  "team-weekly": "Team Weekly Report",
  leaderboard: "Leaderboard",
};

export default function Header({ collapsed, setCollapsed, setMobileOpen }) {
  const { selectedCompany } = useSelectedCompany();
  const { theme, toggleTheme, selType } = useGeneralData();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [userName, setUserName] = useState(() => getStoredUserName());
  const companyName = selectedCompany?.name || "";
  const companyLogo =
    getLocalLogo(selectedCompany?.id) ||
    selectedCompany?.logos?.find((logo) => logo?.link?.trim())?.link ||
    "";
  const [refreshing, setRefreshing] = useState(false);
  const [showReportingMenu, setShowReportingMenu] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [pendingInviteCount, setPendingInviteCount] = useState(0);
  const menuRef = useRef(null);
  const backBusyRef = useRef(false);
  const refreshTimeoutRef = useRef(null);

  const isReporting = location.pathname === "/reporting";
  const activeTab = searchParams.get("tab") || "dashboard";

  // Fetch pending team invite count for the current user
  useEffect(() => {
    if (!isReporting) return;
    try {
      const profile = JSON.parse(
        localStorage.getItem("reportingProfile") || "{}",
      );
      const profileId = profile.profileId;
      if (!profileId || !COLLECTIONS.TEAMREQUESTS) return;
      getDocs(
        query(
          collection(db, COLLECTIONS.TEAMREQUESTS),
          where("toId", "==", profileId),
          where("status", "==", "pending"),
        ),
      )
        .then((snap) => setPendingInviteCount(snap.size))
        .catch(() => {});
    } catch {
      /* ignore */
    }
  }, [isReporting]);

  useEffect(() => {
    setUserName(getStoredUserName());
  }, []);

  useEffect(() => {
    setShowReportingMenu(false);
    setExpandedSection(null);
  }, [location.pathname, activeTab]);

  useEffect(() => {
    if (!showReportingMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowReportingMenu(false);
        setExpandedSection(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showReportingMenu]);

  const handleRefresh = useCallback(() => {
    if (refreshing) return;

    const target = REFRESH_TARGETS[location.pathname];
    if (!target) return;

    const limit = consumeRefreshAttempt(auth.currentUser?.uid);
    if (!limit.allowed) {
      toast.warning(refreshLimitMessage(limit.retryAfterMs));
      return;
    }

    setRefreshing(true);
    let completed = false;
    const detail = {
      target,
      handled: false,
      rateLimitConsumed: true,
      complete: (error) => {
        if (completed) return;
        completed = true;
        if (refreshTimeoutRef.current) {
          window.clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = null;
        }
        setRefreshing(false);
        if (error) toast.danger("Refresh failed. Please try again.");
      },
    };

    window.dispatchEvent(new CustomEvent(PAGE_REFRESH_EVENT, { detail }));

    if (!detail.handled) {
      detail.complete(new Error("No refresh handler for this page"));
      return;
    }

    refreshTimeoutRef.current = window.setTimeout(() => {
      detail.complete(new Error("Refresh timed out"));
    }, 20_000);
  }, [location.pathname, refreshing]);

  useEffect(() => () => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
    }
  }, []);

  // Keep every hook above the route-specific early return. Header stays mounted
  // while the app changes routes, so conditionally skipping this hook caused
  // React error #310 (a different number of hooks between renders).
  const handleBack = useCallback(() => {
    if (backBusyRef.current) return;
    const handled = runAppBackNavigation({
      pathname: location.pathname,
      search: location.search,
      navigationState: location.state,
      navigate,
      selectedType: selType,
    });
    if (!handled) return;
    backBusyRef.current = true;
    window.setTimeout(() => { backBusyRef.current = false; }, 450);
  }, [
    location.pathname,
    location.search,
    location.state,
    navigate,
    selType,
  ]);

  if (location.pathname === "/profile") return null;

  const pageTitle = PAGE_TITLES[location.pathname];
  const isHome = location.pathname === "/";
  const isEditor = location.pathname === "/editor";
  const canRefresh = Boolean(REFRESH_TARGETS[location.pathname]);
  const isSubPage = !!pageTitle;
  const isForm = location.pathname === "/mlmform";

  const typeName = (() => {
    let t = selType?.type;
    if (!t) {
      try {
        t = JSON.parse(localStorage.getItem("selType") || "{}")?.type;
      } catch {
        t = "";
      }
    }
    return t ? t.replaceAll("_", " ") : "";
  })();

  const hasPendingInvites = pendingInviteCount > 0;

  const handleMenuClick = () => {
    if (isReporting) {
      setShowReportingMenu((p) => !p);
      setExpandedSection(null);
    } else {
      if (window.innerWidth < 768) setMobileOpen((p) => !p);
      else setCollapsed((p) => !p);
    }
  };

  const goToTab = (tab) => {
    navigate(`/reporting?tab=${tab}`);
    setShowReportingMenu(false);
    setExpandedSection(null);
  };

  const REPORTING_MENU = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      type: "single",
      tab: "dashboard",
    },
    {
      id: "add",
      label: "Add Reporting",
      icon: PlusCircle,
      type: "group",
      children: [
        {
          id: "add-work",
          label: "Add Self Work Reporting",
          icon: ClipboardList,
          tab: "add-work",
        },
        {
          id: "add-patient",
          label: "Add Patient Reporting",
          icon: UserCheck,
          tab: "add-patient",
        },
        { id: "add-guest", label: "Add Guest", icon: Users, tab: "add-guest" },
        {
          id: "add-team",
          label: "Add Reporting Team",
          icon: UserPlus,
          tab: "add-team",
        },
      ],
    },
    {
      id: "view",
      label: "View Reporting",
      icon: Eye,
      type: "group",
      children: [
        {
          id: "view-work",
          label: "View Self Work Reporting",
          icon: ClipboardList,
          tab: "view-work",
        },
        {
          id: "view-patient",
          label: "View Patient Reporting",
          icon: UserCheck,
          tab: "view-patient",
        },
        {
          id: "view-guest-list",
          label: "View Guest List Report",
          icon: Users,
          tab: "view-guest-list",
        },
        {
          id: "view-team",
          label: "View Team Report",
          icon: GitBranch,
          tab: "view-team",
        },
        {
          id: "team-weekly",
          label: "View Team Weekly Report",
          icon: ClipboardList,
          tab: "team-weekly",
        },
      ],
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: Trophy,
      type: "single",
      tab: "leaderboard",
    },
  ];

  const currentTabLabel = isReporting
    ? REPORTING_TAB_LABELS[activeTab] || "Dashboard"
    : null;

  return (
    <>
      <header className="sticky top-0 z-20 h-[60px] flex items-center px-4 gap-3 bg-background/95 backdrop-blur-xl border-b border-border transition-colors duration-300">
        {isSubPage || isEditor ? (
          <button
            type="button"
            aria-label="Go back"
            onClick={handleBack}
            className="w-10 h-10 touch-manipulation flex items-center justify-center rounded-full text-foreground hover:bg-foreground/8 active:scale-90 transition-all flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleMenuClick}
            aria-label="Menu"
            className="relative w-9 h-9 flex items-center justify-center rounded-full text-foreground hover:bg-foreground/8 active:scale-95 transition-all flex-shrink-0"
          >
            <ListUl className="w-5 h-5" />
            {isReporting && hasPendingInvites && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-background" />
            )}
          </button>
        )}

        <div className="flex-1 min-w-0 flex items-center">
          {(isEditor || isForm) && typeName ? (
            <h1 className="text-[15px] font-display font-bold text-foreground truncate leading-tight capitalize">
              {typeName}
            </h1>
          ) : pageTitle ? (
            <h1 className="text-[15px] font-display font-bold text-foreground truncate leading-tight">
              {pageTitle}
            </h1>
          ) : isReporting ? (
            <div className="flex flex-col min-w-0">
              <h1 className="text-[15px] font-display font-bold text-foreground leading-tight">
                Reporting
              </h1>
              {currentTabLabel && (
                <p className="text-[10px] text-accent font-semibold leading-none truncate">
                  {currentTabLabel}
                </p>
              )}
            </div>
          ) : isHome && ( userName) ? (
            <div className="flex items-center gap-2">
              {userName && (
                <span className="text-[14px] font-bold text-foreground capitalize truncate font-display">
                  {userName}
                </span>
              )}
            </div>
          ) : isEditor ? (
            <h1 className="text-[15px] font-display font-bold text-foreground">
              Editor
            </h1>
          ) : null}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {canRefresh && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh page data"
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-foreground/8 active:scale-95 transition-all disabled:opacity-60"
            >
              <ArrowRotateLeft
                className={`size-[17px] text-accent dark:text-white transition-transform duration-500 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-foreground/8 active:scale-95 transition-all"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="size-[18px] text-yellow-400" />
            ) : (
              <Moon className="size-[18px] text-accent" />
            )}
          </button>

          {isEditor && (
            <button
              onClick={() =>
                navigate(BANNER_SETTINGS_PATH, {
                  state: createBannerSettingsNavigationState(location),
                })
              }
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-foreground/8 active:scale-95 transition-all"
              title="Banner Settings"
            >
              <Gear className="size-[18px] text-accent dark:text-white" />
            </button>
          )}
        </div>
      </header>

      {/* Reporting Dropdown Menu Overlay */}
      {isReporting && showReportingMenu && (
        <div
          className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm"
          onClick={() => {
            setShowReportingMenu(false);
            setExpandedSection(null);
          }}
        >
          <div
            ref={menuRef}
            className="absolute top-[60px] left-0 right-0 mx-3 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-border"
              style={{ background: "linear-gradient(135deg,#0088DA,#0088DA)" }}
            >
              <span className="text-white font-bold text-[14px]">
                Reporting Menu
              </span>
              <button
                onClick={() => {
                  setShowReportingMenu(false);
                  setExpandedSection(null);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 space-y-1">
              {REPORTING_MENU.map((item) => {
                const Icon = item.icon;
                if (item.type === "single") {
                  const isActive = activeTab === item.tab;
                  const showBadge =
                    item.tab === "dashboard" && hasPendingInvites;
                  return (
                    <button
                      key={item.id}
                      onClick={() => goToTab(item.tab)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[13.5px] font-semibold transition-all ${
                        isActive
                          ? "bg-accent text-white"
                          : "text-foreground hover:bg-foreground/6"
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {showBadge && (
                        <span
                          className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                            isActive
                              ? "bg-white text-accent"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {pendingInviteCount}
                        </span>
                      )}
                    </button>
                  );
                }

                const isExpanded = expandedSection === item.id;
                const hasActiveChild = item.children?.some(
                  (c) => c.tab === activeTab,
                );

                return (
                  <div key={item.id}>
                    <button
                      onClick={() =>
                        setExpandedSection(isExpanded ? null : item.id)
                      }
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[13.5px] font-semibold transition-all ${
                        hasActiveChild
                          ? "bg-accent/10 text-accent"
                          : "text-foreground hover:bg-foreground/6"
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-0.5 pb-1">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildActive = activeTab === child.tab;
                          return (
                            <button
                              key={child.id}
                              onClick={() => goToTab(child.tab)}
                              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                                isChildActive
                                  ? "bg-accent text-white"
                                  : "text-foreground/75 hover:bg-foreground/6 hover:text-foreground"
                              }`}
                            >
                              <ChildIcon className="w-4 h-4 shrink-0" />
                              {child.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
