import { useEffect, useRef, useState } from "react";
import videologo from "../public/videologo.mp4";

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    
    const vid = videoRef.current;
    if (vid) {
      vid.muted = true;          
      vid.playsInline = true;    
      vid.play().catch(() => {}); 
    }

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, 3100);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 0.4s ease",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "all" : "none",
      }}
    >
      <video
        ref={videoRef}
        src={videologo}
        autoPlay
        muted         
        playsInline   
        loop
        preload="auto"
        style={{ width: 300, height: 300, objectFit: "contain" }}
      />
    </div>
  );
}