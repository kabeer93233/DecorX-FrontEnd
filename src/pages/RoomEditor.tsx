import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ROOMS, CUSTOM_ROOM } from '../data/rooms';
import { useEditorStore } from '../store/editorStore';
import SceneCanvas, { SceneCanvasRef } from '../components/editor/SceneCanvas';
import ProductSidebar from '../components/editor/ProductSidebar';
import ObjectControls from '../components/editor/ObjectControls';
import { saveDesign, getDesign } from '../services/aiService';

export default function RoomEditor() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const designId     = searchParams.get('designId');
  const photoParam      = searchParams.get('photo') ?? undefined;
  const wallColorParam  = searchParams.get('wallColor');
  const floorColorParam = searchParams.get('floorColor');

  const canvasRef = useRef<SceneCanvasRef>(null);
  const [saving, setSaving] = useState(false);

  const { room, setRoom, loadDesign, items, currentDesignId, setCurrentDesignId, clearItems } =
    useEditorStore();

  useEffect(() => {
    const baseRoom = roomId === 'custom'
      ? {
          ...CUSTOM_ROOM,
          wallColor:  wallColorParam  ? `#${wallColorParam}`  : CUSTOM_ROOM.wallColor,
          floorColor: floorColorParam ? `#${floorColorParam}` : CUSTOM_ROOM.floorColor,
        }
      : ROOMS.find((r) => r.id === roomId);
    const found = baseRoom;
    if (!found) { navigate('/ai-preview', { replace: true }); return; }
    setRoom(found);
    clearItems();

    if (designId) {
      getDesign(designId)
        .then((d) => {
          loadDesign({ id: d.id, name: d.name, roomId: d.roomId, items: d.items ?? [] });
          if (d.cameraState && canvasRef.current) {
            canvasRef.current.setCameraPreset({
              position: d.cameraState.position ?? found.cameraPresets[0].position,
              target: d.cameraState.target ?? [0, 0.5, 0],
            });
          }
          toast.success('Design loaded');
        })
        .catch(() => toast.error('Could not load design'));
    }
  }, [roomId, designId]);

  const handleSave = useCallback(async () => {
    if (!room) return;
    setSaving(true);
    try {
      const screenshotDataUrl = canvasRef.current?.takeScreenshot() ?? null;
      const cameraState = canvasRef.current?.getCameraState() ?? null;
      const result = await saveDesign({
        roomId: room.id, items, cameraState,
        screenshotUrl: screenshotDataUrl,
        designId: currentDesignId ?? undefined,
      });
      if (!currentDesignId) setCurrentDesignId(result.id);
      toast.success('Design saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  }, [room, items, currentDesignId, setCurrentDesignId]);

  const handleScreenshot = useCallback(() => {
    const dataUrl = canvasRef.current?.takeScreenshot();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `decorx-${room?.id ?? 'room'}-${Date.now()}.png`;
    link.href = dataUrl; link.click();
    toast.success('Screenshot saved!');
  }, [room]);

  if (!room) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#EDE8E1' }}>
        <span className="inline-block w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden" style={{ zIndex: 50 }}>

      {/* ── LEFT SIDEBAR ── */}
      <ProductSidebar />

      {/* ── 3D CANVAS AREA ── */}
      <div className="relative flex-1 h-full" style={{ background: '#EDE8E1' }}>
        <SceneCanvas ref={canvasRef} room={room} photoBackground={photoParam} />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 pointer-events-none z-10">
          {/* Left: back + room name */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <Link
              to="/ai-preview"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur rounded-xl shadow-md border border-stone-200/80 text-sm text-stone-700 hover:text-orange-500 hover:border-orange-300 transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Rooms
            </Link>
            <div className="px-3 py-1.5 bg-white/95 backdrop-blur rounded-xl shadow-md border border-stone-200/80 text-sm font-semibold text-stone-800">
              {room.name}
            </div>
            {items.length > 0 && (
              <div className="px-2.5 py-1 bg-orange-500 rounded-xl text-xs font-semibold text-white shadow">
                {items.length} item{items.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Center: camera presets */}
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur rounded-xl shadow-md border border-stone-200/80 px-3 py-1.5 pointer-events-auto">
            <span className="text-xs text-stone-400 font-medium mr-1">View</span>
            {room.cameraPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => canvasRef.current?.setCameraPreset(preset)}
                className="px-2.5 py-1 text-xs rounded-lg hover:bg-orange-50 hover:text-orange-600 text-stone-600 transition-colors font-medium"
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Right: export + save */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={handleScreenshot}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur rounded-xl shadow-md border border-stone-200/80 text-sm text-stone-600 hover:text-stone-800 hover:border-stone-300 transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Export
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-xl shadow-md text-sm text-white font-semibold transition-colors"
            >
              {saving ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              )}
              {saving ? 'Saving…' : 'Save Design'}
            </button>
          </div>
        </div>

        {/* Bottom: selected-item controls */}
        <ObjectControls />

        {/* Drag hint */}
        {items.length > 0 && (
          <div className="absolute bottom-5 right-5 bg-white/80 backdrop-blur rounded-xl px-3 py-1.5 text-xs text-stone-500 border border-stone-200/60 shadow-sm pointer-events-none">
            Click item to select · Drag to move · Rotate/remove below
          </div>
        )}
      </div>
    </div>
  );
}
