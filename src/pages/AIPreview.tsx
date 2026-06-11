import React from 'react';
import { useNavigate } from 'react-router-dom';

export const AIPreview: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">

        <div className="mb-10">
          <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-200">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-3">
            AI Room <span className="text-orange-500">Designer</span>
          </h1>
          <p className="text-stone-500 text-lg max-w-md mx-auto leading-relaxed">
            Upload your room photo, pick furniture, and instantly visualize how it looks — powered by Gemini AI.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/ai-designer')}
          className="inline-flex items-center gap-3 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold rounded-2xl shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          Start Designing
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
        </button>

        {/* Feature pills */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '📸', title: 'Upload Any Room',      desc: 'Works with photos from your phone or camera' },
            { icon: '🤖', title: 'Gemini AI Analysis',   desc: 'Auto-detects room style, colours & best furniture' },
            { icon: '✂️', title: 'Background Removal',  desc: 'Clean product cut-outs with one click per item' },
          ].map(f => (
            <div key={f.title} className="flex flex-col items-center gap-2 bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
              <span className="text-3xl">{f.icon}</span>
              <h4 className="font-bold text-stone-900 text-sm">{f.title}</h4>
              <p className="text-xs text-stone-500 leading-relaxed text-center">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-10 bg-white rounded-3xl p-6 border border-stone-100 shadow-sm text-left">
          <h3 className="font-bold text-stone-900 mb-4 text-center">How it works</h3>
          <div className="space-y-3">
            {[
              { n: '1', t: 'Upload your room photo',           d: 'AI analyzes style, colours and suggests matching furniture' },
              { n: '2', t: 'Click any product to place it',     d: 'Item appears instantly — drag to reposition, scroll to resize' },
              { n: '3', t: 'Optional: remove background',       d: 'Hit ✂️ BG on any item for a clean cut-out look' },
              { n: '4', t: 'Save & add to cart',                d: 'Save your design to your profile and buy with one click' },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3">
                <span className="w-7 h-7 bg-orange-100 text-orange-600 font-bold text-sm rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
                <div>
                  <p className="font-semibold text-stone-800 text-sm">{s.t}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
