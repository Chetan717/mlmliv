// import React, {
//   useState,
//   useEffect,
//   useLayoutEffect,
//   useRef,
//   useCallback,
//   useMemo,
// } from "react";
// import { getUser } from "../../utils/authStorage";
// import { Stage, Layer, Text, Image, Transformer, Group } from "react-konva";
// import Konva from "konva";
// Konva.hitOnDragEnabled = true;
// import useImage from "use-image";
// import ListOfTemplates from "./components/ListOfTemplates";
// import AiRetouchModal from "./AiRetouchModal";
// import CaptionModal from "../../components/CaptionModal";
// import {
//   isRankPromotionType,
//   RANK_PROMOTION_TYPES,
// } from "../../utils/templateTypeConfig";
// import facebook from "./sociallogo/facebook.png";
// import featurec from "./sociallogo/featurecoming.webp";
// import instagram from "./sociallogo/insta.png";
// import youtube from "./sociallogo/youtube.png";
// import x from "./sociallogo/x.png";
// import Loc from "./sociallogo/loc.png";
// import zoom from "./sociallogo/zoom.png";
// import meet from "./sociallogo/meet.png";
// import twodn from "./sociallogo/2d1n.webp";
// import threedn from "./sociallogo/3d2n.webp";
// import fourdn from "./sociallogo/4d3n.webp";
// import familly from "./sociallogo/family.webp";
// import { Button, isRTL, Spinner } from "@heroui/react";
// import ffmpegCoreURL from "@ffmpeg/core?url";
// import ffmpegWasmURL from "@ffmpeg/core/wasm?url";
// import { getLocalLogo } from "@/utils/getCompanyLogo";
// import spdoneimg from "./closinglogo/Sp.webp";
// import {
//   collection,
//   query,
//   where,
//   getDocs,
//   doc,
//   updateDoc,
//   orderBy,
//   limit,
//   startAfter,
// } from "firebase/firestore";
// import { db } from "@firebase-config";
// import { validateUploadFile } from "../../lib/fileValidation";
// import num0 from "./amount_numberImage/number_0.webp";
// import num1 from "./amount_numberImage/number_1.webp";
// import num2 from "./amount_numberImage/number_2.webp";
// import num3 from "./amount_numberImage/number_3.webp";
// import num4 from "./amount_numberImage/number_4.webp";
// import num5 from "./amount_numberImage/number_5.webp";
// import num6 from "./amount_numberImage/number_6.webp";
// import num7 from "./amount_numberImage/number_7.webp";
// import num8 from "./amount_numberImage/number_8.webp";
// import num9 from "./amount_numberImage/number_9.webp";
// import numComma from "./amount_numberImage/comma.webp";
// import numRupee from "./amount_numberImage/rupee.webp";
// import { COLLECTIONS } from "../../collections";
// import { celebrateDownload } from "../../utils/downloadCelebration";
// import { getAchieverDisplayName } from "./utils/canvasDataUtils";

// const fs = (n) => n;

// const STAGE_WIDTH = 320;
// const STAGE_HEIGHT = 320;

// const isIOS = () =>
//   /iPad|iPhone|iPod/.test(navigator.userAgent) ||
//   (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// const EXPORT_PIXEL_RATIO = isIOS() ? 3 : 8;
// const VIDEO_PIXEL_RATIO = isIOS() ? 2 : 4;
// const MAX_MUSIC_SECONDS = 20;

// const IMAGE_CREDIT_COST = 1;
// const VIDEO_CREDIT_COST = 2;

// const MUSIC_PAGE_SIZE = 15;

// const sortMusicTracks = (tracks) =>
//   [...tracks].sort((a, b) =>
//     String(a.Name_Music || "").localeCompare(
//       String(b.Name_Music || ""),
//       undefined,
//       {
//         sensitivity: "base",
//       },
//     ),
//   );

// const VideoCanvas = React.memo(function VideoCanvas({
//   src,
//   playing,
//   width,
//   height,
//   onError,
//   videoElRef,
// }) {
//   const imageRef = useRef(null);

//   const videoEl = useMemo(() => {
//     if (typeof document === "undefined") return null;
//     const el = document.createElement("video");
//     el.crossOrigin = "anonymous";
//     el.loop = true;
//     el.muted = true;
//     el.playsInline = true;
//     el.preload = "auto";
//     el.src = src;
//     return el;
//   }, [src]);

//   useEffect(() => {
//     if (videoElRef) videoElRef.current = videoEl || null;
//     return () => {
//       if (videoElRef) videoElRef.current = null;
//     };
//   }, [videoEl, videoElRef]);

//   useEffect(() => {
//     if (!videoEl) return;
//     const handleError = () => onError && onError();
//     videoEl.addEventListener("error", handleError);
//     return () => videoEl.removeEventListener("error", handleError);
//   }, [videoEl, onError]);

//   useEffect(() => {
//     if (!videoEl) return;
//     let rafId = null;
//     let cancelled = false;

//     // Use rAF loop so we always get the live layer reference each frame,
//     // avoiding the null-layer bug from capturing it at effect start.
//     let lastDraw = 0;
//     const tick = (time) => {
//       if (cancelled) return;
//       if (time - lastDraw >= 33) {
//         lastDraw = time;
//         const lyr = imageRef.current?.getLayer?.();
//         if (lyr) lyr.batchDraw();
//       }
//       rafId = requestAnimationFrame(tick);
//     };

//     if (playing) {
//       const tryPlay = () => {
//         const p = videoEl.play();
//         if (p && typeof p.catch === "function") {
//           p.catch(() => {
//             videoEl.muted = true;
//             videoEl.play().catch(() => {});
//           });
//         }
//         rafId = requestAnimationFrame(tick);
//       };
//       if (videoEl.readyState >= 2) {
//         tryPlay();
//       } else {
//         videoEl.addEventListener("canplay", tryPlay, { once: true });
//       }
//       return () => {
//         cancelled = true;
//         videoEl.removeEventListener("canplay", tryPlay);
//         if (rafId) cancelAnimationFrame(rafId);
//       };
//     }

//     // paused state — stop video and do one final draw
//     videoEl.pause();
//     const lyr = imageRef.current?.getLayer?.();
//     if (lyr) lyr.batchDraw();
//     return () => {
//       cancelled = true;
//       if (rafId) cancelAnimationFrame(rafId);
//     };
//   }, [playing, videoEl]);

//   useEffect(() => {
//     return () => {
//       if (videoEl) {
//         videoEl.pause();
//         videoEl.removeAttribute("src");
//         videoEl.load();
//       }
//     };
//   }, [videoEl]);

//   if (!videoEl) return null;
//   return (
//     <Image
//       ref={imageRef}
//       image={videoEl}
//       x={0}
//       y={0}
//       width={width}
//       height={height}
//       listening={false}
//     />
//   );
// });

// export const GENERAL_SELECT_TYPES = [
//   { name: "Motivational", value: "Motivational" },
//   { name: "Thank You Rank", value: "ThankYou_Banner_B" },
//   {
//     name: "Thank You (Birthday & Anniversary)",
//     value: "ThankYou_Birthday_Anniversary",
//   },
// ];
// export const GENERAL_SELECT_TYPES2 = [
//   { name: "Good_Morning", value: "Good_Morning" },
//   { name: "Sport", value: "Sport" },
//   { name: "Daily_Life", value: "Daily_Life" },
//   { name: "Health_Tips", value: "Health_Tips" },
//   { name: "Greeting & Wishes", value: "Greeting_Wishes" },
//   { name: "Devotional_Spiritual", value: "Devotional_Spiritual" },
//   { name: "Leader_Quotes", value: "Leader_Quotes" },
//   { name: "Festival", value: "Festival" },
//   { name: "Trending", value: "Trending" },
// ];

// const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

// const FadeBottomFilter = (imageData) => {
//   const { data, width, height } = imageData;

//   const borderSize = 30;

//   for (let y = 0; y < height; y++) {
//     let alpha = 2;

//     if (y >= height - borderSize) {
//       const t = (y - (height - borderSize)) / borderSize;
//       alpha = 1 - t;
//     }

//     for (let x = 0; x < width; x++) {
//       const idx = (y * width + x) * 4;
//       data[idx + 3] = Math.min(data[idx + 3], Math.round(255 * alpha));
//     }
//   }
// };
// // const FadeEdgesFilter = (imageData) => {
// //   const { data, width, height } = imageData;
// //   if (width <= 1 || height <= 1) return; // guard against degenerate sizes

// //   const bottomBorder = 30; // last 50 px fade at bottom (same as FadeBottomFilter)
// //   const sideFade = 0.1; // 18 % from each side (left & right)

// //   const wMax = width - 1;

// //   for (let y = 0; y < height; y++) {
// //     let bottomAlpha = 1;
// //     if (y >= height - bottomBorder) {
// //       const t = (y - (height - bottomBorder)) / bottomBorder;
// //       bottomAlpha = Math.max(0, 1 - t);
// //     }

// //     for (let x = 0; x < width; x++) {
// //       const px = x / wMax;

// //       const leftAlpha = px < sideFade ? px / sideFade : 1;
// //       const rightAlpha = px > 1 - sideFade ? (1 - px) / sideFade : 1;

// //       const alpha = bottomAlpha * leftAlpha * rightAlpha;
// //       const idx = (y * width + x) * 4;
// //       data[idx + 3] = Math.round(
// //         data[idx + 3] * Math.max(0, Math.min(1, alpha)),
// //       );
// //     }
// //   }
// // };

// const FadeEdgesFilter = (imageData) => {
//   const { data, width, height } = imageData;
//   if (width <= 1 || height <= 1) return;

//   const bottomBorder = 0;
//   const sideFade = 0.07; // केवल 7% side area में fade
//   const minSideAlpha = 0.4; // sides पर minimum 40% opacity

//   const wMax = width - 1;

//   const clamp01 = (value) => Math.max(0, Math.min(1, value));

//   // Smooth transition instead of hard linear fade
//   const smoothstep = (value) => {
//     const t = clamp01(value);
//     return t * t * (3 - 2 * t);
//   };

//   for (let y = 0; y < height; y++) {
//     let bottomAlpha = 1;

//     if (y >= height - bottomBorder) {
//       const t = clamp01(
//         (y - (height - bottomBorder)) / Math.max(1, bottomBorder - 1),
//       );

//       bottomAlpha = 1 - smoothstep(t);
//     }

//     for (let x = 0; x < width; x++) {
//       const px = x / wMax;

//       const leftProgress = smoothstep(px / sideFade);
//       const rightProgress = smoothstep((1 - px) / sideFade);

//       const leftAlpha = minSideAlpha + (1 - minSideAlpha) * leftProgress;

//       const rightAlpha = minSideAlpha + (1 - minSideAlpha) * rightProgress;

//       const alpha = clamp01(bottomAlpha * Math.min(leftAlpha, rightAlpha));

//       const idx = (y * width + x) * 4;
//       data[idx + 3] = Math.round(data[idx + 3] * alpha);
//     }
//   }
// };

// const FadeRightFilter = (imageData) => {
//   const { data, width, height } = imageData;
//   const fadeStart = 0.9; // fade begins at 50% from left ← adjust this
//   for (let y = 0; y < height; y++) {
//     for (let x = 0; x < width; x++) {
//       const progress = x / width;
//       const alpha =
//         progress <= fadeStart
//           ? 1
//           : 1 - (progress - fadeStart) / (1 - fadeStart); // right fades out
//       const idx = (y * width + x) * 4;
//       data[idx + 3] = Math.round(
//         data[idx + 3] * Math.max(0, Math.min(1, alpha)),
//       );
//     }
//   }
// };

// const FadeLeftFilter = (imageData) => {
//   const { data, width, height } = imageData;
//   const fadeStart = 0.9;
//   for (let y = 0; y < height; y++) {
//     for (let x = 0; x < width; x++) {
//       const progress = x / width;
//       const alpha = progress >= fadeStart ? 1 : progress / fadeStart;
//       const idx = (y * width + x) * 4;
//       data[idx + 3] = Math.round(
//         data[idx + 3] * Math.max(0, Math.min(1, alpha)),
//       );
//     }
//   }
// };

// const NO_FOOTER_TYPES = new Set([
//   ...RANK_PROMOTION_TYPES,
//   "Bonanza",
//   "Welcome_Closing",
//   "Achievements",
//   "Anniversary_Birthday",
//   "Income",
//   "Meeting",
//   "General_Meeting",
//   "ThankYou_Birthday_Anniversary",
//   "Capping",
//   "Training",
// ]);

// const parseExpiryDate = (dateStr) => {
//   if (!dateStr) return null;
//   const months = {
//     Jan: 0,
//     Feb: 1,
//     Mar: 2,
//     Apr: 3,
//     May: 4,
//     Jun: 5,
//     Jul: 6,
//     Aug: 7,
//     Sep: 8,
//     Oct: 9,
//     Nov: 10,
//     Dec: 11,
//   };
//   const [day, mon, year] = dateStr.split(" ");
//   const month = months[mon];
//   if (month === undefined) return null;
//   return new Date(Number(year), month, Number(day), 23, 59, 59);
// };

// const AMOUNT_GRADIENT_OPTIONS = [
//   {
//     id: "gold1",
//     name: "Gold Classic",
//     stops: [
//       0,
//       "#ffd700",
//       0.3,
//       "#ffed4e",
//       0.6,
//       "#d4af37",
//       0.9,
//       "#b8860b",
//       1,
//       "#daa520",
//     ],
//     preview:
//       "linear-gradient(135deg, #ffd700 0%, #ffed4e 30%, #d4af37 60%, #b8860b 90%, #daa520 100%)",
//   },
//   {
//     id: "gold2",
//     name: "Gold Luxe",
//     stops: [
//       0,
//       "#ffed4e",
//       0.25,
//       "#ffd700",
//       0.5,
//       "#ffb347",
//       0.75,
//       "#ff8c00",
//       1,
//       "#daa520",
//     ],
//     preview:
//       "linear-gradient(135deg, #ffed4e 0%, #ffd700 25%, #ffb347 50%, #ff8c00 75%, #daa520 100%)",
//   },
//   {
//     id: "silver1",
//     name: "Silver Frost",
//     stops: [
//       0,
//       "#f8f8ff",
//       0.3,
//       "#c0c0c0",
//       0.6,
//       "#a8a8a8",
//       0.9,
//       "#808080",
//       1,
//       "#696969",
//     ],
//     preview:
//       "linear-gradient(135deg, #f8f8ff 0%, #c0c0c0 30%, #a8a8a8 60%, #808080 90%, #696969 100%)",
//   },
//   {
//     id: "silver2",
//     name: "Silver Shine",
//     stops: [
//       0,
//       "#e6e6fa",
//       0.25,
//       "#d3d3d3",
//       0.5,
//       "#b0b0b0",
//       0.75,
//       "#909090",
//       1,
//       "#778899",
//     ],
//     preview:
//       "linear-gradient(135deg, #e6e6fa 0%, #d3d3d3 25%, #b0b0b0 50%, #909090 75%, #778899 100%)",
//   },
//   {
//     id: "diamond1",
//     name: "Red Diamond",
//     stops: [
//       0,
//       "#ffcccc",
//       0.3,
//       "#ff6666",
//       0.6,
//       "#cc3333",
//       0.9,
//       "#990000",
//       1,
//       "#660000",
//     ],
//     preview:
//       "linear-gradient(135deg, #ffcccc 0%, #ff6666 30%, #cc3333 60%, #990000 90%, #660000 100%)",
//   },
//   {
//     id: "diamond2",
//     name: "Ruby Diamond",
//     stops: [
//       0,
//       "#ffe6e6",
//       0.25,
//       "#ff9999",
//       0.5,
//       "#ff4d4d",
//       0.75,
//       "#cc0000",
//       1,
//       "#990033",
//     ],
//     preview:
//       "linear-gradient(135deg, #ffe6e6 0%, #ff9999 25%, #ff4d4d 50%, #cc0000 75%, #990033 100%)",
//   },
// ];

// const btnStyle = (bg) => ({
//   display: "flex",
//   flexDirection: "column",
//   alignItems: "center",
//   justifyContent: "center",
//   gap: 6,
//   padding: "14px 8px",
//   borderRadius: 14,
//   border: "none",
//   background: bg,
//   color: "#fff",
//   fontSize: 13,
//   fontWeight: 600,
//   cursor: "pointer",
//   boxShadow: `0 4px 12px ${bg}55`,
// });

// function SlowLoadingHint({ delay = 3500, message }) {
//   const [show, setShow] = React.useState(false);
//   React.useEffect(() => {
//     setShow(false);
//     const id = setTimeout(() => setShow(true), delay);
//     return () => clearTimeout(id);
//   }, [delay]);
//   if (!show) return null;
//   return (
//     <p
//       style={{
//         color: "rgba(255,255,255,0.85)",
//         fontSize: 11,
//         fontWeight: 500,
//         textAlign: "center",
//         maxWidth: 220,
//         lineHeight: 1.4,
//         marginTop: 2,
//       }}
//     >
//       {message}
//     </p>
//   );
// }

// function LoadingDots() {
//   const [dots, setDots] = React.useState("");
//   React.useEffect(() => {
//     const id = setInterval(
//       () => setDots((d) => (d.length >= 3 ? "" : d + ".")),
//       450,
//     );
//     return () => clearInterval(id);
//   }, []);
//   return (
//     <span style={{ display: "inline-block", width: 18, textAlign: "left" }}>
//       {dots}
//     </span>
//   );
// }

// function Toast({ message, type }) {
//   const colors = { error: "#ef4444", success: "#22c55e", info: "#6366f1" };
//   return (
//     <div
//       style={{
//         position: "fixed",
//         bottom: 20,
//         left: "50%",
//         transform: "translateX(-50%)",
//         background: colors[type] || colors.info,
//         color: "#fff",
//         padding: "10px 20px",
//         borderRadius: 30,
//         fontWeight: 600,
//         fontSize: 13,
//         zIndex: 2000,
//         boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
//         whiteSpace: "nowrap",
//       }}
//     >
//       {message}
//     </div>
//   );
// }

// const getAudioDuration = (fileOrUrl) =>
//   new Promise((resolve, reject) => {
//     const isUrl = typeof fileOrUrl === "string";
//     const url = isUrl ? fileOrUrl : URL.createObjectURL(fileOrUrl);
//     const cleanup = () => {
//       if (!isUrl) URL.revokeObjectURL(url);
//     };
//     const audio = new Audio();
//     audio.preload = "metadata";
//     audio.onloadedmetadata = () => {
//       cleanup();
//       resolve(isFinite(audio.duration) ? audio.duration : null);
//     };
//     audio.onerror = () => {
//       cleanup();
//       reject(new Error("Could not read audio metadata."));
//     };
//     audio.src = url;
//   });

// function useAnimatedProgress(target) {
//   const [displayed, setDisplayed] = React.useState(0);
//   React.useEffect(() => {
//     let raf;
//     const step = () => {
//       setDisplayed((prev) => {
//         const diff = target - prev;
//         if (Math.abs(diff) < 0.5) return target;
//         raf = requestAnimationFrame(step);
//         return prev + diff * 0.12;
//       });
//     };
//     raf = requestAnimationFrame(step);
//     return () => cancelAnimationFrame(raf);
//   }, [target]);
//   return Math.round(displayed);
// }

// function GeneralEditPage({
//   selectedTopFrame,
//   setIsOpenFtr,
//   setIsOpen,
//   selectedFooterFrame,
//   middaleImage,
//   setmiddaleImage,
// }) {
//   const stageRef = useRef(null);
//   const videoElRef = useRef(null);
//   const profileImageRef = useRef(null);
//   const rankImageRef = useRef(null);
//   const stickerImageRef = useRef(null);
//   const transformerRef = useRef(null);
//   const stageContainerRef = useRef(null);
//   const bgFirstLoadDoneRef = useRef(false);
//   const toastTimerRef = useRef(null);
//   const [stageScale, setStageScale] = useState(1);

//   useLayoutEffect(() => {
//     const el = stageContainerRef.current;
//     if (!el) return;
//     const update = () => {
//       const w = el.getBoundingClientRect().width;
//       if (w > 0) setStageScale(w / STAGE_WIDTH);
//     };
//     update();
//     const ro = new ResizeObserver(update);
//     ro.observe(el);
//     return () => ro.disconnect();
//   }, []);

//   const [mlmForm, setMlmForm] = useState(null);
//   const [mlmProfile, setMlmProfile] = useState(null);
//   const [selected, setSelected] = useState(null);
//   const [isImageSelected, setIsImageSelected] = useState(false);
//   const [selectedImageType, setSelectedImageType] = useState(null);
//   const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0, width: 0 });

//   const [activeSub, setActiveSub] = useState(null);
//   const [userData, setUserData] = useState(null);
//   const [subLoading, setSubLoading] = useState(false);
//   const [exportLoading, setExportLoading] = useState(false);
//   const [toast, setToast] = useState(null);
//   const [exportedUri, setExportedUri] = useState(null);
//   const [achievementForm, setAchievementForm] = useState(null);
//   const [incomeFormData, setIncomeFormData] = useState(null);
//   const [meetingData, setMeetingData] = useState(null);
//   const [showSocial, setShowSocial] = useState("no");
//   const [footerImgFlip, setFooterImgFlip] = useState(false);
//   const [showTopupline] = useState(
//     () => localStorage.getItem("showTopuplineImages") ?? "yes",
//   );
//   const [showLogo] = useState(
//     () => localStorage.getItem("showCompanyLogo") ?? "yes",
//   );
//   const [showMobile] = useState(
//     () => localStorage.getItem("showMobileNumber") ?? "yes",
//   );

//   const [selectedMusic, setSelectedMusic] = useState(null);
//   const [musicExporting, setMusicExporting] = useState(false);
//   const [videoExporting, setVideoExporting] = useState(false);
//   const [savedDesignation, setSavedDesignation] = useState(() => {
//     try {
//       const raw = localStorage.getItem("SelectedDesignation");
//       if (!raw) return null;
//       const parsed = JSON.parse(raw);
//       return parsed &&
//         (parsed.name ||
//           parsed.profilename ||
//           parsed.image ||
//           parsed.profileimage)
//         ? {
//             name: parsed.name || parsed.profilename || "",
//             image: parsed.image || parsed.profileimage || "",
//             profilename: parsed.profilename || parsed.name || "",
//             profileimage: parsed.profileimage || parsed.image || "",
//           }
//         : null;
//     } catch {
//       return null;
//     }
//   });
//   const [musicModalOpen, setMusicModalOpen] = useState(false);
//   const [captionModalOpen, setCaptionModalOpen] = useState(false);
//   const [videoPlaying, setVideoPlaying] = useState(false);
//   const [presetLoadingUrl, setPresetLoadingUrl] = useState(null);
//   const [deviceLoading, setDeviceLoading] = useState(false);
//   const [audioUploadProgress, setAudioUploadProgress] = useState(0);
//   const [firestoreAudios, setFirestoreAudios] = useState([]);
//   const [audioLoading, setAudioLoading] = useState(false);
//   const [audioHasMore, setAudioHasMore] = useState(true);
//   const [audioLastDoc, setAudioLastDoc] = useState(null);
//   const [audioSearch, setAudioSearch] = useState("");
//   const [playingAudioUrl, setPlayingAudioUrl] = useState(null);
//   const [playingAudioId, setPlayingAudioId] = useState(null);
//   const audioPlayerRef = useRef(null);
//   const audioListRef = useRef(null);
//   const [activeTabFromList, setActiveTabFromList] = useState("image");
//   const [progressTarget, setProgressTarget] = useState(0);
//   const [progressLabel, setProgressLabel] = useState("");
//   const [progressLogs, setProgressLogs] = useState([]);
//   const musicInputRef = useRef(null);
//   const ffmpegRef = useRef(null);
//   const exportInProgressRef = useRef(false);
//   const displayProgress = useAnimatedProgress(progressTarget);

//   const showToast = useCallback((message, type = "info", duration = 3000) => {
//     if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
//     setToast({ message, type });
//     toastTimerRef.current = setTimeout(() => setToast(null), duration);
//   }, []);

//   useEffect(() => {
//     try {
//       const savedAchieve = localStorage.getItem("achieve_form");
//       setShowSocial("no");
//       if (savedAchieve) setAchievementForm(JSON.parse(savedAchieve));
//     } catch (err) {}

//     try {
//       const savedIncome = localStorage.getItem("income_form");
//       if (savedIncome) setIncomeFormData(JSON.parse(savedIncome));
//     } catch (err) {}

//     try {
//       const savedMeeting = localStorage.getItem("Meeting");
//       if (savedMeeting) setMeetingData(JSON.parse(savedMeeting));
//     } catch (err) {}

//     try {
//       const raw = localStorage.getItem("SelectedDesignation");
//       if (!raw) {
//         setSavedDesignation(null);
//         return;
//       }
//       const parsed = JSON.parse(raw);
//       setSavedDesignation(
//         parsed &&
//           (parsed.name ||
//             parsed.profilename ||
//             parsed.image ||
//             parsed.profileimage)
//           ? {
//               name: parsed.name || parsed.profilename || "",
//               image: parsed.image || parsed.profileimage || "",
//               profilename: parsed.profilename || parsed.name || "",
//               profileimage: parsed.profileimage || parsed.image || "",
//             }
//           : null,
//       );
//     } catch {
//       setSavedDesignation(null);
//     }
//   }, []);

//   const isRight = selected?.position === "right";
//   const selll = getSelType();

//   const [closeFilter, setCloseFilter] = useState(() => {
//     try {
//       return localStorage.getItem("close_filter") || "SP";
//     } catch {
//       return "SP";
//     }
//   });

//   useEffect(() => {
//     const handleStorage = (e) => {
//       if (e.key === "close_filter") setCloseFilter(e.newValue || "SP");
//     };
//     window.addEventListener("storage", handleStorage);
//     return () => window.removeEventListener("storage", handleStorage);
//   }, []);

//   const isSubGeneralType = GENERAL_SELECT_TYPES.some(
//     (t) => t.value === selll?.type,
//   );
//   const isSubGeneralType2 = GENERAL_SELECT_TYPES2.some(
//     (t) => t.value === selll?.type,
//   );
//   const Template_Type = selll?.type;

//   const [profileAttrs, setProfileAttrs] = useState({
//     x: isRight ? 145.5 : 0.5,
//     y: 50,
//     width: 155,
//     height: 240,
//     scaleX: isRight ? -1 : 1,
//     offsetX: isRight ? 155 : 0,
//     scaleY: 1,
//     offsetY: 0,
//   });

//   const isBonanza = Template_Type === "Bonanza";
//   const isThankyouRank = Template_Type === "ThankYou_Banner_B";
//   const isTraining = Template_Type === "Training";
//   const isWelcomeClosing = Template_Type === "Welcome_Closing";
//   const isAchievement = Template_Type === "Achievements";
//   const isWelcome = selll?.Subtype === "WELCOME";
//   const isClosing = selll?.Subtype === "CLOSING";
//   const isAnyversary = selll?.type === "Anniversary_Birthday";
//   const isIncome = selll?.type === "Income";
//   const isCapping = selll?.type === "Capping";

//   const isGurupornima = selll?.type === "GURU PORNIMA";

//   const isMeeting =
//     selll?.type === "Meeting" || selll?.type === "General_Meeting";
//   const isRank_B = Template_Type === "Rank_Promotion_B";
//   const isRank = isRankPromotionType(Template_Type) || isTraining;
//   const isMlmToday = selll?.type === "Today_Trending";

//   const showImageFooter = !NO_FOOTER_TYPES.has(Template_Type);

//   const rankInitialAttrs = useMemo(() => {
//     const w = isMeeting
//       ? 170
//       : isCapping
//         ? 100
//         : isIncome
//           ? 105
//           : isAnyversary
//             ? 145
//             : isBonanza
//               ? 150
//               : isWelcome
//                 ? 160
//                 : isClosing
//                   ? 160
//                   : isRank
//                     ? 160
//                     : 110;

//     const h = isMeeting
//       ? 220
//       : isCapping
//         ? 150
//         : isIncome
//           ? 195
//           : isAnyversary
//             ? 220
//             : isClosing
//               ? 230
//               : isWelcome
//                 ? 205
//                 : isBonanza
//                   ? 200
//                   : isRank
//                     ? 200
//                     : 190;

//     const x = isMeeting
//       ? isRight
//         ? 163.5
//         : -16
//       : isCapping
//         ? isRight
//           ? 210
//           : 10
//         : isIncome
//           ? isRight
//             ? 210
//             : 15
//           : isAnyversary
//             ? isRight
//               ? 180
//               : -10
//             : isClosing
//               ? isRight
//                 ? 171
//                 : -10
//               : isWelcome
//                 ? isRight
//                   ? 171
//                   : -10
//                 : isBonanza
//                   ? isRight
//                     ? 179
//                     : -10
//                   : isRank
//                     ? isRight
//                       ? 171
//                       : -10
//                     : isRight
//                       ? 200
//                       : 10;

//     const y = isMeeting
//       ? 66
//       : isCapping
//         ? 65
//         : isIncome
//           ? 60
//           : isAnyversary
//             ? 40
//             : isClosing
//               ? 30
//               : isWelcome
//                 ? 30
//                 : isBonanza
//                   ? 30
//                   : isRank
//                     ? 30
//                     : 40;

//     return {
//       x,
//       y,
//       width: w,
//       height: h,
//       scaleX: isRight ? -1 : 1,
//       offsetX: isRight ? w : 0,
//       scaleY: 1,
//       offsetY: 0,
//     };
//   }, [isRight, Template_Type]);

//   const [rankAttrs, setRankAttrs] = useState(() => rankInitialAttrs);

//   const stickerInitialAttrs = useMemo(
//     () => ({
//       x: isCapping
//         ? isRight
//           ? 190
//           : 1
//         : isAnyversary
//           ? isRight
//             ? 155
//             : -5
//           : isAchievement
//             ? 1
//             : isClosing
//               ? isRight
//                 ? 171
//                 : 0
//               : isWelcome
//                 ? isRight
//                   ? 171
//                   : 0
//                 : isBonanza
//                   ? isRight
//                     ? 180
//                     : 0
//                   : isRank_B
//                     ? isRight
//                       ? 100
//                       : -34
//                     : isRank
//                       ? isRight
//                         ? 171
//                         : 0
//                       : isRight
//                         ? 190
//                         : 2,
//       y: isCapping
//         ? 202
//         : isIncome
//           ? 235
//           : isAnyversary
//             ? 193
//             : isAchievement
//               ? 185
//               : isClosing
//                 ? 243
//                 : isWelcome
//                   ? 215
//                   : isBonanza
//                     ? 200
//                     : isRank_B
//                       ? 210
//                       : isRank
//                         ? 217
//                         : 218,
//       width: isIncome
//         ? 140
//         : isAnyversary
//           ? 170
//           : isAchievement
//             ? 110
//             : isWelcome
//               ? 150
//               : isClosing
//                 ? 150
//                 : isBonanza
//                   ? 150
//                   : isRank_B
//                     ? 240
//                     : isRank
//                       ? 150
//                       : 130,
//       height: isIncome
//         ? 40
//         : isAnyversary
//           ? 100
//           : isAchievement
//             ? 60
//             : isClosing
//               ? 32
//               : isWelcome
//                 ? 32
//                 : isBonanza
//                   ? 95
//                   : isRank_B
//                     ? 90
//                     : isRank
//                       ? 32
//                       : 30,
//       scaleX: 1,
//       offsetX: 0,
//       scaleY: 1,
//       offsetY: 0,
//     }),
//     [isRight, Template_Type],
//   );

//   const [stickerAttrs, setStickerAttrs] = useState(() => stickerInitialAttrs);

//   useEffect(() => {
//     setProfileAttrs((prev) => ({
//       ...prev,
//       x: isRight ? 164.5 : 0.5,
//       y: 80,
//       width: 155,
//       height: 210,
//       scaleX: isRight ? -1 : 1,
//       offsetX: isRight ? 155 : 0,
//       scaleY: 1,
//       offsetY: 0,
//     }));
//     setRankAttrs(rankInitialAttrs);
//     setStickerAttrs(stickerInitialAttrs);
//   }, [isRight, Template_Type, rankInitialAttrs, stickerInitialAttrs]);

//   function getSelType() {
//     try {
//       return JSON.parse(localStorage.getItem("selType")) || {};
//     } catch {
//       return {};
//     }
//   }

//   const justDraggedRef = useRef(false);
//   const pinchRef = useRef({ dist: 0, active: false });

//   const getAttrsByType = (type) =>
//     type === "profile"
//       ? profileAttrs
//       : type === "rank"
//         ? rankAttrs
//         : stickerAttrs;

//   const setAttrsByType = (type, updater) => {
//     if (type === "profile") setProfileAttrs(updater);
//     else if (type === "rank") setRankAttrs(updater);
//     else if (type === "sticker") setStickerAttrs(updater);
//   };

//   const flipImageInPlace = (type) => {
//     const prev = getAttrsByType(type);
//     if (!prev) return;
//     const W = prev.width;
//     const left =
//       prev.scaleX === -1 ? prev.x + prev.offsetX - W : prev.x - prev.offsetX;
//     const newScaleX = prev.scaleX === -1 ? 1 : -1;
//     const next = {
//       ...prev,
//       scaleX: newScaleX,
//       offsetX: newScaleX === -1 ? W : 0,
//       x: left,
//     };
//     setAttrsByType(type, next);
//     const nodeMap = {
//       profile: profileImageRef.current,
//       rank: rankImageRef.current,
//       sticker: stickerImageRef.current,
//     };
//     const node = nodeMap[type];
//     if (node) {
//       node.scaleX(next.scaleX);
//       node.offsetX(next.offsetX);
//       node.x(next.x);
//       node.getLayer()?.batchDraw();
//       transformerRef.current?.forceUpdate();
//     }
//   };

//   const handleImageClick = (type) => (e) => {
//     e.cancelBubble = true;
//     setIsImageSelected(true);
//     setSelectedImageType(type);
//     if (justDraggedRef.current) return;
//     flipImageInPlace(type);
//   };

//   const handleTransformEnd = (type) => (e) => {
//     const node = e.target;
//     const s = node.scaleX();
//     const sy = node.scaleY();
//     const ox = node.offsetX();
//     const oy = node.offsetY();
//     const w0 = node.width();
//     const h0 = node.height();
//     const px = node.x();
//     const py = node.y();
//     const newWidth = Math.max(10, w0 * Math.abs(s));
//     const newHeight = Math.max(10, h0 * Math.abs(sy));
//     const left = Math.min(px + s * (0 - ox), px + s * (w0 - ox));
//     const top = Math.min(py + sy * (0 - oy), py + sy * (h0 - oy));
//     const currentScaleX = s < 0 ? -1 : 1;
//     const currentScaleY = sy < 0 ? -1 : 1;
//     const newOffsetX = currentScaleX === -1 ? newWidth : 0;
//     const newOffsetY = currentScaleY === -1 ? newHeight : 0;
//     node.scaleX(currentScaleX);
//     node.scaleY(currentScaleY);
//     node.width(newWidth);
//     node.height(newHeight);
//     node.offsetX(newOffsetX);
//     node.offsetY(newOffsetY);
//     node.x(left);
//     node.y(top);
//     node.getLayer()?.batchDraw();
//     transformerRef.current?.forceUpdate();
//     const update = (prev) => ({
//       ...prev,
//       x: left,
//       y: top,
//       width: newWidth,
//       height: newHeight,
//       scaleX: currentScaleX,
//       offsetX: newOffsetX,
//       scaleY: currentScaleY,
//       offsetY: newOffsetY,
//     });
//     if (type === "profile") setProfileAttrs(update);
//     else if (type === "rank") setRankAttrs(update);
//     else if (type === "sticker") setStickerAttrs(update);
//   };

