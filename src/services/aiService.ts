import { SavedDesign } from '../types';

// localStorage keys
const SAVED_DESIGNS_KEY = 'decorx_saved_designs';

// Get all saved designs
export const getSavedDesigns = (): SavedDesign[] => {
  try {
    const designs = localStorage.getItem(SAVED_DESIGNS_KEY);
    return designs ? JSON.parse(designs) : [];
  } catch (error) {
    console.error('Error loading saved designs:', error);
    return [];
  }
};

// Save a new design
export const saveDesign = (design: Omit<SavedDesign, 'id' | 'createdAt'>): SavedDesign => {
  try {
    const designs = getSavedDesigns();
    const newDesign: SavedDesign = {
      ...design,
      id: `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    designs.unshift(newDesign);
    localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(designs));
    return newDesign;
  } catch (error) {
    console.error('Error saving design:', error);
    throw error;
  }
};

// Delete a saved design
export const deleteDesign = (id: string): void => {
  try {
    const designs = getSavedDesigns();
    const filtered = designs.filter(d => d.id !== id);
    localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting design:', error);
    throw error;
  }
};

// Simulate AI generation with a delay
export const generateAIPreview = async (
  roomImage: string,
  furnitureImage: string,
  delay: number = 3000
): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // In a real implementation, this would call an AI service
      // For now, we'll return the room image (client will overlay furniture)
      resolve(roomImage);
    }, delay);
  });
};
