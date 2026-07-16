import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@heroui/react";

// ── Helpers ───────────────────────────────────────────────────────
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

function containDims(imgW, imgH, boxW, boxH) {
  const ia = imgW / imgH, ba = boxW / boxH;
  return ia > ba ? { dw: boxW, dh: boxW / ia } : { dw: boxH * ia, dh: boxH };
}

function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Crop box helpers ──────────────────────────────────────────────
const HANDLE_VIS = 14;
const HANDLE_HIT = 36;
const MIN_BOX_W  = 60;

function initBox(cw, ch, ratio) {
  const M = 0.88;
  let w = cw * M, h = w / ratio;
  if (h > ch * M) { h = ch * M; w = h * ratio; }
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
}

function initBoxInBounds(bounds, ratio) {
  const margin = 0.98;
  let w = bounds.w * margin;
  let h = w / ratio;
  if (h > bounds.h * margin) { h = bounds.h * margin; w = h * ratio; }
  return {
    x: bounds.x + (bounds.w - w) / 2,
    y: bounds.y + (bounds.h - h) / 2,
    w,
    h,
  };
}

const CORNERS = {
  TL: { ax: b => b.x + b.w, ay: b => b.y + b.h, sx: -1, sy: -1 },
  TR: { ax: b => b.x,       ay: b => b.y + b.h, sx:  1, sy: -1 },
  BL: { ax: b => b.x + b.w, ay: b => b.y,       sx: -1, sy:  1 },
  BR: { ax: b => b.x,       ay: b => b.y,        sx:  1, sy:  1 },
};

function hitCorner(px, py, box) {
  const half = HANDLE_HIT / 2;
  const pts = {
    TL: [box.x,       box.y],
    TR: [box.x+box.w, box.y],
    BL: [box.x,       box.y+box.h],
    BR: [box.x+box.w, box.y+box.h],
  };
  for (const [n, [cx, cy]] of Object.entries(pts))
    if (Math.abs(px-cx) <= half && Math.abs(py-cy) <= half) return n;
  return null;
}

function insideBox(px, py, box) {
  return px >= box.x && px <= box.x+box.w && py >= box.y && py <= box.y+box.h;
}

function resizeBox(dragX, dragY, anchor, sx, sy, cw, ch, ratio, bounds) {
  let dw = (dragX - anchor.x) * sx;
  let dh = (dragY - anchor.y) * sy;
  let w, h;
  if (dw > 0 && dh > 0)
    dw / ratio >= dh ? (w = dw, h = dw / ratio) : (h = dh, w = dh * ratio);
  else if (dw > 0) { w = dw; h = dw / ratio; }
  else if (dh > 0) { h = dh; w = dh * ratio; }
  else { w = MIN_BOX_W; h = MIN_BOX_W / ratio; }
  w = Math.max(w, MIN_BOX_W); h = w / ratio;
  let x = sx > 0 ? anchor.x : anchor.x - w;
  let y = sy > 0 ? anchor.y : anchor.y - h;
  x = clamp(x, 0, cw - w); y = clamp(y, 0, ch - h);
  w = Math.min(w, cw - x); h = Math.min(h, ch - y);
  if (w / h > ratio) w = h * ratio; else h = w / ratio;
  if (bounds) {
    w = Math.min(w, bounds.w, bounds.h * ratio);
    h = w / ratio;
    x = clamp(x, bounds.x, bounds.x + bounds.w - w);
    y = clamp(y, bounds.y, bounds.y + bounds.h - h);
  }
  return { x, y, w, h };
}

function moveBox(box, dx, dy, cw, ch, bounds) {
  const limit = bounds || { x: 0, y: 0, w: cw, h: ch };
  return {
    ...box,
    x: clamp(box.x + dx, limit.x, limit.x + limit.w - box.w),
    y: clamp(box.y + dy, limit.y, limit.y + limit.h - box.h),
  };
}

