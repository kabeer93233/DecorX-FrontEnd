import React, { useState, useEffect } from 'react';
import custom_axios from '../../axios/axios';
import { getDisplayCategory } from '../editor/FurnitureItem';

interface Product {
  id: string;
  productName: string;
  category: string;
  price: number;
  image: string;
}

interface Props {
  selectedProductId: string | null;
  onSelect: (product: Product) => void;
  suggestedCategories?: string[];
  addMode?: boolean;
}

export const FurnitureSelector: React.FC<Props> = ({ selectedProductId, onSelect, suggestedCategories = [], addMode = false }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    custom_axios.get('/product')
      .then((res) => setProducts(res.data?.data ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category?.toLowerCase()).filter(Boolean)))];

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === 'all' || p.category?.toLowerCase() === activeCategory;
    const matchQ   = !search.trim() || p.productName?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  // Sort: AI suggested categories first
  const sorted = [...filtered].sort((a, b) => {
    const aIsPick = suggestedCategories.some((c) => getDisplayCategory(a.productName, a.category) === c.toLowerCase());
    const bIsPick = suggestedCategories.some((c) => getDisplayCategory(b.productName, b.category) === c.toLowerCase());
    if (aIsPick && !bIsPick) return -1;
    if (!aIsPick && bIsPick) return 1;
    return 0;
  });

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-stone-900">{addMode ? '2. Add Furniture to Room' : '2. Select Furniture'}</h3>
      {addMode && <p className="text-xs text-stone-400">Click any product to place it — add as many as you like</p>}

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text" placeholder="Search…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 bg-stone-50"
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-2.5 py-0.5 text-xs rounded-full border capitalize transition-colors ${
              activeCategory === cat ? 'bg-orange-500 border-orange-500 text-white' : 'border-stone-200 text-stone-600 hover:border-orange-300 bg-white'
            }`}
          >{cat}</button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-0.5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-stone-100 overflow-hidden animate-pulse">
              <div className="aspect-square bg-stone-200" />
              <div className="p-2 space-y-1">
                <div className="h-3 bg-stone-200 rounded w-3/4" />
                <div className="h-2.5 bg-stone-100 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : sorted.length === 0 ? (
          <p className="col-span-2 text-center text-stone-400 text-sm py-6">No products found</p>
        ) : sorted.map((product) => {
          const isAiPick = suggestedCategories.some((c) => getDisplayCategory(product.productName, product.category) === c.toLowerCase());
          const isSelected = selectedProductId === product.id;
          return (
            <div
              key={product.id}
              onClick={() => onSelect(product)}
              className={`group relative cursor-pointer rounded-xl border-2 overflow-hidden transition-all hover:shadow-md ${
                !addMode && isSelected ? 'border-orange-500 shadow-md' : 'border-stone-100 hover:border-orange-200'
              }`}
            >
              <div className="aspect-square bg-stone-100">
                {product.image ? (
                  <img src={product.image} alt={product.productName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                    </svg>
                  </div>
                )}
              </div>

              {isAiPick && (
                <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  AI Pick
                </div>
              )}
              {!addMode && isSelected && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {addMode && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
              )}

              <div className="p-2 bg-white">
                <p className="text-xs font-semibold text-stone-800 leading-tight truncate">{product.productName}</p>
                <p className="text-xs text-orange-500 font-bold mt-0.5">Rs {product.price?.toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
