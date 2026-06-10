import React from 'react';
import { Link } from 'react-router-dom';
import {
  Minus,
  Plus,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import {
  getIsVerified,
} from '../utils/auth';
import { useShop }
from '../context/ShopContext';

export const Cart = () => {

  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    clearCart,
  } = useShop();

  if (cart.length === 0) {

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">

        <h2 className="text-3xl font-bold text-stone-900 mb-4">
          Your Cart is Empty
        </h2>

        <p className="text-stone-600 mb-8">
          Looks like you haven't added anything to your cart yet.
        </p>

        <Link
          to="/shop"
          className="inline-flex items-center px-8 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors"
        >
          Start Shopping
        </Link>

      </div>
    );
  }
  const isVerified =
    getIsVerified();

  return (

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <h1 className="text-3xl font-bold text-stone-900 mb-8">
        Shopping Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

        <div className="lg:col-span-2 space-y-6">

          {cart.map((item: any) => (

            <div
              key={item.id}
              className="flex flex-col sm:flex-row items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-stone-100"
            >

              <div className="w-full sm:w-24 h-24 bg-stone-50 rounded-xl overflow-hidden flex-shrink-0">

                <img
                  src={item.product.image}
                  alt={item.product.productName}
                  className="w-full h-full object-cover"
                />

              </div>

              <div className="flex-grow text-center sm:text-left">

                <Link
                  to={`/product/${item.product.id}`}
                  className="font-bold text-stone-900 text-lg hover:text-orange-500 transition-colors"
                >
                  {item.product.productName}
                </Link>

                <p className="text-stone-500 text-sm">
                  {item.product.category}
                </p>

              </div>

              <div className="flex items-center gap-3">

                <div className="flex items-center border border-stone-200 rounded-full px-3 py-1">

                  <button
                    onClick={() =>
                      updateQuantity(
                        item.id,
                        item.quantity - 1,
                      )
                    }
                    className="text-stone-400 hover:text-stone-900 p-1"
                    disabled={item.quantity <= 1}
                  >

                    <Minus className="h-3 w-3" />

                  </button>

                  <span className="mx-3 font-semibold text-stone-900 w-4 text-center">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      updateQuantity(
                        item.id,
                        item.quantity + 1,
                      )
                    }
                    className="text-stone-400 hover:text-stone-900 p-1"
                  >

                    <Plus className="h-3 w-3" />

                  </button>

                </div>

              </div>

              <div className="font-bold text-stone-900 text-lg">

                $
                {(
                  item.product.price *
                  item.quantity
                ).toFixed(2)}

              </div>

              <button
                onClick={() =>
                  removeFromCart(
                    item.id,
                  )
                }
                className="text-stone-400 hover:text-red-500 transition-colors p-2"
                title="Remove"
              >

                <Trash2 className="h-5 w-5" />

              </button>

            </div>
          ))}

          <button
            onClick={clearCart}
            className="text-stone-500 hover:text-red-500 text-sm font-medium underline"
          >

            Clear Cart

          </button>

        </div>

        <div className="lg:col-span-1">

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 sticky top-24">

            <h2 className="text-xl font-bold text-stone-900 mb-6">
              Order Summary
            </h2>

            <div className="space-y-4 mb-6">

              <div className="flex justify-between text-stone-600">

                <span>
                  Subtotal
                </span>

                <span>
                  ${cartTotal.toFixed(2)}
                </span>

              </div>

              <div className="flex justify-between text-stone-600">

                <span>
                  Shipping
                </span>

                <span>
                  Free
                </span>

              </div>

              <div className="flex justify-between text-stone-600">

                <span>
                  Tax (Estimated)
                </span>

                <span>
                  ${(cartTotal * 0.08).toFixed(2)}
                </span>

              </div>

              <div className="border-t border-stone-100 pt-4 flex justify-between font-bold text-lg text-stone-900">

                <span>
                  Total
                </span>

                <span>
                  ${(cartTotal * 1.08).toFixed(2)}
                </span>

              </div>

            </div>

            <Link
              to={
                  isVerified
                    ? "/checkout"
                    : "/profile"
                }
              className="w-full bg-stone-900 text-white py-4 rounded-full font-bold hover:bg-orange-500 transition-colors shadow-lg flex items-center justify-center gap-2"
            >

              Checkout

              <ArrowRight className="h-5 w-5" />

            </Link>

            {!isVerified && (

              <p className="text-center text-sm text-orange-500 mt-4 leading-relaxed">

                Verify your email first to access checkout.

              </p>
            )}

            <p className="text-xs text-stone-400 text-center mt-4">

              Secure Checkout - SSL Encrypted

            </p>

          </div>

        </div>

      </div>

    </div>
  );
};