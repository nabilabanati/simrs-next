import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function AdminPatientsPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<any[]>([]);
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

        fetchPatients();
    }, [router, debouncedSearch]);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/patients/search?keyword=${debouncedSearch}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setPatients(json.data || []);
        } catch (error) {
            console.error("Failed to fetch patients:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data Pasien</h1>
                    <p className="text-muted-foreground mt-1">
                        Semua pasien yang terdaftar di rumah sakit (Read-only)
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>List Pasien</CardTitle>
                        <CardDescription>
                            Cari berdasarkan NRM, nama, atau NIK
                        </CardDescription>
                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari pasien..."
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
                                        <TableHead>NRM</TableHead>
                                        <TableHead>NIK</TableHead>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Jenis Kelamin</TableHead>
                                        <TableHead>Tanggal Lahir</TableHead>
                                        <TableHead>Alamat</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : patients.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                {searchTerm ? "Tidak ada pasien ditemukan" : "Belum ada data pasien"}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        patients.map((patient) => (
                                            <TableRow key={patient.id}>
                                                <TableCell className="font-medium">{patient.nrm}</TableCell>
                                                <TableCell>{patient.nik || "-"}</TableCell>
                                                <TableCell>{patient.nama}</TableCell>
                                                <TableCell>{patient.jenis_kelamin || "-"}</TableCell>
                                                <TableCell>
                                                    {patient.tanggal_lahir
                                                        ? new Date(patient.tanggal_lahir).toLocaleDateString("id-ID")
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {patient.alamat || "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {patients.length > 0 && (
                            <div className="mt-4 text-sm text-muted-foreground">
                                Menampilkan {patients.length} pasien
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
