import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, Check, ChevronRight, Compass } from "lucide-react";
import { useGeneralData } from "../../../Context/GeneralContext";
import { useSelectedCompany } from "../../../Context/SelectedCompanyContext";
import { hasMlmProfileInStorage } from "../../../utils/companyStorage";
import {
  isDirectEditorTemplate,
  rememberEditorBackTarget,
} from "../../../utils/editorNavigation";
import {
  buildAllTemplatesReturnPath,
  buildAllTemplatesSubtypePath,
  getAllTemplatesBackTarget,
  getAllTemplatesSubtype,
} from "../../../utils/allTemplatesNavigation";
import {
  getEditorGraphicSelectionKey,
  storeEditorTemplateSeed,
} from "../../../utils/editorTemplateSelection";
import { subscribeToCompanyTemplateInvalidation } from "../../../utils/companyTemplateState";
import { AllTemplateGraphicsService } from "./Services/Alltemplateservice";
import {
  GRAPHICS_ROW_LIMIT,
  getSubtypeRowItems,
  groupTemplateGraphicsBySubtype,
} from "./templateGraphicsView";
import {
  isNewTemplate,
  markImageSeen,
  preloadImage,
  seenImages,
} from "./templateCacheUtils";
import "./stylec.css";

function readSelectedType(contextSelectedType) {
  if (contextSelectedType?.type) return contextSelectedType;
  try {
    const stored = localStorage.getItem("selType");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function displayLabel(value, fallback = "Templates") {
  const text = String(value || "").trim();
  return text ? text.replaceAll("_", " ") : fallback;
}

function ShowcaseImage({ src, alt }) {
  const [loaded, setLoaded] = useState(() =>
    Boolean(src && seenImages.has(src)),
  );

  if (!src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted/40 text-muted-foreground">
        <Compass className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-muted/40">
      {!loaded && <div className="absolute inset-0 shimmer-bar" />}
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-150 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
        decoding="async"
        onLoad={() => {
          markImageSeen(src);
          setLoaded(true);
        }}
      />
    </div>
  );
}

function ShowcaseCard({ graphic, selected, onSelect }) {
  const template = graphic?._template;
  const preview =
    graphic?.suggestionImage ||
    graphic?.url ||
    graphic?.backgroundVideoUrl ||
    "";

  return (
    <button
      type="button"
      onPointerEnter={() => graphic?.url && preloadImage(graphic.url)}
      onPointerDown={() => graphic?.url && preloadImage(graphic.url)}
      onClick={() => onSelect(graphic)}
      aria-label={`Select ${displayLabel(template?.Subtype, "template")} background`}
      className={`relative h-[110px] w-[110px] shrink-0 snap-start overflow-hidden rounded-md border bg-white text-left shadow-sm transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent card-press dark:bg-black/20 ${
        selected
          ? "border-accent ring-2 ring-accent ring-offset-1 dark:ring-offset-[#0b0f19]"
          : "border-border"
      }`}
    >
      <ShowcaseImage src={preview} alt="GraphicsLink showcase" />
      {isNewTemplate(template?.serial) && (
        <span className="absolute left-1.5 top-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white shadow">
          New
        </span>
      )}
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-accent shadow-md dark:border-[#0b0f19]">
          <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <div key={sectionIndex}>
          <div className="mb-3 h-5 w-36 overflow-hidden rounded-md bg-muted/50">
            <div className="h-full w-full shimmer-bar" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((__, cardIndex) => (
              <div
                key={cardIndex}
                className="relative h-[110px] w-[110px] shrink-0 overflow-hidden rounded-md border border-border bg-muted/40"
              >
                <div className="absolute inset-0 shimmer-bar" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 justify-items-center gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="relative h-[110px] w-[110px] overflow-hidden rounded-md border border-border bg-muted/40"
        >
          <div className="absolute inset-0 shimmer-bar" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-border bg-white shadow-sm dark:bg-black/20">
        <Compass className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-xl font-display font-bold text-foreground">
        No backgrounds found
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default function AllTemplates() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastAllTemplatesSearchRef = useRef(
    location.pathname === "/alltemp" ? location.search : "",
  );
  const { selectedCompany } = useSelectedCompany();
  const {
    selType: contextSelectedType,
    setSelType,
    allTemplatesCache,
    setAllTemplatesCache,
  } = useGeneralData();

  const selectedType = readSelectedType(contextSelectedType);
  const templateType = selectedType?.type || "";
  const companyId = selectedCompany?.id || "";
  const allTemplatesSearch =
    location.pathname === "/alltemp"
      ? location.search
      : lastAllTemplatesSearchRef.current;
  const requestedSubtype = getAllTemplatesSubtype(allTemplatesSearch);
  const isSubtypeGrid = Boolean(requestedSubtype);
  const templateFlowReturnTarget = buildAllTemplatesReturnPath(
    allTemplatesSearch,
  );

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryId, setRetryId] = useState(0);
  const [selectedGraphicKey, setSelectedGraphicKey] = useState("");
  const requestSequenceRef = useRef(0);
  const lastKeyRef = useRef("");

  useEffect(() => {
    if (!contextSelectedType?.type) return;
    try {
      localStorage.setItem("selType", JSON.stringify(contextSelectedType));
    } catch {
      // The in-memory selection still keeps navigation functional.
    }
  }, [contextSelectedType]);

  useEffect(() => {
    if (location.pathname === "/alltemp") {
      lastAllTemplatesSearchRef.current = location.search;
    }
  }, [location.pathname, location.search]);

  useEffect(
    () =>
      subscribeToCompanyTemplateInvalidation(() => {
        requestSequenceRef.current += 1;
        lastKeyRef.current = "";
        setTemplates([]);
        setSelectedGraphicKey("");
        setError("");
        setLoading(true);
      }),
    [],
  );

  useEffect(() => {
    if (!templateType) {
      lastKeyRef.current = "";
      setTemplates([]);
      setLoading(false);
      setError("");
      return;
    }

    setSelectedGraphicKey("");
    const cacheKey = `graphics::${companyId}::${templateType}`;
    lastKeyRef.current = cacheKey;
    const cached = allTemplatesCache[cacheKey];
    if (Array.isArray(cached?.templates)) {
      setTemplates(cached.templates);
      setLoading(false);
      setError("");
      return;
    }

    const requestId = ++requestSequenceRef.current;
    let cancelled = false;
    setTemplates([]);
    setLoading(true);
    setError("");

    const loadTemplates = async () => {
      try {
        const nextTemplates = await AllTemplateGraphicsService(
          templateType,
          companyId,
        );
        if (
          cancelled ||
          requestSequenceRef.current !== requestId ||
          lastKeyRef.current !== cacheKey
        ) {
          return;
        }

        setTemplates(nextTemplates);
        setAllTemplatesCache((current) => ({
          ...current,
          [cacheKey]: { templates: nextTemplates },
        }));
      } catch {
        if (!cancelled && requestSequenceRef.current === requestId) {
          setError("Backgrounds could not be loaded. Please try again.");
        }
      } finally {
        if (!cancelled && requestSequenceRef.current === requestId) {
          setLoading(false);
        }
      }
    };

    void loadTemplates();
    return () => {
      cancelled = true;
    };
  }, [companyId, retryId, templateType]);

  const subtypeSections = useMemo(
    () => groupTemplateGraphicsBySubtype(templates),
    [templates],
  );
  const activeSubtypeSection = useMemo(
    () =>
      subtypeSections.find(
        (section) => section.subtype === requestedSubtype,
      ) || null,
    [requestedSubtype, subtypeSections],
  );
  const totalBackgrounds = useMemo(
    () =>
      subtypeSections.reduce(
        (total, section) => total + section.items.length,
        0,
      ),
    [subtypeSections],
  );

  const goBack = useCallback(() => {
    navigate(getAllTemplatesBackTarget(allTemplatesSearch), { replace: true });
  }, [allTemplatesSearch, navigate]);

  const selectGraphic = useCallback(
    (graphic) => {
      const template = graphic?._template;
      if (!template) return;
      lastAllTemplatesSearchRef.current = allTemplatesSearch;

      const nextGraphicKey = getEditorGraphicSelectionKey(
        graphic,
        template.id,
      );
      setSelectedGraphicKey(nextGraphicKey);

      if (!hasMlmProfileInStorage()) {
        navigate("/mlmprofile");
        return;
      }

      const nextSelectedType = {
        MainType: template.MainType,
        id: template.id,
        type: template.type,
        serial: template.serial,
        ShowCaseForm: template.ShowCaseForm,
        Subtype: template.Subtype,
        selectedGraphicKey: nextGraphicKey,
        templateFlowReturnTarget,
      };

      setSelType(nextSelectedType);
      try {
        localStorage.setItem("selType", JSON.stringify(nextSelectedType));
      } catch {
        // React context remains the fallback when storage is unavailable.
      }
      storeEditorTemplateSeed({
        template,
        selectedGraphic: graphic,
        companyId,
      });
      if (graphic?.url) preloadImage(graphic.url);

      const isDirectEditor = isDirectEditorTemplate(template.type);
      if (!isDirectEditor) localStorage.removeItem("mlmform");

      if (isDirectEditor) {
        rememberEditorBackTarget(templateFlowReturnTarget, nextSelectedType);
        navigate("/editor", {
          replace: true,
          state: { editorBackTarget: templateFlowReturnTarget },
        });
      } else {
        rememberEditorBackTarget(templateFlowReturnTarget, nextSelectedType);
        navigate("/mlmform", {
          replace: true,
          state: { templateFlowReturnTarget },
        });
      }
    },
    [
      allTemplatesSearch,
      companyId,
      navigate,
      setSelType,
      templateFlowReturnTarget,
    ],
  );

  const headerTitle = isSubtypeGrid
    ? displayLabel(requestedSubtype)
    : displayLabel(templateType);
  const headerSubtitle = isSubtypeGrid
    ? displayLabel(templateType)
    : !loading && totalBackgrounds > 0
      ? `${subtypeSections.length} subtypes · ${totalBackgrounds} backgrounds`
      : "Choose a subtype and background";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-0 h-64 bg-gradient-to-b from-accent/10 to-transparent" />

      <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-background/85 px-4 py-4 backdrop-blur-xl md:px-8 md:py-6">
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white shadow-sm dark:bg-black/20"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-display font-bold leading-tight text-foreground md:text-2xl">
            {headerTitle}
          </h1>
          <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
            {headerSubtitle}
          </p>
        </div>
      </header>

      <main className="layout-scroll-container z-10 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        {loading && (isSubtypeGrid ? <LoadingGrid /> : <LoadingRows />)}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-4 py-28 text-center">
            <p className="text-sm font-medium text-danger">{error}</p>
            <button
              type="button"
              onClick={() => setRetryId((value) => value + 1)}
              className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-white shadow-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          !isSubtypeGrid &&
          subtypeSections.length === 0 && (
            <EmptyState message="Check back later for new designs in this category." />
          )}

        {!loading &&
          !error &&
          !isSubtypeGrid &&
          subtypeSections.length > 0 && (
            <div className="space-y-8 pb-8">
              {subtypeSections.map((section) => (
                <section key={section.subtype}>
                  <div className="mb-3 flex items-center justify-between gap-3 px-0.5">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-display font-bold text-foreground">
                        {displayLabel(section.subtype)}
                      </h2>
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {section.items.length} backgrounds
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(buildAllTemplatesSubtypePath(section.subtype))
                      }
                      className="flex shrink-0 items-center gap-1 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent dark:text-white"
                    >
                      View All
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="hide-scrollbar scroll-gpu flex snap-x gap-3 overflow-x-auto px-0.5 pb-2 pt-0.5">
                    {getSubtypeRowItems(section, GRAPHICS_ROW_LIMIT).map(
                      (graphic) => {
                        const key = getEditorGraphicSelectionKey(
                          graphic,
                          graphic?._template?.id,
                        );
                        return (
                          <ShowcaseCard
                            key={key}
                            graphic={graphic}
                            selected={selectedGraphicKey === key}
                            onSelect={selectGraphic}
                          />
                        );
                      },
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}

        {!loading && !error && isSubtypeGrid && !activeSubtypeSection && (
          <EmptyState
            message="This subtype is no longer available. Go back and choose another subtype."
          />
        )}

        {!loading && !error && isSubtypeGrid && activeSubtypeSection && (
          <div className="grid grid-cols-2 justify-items-center gap-3 pb-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {activeSubtypeSection.items.map((graphic) => {
              const key = getEditorGraphicSelectionKey(
                graphic,
                graphic?._template?.id,
              );
              return (
                <ShowcaseCard
                  key={key}
                  graphic={graphic}
                  selected={selectedGraphicKey === key}
                  onSelect={selectGraphic}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
