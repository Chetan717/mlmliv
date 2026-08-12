import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { db } from "@firebase-config";
import { useAuth } from "../Auth/AuthContext";
import { COLLECTIONS } from "../collections";
import {
  clearCompanyScopedStorage,
  clearMlmProfileStorage,
  saveMlmProfileToStorage,
} from "../utils/companyStorage";
import {
  clearPendingCompanySelection,
  readPendingCompanySelection,
  savePendingCompanySelection,
} from "../utils/companySelectionStorage";
import { invalidateVerifiedMlmProfileCache } from "../utils/mlmProfileVerification";

const SelectedCompanyContext = createContext({
  selectedCompany: null,
  loading: true,
  selectCompany: async () => {},
  refreshCompany: async () => {},
  clearCompanySelection: async () => {},
  deleteProfileAndCompanySelection: async () => {},
});

async function readCompany(companyId) {
  if (!companyId) return null;
  const snapshot = await getDoc(doc(db, COLLECTIONS.MLMCOMP, companyId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export function SelectedCompanyProvider({ children }) {
  const { user, identity, loading: authLoading } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const selectionRequestVersionRef = useRef(0);

  useEffect(() => {
    // Remove the old unscoped object. New pending selections contain only a
    // company id and are namespaced by the Firebase-verified UID.
    try { localStorage.removeItem("selectedCompany"); } catch {}
    try { sessionStorage.removeItem("selectedCompany"); } catch {}
  }, []);

  const loadSelection = useCallback(async () => {
    const requestVersion = ++selectionRequestVersionRef.current;
    if (!user) {
      if (requestVersion === selectionRequestVersionRef.current) {
        setSelectedCompany(null);
        setLoading(false);
      }
      return null;
    }

    setLoading(true);
    try {
      // Profile details intentionally live in sessionStorage only, so closing
      // the app clears the browser copy. Rehydrate it from Firestore before
      // Home/Templates become interactive; otherwise an existing account is
      // incorrectly sent to the Update Profile page on its first template tap.
      let verifiedProfile = null;
      if (identity?.mobileNo) {
        const profileSnapshot = await getDocs(
          query(
            collection(db, COLLECTIONS.MLMPROFILES),
            where("mobile", "==", identity.mobileNo),
          ),
        );
        const profileDoc = profileSnapshot.docs[0];
        if (profileDoc) {
          verifiedProfile = {
            id: profileDoc.id,
            ...profileDoc.data(),
          };
          saveMlmProfileToStorage(verifiedProfile);
        } else {
          clearMlmProfileStorage();
        }
      }

      // A completed MLM profile is the server-backed source of truth. Before
      // the profile exists, keep the chosen public company id locally under
      // the verified UID. This avoids relying on an undeployed Firestore
      // collection while still surviving refreshes and app restarts.
      const profileCompanyId = verifiedProfile?.companyId || null;
      const companyId =
        profileCompanyId || readPendingCompanySelection(user.uid);
      if (profileCompanyId) clearPendingCompanySelection(user.uid);

      const company = await readCompany(companyId);
      if (!company && companyId && !profileCompanyId) {
        clearPendingCompanySelection(user.uid);
      }
      if (requestVersion === selectionRequestVersionRef.current) {
        setSelectedCompany(company);
      }
      return company;
    } catch (error) {
      if (requestVersion === selectionRequestVersionRef.current) {
        setSelectedCompany(null);
      }
      throw error;
    } finally {
      if (requestVersion === selectionRequestVersionRef.current) {
        setLoading(false);
      }
    }
  }, [identity?.mobileNo, user]);

  useEffect(() => {
    if (authLoading) return;
    loadSelection().catch(() => {});
  }, [authLoading, loadSelection]);

  const selectCompany = useCallback(
    async (company) => {
      if (!user?.uid || !company?.id) {
        throw new Error("Authenticated user and company are required.");
      }

      // The company object came from the freshly loaded Firestore directory.
      // Save only its public id; the full document is re-read on app startup.
      savePendingCompanySelection(user.uid, company.id);
      selectionRequestVersionRef.current += 1;
      setSelectedCompany(company);
      return company;
    },
    [user],
  );

  const clearCompanySelection = useCallback(async () => {
    if (!user?.uid) throw new Error("Authenticated user is required.");
    clearPendingCompanySelection(user.uid);
    selectionRequestVersionRef.current += 1;
    setSelectedCompany(null);
  }, [user]);

  const deleteProfileAndCompanySelection = useCallback(
    async (profileId) => {
      if (!user?.uid) throw new Error("Authenticated user is required.");
      if (!profileId) throw new Error("MLM profile is required.");

      await deleteDoc(doc(db, COLLECTIONS.MLMPROFILES, profileId));

      // Keep the authenticated Firebase session, but remove every draft/cache
      // tied to the deleted company before Select Company can render.
      clearPendingCompanySelection(user.uid);
      selectionRequestVersionRef.current += 1;
      invalidateVerifiedMlmProfileCache();
      clearCompanyScopedStorage();
      setSelectedCompany(null);
    },
    [user],
  );

  const value = useMemo(
    () => ({
      selectedCompany,
      loading: authLoading || loading,
      selectCompany,
      clearCompanySelection,
      deleteProfileAndCompanySelection,
      refreshCompany: loadSelection,
    }),
    [
      authLoading,
      clearCompanySelection,
      deleteProfileAndCompanySelection,
      loadSelection,
      loading,
      selectCompany,
      selectedCompany,
    ],
  );

  return (
    <SelectedCompanyContext.Provider value={value}>
      {children}
    </SelectedCompanyContext.Provider>
  );
}

export function useSelectedCompany() {
  return useContext(SelectedCompanyContext);
}
