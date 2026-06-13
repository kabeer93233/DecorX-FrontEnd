import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDisplayCategory } from '../utils/categoryUtils';
import { toast } from 'sonner';
import { RoomUploader } from '../components/ai/RoomUploader';
import { RoomInsightsPanel } from '../components/ai/RoomInsightsPanel';
import { PreviewCanvas, PlacedItem, CANVAS_W, CANVAS_H } from '../components/ai/PreviewCanvas';
import { FurnitureSelector } from '../components/ai/FurnitureSelector';
import { analyzeRoom, removeBackground, warmupBgRemoval, redesignRoom } from '../services/aiService';
import { RoomAnalysis } from '../types/ai';
import { useShop } from '../context/ShopContext';

// ── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  productName: string;
  category: string;
  price: number;
  image: string;
  width?: number;   // real-world cm
  height?: number;  // real-world cm
}

interface SmartItem extends PlacedItem {
  sourceUrl:     string;
  needsCleanup:  boolean;
  scaleTarget:   number;
  dominantColor: string;
  naturalW:      number;
  naturalH:      number;
  /** real-world dimensions (cm) kept for AI redesign calls */
  widthCm:  number;
  heightCm: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Reference room size for perspective-scale calculation.
// Using 560cm (5.6m) as effective room width makes the perspective scale
// match a typical room photo taken from one end — furniture occupies a
// realistic fraction of the canvas rather than filling it edge-to-edge.
const ROOM_W_CM = 560;
const ROOM_H_CM = 280;   // typical ceiling height in cm

// perspScale matches PreviewCanvas — items lower = bigger (closer to camera)
function perspScale(cy: number): number {
  return 0.55 + (cy / CANVAS_H) * 0.70;
}

// Per-category max rendered width (px) — keeps items from overwhelming the canvas
const MAX_FW: Record<string, number> = {
  sofa:       280, loveseat:  220, chair:  155,
  table:      230, stool:     110, bed:    310,
  cabinet:    220, rug:       420, mirror: 150,
  decoration:  65,
  'floor-lamp': 72, 'table-lamp': 62, pendant: 100,
};

// Default x-positions (fraction of CANVAS_W) when AI zones are not available
const DEFAULT_X: Record<string, number[]> = {
  sofa:        [0.22, 0.60],
  loveseat:    [0.25, 0.62],
  chair:       [0.72, 0.18, 0.82],
  table:       [0.38, 0.65],
  stool:       [0.58, 0.42],
  'floor-lamp':[0.82, 0.12],
  'table-lamp':[0.78, 0.14],
  pendant:     [0.48, 0.32],
  cabinet:     [0.07, 0.84],
  bed:         [0.38, 0.52],
  decoration:  [0.68, 0.28],
  rug:         [0.42, 0.50],
  mirror:      [0.12, 0.80],
};

interface PlacementParams {
  naturalW:        number;
  naturalH:        number;
  productWidthCm:  number;  // from DB, cm
  productHeightCm: number;  // from DB, cm
  aiZones?:        Record<string, { x: number; y: number }>;
  /** AI-supplied cy for the item center (used to derive placement depth) */
  overrideCy?:     number;
}

function getInstantPlacement(
  category: string,
  count: number,
  floorPct: number,
  params: PlacementParams,
) {
  const { naturalW, naturalH, productWidthCm, productHeightCm, aiZones, overrideCy } = params;
  const floorY  = floorPct * CANVAS_H;
  const aspect  = naturalH / Math.max(naturalW, 1);  // h/w ratio

  // If AI supplied a cy, derive the effective floor depth from it.
  // For floor items: cy = baseY - fh/2 → baseY ≈ cy + fh/2.
  // We use this baseY as the depth anchor for perspective scaling.
  const aiBaseY = overrideCy !== undefined
    ? Math.min(overrideCy + 60, CANVAS_H * 0.90)   // rough estimate, refined below
    : null;

  // ── Pendant / ceiling lamps: hang from top ──────────────────────────────────
  if (category === 'pendant') {
    const fw    = Math.min(100, CANVAS_W * 0.09);
    const fh    = fw * aspect;
    // cx is overridden by AI placement result in the caller; return default here
    const cx    = Math.round((aiZones?.lamp?.x ?? (DEFAULT_X.pendant?.[count % 2] ?? 0.48)) * CANVAS_W);
    const cy    = Math.round(fh / 2 + 20);   // always hang near ceiling regardless of AI cy
    const ps    = perspScale(cy);
    const scale = fw / (CANVAS_W * ps);
    return { x: cx, y: Math.max(30, cy), scale };
  }

  // ── Mirror / wall art: float above floor ────────────────────────────────────
  if (category === 'mirror') {
    const xArr = DEFAULT_X.mirror ?? [0.12, 0.80];
    const cx   = Math.round(xArr[count % xArr.length] * CANVAS_W);
    const cy   = Math.round(floorY * 0.55);
    const ps   = perspScale(cy);
    const fw   = Math.min(180, CANVAS_W * 0.14 * ps);
    const scale = fw / (CANVAS_W * ps);
    return { x: cx, y: cy, scale };
  }

  // ── Rug: flat on floor, larger ───────────────────────────────────────────────
  if (category === 'rug') {
    const fw    = Math.min(500, CANVAS_W * 0.50);
    const ps    = perspScale(floorY);
    const scale = fw / (CANVAS_W * ps);
    const cx    = Math.round((aiZones?.rug?.x ?? 0.42) * CANVAS_W);
    const cy    = Math.round(floorY + 30);
    return { x: cx, y: cy, scale };
  }

  // ── All floor-standing items ─────────────────────────────────────────────────

  // Determine target rendered width using real-world dimensions
  const wCm = productWidthCm  > 0 ? productWidthCm  : 80;
  const hCm = productHeightCm > 0 ? productHeightCm : 90;

  let fw: number;

  if (aspect > 2.2) {
    // Tall item (floor lamp, wardrobe, bookcase): scale by height relative to room
    const roomHpx    = floorY * 0.92;          // approx ceiling-to-floor in px
    const targetFh   = Math.min(
      (hCm / ROOM_H_CM) * roomHpx,
      roomHpx * 0.52,                          // cap at 52% of room height
    );
    fw = Math.max(30, targetFh / aspect);
  } else {
    // Wide / standard item: scale by width relative to room
    const ps    = perspScale(floorY);
    fw = Math.min(
      (wCm / ROOM_W_CM) * CANVAS_W / ps,
      MAX_FW[category] ?? 260,
    );
  }

  // Clamp to category maximum
  fw = Math.min(fw, MAX_FW[category] ?? 260);
  const fh    = fw * aspect;
  const ps    = perspScale(floorY);
  const scale = fw / (CANVAS_W * ps);

  // ── Y: bottom-anchor — base sits exactly on the floor at its depth ──────────
  const aiKey = category === 'floor-lamp' || category === 'table-lamp' ? 'lamp' : category;
  const zoneY = aiZones?.[aiKey]?.y;
  // Priority: AI per-item overrideCy → room-analysis zone → detected floor
  const baseY = aiBaseY ?? (zoneY ? zoneY * CANVAS_H : floorY);
  const cy    = Math.max(fh / 2 + 10, Math.min(CANVAS_H - 20, Math.round(baseY - fh / 2)));

  // ── X: AI placement zone preferred ─────────────────────────────────────────
  const zoneX     = aiZones?.[aiKey]?.x;
  const xFallback = (DEFAULT_X[category] ?? [0.38, 0.60])[count % (DEFAULT_X[category]?.length ?? 2)];
  const cx        = Math.round((zoneX ?? xFallback) * CANVAS_W);

  // For second+ items of the same category, offset so they don't stack
  const offsetX = count > 0 ? (count % 2 === 0 ? -120 : 120) : 0;
  const finalCx = Math.max(50, Math.min(CANVAS_W - 50, cx + offsetX));

  return { x: finalCx, y: Math.max(Math.round(fh / 2 + 10), cy), scale };
}

async function detectFloorPct(previewUrl: string): Promise<number> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const W = 80, H = 50;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0, W, H);
      const { data } = ctx.getImageData(0, 0, W, H);

      // Compute per-row average brightness AND horizontal variance (floor texture differs from wall)
      const rowBright: number[] = [];
      const rowVariance: number[] = [];
      for (let y = 0; y < H; y++) {
        let sum = 0, sq = 0;
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
          sum += v; sq += v * v;
        }
        const mean = sum / W;
        rowBright.push(mean);
        rowVariance.push(sq / W - mean * mean);
      }

      // Score each candidate row: brightness delta over 4-row window + variance change
      let bestScore = 0, floorRow = Math.round(H * 0.62);
      for (let y = Math.round(H * 0.38); y < Math.round(H * 0.80); y++) {
        const brightDelta = Math.abs(rowBright[y] - rowBright[Math.max(0, y - 4)]);
        const varDelta    = Math.abs(rowVariance[y] - rowVariance[Math.max(0, y - 4)]);
        const score = brightDelta + varDelta * 0.5;
        if (score > bestScore) { bestScore = score; floorRow = y; }
      }

      // If no strong signal found (low contrast room), fall back to 0.62
      const detected = bestScore < 3 ? 0.62 : floorRow / H;
      resolve(Math.max(0.50, Math.min(0.78, detected)));
    };
    img.onerror = () => resolve(0.62);
    img.src = previewUrl;
  });
}

