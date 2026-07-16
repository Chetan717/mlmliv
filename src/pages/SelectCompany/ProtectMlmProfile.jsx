import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@firebase-config";
import { useAuth } from "../../Auth/AuthContext";
import { COLLECTIONS } from "../../collections";
import { getUser } from "../../utils/authStorage";
import {
  hasMlmProfileInStorage,
  hasSelectedCompanyInStorage,
  saveMlmProfileToStorage,
} from "../../utils/companyStorage";

export default function ProtectMlmProfile({ children, requireProfile = false }) {
  const { user, loading } = useAuth();
  const [serverProfileState, setServerProfileState] = useState(
    requireProfile ? "checking" : "not-required",
  );
  const hasMlmProfile = hasMlmProfileInStorage();
  const hasSelectedCompany = hasSelectedCompanyInStorage();

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
        console.error("Unable to verify MLM profile:", error);
        if (!cancelled) setServerProfileState("error");
      }
    };

    verifyProfile();
    return () => { cancelled = true; };
  }, [loading, requireProfile, user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (requireProfile && serverProfileState === "checking") return null;
  if (requireProfile && serverProfileState === "verified") return children;
  if (requireProfile && serverProfileState === "error") {
    return <Navigate to="/" replace />;
  }
  if (requireProfile && serverProfileState === "missing") {
    return hasSelectedCompany
      ? <Navigate to="/mlmprofile" replace />
      : <Navigate to="/selectcomp" replace />;
  }
  if (hasMlmProfile) return children;
  if (hasSelectedCompany && !requireProfile) return children;
  if (hasSelectedCompany) return <Navigate to="/mlmprofile" replace />;

  return <Navigate to="/selectcomp" replace />;
}
