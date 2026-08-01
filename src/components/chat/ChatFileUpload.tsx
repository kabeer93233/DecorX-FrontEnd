import React from 'react';
import { FileSpreadsheet, X } from 'lucide-react';

interface ChatFileUploadProps {
  fileName: string;
  preview: { rows: number; columns: string[] } | null;
  onDismiss: () => void;
}

export const ChatFileUpload: React.FC<ChatFileUploadProps> = ({ fileName, preview, onDismiss }) => {
  return (
    <div className="mx-3 mb-2 bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={16} className="text-orange-500" />
          <span className="font-medium text-stone-700 truncate max-w-[180px]">{fileName}</span>
        </div>
        <button onClick={onDismiss} className="text-stone-400 hover:text-stone-600">
          <X size={14} />
        </button>
      </div>
      {preview && (
        <div className="mt-1 text-stone-500">
          {preview.rows} rows | Columns: {preview.columns.join(', ')}
        </div>
      )}
    </div>
  );
};
