import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface CreatePatientModalProps {
  onClose: () => void;
  onSuccess: (patient: any) => void;
}

export default function CreatePatientModal({ onClose, onSuccess }: CreatePatientModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nik: '',
    nrm: '',
    nama: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L',
    alamat: '',
    nomor_telepon: '',
    pekerjaan: '',
    pendidikan: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nik || !formData.nama) {
      toast.error('NIK dan Nama harus diisi');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Gagal membuat pasien');
        return;
      }

      toast.success('Pasien berhasil dibuat!');
      onSuccess(data.patient);
      onClose();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-blue-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">Buat Pasien Baru</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NIK */}
            <div>
              <label className="block text-sm font-medium mb-1">NIK *</label>
              <input
                type="text"
                name="nik"
                value={formData.nik}
                onChange={handleChange}
                placeholder="1234567890123456"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* NRM */}
            <div>
              <label className="block text-sm font-medium mb-1">NRM (Nomor Rekam Medis)</label>
              <input
                type="text"
                name="nrm"
                value={formData.nrm}
                onChange={handleChange}
                placeholder="Otomatis jika kosong"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Nama */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Nama Lengkap *</label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                placeholder="Nama Lengkap Pasien"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tempat Lahir */}
            <div>
              <label className="block text-sm font-medium mb-1">Tempat Lahir</label>
              <input
                type="text"
                name="tempat_lahir"
                value={formData.tempat_lahir}
                onChange={handleChange}
                placeholder="Kota/Kabupaten"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tanggal Lahir */}
            <div>
              <label className="block text-sm font-medium mb-1">Tanggal Lahir</label>
              <input
                type="date"
                name="tanggal_lahir"
                value={formData.tanggal_lahir}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label className="block text-sm font-medium mb-1">Jenis Kelamin</label>
              <select
                name="jenis_kelamin"
                value={formData.jenis_kelamin}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            {/* Alamat */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Alamat</label>
              <input
                type="text"
                name="alamat"
                value={formData.alamat}
                onChange={handleChange}
                placeholder="Jl. ... No. ..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Nomor Telepon */}
            <div>
              <label className="block text-sm font-medium mb-1">Nomor Telepon</label>
              <input
                type="tel"
                name="nomor_telepon"
                value={formData.nomor_telepon}
                onChange={handleChange}
                placeholder="081234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Pekerjaan */}
            <div>
              <label className="block text-sm font-medium mb-1">Pekerjaan</label>
              <input
                type="text"
                name="pekerjaan"
                value={formData.pekerjaan}
                onChange={handleChange}
                placeholder="Pekerjaan"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Pendidikan */}
            <div>
              <label className="block text-sm font-medium mb-1">Pendidikan</label>
              <input
                type="text"
                name="pendidikan"
                value={formData.pendidikan}
                onChange={handleChange}
                placeholder="Pendidikan Terakhir"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan & Lanjut Registrasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
