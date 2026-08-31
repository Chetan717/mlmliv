import { db } from "@firebase-config";
import { COLLECTIONS } from "../../../../collections";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import {
  getAllGeneralTemplates,
  getGeneralTemplatesPage,
} from "./generalTemplateIndex";

export const ALL_TEMPLATE_GRAPHICS_CACHE_TTL_MS = 5 * 60 * 1000;

const _graphicsCache = new Map();
const _graphicsRequests = new Map();
let _graphicsCacheGeneration = 0;

function getGraphicsCacheKey(selectedType, companyName) {
  return `${String(companyName || "").trim()}::${String(selectedType || "").trim()}`;
}

export function clearAllTemplateGraphicsCache() {
  _graphicsCacheGeneration += 1;
  _graphicsCache.clear();
  _graphicsRequests.clear();
}

export function primeAllTemplateGraphicsCache(
  selectedType,
  companyName,
  templates,
) {
  if (!Array.isArray(templates)) return;

  _graphicsCache.set(getGraphicsCacheKey(selectedType, companyName), {
    timestamp: Date.now(),
    templates,
  });
}

const normalizeDoc = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    image: data.Showcase_url || "",
    company: data.Company,
    Subtype: data.Subtype,
    type: data.SelectType,
    ShowCaseForm: data?.ShowCaseForm,
    serial: data?.serial,
    MainType: data.MainType,
    GraphicsLink: data.GraphicsLink || [],
  };
};

export const AllTemplateGraphicsService = async (
  selectedType,
  companyName,
) => {
  const cacheKey = getGraphicsCacheKey(selectedType, companyName);
  const cached = _graphicsCache.get(cacheKey);
  if (
    cached &&
    Date.now() - cached.timestamp < ALL_TEMPLATE_GRAPHICS_CACHE_TTL_MS
  ) {
    return cached.templates;
  }

  const pending = _graphicsRequests.get(cacheKey);
  if (pending) return pending;

  const requestGeneration = _graphicsCacheGeneration;
  const request = (async () => {
    const generalTemplates = getAllGeneralTemplates(selectedType);
    let mlmTemplates = [];

    if (companyName) {
      const mlmSnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.MLMTEMPLATE),
          where("SelectType", "==", `${selectedType}`),
          where("MainType", "==", "MLM"),
          where("Company", "==", companyName),
          where("Active", "==", true),
          where("Launched", "==", true),
          orderBy("serial"),
        ),
      );
      mlmTemplates = mlmSnapshot.docs.map(normalizeDoc);
    }

    const templates = [...mlmTemplates, ...generalTemplates];
    if (requestGeneration === _graphicsCacheGeneration) {
      _graphicsCache.set(cacheKey, {
        timestamp: Date.now(),
        templates,
      });
    }
    return templates;
  })();

  _graphicsRequests.set(cacheKey, request);
  try {
    return await request;
  } finally {
    if (_graphicsRequests.get(cacheKey) === request) {
      _graphicsRequests.delete(cacheKey);
    }
  }
};

export const Alltemplateservice = async (
  Selected_type,
  lastDoc = null,
  pageSize = 12,
  companyName,
) => {
  try {
    const lastSerialForJson = lastDoc?._generalLastSerial ?? null;

    const generalResult = getGeneralTemplatesPage(
      Selected_type,
      pageSize,
      lastSerialForJson,
    );
    const generalTemplates = generalResult.templates;

    let mlmTemplates = [];
    let mlmLastDoc = null;

    if (companyName) {
      const mlmConstraints = [
        where("SelectType", "==", `${Selected_type}`),
        where("MainType", "==", "MLM"),
        where("Company", "==", companyName),
        where("Active", "==", true),
        where("Launched", "==", true),
        orderBy("serial"),
        limit(pageSize),
      ];

      if (lastDoc?._mlmLastDoc) {
        mlmConstraints.splice(-1, 0, startAfter(lastDoc._mlmLastDoc));
      }

      const mlmSnapshot = await getDocs(
        query(collection(db, COLLECTIONS.MLMTEMPLATE), ...mlmConstraints)
      );

      mlmTemplates = mlmSnapshot.docs.map(normalizeDoc);
      mlmLastDoc = mlmSnapshot.docs[mlmSnapshot.docs.length - 1] || null;
    }

    const templates = [...mlmTemplates, ...generalTemplates];

    const newLastDoc = {
      _generalLastSerial: generalResult.lastSerial,
      _mlmLastDoc: mlmLastDoc,
    };

    const hasMore = generalResult.hasMore || mlmTemplates.length === pageSize;

    return { templates, lastDoc: newLastDoc, hasMore };
  } catch (error) {
    
    return { templates: [], lastDoc: null, hasMore: false };
  }
};
