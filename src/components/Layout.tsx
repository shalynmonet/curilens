import { type ReactNode } from 'react';
import BottomNav from '@/components/BottomNav';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory-50 lens-gradient">
      <main className="min-h-screen pb-24 max-w-2xl mx-auto px-4 sm:px-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
