import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Trash2, Bot, Loader2, Maximize2, Minimize2, History, Plus, ArrowLeft } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatFileUpload } from './ChatFileUpload';
import { getIsLoggedIn, getRole } from '../../utils/auth';

export const ChatWidget: React.FC = () => {
  const {
    messages, isOpen, isExpanded, isLoading, showHistory, chatSessions,
    sendMessage, uploadFile, toggleChat, toggleExpand, toggleHistory,
    clearChat, startNewChat, resumeSession, deleteSession,
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    fileId: string;
    fileName: string;
    preview: { rows: number; columns: string[] } | null;
  } | null>(null);

  const isLoggedIn = getIsLoggedIn();
  const role = getRole();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isLoggedIn) return null;

  const handleSend = async (text: string) => {
    if (uploadedFile) {
      await sendMessage(`${text} (file ID: ${uploadedFile.fileId})`);
      setUploadedFile(null);
    } else {
      await sendMessage(text);
    }
  };

  const handleFileSelect = async (file: File) => {
    const result = await uploadFile(file);
    if (result) {
      setUploadedFile({
        fileId: result.fileId,
        fileName: file.name,
        preview: result.preview,
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const panelClasses = isExpanded
    ? 'fixed inset-4 z-50 max-w-none'
    : 'fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)]';

  const panelStyle = isExpanded
    ? {}
    : { height: '500px', maxHeight: 'calc(100vh - 6rem)' };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleChat}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-600 transition-colors"
          >
            <MessageCircle size={24} />
            {chatSessions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {chatSessions.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/30"
                onClick={toggleExpand}
              />
            )}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              layout
              className={`${panelClasses} bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden`}
              style={panelStyle}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  {showHistory ? (
                    <button
                      onClick={toggleHistory}
                      className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <ArrowLeft size={16} className="text-white" />
                    </button>
                  ) : (
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Bot size={18} className="text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-semibold text-sm">
                      {showHistory ? 'Chat History' : `DecorX ${role === 'admin' ? 'Admin ' : ''}Assistant`}
                    </h3>
                    <p className="text-orange-100 text-[10px]">
                      {showHistory
                        ? `${chatSessions.length} conversation${chatSessions.length !== 1 ? 's' : ''}`
                        : role === 'admin' ? 'Manage users, products & orders' : 'Shop, cart & orders'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!showHistory && (
                    <>
                      {messages.length > 0 && (
                        <button
                          onClick={startNewChat}
                          className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          title="New chat"
                        >
                          <Plus size={16} />
                        </button>
                      )}
                      <button
                        onClick={toggleHistory}
                        className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors relative"
                        title="Chat history"
                      >
                        <History size={16} />
                        {chatSessions.length > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-white text-orange-600 text-[8px] font-bold rounded-full flex items-center justify-center">
                            {chatSessions.length}
                          </span>
                        )}
                      </button>
                      {messages.length > 0 && (
                        <button
                          onClick={clearChat}
                          className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          title="Delete chat"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={toggleExpand}
                    className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    title={isExpanded ? 'Minimize' : 'Expand'}
                  >
                    {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                  <button
                    onClick={() => { if (isExpanded) toggleExpand(); toggleChat(); }}
                    className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* History Panel */}
              {showHistory ? (
                <div className="flex-1 overflow-y-auto">
                  {chatSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-3">
                        <History size={24} className="text-stone-400" />
                      </div>
                      <p className="text-stone-500 text-sm font-medium">No chat history yet</p>
                      <p className="text-stone-400 text-xs mt-1">Your conversations will appear here</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-100">
                      {chatSessions.map((session) => {
                        const msgCount = session.messages.length;
                        const lastMsg = session.messages[session.messages.length - 1];
                        return (
                          <div
                            key={session.id}
                            className="px-4 py-3 hover:bg-stone-50 cursor-pointer transition-colors group"
                            onClick={() => resumeSession(session.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-stone-800 truncate">
                                  {session.title}
                                </p>
                                {lastMsg && (
                                  <p className="text-xs text-stone-400 mt-0.5 truncate">
                                    {lastMsg.role === 'assistant' ? 'AI: ' : 'You: '}
                                    {lastMsg.content.slice(0, 80)}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-stone-400">
                                    {formatDate(session.updatedAt)}
                                  </span>
                                  <span className="text-[10px] text-stone-300">·</span>
                                  <span className="text-[10px] text-stone-400">
                                    {msgCount} message{msgCount !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSession(session.id);
                                }}
                                className="text-stone-300 hover:text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                          <Bot size={24} className="text-orange-500" />
                        </div>
                        <h4 className="font-semibold text-stone-700 text-sm">
                          Hi! I'm your DecorX Assistant
                        </h4>
                        <p className="text-stone-400 text-xs mt-1">
                          {role === 'admin'
                            ? 'I can help manage users, products, orders, and view analytics.'
                            : 'I can help you find products, manage your cart, and place orders.'}
                        </p>
                        {chatSessions.length > 0 && (
                          <button
                            onClick={toggleHistory}
                            className="mt-2 text-[11px] text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
                          >
                            <History size={12} />
                            View {chatSessions.length} previous chat{chatSessions.length !== 1 ? 's' : ''}
                          </button>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                          {role === 'admin'
                            ? [
                                'Show all users',
                                'Add 5 dummy products',
                                'Show pending orders',
                                'Dashboard stats',
                              ].map((q) => (
                                <button
                                  key={q}
                                  onClick={() => sendMessage(q)}
                                  className="text-[11px] px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-200 hover:bg-orange-100 transition-colors"
                                >
                                  {q}
                                </button>
                              ))
                            : [
                                'Show me sofas',
                                "What's in my cart?",
                                'Show my orders',
                                'Recommend furniture',
                              ].map((q) => (
                                <button
                                  key={q}
                                  onClick={() => sendMessage(q)}
                                  className="text-[11px] px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-200 hover:bg-orange-100 transition-colors"
                                >
                                  {q}
                                </button>
                              ))}
                        </div>
                      </div>
                    )}

                    {messages.map((msg) => (
                      <ChatMessage key={msg.id} message={msg} />
                    ))}

                    {isLoading && (
                      <div className="flex gap-2 items-start">
                        <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                          <Bot size={14} className="text-stone-600" />
                        </div>
                        <div className="bg-stone-100 rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin text-orange-500" />
                          <span className="text-xs text-stone-500">Thinking...</span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {uploadedFile && (
                    <ChatFileUpload
                      fileName={uploadedFile.fileName}
                      preview={uploadedFile.preview}
                      onDismiss={() => setUploadedFile(null)}
                    />
                  )}

                  <ChatInput onSend={handleSend} onFileSelect={handleFileSelect} disabled={isLoading} />
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
