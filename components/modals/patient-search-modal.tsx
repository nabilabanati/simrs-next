import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, X, Plus, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PatientSearchModalProps {
  onClose: () => void;
  onPatientSelected: (patient: any) => void;
  onCreateNew: () => void;
}

export default function PatientSearchModal({ 
  onClose, 
  onPatientSelected, 
  onCreateNew 
}: PatientSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  const fetchVisits = async (patientId: string) => {
    setLoadingVisits(true);
    try {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          poli(nama),
          doctors(id, user_id),
          payment_methods:penjamin_id(nama)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching visits:', error);
        return;
      }

      // Get doctor names
      const doctorUserIds = [...new Set(
        (data || []).map(v => v.doctors?.user_id).filter(Boolean)
      )];

      let userNameMap = new Map();
      if (doctorUserIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, nama')
          .in('id', doctorUserIds);

        if (usersData) {
          userNameMap = new Map(usersData.map(u => [u.id, u.nama]));
        }
      }

      const visitsWithDoctors = (data || []).map(visit => ({
        ...visit,
        doctor_name: visit.doctors?.user_id 
          ? userNameMap.get(visit.doctors.user_id) || '-'
          : '-'
      }));

      setVisits(visitsWithDoctors);
    } catch (err) {
      console.error('Error fetching visits:', err);
    } finally {
      setLoadingVisits(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Masukkan NRM atau NIK');
      return;
    }

    setSearching(true);
    setNotFound(false);
    setError('');
    setSearchResult(null);
    setVisits([]);

    try {
      const { data, error: searchError } = await supabase
        .from('patients')
        .select('*')
        .or(`nrm.eq.${searchQuery.trim()},nik.eq.${searchQuery.trim()}`)
        .maybeSingle();

      if (searchError) {
        console.error('Search error:', searchError);
        setError('Terjadi kesalahan saat mencari pasien');
        return;
      }

      if (!data) {
        setNotFound(true);
        setSearchResult(null);
      } else {
        setSearchResult(data);
        setNotFound(false);
        // Fetch visit history
        await fetchVisits(data.id);
      }
    } catch (err: any) {
      console.error('Search exception:', err);
      setError('Terjadi kesalahan saat mencari pasien');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-bottom-5">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-lg font-semibold uppercase">Cari Data Pasien</h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quick Action - Direct Patient Creation */}
          <div className="mb-6">
            <Button 
              onClick={onCreateNew}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Tambah Pasien Baru Langsung
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500 font-medium">atau cari pasien lama</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari Pasien Berdasarkan NRM atau NIK
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Masukkan NRM atau NIK"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setError('');
                    setNotFound(false);
                  }}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={searching}
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={searching}
                className="px-6 bg-green-600 hover:bg-green-700"
              >
                {searching ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Mencari...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Cari
                  </>
                )}
              </Button>
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>

          {/* Search Result - Patient Found */}
          {searchResult && (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-5 mb-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">✓</span>
                </div>
                <h4 className="font-bold text-green-800 text-lg">Pasien Ditemukan</h4>
              </div>
              
              {/* Patient Info */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">NRM:</span>
                    <p className="font-semibold text-gray-900">{searchResult.nrm}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">NIK:</span>
                    <p className="font-semibold text-gray-900">{searchResult.nik}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Nama Lengkap:</span>
                    <p className="font-semibold text-gray-900">{searchResult.nama}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Jenis Kelamin:</span>
                    <p className="font-semibold text-gray-900">
                      {searchResult.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Tanggal Lahir:</span>
                    <p className="font-semibold text-gray-900">
                      {searchResult.tanggal_lahir 
                        ? new Date(searchResult.tanggal_lahir).toLocaleDateString('id-ID')
                        : '-'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Umur:</span>
                    <p className="font-semibold text-gray-900">
                      {searchResult.tanggal_lahir 
                        ? `${new Date().getFullYear() - new Date(searchResult.tanggal_lahir).getFullYear()} tahun`
                        : '-'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Visit History */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Riwayat Kunjungan (5 Terakhir)
                  </h5>
                </div>
                
                {loadingVisits ? (
                  <p className="text-center py-4 text-gray-500">Memuat riwayat...</p>
                ) : visits.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">Belum ada riwayat kunjungan</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {visits.map((visit, index) => (
                      <div key={visit.id} className="border border-gray-200 rounded p-3 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-semibold text-blue-600">
                            Kunjungan #{visit.kunjungan_ke || index + 1}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(visit.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Poli:</span>
                            <span className="ml-1 font-medium">{visit.poli?.nama || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Dokter:</span>
                            <span className="ml-1 font-medium">{visit.doctor_name}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600">Keluhan:</span>
                            <span className="ml-1">{visit.keluhan || '-'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <Button 
                onClick={() => onPatientSelected(searchResult)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Tambah Kunjungan Baru
              </Button>
            </div>
          )}

          {/* Search Result - Not Found */}
          {notFound && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5 mb-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">!</span>
                </div>
                <h4 className="font-bold text-yellow-800 text-lg">Pasien Tidak Ditemukan</h4>
              </div>
              
              <p className="text-yellow-700 mb-4">
                Tidak ada pasien dengan NRM atau NIK <strong>"{searchQuery}"</strong> dalam database.
              </p>

              <Button 
                onClick={onCreateNew}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Daftar Pasien Baru
              </Button>
            </div>
          )}

          {/* Initial State - No Search Yet */}
          {!searchResult && !notFound && !searching && (
            <div className="text-center py-12 text-gray-400">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Masukkan NRM atau NIK untuk mencari data pasien</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3 border-t sticky bottom-0">
          <Button 
            onClick={onClose} 
            variant="outline"
            className="px-6"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
