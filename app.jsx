/* app.jsx — main application */
const { useState: useS, useEffect: useE, useRef: useR, useMemo } = React;

const ACCENTS = ["#CCFF00", "#FFE633", "#FF8A5B", "#FF8FC7", "#7BE0D0"];

/* ---------- i18n (shares localStorage + detection with the static landing) ---------- */
let CUR_LANG = (window.SG && SG.getLang) ? SG.getLang() : "en";
const STR = {
  brand_tag:    { ja: "スプる · インスタ画像をキレイに分割", en: "Split Instagram photos, perfectly aligned" },
  nav_faq:      { ja: "使い方・FAQ", en: "How to · FAQ" },
  hint_move:    { ja: "移動", en: "move" },
  hint_zoom:    { ja: "ズーム", en: "zoom" },
  get_pro:      { ja: "Proにする", en: "Get Pro" },
  label_layout: { ja: "レイアウト", en: "Layout" },
  label_adjust: { ja: "調整", en: "Adjust" },
  field_rows:   { ja: "行 (rows)", en: "Rows" },
  ratio:        { ja: "比率", en: "Ratio" },
  pieces:       { ja: "枚に分割", en: "pieces" },
  grid:         { ja: "グリッド", en: "grid" },
  output:       { ja: "出力", en: "Output" },
  drop_drag:    { ja: "画像をドラッグ", en: "Drag an image" },
  drop_click:   { ja: "クリック", en: "click" },
  dz_title:     { ja: "画像をドロップ", en: "Drop an image" },
  dz_sub:       { ja: "横長バナーをスワイプ用カルーセルに、縦長写真をグリッドに。ここにドラッグ＆ドロップ、またはクリックで選択。", en: "Turn a wide banner into a swipeable carousel, or a tall photo into a grid. Drag & drop here, or click to choose." },
  clear_title:  { ja: "画像をやめる（クリア）", en: "Remove image (clear)" },
  coach:        { ja: "サンプル画像です。<b>自分の画像をドラッグ＆ドロップ</b>", en: "This is a sample image. <b>Drag &amp; drop your own</b>" },
  zoom_out:     { ja: "縮小", en: "Zoom out" },
  zoom_in:      { ja: "拡大", en: "Zoom in" },
  reset:        { ja: "リセット", en: "Reset" },
  saving:       { ja: "保存中…", en: "Saving…" },
  save_photos:  { ja: "{n}枚を写真に保存", en: "Save {n} to Photos" },
  save_all:     { ja: "{n}枚をまとめて保存", en: "Save all {n}" },
  seam_badge:   { ja: "開いても継ぎ目ピッタリ", en: "Seams stay aligned when opened" },
  results_hint: { ja: "各カットを長押し → 写真に保存", en: "Long-press each cut → Save to Photos" },
  results_note: { ja: "サムネは <b>3:4</b> で左右が少しトリミング、開くと <b>4:5</b> フル表示。各スライドは左右がわずかに重なって繋がります。", en: "Thumbnails crop slightly on the sides at <b>3:4</b>; opened, they show the full <b>4:5</b>. Each slide overlaps a little on the sides so they connect." },
  upsell:       { ja: "<b>Pro</b> で透かしなし・フル解像度", en: "<b>Pro</b>: no watermark, full resolution" },
  modal_title:  { ja: "透かしなし・フル解像度で書き出す", en: "Export with no watermark, full resolution" },
  modal_sub:    { ja: "無料版でも分割は使い放題。公開品質で書き出すときだけ Pro に。", en: "Splitting is unlimited on the free plan. Go Pro only when you export at publish quality." },
  plan_free:    { ja: "無料", en: "Free" },
  free1:        { ja: "全レイアウトで分割", en: "Split in every layout" },
  free2:        { ja: "グリッドプレビュー", en: "Grid preview" },
  free3:        { ja: "透かし入り", en: "With watermark" },
  free4:        { ja: "720px 書き出し", en: "720px export" },
  pro1:         { ja: "透かしなし", en: "No watermark" },
  pro2:         { ja: "フル解像度 1080×1350", en: "Full resolution 1080×1350" },
  pro3:         { ja: "投稿順に自動リネーム", en: "Auto-named in post order" },
  pro4:         { ja: "商用利用OK", en: "Commercial use OK" },
  buy_btn:      { ja: "Pro を購入（¥500 買い切り）", en: "Buy Pro (¥500 one-time)" },
  code_ph:      { ja: "購入後のライセンスキーを入力", en: "Enter your license key after purchase" },
  unlock:       { ja: "解除", en: "Unlock" },
  checking:     { ja: "確認中…", en: "Checking…" },
  code_help:    { ja: "購入するとメールとダウンロードページにキーが届きます。", en: "After purchase, your key arrives by email and on the download page." },
  err_store:    { ja: "ストア未設定です（コードのみ有効）", en: "Store not configured (codes only)" },
  err_net:      { ja: "通信エラー。オンライン状態をご確認ください。", en: "Network error. Please check your connection." },
  err_verify:   { ja: "ライセンスキーが確認できませんでした", en: "Couldn't verify that license key." },
  tw_style:     { ja: "スタイル", en: "Style" },
  tw_accent:    { ja: "アクセント", en: "Accent" },
  tw_guides:    { ja: "分割ガイド線", en: "Guide lines" },
  tw_texture:   { ja: "背景のストライプ", en: "Background stripes" },
  ig_caption:   { ja: "スワイプで全体が見える →", en: "swipe to see the full picture →" }
};
function tr(k) { const e = STR[k]; return e ? (e[CUR_LANG] || e.en) : k; }
window.tr = tr;

