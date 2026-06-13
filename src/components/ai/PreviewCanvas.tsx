import React, { useRef, useEffect, useCallback } from 'react';

export interface PlacedItem {
  id: string;
  productId: string;
  productName: string;
  imageUrl: string;
  cx: number;
  cy: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

export const CANVAS_W = 900;
export const CANVAS_H = 600;

const BMAP_W = 45;
const BMAP_H = 30;
const HANDLE_R = 7;        // visual radius of corner handles
const HANDLE_HIT = 18;     // hit-test radius (larger for easy grabbing)

type DragState =
  | { type: 'move';   active: boolean; id: string; offX: number; offY: number }
  | { type: 'resize'; active: boolean; id: string; origScale: number; origDist: number; cx: number; cy: number };

interface Props {
  roomImage: string | null;
  items: PlacedItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateItem: (id: string, patch: Partial<PlacedItem>) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  overlayContent?: React.ReactNode;
  processingIds?: Set<string>;
}

export const PreviewCanvas: React.FC<Props> = ({
  roomImage, items, selectedId, onSelect, onUpdateItem, onCanvasReady,
  overlayContent, processingIds,
}) => {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const roomImgRef     = useRef<HTMLImageElement | null>(null);
  const imgCacheRef    = useRef<Map<string, HTMLImageElement>>(new Map());
  const brightMapRef   = useRef<number[]>(new Array(BMAP_W * BMAP_H).fill(0.65));
  const dragRef        = useRef<DragState | null>(null);
  const itemsRef       = useRef(items);
  const selectedRef    = useRef(selectedId);
  const processingRef  = useRef(processingIds ?? new Set<string>());

  itemsRef.current    = items;
  selectedRef.current = selectedId;
  processingRef.current = processingIds ?? new Set();

  // ── High-DPI (retina) setup — run once on mount ───────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
  }, []);

  // ── Room brightness map ───────────────────────────────────────────────────
  function buildBrightMap(img: HTMLImageElement) {
    const c = document.createElement('canvas');
    c.width = BMAP_W; c.height = BMAP_H;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0, BMAP_W, BMAP_H);
    const { data } = ctx.getImageData(0, 0, BMAP_W, BMAP_H);
    brightMapRef.current = Array.from({ length: BMAP_W * BMAP_H }, (_, i) =>
      (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / (3 * 255),
    );
  }

  function getRoomBrightAt(cx: number, cy: number): number {
    const mx = Math.round((cx / CANVAS_W) * (BMAP_W - 1));
    const my = Math.round((cy / CANVAS_H) * (BMAP_H - 1));
    return brightMapRef.current[my * BMAP_W + mx] ?? 0.65;
  }

  // ── Image helpers ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomImage) {
      roomImgRef.current = null;
      brightMapRef.current = new Array(BMAP_W * BMAP_H).fill(0.65);
      redraw();
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = roomImage;
    img.onload = () => { roomImgRef.current = img; buildBrightMap(img); redraw(); };
  }, [roomImage]);

  useEffect(() => {
    items.forEach(item => {
      if (!imgCacheRef.current.has(item.imageUrl)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = item.imageUrl;
        img.onload = () => { imgCacheRef.current.set(item.imageUrl, img); redraw(); };
        imgCacheRef.current.set(item.imageUrl, img);
      }
    });
    redraw();
  }, [items.map(i => i.imageUrl + i.id).join('|')]);

  useEffect(() => { redraw(); }, [items, selectedId, processingIds]);

  function getImg(url: string) {
    const img = imgCacheRef.current.get(url);
    return img?.complete && img.naturalWidth ? img : null;
  }

  // Must match AIDesigner.tsx perspScale so placement and rendering are in sync
  function perspScale(cy: number) { return 0.55 + (cy / CANVAS_H) * 0.70; }

  // Scale is relative to CANVAS_W so changing imageUrl (BG removal) never changes rendered size
  function itemDims(item: PlacedItem) {
    const img = getImg(item.imageUrl);
    const ps  = perspScale(item.cy);
    const fw  = CANVAS_W * item.scale * ps;
    const fh  = (img?.naturalWidth ?? 0) > 0 ? (img!.naturalHeight / img!.naturalWidth) * fw : fw;
    return { fw, fh };
  }

  // ── Corner world positions (for hit-test and drawing) ─────────────────────
  function cornerPositions(item: PlacedItem, fw: number, fh: number, pad: number) {
    const rot = item.rotation * Math.PI / 180;
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const local = [
      { key: 'TL', lx: -fw / 2 - pad, ly: -fh / 2 - pad },
      { key: 'TR', lx:  fw / 2 + pad, ly: -fh / 2 - pad },
      { key: 'BL', lx: -fw / 2 - pad, ly:  fh / 2 + pad },
      { key: 'BR', lx:  fw / 2 + pad, ly:  fh / 2 + pad },
    ];
    return local.map(c => ({
      key: c.key,
      x: item.cx + c.lx * cos - c.ly * sin,
      y: item.cy + c.lx * sin + c.ly * cos,
    }));
  }

  function hitCorner(item: PlacedItem, px: number, py: number): string | null {
    const { fw, fh } = itemDims(item);
    for (const c of cornerPositions(item, fw, fh, 8)) {
      if ((px - c.x) ** 2 + (py - c.y) ** 2 <= HANDLE_HIT ** 2) return c.key;
    }
    return null;
  }

  function hitItem(item: PlacedItem, px: number, py: number): boolean {
    const { fw, fh } = itemDims(item);
    const hw = fw / 2 + 12, hh = fh / 2 + 12;
    const dx = px - item.cx, dy = py - item.cy;
    const rad = -item.rotation * Math.PI / 180;
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
    return Math.abs(lx) <= hw && Math.abs(ly) <= hh;
  }

  // ── Floor shadow ──────────────────────────────────────────────────────────
  function drawFloorShadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, fw: number, fh: number) {
    if (fw <= 0 || fh <= 0) return;
    const floorY = cy + fh * 0.50;
    ctx.save();
    ctx.translate(cx, floorY);
    ctx.scale(1, 0.12);
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, Math.max(1, fw * 0.58));
    g.addColorStop(0,    'rgba(0,0,0,0.28)');
    g.addColorStop(0.45, 'rgba(0,0,0,0.12)');
    g.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, fw * 0.58, fw * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Main draw ─────────────────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled  = true;
    ctx.imageSmoothingQuality  = 'high';
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Room background
    if (roomImgRef.current) {
      ctx.drawImage(roomImgRef.current, 0, 0, CANVAS_W, CANVAS_H);
    } else {
      const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bg.addColorStop(0, '#EAE5DF');
      bg.addColorStop(1, '#CFC9C0');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.strokeStyle = 'rgba(0,0,0,0.07)';
      ctx.lineWidth = 1;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_H * 0.62);
      ctx.lineTo(CANVAS_W, CANVAS_H * 0.62);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const sorted = [...itemsRef.current].sort((a, b) => a.zIndex - b.zIndex);

    sorted.forEach(item => {
      const img = getImg(item.imageUrl);
      if (!img) return;

      const { fw, fh } = itemDims(item);

      // No floor shadow for ceiling-hung items
      const isPendant = item.productName?.toLowerCase().includes('pendant')
        || item.productName?.toLowerCase().includes('chandelier');
      if (!isPendant) drawFloorShadow(ctx, item.cx, item.cy, fw, fh);

      // Room-adaptive brightness
      const roomBright   = roomImgRef.current ? getRoomBrightAt(item.cx, item.cy) : 0.65;
      const brightFilter = Math.max(0.72, Math.min(1.18, 0.58 + roomBright * 0.90));

      ctx.save();
      ctx.translate(item.cx, item.cy);
      ctx.rotate(item.rotation * Math.PI / 180);
      ctx.filter = `brightness(${brightFilter.toFixed(2)})`;
      ctx.drawImage(img, -fw / 2, -fh / 2, fw, fh);
      ctx.filter = 'none';

      // Processing overlay — dim item while BG removal is running
      if (processingRef.current.has(item.id)) {
        ctx.fillStyle = 'rgba(0,0,0,0.40)';
        ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
      }

      // Selection outline + corner handles
      if (item.id === selectedRef.current) {
        const pad = 8;
        ctx.shadowColor = 'rgba(249,115,22,0.45)';
        ctx.shadowBlur  = 14;
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth   = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(-fw / 2 - pad, -fh / 2 - pad, fw + pad * 2, fh + pad * 2);
        ctx.shadowBlur = 0;

        // Corner handles
        const handles: [number, number][] = [
          [-fw / 2 - pad, -fh / 2 - pad],
          [ fw / 2 + pad, -fh / 2 - pad],
          [-fw / 2 - pad,  fh / 2 + pad],
          [ fw / 2 + pad,  fh / 2 + pad],
        ];
        handles.forEach(([hx, hy]) => {
          ctx.beginPath();
          ctx.arc(hx, hy, HANDLE_R + 2, 0, Math.PI * 2);
          ctx.fillStyle = '#f97316';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(hx, hy, HANDLE_R - 2, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
        });
      }

      ctx.restore();
    });

    onCanvasReady?.(canvas);
  }, [items, selectedId, processingIds, onCanvasReady]);

  // ── Coordinate conversion ─────────────────────────────────────────────────
  const toCanvas = (e: React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (CANVAS_W / r.width),
      y: (e.clientY - r.top)  * (CANVAS_H / r.height),
    };
  };

  // ── Mouse events ──────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    const p = toCanvas(e);

    // 1. Corner resize takes priority over item move
    if (selectedRef.current) {
      const selItem = itemsRef.current.find(i => i.id === selectedRef.current);
      if (selItem) {
        const corner = hitCorner(selItem, p.x, p.y);
        if (corner) {
          const dx = p.x - selItem.cx, dy = p.y - selItem.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          dragRef.current = {
            type: 'resize', active: true, id: selItem.id,
            origScale: selItem.scale, origDist: Math.max(dist, 20),
            cx: selItem.cx, cy: selItem.cy,
          };
          return;
        }
      }
    }

    // 2. Item body hit → move
    const sorted = [...itemsRef.current].sort((a, b) => b.zIndex - a.zIndex);
    for (const item of sorted) {
      if (hitItem(item, p.x, p.y)) {
        onSelect(item.id);
        dragRef.current = {
          type: 'move', active: true, id: item.id,
          offX: p.x - item.cx, offY: p.y - item.cy,
        };
        return;
      }
    }

    onSelect(null);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const p      = toCanvas(e);
    const d      = dragRef.current;
    const canvas = canvasRef.current;

    if (d?.active) {
      if (d.type === 'move') {
        onUpdateItem(d.id, {
          cx: Math.max(30, Math.min(CANVAS_W - 30, p.x - d.offX)),
          cy: Math.max(30, Math.min(CANVAS_H - 30, p.y - d.offY)),
        });
      } else {
        // Resize: new scale proportional to distance from item center
        const dx = p.x - d.cx, dy = p.y - d.cy;
        const newDist  = Math.sqrt(dx * dx + dy * dy);
        const newScale = Math.max(0.05, Math.min(1.0, d.origScale * (newDist / d.origDist)));
        onUpdateItem(d.id, { scale: newScale });
      }
      return;
    }

    // Cursor feedback
    if (!canvas) return;
    const selItem = itemsRef.current.find(i => i.id === selectedRef.current);
    if (selItem && hitCorner(selItem, p.x, p.y)) {
      canvas.style.cursor = 'nwse-resize';
      return;
    }
    const sorted = [...itemsRef.current].sort((a, b) => b.zIndex - a.zIndex);
    canvas.style.cursor = sorted.some(i => hitItem(i, p.x, p.y)) ? 'grab' : 'default';
  };

  const stopDrag = () => { if (dragRef.current) dragRef.current.active = false; };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-stone-900 shadow-2xl ring-1 ring-stone-700 w-full"
      style={{ aspectRatio: '3/2' }}
    >
      {/* Piece count badge */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <span className="bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
          {items.length === 0 ? 'Add furniture from the sidebar' : `${items.length} piece${items.length !== 1 ? 's' : ''} placed`}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full h-full block"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      />

      {/* Overlay: spinners, hints, etc. */}
      {overlayContent}

      {/* Empty state */}
      {!roomImage && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-5 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, #F5F0EB 0%, #E8E0D8 100%)' }}
        >
          <div
            className="w-24 h-24 rounded-[28px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FED7AA 0%, #FDBA74 100%)', boxShadow: '0 12px 40px rgba(249,115,22,0.25)' }}
          >
            <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-stone-800 font-bold text-lg mb-1">Upload your room photo</p>
            <p className="text-stone-500 text-sm">AI analyzes colors, style and suggests perfect furniture</p>
          </div>
        </div>
      )}
    </div>
  );
};
