import React, { useState, useEffect, useRef, useMemo } from "react";
import { db } from "@firebase-config";
import { collection, getDocs } from "firebase/firestore";
import MlmEditPage from "./MlmEditPage";
import GeneralEditPage from "./GenralEditPage";
import FooterSelect from "./utils/FooterSelect";
import TopuplineSelect from "./utils/TopuplineSelect";
import { COLLECTIONS } from "../../collections";
export const GENERAL_SELECT_TYPES = [
  { name: "Trending", value: "Trending" },
  { name: "Festival", value: "Festival" },
  { name: "Motivational", value: "Motivational" },
  { name: "Good Morning", value: "Good_Morning" },
  { name: "Sport", value: "Sport" },
  { name: "Daily_Life", value: "Daily_Life" },
  { name: "Devotional / Spiritual", value: "Devotional_Spiritual" },
  { name: "Leader Quotes", value: "Leader_Quotes" },
  { name: "Health Tips", value: "Health_Tips" },
  // { name: "Anniversary & Birthday", value: "Anniversary_Birthday" },
  { name: "Greeting & Wishes", value: "Greeting_Wishes" },
  {
    name: "Thank You (Birthday & Anniversary)",
    value: "ThankYou_Birthday_Anniversary",
  },
];

const collectionCache = {
  data: null,
  isFetched: false,
};

function groupByGraphicsType(data) {
  return data.reduce((acc, item) => {
    if (!item.Active) return acc;
    const type = item.GraphicsType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});
}

function MainEditor() {
  const [collectionData, setCollectionData] = useState(collectionCache.data);
  const [loading, setLoading] = useState(!collectionCache.isFetched);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  const [middaleImage, setmiddaleImage] = useState(null);
  useEffect(() => {
    isMounted.current = true;

    if (collectionCache.isFetched) return;

    const fetchMlmGraphics = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(collection(db, COLLECTIONS.MLMGRAPHICS));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (isMounted.current) {
          collectionCache.data = data;
          collectionCache.isFetched = true;
          setCollectionData(data);
        }
      } catch (err) {
        if (isMounted.current) setError(err.message);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    fetchMlmGraphics();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // ── Grouped map — recomputes only when collectionData changes ─────
  // graphicsMap = { TopUplineFrames: [...], Footers: [...] }
  const graphicsMap = useMemo(
    () => (collectionData ? groupByGraphicsType(collectionData) : {}),
    [collectionData],
  );

  function getSelType() {
    try {
      return JSON.parse(localStorage.getItem("selType")) || {};
    } catch {
      return {};
    }
  }

  const selll = getSelType();

  const isGeneralType = GENERAL_SELECT_TYPES.some(
    (t) => t.value === selll?.type,
  );

  const frames = graphicsMap?.["TopUplineFrames"]?.[0]?.GraphicsLinks || [];
  const [selectedTopFrame, setSelectedTopFrame] = useState(frames[0] || null);
  const [isOpen, setIsOpen] = useState(false);

  const Footersframes = graphicsMap?.["Footers"]?.[0]?.GraphicsLinks || [];
  const [selectedFooterFrame, setSelectedFooterFrame] = useState(
    Footersframes[0] || null,
  );
  const [isOpenFtr, setIsOpenFtr] = useState(false);
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
      <div
        className="rounded-2xl bg-muted/30 border border-border animate-pulse"
        style={{ width: 320, height: 320 }}
      />
      <div className="flex gap-3">
        {[80, 60, 100].map((w, i) => (
          <div key={i} className="h-9 rounded-xl bg-muted/30 animate-pulse" style={{ width: w }} />
        ))}
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse mt-1">
        Loading editor...
      </p>
    </div>
  );
  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
      <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger">
          <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
        </svg>
      </div>
      <p className="font-semibold text-foreground">Failed to load editor</p>
      <p className="text-sm text-muted-foreground">{error}</p>
    </div>
  );

  return (
    <>
      {/* {isGeneralType ? ( */}
        <GeneralEditPage
          graphicsMap={graphicsMap}
          frames={frames}
          selectedTopFrame={selectedTopFrame}
          setSelectedTopFrame={setSelectedTopFrame}
          isOpenFtr={isOpenFtr}
          setIsOpenFtr={setIsOpenFtr}
          selectedFooterFrame={selectedFooterFrame}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          middaleImage={middaleImage}
          setmiddaleImage={setmiddaleImage}
        />
      {/* // ) : (
      //   <MlmEditPage
      //     graphicsMap={graphicsMap}
      //     frames={frames}
      //     selectedTopFrame={selectedTopFrame}
      //     setSelectedTopFrame={setSelectedTopFrame}
      //     isOpenFtr={isOpenFtr}
      //     setIsOpenFtr={setIsOpenFtr}
      //     selectedFooterFrame={selectedFooterFrame}
      //     isOpen={isOpen}
      //     setIsOpen={setIsOpen}
      //     middaleImage={middaleImage}
      //     setmiddaleImage={setmiddaleImage}
      //   />
      // )} */}
      <TopuplineSelect
        frames={frames}
        onFrameSelect={(frame) => setSelectedTopFrame(frame)}
        setIsOpen={setIsOpen}
        isOpen={isOpen}
      />
      <FooterSelect
        isOpenFtr={isOpenFtr}
        setIsOpenFtr={setIsOpenFtr}
        frames={Footersframes}
        setSelectedFooterFrame={setSelectedFooterFrame}
        onFrameSelectFooter={(frame) => setSelectedFooterFrame(frame)}
        selectedFooterFrame={selectedFooterFrame}
      />
    </>
  );
}

export default MainEditor;
