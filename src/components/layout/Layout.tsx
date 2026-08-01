import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Toaster } from 'sonner';
import { ChatWidget } from '../chat/ChatWidget';

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-[#FFF8F0] font-sans text-stone-900 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <ChatWidget />
      <Toaster position="bottom-right" richColors />
    </div>
  );
};
