const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'decorx_room_uploads';

if (!CLOUD_NAME) throw new Error('VITE_CLOUDINARY_CLOUD_NAME is not set in .env');

export async function uploadToCloudinary(file: File | Blob, folder = 'decorx-rooms'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Cloudinary upload failed');
  const data = await res.json();
  return data.secure_url as string;
}

export async function uploadDataUrlToCloudinary(dataUrl: string, folder = 'decorx-results'): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], 'design.png', { type: 'image/png' });
  return uploadToCloudinary(file, folder);
}
