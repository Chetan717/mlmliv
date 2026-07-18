import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useGeneralData } from "../../../Context/GeneralContext";
import { useNavigate } from "react-router";
import { ArrowUpRight, Sparkles } from "@gravity-ui/icons";
import {
  preloadImage,
  markImageSeen,
  seenImages,
  isNewTemplate,
} from "./templateCacheUtils";
import profileCreate from "../../../../public/prcrete.png";
import { hasMlmProfileInStorage } from "../../../utils/companyStorage";
import { useSelectedCompany } from "../../../Context/SelectedCompanyContext";

const ImageWithSkeleton = React.memo(({ src, alt, className }) => {
  const alreadySeen = seenImages.has(src);
  const [loaded, setLoaded] = useState(alreadySeen);
  return (
    // bg-muted/50 persists so there is never a white blank — not even when
    // the browser is pulling an already-seen image out of disk cache.
    <div className="relative w-full h-full bg-muted/50">
      {!loaded && (
        <div className="absolute inset-0 bg-muted/50 rounded-xl overflow-hidden">
          <div className="absolute inset-0 shimmer-bar" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loaded ? "opacity-100" : "opacity-0"}`}
        style={loaded ? undefined : { transition: "opacity 0.15s" }}
        decoding="auto"
        onLoad={() => {
          markImageSeen(src);
          setLoaded(true);
        }}
      />
    </div>
  );
});

function CreateProfileModal({ onConfirm, onDismiss }) {
  return (
    <div
      className="fixed inset-0 z-70 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="bg-[#d4e4f8] w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl p-6 pb-10 sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={profileCreate}
          alt="create profile"
          className={` rounded-xl`}
          decoding="auto"
        />
        <button
          onClick={onConfirm}
          className="w-full py-3.5 mt-5 rounded-2xl text-white font-bold text-[14px] shadow-lg shadow-accent/20 "
          style={{
            background: "linear-gradient(135deg, #0088DA 0%, #0088DA 100%)",
          }}
        >
          Create Profile →
        </button>
        <button
          onClick={onDismiss}
          className="w-full py-2 mt-2 text-[12px] font-medium text-muted-foreground text-center"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

function DesignationSelectModal({
  designations,
  loading,
  onSelect,
  onDismiss,
}) {
  const [search, setSearch] = useState("");
  const list = Array.isArray(designations) ? designations : [];
  const filteredList = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return list;

    return list.filter((item) => {
      const name = String(item?.profilename || item?.name || "").toLowerCase();
      return name.includes(query);
    });
  }, [list, search]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-3 sm:px-0"
      onClick={onDismiss}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-border bg-background shadow-2xl p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Select Rank
            </h3>
            <p className="text-sm text-muted-foreground">
              Choose the Rank for this banner.
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-sm font-medium text-muted-foreground"
          >
            Close
          </button>
        </div>

        <div className="mb-3">
          <label className="sr-only" htmlFor="designation-search">
            Search designation
          </label>
          <input
            id="designation-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search designation"
            className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none ring-0 placeholder:text-muted-foreground"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              Loading designations…
            </div>
          ) : filteredList.length > 0 ? (
            filteredList.map((item, index) => {
              const designationName =
                item?.profilename || item?.name || `Designation ${index + 1}`;
              const designationImage = item?.profileimage || item?.image || "";

              return (
                <button
                  key={`${designationName}-${index}`}
                  onClick={() =>
                    onSelect({
                      name: designationName,
                      image: designationImage,
                      profilename: designationName,
                      profileimage: designationImage,
                    })
                  }
                  className="w-full flex items-center gap-3 rounded-2xl border border-border bg-white/70 dark:bg-black/20 px-3 py-3 text-left shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {designationName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tap to use this designation
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              No designations found for this company.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function normalizeCompanyDesignations(company) {
  const source = [
    company?.profile,
    company?.designation,
    company?.designations,
    company?.ranks,
  ].find(Array.isArray) || [];

  return source
    .map((item) => {
      if (typeof item === "string") {
        const name = item.trim();
        return name
          ? { name, image: "", profilename: name, profileimage: "" }
          : null;
      }

      const name = String(
        item?.profilename ||
          item?.name ||
          item?.designation ||
          item?.rankName ||
          "",
      ).trim();
      const image = String(
        item?.profileimage || item?.image || item?.rankImage || "",
      ).trim();

      return name
        ? { ...item, name, image, profilename: name, profileimage: image }
        : null;
    })
    .filter(Boolean);
}

const GENERAL_SELECT_TYPES = new Set([
  "Trending",
  "Festival",
  "Motivational",
  "Good_Morning",
  "Sport",
  "Daily_Life",
  "Devotional_Spiritual",
  "Leader_Quotes",
  "Health_Tips",
  "Greeting_Wishes",
  "ThankYou_Banner_B",
  "ThankYou_Birthday_Anniversary",
]);

const GRID_TYPES = new Set([
  "Welcome_Closing",
  "Anniversary_Birthday",
  "ThankYou_Banner_B",
  "ThankYou_Birthday_Anniversary",
]);
const FULL_TYPES = new Set(["Capping"]);
const CIRCLE_TYPES = new Set(["Today_Trending"]);

const SkeletonCard = React.memo(() => (
  <div className="rounded-2xl overflow-hidden bg-muted aspect-square w-full relative border border-border">
    <div className="absolute inset-0 shimmer-bar" />
  </div>
));

const CheckIcon = ({ size = "sm" }) => {
  const dim = size === "sm" ? "w-5 h-5" : "w-6 h-6";
  const icon = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  return (
    <div
      className={`absolute top-2 right-2 ${dim} bg-accent rounded-full flex items-center justify-center shadow-md`}
    >
      <svg
        className={`${icon} text-white`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
};

const NewBadge = () => (
  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500 shadow-md pointer-events-none">
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-70" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
    </span>
    <span className="text-[8px] font-bold text-white uppercase tracking-wide leading-none">
      New
    </span>
  </div>
);

function ListOfGenaraltemp({ templates, loading, searchQuery, companyName }) {
  const { selectedCompany, refreshCompany } = useSelectedCompany();
  const [selectedTemp, setSelectedTemp] = useState(null);
  const [profileModalPending, setProfileModalPending] = useState(null);
  const [designationModalPending, setDesignationModalPending] = useState(null);
  const [designationOptions, setDesignationOptions] = useState([]);
  const [designationLoading, setDesignationLoading] = useState(false);
  const navigate = useNavigate();
  const { selType: contextSelType, setSelType } = useGeneralData();

  const selType = useMemo(() => {
    if (contextSelType?.type) {
      return contextSelType;
    }
    try {
      const stored = localStorage.getItem("selType");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [contextSelType]);

  // Sync selType to localStorage as a side-effect, not inside useMemo
  useEffect(() => {
    if (contextSelType?.type) {
      try {
        localStorage.setItem("selType", JSON.stringify(contextSelType));
      } catch {}
    }
  }, [contextSelType]);

  useEffect(() => {
    if (!templates) return;
    templates.forEach((group) => {
      group.templates?.forEach((item) => preloadImage(item.image));
    });
  }, [templates]);

  const handleViewAll = useCallback(
    (group) => {
      const selttype = {
        MainType: group?.MainType || "General",
        type: group.type,
        id: group.templates?.[0]?.id,
        serial: group.templates?.[0]?.serial,
        ShowCaseForm: group.templates?.[0]?.ShowCaseForm,
        Subtype: group.templates?.[0]?.Subtype,
      };
      setSelType(selttype);
      navigate("/alltemp");
    },
    [navigate, setSelType],
  );

  const handleReset = useCallback(() => {
    const mlmProfile = JSON.parse(sessionStorage.getItem("mlmProfile"));
    const formDAta = {
      tab: "team",
      achiever: {
        title: ".",
        name: "",
        achieverName: "",
        city: "",
        amount: "",
        image: "",
      },
      promoter: null,
      selectedLinks: mlmProfile?.topuplineURLs || [],
    };
    localStorage.setItem("mlmform", JSON.stringify(formDAta));
  }, []);

  const prepareEditorTemplate = useCallback(
    (item, selttype) => {
      const graphics = Array.isArray(item?.GraphicsLink)
        ? item.GraphicsLink.filter(Boolean).slice(0, 20)
        : [];

      if (graphics.length === 0) {
        sessionStorage.removeItem("editorTemplateSeed");
        return;
      }

      try {
        sessionStorage.setItem(
          "editorTemplateSeed",
          JSON.stringify({
            mainType: selttype.MainType || "",
            type: selttype.type || "",
            subType: selttype.Subtype || "",
            templateId: item?.id || "",
            serial: item?.serial || 0,
            companyId: selectedCompany?.id || "",
            items: graphics,
          }),
        );
      } catch {
        sessionStorage.removeItem("editorTemplateSeed");
      }

      // Begin downloading the first canvas background before navigation. The
      // editor's useImage request will reuse the browser cache.
      const firstImage = graphics.find(
        (graphic) => !graphic?.backgroundVideoUrl && graphic?.url,
      );
      if (firstImage?.url) preloadImage(firstImage.url);
    },
    [selectedCompany?.id],
  );

  const proceedWithTemplateSelection = useCallback(
    (selttype, designationSelection) => {
      if (designationSelection) {
        localStorage.setItem(
          "SelectedDesignation",
          JSON.stringify({
            name:
              designationSelection?.name ||
              designationSelection?.profilename ||
              "",
            image:
              designationSelection?.image ||
              designationSelection?.profileimage ||
              "",
            profilename:
              designationSelection?.profilename ||
              designationSelection?.name ||
              "",
            profileimage:
              designationSelection?.profileimage ||
              designationSelection?.image ||
              "",
          }),
        );
      } else {
        localStorage.removeItem("SelectedDesignation");
      }

      if (hasMlmProfileInStorage()) {
        navigate(
          GENERAL_SELECT_TYPES.has(selttype.type)
            ? "/editor"
            : CIRCLE_TYPES?.has(selttype.type)
              ? "/editor"
              : "/mlmform",
        );
      } else {
        setProfileModalPending(selttype);
      }
    },
    [navigate],
  );

  const handleImagePress = useCallback(
    (item) => {
      setSelectedTemp(item);
      handleReset();
      const selttype = {
        MainType: item?.MainType || item?.MainType,
        id: item.id,
        type: item.type,
        serial: item.serial,
        ShowCaseForm: item.ShowCaseForm,
        Subtype: item.Subtype,
      };
      localStorage.removeItem("achieve_form");
      setSelType(selttype);
      localStorage.setItem("selType", JSON.stringify(selttype));
      prepareEditorTemplate(item, selttype);

      if (selttype.type === "ThankYou_Banner_B") {
        setDesignationModalPending(selttype);
        return;
      }

      proceedWithTemplateSelection(selttype);
    },
    [handleReset, prepareEditorTemplate, proceedWithTemplateSelection, setSelType],
  );

  // Refresh the authenticated user's company document when the designation
  // picker opens so backend changes are reflected immediately. Cached ranks
  // remain visible during refresh, and this effect intentionally depends only
  // on the company ID so refreshCompany() cannot trigger a refresh loop.
  useEffect(() => {
    if (!designationModalPending) return;

    let cancelled = false;
    const cachedDesignations = normalizeCompanyDesignations(selectedCompany);
    setDesignationOptions(cachedDesignations);
    setDesignationLoading(cachedDesignations.length === 0);

    const loadFreshDesignations = async () => {
      try {
        const company = await refreshCompany();
        if (cancelled) return;

        const freshDesignations = normalizeCompanyDesignations(company);
        if (freshDesignations.length > 0 || cachedDesignations.length === 0) {
          setDesignationOptions(freshDesignations);
        }
      } catch {
        // Keep the already loaded company ranks when an online refresh fails.
      } finally {
        if (!cancelled) setDesignationLoading(false);
      }
    };

    loadFreshDesignations();

    return () => {
      cancelled = true;
    };
  }, [designationModalPending, refreshCompany, selectedCompany?.id]);

  if (loading && (!templates || templates.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-muted border-t-accent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-medium tracking-wide animate-pulse">
          Loading beautiful templates...
        </p>
      </div>
    );
  }

  const noResults = searchQuery && templates?.length === 0;

  return (
    <div className="flex flex-col w-full pb-8">
      {noResults && (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-muted/40 border border-border flex items-center justify-center mb-4">
            <svg
              className="w-7 h-7 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <p className="text-base font-bold text-foreground mb-1">
            No templates found
          </p>
          <p className="text-sm text-muted-foreground">
            Try a different keyword
          </p>
        </div>
      )}

      {templates?.map((group) => {
        const isGrid = GRID_TYPES.has(group.type);
        const isFull = FULL_TYPES.has(group.type);
        const isCircle = CIRCLE_TYPES.has(group.type);

        if (!group?.templates || group.templates.length === 0) return null;

        const displayName =
          group.type === "ThankYou_Banner_B"
            ? "Thank You Rank & Bonanza"
            : group.type === "Training"
              ? "Training Seat Booking"
              : group.type.replaceAll("_", " ");

        return (
          <div key={group.type} className="w-full mb-5">
            {isCircle && (
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="w-1.5 h-6 rounded-full bg-accent" />
                <h2 className="text-lg font-display font-bold text-foreground">
                  {`${companyName} ${displayName}`}
                </h2>
              </div>
            )}
            {!isGrid && !isCircle && (
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 rounded-full bg-accent" />
                  <h2 className="text-lg font-display font-bold text-foreground">
                    {`${displayName}`}
                  </h2>
                </div>
                <button
                  onClick={() => handleViewAll(group)}
                  className="flex items-center gap-1 text-xs font-bold text-accent dark:text-white bg-accent/10 dark:bg-white/10 px-3 py-1.5 rounded-full"
                >
                  View All
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {isFull ? (
              <div className="grid grid-cols-1 gap-4">
                {group?.templates?.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleImagePress(item)}
                    className={`relative rounded-2xl overflow-hidden cursor-pointer group border bg-white dark:bg-black/20 card-press ${
                      selectedTemp?.id === item?.id
                        ? " dark:ring-offset-[#0b0f19] shadow-md"
                        : "border-border shadow-sm"
                    }`}
                  >
                    <div className="w-full aspect-[2/1] overflow-hidden">
                      <ImageWithSkeleton
                        src={item.image}
                        className="w-full h-full object-cover"
                        alt={item.Subtype || displayName}
                      />
                    </div>
                    {isNewTemplate(item.serial) && <NewBadge />}
                  </div>
                ))}
              </div>
            ) : null}

            {isFull ? null : isGrid ? (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4 px-1">
                  <div className="w-1.5 h-6 rounded-full bg-accent" />
                  <h2 className="text-lg font-display font-bold text-foreground">
                    {displayName}
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {group?.templates?.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleImagePress(item)}
                      className={`relative rounded-2xl overflow-hidden cursor-pointer group border bg-white dark:bg-black/20 card-press ${
                        selectedTemp?.id === item?.id
                          ? "dark:ring-offset-[#0b0f19] shadow-md"
                          : "border-border shadow-sm"
                      }`}
                    >
                      <div className="w-full aspect-[3/2] overflow-hidden">
                        <ImageWithSkeleton
                          src={item.image}
                          className="w-full h-full object-cover"
                          alt={item.Subtype || displayName}
                        />
                      </div>
                      {isNewTemplate(item.serial) && <NewBadge />}
                    </div>
                  ))}
                </div>
              </div>
            ) : isCircle ? (
              /* ── Instagram-story style circles ── */
              <div className="flex gap-4 overflow-x-auto pb-2 pt-1 px-2 hide-scrollbar snap-x scroll-gpu">
                {group?.templates?.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleImagePress(item)}
                    className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 snap-start card-press"
                    style={{ width: 72 }}
                  >
                    {/* Gradient story ring */}
                    <div
                      className="rounded-full p-[2.5px]"
                      style={{
                        background:
                          selectedTemp?.id === item?.id
                            ? "var(--color-accent)"
                            : "linear-gradient(135deg, #0088DA 0%, #7C3AED 50%, #EC4899 100%)",
                      }}
                    >
                      {/* White gap ring */}
                      <div className="rounded-full p-[2px] bg-background">
                        {/* Circle image */}
                        <div className="w-[60px] h-[60px] rounded-full overflow-hidden relative">
                          <ImageWithSkeleton
                            src={item.image}
                            className="w-full h-full object-cover"
                            alt={item.Subtype || displayName}
                          />
                          {isNewTemplate(item.serial) && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background block" />
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Label */}
                    <p className="text-[10px] font-medium text-foreground/80 text-center leading-tight w-full truncate px-0.5">
                      {item.Subtype || displayName}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              /* ── Default horizontal scroll (non-circle, non-grid, non-full) ── */
              <div className="flex gap-4 overflow-x-auto pb-1 pt-1 px-1 hide-scrollbar snap-x scroll-gpu">
                {group?.templates?.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleImagePress(item)}
                    className="flex-col items-center gap-2 cursor-pointer group shrink-0 snap-start w-[85px] md:w-[140px] card-press"
                  >
                    <div
                      className={`relative rounded-2xl overflow-hidden aspect-square border bg-white dark:bg-black/20 ${
                        selectedTemp?.id === item?.id
                          ? "ring-offset-1 dark:ring-offset-[#0b0f19] shadow-md scale-95"
                          : "border-border shadow-sm"
                      }`}
                    >
                      <ImageWithSkeleton
                        src={item.image}
                        className="w-full h-full object-cover"
                        alt={item.Subtype || displayName}
                      />
                      {isNewTemplate(item.serial) && <NewBadge />}
                    </div>
                    {item.Subtype && (
                      <p className="text-xs font-medium text-foreground/80 text-center truncate px-1 mt-2">
                        {item.Subtype}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {designationModalPending && (
        <DesignationSelectModal
          designations={designationOptions}
          loading={designationLoading}
          onSelect={(designation) => {
            setDesignationModalPending(null);
            proceedWithTemplateSelection(designationModalPending, designation);
          }}
          onDismiss={() => {
            setDesignationModalPending(null);
            localStorage.removeItem("SelectedDesignation");
          }}
        />
      )}

      {profileModalPending && (
        <CreateProfileModal
          onConfirm={() => {
            setProfileModalPending(null);
            navigate("/mlmprofile");
          }}
          onDismiss={() => setProfileModalPending(null)}
        />
      )}

      {!searchQuery && (
        <div className="mt-8 w-full bg-gradient-to-br from-accent/5 to-indigo-500/5 dark:from-accent/10 dark:to-indigo-500/10 border border-accent/10 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-accent/10">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <h3 className="font-display font-bold text-foreground mb-1">
            More templates coming soon
          </h3>
          <p className="text-sm text-muted-foreground">
            We're constantly adding new designs to help your business grow.
          </p>
        </div>
      )}

      {loading && templates?.length > 0 && (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-muted border-t-accent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export default ListOfGenaraltemp;
