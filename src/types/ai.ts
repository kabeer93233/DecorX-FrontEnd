export interface RoomGeometry {
  floorLineY: number;
  vanishingPoint: { x: number; y: number };
  placementZones: Record<string, { x: number; y: number }>;
}

export interface RoomAnalysis {
  roomType: string;
  style: string;
  dominantColors: string[];
  existingFurniture: string[];
  lightingCondition: string;
  floorType: string;
  suggestedCategories: string[];
  reason: string;
  wallHexColor?: string;
  floorHexColor?: string;
  geometry?: RoomGeometry;
}

export interface PlacementSuggestion2d {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  reason: string;
}

export interface AiDesignRecord {
  id: string;
  productId: string;
  productName: string;
  roomImageUrl: string;
  resultImageUrl: string;
  roomType: string | null;
  roomStyle: string | null;
  createdAt: string;
}
