export interface Product {
  id: string;
  productName: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  description: string;
  rating: number;
  isNew?: boolean;
  width?: number;
  height?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  image?: string;
  icon?: any;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  image: string;
  text: string;
  rating: number;
}

export interface SavedDesign {
  id: string;
  roomImage: string;
  furnitureImage: string;
  resultImage: string;
  productId: string;
  productName: string;
  createdAt: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  fullName: string;
  phone: string;
  city: string;
  postalCode: string;
  address?: string;
  paymentMethod: 'cod' | 'card';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  createdAt: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

export interface User {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  totalOrders?: number;
  status: 'active' | 'blocked';
}