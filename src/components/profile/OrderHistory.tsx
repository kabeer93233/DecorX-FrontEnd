import React from 'react';
import { Package, Clock, CheckCircle, Truck } from 'lucide-react';
import { getOrders } from '../../services/orderService';

export const OrderHistory: React.FC = () => {
  const orders = getOrders();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Package className="h-5 w-5 text-stone-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center">
        <Package className="h-16 w-16 text-stone-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-stone-900 mb-2">No Orders Yet</h3>
        <p className="text-stone-600">When you place orders, they will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
        <Package className="h-6 w-6 text-orange-500" />
        Order History
      </h2>

      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-white rounded-2xl p-6 border border-stone-200 hover:shadow-lg transition-shadow"
        >
          {/* Order Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-stone-100">
            <div>
              <p className="text-sm text-stone-500">Order ID</p>
              <p className="font-mono font-semibold text-stone-900">{order.id.slice(0, 20)}...</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="font-semibold capitalize text-sm">{order.status}</span>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">Order Date:</span>
              <span className="font-medium text-stone-900">{formatDate(order.createdAt)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">Payment Method:</span>
              <span className="font-medium text-stone-900 capitalize">
                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">Total Amount:</span>
              <span className="font-bold text-orange-500 text-lg">${order.total.toFixed(2)}</span>
            </div>

            {/* Order Items */}
            <div className="pt-4 border-t border-stone-100">
              <p className="text-sm font-medium text-stone-700 mb-3">Items ({order.items.length})</p>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{item.name}</p>
                      <p className="text-xs text-stone-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-stone-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="pt-4 border-t border-stone-100">
              <p className="text-sm font-medium text-stone-700 mb-2">Shipping To:</p>
              <div className="text-sm text-stone-600">
                <p className="font-semibold text-stone-900">{order.fullName}</p>
                <p>{order.phone}</p>
                <p>{order.city}, {order.postalCode}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
