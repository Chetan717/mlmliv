import { db } from "@firebase-config";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { COLLECTIONS } from "../../../../collections";

// In-memory only cache — cleared on every page reload so new festival data always shows
// TTL: 5 minutes within a session
const _mem = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function readCache(date) {
  if (_mem.has(date)) {
    const { ts, data } = _mem.get(date);
    if (Date.now() - ts < CACHE_TTL_MS) return data;
    _mem.delete(date);
  }
  return null;
}

function writeCache(date, data) {
  _mem.set(date, { ts: Date.now(), data });
}

export function clearFestivalTemplateCache() {
  _mem.clear();
}

export const Festival_template = async (Selected_date) => {
  const hit = readCache(Selected_date);
  if (hit) return hit;

  try {
    const q = query(
      collection(db, COLLECTIONS.MLMTEMPLATE),
      where("MainType", "==", "General"),
      where("SelectType", "==", "Festival"),
      where("Active", "==", true),
      where("Launched", "==", true),
      where("Date", "==", Selected_date),
      limit(20),
    );

    const snapshot = await getDocs(q);

    const templates = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        image: data.Showcase_url || "",
        company: data.Company,
        MainType: data.MainType,
        type: data.SelectType,
        Subtype: data.Subtype || "",
        ShowCaseForm: data?.ShowCaseForm,
        serial: data?.serial,
      };
    });

    writeCache(Selected_date, templates);
    return templates;
  } catch (error) {
    
    return [];
  }
};
