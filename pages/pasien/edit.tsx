'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
import {
  fetchProvinces,
  fetchCitiesByProvince,
  fetchDistrictsByCity,
  fetchVillagesByDistrict,
} from '@/lib/api-client';
import type { Province } from '@/pages/api/provinces';
import type { City } from '@/pages/api/cities';
import type { District } from '@/pages/api/districts';
import type { Village } from '@/pages/api/villages';
import { MASTER_PATIENTS } from '@/lib/dummy/master/patients';
import type { PatientData } from '@/lib/shared/types/patient';

export default function EditPatientPage() {
  const router = useRouter();
  const { nrm } = router.query;
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [penjaminType, setPenjaminType] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Location data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    nrm: '',
    nik: '',
    nama: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: '',
    pekerjaan: '',
    golonganDarah: '',
    statusNikah: '',
    penanggungJawab: '',
    namaPJ: '',
    pekerjaanPJ: '',
    noTelpPJ: '',
    alamat: '',
    provinsi: '',
    kabupaten: '',
    kecamatan: '',
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

  // Load patient data and provinces on mount
  useEffect(() => {
    const loadData = async () => {
      if (!nrm) return;

      // Load provinces
      const provincesData = await fetchProvinces();
      setProvinces(provincesData);

      // Load patient data from master
      const patient = MASTER_PATIENTS.find((p) => p.nrm === nrm);
      if (patient) {
        const patientData = patient as PatientData & {
          statusNikah?: string;
          provinsi?: string;
          kabupaten?: string;
          kecamatan?: string;
          kodePos?: string;
        };

        setFormData({
          nrm: patientData.nrm,
          nik: patientData.nik,
          nama: patientData.nama,
          tempatLahir: patientData.tempatLahir,
          tanggalLahir: patientData.tanggalLahir,
          jenisKelamin: patientData.jenisKelamin,
          pekerjaan: patientData.pekerjaan,
          golonganDarah: patientData.golonganDarah || '',
          statusNikah: patientData.statusNikah || '',
          penanggungJawab: patientData.penanggungJawab,
          namaPJ: patientData.namaPJ,
          pekerjaanPJ: patientData.pekerjaanPJ || '',
          noTelpPJ: patientData.noTelpPJ || '',
          alamat: patientData.alamat,
          provinsi: patientData.provinsi || '',
          kabupaten: patientData.kabupaten || '',
          kecamatan: patientData.kecamatan || '',
          kodePos: patientData.kodePos || '',
          penjamin: patientData.penjamin,
          nomorBPJS: '',
          namaAsuransi: '',
          nomorAsuransi: '',
          namaInstansi: patientData.nama_instansi || '',
          nomorSurat: patientData.nomor_surat || '',
          nomorPeserta: '',
          caraMasuk: '',
          noRujukan: patientData.noRujukan || '',
          catatanKhusus: patientData.catatanKhusus || '',
        });

        setPenjaminType(patientData.penjamin);
      }

      setIsLoading(false);
    };

    loadData();
  }, [nrm]);

  // Load cities when province changes
  useEffect(() => {
    if (formData.provinsi) {
      const loadCities = async () => {
        const data = await fetchCitiesByProvince(formData.provinsi);
        setCities(data);
        setFormData((prev) => ({ ...prev, kabupaten: '', kecamatan: '', kodePos: '' }));
        setDistricts([]);
        setVillages([]);
      };
      loadCities();
    }
  }, [formData.provinsi]);

  // Load districts when city changes
  useEffect(() => {
    if (formData.kabupaten) {
      const loadDistricts = async () => {
        const data = await fetchDistrictsByCity(formData.kabupaten);
        setDistricts(data);
        setFormData((prev) => ({ ...prev, kecamatan: '', kodePos: '' }));
        setVillages([]);
      };
      loadDistricts();
    }
  }, [formData.kabupaten]);

  // Load villages when district changes
  useEffect(() => {
    if (formData.kecamatan) {
      const loadVillages = async () => {
        const data = await fetchVillagesByDistrict(formData.kecamatan);
        setVillages(data);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dataPasien = {
      id: nrm,
      nrm: formData.nrm,
      nik: formData.nik,
      nama: formData.nama,
      tempatLahir: formData.tempatLahir,
      tanggalLahir: formData.tanggalLahir,
      jenisKelamin: formData.jenisKelamin,
      pekerjaan: formData.pekerjaan,
      golonganDarah: formData.golonganDarah,
      statusNikah: formData.statusNikah,
      penanggungJawab: formData.penanggungJawab,
      namaPJ: formData.namaPJ,
      pekerjaanPJ: formData.pekerjaanPJ,
      noTelpPJ: formData.noTelpPJ,
      alamat: formData.alamat,
      provinsi: formData.provinsi,
      kabupaten: formData.kabupaten,
      kecamatan: formData.kecamatan,
      kodePos: formData.kodePos,
      penjamin: formData.penjamin,
      catatanKhusus: formData.catatanKhusus,
    };

    // Add penjamin-specific data
    if (formData.penjamin === 'BPJS') {
      Object.assign(dataPasien, { nomorBPJS: formData.nomorBPJS });
    } else if (formData.penjamin === 'Asuransi') {
      Object.assign(dataPasien, {
        namaAsuransi: formData.namaAsuransi,
        nomorAsuransi: formData.nomorAsuransi,
      });
    } else if (formData.penjamin === 'Instansi') {
      Object.assign(dataPasien, {
        namaInstansi: formData.namaInstansi,
        nomorSurat: formData.nomorSurat,
      });
    } else if (formData.penjamin === 'Jasa Raharja') {
      Object.assign(dataPasien, { nomorPeserta: formData.nomorPeserta });
    }

    // Get existing data from localStorage
    const existingData = JSON.parse(localStorage.getItem('dataPasienList') || '[]');
    const updateIndex = existingData.findIndex((p: any) => p.nrm === nrm);

    if (updateIndex >= 0) {
      existingData[updateIndex] = dataPasien;
    } else {
      existingData.push(dataPasien);
    }

    localStorage.setItem('dataPasienList', JSON.stringify(existingData));
    setShowSuccessModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push('/pasien');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-6 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        <Card className="border border-gray-200">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-2xl text-gray-800">EDIT DATA PASIEN</CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* NRM */}
                  <div>
                    <Label htmlFor="nrm" className="text-sm font-medium">
                      NRM
                    </Label>
                    <Input
                      id="nrm"
                      name="nrm"
                      value={formData.nrm}
                      readOnly
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
                    <Label className="text-sm font-medium mb-2">Golongan Darah</Label>
                    <select
                      name="golonganDarah"
                      value={formData.golonganDarah}
                      onChange={(e) => handleSelectChange('golonganDarah', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih Golongan Darah</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                  </div>

                  {/* Status Nikah */}
                  <div>
                    <Label className="text-sm font-medium mb-2">Status Nikah</Label>
                    <select
                      name="statusNikah"
                      value={formData.statusNikah}
                      onChange={(e) => handleSelectChange('statusNikah', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih Status Nikah</option>
                      <option value="Belum Menikah">Belum Menikah</option>
                      <option value="Menikah">Menikah</option>
                      <option value="Cerai Hidup">Cerai Hidup</option>
                      <option value="Cerai Mati">Cerai Mati</option>
                    </select>
                  </div>

                  {/* Penanggung Jawab */}
                  <div>
                    <Label className="text-sm font-medium mb-2">Penanggung Jawab</Label>
                    <select
                      name="penanggungJawab"
                      value={formData.penanggungJawab}
                      onChange={(e) => handleSelectChange('penanggungJawab', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih Penanggung Jawab</option>
                      <option value="Ayah">Ayah</option>
                      <option value="Ibu">Ibu</option>
                      <option value="Suami">Suami</option>
                      <option value="Istri">Istri</option>
                      <option value="Anak">Anak</option>
                      <option value="Saudara">Saudara</option>
                      <option value="Orang Tua">Orang Tua</option>
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
                      placeholder="Nama penanggung jawab"
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
                      placeholder="Pekerjaan penanggung jawab"
                    />
                  </div>

                  {/* No Telp PJ */}
                  <div>
                    <Label htmlFor="noTelpPJ" className="text-sm font-medium">
                      No Telp PJ
                    </Label>
                    <Input
                      id="noTelpPJ"
                      name="noTelpPJ"
                      value={formData.noTelpPJ}
                      onChange={handleInputChange}
                      placeholder="08123456789"
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
                      className="resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Provinsi */}
                  <div>
                    <Label className="text-sm font-medium mb-2">Provinsi</Label>
                    <select
                      name="provinsi"
                      value={formData.provinsi}
                      onChange={(e) => handleSelectChange('provinsi', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih Provinsi</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kabupaten */}
                  <div>
                    <Label className="text-sm font-medium mb-2">Kabupaten</Label>
                    <select
                      name="kabupaten"
                      value={formData.kabupaten}
                      onChange={(e) => handleSelectChange('kabupaten', e.target.value)}
                      disabled={!formData.provinsi}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Pilih Kabupaten</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kecamatan */}
                  <div>
                    <Label className="text-sm font-medium mb-2">Kecamatan</Label>
                    <select
                      name="kecamatan"
                      value={formData.kecamatan}
                      onChange={(e) => handleSelectChange('kecamatan', e.target.value)}
                      disabled={!formData.kabupaten}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Pilih Kecamatan</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
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
                      placeholder="50000"
                    />
                  </div>

                  {/* Penjamin */}
                  <div>
                    <Label className="text-sm font-medium mb-2">Penjamin</Label>
                    <select
                      value={formData.penjamin}
                      onChange={(e) => handlePenjaminChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih Penjamin</option>
                      <option value="Umum">Umum</option>
                      <option value="BPJS">BPJS</option>
                      <option value="Asuransi">Asuransi</option>
                      <option value="Jamkesda">Jamkesda</option>
                      <option value="Jasa Raharja">Jasa Raharja</option>
                    </select>
                  </div>

                  {/* Penjamin-specific fields */}
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
                        placeholder="Nomor BPJS"
                      />
                    </div>
                  )}

                  {penjaminType === 'Asuransi' && (
                    <>
                      <div>
                        <Label htmlFor="namaAsuransi" className="text-sm font-medium">
                          Nama Asuransi
                        </Label>
                        <Input
                          id="namaAsuransi"
                          name="namaAsuransi"
                          value={formData.namaAsuransi}
                          onChange={handleInputChange}
                          placeholder="Nama asuransi"
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
                          placeholder="Nomor asuransi"
                        />
                      </div>
                    </>
                  )}

                  {penjaminType === 'Instansi' && (
                    <>
                      <div>
                        <Label htmlFor="namaInstansi" className="text-sm font-medium">
                          Nama Instansi
                        </Label>
                        <Input
                          id="namaInstansi"
                          name="namaInstansi"
                          value={formData.namaInstansi}
                          onChange={handleInputChange}
                          placeholder="Nama instansi"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nomorSurat" className="text-sm font-medium">
                          Nomor Surat
                        </Label>
                        <Input
                          id="nomorSurat"
                          name="nomorSurat"
                          value={formData.nomorSurat}
                          onChange={handleInputChange}
                          placeholder="Nomor surat"
                        />
                      </div>
                    </>
                  )}

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
                        placeholder="Nomor peserta"
                      />
                    </div>
                  )}

                  {/* Cara Masuk */}
                  <div>
                    <Label className="text-sm font-medium mb-2">Cara Masuk</Label>
                    <select
                      name="caraMasuk"
                      value={formData.caraMasuk}
                      onChange={(e) => handleSelectChange('caraMasuk', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih Cara Masuk</option>
                      <option value="Datang Sendiri">Datang Sendiri</option>
                      <option value="Rujukan">Rujukan</option>
                      <option value="Ambulans">Ambulans</option>
                    </select>
                  </div>

                  {/* No Rujukan */}
                  <div>
                    <Label htmlFor="noRujukan" className="text-sm font-medium">
                      No Rujukan
                    </Label>
                    <Input
                      id="noRujukan"
                      name="noRujukan"
                      value={formData.noRujukan}
                      onChange={handleInputChange}
                      placeholder="Nomor rujukan"
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
                      placeholder="Catatan khusus pasien"
                      className="resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/pasien')}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Data Pasien Berhasil Diubah</h2>
              <p className="text-sm text-gray-500 mt-1">Data pasien telah disimpan dengan sukses</p>
              <Button
                onClick={handleSuccessClose}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Kembali ke Data Pasien
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
