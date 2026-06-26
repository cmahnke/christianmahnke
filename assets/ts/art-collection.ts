interface Artwork {
  width: number;
  height: number;
  aspectRatio: number;
  title: string;
  href: string;
  imgSrc: string;
  imgAlt: string;
  subTitle: string;
  postEl: HTMLElement;
}

interface FrameStyle {
  paletteIndex: number;
  outerWidth: number;
  innerWidth: number;
  patternType: "solid" | "grooved" | "double";
}

interface RowLayout {
  artworks: Artwork[];
  rowHeight: number;
}

// ─── Konfiguration ────────────────────────────────────────────────────────────

const CONFIG = {
  MIN_GAP_PX:        25,
  TARGET_HEIGHT:     280,
  CAPTION_HEIGHT_PX: 28,   // Höhe der Bildunterschrift (inkl. etwas Luft)
  PADDING:           48,
};

// ─── Seeded Random ────────────────────────────────────────────────────────────

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Frame-Paletten ───────────────────────────────────────────────────────────

const FRAME_PALETTES = [
  { outer: "#5C3D0A", mid: "#8B6914", inner: "#C8A951", highlight: "#E8D080" },
  { outer: "#4A3008", mid: "#7A5C1A", inner: "#B08030", highlight: "#D4AA50" },
  { outer: "#3A3F48", mid: "#6B7280", inner: "#A8B4C0", highlight: "#D0DCE8" },
  { outer: "#1A0F08", mid: "#3D2B1F", inner: "#6B4028", highlight: "#8B5C38" },
  { outer: "#4A3020", mid: "#7A5030", inner: "#A87848", highlight: "#C89868" },
  { outer: "#1A0808", mid: "#4A1010", inner: "#7A2020", highlight: "#A04040" },
  { outer: "#2A1808", mid: "#6B3010", inner: "#9B5020", highlight: "#C07840" },
  { outer: "#0A0A0A", mid: "#2A2010", inner: "#7A6020", highlight: "#B89040" },
  { outer: "#7A7858", mid: "#A09870", inner: "#C8BC90", highlight: "#E8DEB0" },
  { outer: "#282830", mid: "#50505C", inner: "#888898", highlight: "#B8B8C8" },
];

function generateFrame(index: number): FrameStyle {
  const rng  = makeRng(index * 6971 + 42);
  const types: FrameStyle["patternType"][] = ["solid", "grooved", "double"];
  return {
    paletteIndex: index % FRAME_PALETTES.length,
    outerWidth:   10 + Math.floor(rng() * 22),
    innerWidth:   3  + Math.floor(rng() * 9),
    patternType:  types[Math.floor(rng() * types.length)],
  };
}

// ─── SVG-Rahmen aus Trapezen ──────────────────────────────────────────────────

