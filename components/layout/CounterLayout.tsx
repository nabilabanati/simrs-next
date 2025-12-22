import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    LogOut,
    Menu,
    X,
    Receipt,
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
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

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
            {/* Sidebar - Collapsible */}
            <aside className={cn(
                "bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col fixed left-0 top-0 h-screen z-50 transition-all duration-300",
                sidebarOpen ? "w-64" : "w-0"
            )}>
                <div className={cn(
                    "transition-opacity duration-300",
                    sidebarOpen ? "opacity-100" : "opacity-0"
                )}>
                    {/* Header */}
                    <div className="p-6 border-b border-blue-700">
                        <h1 className="text-xl font-bold">Counter Loket</h1>
                        {user && (
                            <div className="mt-2 text-sm text-blue-200">
                                <p className="font-medium">{user.nama}</p>
                                <p className="text-xs capitalize text-blue-300">{user.role}</p>
                            </div>
                        )}
                    </div>

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

                    {/* Logout Button */}
                    <div className="p-4 border-t border-blue-700">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 text-blue-200 hover:bg-blue-700 hover:text-white rounded-lg w-full transition-all duration-200"
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Toggle Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={cn(
                    "fixed top-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-lg transition-all duration-300",
                    sidebarOpen ? "left-[17rem]" : "left-4"
                )}
            >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Main Content - Responsive to Sidebar */}
            <main className={cn(
                "flex-1 min-h-screen w-full overflow-x-hidden transition-all duration-300",
                sidebarOpen ? "pl-64" : "pl-0"
            )}>
                <div className="p-8 w-full">{children}</div>
            </main>
        </div>
    );
}
