import React, { useRef, useState } from 'react';
import { uploadRoomImage } from '../../services/aiService';
import { toast } from 'sonner';

interface Props {
  onImageReady: (cloudinaryUrl: string, previewUrl: string) => void;
  currentImage: string | null;
  label?: string;
}

export const RoomUploader: React.FC<Props> = ({ onImageReady, currentImage, label = '1. Upload Your Room Photo' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10 MB'); return; }

    const previewUrl = URL.createObjectURL(file);
    setUploading(true);
    try {
      const cloudinaryUrl = await uploadRoomImage(file);
      onImageReady(cloudinaryUrl, previewUrl);
    } catch {
      toast.error('Upload failed — please try again');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-stone-900">{label}</h3>
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl text-center transition-all
          ${uploading ? 'border-orange-300 cursor-wait bg-orange-50' : 'border-stone-300 cursor-pointer hover:border-orange-400 hover:bg-orange-50 bg-stone-50'}`}
      >
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
        {uploading ? (
          <div className="py-10">
            <span className="inline-block w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-3" />
            <p className="text-stone-600 font-medium text-sm">Uploading…</p>
          </div>
        ) : currentImage ? (
          <div className="relative">
            <img src={currentImage} alt="Room" className="w-full h-48 object-cover rounded-xl" />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <div className="text-white text-center">
                <svg className="w-7 h-7 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <p className="text-sm font-medium">Change Photo</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10">
            <svg className="w-12 h-12 mx-auto text-stone-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-stone-600 font-medium text-sm mb-1">Click to upload room photo</p>
            <p className="text-xs text-stone-400">JPG, PNG or WEBP · max 10 MB</p>
          </div>
        )}
      </div>
    </div>
  );
};