/** Sample the dominant color from a small thumbnail */
function sampleDominantColor(imageUrl: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 16; c.height = 16;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0, 16, 16);
      const d = ctx.getImageData(0, 0, 16, 16).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 80) { r += d[i]; g += d[i + 1]; b += d[i + 2]; count++; }
      }
      if (!count) { resolve('#cccccc'); return; }
      const toH = (v: number) => Math.round(v / count).toString(16).padStart(2, '0');
      resolve(`#${toH(r)}${toH(g)}${toH(b)}`);
    };
    img.onerror = () => resolve('#cccccc');
    img.src = imageUrl;
  });
}

/** Preload image into a cache entry and return natural dims */
function measureImage(url: string): Promise<{ w: number; h: number }> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = url;
  });
}

/**
 * Convert AI placement (cx_pct, foot_y_pct) + product dimensions → canvas {cx, cy, scale}.
 *
 * foot_y_pct: where the item's FEET/BASE should sit, as a 0–1 fraction of canvas height.
 *   AI returns this directly from looking at the room photo. No zone mapping needed.
 *
 * Bottom-anchor (exact):
 *   PreviewCanvas renders: fw_r = CANVAS_W * scale * perspScale(cy)
 *                          fh_r = fw_r * aspect
 *   We want: cy + fh_r/2 = baseY  (item feet at baseY)
 *   perspScale(y) = K0 + K1*(y/H), so solving linearly:
 *     cy = (baseY - K0*A) / (1 + K1*A/H)   where A = fh/(2*perspScale(baseY))
 */
