import {
  EVERYDAY_MOMENTS_GROUP_KEY,
  isEverydayMomentType,
} from "./everydayMoments.js";

export function getAllTemplatesGroup(search = "") {
  try {
    return new URLSearchParams(search).get("group") || "";
  } catch {
    return "";
  }
}

export function getAllTemplatesType(search = "") {
  try {
    return new URLSearchParams(search).get("type") || "";
  } catch {
    return "";
  }
}

export function getAllTemplatesSubtype(search = "") {
  try {
    return new URLSearchParams(search).get("subtype") || "";
  } catch {
    return "";
  }
}

export function buildEverydayMomentsAllTemplatesPath() {
  const params = new URLSearchParams();
  params.set("group", EVERYDAY_MOMENTS_GROUP_KEY);
  return `/alltemp?${params.toString()}`;
}

export function buildAllTemplatesSubtypePath(
  subtype,
  { group = "", type = "" } = {},
) {
  const params = new URLSearchParams();
  if (group) params.set("group", String(group));
  if (type) params.set("type", String(type));
  params.set("subtype", String(subtype || ""));
  return `/alltemp?${params.toString()}`;
}

export function getAllTemplatesBackTarget(search = "") {
  const group = getAllTemplatesGroup(search);
  if (group === EVERYDAY_MOMENTS_GROUP_KEY) {
    return getAllTemplatesSubtype(search)
      ? buildEverydayMomentsAllTemplatesPath()
      : "/";
  }
  return getAllTemplatesSubtype(search) ? "/alltemp" : "/";
}

export function buildAllTemplatesReturnPath(search = "") {
  const group = getAllTemplatesGroup(search);
  const subtype = getAllTemplatesSubtype(search);
  const type = getAllTemplatesType(search);

  if (group === EVERYDAY_MOMENTS_GROUP_KEY) {
    if (subtype && isEverydayMomentType(type)) {
      return buildAllTemplatesSubtypePath(subtype, { group, type });
    }
    return buildEverydayMomentsAllTemplatesPath();
  }

  return subtype ? buildAllTemplatesSubtypePath(subtype) : "/alltemp";
}

export function isValidAllTemplatesReturnPath(target) {
  if (target === "/alltemp") return true;
  if (
    typeof target !== "string" ||
    !target.startsWith("/alltemp?") ||
    target.includes("#")
  ) {
    return false;
  }

  try {
    const params = new URLSearchParams(target.slice(target.indexOf("?")));
    const allowedKeys = new Set(["group", "type", "subtype"]);
    if (Array.from(params.keys()).some((key) => !allowedKeys.has(key))) {
      return false;
    }

    const group = params.get("group") || "";
    const type = params.get("type") || "";
    const subtype = params.get("subtype") || "";

    if (!group) return Boolean(subtype) && !type;
    if (group !== EVERYDAY_MOMENTS_GROUP_KEY) return false;
    if (!subtype) return !type;
    return isEverydayMomentType(type);
  } catch {
    return false;
  }
}
