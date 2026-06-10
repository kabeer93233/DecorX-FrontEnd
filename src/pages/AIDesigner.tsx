import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDisplayCategory } from '../components/editor/FurnitureItem';
import { toast } from 'sonner';
import { RoomUploader } from '../components/ai/RoomUploader';
import { RoomInsightsPanel } from '../components/ai/RoomInsightsPanel';
import { BgRemovalProgress } from '../components/ai/BgRemovalProgress';
import { PreviewCanvas, PlacedItem, CANVAS_W, CANVAS_H } from '../components/ai/PreviewCanvas';
import { FurnitureSelector } from '../components/ai/FurnitureSelector';
import { BeforeAfterSlider } from '../components/ai/BeforeAfterSlider';
import { analyzeRoom, suggestPlacement2d, removeBackground, saveAiDesign } from '../services/aiService';
import { RoomAnalysis } from '../types/ai';
import { useShop } from '../context/ShopContext';

interface Product { id: string; productName: string; category: string; price: number; image: string; }

let _zIdx = 1;

export const AIDesigner: React.FC = () => {
  const { addToCart } = useShop();

  const [roomCloudUrl,  setRoomCloudUrl]  = useState<string | null>(null);
  const [roomPreview,   setRoomPreview]   = useState<string | null>(null);
  const [analysis,      setAnalysis]      = useState<RoomAnalysis | null>(null);
  const [isAnalyzing,   setIsAnalyzing]   = useState(false);

  const [items,      setItems]      = useState<PlacedItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [bgProgress,  setBgProgress]  = useState(0);
  const [isAddingItem, setIsAddingItem] = useState(false);

  const [isSaving,  setIsSaving]  = useState(false);
  const [isSaved,   setIsSaved]   = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectedItem = items.find(i => i.id === selectedId) ?? null;

  /* ── Room upload ─────────────────────────────────────────── */
  const handleRoomReady = useCallback(async (cloudUrl: string, previewUrl: string) => {
    setRoomCloudUrl(cloudUrl);
    setRoomPreview(previewUrl);
    setAnalysis(null);
    setResultUrl(null);
    setIsSaved(false);
    setIsAnalyzing(true);
    try {
      const a = await analyzeRoom(cloudUrl);
      setAnalysis(a);
      toast.success('Room analyzed by AI!');
    } catch {
      /* silent */
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /* ── Add furniture ───────────────────────────────────────── */
  const handleAddProduct = useCallback(async (product: Product) => {
    if (!roomPreview) { toast.error('Upload a room photo first'); return; }
    if (!product.image) return;
    if (isAddingItem) return;

    setIsAddingItem(true);
    setBgProgress(0);
    setResultUrl(null);
    setIsSaved(false);

    try {
      let imgUrl = product.image;
      try { imgUrl = await removeBackground(product.image, setBgProgress); } catch { /* use original */ }

      // Use getDisplayCategory to map DB category to a placement-rule-compatible key
      const displayCat = getDisplayCategory(product.productName, product.category);
      // Pass room image URL so Gemini can use it for visual placement
      const placement = await suggestPlacement2d(displayCat, CANVAS_W, CANVAS_H, roomCloudUrl ?? undefined);

      // Offset by number of same-category items to avoid stacking
      const sameCategory = items.filter(i => getDisplayCategory(i.productName, displayCat) === displayCat).length;
      const jitterX = (sameCategory % 3) * 35 - 35;
      const jitterY = Math.floor(sameCategory / 3) * 25;

      const newItem: PlacedItem = {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        productName: product.productName,
        imageUrl: imgUrl,
        cx: Math.max(60, Math.min(CANVAS_W - 60, placement.x + jitterX)),
        cy: Math.max(60, Math.min(CANVAS_H - 60, placement.y + jitterY)),
        scale: placement.scale,
        rotation: placement.rotation,
        zIndex: _zIdx++,
      };

      setItems(prev => [...prev, newItem]);
      setSelectedId(newItem.id);
      toast.success(`${product.productName} added!`);
    } catch {
      toast.error('Could not add furniture — try again');
    } finally {
      setIsAddingItem(false);
    }
  }, [roomPreview, isAddingItem]);

  /* ── Item controls ───────────────────────────────────────── */
  const updateItem = useCallback((id: string, patch: Partial<PlacedItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  }, []);

  // Keyboard shortcuts: Delete = remove, Escape = deselect, Arrow = nudge
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

  const deleteSelected = () => {
    if (!selectedId) return;
    setItems(prev => prev.filter(i => i.id !== selectedId));
    setSelectedId(null);
  };

  const bringToFront = () => { if (selectedId) updateItem(selectedId, { zIndex: _zIdx++ }); };
  const sendToBack   = () => {
    if (!selectedId) return;
    const minZ = Math.min(...items.map(i => i.zIndex));
    updateItem(selectedId, { zIndex: minZ - 1 });
  };

  /* ── Save / Export ───────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    if (!canvasRef.current || !roomCloudUrl || items.length === 0) return;
    setIsSaving(true);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      await saveAiDesign({
        productId: items[0].productId,
        productName: items.map(i => i.productName).join(', '),
        roomImageUrl: roomCloudUrl,
        resultImageDataUrl: dataUrl,
        roomAnalysis: analysis ?? undefined,
      });
      setResultUrl(dataUrl);
      setIsSaved(true);
      toast.success('Design saved to your profile!');
    } catch {
      toast.error('Could not save — try again');
    } finally {
      setIsSaving(false);
    }
  }, [roomCloudUrl, items, analysis]);

  const handleExport = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.download = 'decorx-design.png';
    a.href = canvasRef.current.toDataURL('image/png');
    a.click();
    toast.success('Downloaded!');
  };

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F0EDE8' }}>

      {/* ── Header ─────────────────────────────────────── */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 flex-shrink-0">
        <div className="flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-3">
            <Link to="/ai-preview" className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
            </Link>
            <span className="text-sm font-bold text-stone-900">2D Room Designer</span>
            {items.length > 0 && (
              <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} disabled={items.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Export PNG
            </button>
            <button onClick={handleSave} disabled={items.length === 0 || !roomCloudUrl || isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {isSaving
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
              }
              {isSaved ? 'Saved!' : isSaving ? 'Saving…' : 'Save Design'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Workspace ──────────────────────────────────── */}
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">

        {/* Left sidebar */}
        <aside className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <RoomUploader onImageReady={handleRoomReady} currentImage={roomPreview} />
          <RoomInsightsPanel isAnalyzing={isAnalyzing} analysis={analysis} />
          {isAddingItem && <BgRemovalProgress progress={bgProgress} isVisible />}
          <FurnitureSelector
            selectedProductId={null}
            onSelect={handleAddProduct}
            suggestedCategories={analysis?.suggestedCategories ?? []}
            addMode
          />
        </aside>

        {/* Canvas + controls column */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">

          {/* Canvas */}
          <PreviewCanvas
            roomImage={roomPreview}
            items={items}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpdateItem={updateItem}
            onCanvasReady={c => { canvasRef.current = c; }}
          />

          {/* Selected item toolbar */}
          {selectedItem ? (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-3 flex-shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Thumbnail */}
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0">
                  <img src={selectedItem.imageUrl} className="w-full h-full object-contain" alt={selectedItem.productName} />
                </div>
                <div className="flex-shrink-0">
                  <p className="text-sm font-semibold text-stone-900 max-w-[120px] truncate">{selectedItem.productName}</p>
                  <p className="text-xs text-orange-500 font-medium">Selected</p>
                </div>

                <div className="hidden sm:block h-9 w-px bg-stone-200 mx-1" />

                {/* Scale slider */}
                <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                  <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                  </svg>
                  <span className="text-xs text-stone-500 w-9 flex-shrink-0">{Math.round(selectedItem.scale * 100)}%</span>
                  <input type="range" min="0.05" max="2" step="0.02" value={selectedItem.scale}
                    onChange={e => updateItem(selectedId!, { scale: parseFloat(e.target.value) })}
                    className="flex-1 accent-orange-500 cursor-pointer" />
                </div>

                {/* Rotation slider */}
                <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                  <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  <span className="text-xs text-stone-500 w-8 flex-shrink-0">{selectedItem.rotation}°</span>
                  <input type="range" min="0" max="360" step="5" value={selectedItem.rotation}
                    onChange={e => updateItem(selectedId!, { rotation: parseInt(e.target.value) })}
                    className="flex-1 accent-orange-500 cursor-pointer" />
                </div>

                <div className="hidden sm:block h-9 w-px bg-stone-200 mx-1" />

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={bringToFront} title="Bring to front"
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-500 hover:text-stone-800">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7"/>
                    </svg>
                  </button>
                  <button onClick={sendToBack} title="Send to back"
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-500 hover:text-stone-800">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7"/>
                    </svg>
                  </button>
                  <button onClick={deleteSelected} title="Remove from room"
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-stone-400 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>

                {/* Add to cart */}
                {selectedItem && (
                  <button
                    onClick={() => { addToCart({ ...selectedItem, quantity: 1 } as any); toast.success('Added to cart!'); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          ) : items.length > 0 ? (
            <div className="bg-white/70 rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-500 text-center flex-shrink-0">
              Click a furniture piece on the canvas to select and adjust it
            </div>
          ) : null}

          {/* Items placed list */}
          {items.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-3 flex-shrink-0">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Placed Items</p>
              <div className="flex flex-wrap gap-2">
                {items.map(item => (
                  <button key={item.id} onClick={() => setSelectedId(item.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-sm transition-all ${
                      item.id === selectedId ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-stone-200 hover:border-orange-300 text-stone-700'
                    }`}>
                    <div className="w-6 h-6 rounded overflow-hidden bg-stone-100">
                      <img src={item.imageUrl} className="w-full h-full object-contain" alt={item.productName} />
                    </div>
                    <span className="font-medium text-xs truncate max-w-[100px]">{item.productName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Before/after */}
          {resultUrl && roomPreview && (
            <div className="flex-shrink-0">
              <BeforeAfterSlider beforeImage={roomPreview} afterImage={resultUrl} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