function computePlacement(
  floorPct: number,
  cat: string,
  cx_pct: number,
  foot_y_pct: number,
  natW: number, natH: number,
  wCm: number, hCm: number,
): { cx: number; cy: number; scale: number } {
  const floorY = floorPct * CANVAS_H;
  const aspect = natH / Math.max(natW, 1);
  const K0 = 0.55, K1 = 0.70;
  const cx = Math.round(cx_pct * CANVAS_W);

  // ── Ceiling items (pendants): hang from top ────────────────────────────────
  if (cat === 'pendant' || foot_y_pct <= 0.08) {
    const fw = Math.min(MAX_FW['pendant'] ?? 100, CANVAS_W * 0.09);
    const fh = fw * aspect;
    const cy = Math.round(fh / 2 + 20);
    return { cx, cy, scale: fw / (CANVAS_W * perspScale(cy)) };
  }

  // ── Compute baseY from foot_y_pct (where feet actually land) ──────────────
  const baseY = clamp(foot_y_pct * CANVAS_H, 30, CANVAS_H * 0.96);

  // ── Width / scale at baseY perspective depth ───────────────────────────────
  const ps = K0 + K1 * (baseY / CANVAS_H);
  let fw: number;
  if (aspect > 2.2) {
    // Tall items (floor lamps, wardrobes): scale by height relative to room height
    const roomHpx  = floorY * 0.92;
    const targetFh = Math.min((hCm / ROOM_H_CM) * roomHpx, roomHpx * 0.52);
    fw = Math.max(30, targetFh / aspect);
  } else {
    fw = (wCm / ROOM_W_CM) * CANVAS_W / ps;
  }
  fw = Math.min(fw, MAX_FW[cat] ?? 230);

  // ── Exact bottom-anchor ────────────────────────────────────────────────────
  const fh = fw * aspect;
  const A  = fh / (2 * ps);
  const cy = Math.max(fh / 2 + 10, Math.min(CANVAS_H - 20,
    Math.round((baseY - K0 * A) / (1 + (K1 * A) / CANVAS_H)),
  ));
  return { cx, cy, scale: fw / (CANVAS_W * ps) };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

let _zIdx = 100;

// ── AI insight extraction from analysis ──────────────────────────────────────

interface RoomInsights {
  style: string;
  floorType: string;
  lighting: string;
  lightTemperature: number; // 0=cool, 1=warm
}

function extractInsights(a: RoomAnalysis): RoomInsights {
  const warmStyles = ['traditional', 'bohemian', 'rustic'];
  const coolStyles = ['scandinavian', 'industrial', 'minimalist'];
  const style = a.style ?? 'modern';
  let lightTemperature = 0.5;
  if (warmStyles.includes(style)) lightTemperature = 0.72;
  else if (coolStyles.includes(style)) lightTemperature = 0.28;
  if (a.lightingCondition === 'artificial') lightTemperature = Math.max(lightTemperature, 0.55);

  return {
    style: style.charAt(0).toUpperCase() + style.slice(1),
    floorType: (a.floorType ?? 'unknown').charAt(0).toUpperCase() + (a.floorType ?? 'unknown').slice(1),
    lighting: (a.lightingCondition ?? 'natural').charAt(0).toUpperCase() + (a.lightingCondition ?? 'natural').slice(1),
    lightTemperature,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export const AIDesigner: React.FC = () => {
  const { addToCart } = useShop();

  const [roomPreview,  setRoomPreview]  = useState<string | null>(null);
  const [roomCloudUrl, setRoomCloudUrl] = useState<string | null>(null);
  const [analysis,     setAnalysis]     = useState<RoomAnalysis | null>(null);
  const [isAnalyzing,  setIsAnalyzing]  = useState(false);
  const [floorPct,     setFloorPct]     = useState(0.65);
  const [aiZones,      setAiZones]      = useState<Record<string, { x: number; y: number }> | undefined>(undefined);
  const [insights,     setInsights]     = useState<RoomInsights | null>(null);
  const [insightsVisible, setInsightsVisible] = useState(false);

  const [items,      setItems]      = useState<SmartItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // AI placement in-progress
  const [isPlacing, setIsPlacing] = useState(false);

  // Per-item BG removal (auto on add)
  const [processingBgFor, setProcessingBgFor] = useState<Set<string>>(new Set());

  // "Clean All" BG removal state (bulk fallback)
  const [cleaningAll,   setCleaningAll]   = useState(false);
  const [cleanProgress, setCleanProgress] = useState(0); // 0-100
  const [cleaningId,    setCleaningId]    = useState<string | null>(null);

  // Floor snap overlay
  const [showFloorLine, setShowFloorLine] = useState(false);

  // Image dimension cache (url → {w,h})
  const imgDimCache = useRef<Map<string, { w: number; h: number }>>(new Map());
  const canvasRef   = useRef<HTMLCanvasElement | null>(null);
  const animFrames  = useRef<Map<string, number>>(new Map());

  const selectedItem = items.find(i => i.id === selectedId) as SmartItem | undefined;

  // ── Room upload ──────────────────────────────────────────────────────────────
  const handleRoomReady = useCallback(async (cloudUrl: string, previewUrl: string) => {
    setRoomCloudUrl(cloudUrl);
    setRoomPreview(previewUrl);
    setAnalysis(null);
    setInsights(null);
    setInsightsVisible(false);
    detectFloorPct(previewUrl).then(p => setFloorPct(p));
    // Spawn the BG worker now — it pre-imports the WASM library while the room
    // analysis runs, so the first product add finds the model already cached.
    warmupBgRemoval();
    setIsAnalyzing(true);
    try {
      const a = await analyzeRoom(cloudUrl);
      setAnalysis(a);
      setInsights(extractInsights(a));
      // Use AI geometry for placement and floor detection
      if (a.geometry) {
        setFloorPct(a.geometry.floorLineY);
        setAiZones(a.geometry.placementZones);
      }
      // Stagger the insight chips reveal
      setTimeout(() => setInsightsVisible(true), 200);
      toast.success('Room analyzed!');
    } catch { /* silent */ }
    finally { setIsAnalyzing(false); }
  }, []);

  // ── Scale-in animation per item ──────────────────────────────────────────────
  const animateScaleIn = useCallback((itemId: string, targetScale: number) => {
    const start = performance.now();
    const dur   = 350;
    const tick  = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      // ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const currentScale = eased * targetScale;
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, scale: currentScale } : i));
      if (t < 1) {
        animFrames.current.set(itemId, requestAnimationFrame(tick));
      } else {
        animFrames.current.delete(itemId);
      }
    };
    const raf = requestAnimationFrame(tick);
    animFrames.current.set(itemId, raf);
  }, []);

  // Cleanup animation frames on unmount
  useEffect(() => {
    return () => { animFrames.current.forEach(id => cancelAnimationFrame(id)); };
  }, []);

  // ── Add product — then ask AI to redesign the whole room layout ──────────────
  const handleAddProduct = useCallback(async (product: Product) => {
    if (!roomPreview) { toast.error('Upload a room photo first'); return; }
    if (isPlacing)   { toast.info('AI is redesigning, please wait…'); return; }

    setIsPlacing(true);

    // Measure image dims and sample color in parallel
    const dimsPromise  = (async () => {
      const cached = imgDimCache.current.get(product.image);
      if (cached) return cached;
      const d = await measureImage(product.image);
      imgDimCache.current.set(product.image, d);
      return d;
    })();
    const colorPromise = sampleDominantColor(product.image);

    const dims     = await dimsPromise;
    const domColor = await colorPromise;

    // Compute scale client-side (AI never computes scale — it's unreliable for lamps)
    const displayCat = getDisplayCategory(product.productName, product.category);
    const sameCount  = items.filter(i =>
      getDisplayCategory(i.productName, (i as any).category ?? '') === displayCat,
    ).length;
    const instant = getInstantPlacement(displayCat, sameCount, floorPct, {
      naturalW:        dims.w,
      naturalH:        dims.h,
      productWidthCm:  product.width  ?? 80,
      productHeightCm: product.height ?? 90,
      aiZones,
    });

    const newItemId = `${product.id}-${Date.now()}`;
    const newItem: SmartItem = {
      id:            newItemId,
      productId:     product.id,
      productName:   product.productName,
      imageUrl:      product.image,
      sourceUrl:     product.image,
      cx:            instant.x,
      cy:            instant.y,
      scale:         0,
      scaleTarget:   instant.scale,
      rotation:      0,
      zIndex:        _zIdx++,
      needsCleanup:  true,
      dominantColor: domColor,
      naturalW:      dims.w,
      naturalH:      dims.h,
      widthCm:       product.width  ?? 80,
      heightCm:      product.height ?? 90,
    };

    const allItemsForAI = [
      ...(items as SmartItem[]).map(i => ({
        id:          i.id,
        productName: i.productName,
        category:    getDisplayCategory(i.productName, ''),
        widthCm:     i.widthCm  ?? 80,
        heightCm:    i.heightCm ?? 90,
      })),
      {
        id:          newItemId,
        productName: product.productName,
        category:    displayCat,
        widthCm:     product.width  ?? 80,
        heightCm:    product.height ?? 90,
      },
    ];

    // Ask AI to redesign the full room layout as an expert interior designer
    let aiPlacements: Array<{ id: string; cx_pct: number; foot_y_pct: number }> = [];
    let designTheme = '';
    try {
      if (roomCloudUrl) {
        const result = await redesignRoom(roomCloudUrl, floorPct, allItemsForAI);
        aiPlacements = result.placements ?? [];
        designTheme  = result.designTheme ?? '';
      }
    } catch {
      // Fall back: just add new item at client-side position
    }

    // Apply AI placements — zone→cy computed via physics, never from AI
    setItems(prev => {
      const withNew = [...prev, newItem];
      if (!aiPlacements.length) return withNew;

      const placementMap = new Map(aiPlacements.map(p => [p.id, p]));

      return withNew.map(item => {
        const ai = placementMap.get(item.id);
        if (!ai) return item;

        if (item.id === newItemId) {
          const pl = computePlacement(
            floorPct, displayCat, ai.cx_pct, ai.foot_y_pct,
            dims.w, dims.h, product.width ?? 80, product.height ?? 90,
          );
          return { ...item, cx: pl.cx, cy: pl.cy, scale: pl.scale, scaleTarget: pl.scale };
        }

        const si         = item as SmartItem;
        const cachedDims = imgDimCache.current.get(item.imageUrl) ?? { w: si.naturalW || 1, h: si.naturalH || 1 };
        const existCat   = getDisplayCategory(item.productName, '');
        const pl = computePlacement(
          floorPct, existCat, ai.cx_pct, ai.foot_y_pct,
          cachedDims.w, cachedDims.h, si.widthCm ?? 80, si.heightCm ?? 90,
        );
        return { ...item, cx: pl.cx, cy: pl.cy, scale: pl.scale };
      });
    });

    setSelectedId(newItemId);
    setIsPlacing(false);

    animateScaleIn(newItemId, instant.scale);

    if (designTheme) toast.success(`Room redesigned: ${designTheme}`);
    else             toast.success(`${product.productName} added!`);

    // Auto BG removal
    setProcessingBgFor(prev => new Set(prev).add(newItemId));
    removeBackground(product.image)
      .then(cleanUrl => {
        measureImage(cleanUrl).then(cd => {
          imgDimCache.current.set(cleanUrl, cd);
          setItems(prev => prev.map(i =>
            i.id === newItemId
              ? { ...i, imageUrl: cleanUrl, needsCleanup: false, naturalW: cd.w, naturalH: cd.h }
              : i,
          ));
        });
      })
      .catch(() => { /* leave original */ })
      .finally(() => setProcessingBgFor(prev => { const s = new Set(prev); s.delete(newItemId); return s; }));

  }, [roomPreview, roomCloudUrl, items, floorPct, aiZones, animateScaleIn, isPlacing]);

  // ── Clean All Backgrounds (bulk fallback for items that failed auto-removal) ────
  const handleCleanAll = useCallback(async () => {
    const dirty = items.filter(i => i.needsCleanup && !processingBgFor.has(i.id));
    if (!dirty.length) { toast.info('All backgrounds already cleaned!'); return; }

    setCleaningAll(true);
    setCleanProgress(0);

    for (let idx = 0; idx < dirty.length; idx++) {
      const item = dirty[idx];
      setCleaningId(item.id);
      try {
        const cleanUrl = await removeBackground(item.sourceUrl);
        // Also update dim cache for clean URL
        const dims = await measureImage(cleanUrl);
        imgDimCache.current.set(cleanUrl, dims);

        setItems(prev => prev.map(i =>
          i.id === item.id
            ? { ...i, imageUrl: cleanUrl, needsCleanup: false, naturalW: dims.w, naturalH: dims.h }
            : i,
        ));
      } catch {
        toast.error(`BG removal failed for ${item.productName}`);
      }
      setCleanProgress(Math.round(((idx + 1) / dirty.length) * 100));
    }

    setCleaningId(null);
    setCleaningAll(false);
    toast.success('All backgrounds cleaned!');
  }, [items, processingBgFor]);

  // ── Item controls ─────────────────────────────────────────────────────────────
  const updateItem = useCallback((id: string, patch: Partial<PlacedItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  }, []);

  const deleteSelected = useCallback(async () => {
    if (!selectedId) return;
    const remaining = items.filter(i => i.id !== selectedId);
    setItems(remaining);
    setSelectedId(null);

    if (!roomCloudUrl || remaining.length === 0) return;
    setIsPlacing(true);
    try {
      const itemsForAI = remaining.map(i => ({
        id:          i.id,
        productName: i.productName,
        category:    getDisplayCategory(i.productName, ''),
        widthCm:     (i as SmartItem).widthCm  ?? 80,
        heightCm:    (i as SmartItem).heightCm ?? 90,
      }));
      const result = await redesignRoom(roomCloudUrl, floorPct, itemsForAI);
      if (result.placements?.length) {
        const placementMap = new Map(result.placements.map(p => [p.id, p]));
        setItems(prev => prev.map(item => {
          const ai = placementMap.get(item.id);
          if (!ai) return item;
          const si         = item as SmartItem;
          const cachedDims = imgDimCache.current.get(item.imageUrl) ?? { w: si.naturalW || 1, h: si.naturalH || 1 };
          const cat        = getDisplayCategory(item.productName, '');
          const pl = computePlacement(
            floorPct, cat, ai.cx_pct, ai.foot_y_pct,
            cachedDims.w, cachedDims.h, si.widthCm ?? 80, si.heightCm ?? 90,
          );
          return { ...item, cx: pl.cx, cy: pl.cy, scale: pl.scale };
        }));
        if (result.designTheme) toast.success(`Room redesigned: ${result.designTheme}`);
      }
    } catch { /* silent — items are already removed */ }
    finally { setIsPlacing(false); }
  }, [selectedId, items, roomCloudUrl, floorPct]);

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const src = items.find(i => i.id === selectedId) as SmartItem | undefined;
    if (!src) return;
    const dup: SmartItem = {
      ...src,
      id:     `${src.productId}-${Date.now()}`,
      cx:     Math.min(CANVAS_W - 30, src.cx + 40),
      cy:     Math.min(CANVAS_H - 30, src.cy + 40),
      zIndex: _zIdx++,
    };
    setItems(prev => [...prev, dup]);
    setSelectedId(dup.id);
    toast.success('Duplicated!');
  }, [selectedId, items]);

  const bringToFront = useCallback(() => { if (selectedId) updateItem(selectedId, { zIndex: _zIdx++ }); }, [selectedId]);
  const sendToBack   = useCallback(() => {
    if (!selectedId) return;
    const min = Math.min(...items.map(i => i.zIndex));
    updateItem(selectedId, { zIndex: min - 1 });
  }, [selectedId, items]);

  // ── Floor snap: detect when drag cy is near floorPct ──────────────────────────
  const floorY = Math.round(floorPct * CANVAS_H);
  const handleUpdateItem = useCallback((id: string, patch: Partial<PlacedItem>) => {
    if (patch.cy !== undefined) {
      const snapDist = (20 / CANVAS_H) * CANVAS_H; // 20px in canvas space
      if (Math.abs(patch.cy - floorY) < snapDist) {
        patch = { ...patch, cy: floorY };
        setShowFloorLine(true);
        setTimeout(() => setShowFloorLine(false), 800);
      }
    }
    updateItem(id, patch);
  }, [floorY, updateItem]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Escape') { setSelectedId(null); return; }
      if (!selectedId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
        return;
      }
      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? 20 : 5;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp'   ? -step : e.key === 'ArrowDown'  ? step : 0;
        setItems(prev => prev.map(i => i.id === selectedId
          ? { ...i, cx: Math.max(30, Math.min(CANVAS_W - 30, i.cx + dx)), cy: Math.max(30, Math.min(CANVAS_H - 30, i.cy + dy)) }
          : i));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, deleteSelected]);

  // ── Export ────────────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.download = 'decorx-room-design.png';
    a.href = canvasRef.current.toDataURL('image/png');
    a.click();
    toast.success('Downloaded!');
  };

  // ── Processing IDs for PreviewCanvas spinner overlay ──────────────────────────
  const processingIds = new Set([...processingBgFor, ...(cleaningId ? [cleaningId] : [])]);

  // ── Pixel dims of selected item ───────────────────────────────────────────────
  const selDims = selectedItem
    ? (() => {
        const ps = perspScale(selectedItem.cy);
        const fw = Math.round(CANVAS_W * selectedItem.scale * ps);
        const fh = selectedItem.naturalW > 0
          ? Math.round((selectedItem.naturalH / selectedItem.naturalW) * fw)
          : fw;
        return { fw, fh };
      })()
    : null;

  // ── Insight chip data ─────────────────────────────────────────────────────────
  const insightChips = insights
    ? [
        { label: 'Style',     value: insights.style,     icon: '🎨' },
        { label: 'Floor',     value: insights.floorType,  icon: '🪵' },
        { label: 'Lighting',  value: insights.lighting,   icon: '💡' },
      ]
    : [];

  const dirtyCount = items.filter(i => i.needsCleanup && !processingBgFor.has(i.id)).length;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F0EDE8' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-stone-200/80 sticky top-0 z-30 flex-shrink-0">
        <div className="flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-3">
            <Link to="/"
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <span className="text-sm font-bold text-stone-900">Smart Canvas</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                Enhanced
              </span>
            </div>
            {items.length > 0 && (
              <span className="bg-orange-100 text-orange-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {items.length} piece{items.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isAnalyzing && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-orange-600 bg-orange-50 rounded-lg border border-orange-100">
                <span className="w-3 h-3 rounded-full border-2 border-orange-300 border-t-orange-600 animate-spin flex-shrink-0" />
                Analyzing room…
              </div>
            )}
            {isPlacing && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-violet-700 bg-violet-50 rounded-lg border border-violet-200">
                <span className="w-3 h-3 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin flex-shrink-0" />
                AI placing…
              </div>
            )}

            {/* Clean All Backgrounds */}
            {dirtyCount > 0 && !cleaningAll && (
              <button
                onClick={handleCleanAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white rounded-lg transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 0L4 4m5.121 5.121L7 7"/>
                </svg>
                Clean All ({dirtyCount})
              </button>
            )}

            {cleaningAll && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200">
                <span className="w-3 h-3 rounded-full border-2 border-purple-300 border-t-purple-600 animate-spin flex-shrink-0" />
                <span className="text-xs font-semibold text-purple-700">Cleaning… {cleanProgress}%</span>
                <div className="w-24 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${cleanProgress}%` }} />
                </div>
              </div>
            )}

            <button onClick={handleExport} disabled={items.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-40">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Export
            </button>
          </div>
        </div>
      </header>

      {/* ── Workspace ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-4 p-4 min-h-0">

        {/* Left sidebar */}
        <aside className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          <RoomUploader onImageReady={handleRoomReady} currentImage={roomPreview} />
          <RoomInsightsPanel isAnalyzing={isAnalyzing} analysis={analysis} />

          <FurnitureSelector
            selectedProductId={null}
            onSelect={handleAddProduct as any}
            suggestedCategories={analysis?.suggestedCategories ?? []}
            addMode
          />
        </aside>

        {/* Center: canvas + strips */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto pb-2" style={{ scrollbarWidth: 'none' }}>

          {/* Canvas area wrapper */}
          <div className="relative flex-shrink-0">

            {/* ── Item properties toolbar (dark pill) ──────────────────────── */}
            {selectedItem && (
              <div className="absolute top-2 left-2 right-2 z-30">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-2xl flex-wrap"
                  style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.09)' }}
                >
                  {/* Dominant color dot + thumbnail + name */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0"
                      style={{ background: selectedItem.dominantColor }}
                      title="Dominant color"
                    />
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                      <img src={selectedItem.imageUrl} className="w-full h-full object-contain" alt="" />
                    </div>
                    <div className="flex flex-col leading-tight">
                      <p className="text-[11px] font-semibold text-white truncate max-w-[100px]">
                        {selectedItem.productName}
                      </p>
                      {selDims && (
                        <p className="text-[9px] text-white/35 tabular-nums">
                          {selDims.fw}×{selDims.fh}px
                        </p>
                      )}
                    </div>
                    {selectedItem.needsCleanup && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/30 flex-shrink-0">
                        needs cleanup
                      </span>
                    )}
                  </div>

                  <div className="w-px h-5 bg-white/10 flex-shrink-0" />

                  {/* Scale slider */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-[100px]">
                    <svg className="w-3 h-3 text-white/35 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                    </svg>
                    <input type="range" min="0.05" max="1.0" step="0.01"
                      value={selectedItem.scale}
                      onChange={e => updateItem(selectedId!, { scale: +e.target.value })}
                      className="flex-1 accent-orange-500 cursor-pointer" style={{ height: '3px' }}
                    />
                    <span className="text-[10px] text-white/50 w-9 text-right flex-shrink-0 tabular-nums">
                      {Math.round(selectedItem.scale * 100)}%
                    </span>
                  </div>

                  <div className="w-px h-5 bg-white/10 flex-shrink-0" />

                  {/* Rotation */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => updateItem(selectedId!, { rotation: (selectedItem.rotation - 15 + 360) % 360 })}
                      className="text-[10px] px-1.5 py-0.5 text-white/45 hover:text-white bg-white/5 hover:bg-white/12 rounded transition-colors">
                      −15°
                    </button>
                    <span className="text-[10px] text-white/40 w-6 text-center tabular-nums">{selectedItem.rotation}°</span>
                    <button
                      onClick={() => updateItem(selectedId!, { rotation: (selectedItem.rotation + 15) % 360 })}
                      className="text-[10px] px-1.5 py-0.5 text-white/45 hover:text-white bg-white/5 hover:bg-white/12 rounded transition-colors">
                      +15°
                    </button>
                  </div>

                  <div className="w-px h-5 bg-white/10 flex-shrink-0" />

                  {/* Layer */}
                  <button onClick={bringToFront} title="Bring to front"
                    className="p-1.5 rounded-lg text-white/35 hover:text-white hover:bg-white/8 transition-all flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 11l7-7 7 7M5 19l7-7 7 7"/>
                    </svg>
                  </button>
                  <button onClick={sendToBack} title="Send to back"
                    className="p-1.5 rounded-lg text-white/35 hover:text-white hover:bg-white/8 transition-all flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 13l-7 7-7-7m14-8l-7 7-7-7"/>
                    </svg>
                  </button>

                  {/* Duplicate */}
                  <button onClick={duplicateSelected} title="Duplicate"
                    className="p-1.5 rounded-lg text-white/35 hover:text-white hover:bg-white/8 transition-all flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  </button>

                  <div className="flex-1" />

                  {/* Add to cart */}
                  <button
                    onClick={() => { addToCart({ ...selectedItem, quantity: 1 } as any); toast.success('Added to cart!'); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-white text-[11px] font-bold rounded-xl transition-all active:scale-95 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#f97316,#fb923c)' }}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    Cart
                  </button>

                  {/* Delete */}
                  <button onClick={deleteSelected} title="Remove"
                    className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Canvas */}
            <PreviewCanvas
              roomImage={roomPreview}
              items={items}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onUpdateItem={handleUpdateItem}
              onCanvasReady={c => { canvasRef.current = c; }}
              processingIds={processingIds}
              overlayContent={
                <>
                  {/* Floor snap indicator */}
                  {showFloorLine && (
                    <div
                      className="absolute left-0 right-0 pointer-events-none z-20 transition-opacity"
                      style={{
                        top: `${floorPct * 100}%`,
                        height: '2px',
                        background: 'rgba(34,197,94,0.7)',
                        boxShadow: '0 0 8px rgba(34,197,94,0.5)',
                      }}
                    />
                  )}

                  {/* Needs-cleanup indicators (only items NOT currently being processed) */}
                  {items
                    .filter(i => i.needsCleanup && i.id !== cleaningId && !processingBgFor.has(i.id))
                    .map(item => (
                      <div
                        key={item.id}
                        className="absolute pointer-events-none z-10"
                        style={{
                          left: `${(item.cx / CANVAS_W) * 100}%`,
                          top:  `${(item.cy / CANVAS_H) * 100}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div
                          className="text-[8px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap"
                          style={{
                            background: 'rgba(245,158,11,0.85)',
                            borderColor: 'rgba(245,158,11,0.4)',
                            color: '#fff',
                            backdropFilter: 'blur(4px)',
                          }}
                        >
                          ✂ needs cleanup
                        </div>
                      </div>
                    ))}

                  {/* Auto BG removal spinners */}
                  {items
                    .filter(i => processingBgFor.has(i.id))
                    .map(item => (
                      <div key={item.id}
                        className="absolute pointer-events-none z-10 flex flex-col items-center gap-1"
                        style={{
                          left: `${(item.cx / CANVAS_W) * 100}%`,
                          top:  `${(item.cy / CANVAS_H) * 100}%`,
                          transform: 'translate(-50%, -50%)',
                        }}>
                        <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                        <span className="text-[9px] text-white font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(4px)' }}>
                          Removing BG…
                        </span>
                      </div>
                    ))}

                  {/* Currently-cleaning spinner (bulk Clean All) */}
                  {cleaningId && (() => {
                    const item = items.find(i => i.id === cleaningId);
                    if (!item) return null;
                    return (
                      <div
                        className="absolute pointer-events-none z-10 flex flex-col items-center gap-1"
                        style={{
                          left: `${(item.cx / CANVAS_W) * 100}%`,
                          top:  `${(item.cy / CANVAS_H) * 100}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
                        <span
                          className="text-[9px] text-white font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(4px)' }}
                        >
                          Cleaning…
                        </span>
                      </div>
                    );
                  })()}

                  {/* AI redesign overlay — covers the whole canvas while AI is working */}
                  {isPlacing && (
                    <div
                      className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 pointer-events-none"
                      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
                    >
                      <div className="w-12 h-12 rounded-full border-[3px] border-violet-400/30 border-t-violet-400 animate-spin" />
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-bold text-white">AI redesigning room…</span>
                        <span className="text-[11px] text-white/55">Arranging furniture as an expert designer</span>
                      </div>
                    </div>
                  )}

                  {/* Hint */}
                  {items.length > 0 && !selectedId && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                      <div className="px-4 py-1.5 rounded-full text-xs text-white/55 whitespace-nowrap"
                        style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)' }}>
                        Click to select · Drag to move · Arrow keys to nudge · Del to remove
                      </div>
                    </div>
                  )}
                </>
              }
            />
          </div>

          {/* ── AI Insight Strip ───────────────────────────────────────────── */}
          {insights && (
            <div className="bg-white rounded-2xl border border-stone-200 px-4 py-3 flex-shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex-shrink-0">
                  AI Insights
                </span>
                <div className="flex gap-2 flex-wrap">
                  {insightChips.map((chip, i) => (
                    <div
                      key={chip.label}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
                      style={{
                        borderColor: 'rgba(249,115,22,0.25)',
                        background: 'rgba(249,115,22,0.06)',
                        color: '#c2410c',
                        opacity: insightsVisible ? 1 : 0,
                        transform: insightsVisible ? 'translateY(0)' : 'translateY(6px)',
                        transition: `opacity 0.4s ease ${i * 0.12}s, transform 0.4s ease ${i * 0.12}s`,
                      }}
                    >
                      <span>{chip.icon}</span>
                      <span className="text-stone-500 font-normal">{chip.label}:</span>
                      <span>{chip.value}</span>
                    </div>
                  ))}

                  {/* Light temperature bar */}
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs"
                    style={{
                      borderColor: 'rgba(249,115,22,0.25)',
                      background: 'rgba(249,115,22,0.06)',
                      opacity: insightsVisible ? 1 : 0,
                      transform: insightsVisible ? 'translateY(0)' : 'translateY(6px)',
                      transition: `opacity 0.4s ease ${insightChips.length * 0.12}s, transform 0.4s ease ${insightChips.length * 0.12}s`,
                    }}
                  >
                    <span className="text-stone-400">🌡 Temp:</span>
                    <div className="w-16 h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'linear-gradient(to right, #93c5fd, #fbbf24)' }}>
                      <div
                        className="h-full w-2 rounded-full bg-white border border-stone-300 -translate-y-px"
                        style={{ marginLeft: `calc(${insights.lightTemperature * 100}% - 4px)`, transition: 'margin 0.6s ease' }}
                      />
                    </div>
                    <span className="text-orange-700 font-medium">
                      {insights.lightTemperature > 0.6 ? 'Warm' : insights.lightTemperature < 0.4 ? 'Cool' : 'Neutral'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Placed items strip ─────────────────────────────────────────── */}
          {items.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 px-3 py-2.5 flex-shrink-0">
              <div className="flex items-center gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex-shrink-0">Placed</span>
                <div className="flex gap-1.5 flex-1">
                  {items.map(item => (
                    <button key={item.id} onClick={() => setSelectedId(item.id)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs transition-all flex-shrink-0 ${
                        item.id === selectedId
                          ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-sm'
                          : 'border-stone-200 hover:border-orange-200 text-stone-600 hover:bg-stone-50'
                      }`}>
                      {/* Color dot */}
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 border border-black/10"
                        style={{ background: (item as SmartItem).dominantColor }}
                      />
                      <div className="w-5 h-5 rounded overflow-hidden bg-stone-100 flex-shrink-0 relative">
                        <img src={item.imageUrl} className="w-full h-full object-contain" alt="" />
                        {item.id === cleaningId && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                            <div className="w-2.5 h-2.5 rounded-full border border-purple-400 border-t-transparent animate-spin" />
                          </div>
                        )}
                      </div>
                      <span className="font-medium truncate max-w-[80px]">{item.productName}</span>
                      {(item as SmartItem).needsCleanup && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Needs background removal" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
