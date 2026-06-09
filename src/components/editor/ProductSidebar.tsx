import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '../../store/editorStore';
import { recommendProducts, suggestPlacement } from '../../services/aiService';
import custom_axios from '../../axios/axios';
import { Product } from '../../types';
import { DesignItem } from '../../types/editor';
import { useShop } from '../../context/ShopContext';
import { toast } from 'sonner';
import { CATEGORY_DIMS, getDisplayCategory } from './FurnitureItem';

export default function ProductSidebar() {
  const { room, addItem, setAiRecommendation, aiRecommendation } = useEditorStore();
  const { addToCart } = useShop();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  // Global lock — only one placement in-flight at a time
  const [isPlacing, setIsPlacing] = useState(false);
  const [placingProductId, setPlacingProductId] = useState<string | null>(null);

  useEffect(() => {
    custom_axios.get('/product').then((res) => {
      const data: Product[] = res.data?.data ?? res.data ?? [];
      setProducts(data);
      setFilteredProducts(data);
      setLoadingProducts(false);
    }).catch(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    let result = products;
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category?.toLowerCase() === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.productName?.toLowerCase().includes(q));
    }
    setFilteredProducts(result);
  }, [products, search, selectedCategory]);

  const handleAIRecommend = useCallback(async () => {
    if (!room) return;
    setLoadingAI(true);
    try {
      // Get freshest items from store (no stale closure)
      const currentItems = useEditorStore.getState().items;
      const placedCategories = currentItems.map((it) => it.category.toLowerCase());
      const rec = await recommendProducts(room.type, placedCategories);
      setAiRecommendation(rec);
      if (rec.suggestedCategories.length > 0) {
        setSelectedCategory(rec.suggestedCategories[0]);
      }
      toast.success('AI suggestions ready!');
    } catch {
      toast.error('Could not get AI suggestions');
    } finally {
      setLoadingAI(false);
    }
  }, [room, setAiRecommendation]);

  const handleAddToScene = useCallback(async (product: Product) => {
    if (!room || isPlacing) return;
    setIsPlacing(true);
    setPlacingProductId(product.id);
    try {
      const dbCat = product.category?.toLowerCase() ?? 'decoration';
      // Resolve visual category from product name (armchair → chair, etc.)
      const visualCat = getDisplayCategory(product.productName, dbCat);
      const dims = CATEGORY_DIMS[visualCat] ?? CATEGORY_DIMS[dbCat] ?? [1, 1, 1];

      // CRITICAL: always read fresh items from store — never use closure items
      const freshItems = useEditorStore.getState().items;

      const placement = await suggestPlacement(
        room.id,
        visualCat,
        dims[0],
        dims[2],
        freshItems,
      );

      const newItem: DesignItem = {
        id: uuidv4(),
        productId: product.id,
        productName: product.productName,
        modelUrl: '',
        thumbnailUrl: product.image ?? '',
        price: product.price,
        category: visualCat,
        position: placement.position,
        rotation: placement.rotation,
        // Always use real category dimensions — backend returns [1,1,1] placeholder
        scale: dims,
        placementReason: placement.reason,
      };
      addItem(newItem);
      toast.success(`${product.productName} placed in room`);
    } catch {
      toast.error('Could not place item — check your connection');
    } finally {
      setIsPlacing(false);
      setPlacingProductId(null);
    }
  }, [room, isPlacing, addItem]);

  const isInRoom = useCallback((productId: string) => {
    return useEditorStore.getState().items.some((it) => it.productId === productId);
  }, []);

  const categories = ['all', ...Array.from(new Set(
    products.map((p) => p.category?.toLowerCase()).filter(Boolean) as string[]
  ))];

  return (
    <aside className="w-72 h-full flex flex-col bg-white border-l border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-stone-100">
        <h2 className="text-sm font-semibold text-stone-700 mb-2">Furniture & Decor</h2>
        <button
          onClick={handleAIRecommend}
          disabled={loadingAI}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:opacity-60 text-white text-sm font-medium transition-all shadow-sm"
        >
          {loadingAI ? (
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          )}
          {loadingAI ? 'Thinking…' : 'AI Suggest'}
        </button>
        {aiRecommendation && (
          <p className="mt-2 text-xs text-stone-500 leading-snug">{aiRecommendation.reason}</p>
        )}
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 bg-stone-50"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 px-2.5 py-0.5 text-xs rounded-full border transition-colors capitalize ${
              selectedCategory === cat
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'border-stone-200 text-stone-600 hover:border-orange-300 bg-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
        {loadingProducts ? (
          <div className="flex flex-col items-center justify-center pt-10 gap-2 text-stone-400">
            <span className="inline-block w-6 h-6 border-2 border-stone-300 border-t-orange-400 rounded-full animate-spin" />
            <span className="text-xs">Loading products…</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex items-center justify-center pt-10 text-stone-400 text-sm">
            No products found
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToScene={handleAddToScene}
              onAddToCart={() => { addToCart(product); toast.success('Added to cart'); }}
              placing={placingProductId === product.id}
              anyPlacing={isPlacing}
              inRoom={isInRoom(product.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

interface CardProps {
  product: Product;
  onAddToScene: (p: Product) => void;
  onAddToCart: () => void;
  placing: boolean;
  anyPlacing: boolean;
  inRoom: boolean;
}

function ProductCard({ product, onAddToScene, onAddToCart, placing, anyPlacing, inRoom }: CardProps) {
  return (
    <div className="flex gap-2.5 p-2.5 rounded-xl border border-stone-100 hover:border-orange-200 hover:shadow-sm transition-all bg-white">
      {product.image ? (
        <img src={product.image} alt={product.productName} className="w-14 h-14 object-cover rounded-lg shrink-0 border border-stone-100" />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-stone-100 shrink-0 flex items-center justify-center text-stone-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-stone-800 leading-tight truncate">{product.productName}</p>
        <p className="text-xs text-orange-500 font-bold mt-0.5">Rs {product.price?.toLocaleString()}</p>
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={() => onAddToScene(product)}
            disabled={anyPlacing}
            className={`flex-1 flex items-center justify-center gap-1 py-1 text-xs rounded-lg transition-colors font-medium ${
              anyPlacing
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : inRoom
                ? 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {placing ? (
              <span className="inline-block w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
            ) : inRoom ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Again
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Place
              </>
            )}
          </button>
          <button
            onClick={onAddToCart}
            className="px-2 py-1 text-xs rounded-lg border border-stone-200 hover:border-orange-300 hover:bg-orange-50 text-stone-600 transition-colors"
            title="Add to cart"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
