import logoData from "../data/logolocalcdn.json";

export function getLocalLogo(companyId) {
  if (!companyId) return null;
  const company = logoData?.find((item) => item.ID === `${companyId}`);
  if (!company) return null;
  return company?.logos || null;
}
