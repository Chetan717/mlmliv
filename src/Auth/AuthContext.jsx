import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { auth } from "@firebase-config";
import {
  clearLegacyAuthStorage,
  clearCachedPii,
  clearPersistedFirebaseAuthStorage,
  hasLegacyAuthStorage,
  hasPersistedFirebaseAuthStorage,
  setVerifiedUser,
} from "../utils/authStorage";

const AuthContext = createContext({
  user: null,
  identity: null,
  loading: true,
});

function mobileFromVerifiedIdentity(firebaseUser, claims) {
  const candidates = [
    firebaseUser?.phoneNumber,
    claims?.mobileNo,
    claims?.mobile,
    claims?.phone_number,
  ];

  for (const candidate of candidates) {
    const digits = String(candidate || "").replace(/\D/g, "");
    if (digits.length >= 10) return digits.slice(-10);
  }

  return null;
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    identity: null,
    loading: true,
  });

  useEffect(() => {
    // One-time security migration: any device carrying the old forgeable
    // browser record must establish a fresh Firebase-authenticated session.
    if (hasLegacyAuthStorage() || hasPersistedFirebaseAuthStorage()) {
      clearCachedPii();
      clearPersistedFirebaseAuthStorage();
      setVerifiedUser(null);
      setState({ user: null, identity: null, loading: true });
      signOut(auth).finally(() => {
        window.location.replace("/login?session_migrated=1");
      });
      return undefined;
    }

    clearLegacyAuthStorage();

    return onIdTokenChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        clearCachedPii();
        setVerifiedUser(null);
        setState({ user: null, identity: null, loading: false });
        return;
      }

      try {
        // Claims come from a Firebase-verified ID token, never browser storage.
        const tokenResult = await firebaseUser.getIdTokenResult();
        const identity = {
          uid: firebaseUser.uid,
          mobileNo: mobileFromVerifiedIdentity(firebaseUser, tokenResult.claims),
          name:
            firebaseUser.displayName ||
            tokenResult.claims?.name ||
            null,
          role: tokenResult.claims?.role || null,
        };

        setVerifiedUser(identity);
        setState({ user: firebaseUser, identity, loading: false });
      } catch (error) {
        // A token that cannot be verified must never unlock protected UI.
        console.error("Unable to verify Firebase session:", error);
        setVerifiedUser(null);
        setState({ user: null, identity: null, loading: false });
      }
    });
  }, []);

  const value = useMemo(() => state, [state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
