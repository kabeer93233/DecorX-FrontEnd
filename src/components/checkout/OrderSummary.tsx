import React from 'react';
import {
  ShoppingBag,
  Truck,
  Tag,
} from 'lucide-react';

import { CartItem } from '../../types';

interface OrderSummaryProps {
  items: CartItem[];


  paymentMethod: 'cod' | 'card';

  onPlaceOrder: () => void;

  isProcessing?: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  paymentMethod,
  onPlaceOrder,
  isProcessing = false,
}) => {

  const subtotal = items.reduce(

    (sum, item: any) =>

      sum +
      item.product.price *
      item.quantity,

    0,
  );

  const tax = subtotal * 0.08;

  const shipping = 0;

  const total =
    subtotal +
    tax +
    shipping;

  return (

    <div className="bg-white p-8 rounded-3xl border border-stone-200 sticky top-24">

      <h2 className="text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">

        <ShoppingBag className="h-6 w-6 text-orange-500" />

        Order Summary

      </h2>

      {/* Order Items */}

      <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">

        {items.map((item: any) => (

          <div
            key={item.id}
            className="flex items-center gap-4 pb-4 border-b border-stone-100 last:border-0"
          >

            <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">

              <img
                src={item.product.image}
                alt={item.product.productName}
                className="w-full h-full object-cover"
              />

            </div>

            <div className="flex-1 min-w-0">

              <h4 className="font-semibold text-stone-900 text-sm truncate">

                {item.product.productName}

              </h4>

              <p className="text-xs text-stone-500">

                Qty: {item.quantity}

              </p>

            </div>

            <div className="text-right">

              <p className="font-bold text-stone-900">

                $
                {(
                  item.product.price *
                  item.quantity
                ).toFixed(2)}

              </p>

            </div>

          </div>
        ))}

      </div>

      {/* Payment Method */}

      <div className="mb-6 pb-6 border-b border-stone-200">

        <h3 className="font-bold text-stone-900 mb-3">

          Payment Method

        </h3>

        <p className="text-sm text-stone-600">

          {paymentMethod === 'cod'
            ? 'Cash on Delivery'
            : 'Card Payment'}

        </p>

      </div>

      {/* Price Breakdown */}

      <div className="space-y-3 mb-6 pb-6 border-b border-stone-200">

        <div className="flex justify-between text-stone-600">

          <span>
            Subtotal
          </span>

          <span className="font-medium">

            ${subtotal.toFixed(2)}

          </span>

        </div>

        <div className="flex justify-between text-stone-600">

          <span className="flex items-center gap-2">

            <Truck className="h-4 w-4" />

            Shipping

          </span>

          <span className="font-medium text-green-600">

            Free

          </span>

        </div>

        <div className="flex justify-between text-stone-600">

          <span className="flex items-center gap-2">

            <Tag className="h-4 w-4" />

            Tax (8%)

          </span>

          <span className="font-medium">

            ${tax.toFixed(2)}

          </span>

        </div>

      </div>

      {/* Total */}

      <div className="flex justify-between items-center mb-6 pb-6 border-b border-stone-200">

        <span className="text-lg font-bold text-stone-900">

          Total

        </span>

        <span className="text-2xl font-bold text-orange-500">

          ${total.toFixed(2)}

        </span>

      </div>

      {/* Place Order Button */}

      <button
        onClick={onPlaceOrder}
        disabled={
          isProcessing ||
          items.length === 0
        }
        className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold rounded-full shadow-xl hover:shadow-2xl hover:from-orange-600 hover:to-amber-700 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >

        {isProcessing
          ? 'Processing...'
          : 'Place Order'}

      </button>

      <p className="text-xs text-stone-400 text-center mt-4">

        By placing your order, you agree to our Terms & Conditions

      </p>

    </div>
  );
};