const PRESETS = [
  { id: "g31", name: "3 × 1", size: "3240×1350", ratio: "12:5", cols: 3, rows: 1 },
  { id: "g32", name: "3 × 2", size: "3240×2700", ratio: "6:5", cols: 3, rows: 2 },
  { id: "g33", name: "3 × 3", size: "3240×4050", ratio: "4:5", cols: 3, rows: 3 },
  { id: "g34", name: "3 × 4", size: "3240×5400", ratio: "3:5", cols: 3, rows: 4 },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#CCFF00",
  "texture": true,
  "guides": "thin"
}/*EDITMODE-END*/;

function MiniGlyph({ cols, rows }) {
  return (
    <div className="mini" style={{ gridTemplateColumns: `repeat(${cols},1fr)`, gridTemplateRows: `repeat(${rows},1fr)` }}>
      {Array.from({ length: cols * rows }).map((_, i) => <i key={i} />)}
    </div>
  );
}

/* ---------- Pro / freemium ----------
   購入→ライセンスキー発行→入力で解除、を Gumroad で自動化。
   ▼ 設定：商品を作ったら下の値を差し替えるだけ。
     1) Content（コンテンツ）ページ → Insert → 「License key」を追加してON
     2) そのライセンスキー欄を展開すると出る Product ID を productId に
        （2023/1/9以降の商品は permalink ではなく product_id が必須）
     3) buyUrl は購入ページのURL（gumroad.com/l/____ など）
   PRO_CODES はオフライン用の予備コード（自分用・配布用）。 */
const GUMROAD = {
  productId: "241zt4EBzF7gzpZ0oIW4hA==",               // ← ライセンスキー欄を展開して出る Product ID
  buyUrl: "https://llkeill.gumroad.com/l/splitgrampro", // ← 購入ページURL（¥500買い切り想定）
};
const PRO_CODES = []; // offline codes are not published
const PRO_KEY = "splitgram_pro_v1";
const LIC_KEY = "splitgram_license_v1";
function readPro() { try { return localStorage.getItem(PRO_KEY) === "1"; } catch (e) { return false; } }
function writePro(v, key) {
  try {
    localStorage.setItem(PRO_KEY, v ? "1" : "0");
    if (key) localStorage.setItem(LIC_KEY, key);
  } catch (e) {}
}

