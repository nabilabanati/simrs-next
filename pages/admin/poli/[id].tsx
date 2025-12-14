import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function PoliDetailPage() {
    const router = useRouter();
    const { id } = router.query;

    const [loading, setLoading] = useState(true);
    const [poli, setPoli] = useState<any>(null);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [nurses, setNurses] = useState<any[]>([]);

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

        if (id) {
            fetchPoliDetail();
        }
    }, [router, id]);

    const fetchPoliDetail = async () => {
        setLoading(true);
        try {
            // Fetch poli data
            const { data: poliData, error: poliError } = await supabase
                .from("poli")
                .select("*")
                .eq("id", id)
                .single();

            if (poliError) throw poliError;
            setPoli(poliData);

            // Fetch doctors in this poli
            const { data: doctorsData, error: doctorsError } = await supabase
                .from("doctor_poli")
                .select(`
          id,
          doctors:dokter_id (
            id,
            spesialis,
            sip,
            users:user_id (
              nama
            )
          )
        `)
                .eq("poli_id", id);

            if (!doctorsError && doctorsData) {
                setDoctors(doctorsData.map((dp: any) => ({
                    assignmentId: dp.id,
                    doctorId: dp.doctors.id,
                    nama: dp.doctors.users?.nama || "-",
                    spesialis: dp.doctors.spesialis || "-",
                    sip: dp.doctors.sip || "-",
                })));
            }

            // Fetch nurses in this poli
            const { data: nursesData, error: nursesError } = await supabase
                .from("nurse_poli")
                .select(`
          id,
          nurses:nurse_id (
            id,
            users:user_id (
              nama
            )
          )
        `)
                .eq("poli_id", id);

            if (!nursesError && nursesData) {
                setNurses(nursesData.map((np: any) => ({
                    assignmentId: np.id,
                    nurseId: np.nurses.id,
                    nama: np.nurses.users?.nama || "-",
                })));
            }
        } catch (error) {
            console.error("Error fetching poli detail:", error);
            toast.error("Gagal memuat data poli");
        } finally {
            setLoading(false);
        }
    };

    const handleUnassignDoctor = async (assignmentId: string) => {
        if (!confirm("Hapus assignment dokter dari poli ini?")) return;

        try {
            const { error } = await supabase
                .from("doctor_poli")
                .delete()
                .eq("id", assignmentId);

            if (error) throw error;

            toast.success("Dokter berhasil dihapus dari poli");
            fetchPoliDetail();
        } catch (error: any) {
            console.error("Error unassigning doctor:", error);
            toast.error(error.message || "Gagal menghapus assignment");
        }
    };

    const handleUnassignNurse = async (assignmentId: string) => {
        if (!confirm("Hapus assignment perawat dari poli ini?")) return;

        try {
            const { error } = await supabase
                .from("nurse_poli")
                .delete()
                .eq("id", assignmentId);

            if (error) throw error;

            toast.success("Perawat berhasil dihapus dari poli");
            fetchPoliDetail();
        } catch (error: any) {
            console.error("Error unassigning nurse:", error);
            toast.error(error.message || "Gagal menghapus assignment");
        }
    };

    if (loading || !poli) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-muted-foreground">Memuat data...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/admin/poli")}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Daftar Poli
                    </Button>

                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{poli.nama}</h1>
                        <p className="text-muted-foreground mt-1">
                            Detail dan manajemen staff poli
                        </p>
                    </div>
                </div>

                {/* Poli Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Poli</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Nama Poli</p>
                                <p className="font-medium">{poli.nama}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Kode</p>
                                <p className="font-medium">{poli.kode || "-"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Harga Daftar</p>
                                <p className="font-medium">
                                    Rp {poli.harga_daftar?.toLocaleString("id-ID") || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Doctors */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Dokter</CardTitle>
                                    <CardDescription>
                                        Dokter yang bertugas di poli ini
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary">{doctors.length} Dokter</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama</TableHead>
                                            <TableHead>Spesialis</TableHead>
                                            <TableHead className="text-center">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {doctors.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={3}
                                                    className="text-center py-8 text-muted-foreground"
                                                >
                                                    Belum ada dokter di poli ini
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            doctors.map((doctor) => (
                                                <TableRow key={doctor.assignmentId}>
                                                    <TableCell className="font-medium">
                                                        {doctor.nama}
                                                    </TableCell>
                                                    <TableCell>{doctor.spesialis}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleUnassignDoctor(doctor.assignmentId)}
                                                            className="text-red-600 hover:bg-red-50"
                                                            title="Hapus dari poli"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Nurses */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Perawat</CardTitle>
                                    <CardDescription>
                                        Perawat yang bertugas di poli ini
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary">{nurses.length} Perawat</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama</TableHead>
                                            <TableHead className="text-center">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {nurses.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={2}
                                                    className="text-center py-8 text-muted-foreground"
                                                >
                                                    Belum ada perawat di poli ini
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            nurses.map((nurse) => (
                                                <TableRow key={nurse.assignmentId}>
                                                    <TableCell className="font-medium">
                                                        {nurse.nama}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleUnassignNurse(nurse.assignmentId)}
                                                            className="text-red-600 hover:bg-red-50"
                                                            title="Hapus dari poli"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Info Note */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <p className="text-sm text-blue-800">
                            <strong>Info:</strong> Untuk assign dokter/perawat ke poli ini,
                            gunakan menu <strong>Kelola Pegawai</strong> dan edit poli assignment
                            dari masing-masing pegawai.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
