import { Button } from "@heroui/react";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { db } from "@firebase-config";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router";
import { RefreshCw, Search, X } from "lucide-react";
import { COLLECTIONS } from "../../collections";
import { useSelectedCompany } from "../../Context/SelectedCompanyContext";
import { getCompanyLogoUrl } from "../../utils/getCompanyLogo";
import {
  COMPANY_BATCH_SIZE,
  filterCompaniesByName,
  getCompanyBatch,
  getNextCompanyCount,
  normalizeCompanySearch,
} from "./companyListUtils";

const COMPANY_CACHE_TTL_MS = 5 * 60 * 1000;
let companyDirectoryCache = null;
let companyDirectoryRequest = null;

const normalizeCompany = (companyDoc) => {
  const data = companyDoc.data();
  const name = data?.name || "";
  return {
    id: companyDoc.id,
    name,
    searchKey: normalizeCompanySearch(name),
    address: data?.address || "",
    owner: data?.owner || "",
    designation: data?.profile || [],
    logos: data?.logos || [],
    topuplines: data?.topuplines || [],
    Plans: data?.Plans || [],
    profile: data?.profile || [],
    active: data?.active ?? false,
    launched: data?.launched ?? false,
  };
};

async function fetchCompanyDirectory({ force = false } = {}) {
  const now = Date.now();
  if (
    !force &&
    companyDirectoryCache &&
    now - companyDirectoryCache.loadedAt < COMPANY_CACHE_TTL_MS
  ) {
    return companyDirectoryCache.companies;
  }

  // React StrictMode and quick remounts share one Firestore request.
  if (companyDirectoryRequest) return companyDirectoryRequest;

  const request = getDocs(collection(db, COLLECTIONS.MLMCOMP))
    .then((snapshot) => {
      const companies = snapshot.docs
        .map(normalizeCompany)
        .filter((company) => company.active && company.launched)
        .sort((a, b) => b.name.localeCompare(a.name, undefined, {
          sensitivity: "base",
          numeric: true,
        }));
      companyDirectoryCache = { companies, loadedAt: Date.now() };
      return companies;
    })
    .finally(() => {
      if (companyDirectoryRequest === request) companyDirectoryRequest = null;
    });

  companyDirectoryRequest = request;
  return request;
}

