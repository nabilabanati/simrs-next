import Link from "next/link"
import { POLI_LIST } from "@/lib/poli/dummy/poli"

export default function PoliIndexPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Daftar Poliklinik</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {POLI_LIST.map((poli) => (
          <Link
            key={poli.slug}
            href={`/poly-clinic/poly/${poli.slug}`}
            className="p-4 border rounded-lg shadow-sm bg-white hover:bg-gray-50 transition"
          >
            <p className="text-lg font-semibold">{poli.name}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
