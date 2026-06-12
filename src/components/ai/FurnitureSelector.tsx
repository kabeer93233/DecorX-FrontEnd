import React, { useState, useEffect, useRef, useMemo } from 'react';
import custom_axios from '../../axios/axios';
import { getDisplayCategory } from '../../utils/categoryUtils';

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

export const FurnitureSelector: React.FC<Props> = ({
  selectedProductId, onSelect, suggestedCategories = [], addMode = false,
}) => {
  const [products, setProducts]             = useState<Product[]>([]);
  const [search, setSearch]                 = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [aiPicksOnly, setAiPicksOnly]       = useState(false);
  const [showAll, setShowAll]               = useState(false);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    custom_axios.get('/product')
      .then(res => setProducts(res.data?.data ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-enable AI filter when suggestions first arrive
  const prevSugCount = useRef(0);
  useEffect(() => {
    if (suggestedCategories.length > 0 && prevSugCount.current === 0) {
      setAiPicksOnly(true);
      setShowAll(false);
    }
    prevSugCount.current = suggestedCategories.length;
  }, [suggestedCategories.length]);

  useEffect(() => { if (!aiPicksOnly) setShowAll(false); }, [aiPicksOnly]);

  const isAiPick = (p: Product) =>
    suggestedCategories.some(c => getDisplayCategory(p.productName, p.category) === c.toLowerCase());

  const hasAiSuggestions = suggestedCategories.length > 0;
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category?.toLowerCase()).filter(Boolean)))];

  const searchFiltered = useMemo(() =>
    products.filter(p => !search.trim() || p.productName?.toLowerCase().includes(search.toLowerCase())),
  [products, search]);

  const allSorted = useMemo(() => {
    const base = searchFiltered.filter(p =>
      activeCategory === 'all' || p.category?.toLowerCase() === activeCategory,
    );
    return [...base].sort((a, b) => {
      const aP = isAiPick(a), bP = isAiPick(b);
      return aP === bP ? 0 : aP ? -1 : 1;
    });
  }, [searchFiltered, activeCategory, suggestedCategories]);

  // Smart AI picks: up to 3 per suggested category, max 9 total
  const aiPicks = useMemo(() => {
    if (!hasAiSuggestions) return [];
    const picks: Product[] = [];
    const seen = new Set<string>();
    for (const cat of suggestedCategories) {
      const inCat = searchFiltered.filter(p =>
        isAiPick(p) &&
        getDisplayCategory(p.productName, p.category) === cat.toLowerCase() &&
        !seen.has(p.id),
      );
      inCat.slice(0, 3).forEach(p => { picks.push(p); seen.add(p.id); });
    }
    return picks;
  }, [searchFiltered, suggestedCategories, hasAiSuggestions]);

  const totalAiCount = searchFiltered.filter(isAiPick).length;

  const displayProducts = aiPicksOnly && hasAiSuggestions
    ? (showAll ? searchFiltered.filter(isAiPick) : aiPicks)
    : allSorted;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-bold text-stone-900">
          {addMode ? '2. Add Furniture to Room' : '2. Select Furniture'}
        </h3>
        {addMode && (
          <p className="text-xs text-stone-400 mt-0.5">Click any product to instantly place it</p>
        )}
      </div>

      {/* AI Suggestions banner */}
      {hasAiSuggestions ? (
        <div className={`rounded-xl border-2 overflow-hidden transition-all ${
          aiPicksOnly ? 'border-orange-400 shadow-sm shadow-orange-100' : 'border-stone-200'
        }`}>
          <button
            onClick={() => { setAiPicksOnly(v => !v); setActiveCategory('all'); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-all ${
              aiPicksOnly ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <span className="flex-1 text-left">AI Picks for Your Room</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              aiPicksOnly ? 'bg-white/25 text-white' : 'bg-orange-200 text-orange-800'
            }`}>
              {aiPicksOnly ? `${showAll ? totalAiCount : aiPicks.length} shown` : 'click to filter'}
            </span>
          </button>
          {aiPicksOnly && (
            <div className="bg-orange-50 px-3 py-1.5 flex flex-wrap gap-1 border-t border-orange-200">
              {suggestedCategories.map(c => (
                <span key={c} className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-semibold rounded-full capitalize border border-orange-200">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-500">
          <svg className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Upload a room photo to get AI furniture suggestions
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text" placeholder="Search furniture…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        />
      </div>

      {/* Category pills — hidden when AI picks mode is active */}
      {(!aiPicksOnly || !hasAiSuggestions) && (
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-2.5 py-0.5 text-xs rounded-full border capitalize transition-colors ${
                activeCategory === cat
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'border-stone-200 text-stone-600 hover:border-orange-300 bg-white'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-0.5" style={{ maxHeight: '420px', scrollbarWidth: 'thin' }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-stone-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-stone-200" />
                <div className="p-2 space-y-1">
                  <div className="h-3 bg-stone-200 rounded w-3/4" />
                  <div className="h-2.5 bg-stone-100 rounded w-1/2" />
                </div>
              </div>
            ))
          : displayProducts.length === 0
          ? (
            <div className="col-span-2 text-center py-8">
              <p className="text-stone-400 text-sm mb-2">No products found</p>
              {aiPicksOnly && (
                <button onClick={() => setAiPicksOnly(false)}
                  className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                  Browse all products →
                </button>
              )}
            </div>
          )
          : displayProducts.map(product => {
              const pick       = isAiPick(product);
              const isSelected = selectedProductId === product.id;

              return (
                <div
                  key={product.id}
                  onClick={() => onSelect(product)}
                  className={`group relative cursor-pointer rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg active:scale-95 ${
                    !addMode && isSelected
                      ? 'ring-2 ring-orange-500 shadow-md'
                      : 'ring-1 ring-stone-100 hover:ring-orange-300 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="aspect-square bg-stone-50 relative overflow-hidden">
                    {product.image
                      ? <img
                          src={product.image}
                          alt={product.productName}
                          className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      : <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"/>
                          </svg>
                        </div>
                    }
                    {addMode && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        style={{ background: 'rgba(249,115,22,0.08)' }}>
                        <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {pick && (
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      AI
                    </div>
                  )}
                  {!addMode && isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  )}

                  <div className="p-2 bg-white border-t border-stone-100">
                    <p className="text-xs font-semibold text-stone-800 leading-tight truncate">{product.productName}</p>
                    <p className="text-xs text-orange-500 font-bold mt-0.5">Rs {product.price?.toLocaleString()}</p>
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* Show all / show less toggle */}
      {aiPicksOnly && hasAiSuggestions && !loading && totalAiCount > aiPicks.length && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="w-full py-2 text-xs font-semibold text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl border border-stone-200 hover:border-orange-200 transition-all"
        >
          {showAll
            ? `↑ Show top ${aiPicks.length} picks`
            : `↓ See all ${totalAiCount} matching products`}
        </button>
      )}
    </div>
  );
};
