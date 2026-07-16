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
import genaral_template_json from "./genaral_template_firestore_data.json";

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
  };
};

const normalizeJson = (id, data) => ({
  id,
  image: data.Showcase_url || "",
  company: data.Company,
  Subtype: data.Subtype,
  type: data.SelectType,
  ShowCaseForm: data?.ShowCaseForm,
  serial: data?.serial,
  MainType: data.MainType,
});

function getGeneralFromJson(Selected_type, pageSize, lastSerial = null) {
  const allEntries = Object.entries(genaral_template_json?.data || {});

  const filtered = allEntries
    .filter(([, data]) =>
      data.MainType === "General" &&
      data.SelectType === Selected_type &&
      data.Active === true &&
      data.Launched === true
    )
    .map(([id, data]) => normalizeJson(id, data))
    .sort((a, b) => (a.serial || 0) - (b.serial || 0));

  if (lastSerial !== null) {
    const startIdx = filtered.findIndex((t) => (t.serial || 0) > lastSerial);
    if (startIdx === -1) return { templates: [], hasMore: false, lastSerial: null };
    const page = filtered.slice(startIdx, startIdx + pageSize);
    const last = page[page.length - 1];
    return {
      templates: page,
      hasMore: startIdx + pageSize < filtered.length,
      lastSerial: last ? (last.serial || 0) : null,
    };
  }

  const page = filtered.slice(0, pageSize);
  const last = page[page.length - 1];
  return {
    templates: page,
    hasMore: pageSize < filtered.length,
    lastSerial: last ? (last.serial || 0) : null,
  };
}

export const Alltemplateservice = async (
  Selected_type,
  lastDoc = null,
  pageSize = 12,
  companyName,
) => {
  try {
    const lastSerialForJson = lastDoc?._generalLastSerial ?? null;

    const generalResult = getGeneralFromJson(Selected_type, pageSize, lastSerialForJson);
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
