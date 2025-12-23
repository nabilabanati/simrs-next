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
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
