const HOME_PATH = "/";
const ALL_TEMPLATES_PATH = "/alltemp";

export function getPersistentPageScrollKey(pathname, search = "") {
  if (pathname === HOME_PATH) return HOME_PATH;
  if (pathname === ALL_TEMPLATES_PATH) {
    return `${ALL_TEMPLATES_PATH}${search || ""}`;
  }
  return null;
}

export function shouldResetPersistentPageScroll(
  previousPathname,
  previousSearch,
  pathname,
  search,
) {
  const previousKey = getPersistentPageScrollKey(
    previousPathname,
    previousSearch,
  );
  const nextKey = getPersistentPageScrollKey(pathname, search);

  if (!nextKey?.startsWith(ALL_TEMPLATES_PATH)) return false;

  const opensCategoryFromHome =
    previousKey === HOME_PATH && nextKey === ALL_TEMPLATES_PATH;
  const opensSubtypeFromCategory =
    previousKey === ALL_TEMPLATES_PATH &&
    nextKey.startsWith(`${ALL_TEMPLATES_PATH}?`);

  return opensCategoryFromHome || opensSubtypeFromCategory;
}

export function getPersistentPageScrollTop({
  previousPathname,
  previousSearch = "",
  pathname,
  search = "",
  positions = {},
}) {
  const nextKey = getPersistentPageScrollKey(pathname, search);
  if (!nextKey) return null;

  if (
    shouldResetPersistentPageScroll(
      previousPathname,
      previousSearch,
      pathname,
      search,
    )
  ) {
    return 0;
  }

  const storedTop = Number(positions[nextKey]);
  return Number.isFinite(storedTop) && storedTop > 0 ? storedTop : 0;
}
