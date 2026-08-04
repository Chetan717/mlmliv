import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@firebase-config";
import { COLLECTIONS } from "../collections";

const PROFILE_VERIFY_TTL_MS = 2 * 60 * 1000;
const verifiedProfileCache = new Map();
const profileRequestCache = new Map();
let cacheGeneration = 0;

export async function getVerifiedMlmProfile(uid, mobile) {
  const key = `${uid}:${mobile}`;
  const cached = verifiedProfileCache.get(key);
  if (cached && Date.now() - cached.checkedAt < PROFILE_VERIFY_TTL_MS) {
    return cached.profile;
  }

  if (profileRequestCache.has(key)) return profileRequestCache.get(key);

  const requestGeneration = cacheGeneration;
  const request = getDocs(
    query(
      collection(db, COLLECTIONS.MLMPROFILES),
      where("mobile", "==", mobile),
    ),
  )
    .then((snapshot) => {
      if (requestGeneration !== cacheGeneration) return null;
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
      if (profileRequestCache.get(key) === request) {
        profileRequestCache.delete(key);
      }
    });

  profileRequestCache.set(key, request);
  return request;
}

// A profile deletion must invalidate both completed and in-flight lookups.
// Otherwise a recently cached document could recreate the deleted browser
// profile while the user is setting up a different company.
export function invalidateVerifiedMlmProfileCache() {
  cacheGeneration += 1;
  verifiedProfileCache.clear();
  profileRequestCache.clear();
}
