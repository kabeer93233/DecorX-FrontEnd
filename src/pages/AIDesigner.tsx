import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDisplayCategory } from '../utils/categoryUtils';
import { toast } from 'sonner';
import { RoomUploader } from '../components/ai/RoomUploader';
import { RoomInsightsPanel } from '../components/ai/RoomInsightsPanel';
import { PreviewCanvas, PlacedItem, CANVAS_W, CANVAS_H } from '../components/ai/PreviewCanvas';
import { FurnitureSelector } from '../components/ai/FurnitureSelector';
import { analyzeRoom, removeBackground, warmupBgRemoval } from '../services/aiService';
import { RoomAnalysis } from '../types/ai';
import { useShop } from '../context/ShopContext';

// ── Types ────────────────────────────────────────────────────────────────────

interface Product { id: string; productName: string; category: string; price: number; image: string; }

interface SmartItem extends PlacedItem {
  /** original source URL (before BG removal) */
  sourceUrl: string;
  /** true = BG not yet cleaned */
  needsCleanup: boolean;
  /** animation: 0 → target over 350 ms */
  scaleTarget: number;
  /** dominant color hex sampled from thumbnail */
  dominantColor: string;
  /** natural dims measured from off-screen cache */
  naturalW: number;
  naturalH: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// yBelow = how far BELOW the detected floor line to place the item center (fraction of canvas height).
// Positive = below floor line (on floor). Negative = above floor line (on wall, e.g. mirror).
// This ensures items always land on the floor regardless of where detectFloorPct reports it.
const INSTANT_RULES: Record<string, Array<{ xPct: number; yBelow: number; scale: number }>> = {
  sofa:       [{ xPct: 0.22, yBelow: 0.09, scale: 0.28 }, { xPct: 0.60, yBelow: 0.09, scale: 0.26 }],
  loveseat:   [{ xPct: 0.25, yBelow: 0.08, scale: 0.22 }, { xPct: 0.62, yBelow: 0.08, scale: 0.20 }],
  chair:      [{ xPct: 0.72, yBelow: 0.08, scale: 0.16 }, { xPct: 0.18, yBelow: 0.08, scale: 0.15 }, { xPct: 0.82, yBelow: 0.08, scale: 0.16 }],
  table:      [{ xPct: 0.38, yBelow: 0.08, scale: 0.20 }, { xPct: 0.65, yBelow: 0.07, scale: 0.16 }],
  stool:      [{ xPct: 0.58, yBelow: 0.08, scale: 0.11 }, { xPct: 0.42, yBelow: 0.08, scale: 0.10 }],
  // Tall items: base is at floor but center appears higher — small yBelow keeps them correctly anchored
  lamp:       [{ xPct: 0.78, yBelow: 0.05, scale: 0.14 }, { xPct: 0.15, yBelow: 0.05, scale: 0.13 }],
  cabinet:    [{ xPct: 0.08, yBelow: 0.05, scale: 0.24 }, { xPct: 0.82, yBelow: 0.05, scale: 0.23 }],
  // Small decorations: on floor or low surface
  decoration: [{ xPct: 0.68, yBelow: 0.07, scale: 0.08 }, { xPct: 0.28, yBelow: 0.07, scale: 0.07 }],
  rug:        [{ xPct: 0.40, yBelow: 0.12, scale: 0.50 }, { xPct: 0.50, yBelow: 0.14, scale: 0.55 }],
  bed:        [{ xPct: 0.38, yBelow: 0.10, scale: 0.30 }, { xPct: 0.52, yBelow: 0.10, scale: 0.33 }],
  // Wall-mounted: center above floor line
  mirror:     [{ xPct: 0.12, yBelow: -0.16, scale: 0.16 }, { xPct: 0.78, yBelow: -0.18, scale: 0.14 }],
};

function getInstantPlacement(category: string, count: number, floorPct: number) {
  const rules = INSTANT_RULES[category] ?? [{ xPct: 0.38, yBelow: 0.08, scale: 0.20 }];
  const rule  = rules[count % rules.length];
  // Place center = floorLine + yBelow, clamped so item stays within canvas
  const cy = Math.max(60, Math.min(CANVAS_H - 40, Math.round((floorPct + rule.yBelow) * CANVAS_H)));
  return { x: Math.round(rule.xPct * CANVAS_W), y: cy, scale: rule.scale };
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
  const [insights,     setInsights]     = useState<RoomInsights | null>(null);
  const [insightsVisible, setInsightsVisible] = useState(false);

  const [items,      setItems]      = useState<SmartItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  // ── Add product ──────────────────────────────────────────────────────────────
  const handleAddProduct = useCallback(async (product: Product) => {
    if (!roomPreview) { toast.error('Upload a room photo first'); return; }

    const displayCat = getDisplayCategory(product.productName, product.category);
    const sameCount  = items.filter(i =>
      getDisplayCategory(i.productName, (i as any).category ?? '') === displayCat,
    ).length;

    const instant = getInstantPlacement(displayCat, sameCount, floorPct);

    // Prefetch image dims (cached for future renders)
    const dims = imgDimCache.current.get(product.image) ?? await measureImage(product.image);
    imgDimCache.current.set(product.image, dims);

    const domColor = await sampleDominantColor(product.image);

    const newItem: SmartItem = {
      id:           `${product.id}-${Date.now()}`,
      productId:    product.id,
      productName:  product.productName,
      imageUrl:     product.image,
      sourceUrl:    product.image,
      cx: instant.x,
      cy: instant.y,
      scale: 0,               // starts at 0 for animation
      scaleTarget: instant.scale,
      rotation: 0,
      zIndex: _zIdx++,
      needsCleanup: true,
      dominantColor: domColor,
      naturalW: dims.w,
      naturalH: dims.h,
    };

    setItems(prev => [...prev, newItem]);
    setSelectedId(newItem.id);

    // Scale-in animation
    animateScaleIn(newItem.id, instant.scale);

    // Auto BG removal immediately on add
    setProcessingBgFor(prev => new Set(prev).add(newItem.id));
    removeBackground(product.image)
      .then(cleanUrl => {
        measureImage(cleanUrl).then(dims => {
          imgDimCache.current.set(cleanUrl, dims);
          setItems(prev => prev.map(i =>
            i.id === newItem.id
              ? { ...i, imageUrl: cleanUrl, needsCleanup: false, naturalW: dims.w, naturalH: dims.h }
              : i,
          ));
        });
      })
      .catch(() => { /* leave original image */ })
      .finally(() => setProcessingBgFor(prev => { const s = new Set(prev); s.delete(newItem.id); return s; }));

    toast.success(`${product.productName} added to room!`);
  }, [roomPreview, items, roomCloudUrl, floorPct, animateScaleIn]);

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

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setItems(prev => prev.filter(i => i.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

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
        setItems(prev => prev.filter(i => i.id !== selectedId));
        setSelectedId(null);
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
  }, [selectedId]);

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
        const ps = 0.78 + (selectedItem.cy / CANVAS_H) * 0.44;
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
                Analyzing…
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
