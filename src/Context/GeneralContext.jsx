import { createContext, useContext, useState, useEffect, useMemo } from "react";
const DataContextGen = createContext();

function GeneralContext({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );
  const [selType, setSelType] = useState({});
  useEffect(() => {
    const html = document.documentElement;
    html.className = theme;
    html.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const theame_color = "#0088DA";
  const [cachedTemplates, setCachedTemplates] = useState([]);
  const [cachedGroupIndex, setCachedGroupIndex] = useState(0);
  const [cachedFestivalData, setCachedFestivalData] = useState({});
  const [cachedTrending, setCachedTrending] = useState(null);

  // Cache for AllTemplates page: key = type string, value = { templates, lastDoc, hasMore }
  const [allTemplatesCache, setAllTemplatesCache] = useState({});

  // New-templates notification badge
  // true when templates with a higher serial than last seen have been loaded
  const [hasNewTemplates, setHasNewTemplates] = useState(false);

  const contextValue = useMemo(
    () => ({
      theme,
      toggleTheme,
      theame_color,
      setSelType,
      selType,
      cachedFestivalData,
      setCachedFestivalData,
      cachedTemplates,
      setCachedTemplates,
      cachedGroupIndex,
      setCachedGroupIndex,
      cachedTrending,
      setCachedTrending,
      allTemplatesCache,
      setAllTemplatesCache,
      hasNewTemplates,
      setHasNewTemplates,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      theme,
      selType,
      cachedFestivalData,
      cachedTemplates,
      cachedGroupIndex,
      cachedTrending,
      allTemplatesCache,
      hasNewTemplates,
    ],
  );

  return (
    <DataContextGen.Provider value={contextValue}>
      {children}
    </DataContextGen.Provider>
  );
}

const useGeneralData = () => {
  return useContext(DataContextGen);
};

export { GeneralContext, useGeneralData };
