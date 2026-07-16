// import { useState, useRef, useEffect, useMemo } from "react";
// import { Festival_template } from "./Services/Festival_template";
// import { useGeneralData } from "../../.././Context/GeneralContext";
// import { useNavigate } from "react-router";
// import { Skeleton } from "@heroui/react";
// import { Calendar } from "@gravity-ui/icons";

// export default function Festival() {
//   const sliderRef = useRef(null);
//   const dateSliderRef = useRef(null);

//   const dates = useMemo(() => generateDates(), []);

//   const [selectedDate, setSelectedDate] = useState(dates[0].iso);
//   const [festivaltempdata, setFestivalTempData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const { setSelType, cachedFestivalData, setCachedFestivalData } =
//     useGeneralData();
//   const navigate = useNavigate();

//   useEffect(() => {
//     let isMounted = true;

//     const loadFestival = async (date) => {
//       setLoading(true);
//       if (cachedFestivalData[date]) {
//         if (isMounted) {
//           setFestivalTempData(cachedFestivalData[date]);
//           setLoading(false);
//         }
//         return;
//       }

//       try {
//         const data = await Festival_template(date);
//         if (isMounted) {
//           setCachedFestivalData((prev) => ({ ...prev, [date]: data }));
//           setFestivalTempData(data);
//         }
//       } catch (error) {
//         console.error("Failed to fetch festival templates", error);
//       } finally {
//         if (isMounted) setLoading(false);
//       }
//     };

//     loadFestival(selectedDate);

//     if (sliderRef.current) {
//       sliderRef.current.scrollLeft = 0;
//     }

//     return () => {
//       isMounted = false;
//     };
//   }, [selectedDate]);

//   const handleDateSelect = (iso) => {
//     setSelectedDate(iso);
//   };

//   const handleImagePress = (item) => {
//     const selttype = {
//       id: item.id,
//       type: item.type,
//       serial: item.serial,
//       ShowCaseForm: item.ShowCaseForm,
//       Subtype: item.Subtype || "",
//     };
//     setSelType(selttype);
//     navigate("/editor");
//   };

//   return (
//     <div className="flex flex-col gap-4 w-full">
//       <div className="flex items-center gap-2 px-1">
//         <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
//           <Calendar className="w-5 h-5" />
//         </div>
//         <h3 className="text-lg font-display font-bold text-foreground">
//           Festival Calendar
//         </h3>
//       </div>

//       <div
//         ref={dateSliderRef}
//         className="flex hide-scrollbar gap-3 overflow-x-auto w-full pt-2 pb-2 px-1 snap-x"
//       >
//         {dates.map((d) => {
//           const isSelected = selectedDate === d.iso;
//           return (
//             <button
//               key={d.iso}
//               onClick={() => handleDateSelect(d.iso)}
//               className={`flex flex-col items-center justify-center min-w-[56px] h-[64px] rounded-2xl transition-all duration-300 snap-center shrink-0 border ${
//                 isSelected
//                   ? "bg-accent text-white shadow-md border-transparent scale-105"
//                   : "bg-white dark:bg-black/20 text-foreground border-border hover:border-accent/50 hover:bg-accent/5"
//               }`}
//             >
//               <span
//                 className={`text-[9px] font-semibold uppercase tracking-wider mb-0.5 ${isSelected ? "text-white/80" : "text-muted-foreground"}`}
//               >
//                 {d.monthShort}
//               </span>
//               <span
//                 className={`text-xl font-display font-bold leading-none ${isSelected ? "text-white" : ""}`}
//               >
//                 {d.day}
//               </span>
//             </button>
//           );
//         })}
//       </div>

