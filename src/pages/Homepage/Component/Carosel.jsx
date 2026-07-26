import React, { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import "./stylec.css";
import { Pagination, EffectFade, Autoplay } from "swiper/modules";
import { TTrend_templateService } from "./Services/TTrend_templateService";
import { useLocation, useNavigate } from "react-router";
import { useGeneralData } from "../../.././Context/GeneralContext";
import { Skeleton } from "@heroui/react";
import defaultImage from "../../../../public/carasol.webp";
import { hasMlmProfileInStorage } from "../../../utils/companyStorage";
import { useSelectedCompany } from "../../../Context/SelectedCompanyContext";
import { rememberEditorBackTarget } from "../../../utils/editorNavigation";

export default function Carosel() {
  const { setSelType } = useGeneralData();
  const { selectedCompany } = useSelectedCompany();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const swiperRef = useRef(null);

  useEffect(() => {
    const syncAutoplay = () => {
      const autoplay = swiperRef.current?.autoplay;
      if (!autoplay) return;
      if (pathname === "/" && document.visibilityState !== "hidden") {
        autoplay.start();
      } else {
        autoplay.stop();
      }
    };

    syncAutoplay();
    document.addEventListener("visibilitychange", syncAutoplay);
    return () =>
      document.removeEventListener("visibilitychange", syncAutoplay);
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;

    const loadTrending = async () => {
      try {
        setLoading(true);
        const companyName = selectedCompany?.name || "";
        const data = await TTrend_templateService(companyName);
        if (!isMounted) return;
        setSlides(data);
      } catch (error) {
        
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTrending();
    return () => {
      isMounted = false;
    };
  }, [selectedCompany?.name]);

  const handleImagePress = (item) => {
    const selttype = {
      id: item.id,
      type: item.type,
      serial: item.serial,
      ShowCaseForm: item.ShowCaseForm,
      Subtype: item.Subtype || "",
    };
    setSelType(selttype);
    localStorage.setItem("selType", JSON.stringify(selttype));

    if (hasMlmProfileInStorage()) {
      rememberEditorBackTarget("/", selttype);
      navigate("/editor", { state: { editorBackTarget: "/" } });
    } else {
      navigate("/mlmprofile");
    }
  };

  if (loading) {
    return (
      <div className="w-full rounded-2xl overflow-hidden aspect-[21/9] md:aspect-[3/1] bg-white dark:bg-black/20 shadow-sm border border-border">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (slides?.length === 0) {
    return (
      <div className="w-full rounded-2xl overflow-hidden shadow-md border border-border/50 group relative">
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            if (pathname !== "/" || document.visibilityState === "hidden") {
              swiper.autoplay?.stop();
            }
          }}
          pagination={{ dynamicBullets: true, clickable: true }}
          effect="fade"
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          modules={[Pagination, EffectFade, Autoplay]}
          className="w-full aspect-[21/9] md:aspect-[3/1]"
        >
          <SwiperSlide className="relative w-full h-full bg-muted cursor-pointer overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-xl opacity-50 scale-110"
              style={{ backgroundImage: `url(${defaultImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10 pointer-events-none" />
            <img
              src={defaultImage}
              alt="trending template"
              className="relative z-20 w-full h-full object-contain hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none bg-black/10 backdrop-blur-[1px]">
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white font-semibold text-sm border border-white/30 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                Tap to use
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-md border border-border/50 group relative">
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          if (pathname !== "/" || document.visibilityState === "hidden") {
            swiper.autoplay?.stop();
          }
        }}
        pagination={{ dynamicBullets: true, clickable: true }}
        effect="fade"
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        modules={[Pagination, EffectFade, Autoplay]}
        className="w-full aspect-[21/9] md:aspect-[3/1]"
      >
        {slides.map((item) => (
          <SwiperSlide
            key={item.id}
            className="relative w-full h-full bg-muted cursor-pointer overflow-hidden"
          >
            <div
              onClick={() => handleImagePress(item)}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-xl opacity-50 scale-110"
              style={{ backgroundImage: `url(${item.image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10 pointer-events-none" />
            <img
              src={item.image}
              onClick={() => handleImagePress(item)}
              alt="trending template"
              className="relative z-20 w-full h-full object-contain hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none bg-black/10 backdrop-blur-[1px]">
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white font-semibold text-sm border border-white/30 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                Tap to use
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
