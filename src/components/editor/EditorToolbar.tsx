import React from 'react';
import { RoomTemplate } from '../../data/rooms';

interface Props {
  room: RoomTemplate;
  onCameraPreset: (preset: { position: [number, number, number]; target: [number, number, number] }) => void;
  onScreenshot: () => void;
  onSave: () => void;
  saving: boolean;
}

export default function EditorToolbar({ room, onCameraPreset, onScreenshot, onSave, saving }: Props) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white rounded-2xl shadow-md px-3 py-2 border border-stone-200 z-10">
      {/* Camera preset buttons */}
      <div className="flex items-center gap-0.5">
        <span className="text-xs text-stone-400 mr-1.5 font-medium">View</span>
        {room.cameraPresets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onCameraPreset(preset)}
            className="px-2.5 py-1 text-xs rounded-lg hover:bg-orange-50 hover:text-orange-600 text-stone-600 transition-colors font-medium"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-stone-200 mx-0.5" />

      {/* Screenshot */}
      <button
        onClick={onScreenshot}
        title="Export PNG"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-stone-100 text-stone-600 text-xs transition-colors font-medium"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Export
      </button>

      <div className="w-px h-5 bg-stone-200 mx-0.5" />

      {/* Save */}
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-semibold transition-colors shadow-sm"
      >
        {saving ? (
          <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        )}
        {saving ? 'Saving…' : 'Save Design'}
      </button>
    </div>
  );
}
