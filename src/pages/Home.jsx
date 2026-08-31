import Carosel from "./Homepage/Component/Carosel";
import Festival from "./Homepage/Component/Festival";
import ListOfGenaraltemp from "./Homepage/Component/ListOfGenaraltemp";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  fetchGeneralTemplates,
  clearTemplateCache,
  TEMPLATE_GROUP_COUNT,
} from "./Homepage/Component/Services/GeneralTemplateService";
import { clearTrendingCache } from "./Homepage/Component/Services/TTrend_templateService";
import { clearFestivalTemplateCache } from "./Homepage/Component/Services/Festival_template";
import { clearAllTemplateGraphicsCache } from "./Homepage/Component/Services/Alltemplateservice";
import { useGeneralData } from "../Context/GeneralContext";
import { useSelectedCompany } from "../Context/SelectedCompanyContext";
import {
  PAGE_REFRESH_EVENT,
  consumeRefreshAttempt,
  refreshLimitMessage,
} from "../utils/pageRefresh";
import { subscribeToCompanyTemplateInvalidation } from "../utils/companyTemplateState";
import { getHomeTemplateSearchText } from "./Homepage/Component/homeTemplatePresentation";
import { auth } from "../Firebase";
import { toast } from "@heroui/react";

const PULL_REFRESH_TRIGGER = 64;
const PULL_REFRESH_MAX = 96;
const PULL_REFRESH_ACTIVE_HEIGHT = 48;

function WhatsAppBadge() {
  const [visible, setVisible] = useState(true);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 600);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = (e) => {
    e.stopPropagation();
    setEntered(false);
    setTimeout(() => {
      setVisible(false);
      // sessionStorage.setItem("wa_badge_dismissed", "1");
    }, 350);
  };

  if (!visible) return null;

  return (
    <div
      className="mlm-whatsapp-badge fixed right-4 z-[100] flex flex-col items-end gap-1"
    >
      <button
        onClick={handleDismiss}
        className="w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white shadow-md"
        style={{ touchAction: "manipulation", fontSize: 12, lineHeight: 1 }}
        aria-label="Close"
      >
        ✕
      </button>

      <a
        href="https://wa.me/919341947815"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: "#25D366",
          padding: "11px 11px",
          touchAction: "manipulation",
          transform: entered
            ? "translateX(0) scale(1)"
            : "translateX(100px) scale(0.8)",
          opacity: entered ? 1 : 0,
          transition:
            "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease",
          willChange: "transform, opacity",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          width="26"
          height="26"
          fill="white"
          style={{
            animation: entered ? "waPulse 1.8s ease-in-out infinite" : "none",
          }}
        >
          <path d="M16 0C7.163 0 0 7.163 0 16c0 2.82.733 5.47 2.015 7.775L0 32l8.485-2.222A15.93 15.93 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.26 13.26 0 01-6.736-1.827l-.483-.286-4.996 1.31 1.338-4.87-.314-.498A13.26 13.26 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.273-9.903c-.398-.199-2.357-1.163-2.72-1.295-.365-.133-.63-.199-.895.199-.265.398-1.028 1.295-1.26 1.56-.232.265-.464.299-.862.1-.398-.199-1.68-.619-3.2-1.974-1.183-1.054-1.98-2.355-2.214-2.753-.232-.398-.025-.613.175-.811.18-.178.398-.464.597-.696.199-.232.265-.398.398-.663.133-.265.066-.497-.033-.696-.1-.199-.895-2.158-1.228-2.954-.323-.775-.65-.67-.895-.682l-.763-.013c-.265 0-.696.1-1.061.497-.365.398-1.393 1.362-1.393 3.32 0 1.958 1.426 3.85 1.625 4.115.199.265 2.81 4.29 6.81 6.016.953.41 1.696.656 2.275.84.955.303 1.824.26 2.511.157.766-.114 2.357-.963 2.688-1.893.332-.93.332-1.727.232-1.893-.099-.166-.365-.265-.763-.464z" />
        </svg>
      </a>

      <style>{`
        .mlm-whatsapp-badge { bottom: 126px; }
        @media (min-width: 768px) {
          .mlm-whatsapp-badge { bottom: 76px; }
        }
        @keyframes waPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
      `}</style>
    </div>
  );
}

