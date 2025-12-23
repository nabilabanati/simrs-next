import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatsCards } from "@/components/dashboard/admin/StatsCards";
import { useAdminData } from "@/hooks/use-admin-data";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
    const router = useRouter();
    const { stats, loading, error } = useAdminData();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Token is in HttpOnly cookie, so we only check user data in localStorage
        const user = localStorage.getItem("user");

        if (!user) {
            router.push("/login");
            return;
        }

        try {
            const userData = JSON.parse(user);
            if (userData.role !== "superadmin") {
                toast.error("Akses ditolak. Anda bukan superadmin.");
                router.push("/login");
                return;
            }

            setIsAuthenticated(true);
        } catch (error) {
            console.error("Error parsing user data:", error);
            router.push("/login");
        }
    }, [router]);

    if (!isAuthenticated) {
        return null;
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
                    <p className="text-muted-foreground mt-1">
                        Monitoring sistem dan data rumah sakit
                    </p>
                </div>

                {/* Statistics Cards */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                        Error: {error}
                    </div>
                )}

                <StatsCards stats={stats} loading={loading} />

                {/* Quick Actions */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kelola Pegawai</CardTitle>
                            <CardDescription>
                                Tambah dokter, perawat, atau staff baru
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/admin/employees">
                                <Button className="w-full">
                                    Buka Halaman Pegawai
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Data Pasien</CardTitle>
                            <CardDescription>
                                Lihat semua pasien terdaftar
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/admin/patients">
                                <Button variant="outline" className="w-full">
                                    Lihat Data Pasien
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Pending</CardTitle>
                            <CardDescription>
                                {stats?.unpaidInvoices || 0} invoice belum dibayar
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/admin/invoices">
                                <Button variant="outline" className="w-full">
                                    Lihat Invoice
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity - Placeholder */}
                <Card>
                    <CardHeader>
                        <CardTitle>Aktivitas Terbaru</CardTitle>
                        <CardDescription>
                            Monitoring aktivitas sistem real-time (Coming soon)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Fitur ini akan menampilkan log aktivitas terbaru dari semua module
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
