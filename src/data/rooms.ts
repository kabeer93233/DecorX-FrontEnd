export interface PlacementZone {
  id: string;
  name: string;
  allowedCategories: string[];
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
  defaultRotationY: number;
  priority: number;
  wallAligned: boolean;
}

export interface CameraPreset {
  name: string;
  position: [number, number, number];
  target: [number, number, number];
}

export interface RoomTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  previewImage: string;
  width: number;
  depth: number;
  height: number;
  wallColor: string;
  floorColor: string;
  placementZones: PlacementZone[];
  cameraPresets: CameraPreset[];
}

export const ROOMS: RoomTemplate[] = [
  {
    id: 'living-room-01',
    name: 'Modern Living Room',
    type: 'living_room',
    description: 'A bright, open living room perfect for sofas, tables, and lamps.',
    previewImage: '/images/rooms/living-room-preview.jpg',
    width: 6, depth: 5, height: 3,
    wallColor: '#EDE3D5',
    floorColor: '#C4A478',
    placementZones: [
      {
        id: 'sofa-wall', name: 'Main Sofa Wall',
        allowedCategories: ['sofa', 'cabinet', 'decoration'],
        centerX: 0, centerZ: -1.8,
        width: 4, depth: 1.2,
        defaultRotationY: 0, priority: 10, wallAligned: true,
      },
      {
        id: 'center-table', name: 'Center Table Zone',
        allowedCategories: ['table', 'stool'],
        centerX: 0, centerZ: 0,
        width: 2, depth: 2,
        defaultRotationY: 0, priority: 9, wallAligned: false,
      },
      {
        id: 'left-corner', name: 'Left Corner',
        allowedCategories: ['decoration', 'chair', 'stool'],
        centerX: -2.2, centerZ: -1.8,
        width: 0.8, depth: 0.8,
        defaultRotationY: 0.785, priority: 8, wallAligned: false,
      },
      {
        id: 'right-corner', name: 'Right Corner',
        allowedCategories: ['decoration', 'chair', 'stool'],
        centerX: 2.2, centerZ: -1.8,
        width: 0.8, depth: 0.8,
        defaultRotationY: -0.785, priority: 7, wallAligned: false,
      },
      {
        id: 'right-wall', name: 'Right Wall',
        allowedCategories: ['cabinet', 'chair'],
        centerX: 2.5, centerZ: 0,
        width: 1.5, depth: 1,
        defaultRotationY: -1.5708, priority: 6, wallAligned: true,
      },
    ],
    cameraPresets: [
      { name: 'Default', position: [5, 4, 5], target: [0, 0.5, 0] },
      { name: 'Top', position: [0, 9, 0.01], target: [0, 0, 0] },
      { name: 'Front', position: [0, 1.5, 7], target: [0, 1, 0] },
      { name: 'Left', position: [-6, 3, 3], target: [0, 0.5, 0] },
      { name: 'Right', position: [6, 3, 3], target: [0, 0.5, 0] },
    ],
  },
  {
    id: 'bedroom-01',
    name: 'Contemporary Bedroom',
    type: 'bedroom',
    description: 'A calm, modern bedroom designed for beds, lamps, and wardrobes.',
    previewImage: '/images/rooms/bedroom-preview.jpg',
    width: 5, depth: 4.5, height: 2.8,
    wallColor: '#E8DDD0',
    floorColor: '#B09080',
    placementZones: [
      {
        id: 'bed-wall', name: 'Bed Wall',
        allowedCategories: ['table', 'decoration'],
        centerX: 0, centerZ: -1.5,
        width: 3, depth: 1.5,
        defaultRotationY: 0, priority: 10, wallAligned: true,
      },
      {
        id: 'left-side', name: 'Left Side Table',
        allowedCategories: ['table', 'decoration', 'stool'],
        centerX: -1.6, centerZ: -1.2,
        width: 0.8, depth: 0.8,
        defaultRotationY: 0, priority: 9, wallAligned: false,
      },
      {
        id: 'right-side', name: 'Right Side Table',
        allowedCategories: ['table', 'decoration', 'stool'],
        centerX: 1.6, centerZ: -1.2,
        width: 0.8, depth: 0.8,
        defaultRotationY: 0, priority: 8, wallAligned: false,
      },
      {
        id: 'wardrobe-wall', name: 'Wardrobe Wall',
        allowedCategories: ['cabinet', 'sofa', 'chair'],
        centerX: -2.0, centerZ: 0.5,
        width: 1.5, depth: 0.8,
        defaultRotationY: 1.5708, priority: 7, wallAligned: true,
      },
    ],
    cameraPresets: [
      { name: 'Default', position: [4, 3.5, 4.5], target: [0, 0.5, 0] },
      { name: 'Top', position: [0, 8, 0.01], target: [0, 0, 0] },
      { name: 'Front', position: [0, 1.5, 6], target: [0, 1, 0] },
    ],
  },
  {
    id: 'dining-room-01',
    name: 'Classic Dining Room',
    type: 'dining_room',
    description: 'A welcoming dining room suited for tables, chairs, and cabinets.',
    previewImage: '/images/rooms/dining-room-preview.jpg',
    width: 5, depth: 4, height: 2.8,
    wallColor: '#EDE5D8',
    floorColor: '#CEB898',
    placementZones: [
      {
        id: 'dining-center', name: 'Dining Table Center',
        allowedCategories: ['table'],
        centerX: 0, centerZ: 0,
        width: 2.5, depth: 2,
        defaultRotationY: 0, priority: 10, wallAligned: false,
      },
      {
        id: 'chair-left', name: 'Chair Left',
        allowedCategories: ['chair', 'stool'],
        centerX: -1.3, centerZ: 0,
        width: 0.8, depth: 0.8,
        defaultRotationY: 1.5708, priority: 9, wallAligned: false,
      },
      {
        id: 'chair-right', name: 'Chair Right',
        allowedCategories: ['chair', 'stool'],
        centerX: 1.3, centerZ: 0,
        width: 0.8, depth: 0.8,
        defaultRotationY: -1.5708, priority: 8, wallAligned: false,
      },
      {
        id: 'buffet-wall', name: 'Buffet Wall',
        allowedCategories: ['cabinet', 'decoration'],
        centerX: 0, centerZ: -1.5,
        width: 2.5, depth: 0.8,
        defaultRotationY: 0, priority: 7, wallAligned: true,
      },
    ],
    cameraPresets: [
      { name: 'Default', position: [4, 3.5, 4.5], target: [0, 0.5, 0] },
      { name: 'Top', position: [0, 8, 0.01], target: [0, 0, 0] },
      { name: 'Front', position: [0, 1.5, 6], target: [0, 1, 0] },
    ],
  },
];

export const CUSTOM_ROOM: RoomTemplate = {
  id: 'custom',
  name: 'My Room',
  type: 'custom',
  description: 'Your own room loaded from a photo.',
  previewImage: '',
  width: 6, depth: 5, height: 3,
  wallColor: '#EDE3D5',
  floorColor: '#C4A478',
  placementZones: [],
  cameraPresets: [
    { name: 'Default', position: [5, 4, 5],    target: [0, 0.5, 0] },
    { name: 'Top',     position: [0, 9, 0.01],  target: [0, 0, 0] },
    { name: 'Front',   position: [0, 1.5, 7],   target: [0, 1, 0] },
  ],
};
