import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    LogOut,
<<<<<<< HEAD
=======
    Menu,
    X,
    Receipt,
>>>>>>> 5e6cb2d6aef843d5c8cd3b57915e1468006536a9
} from "lucide-react";

interface CounterLayoutProps {
    children: React.ReactNode;
}

const menuItems = [
    { href: "/counter", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/counter/patients", icon: Users, label: "Pasien" },
    { href: "/cashier/payment-verification", icon: Receipt, label: "Verifikasi Pembayaran" },
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
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar - Always Visible */}
            <aside className="bg-blue-900 text-white flex flex-col fixed left-0 top-0 h-screen z-50 w-64 overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-blue-700">
                    <h1 className="text-xl font-bold">Loket Pendaftaran</h1>
                    {user && (
                        <div className="mt-2 text-sm text-blue-200">
                            <p className="font-medium">{user.nama}</p>
                            <p className="text-xs capitalize text-blue-300">{user.role}</p>
                        </div>
                    )}
                </div>

<<<<<<< HEAD
                {/* Navigation */}
                <nav className="p-4">
                    <ul className="space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = router.pathname === item.href || 
                                           (item.href === "/counter/patients" && router.pathname.startsWith("/counter/patients"));
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                            isActive
                                                ? "bg-blue-600 text-white shadow-lg"
                                                : "text-blue-200 hover:bg-blue-700 hover:text-white"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
=======
                    {/* Navigation */}
                    <nav className="flex-1 p-4 overflow-y-auto">
                        <ul className="space-y-2">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = router.pathname === item.href ||
                                    (item.href === "/counter/patients" && router.pathname.startsWith("/counter/patients"));
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                                isActive
                                                    ? "bg-blue-600 text-white shadow-lg"
                                                    : "text-blue-200 hover:bg-blue-700 hover:text-white"
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span className="font-medium">{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
>>>>>>> 5e6cb2d6aef843d5c8cd3b57915e1468006536a9

                {/* Spacer - Push logout to bottom */}
                <div className="flex-1"></div>

                {/* Logout Button - At Absolute Bottom */}
                <div className="p-4 border-t border-blue-700">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-blue-200 hover:bg-blue-700 hover:text-white rounded-lg w-full transition-all duration-200"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content - Fixed Margin for Sidebar */}
            <main className="flex-1 min-h-screen w-full overflow-x-hidden pl-64">
                <div className="p-8 w-full">{children}</div>
            </main>
        </div>
    );
}
