import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { sendChatMessage, uploadChatFile } from '../services/chatService';
import { getIsLoggedIn, getRole } from '../utils/auth';
import { useShop } from './ShopContext';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: {
    type: string;
    data: any;
  };
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessageItem[];
  createdAt: string;
  updatedAt: string;
}

interface ChatContextType {
  messages: ChatMessageItem[];
  isOpen: boolean;
  isExpanded: boolean;
  isLoading: boolean;
  showHistory: boolean;
  chatSessions: ChatSession[];
  sendMessage: (text: string) => Promise<void>;
  uploadFile: (file: File) => Promise<{ fileId: string; preview: any } | null>;
  toggleChat: () => void;
  toggleExpand: () => void;
  toggleHistory: () => void;
  clearChat: () => void;
  startNewChat: () => void;
  resumeSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
}

const SESSIONS_KEY = 'decorx_chat_sessions';
const MAX_SESSIONS = 20;

function loadSessions(): ChatSession[] {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch {}
}

const ChatCtx = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(loadSessions);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const location = useLocation();
  const { fetchCart, fetchWishlist } = useShop();

  useEffect(() => {
    if (messages.length === 0 || !currentSessionId) return;
    setChatSessions((prev) => {
      const firstUserMsg = messages.find((m) => m.role === 'user');
      const title = firstUserMsg?.content.slice(0, 60) || 'New Chat';
      const existing = prev.find((s) => s.id === currentSessionId);
      const updated: ChatSession = existing
        ? { ...existing, messages, title, updatedAt: new Date().toISOString() }
        : {
            id: currentSessionId,
            title,
            messages,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
      const rest = prev.filter((s) => s.id !== currentSessionId);
      const next = [updated, ...rest].slice(0, MAX_SESSIONS);
      saveSessions(next);
      return next;
    });
  }, [messages, currentSessionId]);

  const getContext = useCallback(() => {
    const path = location.pathname;
    const context: { page: string; productId?: number } = { page: path };
    const productMatch = path.match(/\/product\/(\d+)/);
    if (productMatch) {
      context.productId = parseInt(productMatch[1]!, 10);
    }
    return context;
  }, [location.pathname]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !getIsLoggedIn()) return;

      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = `session-${Date.now()}`;
        setCurrentSessionId(sessionId);
      }

      const userMsg: ChatMessageItem = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const history = messages.slice(-8).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await sendChatMessage(text, history, getContext());

        const assistantMsg: ChatMessageItem = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.reply,
          data: response.data,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (response.sideEffects?.length) {
          if (response.sideEffects.includes('cart')) fetchCart();
          if (response.sideEffects.includes('wishlist')) fetchWishlist();
          for (const effect of response.sideEffects) {
            if (['products', 'users', 'orders'].includes(effect)) {
              window.dispatchEvent(new CustomEvent('decorx-refresh', { detail: effect }));
            }
          }
        }
      } catch {
        const errorMsg: ChatMessageItem = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: "Sorry, I couldn't process that request. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, currentSessionId, getContext, fetchCart, fetchWishlist],
  );

  const uploadFile = useCallback(async (file: File) => {
    try {
      return await uploadChatFile(file);
    } catch {
      return null;
    }
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
    setShowHistory(false);
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const toggleHistory = useCallback(() => {
    setShowHistory((prev) => !prev);
  }, []);

  const clearChat = useCallback(() => {
    if (currentSessionId) {
      setChatSessions((prev) => {
        const next = prev.filter((s) => s.id !== currentSessionId);
        saveSessions(next);
        return next;
      });
    }
    setMessages([]);
    setCurrentSessionId(null);
  }, [currentSessionId]);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    setShowHistory(false);
  }, []);

  const resumeSession = useCallback(
    (sessionId: string) => {
      const session = chatSessions.find((s) => s.id === sessionId);
      if (!session) return;
      setMessages(session.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })));
      setCurrentSessionId(session.id);
      setShowHistory(false);
    },
    [chatSessions],
  );

  const deleteSession = useCallback(
    (sessionId: string) => {
      setChatSessions((prev) => {
        const next = prev.filter((s) => s.id !== sessionId);
        saveSessions(next);
        return next;
      });
      if (currentSessionId === sessionId) {
        setMessages([]);
        setCurrentSessionId(null);
      }
    },
    [currentSessionId],
  );

  return (
    <ChatCtx.Provider
      value={{
        messages,
        isOpen,
        isExpanded,
        isLoading,
        showHistory,
        chatSessions,
        sendMessage,
        uploadFile,
        toggleChat,
        toggleExpand,
        toggleHistory,
        clearChat,
        startNewChat,
        resumeSession,
        deleteSession,
      }}
    >
      {children}
    </ChatCtx.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatCtx);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
