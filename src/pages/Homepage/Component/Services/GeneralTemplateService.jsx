import { db } from "@firebase-config";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import { COLLECTIONS } from "../../../../collections";
import genaral_template_json from "./genaral_template_firestore_data.json";

const TYPE_GROUPS = [
  [
    "Today_Trending",
    "Motivational",
    "Rank_Promotion",
    "Bonanza",
    "Welcome_Closing",
    "Training",
    "Meeting",
    "General_Meeting",

    "Good_Morning",
    "Sport",
    "Daily_Life",
    "Greeting_Wishes",
    "Health_Tips",
    "Achievements",
    "Anniversary_Birthday",
    "Devotional_Spiritual",
    "Leader_Quotes",
    "Income",

    "ThankYou_Banner_B",
    "ThankYou_Birthday_Anniversary",
    "Capping",
  ],
];

// In-memory only cache — cleared on every page reload so new data always shows
// TTL: 5 minutes within a session to avoid redundant fetches during navigation
const _cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getTemplateCache() {
  return _cache;
}

export function clearTemplateCache() {
  _cache.clear();
}

const normalizeDoc = (doc) => ({
  id: doc.id,
  MainType: doc.data().MainType,
  image: doc.data().Showcase_url,
  type: doc.data().SelectType,
  Subtype: doc.data().Subtype,
  ShowCaseForm: doc.data().ShowCaseForm,
  serial: doc.data().serial,
});

// Max templates to fetch per type on the home page
const HOME_LIMIT = 20;

const getGeneralTemplatesFromJson = (type) => {
  const allTemplates = Object.entries(genaral_template_json?.data || {}).map(
    ([id, data]) => ({
      id,
      ...data,
    }),
  );

  return allTemplates
    .filter(
      (template) =>
        template.MainType === "General" &&
        template.SelectType === type &&
        template.Active === true &&
        template.Launched === true,
    )
    .sort((a, b) => (a.serial || 0) - (b.serial || 0))
    .slice(0, HOME_LIMIT)
    .map((template) => ({
      id: template.id,
      MainType: template.MainType,
      image: template.Showcase_url,
      type: template.SelectType,
      Subtype: template.Subtype,
      ShowCaseForm: template.ShowCaseForm,
      serial: template.serial,
    }));
};

export const fetchGeneralTemplates = async (groupIndex, company) => {
  const cacheKey = `${groupIndex}__${company || ""}`;

  // In-memory cache hit (with TTL check)
  if (_cache.has(cacheKey)) {
    const { ts, data } = _cache.get(cacheKey);
    if (Date.now() - ts < CACHE_TTL_MS) {
      return data;
    }
    // Expired — remove and re-fetch
    _cache.delete(cacheKey);
  }

  // Fetch fresh from Firestore
  try {
    const selectedTypes = TYPE_GROUPS[groupIndex];
    if (!selectedTypes) return [];

    const results = await Promise.all(
      selectedTypes.map(async (type) => {
        const [generalTemplates, mlmSnapshot] = await Promise.all([
          Promise.resolve(getGeneralTemplatesFromJson(type)),
          company
            ? getDocs(
                query(
                  collection(db, COLLECTIONS.MLMTEMPLATE),
                  where("MainType", "==", "MLM"),
                  where("Company", "==", company),
                  where("SelectType", "==", type),
                  where("Active", "==", true),
                  where("Launched", "==", true),
                  orderBy("serial"),
                  limit(HOME_LIMIT),
                ),
              )
            : Promise.resolve({ docs: [] }),
        ]);

        const mlmTemplates = mlmSnapshot.docs.map(normalizeDoc);

        return { type, templates: [...mlmTemplates, ...generalTemplates] };
      }),
    );

    _cache.set(cacheKey, { ts: Date.now(), data: results });
    return results;
  } catch (error) {
    console.error("General fetch error:", error);
    return [];
  }
};
