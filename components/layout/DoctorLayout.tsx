import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { LayoutDashboard, LogOut, User, Users, Activity, Calendar } from 'lucide-react';

interface DoctorLayoutProps {
    children: ReactNode;
}

export default function DoctorLayout({ children }: DoctorLayoutProps) {
    const router = useRouter();
    const [userName, setUserName] = useState('');
    const [poliName, setPoliName] = useState('');

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            const userData = JSON.parse(user);
            setUserName(userData.nama || 'Dokter');

            // You can fetch poli info here if needed
            // For now, we'll leave it empty or fetch from API
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
    };

    const menuItems = [
        { href: '/doctor', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/doctor/patients/history', icon: Users, label: 'Riwayat Kunjungan' },
        { href: '/doctor/schedule', icon: Calendar, label: 'Jadwal Praktik' },
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
                            <p className="text-xs text-gray-500">Panel Dokter</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 px-4 py-6 overflow-y-auto">
                    <div className="space-y-1">
                        {menuItems.map((item) => {
                            // Check if current path matches menu item
                            let isActive = router.pathname === item.href;

                            // Special case: Keep "Riwayat Kunjungan" active when navigating from history
                            if (item.href === '/doctor/patients/history' && router.query.from === 'history') {
                                isActive = true;
                            }

                            // Special case: Keep "Dashboard" active when navigating from dashboard
                            if (item.href === '/doctor' && router.query.from === 'dashboard') {
                                isActive = true;
                            }
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
                            <p className="text-sm font-medium text-gray-900 break-words">{userName}</p>
                            <p className="text-xs text-gray-500">Dokter</p>
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
