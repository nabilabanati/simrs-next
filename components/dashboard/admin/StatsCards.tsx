import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Activity, Package, Receipt, AlertCircle, Pill } from "lucide-react";
import type { AdminStats } from "@/hooks/use-admin-data";

interface StatsCardsProps {
    stats: AdminStats | null;
    loading?: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
    if (loading || !stats) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">--</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const cards = [
        {
            title: "Total Pasien",
            value: stats.totalPatients,
            icon: Users,
            description: "Terdaftar di sistem",
            color: "text-blue-600",
        },
        {
            title: "Pegawai Aktif",
            value: stats.activeEmployees,
            icon: UserCheck,
            description: `${stats.totalEmployees} total`,
            color: "text-green-600",
        },
        {
            title: "Pegawai Nonaktif",
            value: stats.inactiveEmployees,
            icon: UserX,
            description: "Tidak bisa login",
            color: "text-gray-600",
        },
        {
            title: "Kunjungan Hari Ini",
            value: stats.todayVisits,
            icon: Activity,
            description: new Date().toLocaleDateString("id-ID"),
            color: "text-purple-600",
        },
        {
            title: "Pesanan Pending",
            value: stats.pendingOrders,
            icon: Package,
            description: "Menunggu farmasi",
            color: "text-orange-600",
        },
        {
            title: "Invoice Belum Bayar",
            value: stats.unpaidInvoices,
            icon: Receipt,
            description: "Perlu dibayar",
            color: "text-red-600",
        },
        {
            title: "Stok Obat Rendah",
            value: stats.lowStockMedicines,
            icon: AlertCircle,
            description: "< 10 unit",
            color: "text-yellow-600",
        },
        {
            title: "Total Obat",
            value: "—",
            icon: Pill,
            description: "Di inventory",
            color: "text-indigo-600",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <Icon className={`h-4 w-4 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                            <p className="text-xs text-muted-foreground">{card.description}</p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
