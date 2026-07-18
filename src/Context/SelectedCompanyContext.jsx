import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { db } from "@firebase-config";
import { useAuth } from "../Auth/AuthContext";
import { COLLECTIONS } from "../collections";

export const COMPANY_SELECTION_COLLECTION = "userCompanySelections";

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

  useEffect(() => {
    // One-way migration: remove the old browser copy regardless of login
    // state. It is never consulted by this provider.
    try { localStorage.removeItem("selectedCompany"); } catch {}
    try { sessionStorage.removeItem("selectedCompany"); } catch {}
  }, []);

  const loadSelection = useCallback(async () => {
    if (!user) {
      setSelectedCompany(null);
      setLoading(false);
      return null;
    }

    setLoading(true);
    try {
      const selectionRef = doc(
        db,
        COMPANY_SELECTION_COLLECTION,
        user.uid,
      );
      const selectionSnapshot = await getDoc(selectionRef);
      let companyId = selectionSnapshot.exists()
        ? selectionSnapshot.data()?.companyId
        : null;

      // Secure migration for existing accounts: derive the company from the
      // server profile, never from browser storage.
      if (!companyId && identity?.mobileNo) {
        const profileSnapshot = await getDocs(
          query(
            collection(db, COLLECTIONS.MLMPROFILES),
            where("mobile", "==", identity.mobileNo),
          ),
        );
        companyId = profileSnapshot.docs[0]?.data()?.companyId || null;
        if (companyId) {
          try {
            await setDoc(selectionRef, {
              companyId,
              selectedAt: serverTimestamp(),
            });
          } catch (writeError) {
            // React StrictMode or a second tab may have created the immutable
            // selection between our read and write. Re-read and accept only
            // the server value; propagate every other failure.
            const concurrentSelection = await getDoc(selectionRef);
            if (!concurrentSelection.exists()) throw writeError;
            companyId = concurrentSelection.data()?.companyId || null;
          }
        }
      }

      const company = await readCompany(companyId);
      setSelectedCompany(company);
      return company;
    } catch (error) {
      
      setSelectedCompany(null);
      throw error;
    } finally {
      setLoading(false);
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

      const selectionRef = doc(
        db,
        COMPANY_SELECTION_COLLECTION,
        user.uid,
      );
      const existing = await getDoc(selectionRef);
      if (existing.exists()) {
        const existingId = existing.data()?.companyId;
        if (existingId !== company.id) {
          throw new Error("Your company has already been selected.");
        }
      } else {
        await setDoc(selectionRef, {
          companyId: company.id,
          selectedAt: serverTimestamp(),
        });
      }

      const verifiedCompany = await readCompany(company.id);
      if (!verifiedCompany) throw new Error("Selected company was not found.");
      setSelectedCompany(verifiedCompany);
      return verifiedCompany;
    },
    [user],
  );

  const clearCompanySelection = useCallback(async () => {
    if (!user?.uid) throw new Error("Authenticated user is required.");
    await deleteDoc(doc(db, COMPANY_SELECTION_COLLECTION, user.uid));
    setSelectedCompany(null);
  }, [user]);

  const deleteProfileAndCompanySelection = useCallback(
    async (profileId) => {
      if (!user?.uid) throw new Error("Authenticated user is required.");
      if (!profileId) throw new Error("MLM profile is required.");

      // Delete both documents in one atomic Firestore commit. This prevents a
      // deleted profile from leaving an orphaned company selection behind.
      const batch = writeBatch(db);
      batch.delete(doc(db, COLLECTIONS.MLMPROFILES, profileId));
      batch.delete(doc(db, COMPANY_SELECTION_COLLECTION, user.uid));
      await batch.commit();
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