//   const handleDragEnd = (type) => (e) => {
//     const node = e.target;
//     applyDragClamp(node, type);
//     justDraggedRef.current = true;
//     setTimeout(() => {
//       justDraggedRef.current = false;
//     }, 0);
//     setIsImageSelected(true);
//     setSelectedImageType(type);
//     if (type === "profile")
//       setProfileAttrs((prev) => ({ ...prev, x: node.x(), y: node.y() }));
//     else if (type === "rank")
//       setRankAttrs((prev) => ({ ...prev, x: node.x(), y: node.y() }));
//     else if (type === "sticker")
//       setStickerAttrs((prev) => ({ ...prev, x: node.x(), y: node.y() }));
//   };

//   const boundBoxFunc = (oldBox, newBox) => {
//     const w = Math.abs(newBox.width);
//     const h = Math.abs(newBox.height);
//     if (w < 20 || h < 20) return oldBox;
//     const left = Math.min(newBox.x, newBox.x + newBox.width);
//     const top = Math.min(newBox.y, newBox.y + newBox.height);
//     if (left < 0 || top < 0 || left + w > STAGE_WIDTH || top + h > STAGE_HEIGHT)
//       return oldBox;
//     return newBox;
//   };

//   const MOVE_RANGE = 20;
//   const homePos = {
//     profile: { x: isRight ? 164.5 : 0.5, y: 80 },
//     rank: { x: rankInitialAttrs.x, y: rankInitialAttrs.y },
//     sticker: { x: stickerInitialAttrs.x, y: stickerInitialAttrs.y },
//   };

//   const applyDragClamp = (node, type) => {
//     const home = homePos[type];
//     if (!node || !home) return;
//     const box = node.getClientRect({
//       relativeTo: node.getLayer(),
//       skipStroke: true,
//       skipShadow: true,
//     });
//     let dx = 0;
//     let dy = 0;
//     if (box.x < home.x - MOVE_RANGE) dx = home.x - MOVE_RANGE - box.x;
//     else if (box.x > home.x + MOVE_RANGE) dx = home.x + MOVE_RANGE - box.x;
//     if (box.y < home.y - MOVE_RANGE) dy = home.y - MOVE_RANGE - box.y;
//     else if (box.y > home.y + MOVE_RANGE) dy = home.y + MOVE_RANGE - box.y;
//     if (dx !== 0) node.x(node.x() + dx);
//     if (dy !== 0) node.y(node.y() + dy);
//   };
//   const makeDragMove = (type) => (e) => applyDragClamp(e.target, type);

//   const MIN_IMG_SIZE = 30;
//   const endPinch = () => {
//     pinchRef.current.dist = 0;
//     if (!pinchRef.current.active) return;
//     pinchRef.current.active = false;
//     setTimeout(() => {
//       justDraggedRef.current = false;
//     }, 200);
//   };
//   const makePinchMove = (type) => (e) => {
//     const touches = e.evt.touches;
//     if (!touches || touches.length < 2) return;
//     e.evt.preventDefault();
//     e.cancelBubble = true;
//     const node = e.target;
//     node.stopDrag();
//     pinchRef.current.active = true;
//     justDraggedRef.current = true;
//     const [t1, t2] = [touches[0], touches[1]];
//     const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
//     const last = pinchRef.current.dist;
//     pinchRef.current.dist = dist;
//     if (!last) return;
//     const baseW = node.width();
//     const baseH = node.height();
//     const left = node.x();
//     const top = node.y();
//     const sx = node.scaleX() < 0 ? -1 : 1;
//     const sy = node.scaleY() < 0 ? -1 : 1;
//     let factor = dist / last;
//     factor = Math.min(
//       factor,
//       (STAGE_WIDTH - left) / baseW,
//       (STAGE_HEIGHT - top) / baseH,
//     );
//     factor = Math.max(factor, MIN_IMG_SIZE / baseW, MIN_IMG_SIZE / baseH);
//     const newW = baseW * factor;
//     const newH = baseH * factor;
//     node.width(newW);
//     node.height(newH);
//     node.offsetX(sx === -1 ? newW : 0);
//     node.offsetY(sy === -1 ? newH : 0);
//     node.getLayer()?.batchDraw();
//     transformerRef.current?.forceUpdate();
//     setAttrsByType(type, (prev) => ({
//       ...prev,
//       width: newW,
//       height: newH,
//       offsetX: sx === -1 ? newW : 0,
//       offsetY: sy === -1 ? newH : 0,
//     }));
//   };
//   const handlePinchEnd = (e) => {
//     if (!e.evt.touches || e.evt.touches.length < 2) endPinch();
//   };
//   const handleTouchCancel = () => endPinch();

//   useEffect(() => {
//     const formData = localStorage.getItem("mlmform");
//     const profileData = sessionStorage.getItem("mlmProfile");
//     if (formData) setMlmForm(JSON.parse(formData));
//     if (profileData) {
//       const parsed = JSON.parse(profileData);
//       setMlmProfile(parsed);
//       setmiddaleImage(parsed?.profileImageURLs?.[0] || null);
//     }
//   }, []);

//   const fetchSubscriptionAndUser = useCallback(async () => {
//     try {
//       setSubLoading(true);
//       const user = getUser();
//       if (!user) return;
//       const mobileNo = user?.mobileNo;
//       if (!mobileNo) return;
//       const activeQuery = query(
//         collection(db, COLLECTIONS.SUBSCRIPTION),
//         where("mobileNo", "==", mobileNo),
//         where("Active", "==", true),
//         where("Expire", "==", false),
//       );
//       const userQuery = query(
//         collection(db, COLLECTIONS.USERS),
//         where("mobileNo", "==", mobileNo),
//       );
//       const [activeSnap, userSnap] = await Promise.all([
//         getDocs(activeQuery),
//         getDocs(userQuery),
//       ]);
//       const activeSubs = activeSnap.docs
//         .map((d) => ({ id: d.id, ...d.data() }))
//         .sort(
//           (a, b) => (b.PurchaseAt?.seconds ?? 0) - (a.PurchaseAt?.seconds ?? 0),
//         );
//       setActiveSub(activeSubs[0] || null);
//       if (!userSnap.empty)
//         setUserData({ id: userSnap.docs[0].id, ...userSnap.docs[0].data() });
//     } catch (err) {
//     } finally {
//       setSubLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchSubscriptionAndUser();
//   }, [fetchSubscriptionAndUser]);

//   const getSelectedImageRef = () => {
//     if (selectedImageType === "profile") return profileImageRef.current;
//     if (selectedImageType === "rank") return rankImageRef.current;
//     if (selectedImageType === "sticker") return stickerImageRef.current;
//     return null;
//   };

//   const getSelectedImageAttrs = () => {
//     if (selectedImageType === "profile") return profileAttrs;
//     if (selectedImageType === "rank") return rankAttrs;
//     if (selectedImageType === "sticker") return stickerAttrs;
//     return null;
//   };

//   useEffect(() => {
//     if (!transformerRef.current) return;
//     if (isImageSelected) {
//       const node = getSelectedImageRef();
//       transformerRef.current.nodes(node ? [node] : []);
//       updateToolbarPos();
//     } else {
//       transformerRef.current.nodes([]);
//     }
//     transformerRef.current.getLayer()?.batchDraw();
//   }, [isImageSelected, selectedImageType]);

//   const updateToolbarPos = () => {
//     const attrs = getSelectedImageAttrs();
//     if (!attrs) return;
//     const { x, y, width } = attrs;
//     setToolbarPos({ x, y, width });
//   };

//   useEffect(() => {
//     if (isImageSelected) updateToolbarPos();
//   }, [
//     profileAttrs,
//     rankAttrs,
//     stickerAttrs,
//     isImageSelected,
//     selectedImageType,
//   ]);

//   const SocialURLs = mlmProfile?.socials || {};
//   const socialText =
//     SocialURLs.Youtube ||
//     SocialURLs.Instagram ||
//     SocialURLs.Facebook ||
//     SocialURLs.X ||
//     "";
//   const availableSocials = [
//     SocialURLs.Youtube ? "youtube" : null,
//     SocialURLs.Instagram ? "instagram" : null,
//     SocialURLs.Facebook ? "facebook" : null,
//     SocialURLs.X ? "x" : null,
//   ].filter(Boolean);

//   const socialIconShift = Math.max(0, socialText.length - 6);
//   const socialIconBaseXLeft = !isSubGeneralType
//     ? clamp(30 - socialIconShift, 160, 220)
//     : clamp(210 - socialIconShift, 160, 220);
//   const socialIconBaseXRight = !isSubGeneralType
//     ? clamp(50 - socialIconShift, 95, 100)
//     : clamp(65 - socialIconShift, 60, 100);
//   const socialIconPositionsLeft = availableSocials.map(
//     (_, i) => socialIconBaseXLeft + i * 6,
//   );
//   const socialIconPositionsRight = availableSocials.map(
//     (_, i) => socialIconBaseXRight + i * 6,
//   );

//   const topuplineURLs =
//     showTopupline === "no"
//       ? []
//       : mlmForm?.topuplineURLs?.length
//         ? mlmForm.topuplineURLs
//         : mlmProfile?.topuplineURLs || [];

//   const logoEntries =
//     showLogo === "no" ? [] : getLocalLogo(`${mlmProfile?.companyId}`) || [];

//   const logo1size = logoEntries[0]?.size || "rectangle";
//   const logo2size = logoEntries[1]?.size || "rectangle";

//   const hoflogo1 = logo1size === "square" ? 25 : 23;
//   const woflogo1 = logo1size === "square" ? 25 : 50;

//   const hoflogo2 = logo2size === "square" ? 25 : 23;
//   const woflogo2 = logo2size === "square" ? 25 : 50;

//   const profileName = mlmForm?.promoter?.name
//     ? mlmForm.promoter.name
//     : mlmProfile?.fullName || "";
//   const profileMobile = mlmForm?.promoter?.name
//     ? mlmForm.promoter.mobile
//     : mlmProfile?.mobile || "";
//   const designation = useMemo(() => {
//     if (isThankyouRank && savedDesignation?.name) {
//       return savedDesignation.name;
//     }

//     return mlmForm?.promoter?.name
//       ? mlmForm.promoter.role
//       : mlmProfile?.designation;
//   }, [isThankyouRank, savedDesignation, mlmForm, mlmProfile]);

//   const AchiveName = achievementForm?.name || "";
//   const AchivePrice = achievementForm?.price || "";
//   const incomePrice = incomeFormData?.amount || "";
//   const incomeDay = incomeFormData?.noOfDay || "";
//   const incomeType = incomeFormData?.typeOfIncome || "";

//   const [bgImage, bgStatus] = useImage(`${selected?.url || ""}`, "anonymous");
//   if (bgStatus === "loaded" || bgImage) bgFirstLoadDoneRef.current = true;
//   const selectedVideoUrl =
//     selected?.backgroundVideoUrl || selected?.videoUrl || null;

//   useEffect(() => {
//     setVideoPlaying(!!selectedVideoUrl);
//   }, [selectedVideoUrl]);
//   const [Sticker] = useImage(
//     isAchievement
//       ? `${selected?.nameImageUrl || ""}`
//       : `${selected?.bannerId || ""}`,
//     "anonymous",
//   );
//   const [AchiveFrame] = useImage(
//     isAchievement
//       ? `${selected?.bannerId || ""}`
//       : `${selected?.nameImageUrl || ""}`,
//     "anonymous",
//   );
//   const sleDay = mlmForm?.bonanzaDays;
//   const iwho = mlmForm?.bonanzaForWhom;

//   const [imgBonanza] = useImage(
//     sleDay === "1 Night/2 Day"
//       ? twodn
//       : sleDay === "2 Night/3 Day"
//         ? threedn
//         : sleDay === "3 Night/4 Day"
//           ? fourdn
//           : "",
//     "anonymous",
//   );
//   const [imgBonanzafamily] = useImage(
//     iwho === "FAMILY" ? familly : null,
//     "anonymous",
//   );

//   const [imgTraining] = useImage(selll?.ShowCaseForm || "", "anonymous");
//   const [tankyoubadge] = useImage(savedDesignation?.profileimage, "anonymous");
//   const [rankbadge] = useImage(`${selected?.rankNameImageUrl}`, "anonymous");
//   const [spdone] = useImage(spdoneimg, "anonymous");
//   // const [rankbadge] = useImage(
//   //   `https://firebasestorage.googleapis.com/v0/b/mlmbooster-a4887.firebasestorage.app/o/companies%2Fprofiles%2F1783622139234_4w41zm.webp?alt=media&token=7a87aeba-624d-491d-88fe-63c188752a60`,
//   //   "anonymous",
//   // );

//   const [imgNum0] = useImage(num0, "anonymous");
//   const [imgNum1] = useImage(num1, "anonymous");
//   const [imgNum2] = useImage(num2, "anonymous");
//   const [imgNum3] = useImage(num3, "anonymous");
//   const [imgNum4] = useImage(num4, "anonymous");
//   const [imgNum5] = useImage(num5, "anonymous");
//   const [imgNum6] = useImage(num6, "anonymous");
//   const [imgNum7] = useImage(num7, "anonymous");
//   const [imgNum8] = useImage(num8, "anonymous");
//   const [imgNum9] = useImage(num9, "anonymous");
//   const [imgComma] = useImage(numComma, "anonymous");
//   const [imgRupee] = useImage(numRupee, "anonymous");

//   const digitImageMap = useMemo(
//     () => ({
//       0: imgNum0,
//       1: imgNum1,
//       2: imgNum2,
//       3: imgNum3,
//       4: imgNum4,
//       5: imgNum5,
//       6: imgNum6,
//       7: imgNum7,
//       8: imgNum8,
//       9: imgNum9,
//       ",": imgComma,
//       "₹": isClosing ? null : imgRupee,
//     }),
//     [
//       imgNum0,
//       imgNum1,
//       imgNum2,
//       imgNum3,
//       imgNum4,
//       imgNum5,
//       imgNum6,
//       imgNum7,
//       imgNum8,
//       imgNum9,
//       imgComma,
//       imgRupee,
//       isClosing,
//     ],
//   );
//   function computeAmountWidth(text, dh, sp = 1.5) {
//     return text.split("").reduce((total, ch, i, arr) => {
//       const aspect = ch === "₹" ? 0.78 : ch === "," ? 0.32 : 0.62;
//       return total + dh * aspect + (i < arr.length - 1 ? sp : 0);
//     }, 0);
//   }

//   function GoldenAmountImages({
//     amountText,
//     digitImageMap,
//     startX,
//     y,
//     digitHeight,
//     spacing = 1.5,
//     onTap,
//   }) {
//     const chars = amountText.split("");
//     let curX = startX;
//     const nodes = [];
//     chars.forEach((ch, i) => {
//       const img = digitImageMap[ch];
//       const aspect = ch === "₹" ? 0.78 : ch === "," ? 0.32 : 0.62;
//       const digitWidth = digitHeight * aspect;
//       const isComma = ch === ",";
//       const charH = isComma ? digitHeight * 0.4 : digitHeight;
//       const yOffset = isComma ? digitHeight * 0.6 : 0;
//       if (img) {
//         nodes.push(
//           <Image
//             key={`amt-${i}-${ch}`}
//             image={img}
//             x={curX}
//             y={y + yOffset}
//             width={digitWidth}
//             height={charH}
//             onClick={onTap}
//             onTap={onTap}
//           />,
//         );
//       } else {
//         nodes.push(
//           <Text
//             key={`amt-${i}-${ch}`}
//             fontFamily="Roboto"
//             x={curX}
//             y={y + yOffset}
//             text={ch}
//             fontSize={digitHeight * 0.8}
//             fill="#ffd700"
//             fontStyle="bold"
//             onClick={onTap}
//             onTap={onTap}
//           />,
//         );
//       }
//       curX += digitWidth + spacing;
//     });
//     return <>{nodes}</>;
//   }

//   const [Imagefooter] = useImage(selectedFooterFrame?.value, "anonymous");
//   const [Imagel2] = useImage(logoEntries?.[0]?.link || "", "anonymous");

//   const [Imagel3] = useImage(logoEntries?.[1]?.link || "", "anonymous");

//   const [Imagef1] = useImage(achievementForm?.features?.[0] || "", "anonymous");
//   const [Imagef2] = useImage(achievementForm?.features?.[1] || "", "anonymous");
//   const [Imagef3] = useImage(achievementForm?.features?.[2] || "", "anonymous");

//   const [MainAchieveImage] = useImage(
//     achievementForm?.mainImage || "",
//     "anonymous",
//   );
//   const [MainIncomeProof] = useImage(
//     incomeFormData?.proofImage || "",
//     "anonymous",
//   );
//   const [ImagetopFrame] = useImage(selectedTopFrame?.value || "", "anonymous");
//   const [Imagetop1] = useImage(topuplineURLs?.[0] || "", "anonymous");
//   const [Imagetop2] = useImage(topuplineURLs?.[1] || "", "anonymous");
//   const [Imagetop3] = useImage(topuplineURLs?.[2] || "", "anonymous");
//   const [Imagetop4] = useImage(topuplineURLs?.[3] || "", "anonymous");
//   const [Imagetop5] = useImage(topuplineURLs?.[4] || "", "anonymous");
//   const [Imagetop6] = useImage(topuplineURLs?.[5] || "", "anonymous");
//   const [Imagetop7] = useImage(topuplineURLs?.[6] || "", "anonymous");
//   const [Imagetop8] = useImage(topuplineURLs?.[7] || "", "anonymous");
//   const [Imagetop9] = useImage(topuplineURLs?.[8] || "", "anonymous");
//   const [Imagetop10] = useImage(topuplineURLs?.[9] || "", "anonymous");
//   const [Imagetop11] = useImage(topuplineURLs?.[10] || "", "anonymous");
//   const [Imagetop12] = useImage(topuplineURLs?.[11] || "", "anonymous");
//   const [Imagetop13] = useImage(topuplineURLs?.[12] || "", "anonymous");
//   const [Imagetop14] = useImage(topuplineURLs?.[13] || "", "anonymous");
//   const [Imagetop15] = useImage(topuplineURLs?.[14] || "", "anonymous");

//   const [ImageChief] = useImage(meetingData?.chiefImage || "", "anonymous");
//   const [ImageProfile] = useImage(
//     mlmForm?.promoter?.name
//       ? `${mlmForm.promoter.image}`
//       : `${middaleImage || ""}`,
//     "anonymous",
//   );

//   const [amountPatternId, setAmountPatternId] = useState("gold1");
//   const [isAmountModalOpen, setIsAmountModalOpen] = useState(false);
//   const selectedAmountOption = AMOUNT_GRADIENT_OPTIONS.find(
//     (option) => option.id === amountPatternId,
//   );
//   const [ImageRank] = useImage(mlmForm?.achiever?.image, "anonymous");
//   const [ImageRank2] = useImage(mlmForm?.achiever?.image, "anonymous");

//   // Re-cache rank image node whenever the source image changes (required for Konva filters)
//   useEffect(() => {
//     const node = rankImageRef.current;
//     if (!node) return;
//     const img = isMeeting ? ImageChief : ImageRank;
//     if (!img) return;
//     const t = setTimeout(() => {
//       try {
//         // iOS has a much tighter per-tab memory budget than desktop/Android;
//         // caching at 4x resolution there can push Safari's WebProcess over
//         // its limit and silently reload the page. Cap it lower on iOS.
//         node.cache({ pixelRatio: isIOS() ? 2 : 4 });
//         node.getLayer()?.batchDraw();
//       } catch (_) {}
//     }, 50);
//     return () => clearTimeout(t);
//   }, [ImageRank, ImageChief, isMeeting]);

//   const formname = getAchieverDisplayName(mlmForm?.achiever);
//   const formcity = mlmForm?.achiever?.city || "";
//   const trainingDate = mlmForm?.selectedDate || "";
//   const formamount = isIncome
//     ? incomeFormData?.amount
//     : isAchievement
//       ? achievementForm?.price
//       : mlmForm?.achiever?.amount || "";

//   const formatAmount = (value) => {
//     const cleaned = String(value).replace(/,/g, "").trim();
//     const numeric = Number(cleaned);
//     if (!Number.isFinite(numeric)) return cleaned;
//     return numeric.toLocaleString("en-IN");
//   };

//   const amountText =
//     String(formamount).trim() !== ""
//       ? isClosing
//         ? `${formatAmount(formamount)}`
//         : `₹${formatAmount(formamount)}`
//       : "";
//   const charslen = amountText.split("");

//   const [insta] = useImage(instagram, "anonymous");
//   const [fb] = useImage(facebook, "anonymous");
//   const [yt] = useImage(youtube, "anonymous");
//   const [xlogo] = useImage(x, "anonymous");
//   const [zooml] = useImage(zoom, "anonymous");
//   const [meetl] = useImage(meet, "anonymous");
//   const [locl] = useImage(Loc, "anonymous");

//   const planDownloads = activeSub?.download ?? 0;
//   const referCredits = userData?.referCredit ?? 0;
//   const totalDownloadsAvailable = planDownloads + referCredits;

//   // const checkCredits = (cost) => {
//   // if (!activeSub) {
//   //   showToast(
//   //     "No active subscription found. Please subscribe to export.", {change for free}
//   //     "error",
//   //   );
//   //   return false;
//   // }
//   // const expiry = parseExpiryDate(activeSub.expirydate);
//   // if (expiry && new Date() > expiry) {
//   //   showToast(
//   //     "Your subscription has expired. Please renew to continue.", {change for free}
//   //     "error",
//   //   );
//   //   return false;
//   // }
//   //   if (totalDownloadsAvailable < cost) {
//   //     showToast(
//   //       `This export needs ${cost} credit${cost > 1 ? "s" : ""}, but you have ${totalDownloadsAvailable}. Please renew your plan.`,
//   //       "error",
//   //       4000,
//   //     );
//   //     return false; {change for free}
//   //   }
//   //   return true;
//   // };

//   // const deductCredits = async (cost, prefix = "Downloaded!") => {
//   //   let remaining = cost;
//   //   const fromPlan = Math.min(planDownloads, remaining);
//   //   const newPlan = planDownloads - fromPlan;
//   //   remaining -= fromPlan;
//   //   const fromRefer = Math.min(referCredits, remaining);
//   //   const newCredits = referCredits - fromRefer;
//   //   const totalAfter = newPlan + newCredits;
//   //   const planExhausted = newPlan === 0 && newCredits === 0;
//   //   if (fromPlan > 0) {
//   //     const subRef = doc(db, "subscription", activeSub.id);
//   //     await updateDoc(subRef, {
//   //       download: newPlan,
//   //       ...(planExhausted ? { Active: false, Expire: true } : {}),
//   //     });
//   //     setActiveSub((prev) => ({
//   //       ...prev,
//   //       download: newPlan,
//   //       ...(planExhausted ? { Active: false, Expire: true } : {}),
//   //     }));
//   //   }
//   //   if (fromRefer > 0) {
//   //     const userRef = doc(db, "users", userData.id);
//   //     await updateDoc(userRef, { referCredit: newCredits });
//   //     setUserData((prev) => ({ ...prev, referCredit: newCredits }));
//   //   }
//   //   if (totalAfter === 0)
//   //     showToast(`${prefix} No download credits remaining.`, "error", 4000);
//   //   else
//   //     showToast(
//   //       `${prefix} ${totalAfter} credit${totalAfter > 1 ? "s" : ""} remaining.`,
//   //       "success",
//   //     );
//   // }; {change for free}

//   const handleExport = async () => {
//     if (exportInProgressRef.current) return;
//     // if (!checkCredits(IMAGE_CREDIT_COST)) return; {change for free}
//     exportInProgressRef.current = true;
//     setExportLoading(true);
//     setIsImageSelected(false);
//     setSelectedImageType(null);
//     await new Promise((res) => setTimeout(res, 80));
//     try {
//       const uri = stageRef.current.toDataURL({
//         pixelRatio: EXPORT_PIXEL_RATIO,
//         mimeType: "image/png",
//         quality: 1,
//       });
//       if (window.ReactNativeWebView) {
//         window.ReactNativeWebView.postMessage(
//           JSON.stringify({
//             type: "DOWNLOAD_IMAGE",
//             base64: uri,
//             fileName: "mlmbooster.png",
//           }),
//         );
//       } else {
//         const link = document.createElement("a");
//         link.download = "mlmbooster.png";
//         link.href = uri;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//       }
//       // await deductCredits(IMAGE_CREDIT_COST, "Downloaded!"); {change for free}
//       setExportedUri(uri);
//       celebrateDownload();
//     } catch (err) {
//       showToast("Export failed. Please try again.", "error");
//     } finally {
//       setExportLoading(false);
//       exportInProgressRef.current = false;
//     }
//   };

//   const handleExportVideo = async () => {
//     if (exportInProgressRef.current) return;
//     const stage = stageRef.current;
//     const videoEl = videoElRef.current;
//     if (!stage || !videoEl) {
//       showToast("Select a video first.", "error");
//       return;
//     }
//     if (
//       typeof MediaRecorder === "undefined" ||
//       typeof stage.toCanvas !== "function"
//     ) {
//       showToast("Video download isn't supported on this device.", "error");
//       return;
//     }
//     // Ensure video is playing (muted so autoplay works)
//     videoEl.muted = true;
//     const startPlay = videoEl.play();
//     if (startPlay && typeof startPlay.catch === "function")
//       startPlay.catch(() => {});
//     setVideoPlaying(true);
//     // if (!checkCredits(VIDEO_CREDIT_COST)) return; {change for free}
//     exportInProgressRef.current = true;
//     setExportLoading(true);
//     setVideoExporting(true);
//     setProgressTarget(5);
//     setProgressLabel("Preparing canvas...");
//     setProgressLogs([]);
//     setIsImageSelected(false);
//     setSelectedImageType(null);
//     // Wait for video to start rendering on canvas
//     await new Promise((res) => setTimeout(res, 300));
//     let rafId = null;
//     let recorder = null;
//     let stream = null;
//     let progressTicker = null;
//     try {
//       if (videoEl.paused) {
//         try {
//           await videoEl.play();
//         } catch (_) {}
//       }
//       // Lower resolution on iOS to stay within its stricter per-tab memory
//       // budget — recording continuously at 3x/4x was pushing Safari's
//       // WebProcess into an OOM reload during "create design" video export.
//       const ratio = VIDEO_PIXEL_RATIO;
//       const rec = document.createElement("canvas");
//       rec.width = STAGE_WIDTH * ratio;
//       rec.height = STAGE_HEIGHT * ratio;
//       const ctx = rec.getContext("2d");
//       const drawFrame = () => {
//         try {
//           // Force Konva to redraw ALL layers (video frame + text + image animations)
//           // before capturing — ensures every frame is current, not stale.
//           stage.getLayers().forEach((l) => l.batchDraw());
//           const c = stage.toCanvas({ pixelRatio: ratio });
//           ctx.drawImage(c, 0, 0, rec.width, rec.height);
//         } catch (_) {}
//         rafId = requestAnimationFrame(drawFrame);
//       };
//       drawFrame();
//       // Canvas captureStream has NO audio tracks — pure visual only, no audio attached.
//       stream = rec.captureStream(30);
//       const mime =
//         ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(
//           (t) => MediaRecorder.isTypeSupported(t),
//         ) || "video/webm";
//       recorder = new MediaRecorder(stream, {
//         mimeType: mime,
//         videoBitsPerSecond: 8_000_000,
//       });
//       const chunks = [];
//       recorder.ondataavailable = (e) => {
//         if (e.data && e.data.size) chunks.push(e.data);
//       };
//       const stopped = new Promise((resolve) => {
//         recorder.onstop = resolve;
//       });
//       const clip =
//         isFinite(videoEl.duration) && videoEl.duration > 0
//           ? videoEl.duration
//           : 8;
//       const recordMs = clip * 1000;

//       // Tick progress from 10% → 90% over the recording duration
//       setProgressTarget(10);
//       setProgressLabel("Recording video...");
//       const recordStart = Date.now();
//       progressTicker = setInterval(() => {
//         const elapsed = Date.now() - recordStart;
//         const pct = Math.min(Math.round((elapsed / recordMs) * 80) + 10, 90);
//         const remaining = Math.max(0, Math.ceil((recordMs - elapsed) / 1000));
//         setProgressTarget(pct);
//         setProgressLabel(
//           remaining > 0 ? `Recording… ${remaining}s left` : "Finishing up...",
//         );
//       }, 250);

//       recorder.start(100);
//       await new Promise((res) => setTimeout(res, recordMs));

//       clearInterval(progressTicker);
//       progressTicker = null;
//       setProgressTarget(93);
//       setProgressLabel("Saving video...");

//       if (rafId) {
//         cancelAnimationFrame(rafId);
//         rafId = null;
//       }
//       if (recorder.state !== "inactive") recorder.stop();
//       await stopped;
//       const blob = new Blob(chunks, { type: "video/webm" });
//       if (!blob.size) throw new Error("Empty recording");

//       setProgressTarget(97);
//       setProgressLabel("Sending to device...");

//       const fileName = `mlmbooster_${Date.now()}.webm`;
//       if (window.ReactNativeWebView) {
//         const base64 = await new Promise((res, rej) => {
//           const reader = new FileReader();
//           reader.onload = () => res(reader.result);
//           reader.onerror = () => rej(new Error("Could not encode video"));
//           reader.readAsDataURL(blob);
//         });
//         window.ReactNativeWebView.postMessage(
//           JSON.stringify({
//             type: "DOWNLOAD_VIDEO",
//             base64,
//             fileName,
//             mimeType: "video/webm",
//           }),
//         );
//       } else {
//         const url = URL.createObjectURL(blob);
//         const link = document.createElement("a");
//         link.href = url;
//         link.download = fileName;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         setTimeout(() => URL.revokeObjectURL(url), 8000);
//       }
//       setProgressTarget(100);
//       setProgressLabel("Done!");
//       celebrateDownload();
//       // await deductCredits(VIDEO_CREDIT_COST, "Video downloaded!"); {change for free}
//     } catch (err) {
//       showToast("Video download failed. Please try again.", "error");
//     } finally {
//       if (progressTicker) clearInterval(progressTicker);
//       if (rafId) cancelAnimationFrame(rafId);
//       try {
//         if (recorder && recorder.state !== "inactive") recorder.stop();
//       } catch (_) {}
//       try {
//         if (stream) stream.getTracks().forEach((t) => t.stop());
//       } catch (_) {}
//       setExportLoading(false);
//       exportInProgressRef.current = false;
//       setTimeout(() => {
//         setVideoExporting(false);
//         setProgressTarget(0);
//         setProgressLabel("");
//       }, 800);
//     }
//   };

//   const handleDeviceMusic = async (file) => {
//     if (!file) return;
//     try {
//       setDeviceLoading(true);
//       setAudioUploadProgress(0);
//       if (!file.type?.startsWith("audio/")) {
//         showToast("Please choose an audio file.", "error");
//         return;
//       }
//       await new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onprogress = (e) => {
//           if (e.lengthComputable) {
//             setAudioUploadProgress(Math.round((e.loaded / e.total) * 80));
//           }
//         };
//         reader.onload = () => resolve();
//         reader.onerror = () => reject(new Error("File read failed"));
//         reader.readAsArrayBuffer(file);
//       });
//       setAudioUploadProgress(85);
//       let duration = null;
//       try {
//         duration = await getAudioDuration(file);
//       } catch (_) {}
//       setAudioUploadProgress(100);
//       if (!duration || duration <= 0) {
//         showToast("Could not read this audio file. Try another one.", "error");
//         return;
//       }
//       setSelectedMusic({ file, name: file.name });
//       setMusicModalOpen(false);
//       showToast(`Music added: ${file.name}`, "success");
//     } finally {
//       setDeviceLoading(false);
//       setAudioUploadProgress(0);
//     }
//   };

//   const handlePresetMusic = async (preset) => {
//     if (!preset?.url) return;
//     try {
//       setPresetLoadingUrl(preset.url);
//       const resp = await fetch(preset.url);
//       if (!resp.ok) throw new Error("Network error");
//       const blob = await resp.blob();
//       const ext = (
//         preset.url.split("?")[0].split(".").pop() || "mp3"
//       ).toLowerCase();
//       const file = new File([blob], `${preset.name}.${ext}`, {
//         type: blob.type || "audio/mpeg",
//       });
//       setSelectedMusic({ file, name: preset.name });
//       setMusicModalOpen(false);
//       showToast(`Music added: ${preset.name}`, "success");
//     } catch (_) {
//       showToast(
//         "Could not load this track. Try another or upload from device.",
//         "error",
//       );
//     } finally {
//       setPresetLoadingUrl(null);
//     }
//   };

//   const handleRemoveMusic = () => {
//     setSelectedMusic(null);
//     setMusicModalOpen(false);
//     showToast("Music removed", "info");
//   };

//   const loadFirestoreAudios = useCallback(
//     async (reset = false, searchTerm = "") => {
//       if (audioLoading) return;
//       setAudioLoading(true);
//       try {
//         let q;
//         if (searchTerm.trim()) {
//           const snap = await getDocs(
//             query(collection(db, "music"), where("Active", "==", true)),
//           );
//           const lower = searchTerm.trim().toLowerCase();
//           const results = snap.docs
//             .map((d) => ({ id: d.id, ...d.data() }))
//             .filter((d) => (d.Name_Music || "").toLowerCase().includes(lower));
//           setFirestoreAudios(results);
//           setAudioHasMore(false);
//           setAudioLastDoc(null);
//         } else {
//           const constraints = [
//             where("Active", "==", true),
//             orderBy("Name_Music"),
//             limit(MUSIC_PAGE_SIZE),
//           ];
//           if (!reset && audioLastDoc)
//             constraints.push(startAfter(audioLastDoc));
//           q = query(collection(db, "music"), ...constraints);
//           const snap = await getDocs(q);
//           const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
//           setFirestoreAudios((prev) => (reset ? docs : [...prev, ...docs]));
//           setAudioLastDoc(snap.docs[snap.docs.length - 1] || null);
//           setAudioHasMore(snap.docs.length === MUSIC_PAGE_SIZE);
//         }
//       } catch (err) {
//         const isMissingIndex =
//           err?.message?.includes("requires an index") ||
//           err?.code === "failed-precondition";
//         if (isMissingIndex) {
//           // console.warn(
//           //   "Firestore music query requires a composite index. Loading fallback results without index ordering.",
//           //   err,
//           // );
//           const snap = await getDocs(
//             query(
//               collection(db, "music"),
//               where("Active", "==", true),
//               limit(MUSIC_PAGE_SIZE),
//             ),
//           );
//           const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
//           setFirestoreAudios(
//             reset
//               ? sortMusicTracks(docs)
//               : [...firestoreAudios, ...sortMusicTracks(docs)],
//           );
//           setAudioLastDoc(snap.docs[snap.docs.length - 1] || null);
//           setAudioHasMore(snap.docs.length === MUSIC_PAGE_SIZE);
//           showToast("Music is loading in compatibility mode.", "warning");
//         } else {
//         }
//       } finally {
//         setAudioLoading(false);
//       }
//       // eslint-disable-next-line react-hooks/exhaustive-deps
//     },
//     [audioLoading, audioLastDoc],
//   );

//   useEffect(() => {
//     if (musicModalOpen && firestoreAudios.length === 0) {
//       loadFirestoreAudios(true, "");
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [musicModalOpen]);

//   useEffect(() => {
//     if (!musicModalOpen) {
//       if (audioPlayerRef.current) {
//         audioPlayerRef.current.pause();
//         audioPlayerRef.current.src = "";
//       }
//       setPlayingAudioId(null);
//       setPlayingAudioUrl(null);
//     }
//   }, [musicModalOpen]);

//   const handleAudioSearchChange = useCallback((val) => {
//     setAudioSearch(val);
//     setAudioLastDoc(null);
//   }, []);

//   useEffect(() => {
//     const t = setTimeout(() => {
//       loadFirestoreAudios(true, audioSearch);
//     }, 400);
//     return () => clearTimeout(t);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [audioSearch]);

//   const handleAudioListScroll = useCallback(() => {
//     const el = audioListRef.current;
//     if (!el || audioLoading || !audioHasMore || audioSearch.trim()) return;
//     if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
//       loadFirestoreAudios(false, "");
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [audioLoading, audioHasMore, audioSearch]);

