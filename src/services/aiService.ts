import custom_axios from '../axios/axios';
import { RoomAnalysis, AiDesignRecord } from '../types/ai';
import { uploadToCloudinary } from '../lib/cloudinaryUpload';

// ── 2D AI DESIGNER ────────────────────────────────────────────────────────────

export async function uploadRoomImage(file: File): Promise<string> {
  return uploadToCloudinary(file, 'decorx-rooms');
}

// ── Client-side room analysis (no API needed) ────────────────────────────────
// Samples the room image pixels to extract dominant colors, brightness, and
// warm/cool tone — then maps these to room style and furniture suggestions.
function analyzeRoomLocally(imageUrl: string): Promise<RoomAnalysis> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const W = 48, H = 32;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0, W, H);
      const { data } = ctx.getImageData(0, 0, W, H);

      let rSum = 0, gSum = 0, bSum = 0, n = 0;
      // Sample wall area (top 50%) and floor area (bottom 30%) separately
      const wallPixels: number[][] = [], floorPixels: number[][] = [];
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          rSum += r; gSum += g; bSum += b; n++;
          if (y < H * 0.5) wallPixels.push([r, g, b]);
          if (y > H * 0.7) floorPixels.push([r, g, b]);
        }
      }

      const avgR = rSum / n, avgG = gSum / n, avgB = bSum / n;
      const brightness = (avgR + avgG + avgB) / (3 * 255); // 0–1

      // Warm/cool bias: warm = more red+green than blue
      const warmBias = (avgR + avgG * 0.8) / (avgB + 1);
      const isWarm   = warmBias > 1.2;
      const isCool   = warmBias < 0.85;
      const isDark   = brightness < 0.35;
      const isLight  = brightness > 0.65;

      // Dominant wall color
      const wallAvg  = wallPixels.reduce((a, [r,g,b]) => [a[0]+r, a[1]+g, a[2]+b], [0,0,0])
        .map(v => Math.round(v / (wallPixels.length || 1)));
      const floorAvg = floorPixels.reduce((a, [r,g,b]) => [a[0]+r, a[1]+g, a[2]+b], [0,0,0])
        .map(v => Math.round(v / (floorPixels.length || 1)));
      const toHex = ([r,g,b]: number[]) => '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');

      // Saturation of average color
      const maxC = Math.max(avgR, avgG, avgB) / 255;
      const minC = Math.min(avgR, avgG, avgB) / 255;
      const saturation = maxC > 0 ? (maxC - minC) / maxC : 0;

      // Map to style
      let style = 'modern';
      if (isDark && saturation < 0.2)        style = 'industrial';
      else if (isLight && saturation < 0.15) style = 'minimalist';
      else if (isWarm && saturation > 0.2)   style = 'traditional';
      else if (isCool && isLight)            style = 'scandinavian';
      else if (saturation > 0.35)            style = 'bohemian';

      // Suggest furniture based on detected style
      const styleCats: Record<string, string[]> = {
        modern:        ['sofa', 'lamp', 'table'],
        minimalist:    ['chair', 'table', 'decoration'],
        industrial:    ['table', 'stool', 'lamp'],
        traditional:   ['sofa', 'cabinet', 'decoration'],
        scandinavian:  ['chair', 'lamp', 'decoration'],
        bohemian:      ['chair', 'decoration', 'lamp'],
      };

      // Dominant color palette (k-means lite: pick 3 spread-out colors)
      const palette = [toHex(wallAvg), toHex(floorAvg), toHex([Math.round(avgR), Math.round(avgG), Math.round(avgB)])];

      resolve({
        roomType:           'living room',
        style,
        dominantColors:     palette,
        existingFurniture:  [],
        lightingCondition:  isDark ? 'artificial' : 'natural',
        floorType:          isWarm ? 'hardwood' : 'tile',
        suggestedCategories: styleCats[style] ?? ['sofa', 'lamp', 'table'],
        reason:             `Detected a ${isLight ? 'bright' : isDark ? 'dark' : 'balanced'} ${isWarm ? 'warm' : isCool ? 'cool' : 'neutral'}-toned ${style} room.`,
        wallHexColor:       toHex(wallAvg),
        floorHexColor:      toHex(floorAvg),
      });
    };
    img.onerror = () => resolve({
      roomType: 'living room', style: 'modern',
      dominantColors: ['#f5f0eb', '#3d3d3d', '#c8b8a2'],
      existingFurniture: [], lightingCondition: 'natural', floorType: 'unknown',
      suggestedCategories: ['sofa', 'lamp', 'table'],
      reason: 'Could not analyze image — showing popular furniture picks.',
      wallHexColor: '#EDE3D5', floorHexColor: '#C4A478',
    });
    img.src = imageUrl;
  });
}

export async function analyzeRoom(roomImageUrl: string): Promise<RoomAnalysis> {
  // Run client-side analysis immediately (no API, no network)
  const localResult = analyzeRoomLocally(roomImageUrl);

  // Also try backend (Claude/Gemini/HuggingFace) — prefer real AI result over local pixel analysis
  try {
    const res = await custom_axios.post('/ai-preview/analyze-room', { roomImageUrl });
    const data: RoomAnalysis = res.data?.data;
    // Detect the static fallback by its specific reason string — real AI results have different reasons
    const isHardcodedFallback =
      data?.reason === 'AI suggests furniture that works well in most living spaces.' ||
      !data?.reason;
    if (data && !isHardcodedFallback) return data;
  } catch { /* backend unreachable or failed */ }

  return localResult;
}

// Zero-out semi-transparent pixels that WASM BG removal leaves as a background haze
async function cleanAlphaHaze(dataUrl: string, threshold = 72): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const c    = document.createElement('canvas');
      c.width    = img.naturalWidth;
      c.height   = img.naturalHeight;
      const ctx  = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const id   = ctx.getImageData(0, 0, c.width, c.height);
      const data = id.data;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < threshold) data[i] = 0;
      }
      ctx.putImageData(id, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
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
  // WASM browser-side BG removal — 100% free, no API key needed
  // Fetch as Blob in main thread to avoid CORS issues inside the WASM worker
  let source: Blob | string = imageUrl;
  try {
    const fetchRes = await fetch(imageUrl, { mode: 'cors' });
    if (fetchRes.ok) source = await fetchRes.blob();
  } catch { /* use URL directly */ }

  if (onProgress) onProgress(10);

  const { removeBackground: removeBg } = await import('@imgly/background-removal');

  const wasmPromise = removeBg(source, {
    progress: (_key: string, current: number, total: number) => {
      if (onProgress && total > 0) onProgress(10 + Math.round((current / total) * 85));
    },
    model: 'medium',
  });

  // Safety timeout — never hang silently
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('BG removal timed out')), 120_000),
  );

  const blob      = await Promise.race([wasmPromise, timeout]);
  const objectUrl = URL.createObjectURL(blob as Blob);
  const cropped   = await autoCropTransparent(objectUrl);
  const cleaned   = await cleanAlphaHaze(cropped);
  if (onProgress) onProgress(100);
  return cleaned;
}

export async function getMyAiDesigns(): Promise<AiDesignRecord[]> {
  const res = await custom_axios.get('/ai-preview/my-ai-designs');
  return res.data.data;
}

export async function deleteAiDesign(id: string): Promise<void> {
  await custom_axios.delete(`/ai-preview/ai-designs/${id}`);
}
