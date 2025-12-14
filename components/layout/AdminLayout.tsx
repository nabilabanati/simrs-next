import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    UserCog,
    Pill,
    Package,
    Receipt,
    LogOut,
    Building2,
} from "lucide-react";

interface AdminLayoutProps {
    children: React.ReactNode;
}

const menuItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/patients", icon: Users, label: "Pasien" },
    { href: "/admin/employees", icon: UserCog, label: "Pegawai" },
    { href: "/admin/poli", icon: Building2, label: "Poli" },
    { href: "/admin/medicines", icon: Pill, label: "Obat & Stok" },
    { href: "/admin/pharmacy-orders", icon: Package, label: "Pesanan Farmasi" },
    { href: "/admin/invoices", icon: Receipt, label: "Invoice" },
];

export function AdminLayout({ children }: AdminLayoutProps) {
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
            <aside className="w-64 bg-gray-900 text-white flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold">SIMRS Admin</h1>
                    {user && (
                        <div className="mt-2 text-sm text-gray-400">
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
                                                ? "bg-blue-600 text-white"
                                                : "text-gray-300 hover:bg-gray-800"
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

                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg w-full transition-colors"
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
