import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  Eye,
} from 'lucide-react';

import { Product }
from '../../types';

import { useShop }
from '../../context/ShopContext';

import { motion }
from 'motion/react';

interface ProductCardProps{
  product:Product;
}

export const ProductCard=({
  product,
}:ProductCardProps)=>{

  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
  }=useShop();

  const isWishlisted=
  isInWishlist(product.id);

  return(

    <motion.div
      initial={{
        opacity:0,
        y:20,
      }}
      whileInView={{
        opacity:1,
        y:0,
      }}
      viewport={{
        once:true,
      }}
      transition={{
        duration:0.5,
      }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100 relative"
    >

      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 flex flex-col gap-1 sm:gap-2">

        {product.isNew&&(
          <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
            New
          </span>
        )}

        {product.oldPrice&&(
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
            Sale
          </span>
        )}

      </div>

      <button
        onClick={(e)=>{

          e.preventDefault();

          toggleWishlist(product);
        }}
        className={`absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 rounded-full shadow-md transition-colors ${
          isWishlisted
          ?'bg-red-50 text-red-500'
          :'bg-white text-stone-400 hover:text-red-500'
        }`}
      >

        <Heart
          className={`h-4 w-4 ${
            isWishlisted
            ?'fill-current'
            :''
          }`}
        />

      </button>

      <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-stone-50">

        <img
          src={product.image}
          alt={product.productName}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">

          <button
            onClick={()=>
              addToCart(product)
            }
            className="p-3 bg-white text-stone-900 rounded-full hover:bg-orange-500 hover:text-white transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300"
            title="Add to Cart"
          >

            <ShoppingCart className="h-5 w-5" />

          </button>

          <Link
            to={`/product/${product.id}`}
            className="p-3 bg-white text-stone-900 rounded-full hover:bg-orange-500 hover:text-white transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75"
            title="View Details"
          >

            <Eye className="h-5 w-5" />

          </Link>

        </div>

      </div>

      <div className="p-2.5 sm:p-4">

        <p className="text-xs text-stone-500 mb-1">
          {product.category}
        </p>

        <Link to={`/product/${product.id}`}>

          <h3 className="font-semibold text-stone-900 mb-1 sm:mb-2 truncate group-hover:text-orange-500 transition-colors text-sm sm:text-base">
            {product.productName}
          </h3>

        </Link>

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">

            <span className="font-bold text-stone-900 text-sm sm:text-base">
              ${product.price.toFixed(2)}
            </span>

            {product.oldPrice&&(
              <span className="text-sm text-stone-400 line-through">
                ${product.oldPrice.toFixed(2)}
              </span>
            )}

          </div>

          <button
            onClick={()=>
              addToCart(product)
            }
            className="md:hidden bg-orange-100 text-orange-600 p-2 rounded-full"
          >

            <ShoppingCart className="h-4 w-4" />

          </button>

        </div>

      </div>

    </motion.div>
  );
};