import { useState, useEffect } from "react";

export interface AdminStats {
    totalPatients: number;
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    todayVisits: number;
    pendingOrders: number;
    unpaidInvoices: number;
    lowStockMedicines: number;
}

export function useAdminData() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            setLoading(true);

            // Fetch all data in parallel - token is in HttpOnly cookie
            const [patientsRes, employeesRes, visitsRes, ordersRes, invoicesRes, medicinesRes] = await Promise.all([
                fetch("/api/patients/search", { credentials: 'include' }),
                fetch("/api/admin/employees", { credentials: 'include' }),
                fetch(`/api/visits/list?tanggal=${new Date().toISOString().split("T")[0]}`, { credentials: 'include' }),
                fetch("/api/pharmacy/orders?status=waiting", { credentials: 'include' }),
                fetch("/api/admin/invoices?paid=false", { credentials: 'include' }),
                fetch("/api/master/medicines", { credentials: 'include' }),
            ]);

            const [patients, employees, visits, orders, invoices, medicines] = await Promise.all([
                patientsRes.json(),
                employeesRes.json(),
                visitsRes.json(),
                ordersRes.json(),
                invoicesRes.json(),
                medicinesRes.json(),
            ]);

            const activeEmployees = employees.data?.filter((e: any) => e.is_active).length || 0;
            const inactiveEmployees = employees.data?.filter((e: any) => !e.is_active).length || 0;

            setStats({
                totalPatients: patients.data?.length || 0,
                totalEmployees: employees.data?.length || 0,
                activeEmployees,
                inactiveEmployees,
                todayVisits: visits.data?.length || 0,
                pendingOrders: orders.data?.length || 0,
                unpaidInvoices: invoices.data?.length || 0,
                lowStockMedicines: 0, // TODO: implement low stock logic
            });

            setError(null);
        } catch (err: any) {
            setError(err.message || "Failed to fetch statistics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return { stats, loading, error, refetch: fetchStats };
}
