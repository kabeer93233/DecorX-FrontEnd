import React from 'react';
import { CreditCard, DollarSign, CheckCircle } from 'lucide-react';

interface PaymentSectionProps {
  selectedMethod: 'cod' | 'card';
  onMethodChange: (method: 'cod' | 'card') => void;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  selectedMethod,
  onMethodChange,
}) => {
  return (
    <div className="space-y-6 bg-white p-8 rounded-3xl border border-stone-200">
      <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-orange-500" />
        Payment Method
      </h2>

      <div className="space-y-4">
        {/* Cash on Delivery */}
        <div
          onClick={() => onMethodChange('cod')}
          className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all ${
            selectedMethod === 'cod'
              ? 'border-orange-500 bg-orange-50'
              : 'border-stone-200 hover:border-orange-300'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
              selectedMethod === 'cod'
                ? 'border-orange-500 bg-orange-500'
                : 'border-stone-300'
            }`}>
              {selectedMethod === 'cod' && (
                <CheckCircle className="h-4 w-4 text-white fill-current" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-6 w-6 text-orange-500" />
                <h3 className="font-bold text-stone-900 text-lg">Cash on Delivery</h3>
              </div>
              <p className="text-sm text-stone-600">
                Pay with cash when your order is delivered to your doorstep.
              </p>
            </div>
          </div>
        </div>

        {/* Card Payment */}
        <div
          onClick={() => onMethodChange('card')}
          className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all ${
            selectedMethod === 'card'
              ? 'border-orange-500 bg-orange-50'
              : 'border-stone-200 hover:border-orange-300'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
              selectedMethod === 'card'
                ? 'border-orange-500 bg-orange-500'
                : 'border-stone-300'
            }`}>
              {selectedMethod === 'card' && (
                <CheckCircle className="h-4 w-4 text-white fill-current" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="h-6 w-6 text-orange-500" />
                <h3 className="font-bold text-stone-900 text-lg">Credit / Debit Card</h3>
              </div>
              <p className="text-sm text-stone-600 mb-4">
                Pay securely with your credit or debit card.
              </p>
              
              {selectedMethod === 'card' && (
                <div className="space-y-3 mt-4 pt-4 border-t border-stone-200">
                  <input
                    type="text"
                    placeholder="Card Number"
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Cardholder Name"
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
        <p className="text-sm text-blue-700">
          Your payment information is secure and encrypted
        </p>
      </div>
    </div>
  );
};