//   const handlePlayAudio = useCallback(
//     (track) => {
//       const url = track.Url || "";
//       if (!url) return;
//       if (playingAudioId === track.id) {
//         if (audioPlayerRef.current) {
//           if (audioPlayerRef.current.paused) {
//             audioPlayerRef.current.play();
//           } else {
//             audioPlayerRef.current.pause();
//           }
//         }
//         return;
//       }
//       if (audioPlayerRef.current) {
//         audioPlayerRef.current.pause();
//         audioPlayerRef.current.src = url;
//         audioPlayerRef.current.play().catch(() => {});
//       }
//       setPlayingAudioId(track.id);
//       setPlayingAudioUrl(url);
//     },
//     [playingAudioId],
//   );

//   const handleSelectFirestoreTrack = useCallback(async (track) => {
//     const url = track.Url || "";
//     const name = track.Name_Music || "Track";
//     if (!url) return;
//     try {
//       setPresetLoadingUrl(track.id);
//       if (audioPlayerRef.current) {
//         audioPlayerRef.current.pause();
//         audioPlayerRef.current.src = "";
//       }
//       setPlayingAudioId(null);
//       const resp = await fetch(url);
//       if (!resp.ok) throw new Error("Network error");
//       const blob = await resp.blob();
//       const ext = (url.split("?")[0].split(".").pop() || "mp3").toLowerCase();
//       const file = new File([blob], `${name}.${ext}`, {
//         type: blob.type || "audio/mpeg",
//       });
//       setSelectedMusic({ file, name });
//       setMusicModalOpen(false);
//       showToast(`Music added: ${name}`, "success");
//     } catch (_) {
//       showToast(
//         "Could not load this track. Try another or upload from device.",
//         "error",
//       );
//     } finally {
//       setPresetLoadingUrl(null);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const handleExportWithMusic = async () => {
//     if (!selectedMusic?.file) {
//       handleExport();
//       return;
//     }
//     if (exportInProgressRef.current) return;
//     // if (!checkCredits(VIDEO_CREDIT_COST)) return; {change for free}
//     exportInProgressRef.current = true;
//     const withTimeout = (promise, ms, label) =>
//       Promise.race([
//         promise,
//         new Promise((_, reject) =>
//           setTimeout(
//             () =>
//               reject(
//                 new Error(
//                   `${label} timed out (${ms / 1000}s). Check your internet and try again.`,
//                 ),
//               ),
//             ms,
//           ),
//         ),
//       ]);
//     setMusicExporting(true);
//     setProgressTarget(0);
//     setProgressLogs([]);
//     setIsImageSelected(false);
//     setSelectedImageType(null);
//     await new Promise((res) => setTimeout(res, 80));
//     let videoBlob = null;
//     let videoDataUrl = null;
//     try {
//       setProgressTarget(5);
//       setProgressLabel("Loading export engine...");
//       const { FFmpeg } = await import("@ffmpeg/ffmpeg");
//       const { fetchFile, toBlobURL } = await import("@ffmpeg/util");
//       let ffmpeg = ffmpegRef.current;
//       if (!ffmpeg) {
//         ffmpeg = new FFmpeg();
//         ffmpeg.on("log", ({ message }) => {
//           setProgressLogs((prev) => [...prev.slice(-4), message]);
//         });
//         ffmpeg.on("progress", ({ progress: p }) => {
//           const bump = Math.round(Math.min(Math.max(p, 0), 1) * 40) + 50;
//           setProgressTarget((prev) => Math.max(prev, bump));
//         });
//         const sources = [
//           { label: "local", core: ffmpegCoreURL, wasm: ffmpegWasmURL },
//           {
//             label: "jsdelivr",
//             core: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js",
//             wasm: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm",
//           },
//           {
//             label: "unpkg",
//             core: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js",
//             wasm: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm",
//           },
//         ];
//         setProgressLabel("Loading codec...");
//         setProgressTarget(8);
//         let loaded = false;
//         let lastErr = null;
//         for (const src of sources) {
//           try {
//             const coreURL = await withTimeout(
//               toBlobURL(src.core, "text/javascript"),
//               45000,
//               "Codec load",
//             );
//             setProgressTarget(11);
//             const wasmURL = await withTimeout(
//               toBlobURL(src.wasm, "application/wasm"),
//               60000,
//               "Engine load",
//             );
//             setProgressTarget(13);
//             await withTimeout(
//               ffmpeg.load({ coreURL, wasmURL }),
//               30000,
//               "Engine start",
//             );
//             loaded = true;
//             break;
//           } catch (e) {
//             // console.warn("FFmpeg core source failed:", src.label, e);
//             lastErr = e;
//           }
//         }
//         if (!loaded)
//           throw new Error(
//             "Could not load video engine. " +
//               (lastErr?.message || "Network error"),
//           );
//         ffmpegRef.current = ffmpeg;
//       }
//       setProgressTarget(15);
//       setProgressLabel("Reading audio duration...");
//       let duration = null;
//       try {
//         duration = await getAudioDuration(selectedMusic.file);
//       } catch (_) {}
//       if (!duration || duration <= 0)
//         throw new Error(
//           "Could not read audio duration. Try a different audio file.",
//         );
//       duration = Math.min(duration, MAX_MUSIC_SECONDS);
//       setProgressTarget(25);
//       setProgressLabel("Capturing design...");
//       // Same iOS memory-budget concern as the plain video recorder above —
//       // cap the capture resolution used before feeding FFmpeg's WASM buffer.
//       const uri = stageRef.current.toDataURL({
//         pixelRatio: VIDEO_PIXEL_RATIO,
//         mimeType: "image/png",
//         quality: 1,
//       });
//       if (!uri || uri.length < 100)
//         throw new Error("Could not capture design. Try again.");
//       setProgressTarget(35);
//       setProgressLabel("Preparing files...");
//       await ffmpeg.writeFile("input.png", await fetchFile(uri));
//       setProgressTarget(45);
//       const ext =
//         (selectedMusic.file?.name || "track.mp3")
//           .split(".")
//           .pop()
//           .toLowerCase() || "mp3";
//       const audName = `input.${ext}`;
//       await ffmpeg.writeFile(audName, await fetchFile(selectedMusic.file));
//       setProgressTarget(50);
//       setProgressLabel("Encoding video...");
//       let progressTicker = setInterval(() => {
//         setProgressTarget((prev) => (prev < 90 ? prev + 2 : prev));
//       }, 600);
//       try {
//         await ffmpeg.exec([
//           "-loop",
//           "1",
//           "-framerate",
//           "1",
//           "-i",
//           "input.png",
//           "-i",
//           audName,
//           "-t",
//           String(duration),
//           "-vf",
//           "scale=640:640",
//           "-c:v",
//           "libx264",
//           "-preset",
//           "ultrafast",
//           "-tune",
//           "stillimage",
//           "-c:a",
//           "aac",
//           "-b:a",
//           "128k",
//           "-ar",
//           "44100",
//           "-ac",
//           "2",
//           "-pix_fmt",
//           "yuv420p",
//           "-r",
//           "1",
//           "-shortest",
//           "-avoid_negative_ts",
//           "make_zero",
//           "-movflags",
//           "+faststart",
//           "output.mp4",
//         ]);
//       } finally {
//         clearInterval(progressTicker);
//       }
//       setProgressTarget(95);
//       setProgressLabel("Saving video...");
//       const data = await ffmpeg.readFile("output.mp4");
//       videoBlob = new Blob([data.buffer], { type: "video/mp4" });
//       if (videoBlob.size < 1000)
//         throw new Error(
//           "Video encoding failed (file too small). Try a different audio file.",
//         );
//       try {
//         await ffmpeg.deleteFile("input.png");
//       } catch (_) {}
//       try {
//         await ffmpeg.deleteFile(audName);
//       } catch (_) {}
//       try {
//         await ffmpeg.deleteFile("output.mp4");
//       } catch (_) {}
//       const fileName = `mlmbooster_${Date.now()}.mp4`;
//       if (window.ReactNativeWebView) {
//         setProgressLabel("Sending to device...");
//         videoDataUrl = await new Promise((res, rej) => {
//           const reader = new FileReader();
//           reader.onload = () => res(reader.result);
//           reader.onerror = () =>
//             rej(new Error("Could not encode video for download"));
//           reader.readAsDataURL(videoBlob);
//         });
//         window.ReactNativeWebView.postMessage(
//           JSON.stringify({
//             type: "DOWNLOAD_VIDEO",
//             base64: videoDataUrl,
//             fileName,
//             mimeType: "video/mp4",
//           }),
//         );
//       } else {
//         const dlUrl = URL.createObjectURL(videoBlob);
//         const link = document.createElement("a");
//         link.href = dlUrl;
//         link.download = fileName;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         setTimeout(() => URL.revokeObjectURL(dlUrl), 8000);
//       }
//       setProgressTarget(100);
//       setProgressLabel("Done!");
//       celebrateDownload();
//       // await deductCredits(VIDEO_CREDIT_COST, "Video downloaded!"); {change for free}
//     } catch (err) {
//       showToast("Video export failed. Please try again.", "error", 5000);
//     } finally {
//       setMusicExporting(false);
//       exportInProgressRef.current = false;
//       setTimeout(() => {
//         setProgressTarget(0);
//         setProgressLabel("");
//         setProgressLogs([]);
//       }, 800);
//     }
//   };

//   const handleFlip = (e) => {
//     e.stopPropagation();
//     if (!selectedImageType) return;
//     const getAttrs = () => {
//       if (selectedImageType === "profile") return profileAttrs;
//       if (selectedImageType === "rank") return rankAttrs;
//       if (selectedImageType === "sticker") return stickerAttrs;
//     };
//     const setAttrs = (updater) => {
//       if (selectedImageType === "profile") setProfileAttrs(updater);
//       else if (selectedImageType === "rank") setRankAttrs(updater);
//       else if (selectedImageType === "sticker") setStickerAttrs(updater);
//     };
//     const current = getAttrs();
//     const isFlipped = current.offsetY === -1;
//     setAttrs((prev) => ({
//       ...prev,
//       scaleY: isFlipped ? 1 : -1,
//       offsetY: isFlipped ? 0 : prev.height,
//     }));
//     const nodeMap = {
//       profile: profileImageRef.current,
//       rank: rankImageRef.current,
//       sticker: stickerImageRef.current,
//     };
//     const node = nodeMap[selectedImageType];
//     if (node) {
//       const isFlipped = node.scaleY() === -1;
//       node.scaleY(isFlipped ? 1 : -1);
//       node.offsetY(isFlipped ? 0 : current.height);
//       node.getLayer()?.batchDraw();
//     }
//   };

//   const [stageSize, setStageSize] = useState(320);

//   useLayoutEffect(() => {
//     const update = () => {
//       if (!stageContainerRef.current) return;

//       setStageSize(stageContainerRef.current.clientWidth);
//     };

//     update();

//     const ro = new ResizeObserver(update);
//     ro.observe(stageContainerRef.current);

//     window.addEventListener("resize", update);

//     return () => {
//       ro.disconnect();
//       window.removeEventListener("resize", update);
//     };
//   }, []);

//   const handleStageMouseDown = (e) => {
//     if (e.target === e.target.getStage()) {
//       setIsImageSelected(false);
//       setSelectedImageType(null);
//     }
//   };

//   const ActualProfilename = profileName?.toUpperCase() || "PROFILENAME";
//   const profileNameFontSize = isSubGeneralType
//     ? 11
//     : (ActualProfilename?.length ?? 0) <= 20
//       ? 9.5
//       : (ActualProfilename?.length ?? 0) < 25
//         ? 8.5
//         : 7.5;
//   const companyNameFrt =
//     mlmProfile?.companyName === `${`ANVIK INTERNATIONAL`}`
//       ? "ANVIK"
//       : mlmProfile?.companyName || "";

//   const ActualDesignation =
//     [designation?.toUpperCase(), companyNameFrt?.toUpperCase()]
//       .filter(Boolean)
//       .join(", ") || "DESIGNATION";

//   let DesignationfontSize = 8;
//   if (ActualDesignation?.length > 10 && ActualDesignation?.length <= 19)
//     DesignationfontSize = 6;
//   else if (ActualDesignation?.length > 19 && ActualDesignation?.length <= 30)
//     DesignationfontSize = 5;
//   else if (ActualDesignation?.length > 30) DesignationfontSize = 4;

//   const TOOLBAR_HEIGHT = 28;
//   const TOOLBAR_WIDTH = 36;
//   const toolbarTop = Math.max(0, toolbarPos.y - TOOLBAR_HEIGHT - 6);
//   const toolbarLeft = clamp(
//     toolbarPos.x + toolbarPos.width / 1 - TOOLBAR_WIDTH / 2,
//     0,
//     STAGE_WIDTH - TOOLBAR_WIDTH,
//   );

//   const exportCost =
//     selectedVideoUrl || selectedMusic?.file
//       ? VIDEO_CREDIT_COST
//       : IMAGE_CREDIT_COST;

//   const downloadBtnLabel = () => {
//     if (subLoading) return "Loading...";
//     if (exportLoading) return "Exporting...";
//     // if (!activeSub) return "No Plan";
//     // if (totalDownloadsAvailable < exportCost) return "Not enough credits";
//     // return `Download (${totalDownloadsAvailable})`; {change for free}
//     return `Download`;
//     // return `Download`;
//   };

//   const canExport = !subLoading && !exportLoading;
//   // activeSub &&
//   // totalDownloadsAvailable >= exportCost; {change for free}

//   // Resolved export function based on current tab/music selection
//   const activeExportFn =
//     activeTabFromList === "video" && selectedVideoUrl
//       ? handleExportVideo
//       : selectedMusic
//         ? handleExportWithMusic
//         : handleExport;

//   return (
//     <div className="flex flex-col justify-start items-center w-full h-[calc(100dvh-60px)] overflow-hidden">
//       {toast && <Toast message={toast.message} type={toast.type} />}

//       <div
//         ref={stageContainerRef}
//         data-guide="editor-canvas"
//         className="relative mt-2 flex-shrink-0"
//         style={{
//           width: "min(320px, 96vw)",
//           height: `${STAGE_WIDTH * stageScale}px`,
//           overflow: "hidden",
//           touchAction: "none",
//         }}
//       >
//         {bgStatus === "loading" && (
//           <div
//             className="absolute inset-0 z-10 overflow-hidden pointer-events-none"
//             style={{
//               background:
//                 "linear-gradient(135deg,#0088DA 0%,#1a3a7a 50%,#0088DA 100%)",
//             }}
//           >
//             <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
//               <div
//                 style={{
//                   display: "flex",
//                   flexDirection: "column",
//                   alignItems: "center",
//                   gap: 10,
//                 }}
//               >
//                 <div
//                   style={{
//                     width: 44,
//                     height: 44,
//                     borderRadius: "50%",
//                     border: "3px solid rgba(255,255,255,0.15)",
//                     borderTop: "3px solid #ffffff",
//                     animation: "spin 0.9s linear infinite",
//                   }}
//                 />
//                 <span
//                   style={{
//                     color: "#fff",
//                     fontSize: 13,
//                     fontWeight: 700,
//                     letterSpacing: 0.5,
//                   }}
//                 >
//                   Preparing design
//                   <LoadingDots />
//                 </span>
//                 <SlowLoadingHint
//                   delay={3500}
//                   message="आपका शानदार डिज़ाइन अभी लोड हो रहा है — बड़े टेम्प्लेट या धीमे कनेक्शन में कुछ अतिरिक्त सेकंड लग सकते हैं। कृपया थोड़ा इंतज़ार करें, बस होने ही वाला है।"
//                 />
//               </div>
//             </div>
//           </div>
//         )}
//         <div
//           style={{
//             width: STAGE_WIDTH,
//             height: STAGE_HEIGHT,
//             transform: `scale(${stageScale})`,
//             transformOrigin: "top left",
//           }}
//         >
//           <Stage
//             // ref={stageRef}
//             // width={STAGE_WIDTH}
//             // height={STAGE_HEIGHT}
//             ref={stageRef}
//             width={stageSize}
//             height={stageSize}
//             className="bg-background border border-border shadow-lg"
//             onMouseDown={handleStageMouseDown}
//             onTouchStart={handleStageMouseDown}
//           >
//             <Layer>
//               <Image
//                 image={bgImage}
//                 x={0}
//                 y={0}
//                 width={STAGE_WIDTH}
//                 height={STAGE_HEIGHT}
//               />

//               {isThankyouRank ? (
//                 <Image
//                   image={tankyoubadge}
//                   x={190}
//                   y={38}
//                   width={100}
//                   height={40}
//                 />
//               ) : null}
//               {isClosing ? (
//                 <Image
//                   image={spdone}
//                   x={isRight ? 15 : 162.5}
//                   y={165}
//                   width={135}
//                   height={33}
//                 />
//               ) : null}
//               {isRank ? (
//                 <Image
//                   image={rankbadge}
//                   x={isRank_B ? (isRight ? 10 : 156) : isRight ? 12 : 145}
//                   y={isRank_B ? 148 : 134}
//                   width={150}
//                   height={60}
//                 />
//               ) : null}

//               {selectedVideoUrl ? (
//                 <VideoCanvas
//                   src={selectedVideoUrl}
//                   playing={videoPlaying}
//                   width={STAGE_WIDTH}
//                   height={STAGE_HEIGHT}
//                   onError={() => showToast("Video failed to load.", "error")}
//                   videoElRef={videoElRef}
//                 />
//               ) : null}
//               {/* {isMlmToday ? null : ( */}
//               <Image
//                 image={Imagel2}
//                 x={1}
//                 y={2}
//                 width={woflogo1}
//                 height={hoflogo1}
//               />
//               {/* )} */}
//               {/* {isMlmToday ? null : ( */}
//               <Image
//                 image={Imagel3}
//                 x={logo2size === "square" ? 292 : 268}
//                 y={2}
//                 width={woflogo2}
//                 height={hoflogo2}
//               />
//               {/* )} */}

//               {(() => {
//                 const slots = [
//                   { img: Imagetop1 },
//                   { img: Imagetop2 },
//                   { img: Imagetop3 },
//                   { img: Imagetop4 },
//                   { img: Imagetop5 },
//                   { img: Imagetop6 },
//                   { img: Imagetop7 },
//                   { img: Imagetop8 },
//                   { img: Imagetop9 },
//                   { img: Imagetop10 },
//                   { img: Imagetop11 },
//                   { img: Imagetop12 },
//                   { img: Imagetop13 },
//                   { img: Imagetop14 },
//                   { img: Imagetop15 },
//                 ].filter((s) => s.img);
//                 const HowMuchTopupline = topuplineURLs.length;
//                 const SLOT_SIZE =
//                   HowMuchTopupline <= 8
//                     ? 25
//                     : HowMuchTopupline <= 12
//                       ? 19
//                       : HowMuchTopupline >= 12
//                         ? 15
//                         : 15;
//                 const SLOT_PADDING = 2;
//                 const INNER_SIZE = SLOT_SIZE - SLOT_PADDING * 2;
//                 const totalWidth = slots.length * SLOT_SIZE;
//                 const extraOffset = slots.length === 7 ? -10 : 0;
//                 const startX = (STAGE_WIDTH - totalWidth) / 2 + extraOffset;
//                 return slots.map((slot, i) => {
//                   const x = startX + i * SLOT_SIZE;
//                   return (
//                     <React.Fragment key={i}>
//                       <Image
//                         image={ImagetopFrame}
//                         x={x}
//                         y={2}
//                         width={SLOT_SIZE}
//                         height={SLOT_SIZE}
//                       />
//                       <Group
//                         x={x}
//                         y={2}
//                         clipFunc={(ctx) => {
//                           ctx.arc(
//                             SLOT_SIZE / 2,
//                             SLOT_SIZE / 2,
//                             INNER_SIZE / 2,
//                             0,
//                             Math.PI * 2,
//                             false,
//                           );
//                           ctx.closePath();
//                         }}
//                       >
//                         <Image
//                           image={slot.img}
//                           x={SLOT_PADDING}
//                           y={SLOT_PADDING}
//                           width={INNER_SIZE}
//                           height={INNER_SIZE}
//                           onTap={() => setIsOpen(true)}
//                           onClick={() => setIsOpen(true)}
//                         />
//                       </Group>
//                     </React.Fragment>
//                   );
//                 });
//               })()}

//               {isMeeting ||
//               isSubGeneralType ||
//               isMlmToday ||
//               isSubGeneralType2 ? null : (
//                 <Text
//                   fontFamily="Roboto"
//                   x={
//                     isCapping
//                       ? isRight
//                         ? 24
//                         : 162
//                       : isIncome
//                         ? isRight
//                           ? 25
//                           : 125
//                         : isAnyversary
//                           ? isRight
//                             ? 7
//                             : 138
//                           : isAchievement
//                             ? 83
//                             : isClosing
//                               ? isRight
//                                 ? 6
//                                 : 151
//                               : isWelcome
//                                 ? isRight
//                                   ? 6
//                                   : 151
//                                 : isBonanza
//                                   ? isRight
//                                     ? 4
//                                     : 150
//                                   : isRank_B
//                                     ? isRight
//                                       ? 6
//                                       : 148
//                                     : isRank
//                                       ? isRight
//                                         ? 6
//                                         : 151
//                                       : isRight
//                                         ? 35
//                                         : 127
//                   }
//                   y={
//                     isCapping
//                       ? isRight
//                         ? 187
//                         : 187
//                       : isAnyversary
//                         ? isRight
//                           ? 155
//                           : 155
//                         : isAchievement
//                           ? 97
//                           : isWelcome
//                             ? isRight
//                               ? 106
//                               : 106
//                             : isBonanza
//                               ? 97
//                               : isRank_B
//                                 ? isRight
//                                   ? 111
//                                   : 104
//                                 : 96
//                   }
//                   width={isCapping ? 130 : isAnyversary ? 175 : 165}
//                   height={5}
//                   text={`${formname.toUpperCase() || ActualProfilename}`}
//                   fontSize={fs(isAnyversary ? 8 : 9.5)}
//                   fill="white"
//                   fontStyle="1000"
//                   letterSpacing={0.1}
//                   verticalAlign="middle"
//                   align="center"
//                 />
//               )}

//               {isMeeting ||
//               isSubGeneralType ||
//               isMlmToday ||
//               isSubGeneralType2 ? null : (
//                 <Text
//                   fontFamily="Roboto"
//                   x={
//                     isCapping
//                       ? isRight
//                         ? 70
//                         : 205
//                       : isIncome
//                         ? isRight
//                           ? 85
//                           : 185
//                         : isAnyversary
//                           ? isRight
//                             ? 75
//                             : 205
//                           : isAchievement
//                             ? 140
//                             : isClosing
//                               ? isRight
//                                 ? 65
//                                 : 215
//                               : isWelcome
//                                 ? isRight
//                                   ? 65
//                                   : 215
//                                 : isBonanza
//                                   ? isRight
//                                     ? 54
//                                     : 212
//                                   : isRank_B
//                                     ? isRight
//                                       ? 35
//                                       : 180
//                                     : isRank
//                                       ? isRight
//                                         ? 65
//                                         : 215
//                                       : isRight
//                                         ? 98
//                                         : 188
//                   }
//                   y={
//                     isCapping
//                       ? isRight
//                         ? 198
//                         : 198
//                       : isAnyversary
//                         ? 176
//                         : isAchievement
//                           ? 113
//                           : isWelcome
//                             ? isRight
//                               ? 124
//                               : 126
//                             : isBonanza
//                               ? isRight
//                                 ? 112
//                                 : 112
//                               : isRank_B
//                                 ? isRight
//                                   ? 120
//                                   : 115
//                                 : 112
//                   }
//                   width={100}
//                   height={5}
//                   text={"FROM/" + `${formcity.toUpperCase() || ""}`}
//                   fontSize={fs(7)}
//                   fill="white"
//                   fontStyle="bold"
//                   letterSpacing={0.1}
//                   verticalAlign="middle"
//                   align="center"
//                 />
//               )}

//               {isWelcome ? (
//                 <Image
//                   image={Imagel2}
//                   x={isRight ? 70 : 180}
//                   y={178}
//                   width={60}
//                   height={60}
//                 />
//               ) : null}

//               {isSubGeneralType ? (
//                 <Image
//                   ref={profileImageRef}
//                   image={ImageProfile}
//                   x={isRight ? 165 : 0.5}
//                   y={56}
//                   width={155}
//                   height={230}
//                   scaleX={profileAttrs.scaleX}
//                   offsetX={profileAttrs.offsetX}
//                   scaleY={profileAttrs.scaleY}
//                   offsetY={profileAttrs.offsetY}
//                   // draggable
//                   onClick={handleImageClick("profile")}
//                   onTap={handleImageClick("profile")}
//                   // onDragMove={makeDragMove("profile")}
//                   // onDragEnd={handleDragEnd("profile")}
//                   // onTouchMove={makePinchMove("profile")}
//                   // onTouchEnd={handlePinchEnd}
//                   // onTouchCancel={handleTouchCancel}
//                   // onTransformEnd={handleTransformEnd("profile")}
//                 />
//               ) : isSubGeneralType2 || isAchievement ? null : (
//                 // <Image
//                 //   ref={rankImageRef}
//                 //   image={isMeeting ? ImageChief : ImageRank}
//                 //   x={rankAttrs.x}
//                 //   y={rankAttrs.y}
//                 //   width={rankAttrs.width}
//                 //   height={rankAttrs.height}
//                 //   scaleX={rankAttrs.scaleX}
//                 //   offsetX={rankAttrs.offsetX}
//                 //   scaleY={rankAttrs.scaleY}
//                 //   offsetY={rankAttrs.offsetY}
//                 //   draggable
//                 //   onClick={handleImageClick("rank")}
//                 //   onTap={handleImageClick("rank")}
//                 //   onDragMove={makeDragMove("rank")}
//                 //   onDragEnd={handleDragEnd("rank")}
//                 //   onTouchMove={makePinchMove("rank")}
//                 //   onTouchEnd={handlePinchEnd}
//                 //   onTouchCancel={handleTouchCancel}
//                 //   onTransformEnd={handleTransformEnd("rank")}
//                 // />
//                 <Image
//                   ref={rankImageRef}
//                   image={isMeeting ? ImageChief : ImageRank}
//                   x={rankAttrs.x}
//                   y={rankAttrs.y}
//                   width={rankAttrs.width}
//                   height={rankAttrs.height}
//                   scaleX={rankAttrs.scaleX}
//                   offsetX={rankAttrs.offsetX}
//                   scaleY={rankAttrs.scaleY}
//                   offsetY={rankAttrs.offsetY}
//                   filters={
//                     isWelcomeClosing ? [FadeBottomFilter] : [FadeEdgesFilter]
//                   }
//                   // draggable
//                   onClick={handleImageClick("rank")}
//                   onTap={handleImageClick("rank")}
//                   // onDragMove={makeDragMove("rank")}
//                   // onDragEnd={handleDragEnd("rank")}
//                   // onTouchMove={makePinchMove("rank")}
//                   // onTouchEnd={handlePinchEnd}
//                   // onTouchCancel={handleTouchCancel}
//                   // onTransformEnd={handleTransformEnd("rank")}
//                 />
//               )}

//               {isMeeting || isSubGeneralType || isSubGeneralType2 ? null : (
//                 <Image
//                   ref={stickerImageRef}
//                   image={Sticker}
//                   x={stickerAttrs.x}
//                   y={stickerAttrs.y}
//                   width={stickerAttrs.width}
//                   height={stickerAttrs.height}
//                   scaleX={stickerAttrs.scaleX}
//                   offsetX={stickerAttrs.offsetX}
//                   scaleY={stickerAttrs.scaleY}
//                   offsetY={stickerAttrs.offsetY}
//                   // draggable
//                   // onClick={handleImageClick("sticker")}
//                   // onTap={handleImageClick("sticker")}
//                   // onDragMove={makeDragMove("sticker")}
//                   // onDragEnd={handleDragEnd("sticker")}
//                   // onTouchMove={makePinchMove("sticker")}
//                   // onTouchEnd={handlePinchEnd}
//                   // onTouchCancel={handleTouchCancel}
//                   // onTransformEnd={handleTransformEnd("sticker")}
//                 />
//               )}

//               {isBonanza ? (
//                 <Image
//                   x={isRight ? 100 : 170}
//                   y={isRight ? 210 : 200}
//                   width={70}
//                   height={70}
//                   image={imgBonanza}
//                 />
//               ) : null}
//               {isBonanza ? (
//                 <Image
//                   x={isRight ? 135 : 235}
//                   y={isRight ? 230 : 220}
//                   width={30}
//                   height={30}
//                   image={imgBonanzafamily}
//                 />
//               ) : null}

//               {isTraining ? (
//                 <Image
//                   x={isRight ? 10 : 155}
//                   y={isRight ? 115 : 115}
//                   width={150}
//                   height={100}
//                   image={imgTraining}
//                 />
//               ) : null}

//               {isMeeting ? (
//                 <Image
//                   x={isRight ? 10 : 155}
//                   y={isRight ? 62 : 62}
//                   width={150}
//                   height={90}
//                   image={imgTraining}
//                 />
//               ) : null}

//               {isTraining ? (
//                 <Text
//                   fontFamily="Roboto"
//                   x={isRight ? 178 : 8}
//                   y={231}
//                   width={150}
//                   height={30}
//                   text={String(trainingDate?.toUpperCase() || "")}
//                   fontSize={fs(12)}
//                   fill="white"
//                   fontStyle="1000"
//                   letterSpacing={0}
//                   verticalAlign="center"
//                   align="center"
//                 />
//               ) : null}

//               {isAchievement ? (
//                 <Text
//                   fontFamily="Roboto"
//                   x={110}
//                   y={232}
//                   width={130}
//                   height={30}
//                   text={String(AchiveName.toUpperCase() || "")}
//                   fontSize={fs(18)}
//                   fill="gold"
//                   fontStyle="1000"
//                   letterSpacing={0}
//                   verticalAlign="center"
//                   align="center"
//                 />
//               ) : null}

//               {isIncome ? (
//                 <Text
//                   fontFamily="Roboto"
//                   x={isRight ? 60 : 165}
//                   y={isRight ? 195 : 197}
//                   width={130}
//                   height={30}
//                   text={`${incomeDay} ${incomeType.toUpperCase()}`}
//                   fontSize={fs(18)}
//                   fill="white"
//                   fontStyle="1000"
//                   letterSpacing={0}
//                   verticalAlign="center"
//                   align="center"
//                 />
//               ) : null}

//               {isSubGeneralType ||
//               isSubGeneralType2 ||
//               Template_Type === "Anniversary_Birthday" ||
//               Template_Type === "Bonanza" ||
//               Template_Type === "Capping" ||
//               isWelcome ||
//               isMeeting ||
//               isTraining ? null : (
//                 <GoldenAmountImages
//                   amountText={amountText}
//                   digitImageMap={digitImageMap}
//                   // startX={(() => {
//                   //   const SPACING = 1.5;
//                   //   const dh = isIncome ? 26 : isClosing ? 30 : 32;
//                   //   if (isIncome)  return isRight ? 20  : 135;
//                   //   if (isClosing) return isRight ? 49  : 145;
//                   //   if (!isRight)  return 0;

//                   //   const maxW = computeAmountWidth("₹XX,XX,XXX", dh, SPACING);
//                   //   const curW = computeAmountWidth(amountText, dh, SPACING);
//                   //   return Math.max(0, 125 + (maxW - curW));
//                   // })()}
//                   startX={
//                     isIncome
//                       ? isRight
//                         ? 20
//                         : 135
//                       : isClosing
//                         ? isRight
//                           ? 45
//                           : 195
//                         : isRight
//                           ? charslen?.length === 10
//                             ? 134
//                             : charslen?.length === 9
//                               ? 145
//                               : charslen?.length === 8
//                                 ? 155
//                                 : charslen?.length === 7
//                                   ? 165
//                                   : charslen?.length === 6
//                                     ? 170
//                                     : 195
//                           : isRank_B
//                             ? charslen?.length === 6
//                               ? 30
//                               : charslen?.length === 7
//                                 ? 30
//                                 : charslen?.length === 9
//                                   ? 15
//                                   : charslen?.length === 10
//                                     ? 7
//                                     : 30
//                             : 1.5
//                   }
//                   y={isIncome ? 132 : isClosing ? 132 : isRank_B ? 252 : 250}
//                   digitHeight={
//                     isIncome ? 26 : isClosing ? 28 : isRank_B ? 25 : 32
//                   }
//                   spacing={isRank_B ? 4 : 1.5}
//                 />
//               )}

//               {isIncome ? (
//                 <Group x={isRight ? 100 : 170} y={107}>
//                   <Image
//                     x={10}
//                     y={120}
//                     width={50}
//                     height={50}
//                     image={MainIncomeProof}
//                   />
//                   <Image
//                     x={5}
//                     y={115}
//                     width={60}
//                     height={60}
//                     image={AchiveFrame}
//                   />
//                 </Group>
//               ) : null}

//               {isAchievement ? (
//                 <Image
//                   rotationDeg={-10}
//                   x={10}
//                   y={120}
//                   width={40}
//                   height={40}
//                   image={Imagef1}
//                 />
//               ) : null}
//               {isAchievement ? (
//                 <Image
//                   rotationDeg={10}
//                   x={265}
//                   y={115}
//                   width={40}
//                   height={40}
//                   image={Imagef2}
//                 />
//               ) : null}
//               {isAchievement ? (
//                 <Image
//                   rotationDeg={10}
//                   x={265}
//                   y={175}
//                   width={40}
//                   height={40}
//                   image={Imagef3}
//                 />
//               ) : null}
//               {isAchievement ? (
//                 <Group x={76} y={120} width={200} height={100}>
//                   <Image width={165} height={90} image={MainAchieveImage} />
//                   <Image
//                     width={182}
//                     x={-2}
//                     y={-2}
//                     height={110}
//                     image={AchiveFrame}
//                   />
//                 </Group>
//               ) : null}

//               {isMeeting ? (
//                 <>
//                   <Text
//                     fontFamily="Roboto"
//                     x={isRight ? -13 : 135}
//                     y={175}
//                     width={200}
//                     height={30}
//                     text={meetingData?.chiefName.toUpperCase()}
//                     fontSize={fs(13)}
//                     fontStyle="1000"
//                     fill="white"
//                     letterSpacing={0}
//                     verticalAlign="center"
//                     align="center"
//                   />
//                   <Text
//                     fontFamily="Roboto"
//                     x={isRight ? -13 : 135}
//                     y={190}
//                     width={200}
//                     height={30}
//                     text={meetingData?.chiefDesignation.toUpperCase()}
//                     fontSize={fs(9)}
//                     fontStyle="500"
//                     fill="white"
//                     letterSpacing={0}
//                     verticalAlign="center"
//                     align="center"
//                   />
//                 </>
//               ) : null}

//               {isMeeting ? (
//                 isRight ? (
//                   <Group x={50} y={210}>
//                     <Text
//                       fontFamily="Roboto"
//                       x={0}
//                       y={1}
//                       text={meetingData?.date}
//                       fontSize={fs(13)}
//                       fontStyle="1000"
//                       fill="white"
//                       letterSpacing={0}
//                       verticalAlign="start"
//                       align="start"
//                     />
//                     <Text
//                       fontFamily="Roboto"
//                       x={0}
//                       y={21}
//                       text={meetingData?.time}
//                       fontSize={fs(13)}
//                       fontStyle="1000"
//                       fill="white"
//                       letterSpacing={0}
//                       verticalAlign="start"
//                       align="start"
//                     />
//                   </Group>
//                 ) : (
//                   <Group x={190} y={210}>
//                     <Text
//                       fontFamily="Roboto"
//                       x={0}
//                       y={3}
//                       text={meetingData?.date}
//                       fontSize={fs(13)}
//                       fontStyle="1000"
//                       fill="white"
//                       letterSpacing={0}
//                       verticalAlign="end"
//                       align="end"
//                     />
//                     <Text
//                       fontFamily="Roboto"
//                       x={0}
//                       y={21}
//                       text={meetingData?.time}
//                       fontSize={fs(13)}
//                       fontStyle="1000"
//                       fill="white"
//                       letterSpacing={0}
//                       verticalAlign="end"
//                       align="end"
//                     />
//                   </Group>
//                 )
//               ) : null}

