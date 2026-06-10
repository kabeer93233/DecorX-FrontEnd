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

interface Props {
  roomImage: string | null;
  items: PlacedItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateItem: (id: string, patch: Partial<PlacedItem>) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export const PreviewCanvas: React.FC<Props> = ({
  roomImage, items, selectedId, onSelect, onUpdateItem, onCanvasReady,
}) => {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const roomImgRef   = useRef<HTMLImageElement | null>(null);
  const imgCacheRef  = useRef<Map<string, HTMLImageElement>>(new Map());
  const dragRef      = useRef<{ active: boolean; id: string; offX: number; offY: number } | null>(null);
  const itemsRef     = useRef(items);
  const selectedRef  = useRef(selectedId);
  itemsRef.current   = items;
  selectedRef.current = selectedId;

  useEffect(() => {
    if (!roomImage) { roomImgRef.current = null; redraw(); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = roomImage;
    img.onload = () => { roomImgRef.current = img; redraw(); };
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

  useEffect(() => { redraw(); }, [items, selectedId]);

  function getImg(url: string) {
    const img = imgCacheRef.current.get(url);
    return img?.complete && img.naturalWidth ? img : null;
  }

  function perspScale(cy: number) {
    return 1 + (cy / CANVAS_H - 0.45) * 0.18;
  }

  function drawFloorShadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, fw: number, fh: number) {
    ctx.save();
    ctx.translate(cx, cy + fh * 0.46);
    ctx.scale(1, 0.22);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, fw * 0.48);
    g.addColorStop(0, 'rgba(0,0,0,0.30)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, fw * 0.48, fw * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

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

      const ps = perspScale(item.cy);
      const fw = img.naturalWidth  * item.scale * ps;
      const fh = img.naturalHeight * item.scale * ps;

      drawFloorShadow(ctx, item.cx, item.cy, fw, fh);

      ctx.save();
      ctx.translate(item.cx, item.cy);
      ctx.rotate(item.rotation * Math.PI / 180);
      ctx.drawImage(img, -fw / 2, -fh / 2, fw, fh);

      if (item.id === selectedRef.current) {
        const pad = 7;
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 5]);
        ctx.strokeRect(-fw / 2 - pad, -fh / 2 - pad, fw + pad * 2, fh + pad * 2);
        ctx.setLineDash([]);

        [
          [-fw / 2 - pad, -fh / 2 - pad],
          [ fw / 2 + pad, -fh / 2 - pad],
          [-fw / 2 - pad,  fh / 2 + pad],
          [ fw / 2 + pad,  fh / 2 + pad],
        ].forEach(([hx, hy]) => {
          ctx.beginPath();
          ctx.arc(hx, hy, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }

      ctx.restore();
    });

    onCanvasReady?.(canvas);
  }, [items, selectedId, onCanvasReady]);

  const toCanvas = (e: React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (CANVAS_W / r.width),
      y: (e.clientY - r.top)  * (CANVAS_H / r.height),
    };
  };

  function hitItem(item: PlacedItem, px: number, py: number): boolean {
    const img = getImg(item.imageUrl);
    if (!img) return false;
    const ps = perspScale(item.cy);
    const hw = (img.naturalWidth  * item.scale * ps) / 2 + 10;
    const hh = (img.naturalHeight * item.scale * ps) / 2 + 10;
    const dx = px - item.cx;
    const dy = py - item.cy;
    const rad = -item.rotation * Math.PI / 180;
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
    return Math.abs(lx) <= hw && Math.abs(ly) <= hh;
  }

  const onMouseDown = (e: React.MouseEvent) => {
    const p = toCanvas(e);
    const sorted = [...itemsRef.current].sort((a, b) => b.zIndex - a.zIndex);
    for (const item of sorted) {
      if (hitItem(item, p.x, p.y)) {
        onSelect(item.id);
        dragRef.current = { active: true, id: item.id, offX: p.x - item.cx, offY: p.y - item.cy };
        return;
      }
    }
    onSelect(null);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const d = dragRef.current;
    if (!d?.active) return;
    const p = toCanvas(e);
    onUpdateItem(d.id, {
      cx: Math.max(30, Math.min(CANVAS_W - 30, p.x - d.offX)),
      cy: Math.max(30, Math.min(CANVAS_H - 30, p.y - d.offY)),
    });
  };

  const stopDrag = () => { if (dragRef.current) dragRef.current.active = false; };

  const onWheel = (e: React.WheelEvent) => {
    const sid = selectedRef.current;
    if (!sid) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.03 : 0.03;
    const item = itemsRef.current.find(i => i.id === sid);
    if (!item) return;
    onUpdateItem(sid, { scale: Math.max(0.05, Math.min(2.0, item.scale + delta)) });
  };

  const isDragging = dragRef.current?.active;

  return (
    <div className="relative rounded-2xl overflow-hidden bg-stone-800 shadow-2xl ring-1 ring-stone-700 flex-1 min-h-0">
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        <span className="bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
          {items.length === 0 ? 'Select furniture from the left to add items' : `${items.length} piece${items.length !== 1 ? 's' : ''} in room`}
        </span>
        {selectedId && (
          <span className="bg-orange-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
            Drag to move · adjust scale & rotation below
          </span>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full h-full object-contain block"
        style={{ cursor: isDragging ? 'grabbing' : selectedId ? 'grab' : 'default' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onWheel={onWheel}
      />

      {!roomImage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-stone-100/95 pointer-events-none">
          <div className="w-20 h-20 bg-stone-200 rounded-3xl flex items-center justify-center">
            <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-stone-700 font-semibold mb-1">Upload a room photo to start designing</p>
            <p className="text-stone-500 text-sm">AI will analyze colors, style and suggest furniture</p>
          </div>
        </div>
      )}
    </div>
  );
};
