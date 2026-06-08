import { Order, CartItem } from '../types';

// localStorage keys
const ORDERS_KEY = 'decorx_orders';

// Get all orders
export const getOrders = (): Order[] => {
  try {
    const orders = localStorage.getItem(ORDERS_KEY);
    return orders ? JSON.parse(orders) : [];
  } catch (error) {
    console.error('Error loading orders:', error);
    return [];
  }
};

// Save a new order
export const saveOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>): Order => {
  try {
    const orders = getOrders();
    const newOrder: Order = {
      ...orderData,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    orders.unshift(newOrder);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return newOrder;
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = (orderId: string, status: Order['status']): void => {
  try {
    const orders = getOrders();
    const updated = orders.map(order => 
      order.id === orderId ? { ...order, status } : order
    );
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Calculate order total with tax
export const calculateOrderTotal = (items: CartItem[]): number => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  return subtotal + tax;
};
