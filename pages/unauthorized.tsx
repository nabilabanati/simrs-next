import React from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";

export default function UnauthorizedPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
            <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8 text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-red-100 p-4 rounded-full">
                        <AlertCircle className="h-12 w-12 text-red-600" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Akses Ditolak
                </h1>

                <p className="text-gray-600 mb-6">
                    Anda tidak memiliki izin untuk mengakses halaman ini.
                    Silakan login dengan akun yang memiliki akses yang sesuai.
                </p>

                <div className="flex flex-col gap-3">
                    <Link href="/login">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                            Kembali ke Login
                        </Button>
                    </Link>

                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="w-full"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Halaman Sebelumnya
                    </Button>
                </div>

                {/* Error Code */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                        Kode Error: 403 - Forbidden
                    </p>
                </div>
            </div>
        </div>
    );
}
