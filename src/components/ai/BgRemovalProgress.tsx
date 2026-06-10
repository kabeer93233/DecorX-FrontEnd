import React from 'react';

interface Props { progress: number; isVisible: boolean; }

export const BgRemovalProgress: React.FC<Props> = ({ progress, isVisible }) => {
  if (!isVisible) return null;
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-sm font-medium text-blue-700">
          {progress < 10 ? 'Loading AI model (first time only)…' : `Removing background… ${progress}%`}
        </span>
      </div>
      <div className="w-full bg-blue-100 rounded-full h-1.5">
        <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};
