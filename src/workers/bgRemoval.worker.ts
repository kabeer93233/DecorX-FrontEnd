// Runs entirely off the main thread via Web Worker.
// Pipeline priority:
//   1. Already transparent (PNG with alpha) → skip removal, just crop + clean  (<100ms)
//   2. Plain background (low border variance) → BFS flood-fill from border     (<300ms)
//   3. Complex background → WASM ISNet fallback                                (10-40s)

// Pre-import the library so WASM compiles + model caches before any job arrives.
const libReady = import('@imgly/background-removal').catch(() => null);

// ── Canvas helpers (OffscreenCanvas only — no DOM) ────────────────────────────

async function resizeBlob(blob: Blob, maxPx: number, fmt: 'image/jpeg' | 'image/png' = 'image/jpeg'): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const scale  = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const w      = Math.max(1, Math.round(bitmap.width  * scale));
  const h      = Math.max(1, Math.round(bitmap.height * scale));
  const oc     = new OffscreenCanvas(w, h);
  (oc.getContext('2d') as OffscreenCanvasRenderingContext2D).drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return oc.convertToBlob({ type: fmt, quality: 0.92 });
}

async function autoCrop(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const W = bitmap.width, H = bitmap.height;
  const oc  = new OffscreenCanvas(W, H);
  const ctx = oc.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const { data } = ctx.getImageData(0, 0, W, H);
  let x0 = W, x1 = 0, y0 = H, y1 = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 18) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  if (x1 <= x0 || y1 <= y0) return blob;
  const pad = 8;
  const cw  = Math.min(W, x1 - x0 + pad * 2);
  const ch  = Math.min(H, y1 - y0 + pad * 2);
  const out = new OffscreenCanvas(cw, ch);
  (out.getContext('2d') as OffscreenCanvasRenderingContext2D)
    .drawImage(oc, x0 - pad, y0 - pad, cw, ch, 0, 0, cw, ch);
  return out.convertToBlob({ type: 'image/png' });
}

async function cleanHaze(blob: Blob, threshold = 72): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const W = bitmap.width, H = bitmap.height;
  const oc  = new OffscreenCanvas(W, H);
  const ctx = oc.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const id   = ctx.getImageData(0, 0, W, H);
  const data = id.data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < threshold) data[i] = 0;
  }
  ctx.putImageData(id, 0, 0);
  return oc.convertToBlob({ type: 'image/png' });
}

// ── Strategy 1: transparency check ───────────────────────────────────────────
// If the source image already has an alpha channel with real transparency (>5%
// of pixels) we skip BG removal entirely — just crop + clean.

async function hasExistingTransparency(blob: Blob): Promise<boolean> {
  const small  = await resizeBlob(blob, 64, 'image/png');
  const bitmap = await createImageBitmap(small);
  const W = bitmap.width, H = bitmap.height;
  const oc  = new OffscreenCanvas(W, H);
  (oc.getContext('2d') as OffscreenCanvasRenderingContext2D).drawImage(bitmap, 0, 0);
  bitmap.close();
  const { data } = (oc.getContext('2d') as OffscreenCanvasRenderingContext2D).getImageData(0, 0, W, H);
  let transparent = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 200) transparent++;
  }
  return transparent / (W * H) > 0.05;
}

// ── Strategy 2: BFS border flood-fill ────────────────────────────────────────
// Samples the image border to determine the background colour. If the border
// has low colour variance (plain studio background), BFS expands inward from
// every border pixel and marks reachable same-colour pixels as transparent.
// Returns null if the background looks complex — caller should use WASM instead.

