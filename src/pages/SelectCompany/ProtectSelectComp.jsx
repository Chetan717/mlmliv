import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../Auth/AuthContext";
import {
  hasMlmProfileInStorage,
  saveMlmProfileToStorage,
} from "../../utils/companyStorage";
import { isCompanyChangeRequest } from "../../utils/companyChangePolicy";
import { getVerifiedMlmProfile } from "../../utils/mlmProfileVerification";
import { useSelectedCompany } from "../../Context/SelectedCompanyContext";

export default function ProtectSelectComp({ children }) {
  const location = useLocation();
  const { user, identity, loading } = useAuth();
  const { selectedCompany, loading: companyLoading } = useSelectedCompany();
  const hasMlmProfile = hasMlmProfileInStorage();
  const isChangeRequest = isCompanyChangeRequest(location.search);
  const [changeAccess, setChangeAccess] = useState("idle");

  useEffect(() => {
    if (!isChangeRequest) {
      setChangeAccess("idle");
      return;
    }
    if (loading || companyLoading || !user) return;

    if (hasMlmProfile) {
      setChangeAccess("locked");
      return;
    }

    const mobile = identity?.mobileNo;
    if (!mobile) {
      setChangeAccess("locked");
      return;
    }

    let cancelled = false;
    setChangeAccess("checking");

    getVerifiedMlmProfile(user.uid, mobile)
      .then((profile) => {
        if (cancelled) return;
        if (profile) {
          saveMlmProfileToStorage(profile);
          setChangeAccess("locked");
        } else {
          setChangeAccess("allowed");
        }
      })
      .catch(() => {
        // A failed verification must never unlock company changes.
        if (!cancelled) setChangeAccess("locked");
      });

    return () => {
      cancelled = true;
    };
  }, [
    companyLoading,
    hasMlmProfile,
    identity?.mobileNo,
    isChangeRequest,
    loading,
    user,
  ]);

  if (loading || companyLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (isChangeRequest) {
    if (hasMlmProfile || changeAccess === "locked") {
      return <Navigate to="/mlmprofile" replace />;
    }
    if (changeAccess !== "allowed") return null;
    return children;
  }

  if (hasMlmProfile || selectedCompany) {
    return <Navigate to="/" replace />;
  }

  return children;
}
