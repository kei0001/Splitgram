/* splitter.jsx — core slicing math + presentational components */
const { useState, useEffect, useRef, useLayoutEffect, useCallback } = React;

/* ---------- output cell dimensions per aspect ---------- */
const CELL = {
  "1:1": { w: 1080, h: 1080 },
  "4:5": { w: 1080, h: 1350 },
};
const cellAspectRatio = (a) => CELL[a].w / CELL[a].h; // w/h

/* ---------- cover-fit mapping (resolution independent) ----------
   pan.x / pan.y in [-1, 1]; 0 = centered.
   Returns draw rect in the given frame px space. */
function coverRect(imgW, imgH, FW, FH, zoom, pan) {
  const base = Math.max(FW / imgW, FH / imgH);
  const scale = base * zoom;
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const ovX = drawW - FW;
  const ovY = drawH - FH;
  const x = -ovX * (0.5 + 0.5 * pan.x);
  const y = -ovY * (0.5 + 0.5 * pan.y);
  return { x, y, w: drawW, h: drawH, ovX, ovY };
}

/* ---------- shared grid geometry ----------
   POST = 4:5 (1080×1350) — the exported slide / opened-post view.
   THUMB = 3:4 — Instagram's profile-grid crop: same HEIGHT as the post,
   sides trimmed. So the thumbnail tile is NARROWER than the post; each
   post bleeds OVX px into its horizontal neighbours. Cover-fit runs
   against the full bled region so the post edges are filled, while each
   post's centre 3:4 region tiles seamlessly on the profile grid. */
const PW = 1080, PH = 1350;          // post (4:5)
const TW = PW * 15 / 16;             // thumbnail tile width (3:4) = 1012.5
const OVX = (PW - TW) / 2;           // 33.75px horizontal bleed each side

function gridLayout(imgW, imgH, cols, rows, zoom, pan) {
  const FW = cols * TW + 2 * OVX;    // bled fit width
  const FH = rows * PH;              // no vertical bleed
  const r = coverRect(imgW, imgH, FW, FH, zoom, pan); // f-coords, f_x=0 at bled-left
  return { FW, FH, r };
}

/* ---------- generate sliced PNGs ---------- */
function generateSlices(img, { cols, rows, zoom, pan }) {
  const { r } = gridLayout(img.naturalWidth, img.naturalHeight, cols, rows, zoom, pan);
  const out = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cv = document.createElement("canvas");
      cv.width = PW; cv.height = PH;
      const ctx = cv.getContext("2d");
      // post left at f_x = col*TW ; post top at f_y = row*PH
      ctx.drawImage(img, r.x - col * TW, r.y - row * PH, r.w, r.h);
      out.push({ url: cv.toDataURL("image/png"), index: row * cols + col, row, col });
    }
  }
  return out;
}

/* ---------- bottom-right logo watermark (free tier) ----------
   The Splitgram favicon's three bars, in white, with the lime tile dropped.
   A soft shadow keeps the white mark legible over light photos. */
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function stampWatermark(ctx, W, H) {
  // bars in the favicon's 64×64 space; bounding box x:16.25–47.75, y:14–50
  const BARS = [
    { x: 16.25, y: 18, w: 7, h: 28, r: 3.5 },
    { x: 28.5,  y: 14, w: 7, h: 36, r: 3.5 },
    { x: 40.75, y: 22, w: 7, h: 20, r: 3.5 },
  ];
  const RIGHT = 47.75, BOTTOM = 50;
  ctx.save();
  // equal pixel inset on the right and bottom so the mark sits in a true corner
  const margin = Math.round(H * 0.04);
  const markH = H * 0.058;               // mark height relative to slice
  const s = markH / 36;                  // logo-units → canvas px
  const ox = W - margin - RIGHT * s;
  const oy = H - margin - BOTTOM * s;
  ctx.globalAlpha = 0.9;
  ctx.shadowColor = "rgba(0,0,0,0.32)";
  ctx.shadowBlur = markH * 0.18;
  ctx.shadowOffsetY = markH * 0.04;
  ctx.fillStyle = "#FFFFFF";
  BARS.forEach((b) => {
    roundRectPath(ctx, ox + b.x * s, oy + b.y * s, b.w * s, b.h * s, b.r * s);
    ctx.fill();
  });
  ctx.restore();
}

