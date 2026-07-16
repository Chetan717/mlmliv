import { useRef, useState, useEffect } from "react";
import { Spinner, toast } from "@heroui/react";
import { removeBg } from "../utils/removeBg";
import { validateUploadFile } from "../../../lib/fileValidation";

export default function ImageUploadWithBgRemove({
  onImageReady,
  setEditingImage,
  setOnImageDone,
  currentImage,
  onRequestReEdit,
  setOpen,
  open,
  type,
  editingType,
  setEditingType,
  skipBackgroundRemoval = false,
  guideTarget,
}) {
  const inputRef = useRef();
  const abortRef = useRef(null);
  const [load, setLoad] = useState(false);
  const [progressMsg, setProgressMsg] = useState("Please wait…");
  const [progressPct, setProgressPct] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!load) { setDots(""); return; }
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(id);
  }, [load]);

  function getSelType() {
    try { return JSON.parse(localStorage.getItem("selType")) || {}; }
    catch { return {}; }
  }
  const selll = getSelType();
  const isAchv = selll?.type === "Achievements";

  const cancelRemoveBg = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoad(false);
    setProgressMsg("Please wait…");
    setProgressPct(0);
    setEditingImage(null);
    setOpen(false);
    toast("Background removal cancelled.");
  };

  const openFinalCrop = (image) => {
    const preview = image instanceof Blob ? URL.createObjectURL(image) : image;
    setEditingImage(preview);
    setOnImageDone(() => (finalBlob) => {
      onImageReady(finalBlob);
      return true;
    });
    setOpen(true);
  };

  const removeBackgroundAfterCrop = (croppedBlob) => {
    if (!croppedBlob) return true;
    setLoad(true);
    setProgressMsg("Removing background…");
    setProgressPct(0);
    const controller = new AbortController();
    abortRef.current = controller;
    (async () => {
      try {
        const processed = await removeBg(
          croppedBlob,
          (stage, pct) => {
            setProgressMsg(stage);
            setProgressPct(pct);
          },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        toast.success("Background removed successfully! ✨");
        openFinalCrop(processed || croppedBlob);
        toast("Adjust the final crop, then tap Done.");
      } catch (err) {
        if (err?.name === "AbortError" || controller.signal.aborted) return;
        
        toast.error("Background removal failed. You can still finish the crop.");
        openFinalCrop(croppedBlob);
      } finally {
        abortRef.current = null;
        setLoad(false);
        setProgressMsg("Please wait…");
        setProgressPct(0);
      }
    })();

    // Keep the editor mounted while the cropped image is processed. The same
    // editor receives the transparent result for the second/final crop.
    return false;
  };

  const handleFile = (file) => {
    if (!file) return;
    const result = validateUploadFile(file, "image");
    if (!result.valid) {
      toast.error(result.error || "Invalid image file.");
      return;
    }
    if (typeof setEditingType === "function") setEditingType(type);

    // Achievement images keep their existing one-crop flow and background.
    if (skipBackgroundRemoval) {
      openFinalCrop(file);
      return;
    }

    // Standard photo flow: crop the original first. Its Done callback removes
    // the background and reopens the result for a second/final crop.
    const preview = URL.createObjectURL(file);
    setEditingImage(preview);
    setOnImageDone(() => removeBackgroundAfterCrop);
    setOpen(true);
  };

  const src = currentImage instanceof Blob ? URL.createObjectURL(currentImage) : currentImage;

  return (
    <div data-guide={guideTarget}>
      {/* Upload box — always visible, non-interactive while loading */}
      {currentImage ? (
        <div
          onClick={() => !load && inputRef.current?.click()}
          className={`relative w-full h-[150px] rounded-2xl border-2 border-accent/40 overflow-hidden shadow-md transition-opacity ${load ? "opacity-40 pointer-events-none" : "cursor-pointer group"}`}
        >
          <img
            src={src}
            alt="Uploaded"
            className="w-full h-full object-contain bg-muted/20"
          />
          {!load && (
            <div className="absolute inset-0 bg-accent/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 rounded-[14px]">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
                </svg>
              </div>
              <p className="text-white text-[11px] font-bold">Tap to change</p>
            </div>
          )}
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-green-500/80 backdrop-blur-sm">
            <p className="text-[9px] font-bold text-white uppercase tracking-wide">
              Uploaded
            </p>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !load && inputRef.current?.click()}
          className={`h-[150px] rounded-2xl border-2 border-dashed border-border bg-muted/20 transition-all duration-200 flex flex-col items-center justify-center gap-3 ${load ? "opacity-40 pointer-events-none" : "hover:border-accent/60 hover:bg-accent/5 cursor-pointer group"}`}
        >
          <div className="w-14 h-14 rounded-2xl bg-muted/40 border border-border group-hover:bg-accent/10 group-hover:border-accent/30 flex items-center justify-center transition-all duration-200">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground group-hover:text-accent transition-colors"
            >
              <path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isAchv ? "JPG, PNG, WEBP supported" : "Add Photo"}
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files[0];
          if (typeof setEditingType === "function") setEditingType(type);
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {/* Full-screen loader overlay */}
      {load && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xs rounded-2xl bg-background border border-border shadow-2xl p-7 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              {/* <svg className="animate-spin w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg> */}
              <Spinner size="md" />
            </div>

            <div className="text-center">
              <p className="text-[12px] text-accent font-semibold mt-1 min-h-[18px]">
                {progressMsg}
                {dots}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Please don't close or navigate away take 30 secconds
              </p>
            </div>

            <div className="w-full">
              <div className="w-full h-[6px] rounded-full bg-accent/15 overflow-hidden">
                {progressPct > 0 ? (
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                ) : (
                  <div className="h-full w-full relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 w-2/5 bg-accent rounded-full"
                      style={{
                        animation: "bgremove-slide 1.4s ease-in-out infinite",
                      }}
                    />
                  </div>
                )}
              </div>
              <p className="text-right text-[10px] font-bold text-accent/60 mt-1">
                {progressPct > 0 ? `${progressPct}%` : "Working…"}
              </p>
            </div>

            <button
              type="button"
              onClick={cancelRemoveBg}
              className="w-full py-2.5 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted/40 transition-all duration-150"
            >
              Cancel
            </button>
          </div>

          <style>{`
            @keyframes bgremove-slide {
              0%   { left: -40%; }
              100% { left: 140%; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
