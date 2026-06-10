import React from 'react';
import { RoomAnalysis } from '../../types/ai';

interface Props {
  isAnalyzing: boolean;
  analysis: RoomAnalysis | null;
}

export const RoomInsightsPanel: React.FC<Props> = ({ isAnalyzing, analysis }) => {
  if (!isAnalyzing && !analysis) return null;

  if (isAnalyzing) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-orange-600">
          <span className="inline-block w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
          <span className="font-semibold text-sm">Analyzing your room with AI...</span>
        </div>
        <div className="space-y-2">
          {[80, 60, 45].map((w, i) => (
            <div key={i} className="h-2.5 bg-orange-200 rounded-full animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-orange-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        <span className="font-semibold text-sm">AI Room Analysis</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-xs text-stone-400 uppercase tracking-wide">Type</span>
          <p className="font-medium text-stone-800 capitalize">{analysis.roomType}</p>
        </div>
        <div>
          <span className="text-xs text-stone-400 uppercase tracking-wide">Style</span>
          <p className="font-medium text-stone-800 capitalize">{analysis.style}</p>
        </div>
      </div>

      {analysis.dominantColors.length > 0 && (
        <div>
          <span className="text-xs text-stone-400 uppercase tracking-wide">Colors</span>
          <div className="flex gap-1.5 mt-1">
            {analysis.dominantColors.map((color, i) => (
              <div key={i} className="w-6 h-6 rounded-full border border-stone-200 shadow-sm" style={{ backgroundColor: color }} title={color} />
            ))}
          </div>
        </div>
      )}

      {analysis.suggestedCategories.length > 0 && (
        <div>
          <span className="text-xs text-stone-400 uppercase tracking-wide">AI Suggests</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {analysis.suggestedCategories.map((cat) => (
              <span key={cat} className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full capitalize">{cat}</span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-stone-500 italic border-t border-orange-100 pt-2">{analysis.reason}</p>
    </div>
  );
};