/* ---------- render one slice for DOWNLOAD (resolution + watermark gated) ----------
   pro=true  → full 1080×1350, clean
   pro=false → 720px wide (downscaled), diagonal watermark */
function renderDownloadURL(img, { cols, rows, zoom, pan }, col, row, pro) {
  const { r } = gridLayout(img.naturalWidth, img.naturalHeight, cols, rows, zoom, pan);
  const sc = pro ? 1 : 720 / PW;
  const W = Math.round(PW * sc), H = Math.round(PH * sc);
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, (r.x - col * TW) * sc, (r.y - row * PH) * sc, r.w * sc, r.h * sc);
  // free tier: white logo mark on the 3rd / bottom-right slice only
  if (!pro && col === cols - 1 && row === rows - 1) stampWatermark(ctx, W, H);
  return cv.toDataURL("image/png");
}

/* ---------- demo gradient image (wide banner) ---------- */
function makeDemoImage() {
  return new Promise((resolve) => {
    const W = 2520, H = 1080;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");

    // brand-aligned continuous sky (cream -> peach -> coral)
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#FFF3D8");
    sky.addColorStop(0.45, "#FFD89B");
    sky.addColorStop(0.78, "#FF9E7A");
    sky.addColorStop(1, "#FF7E8F");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // big lime sun — sits across a cut so continuity is obvious
    const sx = W * 0.30, sy = H * 0.40, sr = 190;
    const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 2.4);
    halo.addColorStop(0, "#CCFF0066"); halo.addColorStop(1, "transparent");
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(sx, sy, sr * 2.4, 0, 7); ctx.fill();
    ctx.fillStyle = "#D8FF5E"; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 7); ctx.fill();

    // soft clouds (continuous shapes spanning the width)
    ctx.fillStyle = "#FFFFFF66";
    const cloud = (cx, cy, s) => {
      [[0,0,1],[0.9,0.1,0.8],[-0.9,0.12,0.75],[0.45,-0.2,0.7],[-0.45,-0.18,0.66]].forEach(([dx,dy,r])=>{
        ctx.beginPath(); ctx.arc(cx+dx*s, cy+dy*s, r*s*0.6, 0, 7); ctx.fill();
      });
    };
    cloud(W*0.62, H*0.24, 150); cloud(W*0.86, H*0.34, 120); cloud(W*0.12, H*0.18, 110);

    // rolling hills — single continuous silhouettes across the whole banner
    const hill = (color, base, amp, freq, phase) => {
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 12) {
        const y = base + Math.sin((x / W) * Math.PI * freq + phase) * amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    };
    hill("#FF8FB0", H * 0.66, 60, 2.2, 0.4);
    hill("#E0608F", H * 0.76, 75, 1.6, 2.1);
    hill("#8E3A6B", H * 0.88, 55, 1.2, 4.0);

    const im = new Image();
    im.onload = () => resolve(im);
    im.src = cv.toDataURL();
  });
}