//       {loading ? (
//         <div className="relative w-full">
//           <div className="flex gap-4 overflow-x-hidden">
//             {[1, 2, 3, 4].map((i) => (
//               <div key={i} className="shrink-0 flex flex-col gap-1">
//                 <div className="w-[85px] md:w-[140px] aspect-square rounded-2xl overflow-hidden bg-white dark:bg-black/20 border border-border">
//                   <Skeleton className="w-full h-full" />
//                 </div>
//                 <div className="w-[85px] md:w-[140px] h-3 rounded bg-muted animate-pulse" />
//               </div>
//             ))}
//           </div>
//         </div>
//       ) : festivaltempdata?.length > 0 ? (
//         <div className="relative w-full">
//           <div
//             ref={sliderRef}
//             className="flex gap-4 overflow-x-auto hide-scrollbar snap-x scroll-gpu"
//           >
//             {festivaltempdata?.map((card) => (
//               <div
//                 key={card.id}
//                 onClick={() => handleImagePress(card)}
//                 className="shrink-0 flex flex-col gap-1.5 cursor-pointer snap-start"
//               >
//                 <div className="w-[85px] md:w-[140px] aspect-square rounded-2xl overflow-hidden relative border border-border shadow-sm bg-white dark:bg-black/20 card-press">
//                   <img
//                     src={card.image}
//                     alt={card.Subtype || "festival template"}
//                     className="w-full h-full object-cover"
//                     loading="lazy"
//                     decoding="async"
//                   />
//                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
//                   <div className="absolute bottom-1.5 right-1.5 min-w-[22px] h-[22px] px-1.5 rounded-lg bg-accent/90 backdrop-blur-sm flex items-center justify-center">
//                     <span className="text-white text-[10px] font-bold leading-none">
//                       {new Date(selectedDate + "T00:00:00").getDate()}
//                     </span>
//                   </div>
//                 </div>
//                 {card.Subtype ? (
//                   <div className="w-[85px] md:w-[140px] overflow-hidden">
//                     <div className="flex whitespace-nowrap animate-marquee-smooth">
//                       <span className="text-[10px] font-semibold text-foreground/70 leading-tight pr-8">
//                         {card.Subtype}
//                       </span>
//                       <span className="text-[10px] font-semibold text-foreground/70 leading-tight pr-8">
//                         {card.Subtype}
//                       </span>
//                     </div>
//                   </div>
//                 ) : null}
//               </div>
//             ))}
//           </div>
//         </div>
//       ) : null}
//     </div>
//   );
// }

// function generateDates() {
//   const dates = [];

//   for (let i = 0; i < 17; i++) {
//     const d = new Date();
//     d.setDate(d.getDate() + i);

//     dates.push({
//       iso: d.toISOString().split("T")[0],
//       day: d.getDate(),
//       month: d.toLocaleString("default", { month: "long" }),
//       monthShort: d.toLocaleString("default", { month: "short" }),
//     });
//   }

//   return dates;
// }
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Festival_template } from "./Services/Festival_template";
import { useGeneralData } from "../../.././Context/GeneralContext";
import { useNavigate } from "react-router";
import { Skeleton } from "@heroui/react";
import { Calendar } from "@gravity-ui/icons";
import { hasMlmProfileInStorage } from "../../../utils/companyStorage";

