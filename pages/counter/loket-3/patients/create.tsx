'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CounterLayout } from '@/components/layout/CounterLayout';
import { LoketLayout } from '@/components/layout/LoketLayout';
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
import { ArrowLeft } from 'lucide-react';

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
  const { returnTo } = router.query;
  
  // Determine if accessed from loket (has returnTo with loket path)
  const isFromLoket = returnTo && (returnTo as string).includes('/loket-');
  const loketId = isFromLoket ? parseInt((returnTo as string).match(/loket-(\d+)/)?.[1] || '1') : null;
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newPatient, setNewPatient] = useState<any>(null);
  const [penjaminType, setPenjaminType] = useState('');

  // Location data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    nrm: '', // Will be auto-generated
    nik: '',
    nama: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: '',
    pekerjaan: '',
    noTelp: '',
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
    nomorPolis: '',
    caraMasuk: '',
    noRujukan: '',
    catatanKhusus: '',
  });

  // Generate NRM on mount
  useEffect(() => {
    const generateNRM = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        
        // Get current year and month
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const yearMonth = `${year}${month}`; // YYYYMM
        
        // Count patients with NRM starting with current YYYYMM
        const { data: existingPatients, error } = await supabase
          .from('patients')
          .select('nrm')
          .like('nrm', `${yearMonth}%`)
          .order('nrm', { ascending: false })
          .limit(1);
        
        if (error) {
          console.error('Error counting patients:', error);
        }
        
        // Get next sequence number
        let sequence = 1;
        if (existingPatients && existingPatients.length > 0) {
          const lastNRM = existingPatients[0].nrm;
          const lastSequence = parseInt(lastNRM.slice(-4));
          sequence = lastSequence + 1;
        }
        
        // Generate NRM: YYYYMM0001
        const nrm = `${yearMonth}${String(sequence).padStart(4, '0')}`;
        
        setFormData(prev => ({ ...prev, nrm }));
      } catch (error) {
        console.error('Error generating NRM:', error);
      }
    };
    
    generateNRM();
  }, []);

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
        nrm: formData.nrm, // Auto-generated NRM
        nik: formData.nik,
        nama: formData.nama,
        tempat_lahir: formData.tempatLahir,
        tanggal_lahir: formData.tanggalLahir,
        jenis_kelamin: formData.jenisKelamin,
        pekerjaan: formData.pekerjaan,
        no_telp: formData.noTelp,
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
          } else {
            // Asuransi, Instansi, Jasa Raharja all use same columns
            patientPenjaminData.nama_asuransi = formData.namaAsuransi;
            patientPenjaminData.nomor_polis = formData.nomorPolis;
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

      setNewPatient(patient);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat menyimpan data');
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    // Redirect to returnTo if provided, otherwise to /counter/patients
    router.push(returnTo as string || '/counter/patients');
  };

  const handleAddVisit = () => {
    setShowSuccessModal(false);
    // If coming from loket, stay on the same page and open visit modal
    if (returnTo && (returnTo as string).includes('/loket-')) {
      router.push({
        pathname: returnTo as string,
        query: {
          patientId: newPatient?.id,
          openVisitModal: 'true'
        }
      });
    } else {
      // Otherwise, go to counter page
      const redirectUrl = returnTo as string || '/counter';
      router.push({
        pathname: redirectUrl.split('?')[0].replace('/patients', ''),
        query: {
          patientId: newPatient?.id,
          openVisitModal: 'true'
        }
      });
    }
  };

  // Conditional layout wrapper
  const renderContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-blue-600 uppercase">Tambah Data Pasien</h1>
        <p className="text-gray-600 mt-1">Daftarkan pasien baru</p>
      </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">INFORMASI PASIEN</CardTitle>
          </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Personal Information & Penanggung Jawab */}
                  <div className="space-y-6">
                    {/* Personal Info Section */}
                    <div className="space-y-4">
                      {/* NRM */}
                      <div>
                        <Label htmlFor="nrm" className="text-sm font-medium">
                          NRM <span className="text-gray-500 text-xs">(Auto-generate)</span>
                        </Label>
                        <Input
                          id="nrm"
                          name="nrm"
                          value={formData.nrm}
                          readOnly
                          placeholder="Akan di-generate otomatis"
                          className="bg-gray-100 text-gray-700 cursor-not-allowed font-medium"
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
                          Nama Pasien <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nama"
                          name="nama"
                          value={formData.nama}
                          onChange={handleInputChange}
                          placeholder="Nama lengkap pasien"
                          required
                        />
                      </div>

                      {/* Tempat/Tgl. Lahir */}
                      <div>
                        <Label className="text-sm font-medium">Tempat / Tanggal Lahir</Label>
                        <div className="flex gap-2">
                          <Input
                            name="tempatLahir"
                            value={formData.tempatLahir}
                            onChange={handleInputChange}
                            placeholder="Tempat Lahir"
                            className="flex-1"
                          />
                          <Input
                            type="date"
                            name="tanggalLahir"
                            value={formData.tanggalLahir}
                            onChange={handleInputChange}
                            className="w-40"
                          />
                        </div>
                      </div>

                      {/* Jenis Kelamin */}
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">Jenis Kelamin</Label>
                        <div className="flex gap-6">
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
                          placeholder="Pekerjaan pasien"
                        />
                      </div>

                      {/* No. Telepon Pasien */}
                      <div>
                        <Label htmlFor="noTelp" className="text-sm font-medium">
                          No. Telepon Pasien
                        </Label>
                        <Input
                          id="noTelp"
                          name="noTelp"
                          value={formData.noTelp}
                          onChange={handleInputChange}
                          placeholder="Contoh: 0812xxxxxx"
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
                          <option value="-">-</option>
                        </select>
                      </div>
                    </div>

                    {/* Divider for PJ */}
                    <div className="pt-4 border-t border-gray-100">
                      <h3 className="text-sm font-semibold text-blue-600 uppercase mb-4">
                        Data Penanggung Jawab
                      </h3>
                      
                      <div className="space-y-4">
                         {/* Penanggung Jawab Role */}
                        <div>
                          <Label htmlFor="penanggungJawab" className="text-sm font-medium">
                            Hubungan dengan Pasien
                          </Label>
                          <select
                            id="penanggungJawab"
                            value={formData.penanggungJawab}
                            onChange={(e) => handleSelectChange('penanggungJawab', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Pilih hubungan</option>
                            <option value="Anak">Anak</option>
                            <option value="Orang Tua">Orang Tua</option>
                            <option value="Suami/Istri">Suami/Istri</option>
                            <option value="Saudara">Saudara</option>
                            <option value="Diri Sendiri">Diri Sendiri</option>
                            <option value="Lainnya">Lainnya</option>
                          </select>
                        </div>

                        {/* Nama PJ */}
                        <div>
                          <Label htmlFor="namaPJ" className="text-sm font-medium">
                            Nama Penanggung Jawab
                          </Label>
                          <Input
                            id="namaPJ"
                            name="namaPJ"
                            value={formData.namaPJ}
                            onChange={handleInputChange}
                            placeholder="Nama lengkap PJ"
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
                            placeholder="Pekerjaan PJ"
                          />
                        </div>

                        {/* No. Telp PJ */}
                        <div>
                          <Label htmlFor="noTelpPJ" className="text-sm font-medium">
                            No. Telepon PJ
                          </Label>
                          <Input
                            id="noTelpPJ"
                            name="noTelpPJ"
                            value={formData.noTelpPJ}
                            onChange={handleInputChange}
                            placeholder="Contoh: 0812xxxxxx"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Address & Penjamin */}
                  <div className="space-y-6">
                    {/* Address Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-blue-600 uppercase mb-4">
                        Alamat
                      </h3>
                      
                      {/* Alamat */}
                      <div>
                        <Label htmlFor="alamat" className="text-sm font-medium">
                          Alamat Lengkap
                        </Label>
                        <Textarea
                          id="alamat"
                          name="alamat"
                          value={formData.alamat}
                          onChange={handleInputChange}
                          placeholder="Jalan, RT/RW, Dusun"
                          rows={3}
                        />
                      </div>

                      {/* Region Rows */}
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
                            <option value="">Pilih kabupaten</option>
                            {cities.map((city) => (
                              <option key={city.code} value={city.code}>
                                {city.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

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
                            <option value="">Pilih desa</option>
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
                          placeholder="Contoh: 53182"
                        />
                      </div>
                    </div>

                    {/* Divider for Penjamin */}
                    <div className="pt-4 border-t border-gray-100">
                      <h3 className="text-sm font-semibold text-blue-600 uppercase mb-4">
                        Data Penjamin
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Penjamin Select */}
                        <div>
                          <Label htmlFor="penjamin" className="text-sm font-medium">
                            Jenis Penjamin
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
                          </select>
                        </div>

                        {/* BPJS Fields */}
                        {penjaminType === 'BPJS' && (
                          <div>
                            <Label htmlFor="nomorBPJS" className="text-sm font-medium">
                              Nomor Cartu BPJS
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
                                placeholder="Nama Asuransi"
                              />
                            </div>
                            <div>
                              <Label htmlFor="nomorAsuransi" className="text-sm font-medium">
                                Nomor Polis
                              </Label>
                              <Input
                                id="nomorPolis"
                                name="nomorPolis"
                                value={formData.nomorPolis}
                                onChange={handleInputChange}
                                placeholder="Nomor Polis Asuransi"
                              />
                            </div>
                          </div>
                        )}

                        {/* Cara Masuk Section */}
                         <div className="border-t border-gray-100 pt-4 mt-4">
                           <Label htmlFor="caraMasuk" className="text-sm font-medium mb-1 block">
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
                        {formData.caraMasuk === 'Rujukan' && (
                          <div>
                            <Label htmlFor="noRujukan" className="text-sm font-medium">
                              No. Rujukan
                            </Label>
                            <Input
                              id="noRujukan"
                              name="noRujukan"
                              value={formData.noRujukan}
                              onChange={handleInputChange}
                              placeholder="Nomor Rujukan"
                            />
                          </div>
                        )}

                        {/* Catatan Khusus */}
                        <div className="border-t border-gray-100 pt-4 mt-4">
                          <Label htmlFor="catatanKhusus" className="text-sm font-medium mb-1 block">
                            Catatan Khusus (Alergi, Riwayat Penyakit, dll)
                          </Label>
                          <Textarea
                            id="catatanKhusus"
                            name="catatanKhusus"
                            value={formData.catatanKhusus}
                            onChange={handleInputChange}
                            placeholder="Tuliskan catatan khusus medis jika ada..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 lg:col-span-2 pt-6 border-t">
                  <Button
                    type="button"
                    onClick={() => router.push('/counter/patients')}
                    className="px-6 bg-red-500 hover:bg-red-600 text-white"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="px-6 bg-blue-600 hover:bg-blue-700"
                  >
                    Simpan Pasien Baru
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-full max-w-md text-center shadow-lg">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-600"
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
              <h2 className="text-xl font-bold text-gray-900">Pasien Berhasil Ditambahkan!</h2>
              <p className="text-sm text-gray-600 mt-2 mb-1">NRM: <span className="font-semibold text-blue-600">{newPatient?.nrm}</span></p>
              <p className="text-sm text-gray-600">Nama: <span className="font-semibold">{newPatient?.nama}</span></p>
              
              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleAddVisit}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Kunjungan Sekarang
                </button>
                <button
                  onClick={handleSuccessClose}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors"
                >
                  Tutup
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">Anda dapat menambahkan kunjungan nanti dari halaman counter</p>
            </div>
          </div>
        )}
      </div>
    );

  // Render with appropriate layout
  if (isFromLoket && loketId) {
    return <LoketLayout loketId={loketId}>{renderContent()}</LoketLayout>;
  }
  
  return <CounterLayout>{renderContent()}</CounterLayout>;
}
