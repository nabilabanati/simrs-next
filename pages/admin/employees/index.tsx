import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, MapPin, Pencil } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminEmployeesPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const debouncedSearch = useDebounce(searchTerm, 500);

    // Poli assignment modal
    const [isPoliModalOpen, setIsPoliModalOpen] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState<any>(null);
    const [polis, setPolis] = useState<any[]>([]);
    const [selectedPoliId, setSelectedPoliId] = useState<string>("");

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

        fetchEmployees();
        fetchPolis();
    }, [router, roleFilter]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const url = roleFilter === "all"
                ? "/api/admin/employees"
                : `/api/admin/employees?role=${roleFilter}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setEmployees(json.data || []);
        } catch (error) {
            console.error("Failed to fetch employees:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (employeeId: string) => {
        if (!confirm("Apakah Anda yakin ingin mengubah status pegawai ini?")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/admin/employees", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ id: employeeId, action: "toggle-active" }),
            });

            const json = await res.json();
            if (json.data) {
                alert(json.data.message);
                fetchEmployees(); // Refresh list
            } else {
                alert(json.error || "Failed to update employee");
            }
        } catch (error) {
            console.error("Failed to toggle employee status:", error);
            alert("Error updating employee");
        }
    };

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

    const openPoliModal = (employee: any) => {
        setCurrentEmployee(employee);

        // Get current poli assignment
        let currentPoliId = "";
        if (employee.role === "dokter" && employee.doctors?.[0]?.doctor_poli?.[0]) {
            currentPoliId = employee.doctors[0].doctor_poli[0].poli_id;
        } else if (employee.role === "nurse" && employee.nurses?.[0]?.nurse_poli?.[0]) {
            currentPoliId = employee.nurses[0].nurse_poli[0].poli_id;
        }

        setSelectedPoliId(currentPoliId);
        setIsPoliModalOpen(true);
    };

    const handleSavePoliAssignment = async () => {
        if (!currentEmployee) return;

        try {
            const isDoctor = currentEmployee.role === "dokter";
            const employeeRecordId = isDoctor
                ? currentEmployee.doctors?.[0]?.id
                : currentEmployee.nurses?.[0]?.id;

            if (!employeeRecordId) {
                toast.error("Employee record not found");
                return;
            }

            const tableName = isDoctor ? "doctor_poli" : "nurse_poli";
            const foreignKey = isDoctor ? "dokter_id" : "nurse_id";

            // Delete existing assignment
            await supabase
                .from(tableName)
                .delete()
                .eq(foreignKey, employeeRecordId);

            // Insert new assignment if poli selected
            if (selectedPoliId) {
                const { error } = await supabase
                    .from(tableName)
                    .insert({
                        [foreignKey]: employeeRecordId,
                        poli_id: selectedPoliId,
                    });

                if (error) throw error;
            }

            toast.success("Poli assignment berhasil diupdate");
            setIsPoliModalOpen(false);
            setCurrentEmployee(null);
            fetchEmployees();
        } catch (error: any) {
            console.error("Error saving poli assignment:", error);
            toast.error(error.message || "Gagal update poli assignment");
        }
    };

    const filteredEmployees = employees.filter((emp) => {
        if (!debouncedSearch) return true;
        const search = debouncedSearch.toLowerCase();
        return (
            emp.nama?.toLowerCase().includes(search) ||
            emp.username?.toLowerCase().includes(search)
        );
    });

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            dokter: "bg-blue-100 text-blue-800",
            nurse: "bg-green-100 text-green-800",
            loket: "bg-purple-100 text-purple-800",
            farmasi: "bg-yellow-100 text-yellow-800",
            kasir: "bg-pink-100 text-pink-800",
        };
        return colors[role] || "bg-gray-100 text-gray-800";
    };

    const getPoliNames = (employee: any) => {
        if (employee.doctors && employee.doctors.length > 0) {
            const polis = employee.doctors[0].doctor_poli?.map((dp: any) => dp.poli?.nama) || [];
            return polis.join(", ") || "-";
        }
        if (employee.nurses && employee.nurses.length > 0) {
            const polis = employee.nurses[0].nurse_poli?.map((np: any) => np.poli?.nama) || [];
            return polis.join(", ") || "-";
        }
        return "-";
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Manajemen Pegawai</h1>
                        <p className="text-muted-foreground mt-1">
                            Kelola dokter, perawat, dan staff rumah sakit
                        </p>
                    </div>
                    <Link href="/admin/employees/create">
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Tambah Pegawai
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Pegawai</CardTitle>
                        <CardDescription>
                            Semua pegawai yang terdaftar di sistem
                        </CardDescription>
                        <div className="flex gap-4 mt-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari berdasarkan nama atau username..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="border rounded-md px-3 py-2"
                            >
                                <option value="all">Semua Role</option>
                                <option value="dokter">Dokter</option>
                                <option value="nurse">Perawat</option>
                                <option value="loket">Loket</option>
                                <option value="farmasi">Farmasi</option>
                                <option value="kasir">Kasir</option>
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Username</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Poli</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredEmployees.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                Tidak ada pegawai ditemukan
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredEmployees.map((employee) => (
                                            <TableRow key={employee.id}>
                                                <TableCell className="font-medium">{employee.nama}</TableCell>
                                                <TableCell>{employee.username}</TableCell>
                                                <TableCell>
                                                    <Badge className={getRoleBadgeColor(employee.role)} variant="outline">
                                                        {employee.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">{getPoliNames(employee)}</TableCell>
                                                <TableCell>
                                                    {employee.is_active ? (
                                                        <Badge className="bg-green-100 text-green-800" variant="outline">
                                                            Aktif
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-red-100 text-red-800" variant="outline">
                                                            Nonaktif
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Link href={`/admin/employees/edit/${employee.id}`}>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                title="Edit Profile"
                                                            >
                                                                <Pencil className="h-4 w-4 mr-1" />
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        {(employee.role === "dokter" || employee.role === "nurse") && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openPoliModal(employee)}
                                                                title="Edit Poli Assignment"
                                                            >
                                                                <MapPin className="h-4 w-4 mr-1" />
                                                                Edit Poli
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleToggleActive(employee.id)}
                                                        >
                                                            {employee.is_active ? "Nonaktifkan" : "Aktifkan"}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {filteredEmployees.length > 0 && (
                            <div className="mt-4 text-sm text-muted-foreground">
                                Menampilkan {filteredEmployees.length} pegawai
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Edit Poli Assignment Modal */}
                <Dialog open={isPoliModalOpen} onOpenChange={setIsPoliModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Poli Assignment</DialogTitle>
                            <DialogDescription>
                                Pilih poli untuk {currentEmployee?.nama}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="poli-select">Poli</Label>
                            <Select value={selectedPoliId || undefined} onValueChange={setSelectedPoliId}>
                                <SelectTrigger id="poli-select">
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
                            <p className="text-sm text-muted-foreground mt-2">
                                Catatan: 1 {currentEmployee?.role} hanya bisa di assign ke 1 poli
                            </p>
                            {selectedPoliId && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedPoliId("")}
                                    className="mt-2"
                                >
                                    Clear Selection
                                </Button>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPoliModalOpen(false)}>
                                Batal
                            </Button>
                            <Button onClick={handleSavePoliAssignment}>
                                Simpan
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
