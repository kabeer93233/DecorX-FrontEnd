import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

interface PositionControlsProps {
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  onPositionChange: (position: { x: number; y: number }) => void;
  onScaleChange: (scale: number) => void;
  onRotationChange: (rotation: number) => void;
  disabled?: boolean;
}

export const PositionControls: React.FC<PositionControlsProps> = ({
  position,
  scale,
  rotation,
  onPositionChange,
  onScaleChange,
  onRotationChange,
  disabled = false,
}) => {
  const moveStep = 10;

  const handleMove = (dx: number, dy: number) => {
    onPositionChange({
      x: position.x + dx,
      y: position.y + dy,
    });
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-stone-200">
      <h3 className="font-bold text-stone-900 text-lg">Position Controls</h3>

      {/* Movement Controls */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-stone-700 block">Move Furniture</label>
        <div className="grid grid-cols-3 gap-2 max-w-xs">
          <div></div>
          <button
            onClick={() => handleMove(0, -moveStep)}
            disabled={disabled}
            className="p-3 bg-stone-100 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUp className="h-5 w-5 mx-auto text-stone-700" />
          </button>
          <div></div>
          
          <button
            onClick={() => handleMove(-moveStep, 0)}
            disabled={disabled}
            className="p-3 bg-stone-100 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-5 w-5 mx-auto text-stone-700" />
          </button>
          <div className="flex items-center justify-center text-xs font-medium text-stone-500">
            {position.x}, {position.y}
          </div>
          <button
            onClick={() => handleMove(moveStep, 0)}
            disabled={disabled}
            className="p-3 bg-stone-100 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRight className="h-5 w-5 mx-auto text-stone-700" />
          </button>
          
          <div></div>
          <button
            onClick={() => handleMove(0, moveStep)}
            disabled={disabled}
            className="p-3 bg-stone-100 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDown className="h-5 w-5 mx-auto text-stone-700" />
          </button>
          <div></div>
        </div>
      </div>

      {/* Scale Control */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-stone-700 flex items-center justify-between">
          <span>Size</span>
          <span className="text-orange-500 font-bold">{Math.round(scale * 100)}%</span>
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onScaleChange(Math.max(0.1, scale - 0.1))}
            disabled={disabled || scale <= 0.1}
            className="p-2 bg-stone-100 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ZoomOut className="h-4 w-4 text-stone-700" />
          </button>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={scale}
            onChange={(e) => onScaleChange(parseFloat(e.target.value))}
            disabled={disabled}
            className="flex-1 accent-orange-500 disabled:opacity-50"
          />
          <button
            onClick={() => onScaleChange(Math.min(2, scale + 0.1))}
            disabled={disabled || scale >= 2}
            className="p-2 bg-stone-100 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ZoomIn className="h-4 w-4 text-stone-700" />
          </button>
        </div>
      </div>

      {/* Rotation Control */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-stone-700 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <RotateCw className="h-4 w-4" />
            Rotation
          </span>
          <span className="text-orange-500 font-bold">{rotation}°</span>
        </label>
        <input
          type="range"
          min="0"
          max="360"
          step="15"
          value={rotation}
          onChange={(e) => onRotationChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full accent-orange-500 disabled:opacity-50"
        />
      </div>

      {/* Reset Button */}
      <button
        onClick={() => {
          onPositionChange({ x: 200, y: 200 });
          onScaleChange(0.5);
          onRotationChange(0);
        }}
        disabled={disabled}
        className="w-full py-2 text-sm font-medium text-stone-600 hover:text-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Reset Position
      </button>
    </div>
  );
};
