import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Home, LogOut, User, Pill, Package } from 'lucide-react';

interface PharmacyLayoutProps {
    children: ReactNode;
}

export default function PharmacyLayout({ children }: PharmacyLayoutProps) {
    const router = useRouter();
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            const userData = JSON.parse(user);
            setUserName(userData.nama || 'Pharmacist');
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
    };

    const menuItems = [
        { href: '/pharmacy', icon: Home, label: 'Dashboard' },
        { href: '/pharmacy/prescriptions', icon: Pill, label: 'Resep' },
        { href: '/pharmacy/medicines', icon: Pill, label: 'Data Obat' },
        { href: '/pharmacy/stock', icon: Package, label: 'Stok Obat' },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white flex flex-col">
                <div className="p-6">
                    <div className="flex items-center space-x-2 mb-2">
                        <Pill className="w-8 h-8" />
                        <h1 className="text-xl font-bold">Farmasi</h1>
                    </div>
                    <p className="text-sm text-blue-200">RSUD Slawi</p>
                </div>

                <nav className="flex-1 px-4">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${router.pathname === item.href
                                ? 'bg-blue-700 text-white'
                                : 'text-blue-100 hover:bg-blue-700'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-blue-700">
                    <div className="flex items-center space-x-3 px-4 py-2 mb-2">
                        <User className="w-5 h-5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">{userName}</p>
                            <p className="text-xs text-blue-200">Apoteker</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-2 rounded-lg text-blue-100 hover:bg-blue-700 w-full transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
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
