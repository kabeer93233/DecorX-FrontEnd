import React from 'react';
import { Download, Save, CheckCircle } from 'lucide-react';

interface ResultPreviewProps {
  resultImage: string;
  onSave: () => void;
  onDownload: () => void;
  isSaved?: boolean;
}

export const ResultPreview: React.FC<ResultPreviewProps> = ({
  resultImage,
  onSave,
  onDownload,
  isSaved = false,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Generated Preview
        </h3>
      </div>

      <div className="relative rounded-2xl overflow-hidden border-2 border-orange-200 shadow-lg">
        <img
          src={resultImage}
          alt="Generated result"
          className="w-full h-auto"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onSave}
          disabled={isSaved}
          className="flex items-center justify-center gap-2 py-3 px-6 bg-stone-900 text-white font-semibold rounded-full hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-5 w-5" />
          {isSaved ? 'Saved' : 'Save Design'}
        </button>
        
        <button
          onClick={onDownload}
          className="flex items-center justify-center gap-2 py-3 px-6 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors"
        >
          <Download className="h-5 w-5" />
          Download
        </button>
      </div>
    </div>
  );
};