//               {meetingData?.hostMode === "add" && isMeeting ? (
//                 <Group X={isRight ? 5 : 100} Y={0.9}>
//                   <Text
//                     fontFamily="Roboto"
//                     x={20}
//                     y={285.5}
//                     width={180}
//                     height={30}
//                     text={meetingData?.hostName.toUpperCase()}
//                     fontSize={fs(7)}
//                     fontStyle="1000"
//                     fill="white"
//                     letterSpacing={0}
//                     verticalAlign="center"
//                     align="center"
//                   />
//                   <Text
//                     fontFamily="Roboto"
//                     x={20}
//                     y={295}
//                     width={180}
//                     height={30}
//                     text={ActualDesignation}
//                     fontSize={fs(6)}
//                     fontStyle="1000"
//                     fill="white"
//                     letterSpacing={0}
//                     verticalAlign="center"
//                     align="center"
//                   />
//                   {showMobile === "yes" ? (
//                     <Text
//                       fontFamily="Roboto"
//                       x={20}
//                       y={303}
//                       width={180}
//                       height={30}
//                       text={`+91${profileMobile}` || "+91XXXXXXXXXX"}
//                       fontSize={fs(6)}
//                       fontStyle="1000"
//                       fill="white"
//                       letterSpacing={0}
//                       verticalAlign="center"
//                       align="center"
//                     />
//                   ) : null}
//                 </Group>
//               ) : null}

//               {isMeeting ||
//               isSubGeneralType ||
//               !showImageFooter ? null : isRight ? (
//                 <Image
//                   scaleX={-1}
//                   scaleY={1}
//                   image={Imagefooter}
//                   x={320}
//                   y={280}
//                   width={350}
//                   height={41}
//                   onClick={() => setIsOpenFtr(true)}
//                   onTap={() => setIsOpenFtr(true)}
//                 />
//               ) : (
//                 <Image
//                   image={Imagefooter}
//                   x={0}
//                   y={280}
//                   width={350}
//                   height={41}
//                   onClick={() => setIsOpenFtr(true)}
//                   onTap={() => setIsOpenFtr(true)}
//                 />
//               )}

//               {isSubGeneralType && showImageFooter ? (
//                 isRight ? (
//                   <Image
//                     image={Imagefooter}
//                     x={0}
//                     y={280}
//                     width={350}
//                     height={41}
//                     onClick={() => setIsOpenFtr(true)}
//                     onTap={() => setIsOpenFtr(true)}
//                   />
//                 ) : (
//                   <Image
//                     scaleX={-1}
//                     scaleY={1}
//                     image={Imagefooter}
//                     x={320}
//                     y={280}
//                     width={350}
//                     height={41}
//                     onClick={() => setIsOpenFtr(true)}
//                     onTap={() => setIsOpenFtr(true)}
//                   />
//                 )
//               ) : null}
//               {isSubGeneralType || meetingData?.hostMode === "none"
//                 ? null
//                 : (() => {
//                     const fW = isMeeting ? 60 : 95;
//                     const fH = isMeeting ? 70 : 110;
//                     const fY = isMeeting ? 250 : 210;
//                     const baseX = isRight
//                       ? isMeeting
//                         ? 60
//                         : 96
//                       : isMeeting
//                         ? 260
//                         : 224;
//                     const baseScaleX = isRight ? -1 : 1;
//                     const leftEdge = baseScaleX === -1 ? baseX - fW : baseX;
//                     const curScaleX = footerImgFlip ? -baseScaleX : baseScaleX;
//                     const curOffsetX = curScaleX === -1 ? fW : 0;
//                     return (
//                       <Image
//                         image={ImageProfile}
//                         x={leftEdge}
//                         y={fY}
//                         scaleX={curScaleX}
//                         offsetX={curOffsetX}
//                         width={fW}
//                         height={fH}
//                         onClick={() => setFooterImgFlip((f) => !f)}
//                         onTap={() => setFooterImgFlip((f) => !f)}
//                       />
//                     );
//                   })()}
//               {isMeeting ? (
//                 isRight ? (
//                   <Text
//                     fontFamily="Roboto"
//                     x={12}
//                     y={40}
//                     width={180}
//                     height={30}
//                     text={meetingData?.teamName.toUpperCase()}
//                     fontSize={fs(9)}
//                     fontStyle="1000"
//                     fill="white"
//                     letterSpacing={0}
//                     verticalAlign="center"
//                     align="center"
//                   />
//                 ) : (
//                   <Text
//                     fontFamily="Roboto"
//                     x={125}
//                     y={40}
//                     width={180}
//                     height={30}
//                     text={meetingData?.teamName.toUpperCase()}
//                     fontSize={fs(9)}
//                     fontStyle="1000"
//                     fill="white"
//                     letterSpacing={0}
//                     verticalAlign="center"
//                     align="center"
//                   />
//                 )
//               ) : null}

//               {isMeeting ? (
//                 meetingData?.meetingMode === "online" ? (
//                   meetingData?.platformType === "instagram" ||
//                   meetingData?.platformType === "youtube" ||
//                   meetingData?.platformType === "facebook" ? (
//                     <Group
//                       x={
//                         meetingData?.hostMode === "add"
//                           ? isRight
//                             ? 180
//                             : 0
//                           : isRight
//                             ? 135
//                             : 0
//                       }
//                       y={285}
//                     >
//                       <Image
//                         image={
//                           meetingData?.platformType === "instagram"
//                             ? insta
//                             : meetingData?.platformType === "youtube"
//                               ? yt
//                               : meetingData?.platformType === "facebook"
//                                 ? fb
//                                 : null
//                         }
//                         x={isRight ? 0 : 10}
//                         y={0}
//                         width={25}
//                         height={25}
//                       />
//                       <Text
//                         fontFamily="Roboto"
//                         x={isRight ? 35 : 45}
//                         y={8}
//                         text={meetingData?.platformInput}
//                         fontSize={fs(12)}
//                         fontStyle="1000"
//                         fill="white"
//                         letterSpacing={0}
//                         verticalAlign="start"
//                         align="start"
//                       />
//                     </Group>
//                   ) : (
//                     <Group x={isRight ? 175 : 0} y={285}>
//                       <Image
//                         image={
//                           meetingData?.platformType === "zoom"
//                             ? zooml
//                             : meetingData?.platformType === "meet"
//                               ? meetl
//                               : null
//                         }
//                         x={isRight ? 0 : 10}
//                         y={0}
//                         width={25}
//                         height={25}
//                       />
//                       <Text
//                         fontFamily="Roboto"
//                         x={isRight ? 35 : 45}
//                         y={4}
//                         text={meetingData?.meetingId}
//                         fontSize={fs(9)}
//                         fontStyle="1000"
//                         fill="white"
//                         letterSpacing={0}
//                         verticalAlign="start"
//                         align="start"
//                       />
//                       <Text
//                         fontFamily="Roboto"
//                         x={isRight ? 35 : 45}
//                         y={15}
//                         text={meetingData?.meetingPassword}
//                         fontSize={fs(9)}
//                         fontStyle="1000"
//                         fill="white"
//                         letterSpacing={0}
//                         verticalAlign="start"
//                         align="start"
//                       />
//                     </Group>
//                   )
//                 ) : (
//                   <Group x={isRight ? 140 : 15} y={285}>
//                     <Image image={locl} x={0} y={0} width={25} height={25} />
//                     <Text
//                       fontFamily="Roboto"
//                       x={30}
//                       y={5}
//                       text={meetingData?.address1}
//                       fontSize={fs(10)}
//                       fontStyle="1000"
//                       fontVariant="italic"
//                       fill="white"
//                       letterSpacing={0}
//                       verticalAlign="center"
//                       align="center"
//                     />
//                     <Text
//                       fontFamily="Roboto"
//                       x={30}
//                       y={15}
//                       text={meetingData?.address2}
//                       fontSize={fs(7.5)}
//                       fontStyle="1000"
//                       fontVariant="italic"
//                       fill="white"
//                       letterSpacing={0}
//                       verticalAlign="end"
//                       align="end"
//                     />
//                   </Group>
//                 )
//               ) : null}

//               {isMeeting &&
//               meetingData?.hostMode === "none" &&
//               showMobile === "yes" ? (
//                 <Group x={isRight ? 0 : 240} y={298}>
//                   <Text
//                     fontFamily="Roboto"
//                     x={3}
//                     y={0}
//                     text={"For More Details Contact On :-"}
//                     fontSize={fs(5.5)}
//                     fontStyle="1000"
//                     fontVariant="italic"
//                     fill="white"
//                     letterSpacing={0}
//                     verticalAlign="center"
//                     align="center"
//                   />
//                   <Text
//                     fontFamily="Roboto"
//                     x={12}
//                     y={6}
//                     text={`+91${profileMobile}` || "+91XXXXXXXXXX"}
//                     fontSize={fs(7.5)}
//                     fontStyle="1000"
//                     fill="white"
//                     letterSpacing={0}
//                     verticalAlign="end"
//                     align="end"
//                   />
//                 </Group>
//               ) : null}
//               {/* original Footer  */}
//               {isMeeting || isSubGeneralType ? null : isRight ? (
//                 <>
//                   {showMobile === "yes" && (
//                     <>
//                       <Text
//                         fontFamily="Roboto"
//                         x={isSubGeneralType2 ? 240 : isRank_B ? 233 : 252}
//                         y={isRank_B ? 294 : 298}
//                         width={150}
//                         height={5}
//                         text="CALL FOR ASSOCIATION"
//                         fontSize={fs(4.5)}
//                         fill="white"
//                         fontStyle="bold"
//                         verticalAlign="middle"
//                         onClick={() => setIsOpenFtr(true)}
//                         onTap={() => setIsOpenFtr(true)}
//                       />
//                       <Text
//                         fontFamily="Roboto"
//                         x={isSubGeneralType2 ? 235 : isRank_B ? 230 : 250}
//                         y={isRank_B ? 294 : 297}
//                         width={150}
//                         height={20}
//                         text={`+91${profileMobile}` || "+91XXXXXXXXXX"}
//                         fontSize={fs(7.5)}
//                         fill="white"
//                         fontStyle="bold"
//                         verticalAlign="middle"
//                         onClick={() => setIsOpenFtr(true)}
//                         onTap={() => setIsOpenFtr(true)}
//                       />
//                     </>
//                   )}

//                   {(() => {
//                     let iconX = 0;
//                     const iconPositions = {};
//                     if (SocialURLs.Youtube) {
//                       iconPositions.youtube = iconX;
//                       iconX += 7;
//                     }
//                     if (SocialURLs.Instagram) {
//                       iconPositions.instagram = iconX;
//                       iconX += 7;
//                     }
//                     if (SocialURLs.Facebook) {
//                       iconPositions.facebook = iconX;
//                       iconX += 7;
//                     }
//                     if (SocialURLs.X) {
//                       iconPositions.x = iconX;
//                       iconX += 7;
//                     }
//                     const textStartX = iconX + 3;
//                     const socialGroupWidth = socialText
//                       ? textStartX + socialText.length * 3.5
//                       : 0;
//                     const parentCenterX = isSubGeneralType
//                       ? 140 - 300 / 2
//                       : 185 - 300 / 2;
//                     return (
//                       <Group
//                         x={parentCenterX}
//                         y={
//                           isSubGeneralType || isSubGeneralType2
//                             ? 295
//                             : isRank_B
//                               ? 295
//                               : 300
//                         }
//                       >
//                         <Text
//                           fontFamily="Roboto"
//                           x={23}
//                           y={0}
//                           width={200}
//                           height={2}
//                           text={ActualProfilename}
//                           // main Actual
//                           fontSize={fs(profileNameFontSize)}
//                           fill="white"
//                           fontStyle="1000"
//                           align="center"
//                           verticalAlign="middle"
//                           onClick={() => setIsOpenFtr(true)}
//                           onTap={() => setIsOpenFtr(true)}
//                         />
//                         <Text
//                           fontFamily="Roboto"
//                           x={25}
//                           y={10.5}
//                           width={200}
//                           height={2}
//                           text={ActualDesignation}
//                           fontSize={fs(6.5)}
//                           fill="white"
//                           fontStyle="bold"
//                           align="center"
//                           verticalAlign="middle"
//                           onClick={() => setIsOpenFtr(true)}
//                           onTap={() => setIsOpenFtr(true)}
//                         />
//                       </Group>
//                     );
//                   })()}
//                 </>
//               ) : (
//                 <>
//                   {showMobile === "yes" && (
//                     <>
//                       <Text
//                         fontFamily="Roboto"
//                         x={35}
//                         y={isRank_B ? 295 : 298}
//                         width={150}
//                         height={5}
//                         text="CALL FOR ASSOCIATION" //ORIGINAL CALL
//                         fontSize={fs(4.5)}
//                         fill="white"
//                         fontStyle="bold"
//                         verticalAlign="middle"
//                         onClick={() => setIsOpenFtr(true)}
//                         onTap={() => setIsOpenFtr(true)}
//                       />
//                       <Text
//                         fontFamily="Roboto"
//                         x={33}
//                         y={isRank_B ? 295 : 297}
//                         width={150}
//                         height={20}
//                         text={`+91${profileMobile}` || "+91XXXXXXXXXX"}
//                         fontSize={fs(7.5)}
//                         fill="white"
//                         fontStyle="bold"
//                         verticalAlign="middle"
//                         onClick={() => setIsOpenFtr(true)}
//                         onTap={() => setIsOpenFtr(true)}
//                       />
//                     </>
//                   )}
//                   {(() => {
//                     let iconX = 0;
//                     const iconPositions = {};
//                     if (SocialURLs.Youtube) {
//                       iconPositions.youtube = iconX;
//                       iconX += 10;
//                     }
//                     if (SocialURLs.Instagram) {
//                       iconPositions.instagram = iconX;
//                       iconX += 10;
//                     }
//                     if (SocialURLs.Facebook) {
//                       iconPositions.facebook = iconX;
//                       iconX += 10;
//                     }
//                     if (SocialURLs.X) {
//                       iconPositions.x = iconX;
//                       iconX += 10;
//                     }
//                     const textStartX = iconX + 2;
//                     const socialGroupWidth = socialText
//                       ? textStartX + socialText.length * 3.5
//                       : 0;
//                     const parentCenterX = isSubGeneralType
//                       ? 285 - 300 / 2
//                       : 196 - 300 / 2;
//                     return (
//                       <Group
//                         x={parentCenterX}
//                         y={
//                           isSubGeneralType || isSubGeneralType2
//                             ? 295
//                             : isRank_B
//                               ? 296
//                               : 299
//                         }
//                       >
//                         <Text
//                           fontFamily="Roboto"
//                           x={15}
//                           y={0}
//                           width={200}
//                           height={2}
//                           text={ActualProfilename}
//                           fontSize={fs(profileNameFontSize)}
//                           fill="white"
//                           fontStyle="1000"
//                           align="center"
//                           verticalAlign="middle"
//                           onClick={() => setIsOpenFtr(true)}
//                           onTap={() => setIsOpenFtr(true)}
//                         />
//                         <Text
//                           fontFamily="Roboto"
//                           x={15}
//                           y={showSocial === "no" ? 10.5 : 9.5}
//                           width={200}
//                           height={2}
//                           text={ActualDesignation}
//                           fontSize={fs(6.5)}
//                           fill="white"
//                           fontStyle="bold"
//                           align="center"
//                           verticalAlign="middle"
//                           onClick={() => setIsOpenFtr(true)}
//                           onTap={() => setIsOpenFtr(true)}
//                         />
//                         {showSocial === "never"
//                           ? socialText && (
//                               <Group x={(200 - socialGroupWidth) / 2} y={12}>
//                                 {SocialURLs.Youtube && (
//                                   <Image
//                                     image={yt}
//                                     x={iconPositions.youtube}
//                                     y={0}
//                                     width={9}
//                                     height={9}
//                                   />
//                                 )}
//                                 {SocialURLs.Instagram && (
//                                   <Image
//                                     image={insta}
//                                     x={iconPositions.instagram}
//                                     y={0}
//                                     width={9}
//                                     height={9}
//                                   />
//                                 )}
//                                 {SocialURLs.Facebook && (
//                                   <Image
//                                     image={fb}
//                                     x={iconPositions.facebook}
//                                     y={0}
//                                     width={9}
//                                     height={9}
//                                   />
//                                 )}
//                                 {SocialURLs.X && (
//                                   <Image
//                                     image={xlogo}
//                                     x={iconPositions.x}
//                                     y={0}
//                                     width={9}
//                                     height={9}
//                                   />
//                                 )}
//                                 <Text
//                                   fontFamily="Roboto"
//                                   x={textStartX}
//                                   y={0}
//                                   width={100 - textStartX}
//                                   height={9}
//                                   text={socialText}
//                                   fontSize={fs(6)}
//                                   fill="white"
//                                   fontStyle="bold"
//                                   align="left"
//                                   verticalAlign="middle"
//                                   onClick={() => setIsOpenFtr(true)}
//                                   onTap={() => setIsOpenFtr(true)}
//                                 />
//                               </Group>
//                             )
//                           : null}
//                       </Group>
//                     );
//                   })()}
//                 </>
//               )}

//               {isSubGeneralType ? (
//                 isRight ? (
//                   <>
//                     {showMobile === "yes" && (
//                       <>
//                         <Text
//                           fontFamily="Roboto"
//                           x={35}
//                           y={298}
//                           width={150}
//                           height={5}
//                           text="CALL FOR ASSOCIATION"
//                           fontSize={fs(4.5)}
//                           fill="white"
//                           fontStyle="bold"
//                           verticalAlign="middle"
//                           onClick={() => setIsOpenFtr(true)}
//                           onTap={() => setIsOpenFtr(true)}
//                         />
//                         <Text
//                           fontFamily="Roboto"
//                           x={30}
//                           y={297}
//                           width={150}
//                           height={20}
//                           text={`+91${profileMobile}` || "+91XXXXXXXXXX"}
//                           fontSize={fs(7.5)}
//                           fill="white"
//                           fontStyle="bold"
//                           verticalAlign="middle"
//                           onClick={() => setIsOpenFtr(true)}
//                           onTap={() => setIsOpenFtr(true)}
//                         />
//                       </>
//                     )}
//                     {(() => {
//                       let iconX = 0;
//                       const iconPositions = {};
//                       if (SocialURLs.Youtube) {
//                         iconPositions.youtube = iconX;
//                         iconX += 7;
//                       }
//                       if (SocialURLs.Instagram) {
//                         iconPositions.instagram = iconX;
//                         iconX += 7;
//                       }
//                       if (SocialURLs.Facebook) {
//                         iconPositions.facebook = iconX;
//                         iconX += 7;
//                       }
//                       if (SocialURLs.X) {
//                         iconPositions.x = iconX;
//                         iconX += 7;
//                       }
//                       const textStartX = iconX + 3;
//                       const socialGroupWidth = socialText
//                         ? textStartX + socialText.length * 3.5
//                         : 0;
//                       return (
//                         <Group
//                           x={105}
//                           y={
//                             isSubGeneralType || isSubGeneralType2
//                               ? 295
//                               : isRank_B
//                                 ? 290
//                                 : 300
//                           }
//                         >
//                           <Text
//                             fontFamily="Roboto"
//                             x={23}
//                             y={0}
//                             width={200}
//                             height={2}
//                             text={ActualProfilename}
//                             fontSize={fs(profileNameFontSize)}
//                             fill="white"
//                             fontStyle="1000"
//                             align="center"
//                             verticalAlign="middle"
//                             onClick={() => setIsOpenFtr(true)}
//                             onTap={() => setIsOpenFtr(true)}
//                           />
//                           <Text
//                             fontFamily="Roboto"
//                             x={25}
//                             y={10.5}
//                             width={200}
//                             height={2}
//                             text={ActualDesignation}
//                             fontSize={fs(7)}
//                             fill="white"
//                             fontStyle="bold"
//                             align="center"
//                             verticalAlign="middle"
//                             onClick={() => setIsOpenFtr(true)}
//                             onTap={() => setIsOpenFtr(true)}
//                           />
//                         </Group>
//                       );
//                     })()}
//                   </>
//                 ) : (
//                   <>
//                     {showMobile === "yes" && (
//                       <>
//                         <Text
//                           fontFamily="Roboto"
//                           x={240}
//                           y={isRank_B ? 295 : 298}
//                           width={150}
//                           height={5}
//                           text="CALL FOR ASSOCIATION"
//                           fontSize={fs(4.5)}
//                           fill="white"
//                           fontStyle="bold"
//                           verticalAlign="middle"
//                           onClick={() => setIsOpenFtr(true)}
//                           onTap={() => setIsOpenFtr(true)}
//                         />
//                         <Text
//                           fontFamily="Roboto"
//                           x={235}
//                           y={isRank_B ? 295 : 297}
//                           width={150}
//                           height={20}
//                           text={`+91${profileMobile}` || "+91XXXXXXXXXX"}
//                           fontSize={fs(7.5)}
//                           fill="white"
//                           fontStyle="bold"
//                           verticalAlign="middle"
//                           onClick={() => setIsOpenFtr(true)}
//                           onTap={() => setIsOpenFtr(true)}
//                         />
//                       </>
//                     )}
//                     {(() => {
//                       let iconX = 0;
//                       const iconPositions = {};
//                       if (SocialURLs.Youtube) {
//                         iconPositions.youtube = iconX;
//                         iconX += 10;
//                       }
//                       if (SocialURLs.Instagram) {
//                         iconPositions.instagram = iconX;
//                         iconX += 10;
//                       }
//                       if (SocialURLs.Facebook) {
//                         iconPositions.facebook = iconX;
//                         iconX += 10;
//                       }
//                       if (SocialURLs.X) {
//                         iconPositions.x = iconX;
//                         iconX += 10;
//                       }
//                       const textStartX = iconX + 2;
//                       const socialGroupWidth = socialText
//                         ? textStartX + socialText.length * 3.5
//                         : 0;
//                       return (
//                         <Group
//                           x={0}
//                           y={
//                             isSubGeneralType || isSubGeneralType2
//                               ? 295
//                               : isRank_B
//                                 ? 290
//                                 : 300
//                           }
//                         >
//                           <Text
//                             fontFamily="Roboto"
//                             x={-10}
//                             y={0}
//                             width={200}
//                             height={2}
//                             text={ActualProfilename}
//                             fontSize={fs(profileNameFontSize)}
//                             fill="white"
//                             fontStyle="1000"
//                             align="center"
//                             verticalAlign="middle"
//                             onClick={() => setIsOpenFtr(true)}
//                             onTap={() => setIsOpenFtr(true)}
//                           />
//                           <Text
//                             fontFamily="Roboto"
//                             x={-10}
//                             y={showSocial === "no" ? 10.5 : 9.5}
//                             width={200}
//                             height={2}
//                             text={ActualDesignation}
//                             fontSize={fs(7)}
//                             fill="white"
//                             fontStyle="bold"
//                             align="center"
//                             verticalAlign="middle"
//                             onClick={() => setIsOpenFtr(true)}
//                             onTap={() => setIsOpenFtr(true)}
//                           />
//                           {showSocial === "never"
//                             ? socialText && (
//                                 <Group x={(200 - socialGroupWidth) / 2} y={12}>
//                                   {SocialURLs.Youtube && (
//                                     <Image
//                                       image={yt}
//                                       x={iconPositions.youtube}
//                                       y={0}
//                                       width={9}
//                                       height={9}
//                                     />
//                                   )}
//                                   {SocialURLs.Instagram && (
//                                     <Image
//                                       image={insta}
//                                       x={iconPositions.instagram}
//                                       y={0}
//                                       width={9}
//                                       height={9}
//                                     />
//                                   )}
//                                   {SocialURLs.Facebook && (
//                                     <Image
//                                       image={fb}
//                                       x={iconPositions.facebook}
//                                       y={0}
//                                       width={9}
//                                       height={9}
//                                     />
//                                   )}
//                                   {SocialURLs.X && (
//                                     <Image
//                                       image={xlogo}
//                                       x={iconPositions.x}
//                                       y={0}
//                                       width={9}
//                                       height={9}
//                                     />
//                                   )}
//                                   <Text
//                                     fontFamily="Roboto"
//                                     x={textStartX}
//                                     y={0}
//                                     width={100 - textStartX}
//                                     height={9}
//                                     text={socialText}
//                                     fontSize={fs(6)}
//                                     fill="white"
//                                     fontStyle="bold"
//                                     align="left"
//                                     verticalAlign="middle"
//                                     onClick={() => setIsOpenFtr(true)}
//                                     onTap={() => setIsOpenFtr(true)}
//                                   />
//                                 </Group>
//                               )
//                             : null}
//                         </Group>
//                       );
//                     })()}
//                   </>
//                 )
//               ) : null}

//               {/* Watermark */}
//               {/* <Text
//                 text="Design By : 9229885383"
//                 x={isRight ? 313 : 2}
//                 y={100}
//                 fontSize={5}
//                 fontStyle="500"
//                 fontFamily="Arial"
//                 fill="#fff"
//                 rotation={-90}
//                 listening={false}
//               /> */}

//               <Transformer
//                 ref={transformerRef}
//                 keepRatio={false}
//                 rotateEnabled={false}
//                 resizeEnabled={false}
//                 borderEnabled={false}
//                 boundBoxFunc={boundBoxFunc}
//                 enabledAnchors={[]}
//               />
//             </Layer>
//           </Stage>
//         </div>

//         {/* Preview-only logo: outside the Konva Stage so exports stay clean. */}
//         {/* {bgStatus === "loaded" && (
//           <div
//             className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none select-none"
//             aria-hidden="true"
//           >
//             <img
//               src="/mlmboo2l.png"
//               alt=""
//               draggable="false"
//               className="w-9 h-9 object-contain"
//               style={{ opacity: 0.18, filter: "grayscale(1)" }}
//             />
//           </div>
//         )} */}

//         {selectedVideoUrl && (
//           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//             <button
//               onClick={() => {
//                 setVideoPlaying((p) => !p);
//               }}
//               title={videoPlaying ? "Pause" : "Play"}
//               className="pointer-events-auto w-14 h-14 rounded-full bg-black/45 backdrop-blur-sm text-white flex items-center justify-center shadow-lg transition-all active:scale-90 hover:bg-black/60"
//             >
//               {videoPlaying ? (
//                 <svg
//                   width="22"
//                   height="22"
//                   viewBox="0 0 24 24"
//                   fill="currentColor"
//                 >
//                   <rect x="6" y="5" width="4" height="14" rx="1" />
//                   <rect x="14" y="5" width="4" height="14" rx="1" />
//                 </svg>
//               ) : (
//                 <svg
//                   width="24"
//                   height="24"
//                   viewBox="0 0 24 24"
//                   fill="currentColor"
//                 >
//                   <path d="M8 5v14l11-7z" />
//                 </svg>
//               )}
//             </button>
//           </div>
//         )}
//       </div>

//       {isAmountModalOpen && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(0,0,0,0.55)",
//             zIndex: 1000,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//           onClick={() => setIsAmountModalOpen(false)}
//         >
//           <div
//             style={{
//               background: "#fff",
//               borderRadius: 24,
//               padding: 20,
//               width: "92%",
//               maxWidth: 420,
//               boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
//             }}
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//                 marginBottom: 14,
//               }}
//             >
//               <div style={{ fontSize: 16, fontWeight: 700 }}>
//                 Amount Graphics
//               </div>
//               <button
//                 onClick={() => setIsAmountModalOpen(false)}
//                 style={{
//                   border: "none",
//                   background: "transparent",
//                   fontSize: 22,
//                   cursor: "pointer",
//                   color: "#334155",
//                 }}
//               >
//                 ×
//               </button>
//             </div>
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
//                 gap: 12,
//               }}
//             >
//               {AMOUNT_GRADIENT_OPTIONS.map((option) => (
//                 <button
//                   key={option.id}
//                   type="button"
//                   onClick={() => {
//                     setAmountPatternId(option.id);
//                     setIsAmountModalOpen(false);
//                   }}
//                   style={{
//                     cursor: "pointer",
//                     border:
//                       option.id === amountPatternId
//                         ? "2px solid #2563eb"
//                         : "1px solid #d1d5db",
//                     borderRadius: 16,
//                     padding: 10,
//                     background: "white",
//                     textAlign: "left",
//                   }}
//                 >
//                   <div
//                     style={{
//                       width: "100%",
//                       height: 70,
//                       borderRadius: 14,
//                       background: option.preview,
//                       overflow: "hidden",
//                       boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.16)",
//                     }}
//                   />
//                   <div
//                     style={{
//                       marginTop: 10,
//                       fontSize: 13,
//                       fontWeight: 600,
//                       color: "#111827",
//                     }}
//                   >
//                     {option.name}
//                   </div>
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="flex lg:w-1/3 w-full flex-row gap-2 justify-between items-center mt-2 flex-shrink-0 px-1">
//         <div
//           className="flex flex-row justify-start items-center flex-1 min-w-0 h-[40px] ml-3 overflow-x-auto hide-scrollbar"
//           data-guide="editor-photos"
//         >
//           {mlmProfile?.profileImageURLs?.map((img, index) => (
//             <img
//               key={index}
//               src={img}
//               onClick={() => setmiddaleImage(img)}
//               className={`w-[35px] h-[35px] object-contain cursor-pointer transition-all flex-shrink-0 ${middaleImage === img ? "border-2 border-accent rounded" : ""}`}
//             />
//           ))}
//         </div>

//         <div className="flex flex-row items-center gap-2 mr-3 flex-shrink-0">
//           <button
//             data-guide="editor-music"
//             title={
//               selectedMusic
//                 ? `Music: ${selectedMusic.name}`
//                 : "Add background music"
//             }
//             onClick={() => setMusicModalOpen(true)}
//             className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all flex-shrink-0 ${selectedMusic ? "bg-green-500 text-white shadow-md" : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"}`}
//           >
//             <svg
//               width="15"
//               height="15"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2.4"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//             >
//               <path d="M9 18V5l12-2v13" />
//               <circle cx="6" cy="18" r="3" />
//               <circle cx="18" cy="16" r="3" />
//             </svg>
//             {selectedMusic && (
//               <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
//                 <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
//                   <polyline
//                     points="1.5,5 4,7.5 8.5,2.5"
//                     stroke="#16a34a"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                   />
//                 </svg>
//               </span>
//             )}
//           </button>
//           <Button
//             data-guide="editor-download"
//             size="sm"
//             onClick={() => setCaptionModalOpen(true)}
//             disabled={!canExport || musicExporting}
//             style={{
//               opacity: canExport ? 1 : 0.5,
//               minWidth: 110,
//               position: "relative",
//             }}
//           >
//             {exportLoading ? (
//               <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
//                 <svg
//                   style={{ animation: "spin 1s linear infinite" }}
//                   width="14"
//                   height="14"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                 >
//                   <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
//                 </svg>
//                 Exporting...
//               </span>
//             ) : subLoading ? (
//               "Loading..."
//             ) : (
//               downloadBtnLabel()
//             )}
//           </Button>
//         </div>
//       </div>

//       <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

//       {/* ── Music selection modal ──────────────────────────────────────────── */}
//       {musicModalOpen && (
//         <div
//           className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm"
//           onClick={() => setMusicModalOpen(false)}
//         >
//           <div
//             className="bg-background dark:bg-[#141824] w-full sm:w-[92vw] sm:max-w-[440px] rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl flex flex-col"
//             style={{ maxHeight: "88vh" }}
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* Hidden audio player */}
//             <audio
//               ref={audioPlayerRef}
//               onEnded={() => setPlayingAudioId(null)}
//             />

//             {/* Header */}
//             <div className="flex items-center justify-between px-5 pt-5 pb-2 flex-shrink-0">
//               <div>
//                 <h3 className="text-base font-bold text-foreground">
//                   Add Music
//                 </h3>
//                 <p className="text-xs text-muted-foreground mt-0.5">
//                   Tracks trimmed to 20s for lightweight video
//                 </p>
//               </div>
//               <button
//                 onClick={() => setMusicModalOpen(false)}
//                 className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
//                 aria-label="Close"
//               >
//                 <svg
//                   width="18"
//                   height="18"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="2.2"
//                   strokeLinecap="round"
//                 >
//                   <path d="M18 6L6 18M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>

//             {/* Currently selected banner */}
//             {selectedMusic && (
//               <div className="mx-5 mb-2 flex items-center justify-between gap-3 p-3 rounded-2xl bg-green-500/10 border border-green-500/30 flex-shrink-0">
//                 <div className="flex items-center gap-2 min-w-0">
//                   <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500 text-white flex-shrink-0">
//                     <svg
//                       width="14"
//                       height="14"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2.4"
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                     >
//                       <path d="M9 18V5l12-2v13" />
//                       <circle cx="6" cy="18" r="3" />
//                       <circle cx="18" cy="16" r="3" />
//                     </svg>
//                   </span>
//                   <span className="text-sm font-medium text-foreground truncate">
//                     {selectedMusic.name}
//                   </span>
//                 </div>
//                 <button
//                   onClick={handleRemoveMusic}
//                   className="text-xs font-semibold text-danger hover:underline flex-shrink-0"
//                 >
//                   Remove
//                 </button>
//               </div>
//             )}

//             {/* Upload from device */}
//             <div className="px-5 pb-2 flex-shrink-0">
//               <button
//                 onClick={() => musicInputRef.current?.click()}
//                 disabled={deviceLoading}
//                 className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
//                   deviceLoading
//                     ? "border-accent bg-accent/5 opacity-80 cursor-wait"
//                     : "border-border hover:border-accent hover:bg-accent/5"
//                 }`}
//               >
//                 <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent flex-shrink-0">
//                   {deviceLoading ? (
//                     <svg
//                       className="animate-spin"
//                       width="18"
//                       height="18"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                     >
//                       <circle
//                         className="opacity-25"
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="currentColor"
//                         strokeWidth="3"
//                       />
//                       <path
//                         className="opacity-75"
//                         fill="currentColor"
//                         d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
//                       />
//                     </svg>
//                   ) : (
//                     <svg
//                       width="18"
//                       height="18"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                     >
//                       <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
//                     </svg>
//                   )}
//                 </span>
//                 <span className="text-left flex-1 min-w-0">
//                   <span className="block text-sm font-semibold text-foreground">
//                     {deviceLoading
//                       ? "Uploading audio..."
//                       : "Upload from device"}
//                   </span>
//                   <span className="block text-xs text-muted-foreground">
//                     {deviceLoading
//                       ? "Reading your track, please wait"
//                       : "Pick an audio file from your phone"}
//                   </span>
//                   {deviceLoading && (
//                     <span className="block mt-1.5">
//                       <span className="relative block w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
//                         <span
//                           className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
//                           style={{
//                             width: `${audioUploadProgress}%`,
//                             background:
//                               "linear-gradient(90deg,#0088DA,#0088DA)",
//                           }}
//                         />
//                       </span>
//                       <span className="text-[10px] text-accent font-bold mt-0.5 block tabular-nums">
//                         {audioUploadProgress}%
//                       </span>
//                     </span>
//                   )}
//                 </span>
//               </button>
//             </div>

//             {/* Search bar */}
//             <div className="px-5 pb-2 flex-shrink-0">
//               <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-muted/30 border border-border">
//                 <svg
//                   width="14"
//                   height="14"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   className="text-muted-foreground flex-shrink-0"
//                 >
//                   <circle cx="11" cy="11" r="8" />
//                   <path d="m21 21-4.35-4.35" />
//                 </svg>
//                 <input
//                   type="text"
//                   value={audioSearch}
//                   onChange={(e) => handleAudioSearchChange(e.target.value)}
//                   placeholder="Search tracks..."
//                   maxLength={30}
//                   className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
//                 />
//                 {audioSearch && (
//                   <button
//                     onClick={() => handleAudioSearchChange("")}
//                     className="text-muted-foreground hover:text-foreground transition-colors"
//                   >
//                     <svg
//                       width="12"
//                       height="12"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2.5"
//                       strokeLinecap="round"
//                     >
//                       <path d="M18 6L6 18M6 6l12 12" />
//                     </svg>
//                   </button>
//                 )}
//               </div>
//             </div>