export default function Festival() {
  const sliderRef = useRef(null);
  const dateSliderRef = useRef(null);
  const cardGroupRefs = useRef({});

  const dates = useMemo(() => generateDates(), []);

  const [selectedDate, setSelectedDate] = useState(dates[0].iso);
  const [allFestivalData, setAllFestivalData] = useState({});
  const [loadingDates, setLoadingDates] = useState({});
  const { setSelType, cachedFestivalData, setCachedFestivalData } =
    useGeneralData();
  const navigate = useNavigate();

  // Load ALL 17 dates on mount — in parallel instead of sequentially
  useEffect(() => {
    let isMounted = true;

    const loadAll = async () => {
      // Seed from context cache first (instant)
      const fromCache = {};
      const datesToFetch = [];
      for (const d of dates) {
        if (cachedFestivalData[d.iso]) {
          fromCache[d.iso] = cachedFestivalData[d.iso];
        } else {
          datesToFetch.push(d.iso);
        }
      }
      if (Object.keys(fromCache).length > 0 && isMounted) {
        setAllFestivalData((prev) => ({ ...prev, ...fromCache }));
      }

      if (datesToFetch.length === 0) return;

      // Mark all un-cached dates as loading at once
      if (isMounted) {
        setLoadingDates((prev) => {
          const next = { ...prev };
          datesToFetch.forEach((d) => { next[d] = true; });
          return next;
        });
      }

      // Fetch all dates in parallel — no sequential waterfall
      await Promise.all(
        datesToFetch.map(async (date) => {
          try {
            const data = await Festival_template(date);
            if (!isMounted) return;
            setCachedFestivalData((prev) => ({ ...prev, [date]: data }));
            setAllFestivalData((prev) => ({ ...prev, [date]: data }));
          } catch (err) {
            console.error("Failed to fetch", date, err);
          } finally {
            if (isMounted) {
              setLoadingDates((prev) => ({ ...prev, [date]: false }));
            }
          }
        })
      );
    };

    loadAll();
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When date chip is clicked → scroll cards to that date group
  const handleDateSelect = (iso) => {
    setSelectedDate(iso);
    const el = cardGroupRefs.current[iso];
    if (el && sliderRef.current) {
      sliderRef.current.scrollTo({
        left: el.offsetLeft - 16,
        behavior: "smooth",
      });
    }

    // Also scroll date chip into view
    const dateChip = dateSliderRef.current?.querySelector(
      `[data-iso="${iso}"]`,
    );
    if (dateChip) {
      dateChip.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  };

  // When cards are scrolled → auto-update selected date chip
  const handleCardScroll = useCallback(() => {
    if (!sliderRef.current) return;
    const scrollLeft = sliderRef.current.scrollLeft;
    const containerLeft = sliderRef.current.getBoundingClientRect().left;

    for (const date of dates.map((d) => d.iso)) {
      const el = cardGroupRefs.current[date];
      if (!el) continue;
      const elLeft = el.getBoundingClientRect().left - containerLeft;
      if (elLeft >= -10) {
        if (selectedDate !== date) {
          setSelectedDate(date);
          const dateChip = dateSliderRef.current?.querySelector(
            `[data-iso="${date}"]`,
          );
          if (dateChip) {
            dateChip.scrollIntoView({
              behavior: "smooth",
              inline: "center",
              block: "nearest",
            });
          }
        }
        break;
      }
    }
  }, [dates, selectedDate]);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleCardScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleCardScroll);
  }, [handleCardScroll]);

  const handleImagePress = (item) => {
    const selttype = {
      id: item.id,
      MainType: "General",
      type: item.type,
      serial: item.serial,
      ShowCaseForm: item.ShowCaseForm,
      Subtype: item.Subtype || "",
    };

    setSelType(selttype);
    localStorage.setItem("selType", JSON.stringify(selttype));

    if (hasMlmProfileInStorage()) {
      navigate("/editor");
    } else {
      navigate("/mlmprofile");
    }

  };

  const isAnythingLoading = Object.values(loadingDates).some(Boolean);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
          <Calendar className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-display font-bold text-foreground">
          Festival Calendar
        </h3>
      </div>

      {/* Date Chips — auto-highlight on scroll */}
      <div
        ref={dateSliderRef}
        className="flex hide-scrollbar gap-3 overflow-x-auto w-full pt-2 pb-2 px-1 snap-x"
      >
        {dates.map((d) => {
          const isSelected = selectedDate === d.iso;
          const hasData = allFestivalData[d.iso]?.length > 0;
          return (
            <button
              key={d.iso}
              data-iso={d.iso}
              onClick={() => handleDateSelect(d.iso)}
              className={`relative flex flex-col items-center justify-center min-w-[56px] h-[64px] rounded-2xl transition-all duration-300 snap-center shrink-0 border ${
                isSelected
                  ? "bg-accent text-white shadow-md border-transparent scale-105"
                  : "bg-white dark:bg-black/20 text-foreground border-border hover:border-accent/50 hover:bg-accent/5"
              }`}
            >
              <span
                className={`text-[9px] font-semibold uppercase tracking-wider mb-0.5 ${isSelected ? "text-white/80" : "text-muted-foreground"}`}
              >
                {d.monthShort}
              </span>
              <span
                className={`text-xl font-display font-bold leading-none ${isSelected ? "text-white" : ""}`}
              >
                {d.day}
              </span>
              {/* Dot indicator if has festivals */}
              {hasData && (
                <span
                  className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected ? "bg-white/70" : "bg-accent"}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Unified Horizontal Scroll — all dates together */}
      {isAnythingLoading && Object.keys(allFestivalData).length === 0 ? (
        <div className="flex gap-4 overflow-x-hidden px-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="shrink-0 flex flex-col gap-1">
              <div className="w-[85px] md:w-[140px] aspect-square rounded-2xl overflow-hidden bg-white dark:bg-black/20 border border-border">
                <Skeleton className="w-full h-full" />
              </div>
              <div className="w-[85px] md:w-[140px] h-3 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={sliderRef}
          className="flex gap-2 overflow-x-auto hide-scrollbar px-1 pb-1"
        >
          {dates.map((d) => {
            const cards = allFestivalData[d.iso];
            const isLoading = loadingDates[d.iso];

            // Skip dates with no data and not loading
            if (!isLoading && (!cards || cards.length === 0)) return null;

            return (
              <div
                key={d.iso}
                ref={(el) => (cardGroupRefs.current[d.iso] = el)}
                className="flex gap-3 shrink-0"
              >
                {/* Date Divider Label */}
                {/* <div className="flex flex-col items-center gap-1 shrink-0">
                  {/* <div className="w-[32px] flex flex-col items-center justify-center h-[40px] rounded-xl bg-accent/10 border border-accent/20">
                    <span className="text-[8px] font-bold text-accent uppercase leading-none">
                      {d.monthShort}
                    </span>
                    <span className="text-sm font-display font-bold text-accent leading-none">
                      {d.day}
                    </span>
                  </div> *
                  <div className="w-[1px] flex-1 bg-accent/10 rounded-full min-h-[40px]" />
                </div> */}

                {/* Cards for this date */}
                <div className="flex gap-3">
                  {isLoading
                    ? [1, 2].map((i) => (
                        <div key={i} className="shrink-0 flex flex-col gap-1">
                          <div className="w-[85px] md:w-[140px] aspect-square rounded-2xl overflow-hidden bg-white dark:bg-black/20 border border-border">
                            <Skeleton className="w-full h-full" />
                          </div>
                          <div className="w-[85px] md:w-[140px] h-3 rounded bg-muted animate-pulse" />
                        </div>
                      ))
                    : cards.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => handleImagePress(card)}
                          className="shrink-0 flex flex-col gap-1.5 cursor-pointer"
                        >
                          <div className="w-[85px] md:w-[140px] aspect-square rounded-2xl overflow-hidden relative border border-border shadow-sm bg-white dark:bg-black/20 card-press">
                            <img
                              src={card.image}
                              alt={card.Subtype || "festival template"}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                            <div className="absolute bottom-1.5 right-1.5 min-w-[22px] h-[22px] px-1.5 rounded-lg bg-accent/90 backdrop-blur-sm flex items-center justify-center">
                              <span className="text-white text-[10px] font-bold leading-none">
                                {d.day}
                              </span>
                            </div>
                          </div>
                          {card.Subtype ? (
                            <div className="w-[85px] md:w-[140px] overflow-hidden">
                              <div className="flex whitespace-nowrap animate-marquee-smooth">
                                <span className="text-[10px] font-semibold text-foreground/70 leading-tight pr-8">
                                  {card.Subtype}
                                </span>
                                <span className="text-[10px] font-semibold text-foreground/70 leading-tight pr-8">
                                  {card.Subtype}
                                </span>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function generateDates() {
  const dates = [];
  for (let i = 0; i < 17; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      iso: d.toISOString().split("T")[0],
      day: d.getDate(),
      month: d.toLocaleString("default", { month: "long" }),
      monthShort: d.toLocaleString("default", { month: "short" }),
    });
  }
  return dates;
}