/* Verify a Gumroad license key from the browser (no secret needed).
   URLSearchParams keeps it a "simple request" → no CORS preflight. */
async function verifyGumroad(key) {
  const body = new URLSearchParams();
  body.append("product_id", GUMROAD.productId);
  body.append("license_key", key);
  body.append("increment_uses_count", "false");
  const res = await fetch("https://api.gumroad.com/v2/licenses/verify", { method: "POST", body });
  const data = await res.json();
  // refunded / chargebacked / disputed purchases are rejected
  if (data && data.success && data.purchase &&
      !data.purchase.refunded && !data.purchase.chargebacked && !data.purchase.disputed) {
    return { ok: true };
  }
  return { ok: false, message: (data && data.message) || tr('err_verify') };
}

function UpgradeModal({ onClose, onUnlock }) {
  const [code, setCode] = useS("");
  const [err, setErr] = useS("");
  const [busy, setBusy] = useS(false);
  const submit = async () => {
    const key = code.trim();
    if (!key || busy) return;
    setErr("");
    // 1) offline backup codes
    if (PRO_CODES.includes(key.toUpperCase())) { onUnlock(key); return; }
    // 2) Gumroad license verification
    if (GUMROAD.productId === "YOUR_PRODUCT_ID") {
      setErr(tr('err_store')); return;
    }
    setBusy(true);
    try {
      const r = await verifyGumroad(key);
      if (r.ok) { onUnlock(key); }
      else { setErr(r.message); }
    } catch (e) {
      setErr(tr('err_net'));
    } finally { setBusy(false); }
  };
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose}><IconClose size={18} /></button>
        <div className="modal-badge"><IconSparkle size={15} stroke="#fff" /> Splitgram PRO</div>
        <h2 className="modal-title">{tr('modal_title')}</h2>
        <p className="modal-sub">{tr('modal_sub')}</p>
        <div className="plan-compare">
          <div className="plan">
            <div className="plan-name">{tr('plan_free')}</div>
            <ul>
              <li><IconCheck size={14} /> {tr('free1')}</li>
              <li><IconCheck size={14} /> {tr('free2')}</li>
              <li className="muted"><IconLock size={13} /> {tr('free3')}</li>
              <li className="muted"><IconLock size={13} /> {tr('free4')}</li>
            </ul>
          </div>
          <div className="plan pro">
            <div className="plan-name">Pro</div>
            <ul>
              <li><IconCheck size={14} /> {tr('pro1')}</li>
              <li><IconCheck size={14} /> {tr('pro2')}</li>
              <li><IconCheck size={14} /> {tr('pro3')}</li>
              <li><IconCheck size={14} /> {tr('pro4')}</li>
            </ul>
          </div>
        </div>
        <a className="btn btn-ig btn-block" href={GUMROAD.buyUrl} target="_blank" rel="noopener"
           onClick={() => window.sgTrack && sgTrack('buy_click', { place: 'pro_modal' })}>
          <IconSparkle size={15} /> {tr('buy_btn')}
        </a>
        <div className="code-row">
          <input className="code-input" placeholder={tr('code_ph')}
                 value={code} onChange={(e) => { setCode(e.target.value); setErr(""); }}
                 onKeyDown={(e) => e.key === "Enter" && submit()} />
          <button className="btn btn-ghost" onClick={submit} disabled={busy}>
            {busy ? tr('checking') : tr('unlock')}
          </button>
        </div>
        {err && <div className="code-err">{err}</div>}
        <div className="code-help">{tr('code_help')}</div>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [img, setImg] = useS(null);
  const [presetId, setPresetId] = useS("g31");
  const cols = 3; // fixed — Instagram profile grid is 3 wide
  const [rows, setRows] = useS(1);
  const [zoom, setZoom] = useS(1);
  const [pan, setPan] = useS({ x: 0, y: 0 });
  const [slices, setSlices] = useS([]);
  const [cellUrls, setCellUrls] = useS([]); // object URLs of full-res cell outputs (for native long-press menu)
  const [busy, setBusy] = useS(false);
  const [over, setOver] = useS(false);
  const [pro, setPro] = useS(readPro());
  const [showUpgrade, setShowUpgrade] = useS(false);
  const [lang, setLang] = useS(CUR_LANG);
  const [ownImg, setOwnImg] = useS(false);
  const fileRef = useR(null);
  const debRef = useR(null);
  const dlRef = useR([]); // pre-rendered full-res download blobs, kept ready for instant share

  const unlock = (key) => { writePro(true, key); setPro(true); setShowUpgrade(false); };
  const changeLang = (v) => { CUR_LANG = v; setLang(v); if (window.SG && SG.setLang) SG.setLang(v); else { try { localStorage.setItem("splitgram_lang", v); } catch (e) {} } };

  const clearPhoto = () => {
    setImg(null); setOwnImg(false); setSlices([]);
    setZoom(1); setPan({ x: 0, y: 0 });
  };

  // apply accent + texture + guides
  useE(() => {
    document.documentElement.style.setProperty("--accent", t.accent || "#CCFF00");
  }, [t.accent]);
  useE(() => {
    const s = document.getElementById("dyn-style") || (() => { const e = document.createElement("style"); e.id = "dyn-style"; document.head.appendChild(e); return e; })();
    s.textContent =
      `.stage-canvas{background-image:${t.texture ? "repeating-linear-gradient(45deg,var(--paper-2) 0 14px,transparent 14px 28px)" : "none"} !important;}` +
      `.grid-lines .gl{${t.guides === "thin" ? "box-shadow:0 0 0 0.5px var(--ink);" : t.guides === "off" ? "display:none;" : ""}}` +
      `${t.guides === "thin" ? ".grid-lines .gl.v{width:1px;}.grid-lines .gl.h{height:1px;}" : ""}`;
  }, [t.texture, t.guides]);

  // load demo image on first mount
  useE(() => { makeDemoImage().then(setImg); }, []);

  // sync preset → rows (cols fixed at 3)
  const applyPreset = (p) => {
    setPresetId(p.id);
    setRows(p.rows);
  };

  // when rows changed manually, switch preset highlight
  useE(() => {
    const match = PRESETS.find((p) => p.cols === cols && p.rows === rows);
    setPresetId(match ? match.id : "cust");
  }, [rows]);

  // debounced slice generation
  useE(() => {
    if (!img) return;
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => {
      const out = generateSlices(img, { cols, rows, pad: 0, bg: "", zoom, pan });
      setSlices(out);
      // Pre-render full-res download blobs NOW (off the gesture path). At tap
      // time the handler only builds a File + calls navigator.share, so iOS
      // keeps the user-activation valid and the share sheet opens reliably.
      dlRef.current = out.map((s) => ({
        index: s.index, row: s.row, col: s.col,
        blob: dataURLtoBlob(renderDownloadURL(img, { cols, rows, zoom, pan }, s.col, s.row, pro)),
      }));
      // Object URLs of the full-res outputs, ordered by cell index, so each
      // workspace cell is a real <img> the OS can long-press → "Save to Photos".
      setCellUrls((prev) => {
        prev.forEach((u) => u && URL.revokeObjectURL(u));
        const arr = [];
        dlRef.current.forEach((it) => { arr[it.index] = URL.createObjectURL(it.blob); });
        return arr;
      });
    }, 180);
    return () => clearTimeout(debRef.current);
  }, [img, rows, zoom, pan, pro]);

  const loadFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { setImg(im); setOwnImg(true); setPan({ x: 0, y: 0 }); setZoom(1);
      window.sgTrack && sgTrack('image_loaded', { cols, rows }); };
    im.src = url;
  };

  const onDrop = (e) => {
    e.preventDefault(); setOver(false); dragDepth.current = 0;
    const f = e.dataTransfer.files[0]; loadFile(f);
  };
  // app-wide drag overlay (counter avoids flicker when crossing children)
  const dragDepth = useR(0);
  const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes("Files");
  const onDragEnter = (e) => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth.current++; setOver(true); };
  const onDragOver = (e) => { if (hasFiles(e)) e.preventDefault(); };
  const onDragLeave = (e) => { if (!hasFiles(e)) return; dragDepth.current = Math.max(0, dragDepth.current - 1); if (dragDepth.current === 0) setOver(false); };

  const total = cols * rows;

  // data: URL -> Blob so the browser reliably honors the download filename
  // (some browsers ignore `download` on long data: URLs).
  const dataURLtoBlob = (dataURL) => {
    const [head, b64] = dataURL.split(",");
    const mime = (head.match(/:(.*?);/) || [])[1] || "image/png";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const saveBlob = (blob, filename) => {
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 4000);
  };

  // Build every slice as a {file, blob, name} in UPLOAD order from the
  // pre-rendered blobs. Instagram shows the newest post top-left, so to tile a
  // grid in reading order you upload in REVERSE (last cell first). For a single
  // row the upload order is just left→right.
  const buildSliceFiles = () => {
    const base = (dlRef.current && dlRef.current.length)
      ? dlRef.current
      : slices.map((s) => ({
          index: s.index, row: s.row, col: s.col,
          blob: dataURLtoBlob(renderDownloadURL(img, { cols, rows, zoom, pan }, s.col, s.row, pro)),
        }));
    const uploadOrder = rows > 1 ? [...base].reverse() : [...base];
    return uploadOrder.map((it, i) => {
      const name = `splitgram_${String(i + 1).padStart(2, "0")}_r${it.row + 1}c${it.col + 1}${pro ? "" : "_free"}.png`;
      return { blob: it.blob, name, file: new File([it.blob], name, { type: "image/png" }) };
    });
  };

  // Save sequentially to the device (one download per file).
  const saveSequential = async (items) => {
    for (let i = 0; i < items.length; i++) {
      saveBlob(items[i].blob, items[i].name);
      await new Promise((r) => setTimeout(r, 350)); // let each download register
    }
  };

  // Should we offer "save to Photos" (share sheet) instead of a ZIP?
  // KEY: don't gate on navigator.canShare({files}) — Chrome for iOS (and some
  // iOS versions) return false there even though navigator.share({files})
  // works fine. Instead: offer share whenever this is a touch device that has
  // navigator.share, then ATTEMPT the share and fall back only if it throws.
  const detectShareable = () => {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
    const ua = navigator.userAgent || "";
    const touch = (navigator.maxTouchPoints || 0) > 0 ||
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
      /iPhone|iPad|iPod|Android/i.test(ua) ||
      (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1); // iPadOS desktop UA
    // also true if the browser explicitly says it can share files
    let canFiles = false;
    try {
      const probe = new File([new Blob(["x"], { type: "image/png" })], "p.png", { type: "image/png" });
      canFiles = !!(navigator.canShare && navigator.canShare({ files: [probe] }));
    } catch (e) {}
    return touch || canFiles;
  };
  const [shareable, setShareable] = useS(false);
  useE(() => { setShareable(detectShareable()); }, []);

  // Hand images to the OS share sheet → "Save Image(s)" drops them into the
  // camera roll. Attempt the share directly; only report failure on a real
  // (non-cancel) throw so the caller can fall back to a plain save.
  const shareFiles = async (files) => {
    // Some browsers expose canShare and will reject up front — respect that,
    // but if canShare is missing/false we still TRY (Chrome iOS lies).
    if (navigator.canShare && !navigator.canShare({ files })) {
      // canShare says no — but only trust it when it exists AND we have no
      // other signal. Try anyway; iOS often shares fine despite a false here.
    }
    try {
      await navigator.share({ files });
      return true;
    } catch (e) {
      if (e && e.name === "AbortError") return true; // user cancelled — fine
      return false; // real failure → caller falls back
    }
  };
  // IMPORTANT: share ONLY files — no title/text/url. Adding text makes iOS
  // treat it as a link/text share and hides the "Save Image(s)" → Photos action.
  const shareToPhotos = async (items) => shareFiles(items.map((it) => it.file));

  const downloadAll = async () => {
    if (!slices.length || busy) return;
    window.sgTrack && sgTrack('export_images', { cols, rows, count: slices.length, pro: !!pro });
    setBusy(true);
    try {
      const items = buildSliceFiles();
      // Prefer the OS share sheet → Photos on touch devices.
      if (shareable) {
        const ok = await shareToPhotos(items);
        if (ok) return;
        // share genuinely failed → save the images one by one
        await saveSequential(items);
        return;
      }
      // Desktop / no share sheet: save each image directly (one per file).
      // No ZIP — it's clumsy on phones and an extra unzip step everywhere.
      await saveSequential(items);
    } finally { setBusy(false); }
  };

  return (
    <div className="app" onDragEnter={onDragEnter} onDragOver={onDragOver}
         onDragLeave={onDragLeave} onDrop={onDrop}>
      {over && (
        <div className="drop-overlay">
          <div className="drop-overlay-card">
            <div className="dz-icon"><IconUpload size={30} stroke="#fff" /></div>
            <div className="dz-title">ここにドロップして読み込み</div>
            <div className="dz-sub">PNG / JPG / WebP に対応</div>
          </div>
        </div>
      )}
      {/* top bar */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><span><i style={{ height: 17 }} /><i style={{ height: 22 }} /><i style={{ height: 12 }} /></span></div>
          <div>
            <div className="brand-name">Splitgram</div>
            <div className="brand-tag">{tr('brand_tag')}</div>
          </div>
        </div>
        <div className="topbar-spacer" />
        <a className="topbar-link" href="#about">{tr('nav_faq')}</a>
        <div className="topbar-hint"><kbd>drag</kbd> {tr('hint_move')} · <kbd>scroll</kbd> {tr('hint_zoom')}</div>
        <div className="lang-toggle" role="group" aria-label="Language">
          <button className={"lang-opt" + (lang === 'ja' ? ' on' : '')} onClick={() => changeLang('ja')}>JP</button>
          <button className={"lang-opt" + (lang === 'en' ? ' on' : '')} onClick={() => changeLang('en')}>EN</button>
        </div>
        {pro ? (
          <span className="pro-pill"><IconCheck size={13} /> PRO</span>
        ) : (
          <button className="btn btn-ig btn-sm" onClick={() => setShowUpgrade(true)}>
            <IconSparkle size={14} /> {tr('get_pro')}
          </button>
        )}
      </header>

      <div className="layout">
        {/* ---------- left controls ---------- */}
        <aside className="col">
          <div className="panel scroll panel-pad" style={{ flex: 1, minHeight: 0 }}>
            <div className="section-label">{tr('label_layout')}</div>
            <div className="preset-grid">
              {PRESETS.map((p) => (
                <button key={p.id} className={"preset" + (presetId === p.id ? " active" : "")} onClick={() => { applyPreset(p); window.sgTrack && sgTrack('layout_change', { preset: p.id, cols: p.cols, rows: p.rows }); }}>
                  <MiniGlyph cols={p.cols || cols} rows={p.rows || rows} />
                  <div className="p-name">{p.name}</div>
                  <div className="p-sub">{p.size}<span className="px">px</span></div>
                  <div className="p-ratio">{tr('ratio')} {p.ratio}</div>
                </button>
              ))}
            </div>

            <div style={{ height: 22 }} />
            <div className="section-label">{tr('label_adjust')}</div>

            <div className="field">
              <div className="field-head"><label>{tr('field_rows')}</label><span className="val">{rows}</span></div>
              <input type="range" min="1" max="5" step="1" value={rows} onChange={(e) => { setRows(+e.target.value); window.sgTrack && sgTrack('layout_change', { cols, rows: +e.target.value }); }} />
            </div>
          </div>
        </aside>

        {/* ---------- center stage ---------- */}
        <main className="col col-stage">
          <div className="panel stage-panel">
            <div className="stage-head">
              <div className="stage-title"><b>{total}</b> {tr('pieces')} · 3×{rows} {tr('grid')} <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-3)", verticalAlign: "middle" }}>v3</span></div>
              <span className="chip">{tr('output')} <b>1080×1350</b> · 4:5</span>
              <div className="spacer" />
              <button className="dropbtn" onClick={() => fileRef.current?.click()}>
                <IconUpload size={15} /> {tr('drop_drag')} <span className="dropbtn-or">/</span> {tr('drop_click')}
              </button>
              <input ref={fileRef} className="hidden-input" type="file" accept="image/*"
                     onChange={(e) => loadFile(e.target.files[0])} />
            </div>

            {img ? (
              <Workspace img={img} cols={cols} rows={rows}
                         zoom={zoom} pan={pan} setPan={setPan} setZoom={setZoom}
                         cellUrls={cellUrls} />
            ) : (              <div className="stage-canvas">
                <div className={"dropzone" + (over ? " over" : "")}
                     onClick={() => fileRef.current?.click()}>
                  <div className="dz-icon"><IconUpload size={26} stroke="#fff" /></div>
                  <div className="dz-title">{tr('dz_title')}</div>
                  <div className="dz-sub">{tr('dz_sub')}</div>
                </div>
              </div>
            )}

            {img && (
              <button className="clear-photo" onClick={clearPhoto} title={tr('clear_title')}>
                <IconClose size={16} />
              </button>
            )}

            {img && !ownImg && (
              <button className="drop-coach" onClick={() => fileRef.current?.click()}>
                <span className="drop-coach-ico"><IconUpload size={16} /></span>
                <span dangerouslySetInnerHTML={{ __html: tr('coach') }} />
              </button>
            )}

            <div className="stage-foot">
              <div className="foot-zoom">
                <button className="icon-btn" onClick={() => setZoom((z) => Math.max(1, z - 0.2))} title={tr('zoom_out')}><IconZoomOut size={16} /></button>
                <div className="zoomwrap">
                  <input type="range" min="1" max="4" step="0.02" value={zoom} onChange={(e) => setZoom(+e.target.value)} />
                </div>
                <button className="icon-btn" onClick={() => setZoom((z) => Math.min(4, z + 0.2))} title={tr('zoom_in')}><IconZoomIn size={16} /></button>
                <button className="icon-btn" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title={tr('reset')}><IconRecenter size={16} /></button>
              </div>
              <button className="btn btn-ig foot-dl" onClick={downloadAll} disabled={busy || !slices.length}>
                {shareable ? <IconPhotos size={15} /> : <IconDownload size={15} />}
                {busy ? tr('saving') : (shareable ? tr('save_photos') : tr('save_all')).replace('{n}', total)}
              </button>
            </div>

            {!!slices.length && (
              <div className="results">
                <div className="results-bar">
                  <span className="seam-badge"><IconCheck size={13} /> {tr('seam_badge')}</span>
                  <span className="spacer" />
                  <span className="results-hint">{tr('results_hint')}</span>
                </div>
                <div className="results-note" dangerouslySetInnerHTML={{ __html: tr('results_note') }} />
                {!pro && (
                  <button className="upsell" onClick={() => setShowUpgrade(true)}>
                    <IconSparkle size={15} />
                    <span dangerouslySetInnerHTML={{ __html: tr('upsell') }} />
                    <IconLock size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} onUnlock={unlock} />}

      {/* Tweaks */}
      <TweaksPanel>
        <TweakSection label={tr('tw_style')} />
        <TweakColor label={tr('tw_accent')} value={t.accent}
                    options={ACCENTS}
                    onChange={(v) => setTweak("accent", v)} />
        <TweakRadio label={tr('tw_guides')} value={t.guides}
                    options={["bold", "thin", "off"]}
                    onChange={(v) => setTweak("guides", v)} />
        <TweakToggle label={tr('tw_texture')} value={t.texture}
                     onChange={(v) => setTweak("texture", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
