import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROOMS } from '../data/rooms';

const ROOM_ICONS: Record<string, string> = {
  'living-room-01': '🛋️',
  'bedroom-01': '🛏️',
  'dining-room-01': '🍽️',
};

export const AIPreview: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-3">
            3D Room <span className="text-orange-500">Designer</span>
          </h1>
          <p className="text-lg text-stone-600 max-w-xl mx-auto">
            Pick a room template and furnish it in 3D with AI-powered placement suggestions.
          </p>
        </div>

        {/* Room cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {ROOMS.map((room) => (
            <button
              key={room.id}
              onClick={() => navigate(`/room-editor/${room.id}`)}
              className="group flex flex-col text-left rounded-2xl border-2 border-stone-200 hover:border-orange-400 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              {/* Preview area */}
              <div
                className="w-full h-44 flex items-center justify-center text-7xl"
                style={{ background: `linear-gradient(135deg, ${room.wallColor}cc, ${room.floorColor}88)` }}
              >
                {ROOM_ICONS[room.id] ?? '🏠'}
              </div>

              {/* Info */}
              <div className="p-5 flex-1">
                <h3 className="font-bold text-stone-900 text-lg mb-1">{room.name}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{room.description}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-stone-400">
                  <span>{room.width}m × {room.depth}m</span>
                  <span>·</span>
                  <span>{room.placementZones.length} zones</span>
                </div>
              </div>

              <div className="px-5 pb-4">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 group-hover:text-orange-600 transition-colors">
                  Open in Editor
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🤖',
              title: 'AI Recommendations',
              desc: 'Gemini suggests the best furniture mix for your room type.',
            },
            {
              icon: '🖱️',
              title: 'Drag & Rotate',
              desc: 'Click any item to select, drag it to reposition, rotate with one tap.',
            },
            {
              icon: '💾',
              title: 'Save & Share',
              desc: 'Save your design to your profile and export a PNG screenshot.',
            },
          ].map((f) => (
            <div key={f.title} className="flex gap-4 bg-white rounded-2xl p-5 border border-stone-200">
              <span className="text-3xl">{f.icon}</span>
              <div>
                <h4 className="font-semibold text-stone-900 mb-1">{f.title}</h4>
                <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
