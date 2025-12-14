import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    LogOut,
} from "lucide-react";

interface CounterLayoutProps {
    children: React.ReactNode;
}

const menuItems = [
    { href: "/counter", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/counter/patients", icon: Users, label: "Pasien" },
];

export function CounterLayout({ children }: CounterLayoutProps) {
    const router = useRouter();
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-gradient-to-b from-purple-900 to-purple-800 text-white flex flex-col">
                <div className="p-6 border-b border-purple-700">
                    <h1 className="text-xl font-bold">Counter Loket</h1>
                    {user && (
                        <div className="mt-2 text-sm text-purple-200">
                            <p>{user.nama}</p>
                            <p className="text-xs capitalize">{user.role}</p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-4">
                    <ul className="space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = router.pathname === item.href;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                                            isActive
                                                ? "bg-purple-600 text-white"
                                                : "text-purple-200 hover:bg-purple-700"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t border-purple-700">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-purple-200 hover:bg-purple-700 rounded-lg w-full transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-gray-50">
                <div className="p-8">{children}</div>
            </main>
        </div>
    );
}
