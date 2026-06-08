// User profile service
// In a real app, this would interact with a backend API
// For now, we're using localStorage for demo purposes

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

const USER_PROFILE_KEY = 'decorx_user_profile';

// Get user profile
export const getUserProfile = (): UserProfile | null => {
  try {
    const profile = localStorage.getItem(USER_PROFILE_KEY);
    return profile ? JSON.parse(profile) : null;
  } catch (error) {
    console.error('Error loading user profile:', error);
    return null;
  }
};

// Save user profile
export const saveUserProfile = (profile: UserProfile): void => {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = (updates: Partial<UserProfile>): UserProfile | null => {
  try {
    const currentProfile = getUserProfile();
    if (!currentProfile) {
      // Create default profile if none exists
      const newProfile: UserProfile = {
        id: 'user_' + Date.now(),
        fullName: updates.fullName || 'Guest User',
        email: updates.email || 'guest@decorx.com',
        phone: updates.phone || '',
        address: updates.address || '',
        city: updates.city || '',
        postalCode: updates.postalCode || '',
      };
      saveUserProfile(newProfile);
      return newProfile;
    }
    const updatedProfile = { ...currentProfile, ...updates };
    saveUserProfile(updatedProfile);
    return updatedProfile;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
};

// Initialize default profile if none exists
export const initializeUserProfile = (): void => {
  const profile = getUserProfile();
  if (!profile) {
    const defaultProfile: UserProfile = {
      id: 'user_' + Date.now(),
      fullName: 'Guest User',
      email: 'guest@decorx.com',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
    };
    saveUserProfile(defaultProfile);
  }
};
