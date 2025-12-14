import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function EditEmployeePage() {
    const router = useRouter();
    const { id } = router.query;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [employee, setEmployee] = useState<any>(null);
    const [polis, setPolis] = useState<any[]>([]);

    // Form data
    const [formData, setFormData] = useState({
        nama: "",
        username: "",
        spesialis: "", // for dokter
        sip: "", // for dokter
        poli_id: "", // for dokter & nurse
    });

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
            fetchEmployee();
            fetchPolis();
        }
    }, [router, id]);

    const fetchPolis = async () => {
        try {
            const { data, error } = await supabase
                .from("poli")
                .select("*")
                .order("nama", { ascending: true });

            if (!error) {
                setPolis(data || []);
            }
        } catch (error) {
            console.error("Failed to fetch poli:", error);
        }
    };

    const fetchEmployee = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("users")
                .select(`
          *,
          doctors (
            *,
            doctor_poli (poli_id)
          ),
          nurses (
            *,
            nurse_poli (poli_id)
          )
        `)
                .eq("id", id)
                .single();

            if (error) throw error;

            setEmployee(data);

            // Get current poli assignment
            let currentPoliId = "";
            if (data.role === "dokter" && data.doctors?.[0]?.doctor_poli?.[0]) {
                currentPoliId = data.doctors[0].doctor_poli[0].poli_id;
            } else if (data.role === "nurse" && data.nurses?.[0]?.nurse_poli?.[0]) {
                currentPoliId = data.nurses[0].nurse_poli[0].poli_id;
            }

            setFormData({
                nama: data.nama || "",
                username: data.username || "",
                spesialis: data.doctors?.[0]?.spesialis || "",
                sip: data.doctors?.[0]?.sip || "",
                poli_id: currentPoliId,
            });
        } catch (error) {
            console.error("Error fetching employee:", error);
            toast.error("Gagal memuat data pegawai");
            router.push("/admin/employees");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Update users table
            const { error: userError } = await supabase
                .from("users")
                .update({
                    nama: formData.nama,
                    username: formData.username,
                })
                .eq("id", id);

            if (userError) throw userError;

            // Update doctors table if role is dokter
            if (employee?.role === "dokter" && employee.doctors?.[0]?.id) {
                const { error: doctorError } = await supabase
                    .from("doctors")
                    .update({
                        spesialis: formData.spesialis || null,
                        sip: formData.sip || null,
                    })
                    .eq("id", employee.doctors[0].id);

                if (doctorError) throw doctorError;
            }

            // Update poli assignment for dokter or nurse
            if (employee?.role === "dokter" || employee?.role === "nurse") {
                const isDoctor = employee.role === "dokter";
                const employeeRecordId = isDoctor
                    ? employee.doctors?.[0]?.id
                    : employee.nurses?.[0]?.id;

                if (employeeRecordId) {
                    const tableName = isDoctor ? "doctor_poli" : "nurse_poli";
                    const foreignKey = isDoctor ? "dokter_id" : "nurse_id";

                    // Delete existing assignment
                    await supabase
                        .from(tableName)
                        .delete()
                        .eq(foreignKey, employeeRecordId);

                    // Insert new assignment if poli selected
                    if (formData.poli_id) {
                        const { error: poliError } = await supabase
                            .from(tableName)
                            .insert({
                                [foreignKey]: employeeRecordId,
                                poli_id: formData.poli_id,
                            });

                        if (poliError) throw poliError;
                    }
                }
            }

            toast.success("Data pegawai berhasil diupdate");
            router.push("/admin/employees");
        } catch (error: any) {
            console.error("Error updating employee:", error);
            toast.error(error.message || "Gagal mengupdate data");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !employee) {
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
            <div className="space-y-6 max-w-2xl">
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/admin/employees")}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali
                    </Button>

                    <h1 className="text-3xl font-bold tracking-tight">Edit Pegawai</h1>
                    <p className="text-muted-foreground mt-1">
                        Update informasi pegawai
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Pegawai</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Nama */}
                            <div>
                                <Label htmlFor="nama">Nama Lengkap *</Label>
                                <Input
                                    id="nama"
                                    value={formData.nama}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nama: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            {/* Username */}
                            <div>
                                <Label htmlFor="username">Username *</Label>
                                <Input
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({ ...formData, username: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            {/* Role (read-only) */}
                            <div>
                                <Label htmlFor="role">Role</Label>
                                <Input id="role" value={employee.role} disabled />
                            </div>

                            {/* Dokter-specific fields */}
                            {employee.role === "dokter" && (
                                <>
                                    <div>
                                        <Label htmlFor="spesialis">Spesialis</Label>
                                        <Input
                                            id="spesialis"
                                            value={formData.spesialis}
                                            onChange={(e) =>
                                                setFormData({ ...formData, spesialis: e.target.value })
                                            }
                                            placeholder="Contoh: Umum, Anak, dll"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="sip">SIP (Surat Izin Praktik)</Label>
                                        <Input
                                            id="sip"
                                            value={formData.sip}
                                            onChange={(e) =>
                                                setFormData({ ...formData, sip: e.target.value })
                                            }
                                            placeholder="Nomor SIP"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Poli Assignment (for dokter & nurse) */}
                            {(employee.role === "dokter" || employee.role === "nurse") && (
                                <div>
                                    <Label htmlFor="poli">Poli Assignment</Label>
                                    <Select
                                        value={formData.poli_id || undefined}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, poli_id: value })
                                        }
                                    >
                                        <SelectTrigger id="poli">
                                            <SelectValue placeholder="Pilih poli" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {polis.map((poli) => (
                                                <SelectItem key={poli.id} value={poli.id}>
                                                    {poli.nama}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        1 {employee.role} hanya bisa di-assign ke 1 poli
                                    </p>
                                    {formData.poli_id && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setFormData({ ...formData, poli_id: "" })}
                                            className="mt-2"
                                        >
                                            Hapus Poli Assignment
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Status (read-only) */}
                            <div>
                                <Label>Status</Label>
                                <div className="mt-2">
                                    <span
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${employee.is_active
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                            }`}
                                    >
                                        {employee.is_active ? "Aktif" : "Nonaktif"}
                                    </span>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Status dapat diubah dari tabel pegawai
                                    </p>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push("/admin/employees")}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={saving}>
                                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