export default function SelectComp() {
  const navigate = useNavigate();
  const { selectCompany } = useSelectedCompany();

  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [visibleCount, setVisibleCount] = useState(COMPANY_BATCH_SIZE);
  const [savingSelection, setSavingSelection] = useState(false);
  const loadMoreRef = useRef(null);
  const mountedRef = useRef(false);
  const requestVersionRef = useRef(0);
  const deferredSearch = useDeferredValue(search);

  const loadCompanies = useCallback(async ({ force = false } = {}) => {
    const requestVersion = ++requestVersionRef.current;
    setLoading(true);
    setLoadError("");
    try {
      const data = await fetchCompanyDirectory({ force });
      if (!mountedRef.current || requestVersion !== requestVersionRef.current) {
        return;
      }
      setCompanies(data);
      setSelectedCompany((current) => {
        if (!current) return null;
        return data.find((company) => company.id === current.id) || null;
      });
    } catch (error) {
      if (!mountedRef.current || requestVersion !== requestVersionRef.current) {
        return;
      }
      setLoadError("Unable to load companies. Please check your connection and retry.");
    } finally {
      if (mountedRef.current && requestVersion === requestVersionRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void loadCompanies();
    return () => {
      mountedRef.current = false;
      requestVersionRef.current += 1;
    };
  }, [loadCompanies]);

  const filteredCompanies = useMemo(() => {
    return filterCompaniesByName(companies, deferredSearch);
  }, [companies, deferredSearch]);

  const visibleCompanies = useMemo(
    () => getCompanyBatch(filteredCompanies, visibleCount),
    [filteredCompanies, visibleCount],
  );
  const hasMore = visibleCompanies.length < filteredCompanies.length;

  useEffect(() => {
    setVisibleCount(COMPANY_BATCH_SIZE);
    setSelectedCompany((current) => {
      if (!current) return null;
      return filteredCompanies.some((company) => company.id === current.id)
        ? current
        : null;
    });
  }, [filteredCompanies]);

  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return;
    const sentinel = loadMoreRef.current;
    const scrollRoot = sentinel.closest(".mlm-main-scroll-container");
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisibleCount((current) =>
          getNextCompanyCount(current, filteredCompanies.length),
        );
      },
      { root: scrollRoot, rootMargin: "320px 0px", threshold: 0.01 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredCompanies.length, hasMore]);

  const handleRefresh = useCallback(async () => {
    if (loading) return;
    await loadCompanies({ force: true });
  }, [loadCompanies, loading]);

  const handleSelect = useCallback((company) => {
    setSelectedCompany((prev) =>
      prev?.id === company.id ? null : company
    );
  }, []);

  const handleContinue = useCallback(async () => {
    if (!selectedCompany) {
      alert("Please select a company");
      return;
    }
    try {
      setSavingSelection(true);
      await selectCompany(selectedCompany);
      navigate("/");
    } catch (error) {
      alert("Unable to save your company. Please try again.");
    } finally {
      setSavingSelection(false);
    }
  }, [navigate, selectCompany, selectedCompany]);

  const getLogo = (company) => {
    return (
      getCompanyLogoUrl(company) ||
      "https://ui-avatars.com/api/?background=random&color=fff&name=" +
        encodeURIComponent(company.name)
    );
  };

  return (
    <div className="flex flex-col bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none" />

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 md:py-12 flex flex-col relative z-10">

        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-foreground font-display">Select Your Company</h1>
          <p className="font-medium text-muted-foreground">Choose your MLM organization to get started</p>
        </div>

        <div className="w-full max-w-xl mx-auto mb-10">
          <div className="flex items-stretch gap-2">

            <div className="relative group min-w-0 flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-accent transition-colors" />
              </div>
              <input
                type="text"
                className="w-full h-14 pl-12 pr-12 rounded-2xl border border-border bg-white dark:bg-black/20 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all shadow-sm font-medium text-foreground text-base placeholder:text-muted-foreground"
                placeholder="Search companies by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
                inputMode="search"
                aria-label="Search companies by name"
              />
              
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear company search"
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              aria-label="Refresh company list"
              title="Refresh company list"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-accent shadow-sm transition-all hover:bg-accent/10 active:scale-90 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {!loading && companies.length > 0 && (
            <p className="mt-2 px-1 text-right text-[11px] font-medium text-muted-foreground">
              {filteredCompanies.length} {filteredCompanies.length === 1 ? "company" : "companies"}
            </p>
          )}
          {loadError && companies.length > 0 && (
            <p className="mt-2 px-1 text-center text-xs font-medium text-danger">
              Refresh failed. Showing the last available company list.
            </p>
          )}
        </div>

        <div className="flex-1 w-full pb-5">
          {loading && companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-muted border-t-accent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground font-medium">Loading companies...</p>
            </div>
          ) : loadError && companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="max-w-sm text-sm font-medium text-danger">{loadError}</p>
              <button
                type="button"
                onClick={() => loadCompanies({ force: true })}
                className="mt-4 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white"
              >
                Retry
              </button>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-display font-bold text-foreground">No companies found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {visibleCompanies?.map((item, index) => {
                const isSelected = selectedCompany?.id === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    aria-pressed={isSelected}
                    className={`relative flex flex-col items-center gap-3 p-4 rounded-[24px] cursor-pointer transition-all duration-300 transform active:scale-95 border bg-white dark:bg-black/20 ${
                      isSelected
                        ? "ring-1 ring-accent ring-offset-2 dark:ring-offset-background shadow-lg scale-105 z-10"
                        : "border-border shadow-sm hover:shadow-md hover:border-accent/50"
                    }`}
                  >
                    <div className={`w-20 h-20 rounded-2xl overflow-hidden bg-white p-1 shadow-sm transition-all duration-300 ${isSelected ? "p-0" : ""}`}>
                      <img
                        className="w-full h-full object-contain rounded-xl"
                        src={getLogo(item)}
                        alt={item.name}
                        loading={index < 6 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={index < 4 ? "high" : "auto"}
                        onError={(event) => {
                          if (event.currentTarget.dataset.fallback === "1") return;
                          event.currentTarget.dataset.fallback = "1";
                          event.currentTarget.src =
                            "https://ui-avatars.com/api/?background=0e245c&color=fff&name=" +
                            encodeURIComponent(item.name || "Company");
                        }}
                      />
                    </div>

                    <p className={`font-display font-bold text-center text-sm line-clamp-2 leading-tight transition-colors ${
                      isSelected ? "text-accent" : "text-foreground"
                    }`}>
                      {item?.name || "Unnamed Company"}
                    </p>

                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-md animate-in zoom-in duration-200">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {hasMore && (
            <div
              ref={loadMoreRef}
              className="flex h-16 items-center justify-center"
              aria-label="Loading more companies"
            >
              <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-muted border-t-accent" />
            </div>
          )}
        </div>

        {/* Contact Us Banner */}
        <div className="w-full max-w-xl mx-auto mb-4">
  <div className="flex flex-col items-center gap-2 bg-accent/5 border border-accent/15 rounded-2xl px-5 py-4 text-center">
    <p className="text-sm font-bold text-foreground">
      अपना Company Add करवाना चाहते है तो संपर्क करे।
    </p>
    <p className="text-xs text-muted-foreground">
      Want to add your company? Contact Us
    </p>
    <a
      href="https://wa.me/919341947815"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 inline-flex items-center gap-2 h-10 px-5 rounded-xl font-bold text-sm text-white"
      style={{
        background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
        touchAction: "manipulation",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      WhatsApp पर संपर्क करें
    </a>
  </div>
</div>

        {/* Floating Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-background via-background to-transparent z-50 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <Button
              onClick={handleContinue}
              disabled={!selectedCompany || savingSelection}
              className={`w-full h-14 rounded-2xl font-bold text-lg shadow-xl transition-all duration-300 ${
                selectedCompany
                  ? "bg-accent text-white shadow-accent/30 hover:bg-accent/90 transform translate-y-0"
                  : "bg-muted text-muted-foreground opacity-90 translate-y-2 pointer-events-none"
              }`}
            >
              {savingSelection
                ? "Saving securely..."
                : selectedCompany
                  ? "Continue"
                  : "Select a Company"}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