function buildFrameSvg(
  frame: FrameStyle,
  imgW: number,
  imgH: number,
  index: number,
): SVGSVGElement {
  const ns = "http://www.w3.org/2000/svg";
  const { outerWidth, innerWidth, patternType, paletteIndex } = frame;
  const palette = FRAME_PALETTES[paletteIndex];
  const pad = outerWidth + innerWidth;
  const W   = imgW + 2 * pad;
  const H   = imgH + 2 * pad;
  const ow  = outerWidth;

  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width",  String(W));
  svg.setAttribute("height", String(H));
  svg.style.cssText = `
    position: absolute;
    top: 0; left: 0;
    pointer-events: none;
    z-index: 10;
    overflow: visible;
  `;

  const defs = document.createElementNS(ns, "defs");

  function makeGrad(
    id: string,
    x1: string, y1: string, x2: string, y2: string,
    stops: [number, string][],
  ) {
    const g = document.createElementNS(ns, "linearGradient");
    g.setAttribute("id", id);
    g.setAttribute("x1", x1); g.setAttribute("y1", y1);
    g.setAttribute("x2", x2); g.setAttribute("y2", y2);
    g.setAttribute("gradientUnits", "objectBoundingBox");
    stops.forEach(([offset, color]) => {
      const s = document.createElementNS(ns, "stop");
      s.setAttribute("offset",     String(offset));
      s.setAttribute("stop-color", color);
      g.appendChild(s);
    });
    defs.appendChild(g);
  }

  const hi   = palette.highlight;
  const mid  = palette.mid;
  const dark = palette.outer;
  const inn  = palette.inner;

  makeGrad(`gt${index}`, "0","0","0","1", [[0,hi],[0.45,inn],[1,mid]]);
  makeGrad(`gb${index}`, "0","0","0","1", [[0,mid],[0.5,dark],[1,dark]]);
  makeGrad(`gl${index}`, "0","0","1","0", [[0,hi],[0.5,inn],[1,mid]]);
  makeGrad(`gr${index}`, "0","0","1","0", [[0,mid],[0.5,dark],[1,dark]]);

  makeGrad(`git${index}`, "0","0","0","1", [[0,inn],[1,mid]]);
  makeGrad(`gib${index}`, "0","0","0","1", [[0,mid],[1,dark]]);
  makeGrad(`gil${index}`, "0","0","1","0", [[0,inn],[1,mid]]);
  makeGrad(`gir${index}`, "0","0","1","0", [[0,mid],[1,dark]]);

  svg.appendChild(defs);

  function poly(pts: [number,number][], fill: string, opacity = 1) {
    const el = document.createElementNS(ns, "polygon");
    el.setAttribute("points",  pts.map(([x,y]) => `${x},${y}`).join(" "));
    el.setAttribute("fill",    fill);
    el.setAttribute("opacity", String(opacity));
    svg.appendChild(el);
  }

  function pline(
    pts: [number,number][],
    stroke: string, sw: number, opacity = 1,
  ) {
    const el = document.createElementNS(ns, "polyline");
    el.setAttribute("points",       pts.map(([x,y]) => `${x},${y}`).join(" "));
    el.setAttribute("fill",         "none");
    el.setAttribute("stroke",       stroke);
    el.setAttribute("stroke-width", String(sw));
    el.setAttribute("opacity",      String(opacity));
    svg.appendChild(el);
  }

  // Außenleiste
  poly([[0,0],[W,0],[W-ow,ow],[ow,ow]],                   `url(#gt${index})`);
  poly([[0,H],[W,H],[W-ow,H-ow],[ow,H-ow]],               `url(#gb${index})`);
  poly([[0,0],[ow,ow],[ow,H-ow],[0,H]],                    `url(#gl${index})`);
  poly([[W,0],[W-ow,ow],[W-ow,H-ow],[W,H]],                `url(#gr${index})`);

  // Innenleiste
  poly([[ow,ow],[W-ow,ow],[W-pad,pad],[pad,pad]],           `url(#git${index})`);
  poly([[ow,H-ow],[W-ow,H-ow],[W-pad,H-pad],[pad,H-pad]],  `url(#gib${index})`);
  poly([[ow,ow],[pad,pad],[pad,H-pad],[ow,H-ow]],           `url(#gil${index})`);
  poly([[W-ow,ow],[W-pad,pad],[W-pad,H-pad],[W-ow,H-ow]],  `url(#gir${index})`);

  // Muster
  if (patternType === "grooved") {
    for (let k = 1; k <= 3; k++) {
      const t  = (k / 4) * ow;
      const c  = k % 2 === 0 ? "rgba(0,0,0,1)" : "rgba(255,255,255,1)";
      const op = k % 2 === 0 ? 0.20 : 0.13;
      pline([[t,t],[W-t,t]],     c, 0.7, op);
      pline([[t,H-t],[W-t,H-t]], c, 0.7, op);
      pline([[t,t],[t,H-t]],     c, 0.7, op);
      pline([[W-t,t],[W-t,H-t]], c, 0.7, op);
    }
  }

  if (patternType === "double") {
    [0.28, 0.52].forEach((frac, idx) => {
      const t  = frac * ow;
      const c  = idx === 0 ? hi : dark;
      const op = idx === 0 ? 0.50 : 0.30;
      pline([[t,t],[W-t,t],[W-t,H-t],[t,H-t],[t,t]], c, 1.1, op);
    });
  }

  // Außenkanten-Glanzlichter
  pline([[0,0],[W,0]],   "rgba(255,255,255,0.28)", 1.2);
  pline([[0,0],[0,H]],   "rgba(255,255,255,0.18)", 1.0);
  pline([[W,0],[W,H]],   "rgba(0,0,0,0.38)",       1.2);
  pline([[0,H],[W,H]],   "rgba(0,0,0,0.38)",       1.2);

  // Innenkante
  pline([[pad,pad],[W-pad,pad]],     "rgba(0,0,0,0.42)",       1.4);
  pline([[pad,pad],[pad,H-pad]],     "rgba(0,0,0,0.28)",       1.0);
  pline([[W-pad,pad],[W-pad,H-pad]], "rgba(255,255,255,0.10)", 0.8);
  pline([[pad,H-pad],[W-pad,H-pad]], "rgba(255,255,255,0.10)", 0.8);

  return svg;
}

// ─── Schatten ─────────────────────────────────────────────────────────────────
// Der Schatten liegt auf dem Wrapper (.post). Beim Hover skaliert der Wrapper
// via CSS-transform – der box-shadow skaliert dabei automatisch mit,
// da er Teil des Elements ist. Kein JS nötig.

