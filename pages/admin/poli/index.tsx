import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminPoliPage() {
    const router = useRouter();
    const [polis, setPolis] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentPoli, setCurrentPoli] = useState<any>(null);

    // Form states
    const [formData, setFormData] = useState({
        nama: "",
        kode: "",
        harga_daftar: "",
    });

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

            fetchPolis();
        } catch (error) {
            console.error("Error parsing user data:", error);
            router.push("/login");
        }
    }, [router]);

    const fetchPolis = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/master/poli", {
                credentials: "include",  // Auto-send cookie
            });
            const json = await res.json();
            setPolis(json.data || []);
        } catch (error) {
            console.error("Failed to fetch poli:", error);
            toast.error("Gagal memuat data poli");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/master/poli", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    nama: formData.nama,
                    kode: formData.kode || null,
                    harga_daftar: parseInt(formData.harga_daftar),
                }),
            });

            const json = await res.json();
            if (res.ok) {
                toast.success("Poli berhasil ditambahkan");
                setIsCreateModalOpen(false);
                setFormData({ nama: "", kode: "", harga_daftar: "" });
                fetchPolis();
            } else {
                toast.error(json.error || "Gagal menambahkan poli");
            }
        } catch (error) {
            console.error("Create error:", error);
            toast.error("Terjadi kesalahan");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/master/poli", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    id: currentPoli.id,
                    nama: formData.nama,
                    kode: formData.kode || null,
                    harga_daftar: parseInt(formData.harga_daftar),
                }),
            });

            const json = await res.json();
            if (res.ok) {
                toast.success("Poli berhasil diupdate");
                setIsEditModalOpen(false);
                setCurrentPoli(null);
                setFormData({ nama: "", kode: "", harga_daftar: "" });
                fetchPolis();
            } else {
                toast.error(json.error || "Gagal mengupdate poli");
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Terjadi kesalahan");
        }
    };

    const handleDelete = async (poli: any) => {
        if (!confirm(`Hapus poli "${poli.nama}"? Semua assignment dokter/perawat akan dihapus.`)) {
            return;
        }

        try {
            const res = await fetch("/api/master/poli", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ id: poli.id }),
            });

            if (res.ok) {
                toast.success("Poli berhasil dihapus");
                fetchPolis();
            } else {
                const json = await res.json();
                toast.error(json.error || "Gagal menghapus poli");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Terjadi kesalahan");
        }
    };

    const openEditModal = (poli: any) => {
        setCurrentPoli(poli);
        setFormData({
            nama: poli.nama,
            kode: poli.kode || "",
            harga_daftar: poli.harga_daftar?.toString() || "",
        });
        setIsEditModalOpen(true);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Manajemen Poli</h1>
                        <p className="text-muted-foreground mt-1">
                            Kelola poliklinik rumah sakit
                        </p>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Poli Baru
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Poli</CardTitle>
                        <CardDescription>Semua poliklinik yang tersedia</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama Poli</TableHead>
                                        <TableHead>Kode</TableHead>
                                        <TableHead>Harga Daftar</TableHead>
                                        <TableHead className="text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : polis.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                Belum ada poli
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        polis.map((poli) => (
                                            <TableRow key={poli.id}>
                                                <TableCell className="font-medium">{poli.nama}</TableCell>
                                                <TableCell>{poli.kode || "-"}</TableCell>
                                                <TableCell>
                                                    Rp {poli.harga_daftar?.toLocaleString("id-ID") || 0}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center gap-2">
                                                        <Link href={`/admin/poli/${poli.id}`}>
                                                            <Button variant="outline" size="icon" title="Lihat Detail">
                                                                <Users className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => openEditModal(poli)}
                                                            title="Edit"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => handleDelete(poli)}
                                                            title="Hapus"
                                                            className="text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Create Modal */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent>
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Tambah Poli Baru</DialogTitle>
                                <DialogDescription>
                                    Isi form untuk menambahkan poliklinik baru
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label htmlFor="nama">Nama Poli *</Label>
                                    <Input
                                        id="nama"
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        placeholder="Contoh: Poli Umum"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="kode">Kode</Label>
                                    <Input
                                        id="kode"
                                        value={formData.kode}
                                        onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                                        placeholder="Contoh: PU"
                                        maxLength={10}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="harga">Harga Daftar (Rp) *</Label>
                                    <Input
                                        id="harga"
                                        type="number"
                                        value={formData.harga_daftar}
                                        onChange={(e) => setFormData({ ...formData, harga_daftar: e.target.value })}
                                        placeholder="Contoh: 50000"
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit">Simpan</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent>
                        <form onSubmit={handleUpdate}>
                            <DialogHeader>
                                <DialogTitle>Edit Poli</DialogTitle>
                                <DialogDescription>
                                    Update informasi polik linik
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label htmlFor="edit-nama">Nama Poli *</Label>
                                    <Input
                                        id="edit-nama"
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-kode">Kode</Label>
                                    <Input
                                        id="edit-kode"
                                        value={formData.kode}
                                        onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                                        maxLength={10}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-harga">Harga Daftar (Rp) *</Label>
                                    <Input
                                        id="edit-harga"
                                        type="number"
                                        value={formData.harga_daftar}
                                        onChange={(e) => setFormData({ ...formData, harga_daftar: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit">Update</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