/* ---------- tiny inline icons ---------- */
const Icon = ({ d, size = 18, fill = "none", stroke = "currentColor", sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IconHeart = (p) => <Icon {...p} d={<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1.1 1L12 21l7.8-7.7 1-1a5.5 5.5 0 0 0 0-7.8z" />} />;
const IconComment = (p) => <Icon {...p} d={<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-4-1L3 20l1.1-4.5A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" />} />;
const IconSend = (p) => <Icon {...p} d={<g><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" /></g>} />;
const IconBookmark = (p) => <Icon {...p} d={<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />} />;
const IconDownload = (p) => <Icon {...p} d={<g><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></g>} />;
const IconUpload = (p) => <Icon {...p} d={<g><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></g>} />;
const IconPhotos = (p) => <Icon {...p} d={<g><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.6" /><path d="M21 15l-5-5L5 21" /></g>} />;
const IconZoomIn = (p) => <Icon {...p} d={<g><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4M11 8v6M8 11h6" /></g>} />;
const IconZoomOut = (p) => <Icon {...p} d={<g><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4M8 11h6" /></g>} />;
const IconRecenter = (p) => <Icon {...p} d={<g><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></g>} />;
const IconLock = (p) => <Icon {...p} d={<g><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></g>} />;
const IconCheck = (p) => <Icon {...p} d={<path d="M20 6 9 17l-5-5" />} />;
const IconSparkle = (p) => <Icon {...p} d={<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />} />;
const IconClose = (p) => <Icon {...p} d={<path d="M18 6 6 18M6 6l12 12" />} />;

/* ---------- Workspace frame (drag + zoom + cut-line overlay) ----------
   The frame shows the seamless thumbnail grid (the clean cut of the
   source). Each exported post bleeds OVX px horizontally beyond it. */
function Workspace({ img, cols, rows, zoom, pan, setPan, setZoom, cellUrls }) {
  const wrapRef = useRef(null);
  const frameRef = useRef(null);
  const [disp, setDisp] = useState({ w: 0, h: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);

  const frameAspect = (cols * TW) / (rows * PH); // thumbnail grid → w/h

  // fit frame inside wrapper
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      // honour the canvas's own CSS padding so the frame fits the content
      // box exactly (otherwise it renders too wide and drifts off-centre)
      const cs = getComputedStyle(el);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const aw = el.clientWidth - padX;
      const ah = el.clientHeight - padY;
      if (aw <= 0 || ah <= 0) return; // not laid out yet — wait for ResizeObserver
      let w = aw, h = w / frameAspect;
      if (h > ah) { h = ah; w = h * frameAspect; }
      setDisp({ w, h });
    };
    fit();
    requestAnimationFrame(fit); // catch the empty→image mount transition
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [frameAspect]);

  const ready = disp.w > 0 && disp.h > 0;

  const dispScale = disp.w / (cols * TW);
  const rt = img ? gridLayout(img.naturalWidth, img.naturalHeight, cols, rows, zoom, pan).r : null;
  // display rect: thumbnail grid left sits at f_x = OVX within the bled fit region
  const rect = rt ? { w: rt.w * dispScale, h: rt.h * dispScale, x: (rt.x - OVX) * dispScale, y: rt.y * dispScale } : null;

  const clampPan = useCallback((p) => ({
    x: Math.max(-1, Math.min(1, p.x)),
    y: Math.max(-1, Math.min(1, p.y)),
  }), []);

  const onDown = (e) => {
    if (!rt) return;
    // NOTE: do NOT preventDefault here — that would cancel iOS's native
    // long-press callout (Share / Save to Photos) on the per-cell images.
    const pt = e.touches ? e.touches[0] : e;
    drag.current = {
      sx: pt.clientX, sy: pt.clientY, pan: { ...pan }, ovX: rt.ovX, ovY: rt.ovY, sc: dispScale,
    };
  };
  const onMove = useCallback((e) => {
    const d = drag.current; if (!d) return;
    const pt = e.touches ? e.touches[0] : e;
    if (e.cancelable) e.preventDefault();
    // first real movement → enter drag mode (hides the long-press overlays so
    // the live composite pans smoothly)
    if (Math.hypot(pt.clientX - d.sx, pt.clientY - d.sy) > 6) {
      setDragging(true);
      frameRef.current?.classList.add("grabbing");
    }
    const dx = (pt.clientX - d.sx) / d.sc, dy = (pt.clientY - d.sy) / d.sc; // → tile px
    const nx = d.ovX > 0.5 ? d.pan.x - (2 * dx) / d.ovX : 0;
    const ny = d.ovY > 0.5 ? d.pan.y - (2 * dy) / d.ovY : 0;
    setPan(clampPan({ x: nx, y: ny }));
  }, [setPan, clampPan]);
  const onUp = useCallback(() => {
    drag.current = null;
    setDragging(false);
    frameRef.current?.classList.remove("grabbing");
  }, []);
  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [onMove, onUp]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    setZoom((z) => Math.max(1, Math.min(4, z - e.deltaY * 0.0016)));
  }, [setZoom]);

  // attach wheel as a NON-passive native listener so preventDefault works
  // (React's onWheel is passive → the page would scroll while zooming).
  useEffect(() => {
    const el = frameRef.current;
    if (!el || !img) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel, img]);

  // grid line positions
  const vs = []; for (let c = 1; c < cols; c++) vs.push((disp.w / cols) * c);
  const hs = []; for (let r = 1; r < rows; r++) hs.push((disp.h / rows) * r);

  return (
    <div className="stage-canvas" ref={wrapRef}>
      <div
        ref={frameRef}
        className="frame"
        style={{ width: disp.w, height: disp.h, visibility: ready ? "visible" : "hidden" }}
        onMouseDown={onDown} onTouchStart={onDown}
      >
        {img && rect && (
          <img className="frame-base" src={img.src} alt="" draggable="false"
               style={{ width: rect.w, height: rect.h, transform: `translate(${rect.x}px, ${rect.y}px)` }} />
        )}
        {/* Per-cell real images: iOS long-press shows the native callout
            (Save to Photos / Share / Copy). Hidden while dragging so the live
            composite below pans smoothly. */}
        {!dragging && cellUrls && Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const idx = r * cols + c;
            const u = cellUrls[idx];
            if (!u) return null;
            return (
              <img key={"cell" + idx} className="cell-img" src={u} alt={`slice ${idx + 1}`}
                   style={{ left: (disp.w / cols) * c, top: (disp.h / rows) * r,
                            width: disp.w / cols, height: disp.h / rows }} />
            );
          })
        )}
        <div className="grid-lines">
          {vs.map((x, i) => <span key={"v" + i} className="gl v" style={{ left: x }} />)}
          {hs.map((y, i) => <span key={"h" + i} className="gl h" style={{ top: y }} />)}
        </div>
        {/* per-cell index badges */}
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => (
            <span key={r + "-" + c} className="cell-badge"
                  style={{ left: (disp.w / cols) * c + 6, top: (disp.h / rows) * r + 6 }}>
              {r * cols + c + 1}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

/* ---------- phone carousel preview (full 4:5 slides) ---------- */
function PhonePreview({ slices }) {
  const [i, setI] = useState(0);
  const n = slices.length;
  useEffect(() => { setI(0); }, [n]);
  const ar = 4 / 5;
  const idx = Math.min(i, Math.max(0, n - 1));
  return (
    <div className="phone">
      <div className="phone-screen">
        <div className="ig-head">
          <div className="ig-avatar"><i></i></div>
          <div className="ig-user">your.handle<small>Original audio</small></div>
          <div className="ig-more">•••</div>
        </div>
        <div className="ig-media" style={{ aspectRatio: ar }}>
          <div className="ig-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
            {slices.length
              ? slices.map((s) => <img key={s.index} src={s.url} alt="" />)
              : <div style={{ width: "100%", height: "100%", background: "#1a1a1f" }} />}
          </div>
          {n > 1 && <div className="ig-count">{idx + 1}/{n}</div>}
          <button className="ig-arrow l" disabled={idx <= 0} onClick={() => setI(idx - 1)}>‹</button>
          <button className="ig-arrow r" disabled={idx >= n - 1} onClick={() => setI(idx + 1)}>›</button>
        </div>
        <div className="ig-actions">
          <IconHeart size={21} /><IconComment size={21} /><IconSend size={21} />
          <span className="sp"></span><IconBookmark size={21} />
        </div>
        {n > 1 && <div className="ig-dots">{slices.map((s, k) => <i key={k} className={k === idx ? "on" : ""} />)}</div>}
        <div className="ig-caption"><b>your.handle</b> {(window.tr ? window.tr('ig_caption') : 'swipe to see the full picture →')}</div>
      </div>
    </div>
  );
}

/* ---------- profile grid preview ---------- */
function GridPreview({ slices }) {
  const cells = [...slices];
  while (cells.length % 3 !== 0) cells.push(null);
  return (
    <div className="ig-grid">
      {cells.map((s, k) => s
        ? <img key={k} src={s.url} alt="" />
        : <div key={k} className="empty" />)}
    </div>
  );
}

Object.assign(window, {
  CELL, cellAspectRatio, coverRect, generateSlices, renderDownloadURL, makeDemoImage,
  Icon, IconHeart, IconComment, IconSend, IconBookmark, IconDownload,
  IconUpload, IconPhotos, IconZoomIn, IconZoomOut, IconRecenter,
  IconLock, IconCheck, IconSparkle, IconClose,
  Workspace, PhonePreview, GridPreview,
});
