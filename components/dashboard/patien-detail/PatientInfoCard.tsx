// components/patient-detail/PatientInfoCard.tsx

interface Props {
  patient: any
}

export default function PatientInfoCard({ patient }: Props) {
  if (!patient) return null

  return (
    <div className="bg-white border rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold">{patient.nama}</h2>
      <p className="text-sm text-gray-600">NRM: {patient.nrm}</p>
      <p className="text-sm text-gray-600">
        Tanggal Terdaftar: {patient.tanggalTerdaftar}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 text-sm">
        <div>
          <p><strong>NIK:</strong> {patient.nik}</p>
          <p><strong>Jenis Kelamin:</strong> {patient.jenisKelamin}</p>
          <p><strong>Alamat:</strong> {patient.alamat}</p>
        </div>

        <div>
          <p><strong>Penjamin:</strong> {patient.penjamin}</p>
          <p><strong>Alergi:</strong> {patient.alergi ?? "-"}</p>
          <p><strong>Penyakit Khusus:</strong> {patient.catatanKhusus ?? "-"}</p>
        </div>

        <div>
          <p><strong>PJ:</strong> {patient.namaPJ}</p>
          <p><strong>No. Telp PJ:</strong> {patient.noTelpPJ}</p>
          <p><strong>Status:</strong> {patient.status}</p>
        </div>
      </div>
    </div>
  )
}
