export function getAllTemplatesSubtype(search = "") {
  try {
    return new URLSearchParams(search).get("subtype") || "";
  } catch {
    return "";
  }
}

export function buildAllTemplatesSubtypePath(subtype) {
  const params = new URLSearchParams();
  params.set("subtype", String(subtype || ""));
  return `/alltemp?${params.toString()}`;
}

export function getAllTemplatesBackTarget(search = "") {
  return getAllTemplatesSubtype(search) ? "/alltemp" : "/";
}

export function buildAllTemplatesReturnPath(search = "") {
  const subtype = getAllTemplatesSubtype(search);
  return subtype ? buildAllTemplatesSubtypePath(subtype) : "/alltemp";
}
