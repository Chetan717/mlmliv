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
  try {
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

    return [...mlmTemplates, ...generalTemplates];
  } catch (error) {
    throw error;
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
