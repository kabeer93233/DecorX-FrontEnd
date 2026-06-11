import custom_axios from '../axios/axios';
import { RoomAnalysis, PlacementSuggestion2d, AiDesignRecord } from '../types/ai';
import { uploadToCloudinary, uploadDataUrlToCloudinary } from '../lib/cloudinaryUpload';

// ── 2D AI DESIGNER ────────────────────────────────────────────────────────────

export async function uploadRoomImage(file: File): Promise<string> {
  return uploadToCloudinary(file, 'decorx-rooms');
}

export async function analyzeRoom(roomImageUrl: string): Promise<RoomAnalysis> {
  const res = await custom_axios.post('/ai-preview/analyze-room', { roomImageUrl });
  return res.data.data;
}

export async function suggestPlacement2d(
  productCategory: string,
  canvasWidth: number,
  canvasHeight: number,
  roomImageUrl?: string,
  existingCount?: number,
): Promise<PlacementSuggestion2d> {
  const res = await custom_axios.post('/ai-preview/suggest-placement-2d', {
    productCategory,
    canvasWidth,
    canvasHeight,
    ...(roomImageUrl    ? { roomImageUrl }    : {}),
    ...(existingCount != null ? { existingCount } : {}),
  });
  return res.data.data;
}

// Crop a transparent-background image to the tightest bounding box of its content
async function autoCropTransparent(objectUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width  = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, c.width, c.height);
      let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
          if (data[(y * c.width + x) * 4 + 3] > 18) {
            if (x < x0) x0 = x; if (x > x1) x1 = x;
            if (y < y0) y0 = y; if (y > y1) y1 = y;
          }
        }
      }
      if (x1 <= x0 || y1 <= y0) { resolve(objectUrl); return; }
      const pad = 8;
      const cw = Math.min(c.width,  x1 - x0 + pad * 2);
      const ch = Math.min(c.height, y1 - y0 + pad * 2);
      const out = document.createElement('canvas');
      out.width = cw; out.height = ch;
      out.getContext('2d')!.drawImage(c, x0 - pad, y0 - pad, cw, ch, 0, 0, cw, ch);
      resolve(out.toDataURL('image/png'));
    };
    img.onerror = () => resolve(objectUrl);
    img.src = objectUrl;
  });
}

// Use Gemini to crop original image to product bounds, then apply after bg removal
async function geminiCropImage(
  imageUrl: string,
  box: { x1: number; y1: number; x2: number; y2: number },
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const pad = 0.02;
      const x1 = Math.max(0, (box.x1 - pad) * img.naturalWidth);
      const y1 = Math.max(0, (box.y1 - pad) * img.naturalHeight);
      const x2 = Math.min(img.naturalWidth,  (box.x2 + pad) * img.naturalWidth);
      const y2 = Math.min(img.naturalHeight, (box.y2 + pad) * img.naturalHeight);
      const cw = x2 - x1, ch = y2 - y1;
      if (cw < 20 || ch < 20) { resolve(imageUrl); return; }
      const out = document.createElement('canvas');
      out.width = cw; out.height = ch;
      out.getContext('2d')!.drawImage(img, x1, y1, cw, ch, 0, 0, cw, ch);
      resolve(out.toDataURL('image/png'));
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}

export async function removeBackground(
  imageUrl: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  // ── Try Clipdrop via backend first (server-side, best quality) ──
  try {
    if (onProgress) onProgress(10);
    const res = await custom_axios.post('/ai-preview/process-product-image', { imageUrl });
    const cleanDataUrl: string | undefined = res.data?.data?.cleanImageDataUrl;
    if (cleanDataUrl) {
      if (onProgress) onProgress(90);
      const cropped = await autoCropTransparent(cleanDataUrl);
      if (onProgress) onProgress(100);
      return cropped;
    }
  } catch { /* fall through to WASM */ }

  // ── WASM fallback — medium model (confirmed working, better quality than small) ──
  // Fetch as Blob in main thread to avoid CORS issues inside the WASM worker
  let source: Blob | string = imageUrl;
  try {
    const fetchRes = await fetch(imageUrl, { mode: 'cors' });
    if (fetchRes.ok) source = await fetchRes.blob();
  } catch { /* use URL */ }

  if (onProgress) onProgress(15);

  const { removeBackground: removeBg } = await import('@imgly/background-removal');

  // Race WASM against a timeout so it never hangs silently
  const wasmPromise = removeBg(source, {
    progress: (_key: string, current: number, total: number) => {
      if (onProgress && total > 0) onProgress(15 + Math.round((current / total) * 80));
    },
    model: 'medium',
  });
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('BG removal timed out')), 120_000),
  );

  const blob = await Promise.race([wasmPromise, timeout]);
  const objectUrl = URL.createObjectURL(blob as Blob);
  const result = await autoCropTransparent(objectUrl);
  if (onProgress) onProgress(100);
  return result;
}

export async function saveAiDesign(payload: {
  productId: string;
  productName: string;
  roomImageUrl: string;
  resultImageDataUrl: string;
  roomAnalysis?: RoomAnalysis;
  placement?: PlacementSuggestion2d;
}): Promise<{ id: string; createdAt: string }> {
  const resultImageUrl = await uploadDataUrlToCloudinary(payload.resultImageDataUrl, 'decorx-results');
  const res = await custom_axios.post('/ai-preview/save-ai-design', {
    productId: payload.productId,
    productName: payload.productName,
    roomImageUrl: payload.roomImageUrl,
    resultImageUrl,
    roomAnalysis: payload.roomAnalysis,
    placement: payload.placement,
  });
  return res.data.data;
}

export async function getMyAiDesigns(): Promise<AiDesignRecord[]> {
  const res = await custom_axios.get('/ai-preview/my-ai-designs');
  return res.data.data;
}

export async function deleteAiDesign(id: string): Promise<void> {
  await custom_axios.delete(`/ai-preview/ai-designs/${id}`);
}
