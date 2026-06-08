import React from 'react';
import { Product } from '../../types';
import { Check } from 'lucide-react';

interface FurnitureSelectorProps {
  products: Product[];
  selectedProduct: Product | null;
  onSelect: (product: Product) => void;
}

export const FurnitureSelector: React.FC<FurnitureSelectorProps> = ({
  products,
  selectedProduct,
  onSelect,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-stone-900 text-lg">Select Furniture</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-2">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => onSelect(product)}
            className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
              selectedProduct?.id === product.id
                ? 'border-orange-500 shadow-lg'
                : 'border-stone-200 hover:border-orange-300'
            }`}
          >
            <div className="aspect-square bg-stone-100">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {selectedProduct?.id === product.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
            
            <div className="p-2 bg-white">
              <p className="text-xs font-semibold text-stone-900 truncate">{product.name}</p>
              <p className="text-xs text-orange-500 font-bold">${product.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
