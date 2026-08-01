import React from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface ChatProductCardProps {
  product: {
    id?: number;
    productId?: number;
    productName?: string;
    name?: string;
    price: number;
    image?: string;
    category?: string;
  };
}

export const ChatProductCard: React.FC<ChatProductCardProps> = ({ product }) => {
  const { sendMessage } = useChat();
  const id = product.id || product.productId;
  const name = product.productName || product.name || 'Product';
  const image = product.image || 'https://placehold.co/100x100/orange/white?text=DecorX';

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden bg-white min-w-[140px] max-w-[160px] flex-shrink-0">
      <img
        src={image}
        alt={name}
        className="w-full h-24 object-cover bg-stone-100"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://placehold.co/100x100/orange/white?text=DecorX';
        }}
      />
      <div className="p-2">
        <p className="text-xs font-medium text-stone-800 truncate" title={name}>
          {name}
        </p>
        <p className="text-xs font-bold text-orange-600 mt-0.5">
          Rs {product.price?.toLocaleString()}
        </p>
        {id && (
          <div className="flex gap-1 mt-1.5">
            <button
              onClick={() => sendMessage(`Add product #${id} to my cart`)}
              className="flex-1 flex items-center justify-center gap-1 text-[10px] py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
            >
              <ShoppingCart size={10} />
              Cart
            </button>
            <button
              onClick={() => sendMessage(`Add product #${id} to my wishlist`)}
              className="flex items-center justify-center p-1 border border-stone-200 rounded hover:bg-stone-50 transition-colors"
            >
              <Heart size={10} className="text-stone-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
