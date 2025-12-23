import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateEmployeePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [polis, setPolis] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        nama: "",
        role: "loket",
        spesialis: "",
        sip: "",
        poli_ids: [] as string[],
    });

    useEffect(() => {
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
        try {
            const res = await fetch("/api/master/poli", {
                credentials: 'include',
            });
            const json = await res.json();
            setPolis(json.data || []);
        } catch (error) {
            console.error("Failed to fetch polis:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.username || !formData.password || !formData.nama) {
            alert("Please fill in all required fields");
            return;
        }

        if (formData.password.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/employees", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const json = await res.json();

            if (json.data) {
                alert("Pegawai berhasil ditambahkan!");
                router.push("/admin/employees");
            } else {
                alert(json.error || "Failed to create employee");
            }
        } catch (error) {
            console.error("Failed to create employee:", error);
            alert("Error creating employee");
        } finally {
            setLoading(false);
        }
    };

    const handlePoliChange = (poliId: string, checked: boolean) => {
        if (checked) {
            setFormData({
                ...formData,
                poli_ids: [...formData.poli_ids, poliId],
            });
        } else {
            setFormData({
                ...formData,
                poli_ids: formData.poli_ids.filter((id) => id !== poliId),
            });
        }
    };

    const showPoliAssignment = formData.role === "dokter" || formData.role === "nurse";
    const showDoctorFields = formData.role === "dokter";

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/employees">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tambah Pegawai Baru</h1>
                        <p className="text-muted-foreground mt-1">
                            Buat akun pegawai baru untuk rumah sakit
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Pegawai</CardTitle>
                            <CardDescription>
                                Isi data pegawai dengan lengkap dan benar
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Role Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="role">Role / Jabatan *</Label>
                                <select
                                    id="role"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full border rounded-md px-3 py-2"
                                    required
                                >
                                    <option value="loket">Loket</option>
                                    <option value="dokter">Dokter</option>
                                    <option value="nurse">Perawat</option>
                                    <option value="farmasi">Farmasi</option>
                                    <option value="kasir">Kasir</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Username */}
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username *</Label>
                                    <Input
                                        id="username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="username"
                                        required
                                    />
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Min. 6 karakter"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            {/* Nama Lengkap */}
                            <div className="space-y-2">
                                <Label htmlFor="nama">Nama Lengkap *</Label>
                                <Input
                                    id="nama"
                                    value={formData.nama}
                                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                    placeholder="Nama lengkap pegawai"
                                    required
                                />
                            </div>

                            {/* Doctor-specific fields */}
                            {showDoctorFields && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                                    <div className="space-y-2">
                                        <Label htmlFor="spesialis">Spesialis</Label>
                                        <Input
                                            id="spesialis"
                                            value={formData.spesialis}
                                            onChange={(e) => setFormData({ ...formData, spesialis: e.target.value })}
                                            placeholder="Contoh: Penyakit Dalam"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sip">SIP (Surat Izin Praktek)</Label>
                                        <Input
                                            id="sip"
                                            value={formData.sip}
                                            onChange={(e) => setFormData({ ...formData, sip: e.target.value })}
                                            placeholder="Nomor SIP"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Poli Assignment */}
                            {showPoliAssignment && (
                                <div className="space-y-2">
                                    <Label>Poli Assignment</Label>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Pilih poli yang akan ditangani oleh {formData.role === "dokter" ? "dokter" : "perawat"} ini
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {polis.map((poli) => (
                                            <label
                                                key={poli.id}
                                                className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.poli_ids.includes(poli.id)}
                                                    onChange={(e) => handlePoliChange(poli.id, e.target.checked)}
                                                    className="rounded"
                                                />
                                                <span className="text-sm">{poli.nama}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Menyimpan..." : "Simpan Pegawai"}
                                </Button>
                                <Link href="/admin/employees">
                                    <Button type="button" variant="outline">
                                        Batal
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AdminLayout>
    );
}
