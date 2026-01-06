/**
 * Example: Using API Client in a React Component
 * 
 * This example shows how to use the new API client
 * to handle session expiration gracefully.
 */

import { useState, useEffect } from 'react';
import api from '@/lib/api-client';

interface Patient {
    id: string;
    nama: string;
    nik: string;
    nrm: string;
}

export default function ExamplePatientList() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            setLoading(true);
            setError('');

            // ✅ Using API client - automatically handles session expiration
            const data = await api.get<Patient[]>('/api/doctor/patients');

            setPatients(data);
        } catch (err: any) {
            // If session expired, user is already redirected to login
            // This catch block only handles other errors
            setError(err.message || 'Failed to load patients');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this patient?')) return;

        try {
            await api.delete(`/api/patients/${id}`);

            // Refresh list after delete
            await loadPatients();
        } catch (err: any) {
            alert('Failed to delete patient: ' + err.message);
        }
    };

    if (loading) {
        return <div className="p-4">Loading patients...</div>;
    }

    if (error) {
        return (
            <div className="p-4">
                <div className="bg-red-50 border border-red-200 rounded p-4">
                    <p className="text-red-800">Error: {error}</p>
                    <button
                        onClick={loadPatients}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Patient List</h1>

            <div className="space-y-2">
                {patients.map((patient) => (
                    <div
                        key={patient.id}
                        className="border rounded p-4 flex justify-between items-center"
                    >
                        <div>
                            <p className="font-semibold">{patient.nama}</p>
                            <p className="text-sm text-gray-600">
                                NRM: {patient.nrm} | NIK: {patient.nik}
                            </p>
                        </div>

                        <button
                            onClick={() => handleDelete(patient.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
