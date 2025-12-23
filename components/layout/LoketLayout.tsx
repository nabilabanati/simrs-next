'use client';

import { ReactNode } from 'react';

interface LoketLayoutProps {
  children: ReactNode;
  loketId: number;
}

export function LoketLayout({ children, loketId }: LoketLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      {children}
    </div>
  );
}
