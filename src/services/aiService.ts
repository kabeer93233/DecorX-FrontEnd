import custom_axios from '../axios/axios';
import { DesignItem } from '../types/editor';
import { RoomAnalysis, PlacementSuggestion2d, AiDesignRecord } from '../types/ai';
import { uploadToCloudinary, uploadDataUrlToCloudinary } from '../lib/cloudinaryUpload';

// ── 3D EDITOR ────────────────────────────────────────────────────────────────

export interface PlacementResult {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  reason: string;
  confidence: number;
  zoneId: string;
}

export interface RecommendResult {
  suggestedCategories: string[];
  reason: string;
}

export async function recommendProducts(
  roomType: string,
  alreadyPlacedCategories: string[] = [],
): Promise<RecommendResult> {
  const res = await custom_axios.post('/ai-preview/recommend-products', {
    roomType,
    alreadyPlacedCategories,
  });
  return res.data.data;
}

export async function suggestPlacement(
  roomId: string,
  productCategory: string,
  productWidth: number,
  productDepth: number,
  existingItems: DesignItem[] = [],
): Promise<PlacementResult> {
  const res = await custom_axios.post('/ai-preview/suggest-placement', {
    roomId,
    productCategory,
    productWidth,
    productDepth,
    existingItems: existingItems.map((it) => ({
      category: it.category,
      position: it.position,
      width: it.scale[0],
      depth: it.scale[2],
    })),
  });
  return res.data.data;
}

export async function saveDesign(payload: {
  roomId: string;
  name?: string;
  items: DesignItem[];
  cameraState?: object | null;
  screenshotUrl?: string | null;
  designId?: string;
}): Promise<{ id: string }> {
  const res = await custom_axios.post('/ai-preview/save-design', payload);
  return res.data.data;
}

export async function getMyDesigns(): Promise<any[]> {
  const res = await custom_axios.get('/ai-preview/my-designs');
  return res.data.data;
}

export async function getDesign(id: string): Promise<any> {
  const res = await custom_axios.get(`/ai-preview/designs/${id}`);
  return res.data.data;
}

export async function deleteDesign(id: string): Promise<void> {
  await custom_axios.delete(`/ai-preview/designs/${id}`);
}

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
): Promise<PlacementSuggestion2d> {
  const res = await custom_axios.post('/ai-preview/suggest-placement-2d', {
    productCategory,
    canvasWidth,
    canvasHeight,
    ...(roomImageUrl ? { roomImageUrl } : {}),
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
  // Step 1: Ask Gemini for the product bounding box to pre-crop and focus the removal
  let sourceUrl = imageUrl;
  try {
    const res = await custom_axios.post('/ai-preview/process-product-image', { imageUrl });
    const box = res.data?.data;
    if (box && typeof box.x1 === 'number') {
      sourceUrl = await geminiCropImage(imageUrl, box);
    }
  } catch { /* skip pre-crop, use original */ }

  // Step 2: WASM background removal
  const { removeBackground: removeBg } = await import('@imgly/background-removal');
  const blob = await removeBg(sourceUrl, {
    progress: (_key: string, current: number, total: number) => {
      if (onProgress && total > 0) onProgress(Math.round((current / total) * 100));
    },
    model: 'small',
  });

  // Step 3: Auto-crop to tightest non-transparent bounds
  const objectUrl = URL.createObjectURL(blob);
  return autoCropTransparent(objectUrl);
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
