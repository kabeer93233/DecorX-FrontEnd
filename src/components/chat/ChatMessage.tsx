import React from 'react';
import { ChatMessageItem } from '../../context/ChatContext';
import { ChatProductCard } from './ChatProductCard';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageItem;
}

function formatMessageText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }
  return parts;
}

function cleanAssistantText(text: string, hasData: boolean): string {
  if (!hasData) return text;
  let cleaned = text;
  cleaned = cleaned.replace(/\|[^\n]+\|(\n\|[-:| ]+\|)?(\n\|[^\n]+\|)*/g, '');
  cleaned = cleaned.replace(/^\s*\d+\.\s+\*\*[^*]+\*\*\s*[–—-]\s*Rs\s*[\d,]+\s*\(ID[:\s]*\d+\)\s*$/gm, '');
  cleaned = cleaned.replace(/^\s*[-•]\s+\*\*[^*]+\*\*\s*[–—-]\s*Rs\s*[\d,]+.*$/gm, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const displayText = isUser
    ? message.content
    : cleanAssistantText(message.content, !!message.data);

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
          isUser ? 'bg-orange-500' : 'bg-stone-200'
        }`}
      >
        {isUser ? (
          <User size={14} className="text-white" />
        ) : (
          <Bot size={14} className="text-stone-600" />
        )}
      </div>

      <div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {displayText && (
          <div
            className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
              isUser
                ? 'bg-orange-500 text-white rounded-tr-sm'
                : 'bg-stone-100 text-stone-800 rounded-tl-sm'
            }`}
          >
            {formatMessageText(displayText)}
          </div>
        )}

        {message.data && <DataRenderer data={message.data} />}
      </div>
    </div>
  );
};

const DataRenderer: React.FC<{ data: { type: string; data: any } }> = ({ data }) => {
  if (data.type === 'products') {
    const raw = data.data;
    const products = Array.isArray(raw) ? raw : raw?.products || raw?.items || (raw?.id ? [raw] : []);
    if (products.length === 0) return null;

    return (
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {products.map((p: any, i: number) => (
          <ChatProductCard key={p.id || p.productId || i} product={p} />
        ))}
      </div>
    );
  }

  if (data.type === 'cart') {
    const cartData = data.data;
    const items = cartData?.items || [];
    if (items.length === 0) return null;

    return (
      <div className="bg-stone-50 rounded-lg p-2 text-xs space-y-1 border border-stone-200">
        {items.map((item: any, i: number) => (
          <div key={i} className="flex justify-between items-center py-1 border-b border-stone-100 last:border-0">
            <span className="text-stone-700 truncate max-w-[60%]">{item.productName}</span>
            <span className="text-stone-500">
              {item.quantity}x Rs {item.price?.toLocaleString()}
            </span>
          </div>
        ))}
        <div className="flex justify-between font-semibold pt-1 text-stone-800">
          <span>Total</span>
          <span>Rs {cartData?.total?.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  if (data.type === 'orders') {
    const orders = Array.isArray(data.data) ? data.data : [];
    if (orders.length === 0) return null;

    return (
      <div className="bg-stone-50 rounded-lg p-2 text-xs space-y-1 border border-stone-200">
        {orders.slice(0, 5).map((order: any, i: number) => (
          <div key={i} className="flex justify-between items-center py-1 border-b border-stone-100 last:border-0">
            <span className="text-stone-700">Order #{order.id}</span>
            <div className="flex items-center gap-2">
              <span className="text-stone-500">Rs {order.total?.toLocaleString()}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                  order.orderStatus === 'delivered'
                    ? 'bg-green-100 text-green-700'
                    : order.orderStatus === 'shipped'
                    ? 'bg-blue-100 text-blue-700'
                    : order.orderStatus === 'cancelled'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {order.orderStatus}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.type === 'users') {
    const users = Array.isArray(data.data) ? data.data : [];
    if (users.length === 0) return null;

    return (
      <div className="bg-stone-50 rounded-lg p-2 text-xs space-y-1 border border-stone-200 max-h-40 overflow-y-auto">
        {users.slice(0, 10).map((user: any, i: number) => (
          <div key={i} className="flex justify-between items-center py-1 border-b border-stone-100 last:border-0">
            <div className="truncate max-w-[50%]">
              <span className="text-stone-700 font-medium">{user.fullName}</span>
              <span className="text-stone-400 ml-1">{user.email}</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}
            >
              {user.isBlocked ? 'Blocked' : 'Active'}
            </span>
          </div>
        ))}
        {users.length > 10 && (
          <p className="text-stone-400 text-center pt-1">+{users.length - 10} more users</p>
        )}
      </div>
    );
  }

  if (data.type === 'stats') {
    const stats = data.data;
    if (!stats) return null;

    return (
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        {[
          { label: 'Users', value: stats.totalUsers },
          { label: 'Products', value: stats.totalProducts },
          { label: 'Orders', value: stats.totalOrders },
          { label: 'Pending', value: stats.pendingOrders },
          { label: 'Revenue', value: `Rs ${stats.totalRevenue?.toLocaleString()}` },
        ].map((s, i) => (
          <div key={i} className="bg-stone-50 border border-stone-200 rounded-lg p-2 text-center">
            <p className="text-stone-500">{s.label}</p>
            <p className="font-bold text-stone-800 text-sm">{s.value}</p>
          </div>
        ))}
      </div>
    );
  }

  return null;
};