function buildShadowEl(wrapW: number, wrapH: number): HTMLElement {
  const el = document.createElement("div");
  el.className = "ph-shadow";
  el.style.cssText = `
    position: absolute;
    top: 0; left: 0;
    width:  ${wrapW}px;
    height: ${wrapH}px;
    box-shadow:
      0  2px  6px  2px rgba(0,0,0,0.30),
      0  5px 16px  4px rgba(0,0,0,0.20),
      0 10px 32px  8px rgba(0,0,0,0.12);
    z-index: 0;
    pointer-events: none;
  `;
  return el;
}

// ─── Daten extrahieren ────────────────────────────────────────────────────────

function extractArtworks(): Artwork[] {
  const result: Artwork[] = [];
  document
    .querySelectorAll<HTMLElement>(".post")
    .forEach((postEl) => {
      const pic = postEl.querySelector<HTMLElement>(".post-preview picture");
      if (!pic) return;

      const w    = parseInt(pic.getAttribute("data-width")  || "1", 10);
      const h    = parseInt(pic.getAttribute("data-height") || "1", 10);
      const img  = pic.querySelector<HTMLImageElement>("img");
      const link = pic.querySelector<HTMLAnchorElement>("a");
      const sub  = postEl.querySelector<HTMLElement>(".sub-title");
      const id   = postEl.previousElementSibling.getAttribute("id");
      if (!img) return;

      result.push({
        width:       w,
        height:      h,
        aspectRatio: w / h,
        title:       img.alt,
        href:        link?.href ?? "#",
        imgSrc:      img.src,
        imgAlt:      img.alt,
        subTitle:    sub?.textContent?.trim() ?? "",
        id:          id,
        postEl,
      });
    });
  return result;
}

// ─── Pad für Index ────────────────────────────────────────────────────────────

