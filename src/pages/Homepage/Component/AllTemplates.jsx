import { useState, useRef, useEffect, useCallback } from "react";
import { useGeneralData } from "../../.././Context/GeneralContext";
import { useSelectedCompany } from "../../../Context/SelectedCompanyContext";
import "./stylec.css";
import { Alltemplateservice } from "./Services/Alltemplateservice";
import { useNavigate } from "react-router";
import { ArrowLeft, Check, Compass } from "lucide-react";
import { seenImages, markImageSeen, isNewTemplate } from "./templateCacheUtils";
import { hasMlmProfileInStorage } from "../../../utils/companyStorage";
import { isDirectEditorTemplate } from "../../../utils/editorNavigation";

const SkeletonCard = () => (
  <div className="rounded-[24px] overflow-hidden bg-muted aspect-square w-full relative border border-border">
    <div className="absolute inset-0 shimmer-bar" />
  </div>
);

const NewBadge = () => (
  <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500 shadow-md pointer-events-none">
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-70" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
    </span>
    <span className="text-[8px] font-bold text-white uppercase tracking-wide leading-none">
      New
    </span>
  </div>
);

function TemplateImage({ src, alt }) {
  const [loaded, setLoaded] = useState(() => seenImages.has(src));
  return (
    <div className="absolute inset-0 w-full h-full">
      {!loaded && <div className="absolute inset-0 shimmer-bar" />}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${loaded ? "opacity-100" : "opacity-0"}`}
        style={{ transition: loaded ? "none" : "opacity 0.15s" }}
        loading="lazy"
        decoding="auto"
        onLoad={() => {
          markImageSeen(src);
          setLoaded(true);
        }}
      />
    </div>
  );
}

const getSelType = (selType) => {
  if (selType?.type) {
    localStorage.setItem("selType", JSON.stringify(selType));
    return selType;
  }
  try {
    const stored = localStorage.getItem("selType");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export default function AllTemplates() {
  const navigate = useNavigate();
  const { selectedCompany } = useSelectedCompany();
  const {
    selType: contextSelType,
    setSelType,
    allTemplatesCache,
    setAllTemplatesCache,
  } = useGeneralData();
  const companyName = selectedCompany?.id || "";

  const selType = getSelType(contextSelType);
  const cacheKey = selType?.type || "";

  const [tempdata, setTempData] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setInitialLoad] = useState(true);
  const [isFetchingMore, setFetchingMore] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const lastKeyRef = useRef(null);

  useEffect(() => {
    const activeType = getSelType(contextSelType);
    if (!activeType?.type) return;

    const key = activeType.type;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    const cached = allTemplatesCache[key];
    if (cached) {
      setTempData(cached.templates);
      setLastDoc(cached.lastDoc);
      setHasMore(cached.hasMore);
      setInitialLoad(false);
      return;
    }

    setTempData([]);
    setLastDoc(null);
    setHasMore(true);
    setInitialLoad(true);
    loadFirstPage(key);
  }, [contextSelType]); // eslint-disable-line

  const loadFirstPage = useCallback(
    async (type) => {
      try {
        const {
          templates,
          lastDoc: ld,
          hasMore: more,
        } = await Alltemplateservice(type, null, 12, companyName);
        setTempData(templates);
        setLastDoc(ld);
        setHasMore(more);
        setAllTemplatesCache((prev) => ({
          ...prev,
          [type]: { templates, lastDoc: ld, hasMore: more },
        }));
      } catch (err) {
        
      } finally {
        setInitialLoad(false);
      }
    },
    [setAllTemplatesCache],
  );

  const loadMorePage = useCallback(async () => {
    const activeType = getSelType(contextSelType);
    if (!activeType?.type || !lastDoc) return;
    setFetchingMore(true);
    try {
      const {
        templates,
        lastDoc: ld,
        hasMore: more,
      } = await Alltemplateservice(activeType.type, lastDoc, 6, companyName);
      setTempData((prev) => {
        const next = [...prev, ...templates];
        setAllTemplatesCache((c) => ({
          ...c,
          [activeType.type]: { templates: next, lastDoc: ld, hasMore: more },
        }));
        return next;
      });
      setLastDoc(ld);
      setHasMore(more);
    } catch (err) {
      
    } finally {
      setFetchingMore(false);
    }
  }, [contextSelType, lastDoc, setAllTemplatesCache]);

  const handleObserver = useCallback(
    (entries) => {
      if (
        entries[0].isIntersecting &&
        hasMore &&
        !isFetchingMore &&
        !isInitialLoading
      ) {
        loadMorePage();
      }
    },
    [hasMore, isFetchingMore, isInitialLoading, loadMorePage],
  );

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [handleObserver]);

  const onImageSelect = (item) => {
    setSelectedId(item.id);
    if (hasMlmProfileInStorage()) {
      const seltype = {
        MainType: item.MainType,
        id: item.id,
        type: item.type,
        serial: item.serial,
        ShowCaseForm: item.ShowCaseForm,
        Subtype: item.Subtype,
      };
      setSelType(seltype);
      localStorage.setItem("selType", JSON.stringify(seltype));
      navigate(isDirectEditorTemplate(item.type) ? "/editor" : "/mlmform");
    } else {
      navigate("/mlmprofile");
    }
  };
  const displayName = selType?.type?.replaceAll("_", " ") || "Templates";

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none z-0" />

      {/* Header */}
      <div className="flex items-center gap-4 px-4 md:px-8 py-4 md:py-6 sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-20">
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-black/20 border border-border shadow-sm shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground leading-tight truncate">
            {displayName}
          </h1>
          {!isInitialLoading && tempdata.length > 0 && (
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              {tempdata.length}+ designs available
            </p>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 z-10 layout-scroll-container">
        {!isInitialLoading && tempdata.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-white dark:bg-black/20 rounded-full flex items-center justify-center shadow-sm border border-border mb-4">
              <Compass className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-display font-bold text-foreground mb-2">
              No templates found
            </h3>
            <p className="text-muted-foreground">
              Check back later for new designs in this category.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {tempdata?.map((card) => {
            const isSelected = selectedId === card.id;
            return (
              <div
                key={card.id}
                onClick={() => onImageSelect(card)}
                className={`relative rounded-[24px] overflow-hidden cursor-pointer aspect-square bg-white dark:bg-black/20 card-press
                  ${
                    isSelected
                      ? "ring-2 ring-accent ring-offset-2 dark:ring-offset-[#0b0f19] shadow-lg scale-[0.98]"
                      : "border border-border shadow-sm"
                  }`}
              >
                <TemplateImage
                  src={card.image}
                  alt={card.Subtype || "Template design"}
                />
                {!isSelected && isNewTemplate(card.serial) && <NewBadge />}
                {isSelected && (
                  <>
                    <div className="absolute inset-0 border-4 border-accent rounded-[24px] pointer-events-none" />
                    <div className="absolute top-3 right-3 w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#0b0f19]">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {isInitialLoading &&
            Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={`init-skel-${i}`} />
            ))}
          {isFetchingMore &&
            Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={`more-skel-${i}`} />
            ))}
        </div>

        <div ref={sentinelRef} className="h-10 w-full" />

        {!hasMore && !isInitialLoading && tempdata.length > 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="bg-accent/5 dark:bg-accent/10 border border-accent/10 rounded-full px-6 py-2">
              <p className="text-xs font-semibold text-accent/80 uppercase tracking-widest">
                End of templates
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
