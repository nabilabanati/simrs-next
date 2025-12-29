import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Custom404() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-blue-600">404</h1>
                <h2 className="text-3xl font-semibold text-gray-800 mt-4">
                    Halaman Tidak Ditemukan
                </h2>
                <p className="text-gray-600 mt-2 mb-8">
                    Maaf, halaman yang Anda cari tidak tersedia.
                </p>
                <div className="space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Kembali
                    </button>
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Ke Beranda
                    </Link>
                </div>
            </div>
        </div>
    );
}
