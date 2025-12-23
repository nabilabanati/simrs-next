import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function AdminPharmacyOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const debouncedSearch = useDebounce(searchTerm, 500);

    useEffect(() => {
        // Token is in HttpOnly cookie, we only check user data
        const user = localStorage.getItem("user");

        if (!user) {
            router.push("/login");
            return;
        }

        try {
            const userData = JSON.parse(user);
            if (userData.role !== "superadmin") {
                router.push("/login");
                return;
            }

            fetchOrders();
        } catch (error) {
            console.error("Error parsing user data:", error);
            router.push("/login");
        }
    }, [router]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/pharmacy/orders", {
                credentials: "include",
            });
            const json = await res.json();
            setOrders(json.data || []);
        } catch (error) {
            console.error("Failed to fetch pharmacy orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter((order) => {
        if (statusFilter !== "all" && order.status !== statusFilter) {
            return false;
        }
        if (!debouncedSearch) return true;
        const search = debouncedSearch.toLowerCase();
        return order.no_order?.toLowerCase().includes(search);
    });

    const getStatusBadge = (status: string) => {
        const statuses: Record<string, { label: string; class: string }> = {
            waiting: { label: "Menunggu", class: "bg-yellow-100 text-yellow-800" },
            packing: { label: "Dikemas", class: "bg-blue-100 text-blue-800" },
            done: { label: "Selesai", class: "bg-green-100 text-green-800" },
        };
        const s = statuses[status] || { label: status, class: "bg-gray-100 text-gray-800" };
        return <Badge className={s.class} variant="outline">{s.label}</Badge>;
    };

    const getItemsCount = (order: any) => {
        return order.prescriptions?.prescription_items?.length || 0;
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pesanan Farmasi</h1>
                    <p className="text-muted-foreground mt-1">
                        Semua pesanan obat dari dokter (Read-only)
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Pesanan</CardTitle>
                        <CardDescription>
                            Cari berdasarkan nomor pesanan
                        </CardDescription>
                        <div className="flex gap-4 mt-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari nomor pesanan..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="border rounded-md px-3 py-2"
                            >
                                <option value="all">Semua Status</option>
                                <option value="waiting">Menunggu</option>
                                <option value="packing">Dikemas</option>
                                <option value="done">Selesai</option>
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No. Pesanan</TableHead>
                                        <TableHead>Jumlah Item</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Tanggal Pesanan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                Tidak ada pesanan ditemukan
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono text-sm font-medium">
                                                    {order.no_order || "-"}
                                                </TableCell>
                                                <TableCell>{getItemsCount(order)} item</TableCell>
                                                <TableCell>{getStatusBadge(order.status)}</TableCell>
                                                <TableCell>
                                                    {new Date(order.created_at).toLocaleDateString("id-ID", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {filteredOrders.length > 0 && (
                            <div className="mt-4 text-sm text-muted-foreground">
                                Menampilkan {filteredOrders.length} pesanan
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
