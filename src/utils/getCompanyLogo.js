import logoData from "../data/logolocalcdn.json";

export function getLocalLogo(companyId) {
  if (!companyId) return null;
  const company = logoData?.map((i)=> i).find((i) => i.ID === `${companyId}`);
  if (!company) return null;
  return company?.logos || null;
}