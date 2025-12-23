import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function AdminInvoicesPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [paidFilter, setPaidFilter] = useState<string>("all");
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

            fetchInvoices();
        } catch (error) {
            console.error("Error parsing user data:", error);
            router.push("/login");
        }
    }, [router, paidFilter]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const url = paidFilter === "all"
                ? "/api/admin/invoices"
                : `/api/admin/invoices?paid=${paidFilter}`;

            const res = await fetch(url, {
                credentials: "include",
            });
            const json = await res.json();
            setInvoices(json.data || []);
        } catch (error) {
            console.error("Failed to fetch invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredInvoices = invoices.filter((inv) => {
        if (!debouncedSearch) return true;
        const search = debouncedSearch.toLowerCase();
        return (
            inv.visits?.no_reg?.toLowerCase().includes(search) ||
            inv.visits?.patients?.nama?.toLowerCase().includes(search) ||
            inv.visits?.patients?.nrm?.toLowerCase().includes(search)
        );
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getPaidBadge = (paid: boolean) => {
        if (paid) {
            return <Badge className="bg-green-100 text-green-800" variant="outline">Lunas</Badge>;
        }
        return <Badge className="bg-red-100 text-red-800" variant="outline">Belum Bayar</Badge>;
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Invoice</h1>
                    <p className="text-muted-foreground mt-1">
                        Semua invoice pembayaran pasien (Read-only)
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Invoice</CardTitle>
                        <CardDescription>
                            Cari berdasarkan nomor registrasi, nama, atau NRM pasien
                        </CardDescription>
                        <div className="flex gap-4 mt-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari invoice..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <select
                                value={paidFilter}
                                onChange={(e) => setPaidFilter(e.target.value)}
                                className="border rounded-md px-3 py-2"
                            >
                                <option value="all">Semua Status</option>
                                <option value="false">Belum Bayar</option>
                                <option value="true">Sudah Bayar</option>
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No. Reg</TableHead>
                                        <TableHead>Pasien</TableHead>
                                        <TableHead>NRM</TableHead>
                                        <TableHead>Poli</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredInvoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                Tidak ada invoice ditemukan
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredInvoices.map((invoice) => (
                                            <TableRow key={invoice.id}>
                                                <TableCell className="font-mono text-sm font-medium">
                                                    {invoice.visits?.no_reg || "-"}
                                                </TableCell>
                                                <TableCell>{invoice.visits?.patients?.nama || "-"}</TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {invoice.visits?.patients?.nrm || "-"}
                                                </TableCell>
                                                <TableCell>{invoice.visits?.poli?.nama || "-"}</TableCell>
                                                <TableCell className="font-semibold">
                                                    {formatCurrency(invoice.total || 0)}
                                                </TableCell>
                                                <TableCell>{getPaidBadge(invoice.paid)}</TableCell>
                                                <TableCell>
                                                    {invoice.visits?.created_at
                                                        ? new Date(invoice.visits.created_at).toLocaleDateString("id-ID", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                        })
                                                        : "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {filteredInvoices.length > 0 && (
                            <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
                                <span>Menampilkan {filteredInvoices.length} invoice</span>
                                <span className="font-semibold">
                                    Total Belum Bayar: {formatCurrency(
                                        filteredInvoices
                                            .filter((inv) => !inv.paid)
                                            .reduce((sum, inv) => sum + (inv.total || 0), 0)
                                    )}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
