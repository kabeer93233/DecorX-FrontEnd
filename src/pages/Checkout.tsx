import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { ShippingForm } from '../components/checkout/ShippingForm';
import { PaymentSection } from '../components/checkout/PaymentSection';
import { OrderSummary } from '../components/checkout/OrderSummary';
import { useShop } from '../context/ShopContext';
import { saveOrder } from '../services/orderService';
import { toast } from 'sonner';

export const Checkout: React.FC = () => {
  const { cart, clearCart, cartTotal } = useShop();
  const navigate = useNavigate();
  
  const [shippingData, setShippingData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderId, setOrderId] = useState('');

  const validateForm = (): boolean => {
    if (!shippingData.fullName.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!shippingData.phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    if (!shippingData.address.trim()) {
      toast.error('Please enter your address');
      return false;
    }
    if (!shippingData.city.trim()) {
      toast.error('Please enter your city');
      return false;
    }
    if (!shippingData.postalCode.trim()) {
      toast.error('Please enter your postal code');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const total = cartTotal * 1.08; // including tax
      const order = saveOrder({
        items: cart,
        total,
        fullName: shippingData.fullName,
        phone: shippingData.phone,
        city: shippingData.city,
        postalCode: shippingData.postalCode,
        paymentMethod,
      });

      setOrderId(order.id);
      setShowSuccessModal(true);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigate('/profile');
  };

  if (cart.length === 0 && !showSuccessModal) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-stone-900 mb-4">Your Cart is Empty</h2>
          <p className="text-stone-600 mb-8">Add items to your cart before checking out.</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }
  const isVerified =
  localStorage.getItem(
    'isEmailVerified',
  ) === 'true';

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-stone-600 hover:text-orange-500 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Cart
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            <ShippingForm
              formData={shippingData}
              onChange={setShippingData}
            />

            <PaymentSection
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
            />
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary
              items={cart}
              paymentMethod={paymentMethod}
              onPlaceOrder={() => {

                if (!isVerified) {

                  toast.warning(
                    'Please verify your email first',
                  );

                  return;
                }

                handlePlaceOrder();
              }}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              
              <h2 className="text-3xl font-bold text-stone-900 mb-3">
                Order Placed Successfully!
              </h2>
              
              <p className="text-stone-600 mb-2">
                Thank you for your order, <span className="font-semibold">{shippingData.fullName}</span>!
              </p>
              
              <div className="bg-stone-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-stone-500 mb-1">Order ID</p>
                <p className="font-mono font-semibold text-stone-900 text-sm break-all">
                  {orderId}
                </p>
              </div>

              <p className="text-sm text-stone-600 mb-8">
                We'll send you a confirmation email shortly. You can track your order in your profile.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleModalClose}
                  className="w-full py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors"
                >
                  View Order History
                </button>
                
                <Link
                  to="/shop"
                  className="block w-full py-3 border-2 border-stone-200 text-stone-700 font-semibold rounded-full hover:bg-stone-50 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};