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

// ── Background removal — fully off-thread via Web Worker ─────────────────────
// The worker (bgRemoval.worker.ts) runs resize + WASM inference + crop + haze
// cleanup entirely off the main thread using OffscreenCanvas + createImageBitmap.
// The main thread only sends a URL and receives back an ArrayBuffer (zero-copy).

type BgJob = {
  resolve:    (url: string) => void;
  reject:     (err: Error)  => void;
  onProgress?: (pct: number) => void;
};

let _bgWorker:    Worker | null            = null;
const _bgJobs:    Map<string, BgJob>       = new Map();

function getBgWorker(): Worker {
  if (_bgWorker) return _bgWorker;

  _bgWorker = new Worker(
    new URL('../workers/bgRemoval.worker.ts', import.meta.url),
    { type: 'module' },
  );

  _bgWorker.onmessage = (e: MessageEvent) => {
    const { id, progress, buffer, mimeType, error } = e.data;
    const job = _bgJobs.get(id);
    if (!job) return;

    if (error) {
      _bgJobs.delete(id);
      job.reject(new Error(error));
      return;
    }

    if (progress !== undefined) {
      job.onProgress?.(progress as number);
    }

    if (buffer !== undefined) {
      _bgJobs.delete(id);
      const blob      = new Blob([buffer as ArrayBuffer], { type: mimeType ?? 'image/png' });
      const objectUrl = URL.createObjectURL(blob);
      job.resolve(objectUrl);
    }
  };

  _bgWorker.onerror = (e) => {
    const msg = e.message ?? 'Worker error';
    _bgJobs.forEach(job => job.reject(new Error(msg)));
    _bgJobs.clear();
    _bgWorker = null; // recreate on next call
  };

  return _bgWorker;
}

export async function removeBackground(
  imageUrl: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).slice(2, 10);
    _bgJobs.set(id, { resolve, reject, onProgress });
    getBgWorker().postMessage({ id, imageUrl });
  });
}

// Spawns the worker immediately — the worker's top-level import of
// @imgly/background-removal triggers WASM compilation + IndexedDB model caching
// while the user is still reading the room analysis, so the first product add
// finds everything already warm.
export function warmupBgRemoval(): void {
  try { getBgWorker(); } catch { /* ignore — warmup is best-effort */ }
}

export async function getMyAiDesigns(): Promise<AiDesignRecord[]> {
  const res = await custom_axios.get('/ai-preview/my-ai-designs');
  return res.data.data;
}

export async function deleteAiDesign(id: string): Promise<void> {
  await custom_axios.delete(`/ai-preview/ai-designs/${id}`);
}
