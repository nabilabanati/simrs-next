import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"

export default function Custom404() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <h1 className="text-9xl font-bold text-purple-600">404</h1>
                <h2 className="text-3xl font-semibold text-gray-900 mt-4 mb-2">
                    Halaman Tidak Ditemukan
                </h2>
                <p className="text-gray-600 mb-8">
                    Maaf, halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
                </p>
                <div className="flex gap-3 justify-center">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali
                    </Button>
                    <Button
                        onClick={() => router.push("/")}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Ke Halaman Utama
                    </Button>
                </div>
            </div>
        </div>
    )
}
