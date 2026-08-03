import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ShippingForm } from '../components/checkout/ShippingForm';
import { PaymentSection } from '../components/checkout/PaymentSection';
import { OrderSummary } from '../components/checkout/OrderSummary';
import { useShop } from '../context/ShopContext';
import { toast } from 'sonner';
import custom_axios from '../axios/axios';
import { getIsVerified } from '../utils/auth';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
);

const CheckoutForm: React.FC = () => {
  const { cart, clearCart, cartTotal } = useShop();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

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
      const total = cartTotal * 1.08;
      let stripePaymentIntentId: string | undefined;

      if (paymentMethod === 'card') {
        if (!stripe || !elements) {
          toast.error('Payment system is loading. Please try again.');
          setIsProcessing(false);
          return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          toast.error('Please enter your card details');
          setIsProcessing(false);
          return;
        }

        const { data } = await custom_axios.post('/payments/create-intent', {
          amount: total,
        });

        const { error, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: shippingData.fullName,
                email: shippingData.email,
                phone: shippingData.phone,
                address: {
                  line1: shippingData.address,
                  city: shippingData.city,
                  postal_code: shippingData.postalCode,
                },
              },
            },
          },
        );

        if (error) {
          toast.error(error.message || 'Payment failed');
          setIsProcessing(false);
          return;
        }

        if (paymentIntent?.status !== 'succeeded') {
          toast.error('Payment was not completed');
          setIsProcessing(false);
          return;
        }

        stripePaymentIntentId = paymentIntent.id;
      }

      const response = await custom_axios.post('/orders/checkout', {
        fullName: shippingData.fullName,
        email: shippingData.email,
        phone: shippingData.phone,
        address: shippingData.address,
        city: shippingData.city,
        postalCode: shippingData.postalCode,
        paymentMethod,
        total,
        stripePaymentIntentId,
        items: cart.map((item: any) => ({
          productId: item.product.id,
          name: item.product.productName,
          image: item.product.image,
          quantity: item.quantity,
          price: Number(item.product.price) || 0,
        })),
      });

      const order = response.data.order;
      setOrderId(order.id);
      setShowSuccessModal(true);
      clearCart();

      toast.success(
        paymentMethod === 'card'
          ? 'Payment successful! Order placed.'
          : 'Order placed successfully!',
      );
    } catch (error: any) {
      console.log('ORDER ERROR:', error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to place order',
      );
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
          <h2 className="text-3xl font-bold text-stone-900 mb-4">
            Your Cart is Empty
          </h2>
          <p className="text-stone-600 mb-8">
            Add items to your cart before checking out.
          </p>
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

  const isVerified = getIsVerified();

  return (
    <div className="min-h-screen bg-[#FFF8F0] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-8">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-stone-600 hover:text-orange-500 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Cart
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900">
            Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT SIDE */}
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

          {/* RIGHT SIDE */}
          <div className="lg:col-span-1">
            <OrderSummary
              items={cart}
              paymentMethod={paymentMethod}
              onPlaceOrder={() => {
                if (!isVerified) {
                  toast.warning('Please verify your email first');
                  return;
                }
                handlePlaceOrder();
              }}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
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
                Thank you for your order,{' '}
                <span className="font-semibold">
                  {shippingData.fullName}
                </span>
                !
              </p>

              {paymentMethod === 'card' && (
                <p className="text-sm text-green-600 font-medium mb-2">
                  Payment confirmed via Stripe
                </p>
              )}

              <div className="bg-stone-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-stone-500 mb-1">Order ID</p>
                <p className="font-mono font-semibold text-stone-900 text-sm break-all">
                  {orderId}
                </p>
              </div>

              <p className="text-sm text-stone-600 mb-8">
                We'll send you a confirmation email shortly.
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

export const Checkout: React.FC = () => {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#f97316',
            colorBackground: '#ffffff',
            colorText: '#1c1917',
            fontFamily: 'inherit',
            borderRadius: '12px',
          },
        },
      }}
    >
      <CheckoutForm />
    </Elements>
  );
};
