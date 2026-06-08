import React, { useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface RoomUploaderProps {
  onImageUpload: (imageDataUrl: string) => void;
  currentImage: string | null;
}

export const RoomUploader: React.FC<RoomUploaderProps> = ({ onImageUpload, currentImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-stone-900 text-lg">Upload Room Image</h3>
      
      <div
        onClick={handleClick}
        className="relative border-2 border-dashed border-stone-300 rounded-2xl p-8 text-center cursor-pointer hover:border-orange-500 transition-colors bg-stone-50 hover:bg-orange-50"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {currentImage ? (
          <div className="relative">
            <img
              src={currentImage}
              alt="Room"
              className="w-full h-64 object-contain rounded-xl"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <div className="text-white text-center">
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">Change Image</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12">
            <ImageIcon className="h-16 w-16 mx-auto text-stone-400 mb-4" />
            <p className="text-stone-600 font-medium mb-2">Click to upload room image</p>
            <p className="text-sm text-stone-400">JPG, PNG or WEBP (max 5MB)</p>
          </div>
        )}
      </div>
    </div>
  );
};