// ── Component ─────────────────────────────────────────────────────
export function ImageEditorCanvas({ src, onDone, onCancel, ratio = 2 / 2.5, constrainToImage = true }) {
  const [zoom, setZoom]         = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH]       = useState(false);
  const [flipV, setFlipV]       = useState(false);
  const [tab, setTab]             = useState("crop");
  const [isDoing, setIsDoing]     = useState(false);
  const [encodeProgress, setEncodeProgress] = useState(0);
  const [canvasW, setCanvasW]     = useState(300);
  const [canvasH, setCanvasH]   = useState(Math.round(300 / ratio));

  const containerRef  = useRef(null);
  const canvasRef     = useRef(null);
  const imgRef        = useRef(null);
  const offscreenRef  = useRef(null);
  const offDirtyRef   = useRef(true);
  const canvasSzRef   = useRef({ w: 300, h: Math.round(300 / ratio) });
  const appliedSzRef  = useRef({ w: 0, h: 0, dpr: 0 });
  const cropBoxRef    = useRef(initBox(300, Math.round(300 / ratio), ratio));
  const dragRef       = useRef(null);
  const pinchRef      = useRef(null);
  const rafRef           = useRef(null);
  const progressTimerRef = useRef(null);
  const zoomRef          = useRef(100);
  const rotRef           = useRef(0);
  const flipHRef      = useRef(false);
  const flipVRef      = useRef(false);

  useEffect(() => { zoomRef.current = zoom;    offDirtyRef.current = true; }, [zoom]);
  useEffect(() => { rotRef.current  = rotation; offDirtyRef.current = true; }, [rotation]);
  useEffect(() => { flipHRef.current = flipH;   offDirtyRef.current = true; }, [flipH]);
  useEffect(() => { flipVRef.current = flipV;   offDirtyRef.current = true; }, [flipV]);

  // ── Responsive canvas sizing ───────────────────────────────────
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const { width } = containerRef.current.getBoundingClientRect();
      const cw = Math.max(200, Math.min(width - 4, 420));
      const ch = Math.min(Math.round(cw / ratio), 520);
      if (cw !== canvasSzRef.current.w || ch !== canvasSzRef.current.h) {
        canvasSzRef.current = { w: cw, h: ch };
        cropBoxRef.current  = initBox(cw, ch, ratio);
        offDirtyRef.current = true;
        setCanvasW(cw);
        setCanvasH(ch);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [ratio]);

  // ── Image dim computation ─────────────────────────────────────
  function imgDims(img, cw, ch, rot, z) {
    const rot90 = rot % 180 !== 0;
    const bw = rot90 ? ch : cw, bh = rot90 ? cw : ch;
    const { dw, dh } = containDims(img.naturalWidth, img.naturalHeight, bw, bh);
    return { dw: dw * (z/100), dh: dh * (z/100) };
  }

  function getCropBounds(img, cw, ch) {
    if (!constrainToImage || !img) return null;
    const { dw, dh } = imgDims(img, cw, ch, rotRef.current, zoomRef.current);
    const left = (cw - dw) / 2;
    const top = (ch - dh) / 2;
    const x = Math.max(0, left);
    const y = Math.max(0, top);
    return {
      x,
      y,
      w: Math.max(1, Math.min(cw, left + dw) - x),
      h: Math.max(1, Math.min(ch, top + dh) - y),
    };
  }

  function initialCropBox(img, cw, ch) {
    const bounds = getCropBounds(img, cw, ch);
    return bounds ? initBoxInBounds(bounds, ratio) : initBox(cw, ch, ratio);
  }

  // ── Rebuild offscreen image cache ─────────────────────────────
  function rebuildOffscreen(img, cw, ch, dpr) {
    const rot = rotRef.current, fH = flipHRef.current, fV = flipVRef.current, z = zoomRef.current;
    const oc = document.createElement("canvas");
    oc.width = cw * dpr; oc.height = ch * dpr;
    const ctx = oc.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const { dw, dh } = imgDims(img, cw, ch, rot, z);
    ctx.save();
    ctx.translate(cw/2, ch/2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(fH ? -1 : 1, fV ? -1 : 1);
    ctx.drawImage(img, -dw/2, -dh/2, dw, dh);
    ctx.restore();
    return oc;
  }

  // ── Draw ─────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas) return;

    const { w: cw, h: ch } = canvasSzRef.current;
    const dpr = window.devicePixelRatio || 1;
    const ap  = appliedSzRef.current;

    if (ap.w !== cw || ap.h !== ch || ap.dpr !== dpr) {
      canvas.width        = cw * dpr;
      canvas.height       = ch * dpr;
      canvas.style.width  = `${cw}px`;
      canvas.style.height = `${ch}px`;
      appliedSzRef.current = { w: cw, h: ch, dpr };
      offDirtyRef.current  = true;
      cropBoxRef.current   = initialCropBox(img, cw, ch);
    }

    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (img) {
      if (offDirtyRef.current || !offscreenRef.current) {
        offscreenRef.current = rebuildOffscreen(img, cw, ch, dpr);
        offDirtyRef.current  = false;
      }
      ctx.drawImage(offscreenRef.current, 0, 0);
    }

    const box = cropBoxRef.current;
    const { x: fx, y: fy, w: fw, h: fh } = box;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.beginPath(); ctx.rect(0, 0, cw, ch); ctx.clip();

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0,    0,    cw,    fy);
    ctx.fillRect(0,    fy+fh, cw,   ch-fy-fh);
    ctx.fillRect(0,    fy,    fx,    fh);
    ctx.fillRect(fx+fw, fy,  cw-fx-fw, fh);

    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(fx, fy, fw, fh);

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 0.7;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(fx + fw/3*i, fy); ctx.lineTo(fx + fw/3*i, fy+fh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx, fy + fh/3*i); ctx.lineTo(fx+fw, fy + fh/3*i); ctx.stroke();
    }

    const BL = 18, BT = 3;
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = BT; ctx.lineCap = "square";
    [[fx,fy,1,1],[fx+fw,fy,-1,1],[fx,fy+fh,1,-1],[fx+fw,fy+fh,-1,-1]].forEach(([x,y,sx,sy]) => {
      ctx.beginPath(); ctx.moveTo(x+sx*BL, y); ctx.lineTo(x,y); ctx.lineTo(x, y+sy*BL); ctx.stroke();
    });

    const hs = HANDLE_VIS;
    ctx.fillStyle = "#ffffff";
    [[fx,fy],[fx+fw,fy],[fx,fy+fh],[fx+fw,fy+fh]].forEach(([cx,cy]) => {
      ctx.fillRect(cx-hs/2, cy-hs/2, hs, hs);
    });

    ctx.restore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio]);

  const scheduleDraw = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => { rafRef.current = null; draw(); });
  }, [draw]);

  const fitToCrop = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const { w: cw, h: ch } = canvasSzRef.current;
    const box = cropBoxRef.current || initBox(cw, ch, ratio);
    const rot = rotRef.current;
    const rot90 = rot % 180 !== 0;
    const bw = rot90 ? ch : cw, bh = rot90 ? cw : ch;
    const { dw: imgW, dh: imgH } = containDims(img.naturalWidth, img.naturalHeight, bw, bh);
    const zoomNeeded = Math.max(box.w / imgW, box.h / imgH) * 100;
    const newZoom = clamp(Math.ceil(zoomNeeded), 100, 300);
    zoomRef.current = newZoom;
    setZoom(newZoom);
    offDirtyRef.current = true;
    scheduleDraw();
  }, [ratio, scheduleDraw]);

  // ── Auto face detect ──────────────────────────────────────────
  const autoDetectFace = useCallback(async () => {
    const img = imgRef.current;
    if (!img || !("FaceDetector" in window)) return;
    try {
      const detector = new window.FaceDetector({ maxDetectedFaces: 1, fastMode: true });
      const faces = await detector.detect(img);
      if (!faces.length) return;
      const face = faces[0].boundingBox;
      const { w: cw, h: ch } = canvasSzRef.current;
      const rot = rotRef.current;
      const rot90 = rot % 180 !== 0;
      const bw = rot90 ? ch : cw, bh = rot90 ? cw : ch;
      const { dw, dh } = containDims(img.naturalWidth, img.naturalHeight, bw, bh);
      const z = zoomRef.current;
      const sdw = dw * (z / 100), sdh = dh * (z / 100);
      const imgLeft = (cw - sdw) / 2, imgTop = (ch - sdh) / 2;
      const sx = sdw / img.naturalWidth, sy = sdh / img.naturalHeight;
      const fcx = imgLeft + (face.x + face.width  / 2) * sx;
      const fcy = imgTop  + (face.y + face.height / 2) * sy;
      const fh  = face.height * sy;
      const desiredH = fh * 2.2;
      const desiredW = desiredH * ratio;
      const bounds = getCropBounds(img, cw, ch) || { x: 0, y: 0, w: cw, h: ch };
      let fw = Math.min(desiredW, bounds.w, bounds.h * ratio);
      let fhh = fw / ratio;
      let bx = clamp(fcx - fw / 2, bounds.x, bounds.x + bounds.w - fw);
      let by = clamp(
        (fcy - fh * 0.1) - fhh / 2,
        bounds.y,
        bounds.y + bounds.h - fhh,
      );
      if (fw < MIN_BOX_W) return;
      cropBoxRef.current = { x: bx, y: by, w: fw, h: fhh };
      scheduleDraw();
    } catch { /* FaceDetector unavailable or failed — no-op */ }
  }, [ratio, scheduleDraw]);

  // ── Load image ────────────────────────────────────────────────
  useEffect(() => {
    if (!src) return;
    imgRef.current = null;
    offscreenRef.current = null;
    offDirtyRef.current = true;
    zoomRef.current = 100; setZoom(100);
    rotRef.current = 0;   setRotation(0);
    flipHRef.current = false; setFlipH(false);
    flipVRef.current = false; setFlipV(false);
    setIsDoing(false);
    const { w: cw, h: ch } = canvasSzRef.current;
    cropBoxRef.current = initBox(cw, ch, ratio);

    const img = new Image();
    img.crossOrigin = "anonymous";
    let url = null;

    const doLoad = () => {
      imgRef.current = img;
      const { w: cw, h: ch } = canvasSzRef.current;
      cropBoxRef.current = initialCropBox(img, cw, ch);
      offDirtyRef.current = true;
      scheduleDraw();
      setTimeout(autoDetectFace, 80);
    };

    img.onload = doLoad;
    img.onerror = e => undefined;

    if (src instanceof Blob) {
      url = URL.createObjectURL(src);
      img.src = url;
    } else {
      img.src = src;
    }
    // If already cached (e.g. same blob URL), fire immediately
    if (img.complete && img.naturalWidth > 0) doLoad();

    return () => { img.onload = null; if (url) URL.revokeObjectURL(url); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, ratio]);

  useEffect(() => { if (imgRef.current) scheduleDraw(); }, [rotation, flipH, flipV, zoom, canvasW, canvasH, scheduleDraw]);

  // ── Pointer helpers ───────────────────────────────────────────
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { px: cx - rect.left, py: cy - rect.top };
  };

  const onDown = (e) => {
    e.preventDefault();
    if (e.touches && e.touches.length >= 2) {
      pinchRef.current = { dist: getTouchDist(e.touches), zoom0: zoomRef.current };
      dragRef.current = null;
      return;
    }
    pinchRef.current = null;
    const { px, py } = getPos(e);
    const box = cropBoxRef.current;
    const corner = hitCorner(px, py, box);
    if (corner) {
      const { ax, ay, sx, sy } = CORNERS[corner];
      dragRef.current = { mode: "resize", corner, anchor: { x: ax(box), y: ay(box) }, sx, sy };
    } else if (insideBox(px, py, box)) {
      dragRef.current = { mode: "move", px, py, box0: { ...box } };
      if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    }
  };

  const onMove = (e) => {
    e.preventDefault();
    if (e.touches && e.touches.length >= 2 && pinchRef.current) {
      const newDist = getTouchDist(e.touches);
      const newZoom = clamp(Math.round(pinchRef.current.zoom0 * newDist / pinchRef.current.dist), 100, 300);
      zoomRef.current = newZoom; setZoom(newZoom);
      offDirtyRef.current = true; scheduleDraw();
      return;
    }
    if (!dragRef.current) return;
    const { px, py } = getPos(e);
    const { w: cw, h: ch } = canvasSzRef.current;
    const bounds = getCropBounds(imgRef.current, cw, ch);
    const d = dragRef.current;
    if (d.mode === "resize") {
      cropBoxRef.current = resizeBox(px, py, d.anchor, d.sx, d.sy, cw, ch, ratio, bounds);
    } else {
      cropBoxRef.current = moveBox(d.box0, px - d.px, py - d.py, cw, ch, bounds);
    }
    scheduleDraw();
  };

  const onUp = (e) => {
    if (e?.touches?.length > 0) { if (e.touches.length < 2) pinchRef.current = null; return; }
    pinchRef.current = null;
    dragRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
  };

  // ── Export ────────────────────────────────────────────────────
  const handleDone = () => {
    if (isDoing) return;
    const img = imgRef.current;
    if (!img) return;
    setIsDoing(true);
    setEncodeProgress(0);

    // Animate progress 0 → 85 while toBlob encodes
    let p = 0;
    clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      p = Math.min(p + (p < 40 ? 10 : p < 70 ? 4 : 1), 85);
      setEncodeProgress(p);
    }, 55);

    const rot = rotRef.current, fH = flipHRef.current, fV = flipVRef.current, z = zoomRef.current;
    const { w: cw, h: ch } = canvasSzRef.current;
    const box = cropBoxRef.current;

    const TARGET = 800;
    const outW = ratio >= 1 ? TARGET : Math.round(TARGET * ratio);
    const outH = ratio >= 1 ? Math.round(TARGET / ratio) : TARGET;
    const scale = outW / box.w;

    const { dw, dh } = imgDims(img, cw, ch, rot, z);
    const cropCX = box.x + box.w / 2;
    const cropCY = box.y + box.h / 2;
    const imgCX  = outW/2 + (cw/2 - cropCX) * scale;
    const imgCY  = outH/2 + (ch/2 - cropCY) * scale;

    const out = document.createElement("canvas");
    out.width = outW; out.height = outH;
    const ctx = out.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.save();
    ctx.translate(imgCX, imgCY);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(fH ? -1 : 1, fV ? -1 : 1);
    ctx.drawImage(img, -dw*scale/2, -dh*scale/2, dw*scale, dh*scale);
    ctx.restore();

    out.toBlob(blob => {
      clearInterval(progressTimerRef.current);
      setEncodeProgress(100);
      setTimeout(() => {
        setIsDoing(false);
        setEncodeProgress(0);
        onDone(blob);
      }, 180);
    }, "image/webp", 0.92);
  };

  // ── Tabs ──────────────────────────────────────────────────────
  const tabs = [
    { id: "rotate", label: "Rotate", icon: "↺" },
    { id: "flip",   label: "Flip",   icon: "⇄" },
    { id: "crop",   label: "Crop",   icon: "⊡" },
    { id: "scale",  label: "Zoom",   icon: "⤢" },
  ];
  const btnBase = {
    background:"none", border:"none", cursor:"pointer",
    display:"flex", flexDirection:"column", alignItems:"center",
    justifyContent:"center", gap:4, padding:"12px 8px", flex:1,
  };

  return (
    <div ref={containerRef} style={{
      display:"flex", flexDirection:"column", height:"100%", width:"100%",
      backgroundColor:"#181818", userSelect:"none",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",
    }}>

      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"7px 10px", borderBottom:"1px solid #2c2c2c", flexShrink:0 }}>
        <button onClick={onCancel} style={{
          background:"none", border:"none", color:"#fff", fontSize:14,
          cursor:"pointer", padding:"4px 8px", touchAction:"manipulation" }}>✕</button>
        <button
          type="button"
          disabled={isDoing}
          onClick={handleDone}
          style={{
            position:"relative", overflow:"hidden",
            background: isDoing ? "#1c0e04" : "linear-gradient(135deg,#ea580c,#f97316)",
            color:"#fff", fontWeight:700, fontSize:13, borderRadius:12,
            minWidth:90, minHeight:36, border:"none",
            cursor: isDoing ? "default" : "pointer",
            touchAction:"manipulation",
            display:"flex", alignItems:"center", justifyContent:"center", padding:"0 14px",
          }}
        >
          {isDoing && (
            <span style={{
              position:"absolute", left:0, top:0, bottom:0,
              width:`${encodeProgress}%`,
              background:"linear-gradient(135deg,#ea580c,#f97316)",
              transition:"width 0.1s linear",
              borderRadius:12,
            }} />
          )}
          <span style={{ position:"relative", zIndex:1, letterSpacing:"0.01em" }}>
            {isDoing ? `Encoding ${encodeProgress}%` : "Done / पूरा करें"}
          </span>
        </button>
      </div>

      {/* Canvas area — fills remaining space, image never overflows */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        width:"100%", backgroundColor:"#111", overflow:"hidden", minHeight:200 }}>
        <canvas ref={canvasRef}
          style={{ touchAction:"none", display:"block", cursor:"grab",
            maxWidth:"100%", maxHeight:"100%" }}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp} />
      </div>

      {/* Tab controls */}
      <div style={{ backgroundColor:"#f4f4f4", borderTop:"1px solid #e0e0e0", flexShrink:0 }}>
        {tab === "rotate" && (
          <div style={{ padding:"6px 10px", display:"flex", justifyContent:"center", gap:16 }}>
            {[["↺",-90],["↻",90]].map(([icon,deg]) => (
              <button key={deg} onClick={() => setRotation(r => r+deg)} style={{
                padding:"6px 8px", backgroundColor:"#fff", border:"1px solid #ddd",
                borderRadius:10, fontSize:14, cursor:"pointer" }}>{icon}</button>
            ))}
          </div>
        )}
        {tab === "flip" && (
          <div style={{ padding:"6px 10px", display:"flex", justifyContent:"center", gap:12 }}>
            {[["⇄",flipH,() => setFlipH(v=>!v)],["⇅",flipV,() => setFlipV(v=>!v)]].map(([label,active,fn]) => (
              <button key={label} onClick={fn} style={{
                padding:"6px 12px", backgroundColor: active?"#f97316":"#fff",
                color: active?"#fff":"#333", border:"1px solid #ddd",
                borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" }}>{label}</button>
            ))}
          </div>
        )}
        {tab === "crop" && (
          <div style={{ padding:"8px 10px", textAlign:"center", fontSize:12, color:"#888" }}>
            Drag corners to resize · अंदर खींचकर फोटो सेट करें · Crop stays inside photo
          </div>
        )}
      </div>

      {/* Zoom slider */}
      <div style={{ backgroundColor:"#f4f4f4", padding:"6px 20px 12px", borderTop:"1px solid #e8e8e8", flexShrink:0 }}>
        <div style={{ textAlign:"center", fontSize:15, fontWeight:700, color:"#f97316", marginBottom:6 }}>
          {zoom}%
        </div>
        <div style={{ position:"relative", height:36, display:"flex", alignItems:"center" }}>
          <div style={{ position:"absolute", left:0, right:0, display:"flex",
            justifyContent:"space-between", alignItems:"flex-end",
            height:20, pointerEvents:"none", padding:"0 2px" }}>
            {Array.from({length:35}).map((_,i) => (
              <div key={i} style={{ width:1.5, height: i%5===0?14:7,
                backgroundColor: i===0?"#f97316":"#bbb", borderRadius:1 }} />
            ))}
          </div>
          <input type="range" min={100} max={300} step={1} value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ width:"100%", appearance:"none", WebkitAppearance:"none",
              background:"transparent", height:36, cursor:"pointer", position:"relative", zIndex:1 }} />
        </div>
        <style>{`
          input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:5px;height:28px;background:#f97316;border-radius:3px;cursor:pointer;}
          input[type=range]::-webkit-slider-runnable-track{background:transparent;height:36px;}
          @keyframes spin{to{transform:rotate(360deg)}}
        `}</style>
      </div>

      {/* Tab bar */}
      <div style={{ backgroundColor:"#1e1e1e", display:"flex", borderTop:"1px solid #2a2a2a", flexShrink:0 }}>
        <button onClick={() => {
          setRotation(0); setFlipH(false); setFlipV(false); setZoom(100);
          const { w: cw, h: ch } = canvasSzRef.current;
          cropBoxRef.current = initialCropBox(imgRef.current, cw, ch);
          offDirtyRef.current = true; scheduleDraw();
        }} style={btnBase}>
          <span style={{ fontSize:20, color:"#888" }}>↺</span>
          <span style={{ fontSize:10, color:"#666" }}>Reset</span>
        </button>
        <button onClick={fitToCrop} style={btnBase}>
          <span style={{ fontSize:20, color:"#888" }}>⊞</span>
          <span style={{ fontSize:10, color:"#666" }}>Fit</span>
        </button>
        <button onClick={autoDetectFace} style={btnBase}>
          <span style={{ fontSize:18, color:"#888" }}>👤</span>
          <span style={{ fontSize:10, color:"#666" }}>Face</span>
        </button>
        {tabs.map(({ id, label, icon }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)}
              style={{ ...btnBase, borderTop: active ? "2.5px solid #f97316":"2.5px solid transparent" }}>
              <span style={{ fontSize:20, color: active?"#f97316":"#888" }}>{icon}</span>
              <span style={{ fontSize:10, color: active?"#f97316":"#777", fontWeight: active?700:400 }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
