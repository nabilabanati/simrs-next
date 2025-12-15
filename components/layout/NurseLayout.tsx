import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Home, LogOut, User, Activity } from 'lucide-react';

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

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-gradient-to-b from-purple-600 to-purple-800 text-white flex flex-col">
                <div className="p-6">
                    <div className="flex items-center space-x-2 mb-2">
                        <Activity className="w-8 h-8" />
                        <h1 className="text-xl font-bold">Nurse Panel</h1>
                    </div>
                    {poliName && (
                        <p className="text-sm text-purple-200">Poli: {poliName}</p>
                    )}
                </div>

                <nav className="flex-1 px-4">
                    <Link
                        href="/nurse"
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${router.pathname === '/nurse'
                            ? 'bg-purple-700 text-white'
                            : 'text-purple-100 hover:bg-purple-700'
                            }`}
                    >
                        <Home className="w-5 h-5" />
                        <span>Dashboard</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-purple-700">
                    <div className="flex items-center space-x-3 px-4 py-2 mb-2">
                        <User className="w-5 h-5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">{userName}</p>
                            <p className="text-xs text-purple-200">Perawat</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-2 rounded-lg text-purple-100 hover:bg-purple-700 w-full transition-colors"
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
