import React from 'react';
import { useEditorStore } from '../../store/editorStore';

export default function ObjectControls() {
  const { items, selectedItemId, updateItem, removeItem, selectItem } = useEditorStore();
  const item = items.find((it) => it.id === selectedItemId);

  if (!item) return null;

  const rotate = (delta: number) => {
    const [rx, ry, rz] = item.rotation;
    updateItem(item.id, { rotation: [rx, ry + delta, rz] });
  };

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white rounded-2xl shadow-lg px-4 py-2.5 border border-stone-200 z-10">
      {/* Product name */}
      <span className="text-xs font-semibold text-stone-700 mr-2 max-w-[130px] truncate">{item.productName}</span>

      <div className="w-px h-5 bg-stone-200" />

      {/* Rotate left 45° */}
      <button
        onClick={() => rotate(-Math.PI / 4)}
        title="Rotate left"
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-orange-50 hover:text-orange-600 text-stone-600 text-xs transition-colors font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        Rotate ↺
      </button>

      {/* Rotate right 45° */}
      <button
        onClick={() => rotate(Math.PI / 4)}
        title="Rotate right"
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-orange-50 hover:text-orange-600 text-stone-600 text-xs transition-colors font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
        Rotate ↻
      </button>

      <div className="w-px h-5 bg-stone-200" />

      {/* Delete */}
      <button
        onClick={() => removeItem(item.id)}
        title="Remove from room"
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-red-50 text-red-500 text-xs transition-colors font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Remove
      </button>

      <div className="w-px h-5 bg-stone-200" />

      {/* Deselect */}
      <button
        onClick={() => selectItem(null)}
        title="Deselect"
        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
