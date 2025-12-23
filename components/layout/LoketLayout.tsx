'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

interface LoketLayoutProps {
  children: ReactNode;
  loketId: number;
}

export function LoketLayout({ children, loketId }: LoketLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Call logout API to invalidate session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Clear local storage
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if API fails
      localStorage.clear();
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Loket {loketId}</h2>
          <p className="text-xs text-gray-500">Sistem Pendaftaran</p>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-100 p-2 rounded-full">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{user.nama}</p>
                <p className="text-xs text-gray-500">@{user.username}</p>
              </div>
            </div>
            <div className="bg-blue-50 px-2 py-1 rounded text-xs text-blue-700 font-medium inline-block">
              {user.role === 'admin_loket' ? 'Admin Loket' : 'Petugas Loket'}
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          <Button
            variant={router.pathname === `/counter/loket-${loketId}` ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => router.push(`/counter/loket-${loketId}`)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard Loket
          </Button>
          
          <Button
            variant={router.pathname.includes('/counter/patients') ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => router.push(`/counter/patients?returnTo=/counter/loket-${loketId}`)}
          >
            <User className="w-4 h-4 mr-2" />
            Data Pasien
          </Button>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-10">
        {children}
      </div>
    </div>
  );
}
