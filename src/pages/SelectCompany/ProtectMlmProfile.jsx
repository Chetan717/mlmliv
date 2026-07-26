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

const PROFILE_VERIFY_TTL_MS = 2 * 60 * 1000;
const verifiedProfileCache = new Map();
const profileRequestCache = new Map();

async function getVerifiedProfile(uid, mobile) {
  const key = `${uid}:${mobile}`;
  const cached = verifiedProfileCache.get(key);
  if (cached && Date.now() - cached.checkedAt < PROFILE_VERIFY_TTL_MS) {
    return cached.profile;
  }

  if (profileRequestCache.has(key)) return profileRequestCache.get(key);

  const request = getDocs(
    query(
      collection(db, COLLECTIONS.MLMPROFILES),
      where("mobile", "==", mobile),
    ),
  )
    .then((snapshot) => {
      if (snapshot.empty) {
        verifiedProfileCache.delete(key);
        return null;
      }
      const profileDoc = snapshot.docs[0];
      const profile = { id: profileDoc.id, ...profileDoc.data() };
      verifiedProfileCache.set(key, {
        checkedAt: Date.now(),
        profile,
      });
      return profile;
    })
    .finally(() => {
      profileRequestCache.delete(key);
    });

  profileRequestCache.set(key, request);
  return request;
}

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
        const profile = await getVerifiedProfile(user.uid, mobile);
        if (cancelled) return;
        if (!profile) {
          setServerProfileState("missing");
          return;
        }
        saveMlmProfileToStorage(profile);
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
