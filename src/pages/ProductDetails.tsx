import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Heart,
  ArrowLeft,
  Truck,
  RotateCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import custom_axios from '../axios/axios';

import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ui/ProductCard';

export const ProductDetails = () => {
  const { id } = useParams();

  const [quantity, setQuantity] = useState(1);

  const [product, setProduct] =
    useState<any>(null);

  const [loading, setLoading] = useState(true);

  const { addToCart, toggleWishlist, isInWishlist } =
    useShop();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response =
          await custom_axios.get(`/product/${id}`);
        console.log(response.data);
        setProduct(response.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

    setQuantity(1);

    window.scrollTo(0, 0);
  }, [id]);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-bold">
          Loading...
        </h2>
      </div>
    );
  }

  // Product Not Found
  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-stone-900 mb-4">
          Product Not Found
        </h2>

        <Link
          to="/shop"
          className="text-orange-500 hover:underline"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  // Temporary Related Products
  const relatedProducts : any = [];

  const isWishlisted = isInWishlist(
    product.id
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        to="/shop"
        className="inline-flex items-center text-stone-500 hover:text-orange-500 mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Shop
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 mb-20">
        {/* Image Section */}
        <div className="space-y-4">
          <div className="aspect-[4/5] bg-stone-50 rounded-3xl overflow-hidden shadow-sm">
            <img
              src={product.image}
              alt={product.productName}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-xl overflow-hidden cursor-pointer border-2 ${
                  i === 0
                    ? 'border-orange-500'
                    : 'border-transparent hover:border-stone-300'
                }`}
              >
                <img
                  src={product.image}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-stone-500 text-sm uppercase tracking-wide font-medium">
                {product.category}
              </span>

              <h1 className="text-4xl font-bold text-stone-900 mt-2 mb-2">
                {product.productName}
              </h1>

              <div className="flex items-center space-x-2 mb-6">
                <div className="flex text-orange-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i <
                        Math.floor(
                          product.rating || 0
                        )
                          ? 'fill-current'
                          : 'text-stone-300'
                      }`}
                    />
                  ))}
                </div>

                <span className="text-stone-500 text-sm">
                  ({product.rating || 0}{' '}
                  Reviews)
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                toggleWishlist(product)
              }
              className={`p-3 rounded-full ${
                isWishlisted
                  ? 'bg-red-50 text-red-500'
                  : 'bg-stone-100 text-stone-400 hover:text-red-500'
              } transition-colors`}
            >
              <Heart
                className={`h-6 w-6 ${
                  isWishlisted
                    ? 'fill-current'
                    : ''
                }`}
              />
            </button>
          </div>

          {/* Price */}
          <div className="text-3xl font-bold text-stone-900 mb-6">
            $
            {Number(product.price).toFixed(
              2
            )}

            {product.oldPrice && (
              <span className="text-xl text-stone-400 line-through ml-3 font-normal">
                $
                {Number(
                  product.oldPrice
                ).toFixed(2)}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-stone-600 mb-8 leading-relaxed text-lg">
            {product.description}
          </p>

          {/* Features */}
          <div className="border-t border-b border-stone-200 py-6 mb-8 space-y-4">
            <div className="flex items-center gap-4 text-stone-600 text-sm">
              <Truck className="h-5 w-5 text-orange-500" />

              <span>
                Free Delivery & Returns
              </span>
            </div>

            <div className="flex items-center gap-4 text-stone-600 text-sm">
              <ShieldCheck className="h-5 w-5 text-orange-500" />

              <span>2 Year Warranty</span>
            </div>

            <div className="flex items-center gap-4 text-stone-600 text-sm">
              <RotateCw className="h-5 w-5 text-orange-500" />

              <span>
                30 Day Money Back
                Guarantee
              </span>
            </div>
          </div>

          {/* AI Preview */}
          <Link
            to={`/ai-preview?productId=${product.id}`}
            className="flex items-center justify-center gap-3 w-full py-4 px-8 mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full shadow-xl hover:shadow-2xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:-translate-y-1"
          >
            <Sparkles className="h-6 w-6" />

            Try In My Room (AI Preview)
          </Link>

          {/* Quantity + Cart */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex items-center border border-stone-300 rounded-full px-4 py-3 sm:w-auto w-full justify-between">
              <button
                onClick={() =>
                  setQuantity(
                    Math.max(
                      1,
                      quantity - 1
                    )
                  )
                }
                className="text-stone-500 hover:text-stone-900 p-1"
              >
                <Minus className="h-4 w-4" />
              </button>

              <span className="mx-4 font-bold text-stone-900 w-8 text-center">
                {quantity}
              </span>

              <button
                onClick={() =>
                  setQuantity(
                    quantity + 1
                  )
                }
                className="text-stone-500 hover:text-stone-900 p-1"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() =>
                addToCart(
                  product,
                  quantity
                )
              }
              className="flex-grow flex items-center justify-center bg-stone-900 text-white px-8 py-3 rounded-full hover:bg-orange-500 transition-colors font-semibold shadow-lg"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />

              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-stone-900 mb-8">
            Related Products
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((p : any) => (
              <ProductCard
                key={p.id}
                product={p}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};