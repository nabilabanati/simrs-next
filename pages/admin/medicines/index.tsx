import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function AdminMedicinesPage() {
    const router = useRouter();
    const [medicines, setMedicines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");

        if (!token || !user) {
            router.push("/login");
            return;
        }

        const userData = JSON.parse(user);
        if (userData.role !== "superadmin") {
            router.push("/login");
            return;
        }

        fetchMedicines();
    }, [router]);

    const fetchMedicines = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/master/medicines", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setMedicines(json.data || []);
        } catch (error) {
            console.error("Failed to fetch medicines:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMedicines = medicines.filter((med) => {
        if (!debouncedSearch) return true;
        const search = debouncedSearch.toLowerCase();
        return (
            med.nama?.toLowerCase().includes(search) ||
            med.kode?.toLowerCase().includes(search)
        );
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data Obat & Stok</h1>
                    <p className="text-muted-foreground mt-1">
                        Inventory obat rumah sakit (Read-only)
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Obat</CardTitle>
                        <CardDescription>
                            Cari berdasarkan nama atau kode obat
                        </CardDescription>
                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari obat..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kode</TableHead>
                                        <TableHead>Nama Obat</TableHead>
                                        <TableHead>Harga</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredMedicines.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                {searchTerm ? "Tidak ada obat ditemukan" : "Belum ada data obat"}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredMedicines.map((medicine) => (
                                            <TableRow key={medicine.id}>
                                                <TableCell className="font-mono text-sm">
                                                    {medicine.kode || "-"}
                                                </TableCell>
                                                <TableCell className="font-medium">{medicine.nama}</TableCell>
                                                <TableCell>{formatCurrency(medicine.harga || 0)}</TableCell>
                                                <TableCell>
                                                    <Badge className="bg-green-100 text-green-800" variant="outline">
                                                        Available
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {filteredMedicines.length > 0 && (
                            <div className="mt-4 text-sm text-muted-foreground">
                                Menampilkan {filteredMedicines.length} obat
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
