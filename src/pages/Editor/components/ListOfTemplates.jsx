import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@firebase-config";
import { COLLECTIONS } from "../../../collections";
import genaral_template_json from "../../Homepage/Component/Services/genaral_template_firestore_data.json";

const BATCH_SIZE = 20;

const PRESET_VIDEO_ITEMS = [];
const _editorTemplateCache = new Map();

const SHIMMER_STYLE = `@keyframes shimmerSlide {
  0%   { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}`;
const _shimmerStyleEl = (() => {
  if (typeof document === "undefined") return null;
  const el = document.createElement("style");
  el.textContent = SHIMMER_STYLE;
  document.head.appendChild(el);
  return el;
})();

function getSelType() {
  try {
    return JSON.parse(localStorage.getItem("selType")) || {};
  } catch {
    return {};
  }
}
function getCompany() {
  try {
    return JSON.parse(localStorage.getItem("selectedCompany")) || {};
  } catch {
    return {};
  }
}

function getMeetingHostMode() {
  try {
    const savedMeeting = localStorage.getItem("Meeting");
    const meetingData = savedMeeting ? JSON.parse(savedMeeting) : null;
    return meetingData?.hostMode || "";
  } catch {
    return "";
  }
}

function getCloseFilter() {
  try {
    return localStorage.getItem("close_filter") || "SP";
  } catch {
    return "SP";
  }
}

function cleanItem(item) {
  if (!item) return null;
  const { _template, ...clean } = item;
  return clean;
}

function getGeneralItemsFromJson(type, subType) {
  const allTemplates = Object.entries(genaral_template_json?.data || {}).map(
    ([id, data]) => ({
      id,
      ...data,
    }),
  );

  return allTemplates
    .filter((template) => {
      const mainType = String(template.MainType || "")
        .trim()
        .toLowerCase();
      const templateType = String(template.SelectType || "").trim();
      const templateSubType = String(template.Subtype || "").trim();
      const isGeneral = mainType === "general" || mainType === "genaral";

      return (
        isGeneral &&
        templateType === type &&
        template.Active === true &&
        template.Launched === true &&
        (subType ? templateSubType === subType : true)
      );
    })
    .sort((a, b) => (a.serial || 0) - (b.serial || 0))
    .flatMap((template) => {
      const graphics = template.GraphicsLink || [];
      return graphics.map((g) => ({ ...g, _template: template }));
    });
}

const SHIMMER_BG = {
  background: "linear-gradient(90deg,#e8e8e8 25%,#f5f5f5 37%,#e8e8e8 63%)",
  backgroundSize: "400% 100%",
  animation: "shimmerSlide 1.2s ease infinite",
};