function padForIndex(index: number): number {
  const f = generateFrame(index);
  return f.outerWidth + f.innerWidth;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function computeRows(
  artworks: Artwork[],
  containerWidth: number,
  targetHeight: number,
): RowLayout[] {
  const framedWidths = artworks.map((a, i) => {
    const p = padForIndex(i);
    return a.aspectRatio * targetHeight + 2 * p;
  });

  const rows: RowLayout[] = [];
  let start = 0;

  while (start < artworks.length) {
    let end = start + 1;
    while (end < artworks.length) {
      const totalW =
        framedWidths.slice(start, end + 1).reduce((s, w) => s + w, 0) +
        (end - start) * CONFIG.MIN_GAP_PX;
      if (totalW > containerWidth) break;
      end++;
    }

    const slice     = artworks.slice(start, end);
    const sliceFW   = framedWidths.slice(start, end);
    const framedSum = sliceFW.reduce((s, w) => s + w, 0);
    const totalW    = framedSum + (slice.length - 1) * CONFIG.MIN_GAP_PX;
    const isLast    = end >= artworks.length;
    const fillRatio = totalW / containerWidth;
    const scale     =
      isLast && fillRatio < 0.6
        ? 1
        : (containerWidth - (slice.length - 1) * CONFIG.MIN_GAP_PX) / framedSum;

    rows.push({ artworks: slice, rowHeight: targetHeight * scale });
    start = end;
  }
  return rows;
}

// ─── Galerie aufbauen ─────────────────────────────────────────────────────────

function buildGallery(artworks: Artwork[], postsEl: HTMLElement): void {
  const containerWidth = postsEl.clientWidth;
  const targetHeight   = Math.min(CONFIG.TARGET_HEIGHT, containerWidth * 0.35);
  const rows           = computeRows(artworks, containerWidth, targetHeight);

  // Zeilenabstand = MIN_GAP_PX + Höhe der Beschriftung
  const rowGap = CONFIG.MIN_GAP_PX + CONFIG.CAPTION_HEIGHT_PX;

  // Aufräumen: ph-Elemente + ph-row entfernen, .post zurücksetzen
  postsEl.querySelectorAll<HTMLElement>(".ph-shadow, .ph-frame").forEach(el => el.remove());
  postsEl.querySelectorAll<HTMLElement>(".ph-row").forEach(rowEl => {
    while (rowEl.firstChild) postsEl.insertBefore(rowEl.firstChild, rowEl);
    rowEl.remove();
  });
  artworks.forEach(({ postEl }) => {
    postEl.style.cssText          = "";
    postEl.onmouseenter           = null;
    postEl.onmouseleave           = null;
  });

  // .posts stylen
  postsEl.style.cssText = `
    width: 100%;
    box-sizing: border-box;
    padding: ${CONFIG.PADDING}px 0 ${CONFIG.PADDING * 1.5}px;
    overflow: visible;
    display: block;
  `;

  let globalIndex = 0;

  rows.forEach((row) => {
    const rowEl = document.createElement("div");
    rowEl.className = "ph-row";
    rowEl.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: ${CONFIG.MIN_GAP_PX}px;
      margin-bottom: ${rowGap}px;
      overflow: visible;
    `;

    const n = row.artworks.length;

    row.artworks.forEach((aw, i) => {
      const frame = generateFrame(globalIndex);
      const pad   = frame.outerWidth + frame.innerWidth;

      const distFromCenter =
        n > 1 ? Math.abs(i - (n - 1) / 2) / ((n - 1) / 2) : 0;
      const sizeBoost = 1 + distFromCenter * 0.07;

      const imgH  = row.rowHeight * sizeBoost;
      const imgW  = aw.aspectRatio * imgH;
      const wrapW = imgW + 2 * pad;
      const wrapH = imgH + 2 * pad;

      // ── .post als Wrapper ──
      const postEl = aw.postEl;

      // Höhe des Wrappers schließt Beschriftung ein, damit der Zeilenabstand
      // (rowGap) den Abstand zwischen Rahmen-Unterkante und Beschriftung
      // der nächsten Zeile korrekt abbildet.
      const totalWrapH = wrapH + CONFIG.CAPTION_HEIGHT_PX;

      postEl.style.cssText = `
        position: relative;
        flex-shrink: 0;
        width:  ${wrapW}px;
        height: ${totalWrapH}px;
        overflow: visible;
        cursor: pointer;
        transition: transform 0.35s ease;
      `;

      // Hover: translateY + dezenter Zoom.
      // box-shadow auf .ph-shadow skaliert automatisch mit dem transform
      // des Elternelements (.post) mit – kein separates Update nötig.
      postEl.addEventListener("mouseenter", () => {
        postEl.style.transform = "translateY(-3px) scale(1.015)";
      });
      postEl.addEventListener("mouseleave", () => {
        postEl.style.transform = "";
      });

      // 1. Schatten (skaliert automatisch mit .post)
      postEl.insertBefore(buildShadowEl(wrapW, wrapH), postEl.firstChild);

      // 2. .post-body ausblenden (enthält post-summary, post-title etc.)
      const postBody = postEl.querySelector<HTMLElement>(".post-body");
      if (postBody) postBody.style.display = "none";

      // 3. .post-preview aus .post-body herauslösen → direkt in .post
      const preview = postEl.querySelector<HTMLElement>(".post-preview");
      if (preview) {
        postEl.appendChild(preview);
        preview.setAttribute("id", aw.id);
        preview.style.cssText = `
          position: absolute;
          top:  ${pad}px;
          left: ${pad}px;
          width:  ${imgW}px;
          height: ${imgH}px;
          overflow: hidden;
          z-index: 1;
          margin: 0;
          padding: 0;
        `;

        // picture
        const picEl = preview.querySelector<HTMLElement>("picture");
        if (picEl) {
          picEl.style.cssText = `
            display: block;
            width:  ${imgW}px;
            height: ${imgH}px;
          `;
        }

        // img
        const imgEl = preview.querySelector<HTMLImageElement>("img");
        if (imgEl) {
          imgEl.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          `;
        }

        // .sub-title: unterhalb des Rahmens, relativ zum Wrapper
        const subTitle = preview.querySelector<HTMLElement>(".sub-title");
        if (subTitle) {
          // Aus .post-preview herauslösen → direkt in .post,
          // damit overflow:hidden der preview sie nicht abschneidet
          postEl.appendChild(subTitle);
          subTitle.style.cssText = `
            position: absolute;
            top:   ${wrapH + 6}px;
            left:  0;
            width: ${wrapW}px;
            height: ${CONFIG.CAPTION_HEIGHT_PX}px;
            text-align: center;
            font-size: 1.2rem;
            font-style: italic;
            letter-spacing: 0.04em;
            color: #383838;
            text-overflow: ellipsis;
            z-index: 5;
            margin: 0;
            padding: 0;
            display: block;
            mix-blend-mode: darken;
          `;
          /*
          white-space: nowrap;
          overflow: hidden;
          */
        }
      }

      // 4. SVG-Rahmen
      const svgFrame = buildFrameSvg(frame, imgW, imgH, globalIndex);
      svgFrame.classList.add("ph-frame");
      postEl.appendChild(svgFrame);

      rowEl.appendChild(postEl);
      globalIndex++;
    });

    postsEl.appendChild(rowEl);
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init(): void {
  document
    .querySelectorAll<HTMLElement>(".artist-header, .post-title, .post-summary")
    .forEach((el) => (el.style.display = "none"));

  const postsEl = document.querySelector<HTMLElement>(".posts");
  if (!postsEl) return;

  const artworks = extractArtworks();
  if (artworks.length === 0) return;

  const render = () => buildGallery(artworks, postsEl);
  render();

  document.querySelectorAll<HTMLElement>(".artist-header")
    .forEach((el) => (el.remove()));

  let timer: ReturnType<typeof setTimeout>;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(render, 250);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
