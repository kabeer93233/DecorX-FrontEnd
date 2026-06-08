import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface GenerateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  onClick,
  disabled = false,
  isGenerating = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isGenerating}
      className="w-full py-4 px-8 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold rounded-full shadow-xl hover:shadow-2xl hover:from-orange-600 hover:to-amber-700 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Generating Preview...</span>
        </>
      ) : (
        <>
          <Sparkles className="h-6 w-6" />
          <span>Generate AI Preview</span>
        </>
      )}
    </button>
  );
};