function LazyImage({ src, alt }) {
  const wrapperRef = useRef(null);
  const [realSrc, setRealSrc] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRealSrc(src);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  return (
    <div
      ref={wrapperRef}
      className="absolute inset-0 w-full h-full overflow-hidden"
    >
      {!loaded && (
        <div className="absolute inset-0 bg-muted/40" style={SHIMMER_BG} />
      )}
      {realSrc && (
        <img
          src={realSrc}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}

function LazyVideo({ src }) {
  const wrapperRef = useRef(null);
  const videoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "150px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (isVisible) {
      if (video.src !== src) video.src = src;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } else {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
  }, [isVisible, src]);

  return (
    <div ref={wrapperRef} className="absolute inset-0 w-full h-full">
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect
          x="3"
          y="3"
          width="30"
          height="30"
          rx="7"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeDasharray="4 3"
        />
        <path
          d="M12 18h12M18 12v12"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

const LOADING_ITEMS = Array.from({ length: 12 }, (_, i) => i);

function LoadingGrid() {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
      {LOADING_ITEMS.map((i) => (
        <div
          key={i}
          className="aspect-square rounded-xl overflow-hidden"
          style={{
            background:
              "linear-gradient(90deg,#e8e8e8 25%,#f5f5f5 37%,#e8e8e8 63%)",
            backgroundSize: "400% 100%",
            animation: `shimmerSlide 1.2s ease infinite`,
            animationDelay: `${i * 50}ms`,
          }}
        />
      ))}
    </div>
  );
}

function Tile({ item, isSelected, onSelect, isVideo }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-150 focus:outline-none ${
        isSelected
          ? "border-accent scale-95 shadow-md shadow-accent/20"
          : "border-border hover:border-accent/50 hover:scale-95"
      }`}
    >
      {isVideo && (item.backgroundVideoUrl || item.backgroundVideoUrl) ? (
        <LazyVideo src={item.backgroundVideoUrl || item.backgroundVideoUrl} />
      ) : item.suggestionImage ? (
        <LazyImage src={item.suggestionImage} alt="template" />
      ) : (
        <div className="w-full h-full bg-muted/30 flex items-center justify-center">
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            className="text-muted-foreground"
          >
            <rect
              x="2"
              y="2"
              width="16"
              height="16"
              rx="4"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M2 13l4-4 3 3 3-4 6 6"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {isVideo && (
        <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm rounded px-1 py-0.5">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
            <path d="M5 3l14 9-14 9V3z" />
          </svg>
        </div>
      )}

      {isSelected && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center shadow">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <polyline
              points="1.5,5 4,7.5 8.5,2.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
      {item.pass && item.pass !== "" && (
        <div className="absolute top-1.5 left-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect
              x="1.5"
              y="5"
              width="9"
              height="6.5"
              rx="1.5"
              fill="white"
              fillOpacity="0.85"
            />
            <path
              d="M3.5 5V3.5a2.5 2.5 0 015 0V5"
              stroke="white"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </button>
  );
}

function TabBtn({ active, onClick, icon, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[12px] font-bold transition-all duration-200 ${
        active
          ? "bg-accent text-white shadow-md shadow-accent/25"
          : "text-muted-foreground hover:text-foreground hover:bg-foreground/6"
      }`}
    >
      {icon}
      {label}
      {count != null && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? "bg-white/25 text-white" : "bg-muted/40 text-muted-foreground"}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function ListOfTemplates({
  selected,
  setSelected,
  onTabChange,
}) {
  const selType = getSelType();
  const filterCompany = getCompany()?.id || "";
  const filterType = selType?.type || "";
  const filterSubType = selType?.Subtype || "";
  const filterCompanyId = `${filterCompany}` || "";

  const [allItems, setAllItems] = useState([]);
  const [visibleItems, setVisibleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("image");

  const [pendingSelectedId, setPendingSelectedId] = useState(null);
  const [meetingHostMode, setMeetingHostMode] = useState(() => getMeetingHostMode());
  const [closeFilter, setCloseFilter] = useState(() => getCloseFilter());

  const sentinelRef = useRef(null);
  const renderedCount = useRef(0);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "Meeting") {
        setMeetingHostMode(getMeetingHostMode());
      }
      if (e.key === "close_filter") {
        setCloseFilter(getCloseFilter());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!filterType) {
      setLoading(false);
      return;
    }

    async function fetchTemplates() {
      const mainTypeLower =
        filterType === "Festival"
          ? String(selType?.MainType).trim().toLowerCase()
          :
        String(selType?.MainType);

      const isGeneralTemplate = mainTypeLower === "General";

      const cacheKey = `${filterType}__${filterSubType}__${isGeneralTemplate ? "General" : "MLM"}__${filterCompanyId}__${meetingHostMode}__${closeFilter}`;

      if (_editorTemplateCache?.has(cacheKey)) {
        const filteredItems = _editorTemplateCache.get(cacheKey);
        setAllItems(filteredItems);
        renderedCount.current = 0;

        const currentSelectedItem = filteredItems.find(
          (i) => i.id === selected?.id,
        );
        const defaultItem =
          currentSelectedItem ||
          filteredItems.find((i) => !i.backgroundVideoUrl) ||
          filteredItems[0] ||
          null;

        const nextSelected = defaultItem ? cleanItem(defaultItem) : null;
        setSelected(nextSelected);
        setPendingSelectedId(nextSelected?.id ?? null);

        const firstBatch = filteredItems.slice(0, BATCH_SIZE);
        setVisibleItems(firstBatch);
        renderedCount.current = firstBatch.length;
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        let items = [];

        if (isGeneralTemplate) {
          items = getGeneralItemsFromJson(filterType, filterSubType);
        } else {
          const constraints = [
            where("SelectType", "==", filterType),
            where("Active", "==", true),
          ];

          if (filterSubType && filterSubType !== "") {
            constraints.splice(1, 0, where("Subtype", "==", filterSubType));
          }

          if (filterCompanyId) {
            selType?.MainType === "MLM"
              ? constraints.push(where("Company", "==", filterCompanyId))
              : null;
          }

          const q = query(
            collection(db, COLLECTIONS.MLMTEMPLATE),
            ...constraints,
          );
          const snap = await getDocs(q);

          snap.forEach((docSnap) => {
            const t = { id: docSnap.id, ...docSnap.data() };
            (t.GraphicsLink || []).forEach((g) => {
              items.push({ ...g, _template: t });
            });
          });
        }

        items.sort((a, b) => {
          const aSerial = Number(a._template?.serial ?? a.serial ?? 0);
          const bSerial = Number(b._template?.serial ?? b.serial ?? 0);
          return aSerial - bSerial;
        });

        let filteredItems = items;
        try {
          if (filterSubType === "CLOSING") {
            filteredItems = items.filter(
              (g) => String(g.Filter) === String(closeFilter),
            );
          }
          if (filterType === "Meeting" || filterType === "General_Meeting") {
            if (meetingHostMode === "add") {
              filteredItems = items.filter((g) => String(g.Filter) === "true");
            } else if (meetingHostMode === "none") {
              filteredItems = items.filter((g) => String(g.Filter) === "false");
            } else {
              filteredItems = items;
            }
          }
        } catch {
          filteredItems = items;
        }

        if (selType?.id && filterSubType === "") {
          const idx = filteredItems.findIndex(
            (i) => i._template?.id === selType.id,
          );
          if (idx > 0) {
            const [found] = filteredItems.splice(idx, 1);
            filteredItems.unshift(found);
          }
        }

        _editorTemplateCache.set(cacheKey, filteredItems);

        setAllItems(filteredItems);
        renderedCount.current = 0;

        const currentSelectedItem = filteredItems.find((i) => i.id === selected?.id);
        const defaultItem =
          currentSelectedItem ||
          filteredItems.find((i) => !i.backgroundVideoUrl) ||
          filteredItems[0] ||
          null;

        const nextSelected = defaultItem
          ? cleanItem(defaultItem)
          : null;

        setSelected(nextSelected);
        setPendingSelectedId(nextSelected?.id ?? null);

        const firstBatch = filteredItems.slice(0, BATCH_SIZE);
        setVisibleItems(firstBatch);
        renderedCount.current = firstBatch.length;
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to load templates");
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, [filterType, filterSubType, filterCompanyId, meetingHostMode, closeFilter]);

  const imageItems = useMemo(
    () => allItems.filter((item) => !item.backgroundVideoUrl),
    [allItems],
  );
  const fbVideoItems = useMemo(
    () => allItems.filter((item) => !!item.backgroundVideoUrl),
    [allItems],
  );
  const videoItems = useMemo(
    () => (fbVideoItems.length > 0 ? fbVideoItems : PRESET_VIDEO_ITEMS),
    [fbVideoItems],
  );
  const tabItems = useMemo(
    () => (activeTab === "video" ? videoItems : imageItems),
    [activeTab, videoItems, imageItems],
  );

  const tabItemsRef = useRef(tabItems);
  useEffect(() => {
    tabItemsRef.current = tabItems;
  }, [tabItems]);

  const [visibleTabItems, setVisibleTabItems] = useState([]);
  const tabRenderedCount = useRef(0);

  useEffect(() => {
    tabRenderedCount.current = 0;
    const firstBatch = tabItems.slice(0, BATCH_SIZE);
    setVisibleTabItems(firstBatch);
    tabRenderedCount.current = firstBatch.length;
  }, [activeTab, allItems]);

  const loadMore = useCallback(() => {
    const items = tabItemsRef.current;
    if (tabRenderedCount.current >= items.length) return;
    setLoadingMore(true);
    setTimeout(() => {
      const next = items.slice(
        tabRenderedCount.current,
        tabRenderedCount.current + BATCH_SIZE,
      );
      setVisibleTabItems((prev) => [...prev, ...next]);
      tabRenderedCount.current += next.length;
      setLoadingMore(false);
    }, 100);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) loadMore();
      },
      { rootMargin: "120px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, loadingMore]);

  const handleTab = useCallback(
    (tab) => {
      if (tab === activeTab) return;
      setActiveTab(tab);
      if (onTabChange) onTabChange(tab);
      const items = tab === "video" ? videoItems : imageItems;
      const next = items.length > 0 ? cleanItem(items[0]) : null;
      setPendingSelectedId(next?.id ?? null);
      // Update the canvas immediately — startTransition was marking this
      // as low priority, so the selected template could sit behind other
      // pending work and take a visible beat to appear on the canvas.
      setSelected(next);
    },
    [activeTab, videoItems, imageItems, onTabChange, setSelected],
  );

  const handleSelect = useCallback(
    (item) => {
      setPendingSelectedId(item.id);
      setSelected(cleanItem(item));
    },
    [setSelected],
  );

  const selectedId = pendingSelectedId ?? selected?.id;
  const isItemSelected = useCallback(
    (item) => selectedId === item.id,
    [selectedId],
  );

  return (
    <div className="w-full h-full min-h-0 flex flex-col">
      <div className="flex items-center gap-1.5 p-2 bg-muted/20 border-t border-border flex-shrink-0">
        <TabBtn
          active={activeTab === "image"}
          onClick={() => handleTab("image")}
          label="Image"
          count={imageItems.length || null}
          icon={
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          }
        />
        <TabBtn
          active={activeTab === "video"}
          onClick={() => handleTab("video")}
          label="Video"
          count={videoItems.length || null}
          icon={
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          }
        />
      </div>

      <div className="w-full flex-1 min-h-0 overflow-y-auto p-2 pb-6">
        {error && (
          <div className="rounded-xl bg-danger/10 border border-danger/20 p-3 text-xs text-danger mb-2">
            {error}
          </div>
        )}
        {!filterType && !loading && (
          <div className="rounded-xl bg-warning/10 p-3 text-xs text-warning-foreground">
            No template type found.
          </div>
        )}

        {loading && <LoadingGrid />}

        {!loading && !error && filterType && tabItems.length === 0 && (
          <EmptyState
            label={
              activeTab === "video"
                ? "No video templates available"
                : "No image templates found"
            }
          />
        )}

        {!loading && visibleTabItems.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
            {visibleTabItems.map((item, idx) => (
              <Tile
                key={`${item._template?.serial}-${item.id}-${idx}`}
                item={item}
                isSelected={isItemSelected(item)}
                onSelect={handleSelect}
                isVideo={activeTab === "video"}
              />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-1" />

        {loadingMore && (
          <div className="flex justify-center py-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-accent/40 animate-bounce"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
