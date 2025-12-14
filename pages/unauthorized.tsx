import React from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-red-100 p-4 rounded-full">
                        <AlertCircle className="h-12 w-12 text-red-600" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Akses Ditolak
                </h1>

                <p className="text-gray-600 mb-6">
                    Anda tidak memiliki izin untuk mengakses halaman ini.
                    Silakan login dengan akun yang memiliki akses yang sesuai.
                </p>

                <div className="space-y-3">
                    <Link href="/login">
                        <Button className="w-full">
                            Kembali ke Login
                        </Button>
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Kembali ke Halaman Sebelumnya
                    </button>
                </div>
            </div>
        </div>
    );
}
