import custom_axios from '../axios/axios';
import { DesignItem } from '../types/editor';

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
      // Pass actual floor footprint so backend collision is accurate
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
