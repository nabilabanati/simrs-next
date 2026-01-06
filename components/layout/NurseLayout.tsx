import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { LayoutDashboard, LogOut, User, Activity, History } from 'lucide-react';

interface NurseLayoutProps {
    children: ReactNode;
}

export default function NurseLayout({ children }: NurseLayoutProps) {
    const router = useRouter();
    const [userName, setUserName] = useState('');
    const [poliName, setPoliName] = useState('');

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            const userData = JSON.parse(user);
            setUserName(userData.nama || 'Nurse');

            // Fetch nurse profile to get poli
            fetch(`/api/nurse/profile?user_id=${userData.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.poli) {
                        setPoliName(data.poli.nama);
                    }
                })
                .catch(err => console.error('Error fetching profile:', err));
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

    const menuItems = [
        { href: '/nurse', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/nurse/history', icon: History, label: 'Riwayat Kunjungan' },
    ];

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm h-screen overflow-hidden">
                {/* Logo/Brand Section */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">SIMRS</h1>
                            <p className="text-xs text-gray-500">Poliklinik | Perawat</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 px-4 py-6 overflow-y-auto">
                    <div className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = router.pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-gray-50 rounded-lg">
                        <div className="bg-blue-600 p-2 rounded-full">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 break-words" suppressHydrationWarning>{userName}</p>
                            <p className="text-xs text-gray-500">Perawat</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
