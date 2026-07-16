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

export const clearCompanyProfileStorage = () => {
  clearMlmProfileStorage();
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
