import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  getIsVerified,
} from '../utils/auth';
import { RoomUploader } from '../components/ai/RoomUploader';
import { FurnitureSelector } from '../components/ai/FurnitureSelector';
import { PreviewCanvas } from '../components/ai/PreviewCanvas';
import { PositionControls } from '../components/ai/PositionControls';
import { GenerateButton } from '../components/ai/GenerateButton';
import { ResultPreview } from '../components/ai/ResultPreview';
import { BeforeAfterSlider } from '../components/ai/BeforeAfterSlider';
import { products } from '../data/products';
import { generateAIPreview, saveDesign } from '../services/aiService';
import { toast } from 'sonner';
import { ROOMS } from '../data/rooms';
import { uploadRoomImage } from '../services/aiService';

const ROOM_ICONS: Record<string, string> = {
  'living-room-01': '🛋️',
  'bedroom-01':     '🛏️',
  'dining-room-01': '🍽️',
};

export const AIPreview: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleRoomPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10 MB'); return; }
    setUploading(true);
    try {
      const url = await uploadRoomImage(file);
      navigate(`/room-editor/custom?photo=${encodeURIComponent(url)}`);
    } catch {
      toast.error('Upload failed — please try again');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;

    const link = document.createElement('a');
    link.download = `decorx-design-${Date.now()}.png`;
    link.href = resultImage;
    link.click();
    toast.success('Design downloaded!');
  };

  const canGenerate = roomImage && selectedProduct && !isGenerating;
  const isVerified =
    getIsVerified();
  return (
    <div className="min-h-screen bg-[#FFF8F0] py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-3">
            AI Room <span className="text-orange-500">Designer</span>
          </h1>
          <p className="text-stone-500 max-w-lg mx-auto">
            Visualize furniture in your space — choose 2D photo-based design or a full 3D room editor.
          </p>
        </div>

        {/* ── Main Options ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

          {/* 2D AI Designer */}
          <button
            onClick={() => navigate('/ai-designer')}
            className="group flex flex-col text-left rounded-3xl border-2 border-stone-200 hover:border-orange-400 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all"
          >
            <div className="h-44 bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full">AI-Powered</span>
              </div>
            </div>
            <div className="p-6 flex-1">
              <h2 className="text-xl font-bold text-stone-900 mb-2">2D AI Designer</h2>
              <p className="text-stone-500 text-sm leading-relaxed">
                Upload your room photo → AI analyzes style & colors → select furniture → background is removed automatically → drag to place.
              </p>
              <ul className="mt-4 space-y-1.5">
                {['AI room analysis with Gemini', 'Auto background removal', 'AI placement suggestion', 'Save & share design'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-stone-600">
                    <svg className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-6 pb-5">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 group-hover:text-orange-600 transition-colors">
                Open 2D Designer
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </span>
            </div>
          </button>

          {/* 3D Room Editor */}
          <div className="flex flex-col rounded-3xl border-2 border-stone-200 bg-white overflow-hidden shadow-sm">
            <div className="h-44 bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-stone-800 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-stone-600 bg-stone-200 px-2.5 py-0.5 rounded-full">3D Interactive</span>
              </div>
            </div>
            <div className="p-6 flex-1">
              <h2 className="text-xl font-bold text-stone-900 mb-2">3D Room Editor</h2>
              <p className="text-stone-500 text-sm leading-relaxed mb-4">
                Pick a room template or upload your own photo → place furniture in full 3D → drag, rotate, save.
              </p>

              {/* Template cards */}
              <div className="space-y-2">
                {ROOMS.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => navigate(`/room-editor/${room.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-stone-100 hover:border-orange-300 hover:bg-orange-50 transition-all text-left group"
                  >
                    <span className="text-2xl">{ROOM_ICONS[room.id] ?? '🏠'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-800 group-hover:text-orange-600 transition-colors">{room.name}</p>
                      <p className="text-xs text-stone-400">{room.width}m × {room.depth}m · {room.placementZones.length} zones</p>
                    </div>
                    <svg className="w-4 h-4 text-stone-300 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                  </button>
                ))}

                {/* My Room upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 border-dashed border-stone-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-left group disabled:opacity-60 disabled:cursor-wait"
                >
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleRoomPhotoUpload} className="hidden" />
                  {uploading ? (
                    <span className="inline-block w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                  ) : (
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 group-hover:text-orange-600 transition-colors">
                      {uploading ? 'Analyzing room…' : 'My Own Room (Upload Photo)'}
                    </p>
                    <p className="text-xs text-stone-400">Use your real room as the 3D background</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '🤖', t: 'Gemini AI Analysis',    d: 'Room style, colors and furniture detected automatically' },
            { icon: '✂️', t: 'Background Removal',    d: 'Product photos get transparent backgrounds via AI' },
            { icon: '💾', t: 'Save to Profile',       d: 'All designs saved to your account, viewable anytime' },
          ].map((f) => (
            <div key={f.t} className="flex gap-3 bg-white rounded-2xl p-4 border border-stone-100">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <h4 className="font-semibold text-stone-900 text-sm mb-0.5">{f.t}</h4>
                <p className="text-xs text-stone-500 leading-relaxed">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
