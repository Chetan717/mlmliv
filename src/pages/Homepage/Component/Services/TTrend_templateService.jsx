import { db } from "@firebase-config";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { COLLECTIONS } from "../../../../collections";

function mapDoc(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    image: data?.Showcase_url || "",
    company: data?.Company || "",
    type: data?.SelectType,
    ShowCaseForm: data?.ShowCaseForm,
    serial: data?.serial,
    Subtype: data?.Subtype || "",
  };
}

let _cache = null;
let _cacheCompany = null;
let _cacheTs = 0;
let _cacheDate = "";
const CACHE_TTL = 10 * 60 * 1000;

export const TTrend_templateService = async (companyName) => {
  const today = new Date().toISOString().split("T")[0];
  const now = Date.now();

  if (
    _cache !== null &&
    _cacheCompany === (companyName || "") &&
    _cacheDate === today &&
    now - _cacheTs < CACHE_TTL
  ) {
    return _cache;
  }

  try {
    const q1 = query(
      collection(db, COLLECTIONS.MLMTEMPLATE),
      where("MainType", "==", "General"),
      where("SelectType", "==", "Trending"),
      where("Active", "==", true),
      where("Launched", "==", true),
      where("Date", "==", today),
      limit(10),
    );

    const fetchList = [getDocs(q1)];

    if (companyName) {
      const q2 = query(
        collection(db, COLLECTIONS.MLMTEMPLATE),
        where("MainType", "==", "MLM"),
        where("SelectType", "==", "Today_Trending"),
        where("Active", "==", true),
        where("Launched", "==", true),
        where("Company", "==", companyName),
        limit(10),
      );
      fetchList.push(getDocs(q2));
    }

    const results = await Promise.all(fetchList);

    const seen = new Set();
    const templates = results
      .flatMap((snapshot) => snapshot.docs.map(mapDoc))
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

    _cache = templates;
    _cacheCompany = companyName || "";
    _cacheDate = today;
    _cacheTs = now;

    return templates;
  } catch (error) {
    console.error("Trending fetch error:", error);
    return _cache || [];
  }
};

export function clearTrendingCache() {
  _cache = null;
  _cacheTs = 0;
}
