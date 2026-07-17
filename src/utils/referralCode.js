const PENDING_REFERRAL_STORAGE_KEY = "mlmlive.pendingReferralCode";
const REFERRAL_QUERY_KEYS = ["ref", "referCode", "referralCode"];

export function normalizeReferralCode(value) {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 8);
}

export function getReferralCodeFromSearch(search = "") {
  const params = new URLSearchParams(search);

  for (const key of REFERRAL_QUERY_KEYS) {
    const code = normalizeReferralCode(params.get(key));
    if (code) return code;
  }

  return "";
}

export function getPendingReferralCode() {
  try {
    return normalizeReferralCode(
      window.localStorage.getItem(PENDING_REFERRAL_STORAGE_KEY),
    );
  } catch {
    return "";
  }
}

export function savePendingReferralCode(value) {
  const code = normalizeReferralCode(value);
  if (!code) return "";

  try {
    window.localStorage.setItem(PENDING_REFERRAL_STORAGE_KEY, code);
  } catch {
    // WebView storage can be unavailable in restricted/private mode.
  }

  return code;
}

export function clearPendingReferralCode() {
  try {
    window.localStorage.removeItem(PENDING_REFERRAL_STORAGE_KEY);
  } catch {
    // Nothing else to clear.
  }
}

export function notifyNativeReferralCleared(type = "REFERRAL_CODE_CLEARED") {
  if (typeof window === "undefined") return;

  try {
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({ type }),
    );
  } catch {
    // The web app may be running outside the React Native WebView.
  }
}

export function getReferralCodeFromBridgeMessage(rawMessage) {
  let message = rawMessage;

  if (typeof rawMessage === "string") {
    try {
      message = JSON.parse(rawMessage);
    } catch {
      return "";
    }
  }

  if (!message || typeof message !== "object") return "";

  const supportedTypes = new Set([
    "REFERRAL_CODE",
    "SET_REFERRAL_CODE",
    "MLMLIVE_REFERRAL_CODE",
  ]);

  if (!supportedTypes.has(message.type)) return "";

  return normalizeReferralCode(
    message.referralCode ?? message.referCode ?? message.code,
  );
}

export function createPlayStoreReferralLink(referCode) {
  const code = normalizeReferralCode(referCode);
  const playStoreUrl = new URL(
    "https://play.google.com/store/apps/details?id=com.mlmbooster.mlmbooster",
  );

  if (code) {
    playStoreUrl.searchParams.set(
      "referrer",
      new URLSearchParams({ ref: code }).toString(),
    );
  }

  return playStoreUrl.toString();
}
