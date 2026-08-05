import React, {
  useState,
  useEffect,
} from 'react';

import {
  useSearchParams,
} from 'react-router-dom';

import {
  ProductCard,
} from '../components/ui/ProductCard';

import {
  categories,
} from '../data/products';

import {
  Filter,
  SlidersHorizontal,
} from 'lucide-react';

import custom_axios
from '../axios/axios';

export const Shop = () => {

  const [searchParams] =
    useSearchParams();

  const categoryParam =
    searchParams.get(
      'category',
    );

  const [
    products,
    setProducts,
  ] = useState<any[]>([]);

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<string>(
    categoryParam || 'All',
  );

const [priceRange, setPriceRange] = useState<number>(120000);

  const [
    sortBy,
    setSortBy,
  ] = useState<string>(
    'newest',
  );

  // GET PRODUCTS

 useEffect(() => {
  const getProducts = async () => {
    try {
      const response = await custom_axios.get("/product");
      setProducts(response.data);

      if (response.data.length > 0) {
        const maxPrice = Math.max(...response.data.map((p: any) => p.price));
        setPriceRange(maxPrice);
      }
    } catch (error) {
      console.log(error);
    }
  };

  getProducts();
}, []);

  // FILTER PRODUCTS

  const filteredProducts =
    products

      .filter((product) => {

        const categoryMatch =

          selectedCategory ===
          'All'

          ||

          product.category ===
          selectedCategory;

        const priceMatch =

          product.price <=
          priceRange;

        return (
          categoryMatch &&
          priceMatch
        );
      })

      .sort((a, b) => {

        if (
          sortBy ===
          'price-low'
        ) {

          return (
            a.price -
            b.price
          );
        }

        if (
          sortBy ===
          'price-high'
        ) {

          return (
            b.price -
            a.price
          );
        }

        return 0;
      });

  useEffect(() => {

    if (categoryParam) {

      setSelectedCategory(
        categoryParam,
      );
    }

  }, [categoryParam]);

  return (

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <div className="flex flex-col md:flex-row justify-between items-center mb-12">

        <h1 className="text-4xl font-bold text-stone-900 mb-4 md:mb-0">
          Shop
        </h1>

        <div className="text-stone-500">

          Showing {
            filteredProducts.length
          } results

        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">

        {/* Sidebar */}

        <div className="lg:col-span-1 space-y-8">
           
          {/* Categories */}

          <div>

            <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">

              <Filter className="h-5 w-5" />

              Categories

            </h3>

            <div className="space-y-2">

              <label className="flex items-center space-x-3 cursor-pointer group">

                <input 
                  type="radio" 
                  name="category" 
                  checked={
                    selectedCategory ===
                    'All'
                  }
                  onChange={() =>
                    setSelectedCategory(
                      'All',
                    )
                  }
                  className="form-radio text-orange-500 focus:ring-orange-500"
                />

                <span className="text-stone-600 group-hover:text-orange-500 transition-colors">

                  All Categories

                </span>

              </label>

              {categories.map((cat) => (

                <label
                  key={cat.id}
                  className="flex items-center space-x-3 cursor-pointer group"
                >

                  <input 
                    type="radio" 
                    name="category"
                    checked={
                      selectedCategory ===
                      cat.name
                    }
                    onChange={() =>
                      setSelectedCategory(
                        cat.name,
                      )
                    }
                    className="form-radio text-orange-500 focus:ring-orange-500"
                  />

                  <span className="text-stone-600 group-hover:text-orange-500 transition-colors">

                    {cat.name}

                  </span>

                </label>
              ))}

            </div>

          </div>

          {/* PRICE */}

          <div>

            <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">

              <SlidersHorizontal className="h-5 w-5" />

              Price Range

            </h3>

            <input 
              type="range" 
              min="0" 
              max="120000" 
              step="1000" 
              value={priceRange}
              onChange={(e) =>
                setPriceRange(
                  parseInt(
                    e.target.value,
                  ),
                )
              }
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-sm text-stone-500 mt-2">

              <span>$0</span>

              <span>
                ${priceRange}
              </span>

            </div>

          </div>

          {/* SORT */}

          <div>

            <h3 className="text-lg font-bold text-stone-900 mb-4">
              Sort By
            </h3>

            <select 
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value,
                )
              }
              className="w-full p-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-600"
            >

              <option value="newest">
                Newest Arrivals
              </option>

              <option value="price-low">
                Price: Low to High
              </option>

              <option value="price-high">
                Price: High to Low
              </option>

            </select>

          </div>

        </div>

        {/* PRODUCTS */}

        <div className="lg:col-span-3">

          {filteredProducts.length > 0 ? (

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">

              {filteredProducts.map(
                (product) => (

                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}

            </div>

          ) : (

            <div className="text-center py-20 bg-stone-50 rounded-2xl">

              <p className="text-stone-500 text-lg">

                No products found matching your criteria.

              </p>

              <button 
                onClick={() => {

                  setSelectedCategory(
                    'All',
                  );

                  setPriceRange(
                    1000,
                  );
                }}

                className="mt-4 text-orange-500 font-semibold hover:underline"
              >

                Clear Filters

              </button>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};