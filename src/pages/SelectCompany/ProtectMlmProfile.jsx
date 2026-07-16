import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@firebase-config";
import { useAuth } from "../../Auth/AuthContext";
import { COLLECTIONS } from "../../collections";
import { getUser } from "../../utils/authStorage";
import {
  hasMlmProfileInStorage,
  saveMlmProfileToStorage,
} from "../../utils/companyStorage";
import { useSelectedCompany } from "../../Context/SelectedCompanyContext";

export default function ProtectMlmProfile({ children, requireProfile = false }) {
  const { user, loading } = useAuth();
  const { selectedCompany, loading: companyLoading } = useSelectedCompany();
  const [serverProfileState, setServerProfileState] = useState(
    requireProfile ? "checking" : "not-required",
  );
  const hasMlmProfile = hasMlmProfileInStorage();

  useEffect(() => {
    if (!requireProfile || loading || !user) return;
    let cancelled = false;

    const verifyProfile = async () => {
      const mobile = getUser()?.mobileNo;
      if (!mobile) {
        if (!cancelled) setServerProfileState("missing");
        return;
      }

      try {
        const snapshot = await getDocs(
          query(
            collection(db, COLLECTIONS.MLMPROFILES),
            where("mobile", "==", mobile),
          ),
        );
        if (cancelled) return;
        if (snapshot.empty) {
          setServerProfileState("missing");
          return;
        }
        const profileDoc = snapshot.docs[0];
        saveMlmProfileToStorage({ id: profileDoc.id, ...profileDoc.data() });
        setServerProfileState("verified");
      } catch (error) {
        
        if (!cancelled) setServerProfileState("error");
      }
    };

    verifyProfile();
    return () => { cancelled = true; };
  }, [loading, requireProfile, user]);

  if (loading || companyLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (requireProfile && serverProfileState === "checking") return null;
  if (requireProfile && serverProfileState === "verified") return children;
  if (requireProfile && serverProfileState === "error") {
    return <Navigate to="/" replace />;
  }
  if (requireProfile && serverProfileState === "missing") {
    return selectedCompany
      ? <Navigate to="/mlmprofile" replace />
      : <Navigate to="/selectcomp" replace />;
  }
  if (hasMlmProfile) return children;
  if (selectedCompany && !requireProfile) return children;
  if (selectedCompany) return <Navigate to="/mlmprofile" replace />;

  return <Navigate to="/selectcomp" replace />;
}