function SearchBar({ value, onChange }) {
  return (
    <div className="relative  flex items-center">
      <svg
        className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search templates..."
        maxLength={50}
        className="w-full pl-9 pr-9 py-2.5 h-[35px] rounded-xl  border border-accent/20 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 w-5 h-5 flex items-center justify-center rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/35 transition-colors"
          aria-label="Clear"
        >
          <svg
            className="w-3 h-3 text-foreground/70"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

function Home() {
  const { selectedCompany, refreshCompany } = useSelectedCompany();
  const {
    cachedTemplates,
    setCachedTemplates,
    cachedGroupIndex,
    setCachedGroupIndex,
    setCachedFestivalData,
    setCachedTrending,
    templateDataVersion,
  } = useGeneralData();
  const companyId = selectedCompany?.id || "";

  const [loading, setLoading] = useState(false);
  const [homeDataVersion, setHomeDataVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [pullDistance, setPullDistance] = useState(0);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const homeRootRef = useRef(null);
  const loadingRef = useRef(false);
  const groupIndexRef = useRef(cachedGroupIndex);
  const loadTemplatesRef = useRef(null);
  const activeLoadTokenRef = useRef(null);
  const activeCompanyIdRef = useRef(companyId);
  const pullStartYRef = useRef(0);
  const pullStartXRef = useRef(0);
  const pullDistanceRef = useRef(0);
  const isPullingRef = useRef(false);
  activeCompanyIdRef.current = companyId;

  const loadTemplates = useCallback(async () => {
    if (
      !companyId ||
      loadingRef.current ||
      groupIndexRef.current >= TEMPLATE_GROUP_COUNT
    ) return;

    const groupIndex = groupIndexRef.current;
    const loadToken = Symbol("home-template-load");
    activeLoadTokenRef.current = loadToken;
    loadingRef.current = true;
    setLoading(true);

    try {
      const data = await fetchGeneralTemplates(groupIndex, companyId);
      if (
        activeLoadTokenRef.current !== loadToken ||
        activeCompanyIdRef.current !== companyId
      ) {
        return;
      }

      setCachedTemplates((prev) => {
        const existingTypes = new Set(prev.map((g) => g.type));
        return [...prev, ...data.filter((g) => !existingTypes.has(g.type))];
      });

      groupIndexRef.current = groupIndex + 1;
      setCachedGroupIndex(groupIndexRef.current);
    } finally {
      if (activeLoadTokenRef.current === loadToken) {
        activeLoadTokenRef.current = null;
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [companyId, setCachedTemplates, setCachedGroupIndex]);

  useEffect(() => {
    loadTemplatesRef.current = loadTemplates;
  }, [loadTemplates]);

  useEffect(() => {
    groupIndexRef.current = cachedGroupIndex;

    if (companyId && cachedTemplates.length === 0) loadTemplates();
  }, [cachedGroupIndex, cachedTemplates.length, companyId, loadTemplates]);

  useEffect(() => {
    const cancelObsoleteCompanyLoad = () => {
      // Ref updates are immediate, so a request for the previous company is
      // rejected even before React finishes rendering the new selection.
      activeLoadTokenRef.current = null;
      loadingRef.current = false;
      groupIndexRef.current = 0;
      setLoading(false);
      setSearchQuery("");
    };

    return subscribeToCompanyTemplateInvalidation(cancelObsoleteCompanyLoad);
  }, []);

  const refreshHomeData = useCallback(async () => {
    if (loadingRef.current) return;

    const loadToken = Symbol("home-template-refresh");
    activeLoadTokenRef.current = loadToken;
    loadingRef.current = true;
    setLoading(true);
    clearTemplateCache();
    clearTrendingCache();
    clearFestivalTemplateCache();
    clearAllTemplateGraphicsCache();
    setCachedTemplates([]);
    setCachedGroupIndex(0);
    setCachedFestivalData({});
    setCachedTrending(null);
    groupIndexRef.current = 0;

    // Remount the independently-loaded carousel and festival sections so they
    // perform the same fresh reads they perform when Home first opens.
    setHomeDataVersion((version) => version + 1);

    try {
      const company = await refreshCompany();
      const refreshedCompanyId = company?.id || "";
      if (
        !refreshedCompanyId ||
        activeLoadTokenRef.current !== loadToken ||
        activeCompanyIdRef.current !== refreshedCompanyId
      ) {
        return;
      }

      const data = await fetchGeneralTemplates(0, refreshedCompanyId);
      if (
        activeLoadTokenRef.current !== loadToken ||
        activeCompanyIdRef.current !== refreshedCompanyId
      ) {
        return;
      }
      setCachedTemplates(data);
      groupIndexRef.current = 1;
      setCachedGroupIndex(1);
    } finally {
      if (activeLoadTokenRef.current === loadToken) {
        activeLoadTokenRef.current = null;
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [
    setCachedFestivalData,
    setCachedGroupIndex,
    setCachedTemplates,
    setCachedTrending,
    refreshCompany,
  ]);

  const runPullRefresh = useCallback(async () => {
    if (pullRefreshing || loadingRef.current) {
      pullDistanceRef.current = 0;
      setPullDistance(0);
      return;
    }

    const limit = consumeRefreshAttempt(auth.currentUser?.uid);
    if (!limit.allowed) {
      pullDistanceRef.current = 0;
      setPullDistance(0);
      toast.warning(refreshLimitMessage(limit.retryAfterMs));
      return;
    }

    setPullRefreshing(true);
    pullDistanceRef.current = PULL_REFRESH_ACTIVE_HEIGHT;
    setPullDistance(PULL_REFRESH_ACTIVE_HEIGHT);

    try {
      await refreshHomeData();
    } catch {
      toast.danger("Refresh failed. Please try again.");
    } finally {
      pullDistanceRef.current = 0;
      setPullDistance(0);
      setPullRefreshing(false);
    }
  }, [pullRefreshing, refreshHomeData]);

  useEffect(() => {
    const handlePageRefresh = (event) => {
      if (event.detail?.target !== "home") return;
      event.detail.handled = true;
      refreshHomeData()
        .then(() => event.detail?.complete?.())
        .catch((error) => event.detail?.complete?.(error));
    };

    window.addEventListener(PAGE_REFRESH_EVENT, handlePageRefresh);
    return () => window.removeEventListener(PAGE_REFRESH_EVENT, handlePageRefresh);
  }, [refreshHomeData]);

  useEffect(() => {
    const scrollEl = homeRootRef.current?.closest(
      ".mlm-main-scroll-container",
    );
    if (!scrollEl) return;

    const resetPull = () => {
      isPullingRef.current = false;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    const handleTouchStart = (event) => {
      const touch = event.touches?.[0];
      if (
        !touch ||
        pullRefreshing ||
        loadingRef.current ||
        scrollEl.scrollTop > 1 ||
        event.target?.closest?.("input, textarea, select, [contenteditable='true']")
      ) {
        isPullingRef.current = false;
        return;
      }

      pullStartYRef.current = touch.clientY;
      pullStartXRef.current = touch.clientX;
      pullDistanceRef.current = 0;
      isPullingRef.current = true;
    };

    const handleTouchMove = (event) => {
      if (!isPullingRef.current) return;
      const touch = event.touches?.[0];
      if (!touch || scrollEl.scrollTop > 1) {
        resetPull();
        return;
      }

      const deltaY = touch.clientY - pullStartYRef.current;
      const deltaX = touch.clientX - pullStartXRef.current;
      if (deltaY <= 0) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }
      if (Math.abs(deltaX) > deltaY) {
        resetPull();
        return;
      }

      event.preventDefault();
      const easedDistance = Math.min(PULL_REFRESH_MAX, deltaY * 0.55);
      pullDistanceRef.current = easedDistance;
      setPullDistance(easedDistance);
    };

    const handleTouchEnd = () => {
      if (!isPullingRef.current) return;
      const shouldRefresh = pullDistanceRef.current >= PULL_REFRESH_TRIGGER;
      isPullingRef.current = false;

      if (shouldRefresh) {
        void runPullRefresh();
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    };

    scrollEl.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    scrollEl.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    scrollEl.addEventListener("touchend", handleTouchEnd, { passive: true });
    scrollEl.addEventListener("touchcancel", resetPull, { passive: true });

    return () => {
      scrollEl.removeEventListener("touchstart", handleTouchStart);
      scrollEl.removeEventListener("touchmove", handleTouchMove);
      scrollEl.removeEventListener("touchend", handleTouchEnd);
      scrollEl.removeEventListener("touchcancel", resetPull);
    };
  }, [pullRefreshing, runPullRefresh]);

  useEffect(() => {
    const scrollEl = document.querySelector(".mlm-main-scroll-container");
    if (!scrollEl) return;

    const handleScroll = () => {
      if (
        groupIndexRef.current >= TEMPLATE_GROUP_COUNT ||
        loadingRef.current
      ) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      if (scrollHeight - scrollTop <= clientHeight + 200) {
        loadTemplatesRef.current();
      }
    };

    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, []);

  const selectedProfileGlob = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("mlmProfile") || "{}");
    } catch {
      return {};
    }
  }, []);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return cachedTemplates;
    return cachedTemplates.filter((group) => {
      const matchesType = getHomeTemplateSearchText(group.type).includes(q);
      const matchesSubtype = group.templates?.some((t) =>
        (t.Subtype || "").toLowerCase().includes(q),
      );
      return matchesType || matchesSubtype;
    });
  }, [cachedTemplates, searchQuery]);

  const pullIndicatorHeight = pullRefreshing
    ? PULL_REFRESH_ACTIVE_HEIGHT
    : pullDistance;
  const pullLabel = pullRefreshing
    ? "Refreshing..."
    : pullDistance >= PULL_REFRESH_TRIGGER
      ? "Release to refresh"
      : "Pull to refresh";

  return (
    <div
      ref={homeRootRef}
      className="flex h-full w-full flex-col bg-background"
    >
      <div className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 p-3 backdrop-blur-md md:px-6 md:pt-6">
        <section className="mx-auto w-full max-w-7xl" data-guide="home-search">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </section>
      </div>

      <div
        className="flex w-full shrink-0 items-center justify-center overflow-hidden text-xs font-medium text-muted-foreground"
        style={{
          height: `${pullIndicatorHeight}px`,
          opacity: pullRefreshing || pullDistance > 8 ? 1 : 0,
          transition:
            pullRefreshing || pullDistance === 0
              ? "height 180ms ease, opacity 160ms ease"
              : "none",
        }}
        aria-live="polite"
        aria-hidden={!pullRefreshing && pullDistance <= 8}
      >
        <div className="flex items-center gap-2">
          <span
            className={`h-4 w-4 rounded-full border-2 border-accent/25 border-t-accent ${
              pullRefreshing ? "animate-spin" : ""
            }`}
            style={
              pullRefreshing
                ? undefined
                : {
                    transform: `rotate(${Math.min(
                      270,
                      (pullDistance / PULL_REFRESH_TRIGGER) * 270,
                    )}deg)`,
                  }
            }
          />
          <span>{pullLabel}</span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 pt-4 md:space-y-6 md:px-6">
        <section className="w-full" data-guide="home-carousel">
          <Carosel
            key={`carousel-${companyId}-${templateDataVersion}-${homeDataVersion}`}
          />
        </section>
        <section className="w-full" data-guide="home-templates">
          <Festival
            key={`festival-${companyId}-${templateDataVersion}-${homeDataVersion}`}
          />
        </section>

        <section className="w-full">
          <ListOfGenaraltemp
            templates={filteredTemplates}
            loading={loading}
            searchQuery={searchQuery}
            companyName={selectedProfileGlob?.companyName || ""}
          />
        </section>
      </div>

      <WhatsAppBadge />
    </div>
  );
}

export default Home;