//             {/* Track list header */}
//             <div className="px-5 pb-1 flex-shrink-0">
//               <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
//                 Choose a track
//               </p>
//             </div>

//             {/* Scrollable track list */}
//             <div
//               ref={audioListRef}
//               onScroll={handleAudioListScroll}
//               className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-1.5"
//               style={{ minHeight: 0 }}
//             >
//               {audioLoading && firestoreAudios.length === 0 && (
//                 <div className="flex items-center justify-center py-10 gap-3">
//                   <div className="w-6 h-6 border-2 border-muted border-t-accent rounded-full animate-spin" />
//                   <span className="text-sm text-muted-foreground">
//                     Loading tracks...
//                   </span>
//                 </div>
//               )}

//               {!audioLoading && firestoreAudios.length === 0 && (
//                 <div className="text-sm text-muted-foreground text-center py-10 rounded-2xl border border-dashed border-border">
//                   {audioSearch
//                     ? "No tracks found for your search."
//                     : "No tracks available yet."}
//                 </div>
//               )}

//               {firestoreAudios.map((track) => {
//                 const isActive = selectedMusic?.name === track.Name_Music;
//                 const isLoadingT = presetLoadingUrl === track.id;
//                 const isPlaying =
//                   playingAudioId === track.id &&
//                   audioPlayerRef.current &&
//                   !audioPlayerRef.current.paused;
//                 const trackName = track.Name_Music || "Unknown Track";

//                 return (
//                   <div
//                     key={track.id}
//                     className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer group ${
//                       isActive
//                         ? "border-accent bg-accent/10"
//                         : "border-border hover:border-accent/50 hover:bg-muted/30"
//                     }`}
//                   >
//                     {/* Play/Pause button */}
//                     <button
//                       onClick={() => handlePlayAudio(track)}
//                       className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
//                         isPlaying
//                           ? "bg-accent text-white shadow-md"
//                           : "bg-muted/50 text-foreground hover:bg-accent/20 hover:text-accent"
//                       }`}
//                     >
//                       {isPlaying ? (
//                         <svg
//                           width="14"
//                           height="14"
//                           viewBox="0 0 24 24"
//                           fill="currentColor"
//                         >
//                           <rect x="6" y="4" width="4" height="16" rx="1" />
//                           <rect x="14" y="4" width="4" height="16" rx="1" />
//                         </svg>
//                       ) : (
//                         <svg
//                           width="14"
//                           height="14"
//                           viewBox="0 0 24 24"
//                           fill="currentColor"
//                         >
//                           <polygon points="5 3 19 12 5 21 5 3" />
//                         </svg>
//                       )}
//                     </button>

//                     {/* Track info */}
//                     <div
//                       className="flex-1 min-w-0"
//                       onClick={() => handleSelectFirestoreTrack(track)}
//                     >
//                       <p
//                         className={`text-sm font-semibold truncate ${isActive ? "text-accent" : "text-foreground"}`}
//                       >
//                         {trackName}
//                       </p>
//                       {track.duration && (
//                         <p className="text-[10px] text-muted-foreground">
//                           {track.duration}
//                         </p>
//                       )}
//                     </div>

//                     {/* Select button */}
//                     <button
//                       onClick={() => handleSelectFirestoreTrack(track)}
//                       disabled={isLoadingT}
//                       className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
//                         isActive
//                           ? "bg-accent text-white"
//                           : "bg-muted/40 text-muted-foreground hover:bg-accent hover:text-white"
//                       } ${isLoadingT ? "opacity-50" : ""}`}
//                     >
//                       {isLoadingT ? (
//                         <svg
//                           className="animate-spin"
//                           width="12"
//                           height="12"
//                           viewBox="0 0 24 24"
//                           fill="none"
//                         >
//                           <circle
//                             className="opacity-25"
//                             cx="12"
//                             cy="12"
//                             r="10"
//                             stroke="currentColor"
//                             strokeWidth="3"
//                           />
//                           <path
//                             className="opacity-75"
//                             fill="currentColor"
//                             d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
//                           />
//                         </svg>
//                       ) : isActive ? (
//                         <svg
//                           width="12"
//                           height="12"
//                           viewBox="0 0 24 24"
//                           fill="none"
//                           stroke="currentColor"
//                           strokeWidth="2.5"
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                         >
//                           <polyline points="20 6 9 17 4 12" />
//                         </svg>
//                       ) : (
//                         <svg
//                           width="12"
//                           height="12"
//                           viewBox="0 0 24 24"
//                           fill="none"
//                           stroke="currentColor"
//                           strokeWidth="2.5"
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                         >
//                           <path d="M12 5v14M5 12h14" />
//                         </svg>
//                       )}
//                     </button>
//                   </div>
//                 );
//               })}

//               {/* Load more spinner */}
//               {audioLoading && firestoreAudios.length > 0 && (
//                 <div className="flex justify-center py-3">
//                   <div className="w-5 h-5 border-2 border-muted border-t-accent rounded-full animate-spin" />
//                 </div>
//               )}

//               {!audioLoading && !audioHasMore && firestoreAudios.length > 0 && (
//                 <p className="text-center text-[11px] text-muted-foreground py-2">
//                   All tracks loaded
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Hidden music file input — triggered by the compact music toggle near the download button */}
//       <input
//         ref={musicInputRef}
//         type="file"
//         accept="audio/*"
//         style={{ display: "none" }}
//         onChange={(e) => {
//           const file = e.target.files?.[0];
//           if (file) {
//             const result = validateUploadFile(file, "audio");
//             if (!result.valid) {
//               showToast(result.error || "Invalid audio file.", "error");
//             } else {
//               handleDeviceMusic(file);
//             }
//           }
//           e.target.value = "";
//         }}
//       />

//       {/* ── Video recording progress overlay ─────────────────────────────── */}
//       {videoExporting && (
//         <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/75 backdrop-blur-sm">
//           <div className="relative bg-background dark:bg-[#141824] rounded-3xl p-7 w-[88vw] max-w-[380px] shadow-2xl border border-border">
//             <div className="flex items-center justify-center mb-5">
//               <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
//                 {/* Video camera icon */}
//                 <svg
//                   className="w-7 h-7 text-accent"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                   strokeWidth="1.8"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 8h9a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"
//                   />
//                 </svg>
//               </div>
//             </div>
//             <h3 className="text-[16px] font-bold text-foreground text-center mb-1">
//               Recording Video
//             </h3>
//             <p className="text-[12px] text-muted-foreground text-center mb-5">
//               {progressLabel || "Preparing..."}
//             </p>
//             <div className="space-y-2 mb-4">
//               <div className="flex justify-between items-center">
//                 <span className="text-[11px] text-muted-foreground">
//                   Progress
//                 </span>
//                 <span className="text-[13px] font-bold text-accent tabular-nums">
//                   {displayProgress}%
//                 </span>
//               </div>
//               <div className="w-full h-3 bg-muted/40 rounded-full overflow-hidden">
//                 <div
//                   className="h-full rounded-full transition-all duration-300"
//                   style={{
//                     width: `${displayProgress}%`,
//                     background:
//                       "linear-gradient(90deg, #0088DA, #0088DA, #0088DA)",
//                   }}
//                 />
//               </div>
//               {/* Segment markers for each second */}
//               <div className="flex justify-between px-0.5">
//                 {[0, 25, 50, 75, 100].map((m) => (
//                   <span
//                     key={m}
//                     className="text-[9px] text-muted-foreground/50 tabular-nums"
//                   >
//                     {m}%
//                   </span>
//                 ))}
//               </div>
//             </div>
//             <div className="flex items-center gap-2 bg-accent/5 border border-accent/15 rounded-2xl px-4 py-2.5 mb-1">
//               <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
//               <span className="text-[11px] text-foreground/80 font-medium">
//                 Recording canvas with animations
//               </span>
//             </div>
//             <p className="text-[10px] text-muted-foreground/50 text-center mt-3">
//               Do not close this screen
//             </p>
//           </div>
//         </div>
//       )}

//       {/* ── Music + photo export progress overlay ────────────────────────── */}
//       {musicExporting && (
//         <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/75 backdrop-blur-sm">
//           <div className="relative bg-background dark:bg-[#141824] rounded-3xl p-7 w-[88vw] max-w-[380px] shadow-2xl border border-border">
//             <div className="flex items-center justify-center mb-5">
//               <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
//                 <svg
//                   className="w-7 h-7 text-accent animate-spin"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                 >
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="3"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
//                   />
//                 </svg>
//               </div>
//             </div>
//             <h3 className="text-[16px] font-bold text-foreground text-center mb-1">
//               Creating Video
//             </h3>
//             <p className="text-[12px] text-muted-foreground text-center mb-5">
//               {progressLabel || "Processing..."}
//             </p>
//             <div className="space-y-2 mb-4">
//               <div className="flex justify-between items-center">
//                 <span className="text-[11px] text-muted-foreground">
//                   Progress
//                 </span>
//                 <span className="text-[12px] font-bold text-accent tabular-nums">
//                   {displayProgress}%
//                 </span>
//               </div>
//               <div className="w-full h-2.5 bg-muted/40 rounded-full overflow-hidden">
//                 <div
//                   className="h-full rounded-full transition-all duration-500"
//                   style={{
//                     width: `${displayProgress}%`,
//                     background: "linear-gradient(90deg, #0088DA, #4f6fd0)",
//                   }}
//                 />
//               </div>
//             </div>
//             {progressLogs?.length > 0 && (
//               <div className="bg-black/20 dark:bg-black/40 rounded-xl p-3 space-y-0.5 max-h-[60px] overflow-hidden">
//                 {progressLogs?.slice(-3).map((l, i) => (
//                   <p
//                     key={i}
//                     className="text-[10px] text-muted-foreground/60 font-mono truncate"
//                   >
//                     {l}
//                   </p>
//                 ))}
//               </div>
//             )}
//             <p className="text-[10px] text-muted-foreground/50 text-center mt-3">
//               Do not close this screen
//             </p>
//           </div>
//         </div>
//       )}

//       <div className="w-full lg:w-1/3 flex-1 min-h-0 flex flex-col overflow-hidden">
//         <ListOfTemplates
//           selected={selected}
//           setSelected={setSelected}
//           onTabChange={setActiveTabFromList}
//         />
//       </div>

//       {/* ── Caption modal ───────────────────────────────────────────── */}
//       <CaptionModal
//         isOpen={captionModalOpen}
//         onClose={() => setCaptionModalOpen(false)}
//         onDownload={activeExportFn}
//         achieverInfo={
//           isRank || isBonanza
//             ? {
//                 name: formname,
//                 city: formcity,
//                 amount: amountText,
//                 rankname: selll?.Subtype,
//                 selectType: selll?.type,
//                 fromwish: ActualProfilename,
//                 formdesignation: ActualDesignation,
//                 formmobile: mlmProfile?.mobile,
//               }
//             : null
//         }
//         companyName={mlmProfile?.companyName || ""}
//       />
//     </div>
//   );
// }

// export default GeneralEditPage;

import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { getUser } from "../../utils/authStorage";
import { Stage, Layer, Text, Image, Transformer, Group } from "react-konva";
import Konva from "konva";
Konva.hitOnDragEnabled = true;
import useImage from "use-image";
import ListOfTemplates from "./components/ListOfTemplates";
import AiRetouchModal from "./AiRetouchModal";
import CaptionModal from "../../components/CaptionModal";
import {
  isRankPromotionType,
  RANK_PROMOTION_TYPES,
} from "../../utils/templateTypeConfig";
import facebook from "./sociallogo/facebook.png";
import featurec from "./sociallogo/featurecoming.webp";
import instagram from "./sociallogo/insta.png";
import youtube from "./sociallogo/youtube.png";
import x from "./sociallogo/x.png";
import Loc from "./sociallogo/loc.png";
import zoom from "./sociallogo/zoom.png";
import meet from "./sociallogo/meet.png";
import twodn from "./sociallogo/2d1n.webp";
import threedn from "./sociallogo/3d2n.webp";
import fourdn from "./sociallogo/4d3n.webp";
import familly from "./sociallogo/family.webp";
import { Button, isRTL, Spinner } from "@heroui/react";
import ffmpegCoreURL from "@ffmpeg/core?url";
import ffmpegWasmURL from "@ffmpeg/core/wasm?url";
import { getLocalLogo } from "@/utils/getCompanyLogo";
import spdoneimg from "./closinglogo/Sp.webp";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { db } from "@firebase-config";
import { validateUploadFile } from "../../lib/fileValidation";
import num0 from "./amount_numberImage/number_0.webp";
import num1 from "./amount_numberImage/number_1.webp";
import num2 from "./amount_numberImage/number_2.webp";
import num3 from "./amount_numberImage/number_3.webp";
import num4 from "./amount_numberImage/number_4.webp";
import num5 from "./amount_numberImage/number_5.webp";
import num6 from "./amount_numberImage/number_6.webp";
import num7 from "./amount_numberImage/number_7.webp";
import num8 from "./amount_numberImage/number_8.webp";
import num9 from "./amount_numberImage/number_9.webp";
import numComma from "./amount_numberImage/comma.webp";
import numRupee from "./amount_numberImage/rupee.webp";
import { COLLECTIONS } from "../../collections";
import { celebrateDownload } from "../../utils/downloadCelebration";
import { getAchieverDisplayName } from "./utils/canvasDataUtils";

const fs = (n) => n;

const STAGE_WIDTH = 320;
const STAGE_HEIGHT = 320;

const getPortraitFriendlySquareCrop = (image) => {
  if (!image) return undefined;

  const sourceWidth =
    image.naturalWidth || image.videoWidth || image.width || 1;
  const sourceHeight =
    image.naturalHeight || image.videoHeight || image.height || 1;
  const cropSize = Math.min(sourceWidth, sourceHeight);

  return {
    x: Math.max(0, (sourceWidth - cropSize) / 2),
    // Keep portrait faces slightly above centre instead of cutting the head.
    y: Math.max(0, (sourceHeight - cropSize) * 0.22),
    width: cropSize,
    height: cropSize,
  };
};

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const EXPORT_PIXEL_RATIO = isIOS() ? 3 : 8;
const VIDEO_PIXEL_RATIO = isIOS() ? 2 : 4;
const MAX_MUSIC_SECONDS = 20;

const IMAGE_CREDIT_COST = 1;
const VIDEO_CREDIT_COST = 2;

const MUSIC_PAGE_SIZE = 15;

const sortMusicTracks = (tracks) =>
  [...tracks].sort((a, b) =>
    String(a.Name_Music || "").localeCompare(
      String(b.Name_Music || ""),
      undefined,
      {
        sensitivity: "base",
      },
    ),
  );

const VideoCanvas = React.memo(function VideoCanvas({
  src,
  playing,
  width,
  height,
  onError,
  videoElRef,
}) {
  const imageRef = useRef(null);

  const videoEl = useMemo(() => {
    if (typeof document === "undefined") return null;
    const el = document.createElement("video");
    el.crossOrigin = "anonymous";
    el.loop = true;
    el.muted = true;
    el.playsInline = true;
    el.preload = "auto";
    el.src = src;
    return el;
  }, [src]);

  useEffect(() => {
    if (videoElRef) videoElRef.current = videoEl || null;
    return () => {
      if (videoElRef) videoElRef.current = null;
    };
  }, [videoEl, videoElRef]);

  useEffect(() => {
    if (!videoEl) return;
    const handleError = () => onError && onError();
    videoEl.addEventListener("error", handleError);
    return () => videoEl.removeEventListener("error", handleError);
  }, [videoEl, onError]);

  useEffect(() => {
    if (!videoEl) return;
    let rafId = null;
    let cancelled = false;

    // Use rAF loop so we always get the live layer reference each frame,
    // avoiding the null-layer bug from capturing it at effect start.
    let lastDraw = 0;
    const tick = (time) => {
      if (cancelled) return;
      if (time - lastDraw >= 33) {
        lastDraw = time;
        const lyr = imageRef.current?.getLayer?.();
        if (lyr) lyr.batchDraw();
      }
      rafId = requestAnimationFrame(tick);
    };

    if (playing) {
      const tryPlay = () => {
        const p = videoEl.play();
        if (p && typeof p.catch === "function") {
          p.catch(() => {
            videoEl.muted = true;
            videoEl.play().catch(() => {});
          });
        }
        rafId = requestAnimationFrame(tick);
      };
      if (videoEl.readyState >= 2) {
        tryPlay();
      } else {
        videoEl.addEventListener("canplay", tryPlay, { once: true });
      }
      return () => {
        cancelled = true;
        videoEl.removeEventListener("canplay", tryPlay);
        if (rafId) cancelAnimationFrame(rafId);
      };
    }

    // paused state — stop video and do one final draw
    videoEl.pause();
    const lyr = imageRef.current?.getLayer?.();
    if (lyr) lyr.batchDraw();
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [playing, videoEl]);

  useEffect(() => {
    return () => {
      if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute("src");
        videoEl.load();
      }
    };
  }, [videoEl]);

  if (!videoEl) return null;
  return (
    <Image
      ref={imageRef}
      image={videoEl}
      x={0}
      y={0}
      width={width}
      height={height}
      listening={false}
    />
  );
});

export const GENERAL_SELECT_TYPES = [
  { name: "Motivational", value: "Motivational" },
  { name: "Thank You Rank", value: "ThankYou_Banner_B" },
  {
    name: "Thank You (Birthday & Anniversary)",
    value: "ThankYou_Birthday_Anniversary",
  },
];
export const GENERAL_SELECT_TYPES2 = [
  { name: "Good_Morning", value: "Good_Morning" },
  { name: "Sport", value: "Sport" },
  { name: "Daily_Life", value: "Daily_Life" },
  { name: "Health_Tips", value: "Health_Tips" },
  { name: "Greeting & Wishes", value: "Greeting_Wishes" },
  { name: "Devotional_Spiritual", value: "Devotional_Spiritual" },
  { name: "Leader_Quotes", value: "Leader_Quotes" },
  { name: "Festival", value: "Festival" },
  { name: "Trending", value: "Trending" },
];

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const FadeBottomFilter = (imageData) => {
  const { data, width, height } = imageData;

  const borderSize = 30;

  for (let y = 0; y < height; y++) {
    let alpha = 2;

    if (y >= height - borderSize) {
      const t = (y - (height - borderSize)) / borderSize;
      alpha = 1 - t;
    }

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      data[idx + 3] = Math.min(data[idx + 3], Math.round(255 * alpha));
    }
  }
};
// const FadeEdgesFilter = (imageData) => {
//   const { data, width, height } = imageData;
//   if (width <= 1 || height <= 1) return; // guard against degenerate sizes

//   const bottomBorder = 30; // last 50 px fade at bottom (same as FadeBottomFilter)
//   const sideFade = 0.1; // 18 % from each side (left & right)

//   const wMax = width - 1;

//   for (let y = 0; y < height; y++) {
//     let bottomAlpha = 1;
//     if (y >= height - bottomBorder) {
//       const t = (y - (height - bottomBorder)) / bottomBorder;
//       bottomAlpha = Math.max(0, 1 - t);
//     }

//     for (let x = 0; x < width; x++) {
//       const px = x / wMax;

//       const leftAlpha = px < sideFade ? px / sideFade : 1;
//       const rightAlpha = px > 1 - sideFade ? (1 - px) / sideFade : 1;

//       const alpha = bottomAlpha * leftAlpha * rightAlpha;
//       const idx = (y * width + x) * 4;
//       data[idx + 3] = Math.round(
//         data[idx + 3] * Math.max(0, Math.min(1, alpha)),
//       );
//     }
//   }
// };

const FadeEdgesFilter = (imageData) => {
  const { data, width, height } = imageData;
  if (width <= 1 || height <= 1) return;

  const bottomBorder = 0;
  const sideFade = 0.07; // केवल 7% side area में fade
  const minSideAlpha = 0.4; // sides पर minimum 40% opacity

  const wMax = width - 1;

  const clamp01 = (value) => Math.max(0, Math.min(1, value));

  // Smooth transition instead of hard linear fade
  const smoothstep = (value) => {
    const t = clamp01(value);
    return t * t * (3 - 2 * t);
  };

  for (let y = 0; y < height; y++) {
    let bottomAlpha = 1;

    if (y >= height - bottomBorder) {
      const t = clamp01(
        (y - (height - bottomBorder)) / Math.max(1, bottomBorder - 1),
      );

      bottomAlpha = 1 - smoothstep(t);
    }

    for (let x = 0; x < width; x++) {
      const px = x / wMax;

      const leftProgress = smoothstep(px / sideFade);
      const rightProgress = smoothstep((1 - px) / sideFade);

      const leftAlpha = minSideAlpha + (1 - minSideAlpha) * leftProgress;

      const rightAlpha = minSideAlpha + (1 - minSideAlpha) * rightProgress;

      const alpha = clamp01(bottomAlpha * Math.min(leftAlpha, rightAlpha));

      const idx = (y * width + x) * 4;
      data[idx + 3] = Math.round(data[idx + 3] * alpha);
    }
  }
};

const FadeRightFilter = (imageData) => {
  const { data, width, height } = imageData;
  const fadeStart = 0.9; // fade begins at 50% from left ← adjust this
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const progress = x / width;
      const alpha =
        progress <= fadeStart
          ? 1
          : 1 - (progress - fadeStart) / (1 - fadeStart); // right fades out
      const idx = (y * width + x) * 4;
      data[idx + 3] = Math.round(
        data[idx + 3] * Math.max(0, Math.min(1, alpha)),
      );
    }
  }
};

const FadeLeftFilter = (imageData) => {
  const { data, width, height } = imageData;
  const fadeStart = 0.9;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const progress = x / width;
      const alpha = progress >= fadeStart ? 1 : progress / fadeStart;
      const idx = (y * width + x) * 4;
      data[idx + 3] = Math.round(
        data[idx + 3] * Math.max(0, Math.min(1, alpha)),
      );
    }
  }
};

const NO_FOOTER_TYPES = new Set([
  ...RANK_PROMOTION_TYPES,
  "Bonanza",
  "Welcome_Closing",
  "Achievements",
  "Anniversary_Birthday",
  "Income",
  "Meeting",
  "General_Meeting",
  "ThankYou_Birthday_Anniversary",
  "Capping",
  "Training",
]);

const parseExpiryDate = (dateStr) => {
  if (!dateStr) return null;
  const months = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };
  const [day, mon, year] = dateStr.split(" ");
  const month = months[mon];
  if (month === undefined) return null;
  return new Date(Number(year), month, Number(day), 23, 59, 59);
};

const AMOUNT_GRADIENT_OPTIONS = [
  {
    id: "gold1",
    name: "Gold Classic",
    stops: [
      0,
      "#ffd700",
      0.3,
      "#ffed4e",
      0.6,
      "#d4af37",
      0.9,
      "#b8860b",
      1,
      "#daa520",
    ],
    preview:
      "linear-gradient(135deg, #ffd700 0%, #ffed4e 30%, #d4af37 60%, #b8860b 90%, #daa520 100%)",
  },
  {
    id: "gold2",
    name: "Gold Luxe",
    stops: [
      0,
      "#ffed4e",
      0.25,
      "#ffd700",
      0.5,
      "#ffb347",
      0.75,
      "#ff8c00",
      1,
      "#daa520",
    ],
    preview:
      "linear-gradient(135deg, #ffed4e 0%, #ffd700 25%, #ffb347 50%, #ff8c00 75%, #daa520 100%)",
  },
  {
    id: "silver1",
    name: "Silver Frost",
    stops: [
      0,
      "#f8f8ff",
      0.3,
      "#c0c0c0",
      0.6,
      "#a8a8a8",
      0.9,
      "#808080",
      1,
      "#696969",
    ],
    preview:
      "linear-gradient(135deg, #f8f8ff 0%, #c0c0c0 30%, #a8a8a8 60%, #808080 90%, #696969 100%)",
  },
  {
    id: "silver2",
    name: "Silver Shine",
    stops: [
      0,
      "#e6e6fa",
      0.25,
      "#d3d3d3",
      0.5,
      "#b0b0b0",
      0.75,
      "#909090",
      1,
      "#778899",
    ],
    preview:
      "linear-gradient(135deg, #e6e6fa 0%, #d3d3d3 25%, #b0b0b0 50%, #909090 75%, #778899 100%)",
  },
  {
    id: "diamond1",
    name: "Red Diamond",
    stops: [
      0,
      "#ffcccc",
      0.3,
      "#ff6666",
      0.6,
      "#cc3333",
      0.9,
      "#990000",
      1,
      "#660000",
    ],
    preview:
      "linear-gradient(135deg, #ffcccc 0%, #ff6666 30%, #cc3333 60%, #990000 90%, #660000 100%)",
  },
  {
    id: "diamond2",
    name: "Ruby Diamond",
    stops: [
      0,
      "#ffe6e6",
      0.25,
      "#ff9999",
      0.5,
      "#ff4d4d",
      0.75,
      "#cc0000",
      1,
      "#990033",
    ],
    preview:
      "linear-gradient(135deg, #ffe6e6 0%, #ff9999 25%, #ff4d4d 50%, #cc0000 75%, #990033 100%)",
  },
];

const btnStyle = (bg) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "14px 8px",
  borderRadius: 14,
  border: "none",
  background: bg,
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: `0 4px 12px ${bg}55`,
});

function SlowLoadingHint({ delay = 3500, message }) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    setShow(false);
    const id = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(id);
  }, [delay]);
  if (!show) return null;
  return (
    <p
      style={{
        color: "rgba(255,255,255,0.85)",
        fontSize: 11,
        fontWeight: 500,
        textAlign: "center",
        maxWidth: 220,
        lineHeight: 1.4,
        marginTop: 2,
      }}
    >
      {message}
    </p>
  );
}

function LoadingDots() {
  const [dots, setDots] = React.useState("");
  React.useEffect(() => {
    const id = setInterval(
      () => setDots((d) => (d.length >= 3 ? "" : d + ".")),
      450,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ display: "inline-block", width: 18, textAlign: "left" }}>
      {dots}
    </span>
  );
}

function Toast({ message, type }) {
  const colors = { error: "#ef4444", success: "#22c55e", info: "#6366f1" };
  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        background: colors[type] || colors.info,
        color: "#fff",
        padding: "10px 20px",
        borderRadius: 30,
        fontWeight: 600,
        fontSize: 13,
        zIndex: 2000,
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  );
}

const getAudioDuration = (fileOrUrl) =>
  new Promise((resolve, reject) => {
    const isUrl = typeof fileOrUrl === "string";
    const url = isUrl ? fileOrUrl : URL.createObjectURL(fileOrUrl);
    const cleanup = () => {
      if (!isUrl) URL.revokeObjectURL(url);
    };
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      cleanup();
      resolve(isFinite(audio.duration) ? audio.duration : null);
    };
    audio.onerror = () => {
      cleanup();
      reject(new Error("Could not read audio metadata."));
    };
    audio.src = url;
  });