async function fastFloodRemoval(blob: Blob): Promise<Blob | null> {
  const bitmap = await createImageBitmap(blob);
  const W = bitmap.width, H = bitmap.height;
  const oc  = new OffscreenCanvas(W, H);
  const ctx = oc.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const imgData = ctx.getImageData(0, 0, W, H);
  const data    = imgData.data;

  // Sample every 4th border pixel to find background colour
  const samples: [number, number, number][] = [];
  const STEP = 4;
  for (let x = 0; x < W; x += STEP) {
    for (const y of [0, 1, H - 2, H - 1]) {
      const i = (y * W + x) * 4;
      samples.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  for (let y = 2; y < H - 2; y += STEP) {
    for (const x of [0, 1, W - 2, W - 1]) {
      const i = (y * W + x) * 4;
      samples.push([data[i], data[i + 1], data[i + 2]]);
    }
  }

  const n    = samples.length;
  const bgR  = samples.reduce((s, [r]) => s + r, 0) / n;
  const bgG  = samples.reduce((s, [, g]) => s + g, 0) / n;
  const bgB  = samples.reduce((s, [,, b]) => s + b, 0) / n;

  // Variance check — reject complex/gradient backgrounds early
  const variance = samples.reduce(
    (s, [r, g, b]) => s + Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB),
    0,
  ) / n;
  if (variance > 32) return null; // Complex background — fall through to WASM

  // BFS from all border pixels
  const THRESHOLD  = 45; // colour distance to count as "background"
  const SOFT_RANGE = 20; // pixels within THRESHOLD..THRESHOLD+SOFT_RANGE get partial alpha
  const visited    = new Uint8Array(W * H);
  const queue      = new Int32Array(W * H);
  let   qHead = 0, qTail = 0;

  const colorDist = (i: number) =>
    Math.abs(data[i] - bgR) + Math.abs(data[i + 1] - bgG) + Math.abs(data[i + 2] - bgB);

  const enqueue = (idx: number) => {
    if (visited[idx]) return;
    visited[idx] = 1;
    queue[qTail++] = idx;
  };

  // Seed all border pixels that match the background colour
  for (let x = 0; x < W; x++) {
    for (const y of [0, H - 1]) {
      const idx = y * W + x;
      if (colorDist(idx * 4) < THRESHOLD + SOFT_RANGE) enqueue(idx);
    }
  }
  for (let y = 1; y < H - 1; y++) {
    for (const x of [0, W - 1]) {
      const idx = y * W + x;
      if (colorDist(idx * 4) < THRESHOLD + SOFT_RANGE) enqueue(idx);
    }
  }

  // Expand BFS
  while (qHead < qTail) {
    const idx  = queue[qHead++];
    const x    = idx % W;
    const y    = (idx - x) / W;
    const dist = colorDist(idx * 4);
    if (dist >= THRESHOLD + SOFT_RANGE) continue; // didn't actually match — skip expansion

    const neighbours = [
      y > 0     ? idx - W : -1,
      y < H - 1 ? idx + W : -1,
      x > 0     ? idx - 1 : -1,
      x < W - 1 ? idx + 1 : -1,
    ];
    for (const n of neighbours) {
      if (n >= 0 && !visited[n] && colorDist(n * 4) < THRESHOLD + SOFT_RANGE) enqueue(n);
    }
  }

  // Apply transparency (hard cut + soft edge feather)
  for (let idx = 0; idx < W * H; idx++) {
    if (!visited[idx]) continue;
    const pi   = idx * 4;
    const dist = colorDist(pi);
    if (dist < THRESHOLD) {
      data[pi + 3] = 0;
    } else {
      // Feather the edge
      const t      = (dist - THRESHOLD) / SOFT_RANGE;
      data[pi + 3] = Math.round(t * data[pi + 3]);
    }
  }

  // Erosion pass: BFS from borders can't cross dark furniture legs, leaving enclosed
  // background pockets (e.g. white space between table legs). Fix by iteratively
  // removing any opaque pixel that is (a) close to bg colour and (b) already flanked
  // by 2+ transparent pixels — this erodes enclosed pockets from their edges inward.
  const ERODE_DIST = 70; // max colour distance to qualify as "enclosed background"
  for (let pass = 0; pass < 12; pass++) {
    let changed = false;
    for (let idx = 0; idx < W * H; idx++) {
      const pi = idx * 4;
      if (data[pi + 3] === 0) continue;           // already transparent
      if (colorDist(pi) > ERODE_DIST) continue;   // too unlike bg — keep it

      const x = idx % W;
      const y = (idx - x) / W;
      let tNeighbours = 0;
      if (x > 0     && data[(idx - 1) * 4 + 3] === 0) tNeighbours++;
      if (x < W - 1 && data[(idx + 1) * 4 + 3] === 0) tNeighbours++;
      if (y > 0     && data[(idx - W) * 4 + 3] === 0) tNeighbours++;
      if (y < H - 1 && data[(idx + W) * 4 + 3] === 0) tNeighbours++;
      if (tNeighbours >= 2) { data[pi + 3] = 0; changed = true; }
    }
    if (!changed) break;
  }

  ctx.putImageData(imgData, 0, 0);
  return oc.convertToBlob({ type: 'image/png' });
}

// ── Message handler ───────────────────────────────────────────────────────────

self.onmessage = async (e: MessageEvent) => {
  const { id, imageUrl } = e.data as { id: string; imageUrl: string };
  const progress = (p: number) => (self as any).postMessage({ id, progress: p });

  try {
    progress(5);

    // Fetch original blob (preserve format — important for alpha detection)
    let originalBlob: Blob;
    try {
      const r   = await fetch(imageUrl, { mode: 'cors' });
      originalBlob = r.ok ? await r.blob() : new Blob([]);
    } catch {
      originalBlob = new Blob([]);
    }

    progress(10);

    // ── Path A: image already has transparency ───────────────────────────────
    if (await hasExistingTransparency(originalBlob)) {
      progress(30);
      const resized = await resizeBlob(originalBlob, 512, 'image/png');
      progress(80);
      const cropped = await autoCrop(resized);
      progress(94);
      const cleaned = await cleanHaze(cropped);
      progress(100);
      const buffer  = await cleaned.arrayBuffer();
      (self as any).postMessage({ id, buffer, mimeType: 'image/png' }, [buffer]);
      return;
    }

    // Resize to 512px for WASM
    const resized = await resizeBlob(originalBlob, 512, 'image/jpeg');
    progress(15);

    // ── Path B: BFS flood-fill — disabled, WASM used for all ─────────────────
    // const fast = await fastFloodRemoval(resized);

    // ── Path C: WASM ISNet (default for all images) ───────────────────────────
    progress(20);
    const lib = await libReady;
    if (!lib) throw new Error('BG removal library failed to load');

    const removed = await lib.removeBackground(resized, {
      model: 'isnet_quint8',
      progress: (_k: string, cur: number, tot: number) => {
        if (tot > 0) progress(20 + Math.round((cur / tot) * 60));
      },
    });

    progress(82);
    const cropped = await autoCrop(removed);
    progress(94);
    const cleaned = await cleanHaze(cropped);
    progress(100);
    const buffer  = await cleaned.arrayBuffer();
    (self as any).postMessage({ id, buffer, mimeType: 'image/png' }, [buffer]);

  } catch (err) {
    (self as any).postMessage({ id, error: (err as Error).message });
  }
};
