import React from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { ProductCard } from '../components/ui/ProductCard';

export const Wishlist = () => {

  const {
    wishlist,
  } = useShop();

  if (wishlist.length === 0) {

    return (

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">

        <h2 className="text-3xl font-bold text-stone-900 mb-4">
          Your Wishlist is Empty
        </h2>

        <p className="text-stone-600 mb-8">
          Save items you love here for later.
        </p>

        <Link
          to="/shop"
          className="inline-flex items-center px-8 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors"
        >

          Browse Products

        </Link>

      </div>
    );
  }

  return (

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <h1 className="text-3xl font-bold text-stone-900 mb-8">
        My Wishlist
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {wishlist.map((item:any)=>(

          <ProductCard
            key={item.id}
            product={item.product}
          />

        ))}

      </div>

    </div>
  );
};