function useAnimatedProgress(target) {
  const [displayed, setDisplayed] = React.useState(0);
  React.useEffect(() => {
    let raf;
    const step = () => {
      setDisplayed((prev) => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.5) return target;
        raf = requestAnimationFrame(step);
        return prev + diff * 0.12;
      });
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return Math.round(displayed);
}

function GeneralEditPage({
  selectedTopFrame,
  setIsOpenFtr,
  setIsOpen,
  selectedFooterFrame,
  middaleImage,
  setmiddaleImage,
}) {
  const stageRef = useRef(null);
  const videoElRef = useRef(null);
  const profileImageRef = useRef(null);
  const rankImageRef = useRef(null);
  const stickerImageRef = useRef(null);
  const transformerRef = useRef(null);
  const stageContainerRef = useRef(null);
  const bgFirstLoadDoneRef = useRef(false);
  const toastTimerRef = useRef(null);
  const [stageScale, setStageScale] = useState(1);

  useLayoutEffect(() => {
    const el = stageContainerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setStageScale(w / STAGE_WIDTH);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [mlmForm, setMlmForm] = useState(null);
  const [mlmProfile, setMlmProfile] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState(null);
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0, width: 0 });

  const [activeSub, setActiveSub] = useState(null);
  const [userData, setUserData] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [exportedUri, setExportedUri] = useState(null);
  const [achievementForm, setAchievementForm] = useState(null);
  const [incomeFormData, setIncomeFormData] = useState(null);
  const [meetingData, setMeetingData] = useState(null);
  const [showSocial, setShowSocial] = useState("no");
  const [footerImgFlip, setFooterImgFlip] = useState(false);
  const [showTopupline] = useState(
    () => localStorage.getItem("showTopuplineImages") ?? "yes",
  );
  const [showLogo] = useState(
    () => localStorage.getItem("showCompanyLogo") ?? "yes",
  );
  const [showMobile] = useState(
    () => localStorage.getItem("showMobileNumber") ?? "yes",
  );

  const [selectedMusic, setSelectedMusic] = useState(null);
  const [musicExporting, setMusicExporting] = useState(false);
  const [videoExporting, setVideoExporting] = useState(false);
  const [savedDesignation, setSavedDesignation] = useState(() => {
    try {
      const raw = localStorage.getItem("SelectedDesignation");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed &&
        (parsed.name ||
          parsed.profilename ||
          parsed.image ||
          parsed.profileimage)
        ? {
            name: parsed.name || parsed.profilename || "",
            image: parsed.image || parsed.profileimage || "",
            profilename: parsed.profilename || parsed.name || "",
            profileimage: parsed.profileimage || parsed.image || "",
          }
        : null;
    } catch {
      return null;
    }
  });
  const [musicModalOpen, setMusicModalOpen] = useState(false);
  const [captionModalOpen, setCaptionModalOpen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [presetLoadingUrl, setPresetLoadingUrl] = useState(null);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [firestoreAudios, setFirestoreAudios] = useState([]);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioHasMore, setAudioHasMore] = useState(true);
  const [audioLastDoc, setAudioLastDoc] = useState(null);
  const [audioSearch, setAudioSearch] = useState("");
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioPlayerRef = useRef(null);
  const audioListRef = useRef(null);
  const [activeTabFromList, setActiveTabFromList] = useState("image");
  const [progressTarget, setProgressTarget] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [progressLogs, setProgressLogs] = useState([]);
  const musicInputRef = useRef(null);
  const ffmpegRef = useRef(null);
  const exportInProgressRef = useRef(false);
  const displayProgress = useAnimatedProgress(progressTarget);

  const showToast = useCallback((message, type = "info", duration = 3000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  useEffect(() => {
    try {
      const savedAchieve = localStorage.getItem("achieve_form");
      setShowSocial("no");
      if (savedAchieve) setAchievementForm(JSON.parse(savedAchieve));
    } catch (err) {}

    try {
      const savedIncome = localStorage.getItem("income_form");
      if (savedIncome) setIncomeFormData(JSON.parse(savedIncome));
    } catch (err) {}

    try {
      const savedMeeting = localStorage.getItem("Meeting");
      if (savedMeeting) setMeetingData(JSON.parse(savedMeeting));
    } catch (err) {}

    try {
      const raw = localStorage.getItem("SelectedDesignation");
      if (!raw) {
        setSavedDesignation(null);
        return;
      }
      const parsed = JSON.parse(raw);
      setSavedDesignation(
        parsed &&
          (parsed.name ||
            parsed.profilename ||
            parsed.image ||
            parsed.profileimage)
          ? {
              name: parsed.name || parsed.profilename || "",
              image: parsed.image || parsed.profileimage || "",
              profilename: parsed.profilename || parsed.name || "",
              profileimage: parsed.profileimage || parsed.image || "",
            }
          : null,
      );
    } catch {
      setSavedDesignation(null);
    }
  }, []);

  const isRight = selected?.position === "right";
  const selll = getSelType();

  const [closeFilter, setCloseFilter] = useState(() => {
    try {
      return localStorage.getItem("close_filter") || "SP";
    } catch {
      return "SP";
    }
  });

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "close_filter") setCloseFilter(e.newValue || "SP");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const isSubGeneralType = GENERAL_SELECT_TYPES.some(
    (t) => t.value === selll?.type,
  );
  const isSubGeneralType2 = GENERAL_SELECT_TYPES2.some(
    (t) => t.value === selll?.type,
  );
  const Template_Type = selll?.type;

  const [profileAttrs, setProfileAttrs] = useState({
    x: isRight ? 145.5 : 0.5,
    y: 50,
    width: 155,
    height: 240,
    scaleX: isRight ? -1 : 1,
    offsetX: isRight ? 155 : 0,
    scaleY: 1,
    offsetY: 0,
  });

  const isBonanza = Template_Type === "Bonanza";
  const isThankyouRank = Template_Type === "ThankYou_Banner_B";
  const isTraining = Template_Type === "Training";
  const isWelcomeClosing = Template_Type === "Welcome_Closing";
  const isAchievement = Template_Type === "Achievements";
  const isWelcome = selll?.Subtype === "WELCOME";
  const isClosing = selll?.Subtype === "CLOSING";
  const isAnyversary = selll?.type === "Anniversary_Birthday";
  const isIncome = selll?.type === "Income";
  const isCapping = selll?.type === "Capping";

  const isGurupornima = selll?.Subtype === "GURU PORNIMA";

  const isMeeting =
    selll?.type === "Meeting" || selll?.type === "General_Meeting";
  const isRank_B = Template_Type === "Rank_Promotion_B";
  const isRank = isRankPromotionType(Template_Type) || isTraining;
  const isMlmToday = selll?.type === "Today_Trending";

  const showImageFooter = !NO_FOOTER_TYPES.has(Template_Type);

  const rankInitialAttrs = useMemo(() => {
    const w = isMeeting
      ? 170
      : isCapping
        ? 100
        : isIncome
          ? 105
          : isAnyversary
            ? 145
            : isBonanza
              ? 150
              : isWelcome
                ? 160
                : isClosing
                  ? 160
                  : isRank
                    ? 160
                    : 110;

    const h = isMeeting
      ? 220
      : isCapping
        ? 150
        : isIncome
          ? 195
          : isAnyversary
            ? 220
            : isClosing
              ? 230
              : isWelcome
                ? 205
                : isBonanza
                  ? 200
                  : isRank
                    ? 200
                    : 190;

    const x = isMeeting
      ? isRight
        ? 163.5
        : -16
      : isCapping
        ? isRight
          ? 210
          : 10
        : isIncome
          ? isRight
            ? 210
            : 15
          : isAnyversary
            ? isRight
              ? 180
              : -10
            : isClosing
              ? isRight
                ? 171
                : -10
              : isWelcome
                ? isRight
                  ? 171
                  : -10
                : isBonanza
                  ? isRight
                    ? 179
                    : -10
                  : isRank
                    ? isRight
                      ? 171
                      : -10
                    : isRight
                      ? 200
                      : 10;

    const y = isMeeting
      ? 66
      : isCapping
        ? 65
        : isIncome
          ? 60
          : isAnyversary
            ? 40
            : isClosing
              ? 30
              : isWelcome
                ? 30
                : isBonanza
                  ? 30
                  : isRank
                    ? 30
                    : 40;

    return {
      x,
      y,
      width: w,
      height: h,
      scaleX: isRight ? -1 : 1,
      offsetX: isRight ? w : 0,
      scaleY: 1,
      offsetY: 0,
    };
  }, [isRight, Template_Type]);

  const [rankAttrs, setRankAttrs] = useState(() => rankInitialAttrs);

  const stickerInitialAttrs = useMemo(
    () => ({
      x: isCapping
        ? isRight
          ? 190
          : 1
        : isAnyversary
          ? isRight
            ? 155
            : -5
          : isAchievement
            ? 1
            : isClosing
              ? isRight
                ? 171
                : 0
              : isWelcome
                ? isRight
                  ? 171
                  : 0
                : isBonanza
                  ? isRight
                    ? 180
                    : 0
                  : isRank_B
                    ? isRight
                      ? 100
                      : -34
                    : isRank
                      ? isRight
                        ? 171
                        : 0
                      : isRight
                        ? 190
                        : 2,
      y: isCapping
        ? 202
        : isIncome
          ? 235
          : isAnyversary
            ? 193
            : isAchievement
              ? 185
              : isClosing
                ? 243
                : isWelcome
                  ? 215
                  : isBonanza
                    ? 200
                    : isRank_B
                      ? 210
                      : isRank
                        ? 217
                        : 218,
      width: isIncome
        ? 140
        : isAnyversary
          ? 170
          : isAchievement
            ? 110
            : isWelcome
              ? 150
              : isClosing
                ? 150
                : isBonanza
                  ? 150
                  : isRank_B
                    ? 240
                    : isRank
                      ? 150
                      : 130,
      height: isIncome
        ? 40
        : isAnyversary
          ? 100
          : isAchievement
            ? 60
            : isClosing
              ? 32
              : isWelcome
                ? 32
                : isBonanza
                  ? 95
                  : isRank_B
                    ? 90
                    : isRank
                      ? 32
                      : 30,
      scaleX: 1,
      offsetX: 0,
      scaleY: 1,
      offsetY: 0,
    }),
    [isRight, Template_Type],
  );

  const [stickerAttrs, setStickerAttrs] = useState(() => stickerInitialAttrs);

  useEffect(() => {
    setProfileAttrs((prev) => ({
      ...prev,
      x: isRight ? 164.5 : 0.5,
      y: 80,
      width: 155,
      height: 210,
      scaleX: isRight ? -1 : 1,
      offsetX: isRight ? 155 : 0,
      scaleY: 1,
      offsetY: 0,
    }));
    setRankAttrs(rankInitialAttrs);
    setStickerAttrs(stickerInitialAttrs);
  }, [isRight, Template_Type, rankInitialAttrs, stickerInitialAttrs]);

  function getSelType() {
    try {
      return JSON.parse(localStorage.getItem("selType")) || {};
    } catch {
      return {};
    }
  }

  const justDraggedRef = useRef(false);
  const pinchRef = useRef({ dist: 0, active: false });

  const getAttrsByType = (type) =>
    type === "profile"
      ? profileAttrs
      : type === "rank"
        ? rankAttrs
        : stickerAttrs;

  const setAttrsByType = (type, updater) => {
    if (type === "profile") setProfileAttrs(updater);
    else if (type === "rank") setRankAttrs(updater);
    else if (type === "sticker") setStickerAttrs(updater);
  };

  const flipImageInPlace = (type) => {
    const prev = getAttrsByType(type);
    if (!prev) return;
    const W = prev.width;
    const left =
      prev.scaleX === -1 ? prev.x + prev.offsetX - W : prev.x - prev.offsetX;
    const newScaleX = prev.scaleX === -1 ? 1 : -1;
    const next = {
      ...prev,
      scaleX: newScaleX,
      offsetX: newScaleX === -1 ? W : 0,
      x: left,
    };
    setAttrsByType(type, next);
    const nodeMap = {
      profile: profileImageRef.current,
      rank: rankImageRef.current,
      sticker: stickerImageRef.current,
    };
    const node = nodeMap[type];
    if (node) {
      node.scaleX(next.scaleX);
      node.offsetX(next.offsetX);
      node.x(next.x);
      node.getLayer()?.batchDraw();
      transformerRef.current?.forceUpdate();
    }
  };

  const handleImageClick = (type) => (e) => {
    e.cancelBubble = true;
    setIsImageSelected(true);
    setSelectedImageType(type);
    if (justDraggedRef.current) return;
    flipImageInPlace(type);
  };

  const handleTransformEnd = (type) => (e) => {
    const node = e.target;
    const s = node.scaleX();
    const sy = node.scaleY();
    const ox = node.offsetX();
    const oy = node.offsetY();
    const w0 = node.width();
    const h0 = node.height();
    const px = node.x();
    const py = node.y();
    const newWidth = Math.max(10, w0 * Math.abs(s));
    const newHeight = Math.max(10, h0 * Math.abs(sy));
    const left = Math.min(px + s * (0 - ox), px + s * (w0 - ox));
    const top = Math.min(py + sy * (0 - oy), py + sy * (h0 - oy));
    const currentScaleX = s < 0 ? -1 : 1;
    const currentScaleY = sy < 0 ? -1 : 1;
    const newOffsetX = currentScaleX === -1 ? newWidth : 0;
    const newOffsetY = currentScaleY === -1 ? newHeight : 0;
    node.scaleX(currentScaleX);
    node.scaleY(currentScaleY);
    node.width(newWidth);
    node.height(newHeight);
    node.offsetX(newOffsetX);
    node.offsetY(newOffsetY);
    node.x(left);
    node.y(top);
    node.getLayer()?.batchDraw();
    transformerRef.current?.forceUpdate();
    const update = (prev) => ({
      ...prev,
      x: left,
      y: top,
      width: newWidth,
      height: newHeight,
      scaleX: currentScaleX,
      offsetX: newOffsetX,
      scaleY: currentScaleY,
      offsetY: newOffsetY,
    });
    if (type === "profile") setProfileAttrs(update);
    else if (type === "rank") setRankAttrs(update);
    else if (type === "sticker") setStickerAttrs(update);
  };

  const handleDragEnd = (type) => (e) => {
    const node = e.target;
    applyDragClamp(node, type);
    justDraggedRef.current = true;
    setTimeout(() => {
      justDraggedRef.current = false;
    }, 0);
    setIsImageSelected(true);
    setSelectedImageType(type);
    if (type === "profile")
      setProfileAttrs((prev) => ({ ...prev, x: node.x(), y: node.y() }));
    else if (type === "rank")
      setRankAttrs((prev) => ({ ...prev, x: node.x(), y: node.y() }));
    else if (type === "sticker")
      setStickerAttrs((prev) => ({ ...prev, x: node.x(), y: node.y() }));
  };

  const boundBoxFunc = (oldBox, newBox) => {
    const w = Math.abs(newBox.width);
    const h = Math.abs(newBox.height);
    if (w < 20 || h < 20) return oldBox;
    const left = Math.min(newBox.x, newBox.x + newBox.width);
    const top = Math.min(newBox.y, newBox.y + newBox.height);
    if (left < 0 || top < 0 || left + w > STAGE_WIDTH || top + h > STAGE_HEIGHT)
      return oldBox;
    return newBox;
  };

  const MOVE_RANGE = 20;
  const homePos = {
    profile: { x: isRight ? 164.5 : 0.5, y: 80 },
    rank: { x: rankInitialAttrs.x, y: rankInitialAttrs.y },
    sticker: { x: stickerInitialAttrs.x, y: stickerInitialAttrs.y },
  };

  const applyDragClamp = (node, type) => {
    const home = homePos[type];
    if (!node || !home) return;
    const box = node.getClientRect({
      relativeTo: node.getLayer(),
      skipStroke: true,
      skipShadow: true,
    });
    let dx = 0;
    let dy = 0;
    if (box.x < home.x - MOVE_RANGE) dx = home.x - MOVE_RANGE - box.x;
    else if (box.x > home.x + MOVE_RANGE) dx = home.x + MOVE_RANGE - box.x;
    if (box.y < home.y - MOVE_RANGE) dy = home.y - MOVE_RANGE - box.y;
    else if (box.y > home.y + MOVE_RANGE) dy = home.y + MOVE_RANGE - box.y;
    if (dx !== 0) node.x(node.x() + dx);
    if (dy !== 0) node.y(node.y() + dy);
  };
  const makeDragMove = (type) => (e) => applyDragClamp(e.target, type);

  const MIN_IMG_SIZE = 30;
  const endPinch = () => {
    pinchRef.current.dist = 0;
    if (!pinchRef.current.active) return;
    pinchRef.current.active = false;
    setTimeout(() => {
      justDraggedRef.current = false;
    }, 200);
  };
  const makePinchMove = (type) => (e) => {
    const touches = e.evt.touches;
    if (!touches || touches.length < 2) return;
    e.evt.preventDefault();
    e.cancelBubble = true;
    const node = e.target;
    node.stopDrag();
    pinchRef.current.active = true;
    justDraggedRef.current = true;
    const [t1, t2] = [touches[0], touches[1]];
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    const last = pinchRef.current.dist;
    pinchRef.current.dist = dist;
    if (!last) return;
    const baseW = node.width();
    const baseH = node.height();
    const left = node.x();
    const top = node.y();
    const sx = node.scaleX() < 0 ? -1 : 1;
    const sy = node.scaleY() < 0 ? -1 : 1;
    let factor = dist / last;
    factor = Math.min(
      factor,
      (STAGE_WIDTH - left) / baseW,
      (STAGE_HEIGHT - top) / baseH,
    );
    factor = Math.max(factor, MIN_IMG_SIZE / baseW, MIN_IMG_SIZE / baseH);
    const newW = baseW * factor;
    const newH = baseH * factor;
    node.width(newW);
    node.height(newH);
    node.offsetX(sx === -1 ? newW : 0);
    node.offsetY(sy === -1 ? newH : 0);
    node.getLayer()?.batchDraw();
    transformerRef.current?.forceUpdate();
    setAttrsByType(type, (prev) => ({
      ...prev,
      width: newW,
      height: newH,
      offsetX: sx === -1 ? newW : 0,
      offsetY: sy === -1 ? newH : 0,
    }));
  };
  const handlePinchEnd = (e) => {
    if (!e.evt.touches || e.evt.touches.length < 2) endPinch();
  };
  const handleTouchCancel = () => endPinch();

  useEffect(() => {
    const formData = localStorage.getItem("mlmform");
    const profileData = sessionStorage.getItem("mlmProfile");
    if (formData) setMlmForm(JSON.parse(formData));
    if (profileData) {
      const parsed = JSON.parse(profileData);
      setMlmProfile(parsed);
      setmiddaleImage(parsed?.profileImageURLs?.[0] || null);
    }
  }, []);

  const fetchSubscriptionAndUser = useCallback(async () => {
    try {
      setSubLoading(true);
      const user = getUser();
      if (!user) return;
      const mobileNo = user?.mobileNo;
      if (!mobileNo) return;
      const activeQuery = query(
        collection(db, COLLECTIONS.SUBSCRIPTION),
        where("mobileNo", "==", mobileNo),
        where("Active", "==", true),
        where("Expire", "==", false),
      );
      const userQuery = query(
        collection(db, COLLECTIONS.USERS),
        where("mobileNo", "==", mobileNo),
      );
      const [activeSnap, userSnap] = await Promise.all([
        getDocs(activeQuery),
        getDocs(userQuery),
      ]);
      const activeSubs = activeSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort(
          (a, b) => (b.PurchaseAt?.seconds ?? 0) - (a.PurchaseAt?.seconds ?? 0),
        );
      setActiveSub(activeSubs[0] || null);
      if (!userSnap.empty)
        setUserData({ id: userSnap.docs[0].id, ...userSnap.docs[0].data() });
    } catch (err) {
    } finally {
      setSubLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionAndUser();
  }, [fetchSubscriptionAndUser]);

  const getSelectedImageRef = () => {
    if (selectedImageType === "profile") return profileImageRef.current;
    if (selectedImageType === "rank") return rankImageRef.current;
    if (selectedImageType === "sticker") return stickerImageRef.current;
    return null;
  };

  const getSelectedImageAttrs = () => {
    if (selectedImageType === "profile") return profileAttrs;
    if (selectedImageType === "rank") return rankAttrs;
    if (selectedImageType === "sticker") return stickerAttrs;
    return null;
  };

  useEffect(() => {
    if (!transformerRef.current) return;
    if (isImageSelected) {
      const node = getSelectedImageRef();
      transformerRef.current.nodes(node ? [node] : []);
      updateToolbarPos();
    } else {
      transformerRef.current.nodes([]);
    }
    transformerRef.current.getLayer()?.batchDraw();
  }, [isImageSelected, selectedImageType]);

  const updateToolbarPos = () => {
    const attrs = getSelectedImageAttrs();
    if (!attrs) return;
    const { x, y, width } = attrs;
    setToolbarPos({ x, y, width });
  };

  useEffect(() => {
    if (isImageSelected) updateToolbarPos();
  }, [
    profileAttrs,
    rankAttrs,
    stickerAttrs,
    isImageSelected,
    selectedImageType,
  ]);

  const SocialURLs = mlmProfile?.socials || {};
  const socialText =
    SocialURLs.Youtube ||
    SocialURLs.Instagram ||
    SocialURLs.Facebook ||
    SocialURLs.X ||
    "";
  const availableSocials = [
    SocialURLs.Youtube ? "youtube" : null,
    SocialURLs.Instagram ? "instagram" : null,
    SocialURLs.Facebook ? "facebook" : null,
    SocialURLs.X ? "x" : null,
  ].filter(Boolean);

  const socialIconShift = Math.max(0, socialText.length - 6);
  const socialIconBaseXLeft = !isSubGeneralType
    ? clamp(30 - socialIconShift, 160, 220)
    : clamp(210 - socialIconShift, 160, 220);
  const socialIconBaseXRight = !isSubGeneralType
    ? clamp(50 - socialIconShift, 95, 100)
    : clamp(65 - socialIconShift, 60, 100);
  const socialIconPositionsLeft = availableSocials.map(
    (_, i) => socialIconBaseXLeft + i * 6,
  );
  const socialIconPositionsRight = availableSocials.map(
    (_, i) => socialIconBaseXRight + i * 6,
  );

  const topuplineURLs =
    showTopupline === "no"
      ? []
      : mlmForm?.topuplineURLs?.length
        ? mlmForm.topuplineURLs
        : mlmProfile?.topuplineURLs || [];

  const logoEntries =
    showLogo === "no" ? [] : getLocalLogo(`${mlmProfile?.companyId}`) || [];

  const logo1size = logoEntries[0]?.size || "rectangle";
  const logo2size = logoEntries[1]?.size || "rectangle";

  const hoflogo1 = logo1size === "square" ? 25 : 23;
  const woflogo1 = logo1size === "square" ? 25 : 50;

  const hoflogo2 = logo2size === "square" ? 25 : 23;
  const woflogo2 = logo2size === "square" ? 25 : 50;

  const profileName = mlmForm?.promoter?.name
    ? mlmForm.promoter.name
    : mlmProfile?.fullName || "";
  const profileMobile = mlmForm?.promoter?.name
    ? mlmForm.promoter.mobile
    : mlmProfile?.mobile || "";
  const designation = useMemo(() => {
    if (isThankyouRank && savedDesignation?.name) {
      return savedDesignation.name;
    }

    return mlmForm?.promoter?.name
      ? mlmForm.promoter.role
      : mlmProfile?.designation;
  }, [isThankyouRank, savedDesignation, mlmForm, mlmProfile]);

  const AchiveName = achievementForm?.name || "";
  const AchivePrice = achievementForm?.price || "";
  const incomePrice = incomeFormData?.amount || "";
  const incomeDay = incomeFormData?.noOfDay || "";
  const incomeType = incomeFormData?.typeOfIncome || "";

  const [bgImage, bgStatus] = useImage(`${selected?.url || ""}`, "anonymous");
  if (bgStatus === "loaded" || bgImage) bgFirstLoadDoneRef.current = true;
  const selectedVideoUrl =
    selected?.backgroundVideoUrl || selected?.videoUrl || null;

  useEffect(() => {
    setVideoPlaying(!!selectedVideoUrl);
  }, [selectedVideoUrl]);
  const [Sticker] = useImage(
    isAchievement
      ? `${selected?.nameImageUrl || ""}`
      : `${selected?.bannerId || ""}`,
    "anonymous",
  );
  const [AchiveFrame] = useImage(
    isAchievement
      ? `${selected?.bannerId || ""}`
      : `${selected?.nameImageUrl || ""}`,
    "anonymous",
  );
  const sleDay = mlmForm?.bonanzaDays;
  const iwho = mlmForm?.bonanzaForWhom;

  const [imgBonanza] = useImage(
    sleDay === "1 Night/2 Day"
      ? twodn
      : sleDay === "2 Night/3 Day"
        ? threedn
        : sleDay === "3 Night/4 Day"
          ? fourdn
          : "",
    "anonymous",
  );
  const [imgBonanzafamily] = useImage(
    iwho === "FAMILY" ? familly : null,
    "anonymous",
  );

  const [imgTraining] = useImage(selll?.ShowCaseForm || "", "anonymous");
  const [tankyoubadge] = useImage(savedDesignation?.profileimage, "anonymous");
  const [rankbadge] = useImage(`${selected?.rankNameImageUrl}`, "anonymous");
  const [spdone] = useImage(spdoneimg, "anonymous");
  // const [rankbadge] = useImage(
  //   `https://firebasestorage.googleapis.com/v0/b/mlmbooster-a4887.firebasestorage.app/o/companies%2Fprofiles%2F1783622139234_4w41zm.webp?alt=media&token=7a87aeba-624d-491d-88fe-63c188752a60`,
  //   "anonymous",
  // );

  const [imgNum0] = useImage(num0, "anonymous");
  const [imgNum1] = useImage(num1, "anonymous");
  const [imgNum2] = useImage(num2, "anonymous");
  const [imgNum3] = useImage(num3, "anonymous");
  const [imgNum4] = useImage(num4, "anonymous");
  const [imgNum5] = useImage(num5, "anonymous");
  const [imgNum6] = useImage(num6, "anonymous");
  const [imgNum7] = useImage(num7, "anonymous");
  const [imgNum8] = useImage(num8, "anonymous");
  const [imgNum9] = useImage(num9, "anonymous");
  const [imgComma] = useImage(numComma, "anonymous");
  const [imgRupee] = useImage(numRupee, "anonymous");

  const digitImageMap = useMemo(
    () => ({
      0: imgNum0,
      1: imgNum1,
      2: imgNum2,
      3: imgNum3,
      4: imgNum4,
      5: imgNum5,
      6: imgNum6,
      7: imgNum7,
      8: imgNum8,
      9: imgNum9,
      ",": imgComma,
      "₹": isClosing ? null : imgRupee,
    }),
    [
      imgNum0,
      imgNum1,
      imgNum2,
      imgNum3,
      imgNum4,
      imgNum5,
      imgNum6,
      imgNum7,
      imgNum8,
      imgNum9,
      imgComma,
      imgRupee,
      isClosing,
    ],
  );
  function computeAmountWidth(text, dh, sp = 1.5) {
    return text.split("").reduce((total, ch, i, arr) => {
      const aspect = ch === "₹" ? 0.78 : ch === "," ? 0.32 : 0.62;
      return total + dh * aspect + (i < arr.length - 1 ? sp : 0);
    }, 0);
  }

  function GoldenAmountImages({
    amountText,
    digitImageMap,
    startX,
    y,
    digitHeight,
    spacing = 1.5,
    onTap,
  }) {
    const chars = amountText.split("");
    let curX = startX;
    const nodes = [];
    chars.forEach((ch, i) => {
      const img = digitImageMap[ch];
      const aspect = ch === "₹" ? 0.78 : ch === "," ? 0.32 : 0.62;
      const digitWidth = digitHeight * aspect;
      const isComma = ch === ",";
      const charH = isComma ? digitHeight * 0.4 : digitHeight;
      const yOffset = isComma ? digitHeight * 0.6 : 0;
      if (img) {
        nodes.push(
          <Image
            key={`amt-${i}-${ch}`}
            image={img}
            x={curX}
            y={y + yOffset}
            width={digitWidth}
            height={charH}
            onClick={onTap}
            onTap={onTap}
          />,
        );
      } else {
        nodes.push(
          <Text
            key={`amt-${i}-${ch}`}
            fontFamily="Roboto"
            x={curX}
            y={y + yOffset}
            text={ch}
            fontSize={digitHeight * 0.8}
            fill="#ffd700"
            fontStyle="bold"
            onClick={onTap}
            onTap={onTap}
          />,
        );
      }
      curX += digitWidth + spacing;
    });
    return <>{nodes}</>;
  }

  const [Imagefooter] = useImage(selectedFooterFrame?.value, "anonymous");
  const [Imagel2] = useImage(logoEntries?.[0]?.link || "", "anonymous");

  const [Imagel3] = useImage(logoEntries?.[1]?.link || "", "anonymous");

  const [Imagef1] = useImage(achievementForm?.features?.[0] || "", "anonymous");
  const [Imagef2] = useImage(achievementForm?.features?.[1] || "", "anonymous");
  const [Imagef3] = useImage(achievementForm?.features?.[2] || "", "anonymous");

  const [MainAchieveImage] = useImage(
    achievementForm?.mainImage || "",
    "anonymous",
  );
  const [MainIncomeProof] = useImage(
    incomeFormData?.proofImage || "",
    "anonymous",
  );
  const [ImagetopFrame] = useImage(selectedTopFrame?.value || "", "anonymous");
  const [Imagetop1] = useImage(topuplineURLs?.[0] || "", "anonymous");
  const [Imagetop2] = useImage(topuplineURLs?.[1] || "", "anonymous");
  const [Imagetop3] = useImage(topuplineURLs?.[2] || "", "anonymous");
  const [Imagetop4] = useImage(topuplineURLs?.[3] || "", "anonymous");
  const [Imagetop5] = useImage(topuplineURLs?.[4] || "", "anonymous");
  const [Imagetop6] = useImage(topuplineURLs?.[5] || "", "anonymous");
  const [Imagetop7] = useImage(topuplineURLs?.[6] || "", "anonymous");
  const [Imagetop8] = useImage(topuplineURLs?.[7] || "", "anonymous");
  const [Imagetop9] = useImage(topuplineURLs?.[8] || "", "anonymous");
  const [Imagetop10] = useImage(topuplineURLs?.[9] || "", "anonymous");
  const [Imagetop11] = useImage(topuplineURLs?.[10] || "", "anonymous");
  const [Imagetop12] = useImage(topuplineURLs?.[11] || "", "anonymous");
  const [Imagetop13] = useImage(topuplineURLs?.[12] || "", "anonymous");
  const [Imagetop14] = useImage(topuplineURLs?.[13] || "", "anonymous");
  const [Imagetop15] = useImage(topuplineURLs?.[14] || "", "anonymous");

  const [ImageChief] = useImage(meetingData?.chiefImage || "", "anonymous");
  const [ImageProfile] = useImage(
    mlmForm?.promoter?.name
      ? `${mlmForm.promoter.image}`
      : `${middaleImage || ""}`,
    "anonymous",
  );

  const [amountPatternId, setAmountPatternId] = useState("gold1");
  const [isAmountModalOpen, setIsAmountModalOpen] = useState(false);
  const selectedAmountOption = AMOUNT_GRADIENT_OPTIONS.find(
    (option) => option.id === amountPatternId,
  );
  const [ImageRank] = useImage(mlmForm?.achiever?.image, "anonymous");
  const [ImageRank2] = useImage(mlmForm?.achiever?.image, "anonymous");

  // Re-cache rank image node whenever the source image changes (required for Konva filters)
  useEffect(() => {
    const node = rankImageRef.current;
    if (!node) return;
    const img = isMeeting ? ImageChief : ImageRank;
    if (!img) return;
    const t = setTimeout(() => {
      try {
        // iOS has a much tighter per-tab memory budget than desktop/Android;
        // caching at 4x resolution there can push Safari's WebProcess over
        // its limit and silently reload the page. Cap it lower on iOS.
        node.cache({ pixelRatio: isIOS() ? 2 : 4 });
        node.getLayer()?.batchDraw();
      } catch (_) {}
    }, 50);
    return () => clearTimeout(t);
  }, [ImageRank, ImageChief, isMeeting]);

  const formname = getAchieverDisplayName(mlmForm?.achiever);
  const formcity = mlmForm?.achiever?.city || "";
  const trainingDate = mlmForm?.selectedDate || "";
  const formamount = isIncome
    ? incomeFormData?.amount
    : isAchievement
      ? achievementForm?.price
      : mlmForm?.achiever?.amount || "";

  const formatAmount = (value) => {
    const cleaned = String(value).replace(/,/g, "").trim();
    const numeric = Number(cleaned);
    if (!Number.isFinite(numeric)) return cleaned;
    return numeric.toLocaleString("en-IN");
  };

  const amountText =
    String(formamount).trim() !== ""
      ? isClosing
        ? `${formatAmount(formamount)}`
        : `₹${formatAmount(formamount)}`
      : "";
  const charslen = amountText.split("");

  const [insta] = useImage(instagram, "anonymous");
  const [fb] = useImage(facebook, "anonymous");
  const [yt] = useImage(youtube, "anonymous");
  const [xlogo] = useImage(x, "anonymous");
  const [zooml] = useImage(zoom, "anonymous");
  const [meetl] = useImage(meet, "anonymous");
  const [locl] = useImage(Loc, "anonymous");

  const planDownloads = activeSub?.download ?? 0;
  const referCredits = userData?.referCredit ?? 0;
  const totalDownloadsAvailable = planDownloads + referCredits;

  // const checkCredits = (cost) => {
  // if (!activeSub) {
  //   showToast(
  //     "No active subscription found. Please subscribe to export.", {change for free}
  //     "error",
  //   );
  //   return false;
  // }
  // const expiry = parseExpiryDate(activeSub.expirydate);
  // if (expiry && new Date() > expiry) {
  //   showToast(
  //     "Your subscription has expired. Please renew to continue.", {change for free}
  //     "error",
  //   );
  //   return false;
  // }
  //   if (totalDownloadsAvailable < cost) {
  //     showToast(
  //       `This export needs ${cost} credit${cost > 1 ? "s" : ""}, but you have ${totalDownloadsAvailable}. Please renew your plan.`,
  //       "error",
  //       4000,
  //     );
  //     return false; {change for free}
  //   }
  //   return true;
  // };

  // const deductCredits = async (cost, prefix = "Downloaded!") => {
  //   let remaining = cost;
  //   const fromPlan = Math.min(planDownloads, remaining);
  //   const newPlan = planDownloads - fromPlan;
  //   remaining -= fromPlan;
  //   const fromRefer = Math.min(referCredits, remaining);
  //   const newCredits = referCredits - fromRefer;
  //   const totalAfter = newPlan + newCredits;
  //   const planExhausted = newPlan === 0 && newCredits === 0;
  //   if (fromPlan > 0) {
  //     const subRef = doc(db, "subscription", activeSub.id);
  //     await updateDoc(subRef, {
  //       download: newPlan,
  //       ...(planExhausted ? { Active: false, Expire: true } : {}),
  //     });
  //     setActiveSub((prev) => ({
  //       ...prev,
  //       download: newPlan,
  //       ...(planExhausted ? { Active: false, Expire: true } : {}),
  //     }));
  //   }
  //   if (fromRefer > 0) {
  //     const userRef = doc(db, "users", userData.id);
  //     await updateDoc(userRef, { referCredit: newCredits });
  //     setUserData((prev) => ({ ...prev, referCredit: newCredits }));
  //   }
  //   if (totalAfter === 0)
  //     showToast(`${prefix} No download credits remaining.`, "error", 4000);
  //   else
  //     showToast(
  //       `${prefix} ${totalAfter} credit${totalAfter > 1 ? "s" : ""} remaining.`,
  //       "success",
  //     );
  // }; {change for free}

  const handleExport = async () => {
    if (exportInProgressRef.current) return;
    // if (!checkCredits(IMAGE_CREDIT_COST)) return; {change for free}
    exportInProgressRef.current = true;
    setExportLoading(true);
    setIsImageSelected(false);
    setSelectedImageType(null);
    await new Promise((res) => setTimeout(res, 80));
    try {
      const uri = stageRef.current.toDataURL({
        pixelRatio: EXPORT_PIXEL_RATIO,
        mimeType: "image/png",
        quality: 1,
      });
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: "DOWNLOAD_IMAGE",
            base64: uri,
            fileName: "mlmbooster.png",
          }),
        );
      } else {
        const link = document.createElement("a");
        link.download = "mlmbooster.png";
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      // await deductCredits(IMAGE_CREDIT_COST, "Downloaded!"); {change for free}
      setExportedUri(uri);
      celebrateDownload();
    } catch (err) {
      showToast("Export failed. Please try again.", "error");
    } finally {
      setExportLoading(false);
      exportInProgressRef.current = false;
    }
  };

  const handleExportVideo = async () => {
    if (exportInProgressRef.current) return;
    const stage = stageRef.current;
    const videoEl = videoElRef.current;
    if (!stage || !videoEl) {
      showToast("Select a video first.", "error");
      return;
    }
    if (
      typeof MediaRecorder === "undefined" ||
      typeof stage.toCanvas !== "function"
    ) {
      showToast("Video download isn't supported on this device.", "error");
      return;
    }
    // Ensure video is playing (muted so autoplay works)
    videoEl.muted = true;
    const startPlay = videoEl.play();
    if (startPlay && typeof startPlay.catch === "function")
      startPlay.catch(() => {});
    setVideoPlaying(true);
    // if (!checkCredits(VIDEO_CREDIT_COST)) return; {change for free}
    exportInProgressRef.current = true;
    setExportLoading(true);
    setVideoExporting(true);
    setProgressTarget(5);
    setProgressLabel("Preparing canvas...");
    setProgressLogs([]);
    setIsImageSelected(false);
    setSelectedImageType(null);
    // Wait for video to start rendering on canvas
    await new Promise((res) => setTimeout(res, 300));
    let rafId = null;
    let recorder = null;
    let stream = null;
    let progressTicker = null;
    try {
      if (videoEl.paused) {
        try {
          await videoEl.play();
        } catch (_) {}
      }
      // Lower resolution on iOS to stay within its stricter per-tab memory
      // budget — recording continuously at 3x/4x was pushing Safari's
      // WebProcess into an OOM reload during "create design" video export.
      const ratio = VIDEO_PIXEL_RATIO;
      const rec = document.createElement("canvas");
      rec.width = STAGE_WIDTH * ratio;
      rec.height = STAGE_HEIGHT * ratio;
      const ctx = rec.getContext("2d");
      const drawFrame = () => {
        try {
          // Force Konva to redraw ALL layers (video frame + text + image animations)
          // before capturing — ensures every frame is current, not stale.
          stage.getLayers().forEach((l) => l.batchDraw());
          const c = stage.toCanvas({ pixelRatio: ratio });
          ctx.drawImage(c, 0, 0, rec.width, rec.height);
        } catch (_) {}
        rafId = requestAnimationFrame(drawFrame);
      };
      drawFrame();
      // Canvas captureStream has NO audio tracks — pure visual only, no audio attached.
      stream = rec.captureStream(30);
      const mime =
        ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(
          (t) => MediaRecorder.isTypeSupported(t),
        ) || "video/webm";
      recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: 8_000_000,
      });
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size) chunks.push(e.data);
      };
      const stopped = new Promise((resolve) => {
        recorder.onstop = resolve;
      });
      const clip =
        isFinite(videoEl.duration) && videoEl.duration > 0
          ? videoEl.duration
          : 8;
      const recordMs = clip * 1000;

      // Tick progress from 10% → 90% over the recording duration
      setProgressTarget(10);
      setProgressLabel("Recording video...");
      const recordStart = Date.now();
      progressTicker = setInterval(() => {
        const elapsed = Date.now() - recordStart;
        const pct = Math.min(Math.round((elapsed / recordMs) * 80) + 10, 90);
        const remaining = Math.max(0, Math.ceil((recordMs - elapsed) / 1000));
        setProgressTarget(pct);
        setProgressLabel(
          remaining > 0 ? `Recording… ${remaining}s left` : "Finishing up...",
        );
      }, 250);

      recorder.start(100);
      await new Promise((res) => setTimeout(res, recordMs));

      clearInterval(progressTicker);
      progressTicker = null;
      setProgressTarget(93);
      setProgressLabel("Saving video...");

      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (recorder.state !== "inactive") recorder.stop();
      await stopped;
      const blob = new Blob(chunks, { type: "video/webm" });
      if (!blob.size) throw new Error("Empty recording");

      setProgressTarget(97);
      setProgressLabel("Sending to device...");

      const fileName = `mlmbooster_${Date.now()}.webm`;
      if (window.ReactNativeWebView) {
        const base64 = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.onerror = () => rej(new Error("Could not encode video"));
          reader.readAsDataURL(blob);
        });
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: "DOWNLOAD_VIDEO",
            base64,
            fileName,
            mimeType: "video/webm",
          }),
        );
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 8000);
      }
      setProgressTarget(100);
      setProgressLabel("Done!");
      celebrateDownload();
      // await deductCredits(VIDEO_CREDIT_COST, "Video downloaded!"); {change for free}
    } catch (err) {
      showToast("Video download failed. Please try again.", "error");
    } finally {
      if (progressTicker) clearInterval(progressTicker);
      if (rafId) cancelAnimationFrame(rafId);
      try {
        if (recorder && recorder.state !== "inactive") recorder.stop();
      } catch (_) {}
      try {
        if (stream) stream.getTracks().forEach((t) => t.stop());
      } catch (_) {}
      setExportLoading(false);
      exportInProgressRef.current = false;
      setTimeout(() => {
        setVideoExporting(false);
        setProgressTarget(0);
        setProgressLabel("");
      }, 800);
    }
  };

  const handleDeviceMusic = async (file) => {
    if (!file) return;
    try {
      setDeviceLoading(true);
      setAudioUploadProgress(0);
      if (!file.type?.startsWith("audio/")) {
        showToast("Please choose an audio file.", "error");
        return;
      }
      await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            setAudioUploadProgress(Math.round((e.loaded / e.total) * 80));
          }
        };
        reader.onload = () => resolve();
        reader.onerror = () => reject(new Error("File read failed"));
        reader.readAsArrayBuffer(file);
      });
      setAudioUploadProgress(85);
      let duration = null;
      try {
        duration = await getAudioDuration(file);
      } catch (_) {}
      setAudioUploadProgress(100);
      if (!duration || duration <= 0) {
        showToast("Could not read this audio file. Try another one.", "error");
        return;
      }
      setSelectedMusic({ file, name: file.name });
      setMusicModalOpen(false);
      showToast(`Music added: ${file.name}`, "success");
    } finally {
      setDeviceLoading(false);
      setAudioUploadProgress(0);
    }
  };

  const handlePresetMusic = async (preset) => {
    if (!preset?.url) return;
    try {
      setPresetLoadingUrl(preset.url);
      const resp = await fetch(preset.url);
      if (!resp.ok) throw new Error("Network error");
      const blob = await resp.blob();
      const ext = (
        preset.url.split("?")[0].split(".").pop() || "mp3"
      ).toLowerCase();
      const file = new File([blob], `${preset.name}.${ext}`, {
        type: blob.type || "audio/mpeg",
      });
      setSelectedMusic({ file, name: preset.name });
      setMusicModalOpen(false);
      showToast(`Music added: ${preset.name}`, "success");
    } catch (_) {
      showToast(
        "Could not load this track. Try another or upload from device.",
        "error",
      );
    } finally {
      setPresetLoadingUrl(null);
    }
  };

  const handleRemoveMusic = () => {
    setSelectedMusic(null);
    setMusicModalOpen(false);
    showToast("Music removed", "info");
  };

  const loadFirestoreAudios = useCallback(
    async (reset = false, searchTerm = "") => {
      if (audioLoading) return;
      setAudioLoading(true);
      try {
        let q;
        if (searchTerm.trim()) {
          const snap = await getDocs(
            query(collection(db, "music"), where("Active", "==", true)),
          );
          const lower = searchTerm.trim().toLowerCase();
          const results = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((d) => (d.Name_Music || "").toLowerCase().includes(lower));
          setFirestoreAudios(results);
          setAudioHasMore(false);
          setAudioLastDoc(null);
        } else {
          const constraints = [
            where("Active", "==", true),
            orderBy("Name_Music"),
            limit(MUSIC_PAGE_SIZE),
          ];
          if (!reset && audioLastDoc)
            constraints.push(startAfter(audioLastDoc));
          q = query(collection(db, "music"), ...constraints);
          const snap = await getDocs(q);
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setFirestoreAudios((prev) => (reset ? docs : [...prev, ...docs]));
          setAudioLastDoc(snap.docs[snap.docs.length - 1] || null);
          setAudioHasMore(snap.docs.length === MUSIC_PAGE_SIZE);
        }
      } catch (err) {
        const isMissingIndex =
          err?.message?.includes("requires an index") ||
          err?.code === "failed-precondition";
        if (isMissingIndex) {
          // console.warn(
          //   "Firestore music query requires a composite index. Loading fallback results without index ordering.",
          //   err,
          // );
          const snap = await getDocs(
            query(
              collection(db, "music"),
              where("Active", "==", true),
              limit(MUSIC_PAGE_SIZE),
            ),
          );
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setFirestoreAudios(
            reset
              ? sortMusicTracks(docs)
              : [...firestoreAudios, ...sortMusicTracks(docs)],
          );
          setAudioLastDoc(snap.docs[snap.docs.length - 1] || null);
          setAudioHasMore(snap.docs.length === MUSIC_PAGE_SIZE);
          showToast("Music is loading in compatibility mode.", "warning");
        } else {
        }
      } finally {
        setAudioLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [audioLoading, audioLastDoc],
  );

  useEffect(() => {
    if (musicModalOpen && firestoreAudios.length === 0) {
      loadFirestoreAudios(true, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicModalOpen]);

  useEffect(() => {
    if (!musicModalOpen) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = "";
      }
      setPlayingAudioId(null);
      setPlayingAudioUrl(null);
    }
  }, [musicModalOpen]);

  const handleAudioSearchChange = useCallback((val) => {
    setAudioSearch(val);
    setAudioLastDoc(null);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadFirestoreAudios(true, audioSearch);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSearch]);

  const handleAudioListScroll = useCallback(() => {
    const el = audioListRef.current;
    if (!el || audioLoading || !audioHasMore || audioSearch.trim()) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      loadFirestoreAudios(false, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioLoading, audioHasMore, audioSearch]);

  const handlePlayAudio = useCallback(
    (track) => {
      const url = track.Url || "";
      if (!url) return;
      if (playingAudioId === track.id) {
        if (audioPlayerRef.current) {
          if (audioPlayerRef.current.paused) {
            audioPlayerRef.current.play();
          } else {
            audioPlayerRef.current.pause();
          }
        }
        return;
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = url;
        audioPlayerRef.current.play().catch(() => {});
      }
      setPlayingAudioId(track.id);
      setPlayingAudioUrl(url);
    },
    [playingAudioId],
  );

  const handleSelectFirestoreTrack = useCallback(async (track) => {
    const url = track.Url || "";
    const name = track.Name_Music || "Track";
    if (!url) return;
    try {
      setPresetLoadingUrl(track.id);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = "";
      }
      setPlayingAudioId(null);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Network error");
      const blob = await resp.blob();
      const ext = (url.split("?")[0].split(".").pop() || "mp3").toLowerCase();
      const file = new File([blob], `${name}.${ext}`, {
        type: blob.type || "audio/mpeg",
      });
      setSelectedMusic({ file, name });
      setMusicModalOpen(false);
      showToast(`Music added: ${name}`, "success");
    } catch (_) {
      showToast(
        "Could not load this track. Try another or upload from device.",
        "error",
      );
    } finally {
      setPresetLoadingUrl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExportWithMusic = async () => {
    if (!selectedMusic?.file) {
      handleExport();
      return;
    }
    if (exportInProgressRef.current) return;
    // if (!checkCredits(VIDEO_CREDIT_COST)) return; {change for free}
    exportInProgressRef.current = true;
    const withTimeout = (promise, ms, label) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `${label} timed out (${ms / 1000}s). Check your internet and try again.`,
                ),
              ),
            ms,
          ),
        ),
      ]);
    setMusicExporting(true);
    setProgressTarget(0);
    setProgressLogs([]);
    setIsImageSelected(false);
    setSelectedImageType(null);
    await new Promise((res) => setTimeout(res, 80));
    let videoBlob = null;
    let videoDataUrl = null;
    try {
      setProgressTarget(5);
      setProgressLabel("Loading export engine...");
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");
      let ffmpeg = ffmpegRef.current;
      if (!ffmpeg) {
        ffmpeg = new FFmpeg();
        ffmpeg.on("log", ({ message }) => {
          setProgressLogs((prev) => [...prev.slice(-4), message]);
        });
        ffmpeg.on("progress", ({ progress: p }) => {
          const bump = Math.round(Math.min(Math.max(p, 0), 1) * 40) + 50;
          setProgressTarget((prev) => Math.max(prev, bump));
        });
        const sources = [
          { label: "local", core: ffmpegCoreURL, wasm: ffmpegWasmURL },
          {
            label: "jsdelivr",
            core: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js",
            wasm: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm",
          },
          {
            label: "unpkg",
            core: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js",
            wasm: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm",
          },
        ];
        setProgressLabel("Loading codec...");
        setProgressTarget(8);
        let loaded = false;
        let lastErr = null;
        for (const src of sources) {
          try {
            const coreURL = await withTimeout(
              toBlobURL(src.core, "text/javascript"),
              45000,
              "Codec load",
            );
            setProgressTarget(11);
            const wasmURL = await withTimeout(
              toBlobURL(src.wasm, "application/wasm"),
              60000,
              "Engine load",
            );
            setProgressTarget(13);
            await withTimeout(
              ffmpeg.load({ coreURL, wasmURL }),
              30000,
              "Engine start",
            );
            loaded = true;
            break;
          } catch (e) {
            // console.warn("FFmpeg core source failed:", src.label, e);
            lastErr = e;
          }
        }
        if (!loaded)
          throw new Error(
            "Could not load video engine. " +
              (lastErr?.message || "Network error"),
          );
        ffmpegRef.current = ffmpeg;
      }
      setProgressTarget(15);
      setProgressLabel("Reading audio duration...");
      let duration = null;
      try {
        duration = await getAudioDuration(selectedMusic.file);
      } catch (_) {}
      if (!duration || duration <= 0)
        throw new Error(
          "Could not read audio duration. Try a different audio file.",
        );
      duration = Math.min(duration, MAX_MUSIC_SECONDS);
      setProgressTarget(25);
      setProgressLabel("Capturing design...");
      // Same iOS memory-budget concern as the plain video recorder above —
      // cap the capture resolution used before feeding FFmpeg's WASM buffer.
      const uri = stageRef.current.toDataURL({
        pixelRatio: VIDEO_PIXEL_RATIO,
        mimeType: "image/png",
        quality: 1,
      });
      if (!uri || uri.length < 100)
        throw new Error("Could not capture design. Try again.");
      setProgressTarget(35);
      setProgressLabel("Preparing files...");
      await ffmpeg.writeFile("input.png", await fetchFile(uri));
      setProgressTarget(45);
      const ext =
        (selectedMusic.file?.name || "track.mp3")
          .split(".")
          .pop()
          .toLowerCase() || "mp3";
      const audName = `input.${ext}`;
      await ffmpeg.writeFile(audName, await fetchFile(selectedMusic.file));
      setProgressTarget(50);
      setProgressLabel("Encoding video...");
      let progressTicker = setInterval(() => {
        setProgressTarget((prev) => (prev < 90 ? prev + 2 : prev));
      }, 600);
      try {
        await ffmpeg.exec([
          "-loop",
          "1",
          "-framerate",
          "1",
          "-i",
          "input.png",
          "-i",
          audName,
          "-t",
          String(duration),
          "-vf",
          "scale=640:640",
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          "-tune",
          "stillimage",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-ar",
          "44100",
          "-ac",
          "2",
          "-pix_fmt",
          "yuv420p",
          "-r",
          "1",
          "-shortest",
          "-avoid_negative_ts",
          "make_zero",
          "-movflags",
          "+faststart",
          "output.mp4",
        ]);
      } finally {
        clearInterval(progressTicker);
      }
      setProgressTarget(95);
      setProgressLabel("Saving video...");
      const data = await ffmpeg.readFile("output.mp4");
      videoBlob = new Blob([data.buffer], { type: "video/mp4" });
      if (videoBlob.size < 1000)
        throw new Error(
          "Video encoding failed (file too small). Try a different audio file.",
        );
      try {
        await ffmpeg.deleteFile("input.png");
      } catch (_) {}
      try {
        await ffmpeg.deleteFile(audName);
      } catch (_) {}
      try {
        await ffmpeg.deleteFile("output.mp4");
      } catch (_) {}
      const fileName = `mlmbooster_${Date.now()}.mp4`;
      if (window.ReactNativeWebView) {
        setProgressLabel("Sending to device...");
        videoDataUrl = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.onerror = () =>
            rej(new Error("Could not encode video for download"));
          reader.readAsDataURL(videoBlob);
        });
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: "DOWNLOAD_VIDEO",
            base64: videoDataUrl,
            fileName,
            mimeType: "video/mp4",
          }),
        );
      } else {
        const dlUrl = URL.createObjectURL(videoBlob);
        const link = document.createElement("a");
        link.href = dlUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(dlUrl), 8000);
      }
      setProgressTarget(100);
      setProgressLabel("Done!");
      celebrateDownload();
      // await deductCredits(VIDEO_CREDIT_COST, "Video downloaded!"); {change for free}
    } catch (err) {
      showToast("Video export failed. Please try again.", "error", 5000);
    } finally {
      setMusicExporting(false);
      exportInProgressRef.current = false;
      setTimeout(() => {
        setProgressTarget(0);
        setProgressLabel("");
        setProgressLogs([]);
      }, 800);
    }
  };

  const handleFlip = (e) => {
    e.stopPropagation();
    if (!selectedImageType) return;
    const getAttrs = () => {
      if (selectedImageType === "profile") return profileAttrs;
      if (selectedImageType === "rank") return rankAttrs;
      if (selectedImageType === "sticker") return stickerAttrs;
    };
    const setAttrs = (updater) => {
      if (selectedImageType === "profile") setProfileAttrs(updater);
      else if (selectedImageType === "rank") setRankAttrs(updater);
      else if (selectedImageType === "sticker") setStickerAttrs(updater);
    };
    const current = getAttrs();
    const isFlipped = current.offsetY === -1;
    setAttrs((prev) => ({
      ...prev,
      scaleY: isFlipped ? 1 : -1,
      offsetY: isFlipped ? 0 : prev.height,
    }));
    const nodeMap = {
      profile: profileImageRef.current,
      rank: rankImageRef.current,
      sticker: stickerImageRef.current,
    };
    const node = nodeMap[selectedImageType];
    if (node) {
      const isFlipped = node.scaleY() === -1;
      node.scaleY(isFlipped ? 1 : -1);
      node.offsetY(isFlipped ? 0 : current.height);
      node.getLayer()?.batchDraw();
    }
  };

  const [stageSize, setStageSize] = useState(320);

  useLayoutEffect(() => {
    const update = () => {
      if (!stageContainerRef.current) return;

      setStageSize(stageContainerRef.current.clientWidth);
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(stageContainerRef.current);

    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const handleStageMouseDown = (e) => {
    if (e.target === e.target.getStage()) {
      setIsImageSelected(false);
      setSelectedImageType(null);
    }
  };

  const ActualProfilename = profileName?.toUpperCase() || "PROFILENAME";
  const profileNameFontSize = isSubGeneralType
    ? 11
    : (ActualProfilename?.length ?? 0) <= 20
      ? 9.5
      : (ActualProfilename?.length ?? 0) < 25
        ? 8.5
        : 7.5;
  const companyNameFrt =
    mlmProfile?.companyName === `${`ANVIK INTERNATIONAL`}`
      ? "ANVIK"
      : mlmProfile?.companyName || "";

  const ActualDesignation =
    [designation?.toUpperCase(), companyNameFrt?.toUpperCase()]
      .filter(Boolean)
      .join(", ") || "DESIGNATION";

  let DesignationfontSize = 8;
  if (ActualDesignation?.length > 10 && ActualDesignation?.length <= 19)
    DesignationfontSize = 6;
  else if (ActualDesignation?.length > 19 && ActualDesignation?.length <= 30)
    DesignationfontSize = 5;
  else if (ActualDesignation?.length > 30) DesignationfontSize = 4;

  const TOOLBAR_HEIGHT = 28;
  const TOOLBAR_WIDTH = 36;
  const toolbarTop = Math.max(0, toolbarPos.y - TOOLBAR_HEIGHT - 6);
  const toolbarLeft = clamp(
    toolbarPos.x + toolbarPos.width / 1 - TOOLBAR_WIDTH / 2,
    0,
    STAGE_WIDTH - TOOLBAR_WIDTH,
  );

  const exportCost =
    selectedVideoUrl || selectedMusic?.file
      ? VIDEO_CREDIT_COST
      : IMAGE_CREDIT_COST;

  const downloadBtnLabel = () => {
    if (subLoading) return "Loading...";
    if (exportLoading) return "Exporting...";
    // if (!activeSub) return "No Plan";
    // if (totalDownloadsAvailable < exportCost) return "Not enough credits";
    // return `Download (${totalDownloadsAvailable})`; {change for free}
    return `Download`;
    // return `Download`;
  };

  const canExport = !subLoading && !exportLoading;
  // activeSub &&
  // totalDownloadsAvailable >= exportCost; {change for free}

  // Resolved export function based on current tab/music selection
  const activeExportFn =
    activeTabFromList === "video" && selectedVideoUrl
      ? handleExportVideo
      : selectedMusic
        ? handleExportWithMusic
        : handleExport;

  return (
    <div className="flex flex-col justify-start items-center w-full h-[calc(100dvh-60px)] overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div
        ref={stageContainerRef}
        data-guide="editor-canvas"
        className="relative mt-2 flex-shrink-0"
        style={{
          width: "min(320px, 96vw)",
          height: `${STAGE_WIDTH * stageScale}px`,
          overflow: "hidden",
          touchAction: "none",
        }}
      >
        {bgStatus === "loading" && (
          <div
            className="absolute inset-0 z-10 overflow-hidden pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg,#0088DA 0%,#1a3a7a 50%,#0088DA 100%)",
            }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: "3px solid rgba(255,255,255,0.15)",
                    borderTop: "3px solid #ffffff",
                    animation: "spin 0.9s linear infinite",
                  }}
                />
                <span
                  style={{
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                >
                  Preparing design
                  <LoadingDots />
                </span>
                <SlowLoadingHint
                  delay={3500}
                  message="आपका शानदार डिज़ाइन अभी लोड हो रहा है — बड़े टेम्प्लेट या धीमे कनेक्शन में कुछ अतिरिक्त सेकंड लग सकते हैं। कृपया थोड़ा इंतज़ार करें, बस होने ही वाला है।"
                />
              </div>
            </div>
          </div>
        )}
        <div
          style={{
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            transform: `scale(${stageScale})`,
            transformOrigin: "top left",
          }}
        >
          <Stage
            // ref={stageRef}
            // width={STAGE_WIDTH}
            // height={STAGE_HEIGHT}
            ref={stageRef}
            width={stageSize}
            height={stageSize}
            className="bg-background border border-border shadow-lg"
            onMouseDown={handleStageMouseDown}
            onTouchStart={handleStageMouseDown}
          >
            <Layer>
              <Image
                image={bgImage}
                x={0}
                y={0}
                width={STAGE_WIDTH}
                height={STAGE_HEIGHT}
              />

              {isThankyouRank ? (
                <Image
                  image={tankyoubadge}
                  x={190}
                  y={38}
                  width={100}
                  height={40}
                />
              ) : null}
              {isClosing ? (
                <Image
                  image={spdone}
                  x={isRight ? 15 : 162.5}
                  y={165}
                  width={135}
                  height={33}
                />
              ) : null}
              {isRank ? (
                <Image
                  image={rankbadge}
                  x={isRank_B ? (isRight ? 10 : 156) : isRight ? 12 : 145}
                  y={isRank_B ? 148 : 134}
                  width={150}
                  height={60}
                />
              ) : null}

              {selectedVideoUrl ? (
                <VideoCanvas
                  src={selectedVideoUrl}
                  playing={videoPlaying}
                  width={STAGE_WIDTH}
                  height={STAGE_HEIGHT}
                  onError={() => showToast("Video failed to load.", "error")}
                  videoElRef={videoElRef}
                />
              ) : null}
              {/* {isMlmToday ? null : ( */}
              <Image
                image={Imagel2}
                x={1}
                y={2}
                width={woflogo1}
                height={hoflogo1}
              />
              {/* )} */}
              {/* {isMlmToday ? null : ( */}
              <Image
                image={Imagel3}
                x={logo2size === "square" ? 292 : 268}
                y={2}
                width={woflogo2}
                height={hoflogo2}
              />
              {/* )} */}

              {(() => {
                const allSlots = [
                  { img: Imagetop1, url: topuplineURLs?.[0] },
                  { img: Imagetop2, url: topuplineURLs?.[1] },
                  { img: Imagetop3, url: topuplineURLs?.[2] },
                  { img: Imagetop4, url: topuplineURLs?.[3] },
                  { img: Imagetop5, url: topuplineURLs?.[4] },
                  { img: Imagetop6, url: topuplineURLs?.[5] },
                  { img: Imagetop7, url: topuplineURLs?.[6] },
                  { img: Imagetop8, url: topuplineURLs?.[7] },
                  { img: Imagetop9, url: topuplineURLs?.[8] },
                  { img: Imagetop10, url: topuplineURLs?.[9] },
                  { img: Imagetop11, url: topuplineURLs?.[10] },
                  { img: Imagetop12, url: topuplineURLs?.[11] },
                  { img: Imagetop13, url: topuplineURLs?.[12] },
                  { img: Imagetop14, url: topuplineURLs?.[13] },
                  { img: Imagetop15, url: topuplineURLs?.[14] },
                ];

                if (isGurupornima) {
                  const guruSlots = allSlots
                    .filter((slot) => slot.url)
                    .slice(0, 15);
                  const lengthSlot = guruSlots.length;

                  // 1–8 images: 4 + 4
                  // 9–15 images: 5 + 5 + 5
                  const guruRows =
                    lengthSlot <= 8
                      ? [guruSlots.slice(0, 4), guruSlots.slice(4, 8)].filter(
                          (row) => row.length,
                        )
                      : [
                          guruSlots.slice(0, 5),
                          guruSlots.slice(5, 10),
                          guruSlots.slice(10, 15),
                        ].filter((row) => row.length);

                  const GURU_SLOT_SIZE = lengthSlot <= 8 ? 62 : 52;
                  const GURU_SLOT_PADDING = 3;
                  const GURU_INNER_SIZE =
                    GURU_SLOT_SIZE - GURU_SLOT_PADDING * 2;
                  const GURU_COLUMN_GAP = 6;
                  const GURU_ROW_GAP = 4;
                  const GURU_START_Y = 40;

                  // Keep positions stable while the individual images load.

                  return guruRows.flatMap((row, rowIndex) => {
                    const rowWidth =
                      row.length * GURU_SLOT_SIZE +
                      Math.max(0, row.length - 1) * GURU_COLUMN_GAP;
                    const rowStartX = (STAGE_WIDTH - rowWidth) / 2;
                    const y =
                      GURU_START_Y + rowIndex * (GURU_SLOT_SIZE + GURU_ROW_GAP);

                    return row.map((slot, columnIndex) => {
                      const x =
                        rowStartX +
                        columnIndex * (GURU_SLOT_SIZE + GURU_COLUMN_GAP);

                      return (
                        <React.Fragment
                          key={`guru-top-upline-${rowIndex}-${columnIndex}`}
                        >
                          <Image
                            image={ImagetopFrame}
                            x={x}
                            y={y}
                            width={GURU_SLOT_SIZE}
                            height={GURU_SLOT_SIZE}
                          />
                          {slot.img ? (
                            <Group
                              x={x}
                              y={y}
                              clipFunc={(ctx) => {
                                ctx.arc(
                                  GURU_SLOT_SIZE / 2,
                                  GURU_SLOT_SIZE / 2,
                                  GURU_INNER_SIZE / 2,
                                  0,
                                  Math.PI * 2,
                                  false,
                                );
                                ctx.closePath();
                              }}
                            >
                              <Image
                                image={slot.img}
                                x={GURU_SLOT_PADDING}
                                y={GURU_SLOT_PADDING}
                                width={GURU_INNER_SIZE}
                                height={GURU_INNER_SIZE}
                                crop={getPortraitFriendlySquareCrop(slot.img)}
                                onTap={() => setIsOpen(true)}
                                onClick={() => setIsOpen(true)}
                              />
                            </Group>
                          ) : null}
                        </React.Fragment>
                      );
                    });
                  });
                }

                const slots = allSlots.filter((slot) => slot.img);
                const HowMuchTopupline = topuplineURLs.length;
                const SLOT_SIZE =
                  HowMuchTopupline <= 8
                    ? 25
                    : HowMuchTopupline <= 12
                      ? 19
                      : HowMuchTopupline >= 12
                        ? 15
                        : 15;
                const SLOT_PADDING = 2;
                const INNER_SIZE = SLOT_SIZE - SLOT_PADDING * 2;
                const totalWidth = slots.length * SLOT_SIZE;
                const extraOffset = slots.length === 7 ? -10 : 0;
                const startX = (STAGE_WIDTH - totalWidth) / 2 + extraOffset;
                return slots.map((slot, i) => {
                  const x = startX + i * SLOT_SIZE;
                  return (
                    <React.Fragment key={i}>
                      <Image
                        image={ImagetopFrame}
                        x={x}
                        y={2}
                        width={SLOT_SIZE}
                        height={SLOT_SIZE}
                      />
                      <Group
                        x={x}
                        y={2}
                        clipFunc={(ctx) => {
                          ctx.arc(
                            SLOT_SIZE / 2,
                            SLOT_SIZE / 2,
                            INNER_SIZE / 2,
                            0,
                            Math.PI * 2,
                            false,
                          );
                          ctx.closePath();
                        }}
                      >
                        <Image
                          image={slot.img}
                          x={SLOT_PADDING}
                          y={SLOT_PADDING}
                          width={INNER_SIZE}
                          height={INNER_SIZE}
                          onTap={() => setIsOpen(true)}
                          onClick={() => setIsOpen(true)}
                        />
                      </Group>
                    </React.Fragment>
                  );
                });
              })()}

              {isMeeting ||
              isSubGeneralType ||
              isMlmToday ||
              isSubGeneralType2 ? null : (
                <Text
                  fontFamily="Roboto"
                  x={
                    isCapping
                      ? isRight
                        ? 24
                        : 162
                      : isIncome
                        ? isRight
                          ? 25
                          : 125
                        : isAnyversary
                          ? isRight
                            ? 7
                            : 138
                          : isAchievement
                            ? 83
                            : isClosing
                              ? isRight
                                ? 6
                                : 151
                              : isWelcome
                                ? isRight
                                  ? 6
                                  : 151
                                : isBonanza
                                  ? isRight
                                    ? 4
                                    : 150
                                  : isRank_B
                                    ? isRight
                                      ? 6
                                      : 148
                                    : isRank
                                      ? isRight
                                        ? 6
                                        : 151
                                      : isRight
                                        ? 35
                                        : 127
                  }
                  y={
                    isCapping
                      ? isRight
                        ? 187
                        : 187
                      : isAnyversary
                        ? isRight
                          ? 155
                          : 155
                        : isAchievement
                          ? 97
                          : isWelcome
                            ? isRight
                              ? 106
                              : 106
                            : isBonanza
                              ? 97
                              : isRank_B
                                ? isRight
                                  ? 111
                                  : 104
                                : 96
                  }
                  width={isCapping ? 130 : isAnyversary ? 175 : 165}
                  height={5}
                  text={`${formname.toUpperCase() || ActualProfilename}`}
                  fontSize={fs(isAnyversary ? 8 : 9.5)}
                  fill="white"
                  fontStyle="1000"
                  letterSpacing={0.1}
                  verticalAlign="middle"
                  align="center"
                />
              )}

              {isMeeting ||
              isSubGeneralType ||
              isMlmToday ||
              isSubGeneralType2 ? null : (
                <Text
                  fontFamily="Roboto"
                  x={
                    isCapping
                      ? isRight
                        ? 70
                        : 205
                      : isIncome
                        ? isRight
                          ? 85
                          : 185
                        : isAnyversary
                          ? isRight
                            ? 75
                            : 205
                          : isAchievement
                            ? 140
                            : isClosing
                              ? isRight
                                ? 65
                                : 215
                              : isWelcome
                                ? isRight
                                  ? 65
                                  : 215
                                : isBonanza
                                  ? isRight
                                    ? 54
                                    : 212
                                  : isRank_B
                                    ? isRight
                                      ? 35
                                      : 180
                                    : isRank
                                      ? isRight
                                        ? 65
                                        : 215
                                      : isRight
                                        ? 98
                                        : 188
                  }
                  y={
                    isCapping
                      ? isRight
                        ? 198
                        : 198
                      : isAnyversary
                        ? 176
                        : isAchievement
                          ? 113
                          : isWelcome
                            ? isRight
                              ? 124
                              : 126
                            : isBonanza
                              ? isRight
                                ? 112
                                : 112
                              : isRank_B
                                ? isRight
                                  ? 120
                                  : 115
                                : 112
                  }
                  width={100}
                  height={5}
                  text={"FROM/" + `${formcity.toUpperCase() || ""}`}
                  fontSize={fs(7)}
                  fill="white"
                  fontStyle="bold"
                  letterSpacing={0.1}
                  verticalAlign="middle"
                  align="center"
                />
              )}

              {isWelcome ? (
                <Image
                  image={Imagel2}
                  x={isRight ? 70 : 180}
                  y={178}
                  width={60}
                  height={60}
                />
              ) : null}

              {isSubGeneralType ? (
                <Image
                  ref={profileImageRef}
                  image={ImageProfile}
                  x={isRight ? 165 : 0.5}
                  y={56}
                  width={155}
                  height={230}
                  scaleX={profileAttrs.scaleX}
                  offsetX={profileAttrs.offsetX}
                  scaleY={profileAttrs.scaleY}
                  offsetY={profileAttrs.offsetY}
                  // draggable
                  onClick={handleImageClick("profile")}
                  onTap={handleImageClick("profile")}
                  // onDragMove={makeDragMove("profile")}
                  // onDragEnd={handleDragEnd("profile")}
                  // onTouchMove={makePinchMove("profile")}
                  // onTouchEnd={handlePinchEnd}
                  // onTouchCancel={handleTouchCancel}
                  // onTransformEnd={handleTransformEnd("profile")}
                />
              ) : isSubGeneralType2 || isAchievement ? null : (
                // <Image
                //   ref={rankImageRef}
                //   image={isMeeting ? ImageChief : ImageRank}
                //   x={rankAttrs.x}
                //   y={rankAttrs.y}
                //   width={rankAttrs.width}
                //   height={rankAttrs.height}
                //   scaleX={rankAttrs.scaleX}
                //   offsetX={rankAttrs.offsetX}
                //   scaleY={rankAttrs.scaleY}
                //   offsetY={rankAttrs.offsetY}
                //   draggable
                //   onClick={handleImageClick("rank")}
                //   onTap={handleImageClick("rank")}
                //   onDragMove={makeDragMove("rank")}
                //   onDragEnd={handleDragEnd("rank")}
                //   onTouchMove={makePinchMove("rank")}
                //   onTouchEnd={handlePinchEnd}
                //   onTouchCancel={handleTouchCancel}
                //   onTransformEnd={handleTransformEnd("rank")}
                // />
                <Image
                  ref={rankImageRef}
                  image={isMeeting ? ImageChief : ImageRank}
                  x={rankAttrs.x}
                  y={rankAttrs.y}
                  width={rankAttrs.width}
                  height={rankAttrs.height}
                  scaleX={rankAttrs.scaleX}
                  offsetX={rankAttrs.offsetX}
                  scaleY={rankAttrs.scaleY}
                  offsetY={rankAttrs.offsetY}
                  filters={
                    isWelcomeClosing ? [FadeBottomFilter] : [FadeEdgesFilter]
                  }
                  // draggable
                  onClick={handleImageClick("rank")}
                  onTap={handleImageClick("rank")}
                  // onDragMove={makeDragMove("rank")}
                  // onDragEnd={handleDragEnd("rank")}
                  // onTouchMove={makePinchMove("rank")}
                  // onTouchEnd={handlePinchEnd}
                  // onTouchCancel={handleTouchCancel}
                  // onTransformEnd={handleTransformEnd("rank")}
                />
              )}

              {isMeeting || isSubGeneralType || isSubGeneralType2 ? null : (
                <Image
                  ref={stickerImageRef}
                  image={Sticker}
                  x={stickerAttrs.x}
                  y={stickerAttrs.y}
                  width={stickerAttrs.width}
                  height={stickerAttrs.height}
                  scaleX={stickerAttrs.scaleX}
                  offsetX={stickerAttrs.offsetX}
                  scaleY={stickerAttrs.scaleY}
                  offsetY={stickerAttrs.offsetY}
                  // draggable
                  // onClick={handleImageClick("sticker")}
                  // onTap={handleImageClick("sticker")}
                  // onDragMove={makeDragMove("sticker")}
                  // onDragEnd={handleDragEnd("sticker")}
                  // onTouchMove={makePinchMove("sticker")}
                  // onTouchEnd={handlePinchEnd}
                  // onTouchCancel={handleTouchCancel}
                  // onTransformEnd={handleTransformEnd("sticker")}
                />
              )}

              {isBonanza ? (
                <Image
                  x={isRight ? 100 : 170}
                  y={isRight ? 210 : 200}
                  width={70}
                  height={70}
                  image={imgBonanza}
                />
              ) : null}
              {isBonanza ? (
                <Image
                  x={isRight ? 135 : 235}
                  y={isRight ? 230 : 220}
                  width={30}
                  height={30}
                  image={imgBonanzafamily}
                />
              ) : null}

              {isTraining ? (
                <Image
                  x={isRight ? 10 : 155}
                  y={isRight ? 115 : 115}
                  width={150}
                  height={100}
                  image={imgTraining}
                />
              ) : null}

              {isMeeting ? (
                <Image
                  x={isRight ? 10 : 155}
                  y={isRight ? 62 : 62}
                  width={150}
                  height={90}
                  image={imgTraining}
                />
              ) : null}

              {isTraining ? (
                <Text
                  fontFamily="Roboto"
                  x={isRight ? 178 : 8}
                  y={231}
                  width={150}
                  height={30}
                  text={String(trainingDate?.toUpperCase() || "")}
                  fontSize={fs(12)}
                  fill="white"
                  fontStyle="1000"
                  letterSpacing={0}
                  verticalAlign="center"
                  align="center"
                />
              ) : null}

              {isAchievement ? (
                <Text
                  fontFamily="Roboto"
                  x={110}
                  y={232}
                  width={130}
                  height={30}
                  text={String(AchiveName.toUpperCase() || "")}
                  fontSize={fs(18)}
                  fill="gold"
                  fontStyle="1000"
                  letterSpacing={0}
                  verticalAlign="center"
                  align="center"
                />
              ) : null}

              {isIncome ? (
                <Text
                  fontFamily="Roboto"
                  x={isRight ? 60 : 165}
                  y={isRight ? 195 : 197}
                  width={130}
                  height={30}
                  text={`${incomeDay} ${incomeType.toUpperCase()}`}
                  fontSize={fs(18)}
                  fill="white"
                  fontStyle="1000"
                  letterSpacing={0}
                  verticalAlign="center"
                  align="center"
                />
              ) : null}

              {isSubGeneralType ||
              isSubGeneralType2 ||
              Template_Type === "Anniversary_Birthday" ||
              Template_Type === "Bonanza" ||
              Template_Type === "Capping" ||
              isWelcome ||
              isMeeting ||
              isTraining ? null : (
                <GoldenAmountImages
                  amountText={amountText}
                  digitImageMap={digitImageMap}
                  // startX={(() => {
                  //   const SPACING = 1.5;
                  //   const dh = isIncome ? 26 : isClosing ? 30 : 32;
                  //   if (isIncome)  return isRight ? 20  : 135;
                  //   if (isClosing) return isRight ? 49  : 145;
                  //   if (!isRight)  return 0;

                  //   const maxW = computeAmountWidth("₹XX,XX,XXX", dh, SPACING);
                  //   const curW = computeAmountWidth(amountText, dh, SPACING);
                  //   return Math.max(0, 125 + (maxW - curW));
                  // })()}
                  startX={
                    isIncome
                      ? isRight
                        ? 20
                        : 135
                      : isClosing
                        ? isRight
                          ? 45
                          : 195
                        : isRight
                          ? charslen?.length === 10
                            ? 134
                            : charslen?.length === 9
                              ? 145
                              : charslen?.length === 8
                                ? 155
                                : charslen?.length === 7
                                  ? 165
                                  : charslen?.length === 6
                                    ? 170
                                    : 195
                          : isRank_B
                            ? charslen?.length === 6
                              ? 30
                              : charslen?.length === 7
                                ? 30
                                : charslen?.length === 9
                                  ? 15
                                  : charslen?.length === 10
                                    ? 7
                                    : 30
                            : 1.5
                  }
                  y={isIncome ? 132 : isClosing ? 132 : isRank_B ? 252 : 250}
                  digitHeight={
                    isIncome ? 26 : isClosing ? 28 : isRank_B ? 25 : 32
                  }
                  spacing={isRank_B ? 4 : 1.5}
                />
              )}

              {isIncome ? (
                <Group x={isRight ? 100 : 170} y={107}>
                  <Image
                    x={10}
                    y={120}
                    width={50}
                    height={50}
                    image={MainIncomeProof}
                  />
                  <Image
                    x={5}
                    y={115}
                    width={60}
                    height={60}
                    image={AchiveFrame}
                  />
                </Group>
              ) : null}

              {isAchievement ? (
                <Image
                  rotationDeg={-10}
                  x={10}
                  y={120}
                  width={40}
                  height={40}
                  image={Imagef1}
                />
              ) : null}
              {isAchievement ? (
                <Image
                  rotationDeg={10}
                  x={265}
                  y={115}
                  width={40}
                  height={40}
                  image={Imagef2}
                />
              ) : null}
              {isAchievement ? (
                <Image
                  rotationDeg={10}
                  x={265}
                  y={175}
                  width={40}
                  height={40}
                  image={Imagef3}
                />
              ) : null}
              {isAchievement ? (
                <Group x={76} y={120} width={200} height={100}>
                  <Image width={165} height={90} image={MainAchieveImage} />
                  <Image
                    width={182}
                    x={-2}
                    y={-2}
                    height={110}
                    image={AchiveFrame}
                  />
                </Group>
              ) : null}

              {isMeeting ? (
                <>
                  <Text
                    fontFamily="Roboto"
                    x={isRight ? -13 : 135}
                    y={175}
                    width={200}
                    height={30}
                    text={meetingData?.chiefName.toUpperCase()}
                    fontSize={fs(13)}
                    fontStyle="1000"
                    fill="white"
                    letterSpacing={0}
                    verticalAlign="center"
                    align="center"
                  />
                  <Text
                    fontFamily="Roboto"
                    x={isRight ? -13 : 135}
                    y={190}
                    width={200}
                    height={30}
                    text={meetingData?.chiefDesignation.toUpperCase()}
                    fontSize={fs(9)}
                    fontStyle="500"
                    fill="white"
                    letterSpacing={0}
                    verticalAlign="center"
                    align="center"
                  />
                </>
              ) : null}

              {isMeeting ? (
                isRight ? (
                  <Group x={50} y={210}>
                    <Text
                      fontFamily="Roboto"
                      x={0}
                      y={1}
                      text={meetingData?.date}
                      fontSize={fs(13)}
                      fontStyle="1000"
                      fill="white"
                      letterSpacing={0}
                      verticalAlign="start"
                      align="start"
                    />
                    <Text
                      fontFamily="Roboto"
                      x={0}
                      y={21}
                      text={meetingData?.time}
                      fontSize={fs(13)}
                      fontStyle="1000"
                      fill="white"
                      letterSpacing={0}
                      verticalAlign="start"
                      align="start"
                    />
                  </Group>
                ) : (
                  <Group x={190} y={210}>
                    <Text
                      fontFamily="Roboto"
                      x={0}
                      y={3}
                      text={meetingData?.date}
                      fontSize={fs(13)}
                      fontStyle="1000"
                      fill="white"
                      letterSpacing={0}
                      verticalAlign="end"
                      align="end"
                    />
                    <Text
                      fontFamily="Roboto"
                      x={0}
                      y={21}
                      text={meetingData?.time}
                      fontSize={fs(13)}
                      fontStyle="1000"
                      fill="white"
                      letterSpacing={0}
                      verticalAlign="end"
                      align="end"
                    />
                  </Group>
                )
              ) : null}

              {meetingData?.hostMode === "add" && isMeeting ? (
                <Group X={isRight ? 5 : 100} Y={0.9}>
                  <Text
                    fontFamily="Roboto"
                    x={20}
                    y={285.5}
                    width={180}
                    height={30}
                    text={meetingData?.hostName.toUpperCase()}
                    fontSize={fs(7)}
                    fontStyle="1000"
                    fill="white"
                    letterSpacing={0}
                    verticalAlign="center"
                    align="center"
                  />
                  <Text
                    fontFamily="Roboto"
                    x={20}
                    y={295}
                    width={180}
                    height={30}
                    text={ActualDesignation}
                    fontSize={fs(6)}
                    fontStyle="1000"
                    fill="white"
                    letterSpacing={0}
                    verticalAlign="center"
                    align="center"
                  />
                  {showMobile === "yes" ? (
                    <Text
                      fontFamily="Roboto"
                      x={20}
                      y={303}
                      width={180}
                      height={30}
                      text={`+91${profileMobile}` || "+91XXXXXXXXXX"}
                      fontSize={fs(6)}
                      fontStyle="1000"
                      fill="white"
                      letterSpacing={0}
                      verticalAlign="center"
                      align="center"
                    />
                  ) : null}
                </Group>
              ) : null}

              {isMeeting ||
              isSubGeneralType ||
              !showImageFooter ? null : isRight ? (
                <Image
                  scaleX={-1}
                  scaleY={1}
                  image={Imagefooter}
                  x={320}
                  y={280}
                  width={350}
                  height={41}
                  onClick={() => setIsOpenFtr(true)}
                  onTap={() => setIsOpenFtr(true)}
                />
              ) : (
                <Image
                  image={Imagefooter}
                  x={0}
                  y={280}
                  width={350}
                  height={41}
                  onClick={() => setIsOpenFtr(true)}
                  onTap={() => setIsOpenFtr(true)}
                />
              )}

              {isSubGeneralType && showImageFooter ? (
                isRight ? (
                  <Image
                    image={Imagefooter}
                    x={0}
                    y={280}
                    width={350}
                    height={41}
                    onClick={() => setIsOpenFtr(true)}
                    onTap={() => setIsOpenFtr(true)}
                  />
                ) : (
                  <Image
                    scaleX={-1}
                    scaleY={1}
                    image={Imagefooter}
                    x={320}
                    y={280}
                    width={350}
                    height={41}
                    onClick={() => setIsOpenFtr(true)}
                    onTap={() => setIsOpenFtr(true)}
                  />
                )
              ) : null}
              {isSubGeneralType || meetingData?.hostMode === "none"
                ? null
                : (() => {
                    const fW = isMeeting ? 60 : 95;
                    const fH = isMeeting ? 70 : 110;
                    const fY = isMeeting ? 250 : 210;
                    const baseX = isRight
                      ? isMeeting
                        ? 60
                        : 96
                      : isMeeting
                        ? 260
                        : 224;
                    const baseScaleX = isRight ? -1 : 1;
                    const leftEdge = baseScaleX === -1 ? baseX - fW : baseX;
                    const curScaleX = footerImgFlip ? -baseScaleX : baseScaleX;
                    const curOffsetX = curScaleX === -1 ? fW : 0;
                    return (
                      <Image
                        image={ImageProfile}
                        x={leftEdge}
                        y={fY}
                        scaleX={curScaleX}
                        offsetX={curOffsetX}
                        width={fW}
                        height={fH}
                        onClick={() => setFooterImgFlip((f) => !f)}
                        onTap={() => setFooterImgFlip((f) => !f)}
                      />
                    );
                  })()}
              {isMeeting ? (
                isRight ? (
                  <Text
                    fontFamily="Roboto"
                    x={12}
                    y={40}
                    width={180}
                    height={30}
                    text={meetingData?.teamName.toUpperCase()}
                    fontSize={fs(9)}
                    fontStyle="1000"
                    fill="white"
                    letterSpacing={0}
                    verticalAlign="center"
                    align="center"
                  />
                ) : (
                  <Text
                    fontFamily="Roboto"
                    x={125}
                    y={40}
                    width={180}
                    height={30}
                    text={meetingData?.teamName.toUpperCase()}
                    fontSize={fs(9)}
                    fontStyle="1000"
                    fill="white"
                    letterSpacing={0}
                    verticalAlign="center"
                    align="center"
                  />
                )
              ) : null}

              {isMeeting ? (
                meetingData?.meetingMode === "online" ? (
                  meetingData?.platformType === "instagram" ||
                  meetingData?.platformType === "youtube" ||
                  meetingData?.platformType === "facebook" ? (
                    <Group
                      x={
                        meetingData?.hostMode === "add"
                          ? isRight
                            ? 180
                            : 0
                          : isRight
                            ? 135
                            : 0
                      }
                      y={285}
                    >
                      <Image
                        image={
                          meetingData?.platformType === "instagram"
                            ? insta
                            : meetingData?.platformType === "youtube"
                              ? yt
                              : meetingData?.platformType === "facebook"
                                ? fb
                                : null
                        }
                        x={isRight ? 0 : 10}
                        y={0}
                        width={25}
                        height={25}
                      />
                      <Text
                        fontFamily="Roboto"
                        x={isRight ? 35 : 45}
                        y={8}
                        text={meetingData?.platformInput}
                        fontSize={fs(12)}
                        fontStyle="1000"
                        fill="white"
                        letterSpacing={0}
                        verticalAlign="start"
                        align="start"
                      />
                    </Group>
                  ) : (
                    <Group x={isRight ? 175 : 0} y={285}>
                      <Image
                        image={
                          meetingData?.platformType === "zoom"
                            ? zooml
                            : meetingData?.platformType === "meet"
                              ? meetl
                              : null
                        }
                        x={isRight ? 0 : 10}
                        y={0}
                        width={25}
                        height={25}
                      />
                      <Text
                        fontFamily="Roboto"
                        x={isRight ? 35 : 45}
                        y={4}
                        text={meetingData?.meetingId}
                        fontSize={fs(9)}
                        fontStyle="1000"
                        fill="white"
                        letterSpacing={0}
                        verticalAlign="start"
                        align="start"
                      />
                      <Text
                        fontFamily="Roboto"
                        x={isRight ? 35 : 45}
                        y={15}
                        text={meetingData?.meetingPassword}
                        fontSize={fs(9)}
                        fontStyle="1000"
                        fill="white"
                        letterSpacing={0}
                        verticalAlign="start"
                        align="start"
                      />
                    </Group>
                  )
                ) : (
                  <Group x={isRight ? 140 : 15} y={285}>
                    <Image image={locl} x={0} y={0} width={25} height={25} />
                    <Text
                      fontFamily="Roboto"
                      x={30}
                      y={5}
                      text={meetingData?.address1}
                      fontSize={fs(10)}
                      fontStyle="1000"
                      fontVariant="italic"
                      fill="white"
                      letterSpacing={0}
                      verticalAlign="center"
                      align="center"
                    />
                    <Text
                      fontFamily="Roboto"
                      x={30}
                      y={15}
                      text={meetingData?.address2}
                      fontSize={fs(7.5)}
                      fontStyle="1000"
                      fontVariant="italic"
                      fill="white"
                      letterSpacing={0}
                      verticalAlign="end"
                      align="end"
                    />
                  </Group>
                )
              ) : null}

              {isMeeting &&
              meetingData?.hostMode === "none" &&
              showMobile === "yes" ? (
                <Group x={isRight ? 0 : 240} y={298}>
                  <Text
                    fontFamily="Roboto"
                    x={3}
                    y={0}
                    text={"For More Details Contact On :-"}
                    fontSize={fs(5.5)}
                    fontStyle="1000"
                    fontVariant="italic"
                    fill="white"
                    letterSpacing={0}
                    verticalAlign="center"
                    align="center"
                  />
                  <Text
                    fontFamily="Roboto"
                    x={12}
                    y={6}
                    text={`+91${profileMobile}` || "+91XXXXXXXXXX"}
                    fontSize={fs(7.5)}
                    fontStyle="1000"
                    fill="white"
                    letterSpacing={0}
                    verticalAlign="end"
                    align="end"
                  />
                </Group>
              ) : null}
              {/* original Footer  */}
              {isMeeting || isSubGeneralType ? null : isRight ? (
                <>
                  {showMobile === "yes" && (
                    <>
                      <Text
                        fontFamily="Roboto"
                        x={isSubGeneralType2 ? 240 : isRank_B ? 233 : 252}
                        y={isRank_B ? 294 : 298}
                        width={150}
                        height={5}
                        text="CALL FOR ASSOCIATION"
                        fontSize={fs(4.5)}
                        fill="white"
                        fontStyle="bold"
                        verticalAlign="middle"
                        onClick={() => setIsOpenFtr(true)}
                        onTap={() => setIsOpenFtr(true)}
                      />
                      <Text
                        fontFamily="Roboto"
                        x={isSubGeneralType2 ? 235 : isRank_B ? 230 : 250}
                        y={isRank_B ? 294 : 297}
                        width={150}
                        height={20}
                        text={`+91${profileMobile}` || "+91XXXXXXXXXX"}
                        fontSize={fs(7.5)}
                        fill="white"
                        fontStyle="bold"
                        verticalAlign="middle"
                        onClick={() => setIsOpenFtr(true)}
                        onTap={() => setIsOpenFtr(true)}
                      />
                    </>
                  )}

                  {(() => {
                    let iconX = 0;
                    const iconPositions = {};
                    if (SocialURLs.Youtube) {
                      iconPositions.youtube = iconX;
                      iconX += 7;
                    }
                    if (SocialURLs.Instagram) {
                      iconPositions.instagram = iconX;
                      iconX += 7;
                    }
                    if (SocialURLs.Facebook) {
                      iconPositions.facebook = iconX;
                      iconX += 7;
                    }
                    if (SocialURLs.X) {
                      iconPositions.x = iconX;
                      iconX += 7;
                    }
                    const textStartX = iconX + 3;
                    const socialGroupWidth = socialText
                      ? textStartX + socialText.length * 3.5
                      : 0;
                    const parentCenterX = isSubGeneralType
                      ? 140 - 300 / 2
                      : 185 - 300 / 2;
                    return (
                      <Group
                        x={parentCenterX}
                        y={
                          isSubGeneralType || isSubGeneralType2
                            ? 295
                            : isRank_B
                              ? 295
                              : 300
                        }
                      >
                        <Text
                          fontFamily="Roboto"
                          x={23}
                          y={0}
                          width={200}
                          height={2}
                          text={ActualProfilename}
                          // main Actual
                          fontSize={fs(profileNameFontSize)}
                          fill="white"
                          fontStyle="1000"
                          align="center"
                          verticalAlign="middle"
                          onClick={() => setIsOpenFtr(true)}
                          onTap={() => setIsOpenFtr(true)}
                        />
                        <Text
                          fontFamily="Roboto"
                          x={25}
                          y={10.5}
                          width={200}
                          height={2}
                          text={ActualDesignation}
                          fontSize={fs(6.5)}
                          fill="white"
                          fontStyle="bold"
                          align="center"
                          verticalAlign="middle"
                          onClick={() => setIsOpenFtr(true)}
                          onTap={() => setIsOpenFtr(true)}
                        />
                      </Group>
                    );
                  })()}
                </>
              ) : (
                <>
                  {showMobile === "yes" && (
                    <>
                      <Text
                        fontFamily="Roboto"
                        x={35}
                        y={isRank_B ? 295 : 298}
                        width={150}
                        height={5}
                        text="CALL FOR ASSOCIATION" //ORIGINAL CALL
                        fontSize={fs(4.5)}
                        fill="white"
                        fontStyle="bold"
                        verticalAlign="middle"
                        onClick={() => setIsOpenFtr(true)}
                        onTap={() => setIsOpenFtr(true)}
                      />
                      <Text
                        fontFamily="Roboto"
                        x={33}
                        y={isRank_B ? 295 : 297}
                        width={150}
                        height={20}
                        text={`+91${profileMobile}` || "+91XXXXXXXXXX"}
                        fontSize={fs(7.5)}
                        fill="white"
                        fontStyle="bold"
                        verticalAlign="middle"
                        onClick={() => setIsOpenFtr(true)}
                        onTap={() => setIsOpenFtr(true)}
                      />
                    </>
                  )}
                  {(() => {
                    let iconX = 0;
                    const iconPositions = {};
                    if (SocialURLs.Youtube) {
                      iconPositions.youtube = iconX;
                      iconX += 10;
                    }
                    if (SocialURLs.Instagram) {
                      iconPositions.instagram = iconX;
                      iconX += 10;
                    }
                    if (SocialURLs.Facebook) {
                      iconPositions.facebook = iconX;
                      iconX += 10;
                    }
                    if (SocialURLs.X) {
                      iconPositions.x = iconX;
                      iconX += 10;
                    }
                    const textStartX = iconX + 2;
                    const socialGroupWidth = socialText
                      ? textStartX + socialText.length * 3.5
                      : 0;
                    const parentCenterX = isSubGeneralType
                      ? 285 - 300 / 2
                      : 196 - 300 / 2;
                    return (
                      <Group
                        x={parentCenterX}
                        y={
                          isSubGeneralType || isSubGeneralType2
                            ? 295
                            : isRank_B
                              ? 296
                              : 299
                        }
                      >
                        <Text
                          fontFamily="Roboto"
                          x={15}
                          y={0}
                          width={200}
                          height={2}
                          text={ActualProfilename}
                          fontSize={fs(profileNameFontSize)}
                          fill="white"
                          fontStyle="1000"
                          align="center"
                          verticalAlign="middle"
                          onClick={() => setIsOpenFtr(true)}
                          onTap={() => setIsOpenFtr(true)}
                        />
                        <Text
                          fontFamily="Roboto"
                          x={15}
                          y={showSocial === "no" ? 10.5 : 9.5}
                          width={200}
                          height={2}
                          text={ActualDesignation}
                          fontSize={fs(6.5)}
                          fill="white"
                          fontStyle="bold"
                          align="center"
                          verticalAlign="middle"
                          onClick={() => setIsOpenFtr(true)}
                          onTap={() => setIsOpenFtr(true)}
                        />
                        {showSocial === "never"
                          ? socialText && (
                              <Group x={(200 - socialGroupWidth) / 2} y={12}>
                                {SocialURLs.Youtube && (
                                  <Image
                                    image={yt}
                                    x={iconPositions.youtube}
                                    y={0}
                                    width={9}
                                    height={9}
                                  />
                                )}
                                {SocialURLs.Instagram && (
                                  <Image
                                    image={insta}
                                    x={iconPositions.instagram}
                                    y={0}
                                    width={9}
                                    height={9}
                                  />
                                )}
                                {SocialURLs.Facebook && (
                                  <Image
                                    image={fb}
                                    x={iconPositions.facebook}
                                    y={0}
                                    width={9}
                                    height={9}
                                  />
                                )}
                                {SocialURLs.X && (
                                  <Image
                                    image={xlogo}
                                    x={iconPositions.x}
                                    y={0}
                                    width={9}
                                    height={9}
                                  />
                                )}
                                <Text
                                  fontFamily="Roboto"
                                  x={textStartX}
                                  y={0}
                                  width={100 - textStartX}
                                  height={9}
                                  text={socialText}
                                  fontSize={fs(6)}
                                  fill="white"
                                  fontStyle="bold"
                                  align="left"
                                  verticalAlign="middle"
                                  onClick={() => setIsOpenFtr(true)}
                                  onTap={() => setIsOpenFtr(true)}
                                />
                              </Group>
                            )
                          : null}
                      </Group>
                    );
                  })()}
                </>
              )}

              {isSubGeneralType ? (
                isRight ? (
                  <>
                    {showMobile === "yes" && (
                      <>
                        <Text
                          fontFamily="Roboto"
                          x={35}
                          y={298}
                          width={150}
                          height={5}
                          text="CALL FOR ASSOCIATION"
                          fontSize={fs(4.5)}
                          fill="white"
                          fontStyle="bold"
                          verticalAlign="middle"
                          onClick={() => setIsOpenFtr(true)}
                          onTap={() => setIsOpenFtr(true)}
                        />
                        <Text
                          fontFamily="Roboto"
                          x={30}
                          y={297}
                          width={150}
                          height={20}
                          text={`+91${profileMobile}` || "+91XXXXXXXXXX"}
                          fontSize={fs(7.5)}
                          fill="white"
                          fontStyle="bold"
                          verticalAlign="middle"
                          onClick={() => setIsOpenFtr(true)}
                          onTap={() => setIsOpenFtr(true)}
                        />
                      </>
                    )}
                    {(() => {
                      let iconX = 0;
                      const iconPositions = {};
                      if (SocialURLs.Youtube) {
                        iconPositions.youtube = iconX;
                        iconX += 7;
                      }
                      if (SocialURLs.Instagram) {
                        iconPositions.instagram = iconX;
                        iconX += 7;
                      }
                      if (SocialURLs.Facebook) {
                        iconPositions.facebook = iconX;
                        iconX += 7;
                      }
                      if (SocialURLs.X) {
                        iconPositions.x = iconX;
                        iconX += 7;
                      }
                      const textStartX = iconX + 3;
                      const socialGroupWidth = socialText
                        ? textStartX + socialText.length * 3.5
                        : 0;
                      return (
                        <Group
                          x={105}
                          y={
                            isSubGeneralType || isSubGeneralType2
                              ? 295
                              : isRank_B
                                ? 290
                                : 300
                          }
                        >
                          <Text
                            fontFamily="Roboto"
                            x={23}
                            y={0}
                            width={200}
                            height={2}
                            text={ActualProfilename}
                            fontSize={fs(profileNameFontSize)}
                            fill="white"
                            fontStyle="1000"
                            align="center"
                            verticalAlign="middle"
                            onClick={() => setIsOpenFtr(true)}
                            onTap={() => setIsOpenFtr(true)}
                          />
                          <Text
                            fontFamily="Roboto"
                            x={25}
                            y={10.5}
                            width={200}
                            height={2}
                            text={ActualDesignation}
                            fontSize={fs(7)}
                            fill="white"
                            fontStyle="bold"
                            align="center"
                            verticalAlign="middle"
                            onClick={() => setIsOpenFtr(true)}
                            onTap={() => setIsOpenFtr(true)}
                          />
                        </Group>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    {showMobile === "yes" && (
                      <>
                        <Text
                          fontFamily="Roboto"
                          x={240}
                          y={isRank_B ? 295 : 298}
                          width={150}
                          height={5}
                          text="CALL FOR ASSOCIATION"
                          fontSize={fs(4.5)}
                          fill="white"
                          fontStyle="bold"
                          verticalAlign="middle"
                          onClick={() => setIsOpenFtr(true)}
                          onTap={() => setIsOpenFtr(true)}
                        />
                        <Text
                          fontFamily="Roboto"
                          x={235}
                          y={isRank_B ? 295 : 297}
                          width={150}
                          height={20}
                          text={`+91${profileMobile}` || "+91XXXXXXXXXX"}
                          fontSize={fs(7.5)}
                          fill="white"
                          fontStyle="bold"
                          verticalAlign="middle"
                          onClick={() => setIsOpenFtr(true)}
                          onTap={() => setIsOpenFtr(true)}
                        />
                      </>
                    )}
                    {(() => {
                      let iconX = 0;
                      const iconPositions = {};
                      if (SocialURLs.Youtube) {
                        iconPositions.youtube = iconX;
                        iconX += 10;
                      }
                      if (SocialURLs.Instagram) {
                        iconPositions.instagram = iconX;
                        iconX += 10;
                      }
                      if (SocialURLs.Facebook) {
                        iconPositions.facebook = iconX;
                        iconX += 10;
                      }
                      if (SocialURLs.X) {
                        iconPositions.x = iconX;
                        iconX += 10;
                      }
                      const textStartX = iconX + 2;
                      const socialGroupWidth = socialText
                        ? textStartX + socialText.length * 3.5
                        : 0;
                      return (
                        <Group
                          x={0}
                          y={
                            isSubGeneralType || isSubGeneralType2
                              ? 295
                              : isRank_B
                                ? 290
                                : 300
                          }
                        >
                          <Text
                            fontFamily="Roboto"
                            x={-10}
                            y={0}
                            width={200}
                            height={2}
                            text={ActualProfilename}
                            fontSize={fs(profileNameFontSize)}
                            fill="white"
                            fontStyle="1000"
                            align="center"
                            verticalAlign="middle"
                            onClick={() => setIsOpenFtr(true)}
                            onTap={() => setIsOpenFtr(true)}
                          />
                          <Text
                            fontFamily="Roboto"
                            x={-10}
                            y={showSocial === "no" ? 10.5 : 9.5}
                            width={200}
                            height={2}
                            text={ActualDesignation}
                            fontSize={fs(7)}
                            fill="white"
                            fontStyle="bold"
                            align="center"
                            verticalAlign="middle"
                            onClick={() => setIsOpenFtr(true)}
                            onTap={() => setIsOpenFtr(true)}
                          />
                          {showSocial === "never"
                            ? socialText && (
                                <Group x={(200 - socialGroupWidth) / 2} y={12}>
                                  {SocialURLs.Youtube && (
                                    <Image
                                      image={yt}
                                      x={iconPositions.youtube}
                                      y={0}
                                      width={9}
                                      height={9}
                                    />
                                  )}
                                  {SocialURLs.Instagram && (
                                    <Image
                                      image={insta}
                                      x={iconPositions.instagram}
                                      y={0}
                                      width={9}
                                      height={9}
                                    />
                                  )}
                                  {SocialURLs.Facebook && (
                                    <Image
                                      image={fb}
                                      x={iconPositions.facebook}
                                      y={0}
                                      width={9}
                                      height={9}
                                    />
                                  )}
                                  {SocialURLs.X && (
                                    <Image
                                      image={xlogo}
                                      x={iconPositions.x}
                                      y={0}
                                      width={9}
                                      height={9}
                                    />
                                  )}
                                  <Text
                                    fontFamily="Roboto"
                                    x={textStartX}
                                    y={0}
                                    width={100 - textStartX}
                                    height={9}
                                    text={socialText}
                                    fontSize={fs(6)}
                                    fill="white"
                                    fontStyle="bold"
                                    align="left"
                                    verticalAlign="middle"
                                    onClick={() => setIsOpenFtr(true)}
                                    onTap={() => setIsOpenFtr(true)}
                                  />
                                </Group>
                              )
                            : null}
                        </Group>
                      );
                    })()}
                  </>
                )
              ) : null}

              {/* Watermark */}
              {/* <Text
                text="Design By : 9229885383"
                x={isRight ? 313 : 2}
                y={100}
                fontSize={5}
                fontStyle="500"
                fontFamily="Arial"
                fill="#fff"
                rotation={-90}
                listening={false}
              /> */}

              <Transformer
                ref={transformerRef}
                keepRatio={false}
                rotateEnabled={false}
                resizeEnabled={false}
                borderEnabled={false}
                boundBoxFunc={boundBoxFunc}
                enabledAnchors={[]}
              />
            </Layer>
          </Stage>
        </div>

        {/* Preview-only logo: outside the Konva Stage so exports stay clean. */}
        {/* {bgStatus === "loaded" && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none select-none"
            aria-hidden="true"
          >
            <img
              src="/mlmboo2l.png"
              alt=""
              draggable="false"
              className="w-9 h-9 object-contain"
              style={{ opacity: 0.18, filter: "grayscale(1)" }}
            />
          </div>
        )} */}

        {selectedVideoUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={() => {
                setVideoPlaying((p) => !p);
              }}
              title={videoPlaying ? "Pause" : "Play"}
              className="pointer-events-auto w-14 h-14 rounded-full bg-black/45 backdrop-blur-sm text-white flex items-center justify-center shadow-lg transition-all active:scale-90 hover:bg-black/60"
            >
              {videoPlaying ? (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {isAmountModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setIsAmountModalOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 20,
              width: "92%",
              maxWidth: 420,
              boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                Amount Graphics
              </div>
              <button
                onClick={() => setIsAmountModalOpen(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 22,
                  cursor: "pointer",
                  color: "#334155",
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {AMOUNT_GRADIENT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setAmountPatternId(option.id);
                    setIsAmountModalOpen(false);
                  }}
                  style={{
                    cursor: "pointer",
                    border:
                      option.id === amountPatternId
                        ? "2px solid #2563eb"
                        : "1px solid #d1d5db",
                    borderRadius: 16,
                    padding: 10,
                    background: "white",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: 70,
                      borderRadius: 14,
                      background: option.preview,
                      overflow: "hidden",
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.16)",
                    }}
                  />
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {option.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex lg:w-1/3 w-full flex-row gap-2 justify-between items-center mt-2 flex-shrink-0 px-1">
        <div
          className="flex flex-row justify-start items-center flex-1 min-w-0 h-[40px] ml-3 overflow-x-auto hide-scrollbar"
          data-guide="editor-photos"
        >
          {mlmProfile?.profileImageURLs?.map((img, index) => (
            <img
              key={index}
              src={img}
              onClick={() => setmiddaleImage(img)}
              className={`w-[35px] h-[35px] object-contain cursor-pointer transition-all flex-shrink-0 ${middaleImage === img ? "border-2 border-accent rounded" : ""}`}
            />
          ))}
        </div>

        <div className="flex flex-row items-center gap-2 mr-3 flex-shrink-0">
          <button
            data-guide="editor-music"
            title={
              selectedMusic
                ? `Music: ${selectedMusic.name}`
                : "Add background music"
            }
            onClick={() => setMusicModalOpen(true)}
            className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all flex-shrink-0 ${selectedMusic ? "bg-green-500 text-white shadow-md" : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            {selectedMusic && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                  <polyline
                    points="1.5,5 4,7.5 8.5,2.5"
                    stroke="#16a34a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
          </button>
          <Button
            data-guide="editor-download"
            size="sm"
            onClick={() => setCaptionModalOpen(true)}
            disabled={!canExport || musicExporting}
            style={{
              opacity: canExport ? 1 : 0.5,
              minWidth: 110,
              position: "relative",
            }}
          >
            {exportLoading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg
                  style={{ animation: "spin 1s linear infinite" }}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Exporting...
              </span>
            ) : subLoading ? (
              "Loading..."
            ) : (
              downloadBtnLabel()
            )}
          </Button>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Music selection modal ──────────────────────────────────────────── */}
      {musicModalOpen && (
        <div
          className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm"
          onClick={() => setMusicModalOpen(false)}
        >
          <div
            className="bg-background dark:bg-[#141824] w-full sm:w-[92vw] sm:max-w-[440px] rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl flex flex-col"
            style={{ maxHeight: "88vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hidden audio player */}
            <audio
              ref={audioPlayerRef}
              onEnded={() => setPlayingAudioId(null)}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2 flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Add Music
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tracks trimmed to 20s for lightweight video
                </p>
              </div>
              <button
                onClick={() => setMusicModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Currently selected banner */}
            {selectedMusic && (
              <div className="mx-5 mb-2 flex items-center justify-between gap-3 p-3 rounded-2xl bg-green-500/10 border border-green-500/30 flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500 text-white flex-shrink-0">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-foreground truncate">
                    {selectedMusic.name}
                  </span>
                </div>
                <button
                  onClick={handleRemoveMusic}
                  className="text-xs font-semibold text-danger hover:underline flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Upload from device */}
            <div className="px-5 pb-2 flex-shrink-0">
              <button
                onClick={() => musicInputRef.current?.click()}
                disabled={deviceLoading}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                  deviceLoading
                    ? "border-accent bg-accent/5 opacity-80 cursor-wait"
                    : "border-border hover:border-accent hover:bg-accent/5"
                }`}
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent flex-shrink-0">
                  {deviceLoading ? (
                    <svg
                      className="animate-spin"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                  )}
                </span>
                <span className="text-left flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    {deviceLoading
                      ? "Uploading audio..."
                      : "Upload from device"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {deviceLoading
                      ? "Reading your track, please wait"
                      : "Pick an audio file from your phone"}
                  </span>
                  {deviceLoading && (
                    <span className="block mt-1.5">
                      <span className="relative block w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
                        <span
                          className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${audioUploadProgress}%`,
                            background:
                              "linear-gradient(90deg,#0088DA,#0088DA)",
                          }}
                        />
                      </span>
                      <span className="text-[10px] text-accent font-bold mt-0.5 block tabular-nums">
                        {audioUploadProgress}%
                      </span>
                    </span>
                  )}
                </span>
              </button>
            </div>

            {/* Search bar */}
            <div className="px-5 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-muted/30 border border-border">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground flex-shrink-0"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={audioSearch}
                  onChange={(e) => handleAudioSearchChange(e.target.value)}
                  placeholder="Search tracks..."
                  maxLength={30}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                {audioSearch && (
                  <button
                    onClick={() => handleAudioSearchChange("")}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Track list header */}
            <div className="px-5 pb-1 flex-shrink-0">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                Choose a track
              </p>
            </div>

            {/* Scrollable track list */}
            <div
              ref={audioListRef}
              onScroll={handleAudioListScroll}
              className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-1.5"
              style={{ minHeight: 0 }}
            >
              {audioLoading && firestoreAudios.length === 0 && (
                <div className="flex items-center justify-center py-10 gap-3">
                  <div className="w-6 h-6 border-2 border-muted border-t-accent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading tracks...
                  </span>
                </div>
              )}

              {!audioLoading && firestoreAudios.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-10 rounded-2xl border border-dashed border-border">
                  {audioSearch
                    ? "No tracks found for your search."
                    : "No tracks available yet."}
                </div>
              )}

              {firestoreAudios.map((track) => {
                const isActive = selectedMusic?.name === track.Name_Music;
                const isLoadingT = presetLoadingUrl === track.id;
                const isPlaying =
                  playingAudioId === track.id &&
                  audioPlayerRef.current &&
                  !audioPlayerRef.current.paused;
                const trackName = track.Name_Music || "Unknown Track";

                return (
                  <div
                    key={track.id}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer group ${
                      isActive
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/50 hover:bg-muted/30"
                    }`}
                  >
                    {/* Play/Pause button */}
                    <button
                      onClick={() => handlePlayAudio(track)}
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isPlaying
                          ? "bg-accent text-white shadow-md"
                          : "bg-muted/50 text-foreground hover:bg-accent/20 hover:text-accent"
                      }`}
                    >
                      {isPlaying ? (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                    </button>

                    {/* Track info */}
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => handleSelectFirestoreTrack(track)}
                    >
                      <p
                        className={`text-sm font-semibold truncate ${isActive ? "text-accent" : "text-foreground"}`}
                      >
                        {trackName}
                      </p>
                      {track.duration && (
                        <p className="text-[10px] text-muted-foreground">
                          {track.duration}
                        </p>
                      )}
                    </div>

                    {/* Select button */}
                    <button
                      onClick={() => handleSelectFirestoreTrack(track)}
                      disabled={isLoadingT}
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-accent text-white"
                          : "bg-muted/40 text-muted-foreground hover:bg-accent hover:text-white"
                      } ${isLoadingT ? "opacity-50" : ""}`}
                    >
                      {isLoadingT ? (
                        <svg
                          className="animate-spin"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      ) : isActive ? (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}

              {/* Load more spinner */}
              {audioLoading && firestoreAudios.length > 0 && (
                <div className="flex justify-center py-3">
                  <div className="w-5 h-5 border-2 border-muted border-t-accent rounded-full animate-spin" />
                </div>
              )}

              {!audioLoading && !audioHasMore && firestoreAudios.length > 0 && (
                <p className="text-center text-[11px] text-muted-foreground py-2">
                  All tracks loaded
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden music file input — triggered by the compact music toggle near the download button */}
      <input
        ref={musicInputRef}
        type="file"
        accept="audio/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const result = validateUploadFile(file, "audio");
            if (!result.valid) {
              showToast(result.error || "Invalid audio file.", "error");
            } else {
              handleDeviceMusic(file);
            }
          }
          e.target.value = "";
        }}
      />

      {/* ── Video recording progress overlay ─────────────────────────────── */}
      {videoExporting && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="relative bg-background dark:bg-[#141824] rounded-3xl p-7 w-[88vw] max-w-[380px] shadow-2xl border border-border">
            <div className="flex items-center justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                {/* Video camera icon */}
                <svg
                  className="w-7 h-7 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 8h9a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-[16px] font-bold text-foreground text-center mb-1">
              Recording Video
            </h3>
            <p className="text-[12px] text-muted-foreground text-center mb-5">
              {progressLabel || "Preparing..."}
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-muted-foreground">
                  Progress
                </span>
                <span className="text-[13px] font-bold text-accent tabular-nums">
                  {displayProgress}%
                </span>
              </div>
              <div className="w-full h-3 bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${displayProgress}%`,
                    background:
                      "linear-gradient(90deg, #0088DA, #0088DA, #0088DA)",
                  }}
                />
              </div>
              {/* Segment markers for each second */}
              <div className="flex justify-between px-0.5">
                {[0, 25, 50, 75, 100].map((m) => (
                  <span
                    key={m}
                    className="text-[9px] text-muted-foreground/50 tabular-nums"
                  >
                    {m}%
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-accent/5 border border-accent/15 rounded-2xl px-4 py-2.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-[11px] text-foreground/80 font-medium">
                Recording canvas with animations
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/50 text-center mt-3">
              Do not close this screen
            </p>
          </div>
        </div>
      )}

      {/* ── Music + photo export progress overlay ────────────────────────── */}
      {musicExporting && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="relative bg-background dark:bg-[#141824] rounded-3xl p-7 w-[88vw] max-w-[380px] shadow-2xl border border-border">
            <div className="flex items-center justify-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-accent animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-[16px] font-bold text-foreground text-center mb-1">
              Creating Video
            </h3>
            <p className="text-[12px] text-muted-foreground text-center mb-5">
              {progressLabel || "Processing..."}
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-muted-foreground">
                  Progress
                </span>
                <span className="text-[12px] font-bold text-accent tabular-nums">
                  {displayProgress}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${displayProgress}%`,
                    background: "linear-gradient(90deg, #0088DA, #4f6fd0)",
                  }}
                />
              </div>
            </div>
            {progressLogs?.length > 0 && (
              <div className="bg-black/20 dark:bg-black/40 rounded-xl p-3 space-y-0.5 max-h-[60px] overflow-hidden">
                {progressLogs?.slice(-3).map((l, i) => (
                  <p
                    key={i}
                    className="text-[10px] text-muted-foreground/60 font-mono truncate"
                  >
                    {l}
                  </p>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground/50 text-center mt-3">
              Do not close this screen
            </p>
          </div>
        </div>
      )}

      <div className="w-full lg:w-1/3 flex-1 min-h-0 flex flex-col overflow-hidden">
        <ListOfTemplates
          selected={selected}
          setSelected={setSelected}
          onTabChange={setActiveTabFromList}
        />
      </div>

      {/* ── Caption modal ───────────────────────────────────────────── */}
      <CaptionModal
        isOpen={captionModalOpen}
        onClose={() => setCaptionModalOpen(false)}
        onDownload={activeExportFn}
        achieverInfo={
          isRank || isBonanza
            ? {
                name: formname,
                city: formcity,
                amount: amountText,
                rankname: selll?.Subtype,
                selectType: selll?.type,
                fromwish: ActualProfilename,
                formdesignation: ActualDesignation,
                formmobile: mlmProfile?.mobile,
              }
            : null
        }
        companyName={mlmProfile?.companyName || ""}
      />
    </div>
  );
}

export default GeneralEditPage;
