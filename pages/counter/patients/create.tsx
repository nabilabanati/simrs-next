'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CounterLayout } from '@/components/layout/CounterLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Province {
  code: string;
  name: string;
}

interface City {
  code: string;
  name: string;
}

interface District {
  code: string;
  name: string;
}

interface Village {
  code: string;
  name: string;
  postal_code: string;
}

export default function CreatePatientPage() {
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [penjaminType, setPenjaminType] = useState('');

  // Location data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    nik: '',
    nama: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: '',
    pekerjaan: '',
    golonganDarah: '',
    penanggungJawab: '',
    namaPJ: '',
    pekerjaanPJ: '',
    noTelpPJ: '',
    alamat: '',
    provinsi: '',
    kabupaten: '',
    kecamatan: '',
    desa: '',
    kodePos: '',
    penjamin: '',
    nomorBPJS: '',
    namaAsuransi: '',
    nomorAsuransi: '',
    namaInstansi: '',
    nomorSurat: '',
    nomorPeserta: '',
    caraMasuk: '',
    noRujukan: '',
    catatanKhusus: '',
  });

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const response = await fetch('/api/regions/provinces');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProvinces(data);
      } catch (error) {
        console.error('Error loading provinces:', error);
      }
    };
    loadProvinces();
  }, []);

  // Load cities when province changes
  useEffect(() => {
    if (formData.provinsi) {
      const loadCities = async () => {
        try {
          const response = await fetch(`/api/regions/regencies?province_id=${formData.provinsi}`);
          const data = await response.json();
          setCities(data);
          setFormData((prev) => ({ ...prev, kabupaten: '', kecamatan: '', desa: '', kodePos: '' }));
          setDistricts([]);
          setVillages([]);
        } catch (error) {
          console.error('Error loading cities:', error);
        }
      };
      loadCities();
    }
  }, [formData.provinsi]);

  // Load districts when city changes
  useEffect(() => {
    if (formData.kabupaten) {
      const loadDistricts = async () => {
        try {
          const response = await fetch(`/api/regions/districts?regency_id=${formData.kabupaten}`);
          const data = await response.json();
          setDistricts(data);
          setFormData((prev) => ({ ...prev, kecamatan: '', desa: '', kodePos: '' }));
          setVillages([]);
        } catch (error) {
          console.error('Error loading districts:', error);
        }
      };
      loadDistricts();
    }
  }, [formData.kabupaten]);

  // Load villages when district changes
  useEffect(() => {
    if (formData.kecamatan) {
      const loadVillages = async () => {
        try {
          const response = await fetch(`/api/regions/villages?district_id=${formData.kecamatan}`);
          const data = await response.json();
          setVillages(data);
        } catch (error) {
          console.error('Error loading villages:', error);
        }
      };
      loadVillages();
    }
  }, [formData.kecamatan]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePenjaminChange = (value: string) => {
    setPenjaminType(value);
    handleSelectChange('penjamin', value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { supabase } = await import('@/lib/supabase');

      // 1. Insert patient data (without penjamin)
      const patientData: any = {
        nik: formData.nik,
        nama: formData.nama,
        tempat_lahir: formData.tempatLahir,
        tanggal_lahir: formData.tanggalLahir,
        jenis_kelamin: formData.jenisKelamin,
        pekerjaan: formData.pekerjaan,
        golongan_darah: formData.golonganDarah,
        penanggung_jawab: formData.penanggungJawab,
        nama_pj: formData.namaPJ,
        pekerjaan_pj: formData.pekerjaanPJ,
        no_telp_pj: formData.noTelpPJ,
        alamat: formData.alamat,
        province_id: formData.provinsi,
        regency_id: formData.kabupaten,
        district_id: formData.kecamatan,
        village_id: formData.desa,
        kode_pos: formData.kodePos,
        catatan_khusus: formData.catatanKhusus,
      };

      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();

      if (patientError) {
        console.error('Error saving patient:', patientError);
        alert('Gagal menyimpan data pasien: ' + patientError.message);
        return;
      }

      // 2. If penjamin selected, insert to patient_penjamin
      if (formData.penjamin) {
        // First, get or create penjamin
        const { data: penjaminData, error: penjaminError } = await supabase
          .from('penjamin')
          .select('id')
          .eq('nama', formData.penjamin)
          .single();

        let penjaminId = penjaminData?.id;

        // If penjamin doesn't exist, create it
        if (!penjaminId) {
          const { data: newPenjamin, error: createError } = await supabase
            .from('penjamin')
            .insert([{ nama: formData.penjamin, tipe: formData.penjamin.toLowerCase() }])
            .select()
            .single();

          if (createError) {
            console.error('Error creating penjamin:', createError);
          } else {
            penjaminId = newPenjamin.id;
          }
        }

        // Insert patient_penjamin with specific fields based on type
        if (penjaminId) {
          const patientPenjaminData: any = {
            patient_id: patient.id,
            penjamin_id: penjaminId,
          };

          // Add type-specific fields
          if (formData.penjamin === 'BPJS') {
            patientPenjaminData.nomor_bpjs = formData.nomorBPJS;
          } else if (formData.penjamin === 'Asuransi') {
            patientPenjaminData.nama_asuransi = formData.namaAsuransi;
            patientPenjaminData.nomor_polis = formData.nomorAsuransi;
          } else if (formData.penjamin === 'Instansi') {
            // Map Instansi fields to available columns
            patientPenjaminData.nama_asuransi = formData.namaInstansi; // Store Instansi Name in nama_asuransi
            patientPenjaminData.nomor_polis = formData.nomorSurat;     // Store Surat Number in nomor_polis
          } else if (formData.penjamin === 'Jasa Raharja') {
            // Map Jasa Raharja fields to available columns
            patientPenjaminData.nomor_polis = formData.nomorPeserta;   // Store Peserta Number in nomor_polis
          }

          const { error: penjaminRelError } = await supabase
            .from('patient_penjamin')
            .insert([patientPenjaminData]);

          if (penjaminRelError) {
            console.error('Error saving patient penjamin:', penjaminRelError);
            // Don't fail the whole operation, patient is already saved
          }
        }
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat menyimpan data');
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push('/counter/patients');
  };

  return (
    <CounterLayout>
      <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="border border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-2xl text-gray-800">DATA PASIEN</CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* NRM */}
                    <div>
                      <Label htmlFor="nrm" className="text-sm font-medium">
                        NRM <span className="text-gray-500 text-xs">(Auto-generate)</span>
                      </Label>
                      <Input
                        id="nrm"
                        name="nrm"
                        value=""
                        readOnly
                        placeholder="Akan di-generate otomatis"
                        className="bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    {/* NIK */}
                    <div>
                      <Label htmlFor="nik" className="text-sm font-medium">
                        NIK
                      </Label>
                      <Input
                        id="nik"
                        name="nik"
                        value={formData.nik}
                        onChange={handleInputChange}
                        placeholder="Contoh: 3302245811240004"
                      />
                    </div>

                    {/* Nama Pasien */}
                    <div>
                      <Label htmlFor="nama" className="text-sm font-medium">
                        Nama Pasien
                      </Label>
                      <Input
                        id="nama"
                        name="nama"
                        value={formData.nama}
                        onChange={handleInputChange}
                        placeholder="Nama lengkap pasien"
                      />
                    </div>

                    {/* Tempat/Tgl. Lahir */}
                    <div>
                      <Label className="text-sm font-medium">Tempat/ Tgl. Lahir</Label>
                      <div className="flex space-x-2">
                        <Input
                          name="tempatLahir"
                          value={formData.tempatLahir}
                          onChange={handleInputChange}
                          placeholder="Contoh: Banyumas"
                          className="flex-1"
                        />
                        <Input
                          type="date"
                          name="tanggalLahir"
                          value={formData.tanggalLahir}
                          onChange={handleInputChange}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* Jenis Kelamin */}
                    <div>
                      <Label className="text-sm font-medium mb-2">Jenis Kelamin</Label>
                      <div className="flex space-x-6">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="jenisKelamin"
                            value="L"
                            checked={formData.jenisKelamin === 'L'}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="ml-2 text-sm text-gray-700">Laki - laki</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="jenisKelamin"
                            value="P"
                            checked={formData.jenisKelamin === 'P'}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="ml-2 text-sm text-gray-700">Perempuan</span>
                        </label>
                      </div>
                    </div>

                    {/* Pekerjaan */}
                    <div>
                      <Label htmlFor="pekerjaan" className="text-sm font-medium">
                        Pekerjaan
                      </Label>
                      <Input
                        id="pekerjaan"
                        name="pekerjaan"
                        value={formData.pekerjaan}
                        onChange={handleInputChange}
                        placeholder="Dokter"
                      />
                    </div>

                    {/* Golongan Darah */}
                    <div>
                      <Label htmlFor="golonganDarah" className="text-sm font-medium">
                        Golongan Darah
                      </Label>
                      <select
                        id="golonganDarah"
                        value={formData.golonganDarah}
                        onChange={(e) => handleSelectChange('golonganDarah', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Pilih golongan darah</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="AB">AB</option>
                        <option value="O">O</option>
                      </select>
                    </div>

                    {/* Penanggung Jawab */}
                    <div>
                      <Label htmlFor="penanggungJawab" className="text-sm font-medium">
                        Penanggung Jawab
                      </Label>
                      <select
                        id="penanggungJawab"
                        value={formData.penanggungJawab}
                        onChange={(e) => handleSelectChange('penanggungJawab', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Pilih penanggung jawab</option>
                        <option value="Anak">Anak</option>
                        <option value="Orang Tua">Orang Tua</option>
                        <option value="Suami/Istri">Suami/Istri</option>
                        <option value="Saudara">Saudara</option>
                        <option value="Diri Sendiri">Diri Sendiri</option>
                      </select>
                    </div>

                    {/* Nama PJ */}
                    <div>
                      <Label htmlFor="namaPJ" className="text-sm font-medium">
                        Nama PJ
                      </Label>
                      <Input
                        id="namaPJ"
                        name="namaPJ"
                        value={formData.namaPJ}
                        onChange={handleInputChange}
                        placeholder="Nama Penanggung Jawab"
                      />
                    </div>

                    {/* Pekerjaan PJ */}
                    <div>
                      <Label htmlFor="pekerjaanPJ" className="text-sm font-medium">
                        Pekerjaan PJ
                      </Label>
                      <Input
                        id="pekerjaanPJ"
                        name="pekerjaanPJ"
                        value={formData.pekerjaanPJ}
                        onChange={handleInputChange}
                        placeholder="Pekerjaan Penanggung Jawab"
                      />
                    </div>

                    {/* No. Telp PJ */}
                    <div>
                      <Label htmlFor="noTelpPJ" className="text-sm font-medium">
                        No. Telp PJ
                      </Label>
                      <Input
                        id="noTelpPJ"
                        name="noTelpPJ"
                        value={formData.noTelpPJ}
                        onChange={handleInputChange}
                        placeholder="Contoh: 089276256345"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Alamat */}
                    <div>
                      <Label htmlFor="alamat" className="text-sm font-medium">
                        Alamat
                      </Label>
                      <Textarea
                        id="alamat"
                        name="alamat"
                        value={formData.alamat}
                        onChange={handleInputChange}
                        placeholder="Alamat lengkap pasien"
                        rows={3}
                      />
                    </div>

                    {/* Provinsi & Kabupaten */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="provinsi" className="text-sm font-medium">
                          Provinsi
                        </Label>
                        <select
                          id="provinsi"
                          value={formData.provinsi}
                          onChange={(e) => handleSelectChange('provinsi', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Pilih provinsi</option>
                          {provinces.map((prov) => (
                            <option key={prov.code} value={prov.code}>
                              {prov.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="kabupaten" className="text-sm font-medium">
                          Kabupaten/Kota
                        </Label>
                        <select
                          id="kabupaten"
                          value={formData.kabupaten}
                          onChange={(e) => handleSelectChange('kabupaten', e.target.value)}
                          disabled={!formData.provinsi}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="">Pilih kabupaten/kota</option>
                          {cities.map((city) => (
                            <option key={city.code} value={city.code}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Kecamatan & Desa */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="kecamatan" className="text-sm font-medium">
                          Kecamatan
                        </Label>
                        <select
                          id="kecamatan"
                          value={formData.kecamatan}
                          onChange={(e) => handleSelectChange('kecamatan', e.target.value)}
                          disabled={!formData.kabupaten}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="">Pilih kecamatan</option>
                          {districts.map((district) => (
                            <option key={district.code} value={district.code}>
                              {district.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="desa" className="text-sm font-medium">
                          Desa/Kelurahan
                        </Label>
                        <select
                          id="desa"
                          value={formData.desa}
                          onChange={(e) => handleSelectChange('desa', e.target.value)}
                          disabled={!formData.kecamatan}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="">Pilih desa/kelurahan</option>
                          {villages.map((village) => (
                            <option key={village.code} value={village.code}>
                              {village.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Kode Pos */}
                    <div>
                      <Label htmlFor="kodePos" className="text-sm font-medium">
                        Kode Pos
                      </Label>
                      <Input
                        id="kodePos"
                        name="kodePos"
                        value={formData.kodePos}
                        onChange={handleInputChange}
                        placeholder="53182"
                      />
                    </div>

                    {/* Penjamin */}
                    <div>
                      <Label htmlFor="penjamin" className="text-sm font-medium">
                        Penjamin
                      </Label>
                      <select
                        id="penjamin"
                        value={formData.penjamin}
                        onChange={(e) => handlePenjaminChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Pilih Penjamin</option>
                        <option value="UMUM">UMUM</option>
                        <option value="BPJS">BPJS</option>
                        <option value="Asuransi">Asuransi</option>
                        <option value="Instansi">Instansi</option>
                        <option value="Jasa Raharja">Jasa Raharja</option>
                      </select>
                    </div>

                    {/* BPJS Fields */}
                    {penjaminType === 'BPJS' && (
                      <div>
                        <Label htmlFor="nomorBPJS" className="text-sm font-medium">
                          Nomor BPJS
                        </Label>
                        <Input
                          id="nomorBPJS"
                          name="nomorBPJS"
                          value={formData.nomorBPJS}
                          onChange={handleInputChange}
                          placeholder="Masukkan No. BPJS"
                        />
                      </div>
                    )}

                    {/* Asuransi Fields */}
                    {penjaminType === 'Asuransi' && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="namaAsuransi" className="text-sm font-medium">
                            Nama Asuransi
                          </Label>
                          <Input
                            id="namaAsuransi"
                            name="namaAsuransi"
                            value={formData.namaAsuransi}
                            onChange={handleInputChange}
                            placeholder="Masukkan Nama Asuransi"
                          />
                        </div>
                        <div>
                          <Label htmlFor="nomorAsuransi" className="text-sm font-medium">
                            Nomor Asuransi
                          </Label>
                          <Input
                            id="nomorAsuransi"
                            name="nomorAsuransi"
                            value={formData.nomorAsuransi}
                            onChange={handleInputChange}
                            placeholder="Masukkan Nomor Asuransi"
                          />
                        </div>
                      </div>
                    )}

                    {/* Instansi Fields */}
                    {penjaminType === 'Instansi' && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="namaInstansi" className="text-sm font-medium">
                            Nama Instansi
                          </Label>
                          <Input
                            id="namaInstansi"
                            name="namaInstansi"
                            value={formData.namaInstansi}
                            onChange={handleInputChange}
                            placeholder="Masukkan Nama Instansi"
                          />
                        </div>
                        <div>
                          <Label htmlFor="nomorSurat" className="text-sm font-medium">
                            Nomor Surat Penjamin
                          </Label>
                          <Input
                            id="nomorSurat"
                            name="nomorSurat"
                            value={formData.nomorSurat}
                            onChange={handleInputChange}
                            placeholder="Masukkan Nomor Surat"
                          />
                        </div>
                      </div>
                    )}

                    {/* Jasa Raharja Fields */}
                    {penjaminType === 'Jasa Raharja' && (
                      <div>
                        <Label htmlFor="nomorPeserta" className="text-sm font-medium">
                          Nomor Peserta
                        </Label>
                        <Input
                          id="nomorPeserta"
                          name="nomorPeserta"
                          value={formData.nomorPeserta}
                          onChange={handleInputChange}
                          placeholder="Masukkan Nomor Peserta"
                        />
                      </div>
                    )}

                    {/* Cara Masuk */}
                    <div>
                      <Label htmlFor="caraMasuk" className="text-sm font-medium">
                        Cara Masuk
                      </Label>
                      <select
                        id="caraMasuk"
                        value={formData.caraMasuk}
                        onChange={(e) => handleSelectChange('caraMasuk', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Pilih cara masuk</option>
                        <option value="Rujukan">Rujukan</option>
                        <option value="Datang Sendiri">Non Rujukan</option>
                      </select>
                    </div>

                    {/* No. Rujukan */}
                    <div>
                      <Label htmlFor="noRujukan" className="text-sm font-medium">
                        No. Rujukan
                      </Label>
                      <Input
                        id="noRujukan"
                        name="noRujukan"
                        value={formData.noRujukan}
                        onChange={handleInputChange}
                        placeholder="Contoh: 1234567890123"
                      />
                    </div>

                    {/* Catatan Khusus */}
                    <div>
                      <Label htmlFor="catatanKhusus" className="text-sm font-medium">
                        Catatan Khusus
                      </Label>
                      <Textarea
                        id="catatanKhusus"
                        name="catatanKhusus"
                        value={formData.catatanKhusus}
                        onChange={handleInputChange}
                        placeholder="Catatan khusus mengenai pasien..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="px-6 py-2"
                  >
                    Kembali
                  </Button>
                  <Button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Tambah Pasien
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center shadow-lg">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Data Berhasil Disimpan!</h2>
              <p className="text-sm text-gray-500 mt-1">Kembali ke halaman utama untuk melihat detail pasien</p>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={handleSuccessClose}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Oke
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CounterLayout>
  );
}
