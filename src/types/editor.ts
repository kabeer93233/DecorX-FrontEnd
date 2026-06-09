export interface DesignItem {
  id: string;
  productId: string;
  productName: string;
  modelUrl: string;
  thumbnailUrl: string;
  price: number;
  category: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  placementReason?: string;
}

export interface DesignState {
  id?: string;
  name: string;
  roomId: string;
  items: DesignItem[];
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  savedAt?: string;
}

export interface AIRecommendation {
  suggestedCategories: string[];
  reason: string;
}
