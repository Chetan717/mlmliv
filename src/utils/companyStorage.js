import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@firebase-config";
import { COLLECTIONS } from "../collections";

const COMPANY_STORAGE_KEY = "selectedCompany";
const MLM_PROFILE_STORAGE_KEY = "mlmProfile";

const readStoredValue = (key, { sessionOnly = false } = {}) => {
  if (typeof window === "undefined") return null;

  if (!sessionOnly) {
    try {
      const localValue = localStorage.getItem(key);
      if (localValue) return JSON.parse(localValue);
    } catch {
      // ignore
    }
  }

  try {
    const sessionValue = sessionStorage.getItem(key);
    if (sessionValue) return JSON.parse(sessionValue);
  } catch {
    // ignore
  }

  return null;
};

const writeStoredValue = (key, value) => {
  if (typeof window === "undefined") return;

  const serialized = JSON.stringify(value);

  try {
    localStorage.setItem(key, serialized);
  } catch {
    // ignore
  }

  try {
    sessionStorage.setItem(key, serialized);
  } catch {
    // ignore
  }
};

const removeStoredValue = (key) => {
  try { localStorage.removeItem(key); } catch {}
  try { sessionStorage.removeItem(key); } catch {}
};

export const getSelectedCompanyFromStorage = () => {
  const company = readStoredValue(COMPANY_STORAGE_KEY);
  const uid = auth.currentUser?.uid;
  if (!company || !uid || company._selectedByUid !== uid) {
    if (company && uid) removeStoredValue(COMPANY_STORAGE_KEY);
    return null;
  }
  return company;
};

export const saveSelectedCompanyToStorage = (company) => {
  const uid = auth.currentUser?.uid;
  if (!uid || !company?.id) return false;
  writeStoredValue(COMPANY_STORAGE_KEY, {
    ...company,
    _selectedByUid: uid,
  });
  return true;
};

export const hasSelectedCompanyInStorage = () => {
  const company = getSelectedCompanyFromStorage();
  return !!(company && (company.id || company.companyId));
};

export const getMlmProfileFromStorage = () =>
  readStoredValue(MLM_PROFILE_STORAGE_KEY, { sessionOnly: true });

export const saveMlmProfileToStorage = (profile) => {
  if (!profile) return;
  // Remove legacy persistent PII and keep the profile for this tab only.
  try { localStorage.removeItem(MLM_PROFILE_STORAGE_KEY); } catch {}
  try { sessionStorage.setItem(MLM_PROFILE_STORAGE_KEY, JSON.stringify(profile)); } catch {}
};

export const clearMlmProfileStorage = () => {
  try { localStorage.removeItem(MLM_PROFILE_STORAGE_KEY); } catch {}
  try { sessionStorage.removeItem(MLM_PROFILE_STORAGE_KEY); } catch {}
};

export const clearSelectedCompanyStorage = () =>
  removeStoredValue(COMPANY_STORAGE_KEY);

export const clearCompanyProfileStorage = () => {
  clearMlmProfileStorage();
  clearSelectedCompanyStorage();
};

export const hasMlmProfileInStorage = () => {
  const profile = getMlmProfileFromStorage();
  return !!(
    profile &&
    (profile.id ||
      profile.companyId ||
      profile.company_id ||
      profile.mobile ||
      profile.mobileNo ||
      profile.fullName)
  );
};

export const syncSelectedCompanyFromProfile = async ({ force = false } = {}) => {
  try {
    const mlmProfile = getMlmProfileFromStorage();
    const companyId = mlmProfile?.companyId || mlmProfile?.company_id;

    if (!companyId) {
      return { updated: false, reason: "missing-company-id" };
    }

    const currentCompany = getSelectedCompanyFromStorage();
    const currentCompanyId = currentCompany?.id || currentCompany?.companyId;

    const hasUsefulCompanyData =
      currentCompany &&
      (currentCompany?.designation?.length ||
        currentCompany?.profile?.length ||
        currentCompany?.logos?.length ||
        currentCompany?.topuplines?.length);

    if (!force && currentCompanyId === companyId && hasUsefulCompanyData) {
      return { updated: false, reason: "already-synced" };
    }

    const companyRef = doc(db, COLLECTIONS.MLMCOMP || "mlmcomp", companyId);
    const companySnap = await getDoc(companyRef);

    if (!companySnap.exists()) {
      return { updated: false, reason: "company-not-found" };
    }

    const companyData = { id: companySnap.id, ...companySnap.data() };
    saveSelectedCompanyToStorage(companyData);

    return { updated: true, companyData, reason: "fetched" };
  } catch (error) {
    console.error("Failed to sync selected company from profile:", error);
    return { updated: false, reason: "error" };
  }
};
