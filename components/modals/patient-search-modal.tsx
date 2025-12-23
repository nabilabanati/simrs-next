import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, X, Plus, Calendar, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PatientSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientSelected: (patient: any) => void;
  onCreateNew: () => void;
}

export default function PatientSearchModal({ 
  isOpen,
  onClose, 
  onPatientSelected, 
  onCreateNew 
}: PatientSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [visits, setVisits] = useState<{[key: string]: any[]}>({});
  const [searching, setSearching] = useState(false);
  const [loadingVisits, setLoadingVisits] = useState<{[key: string]: boolean}>({});
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  const fetchVisits = async (patientId: string) => {
    setLoadingVisits(prev => ({ ...prev, [patientId]: true }));
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

      setVisits(prev => ({ ...prev, [patientId]: visitsWithDoctors }));
    } catch (err) {
      console.error('Error fetching visits:', err);
    } finally {
      setLoadingVisits(prev => ({ ...prev, [patientId]: false }));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Masukkan NRM, NIK, atau Nama pasien');
      return;
    }

    setSearching(true);
    setNotFound(false);
    setError('');
    setSearchResults([]);
    setSelectedPatient(null);
    setVisits({});

    try {
      const query = searchQuery.trim();
      
      // First, try to search by NRM or NIK (exact match, case-insensitive)
      const { data: exactMatch, error: exactError } = await supabase
        .from('patients')
        .select('*')
        .or(`nrm.ilike.${query},nik.eq.${query}`)
        .limit(1)
        .maybeSingle();

      if (exactError && exactError.code !== 'PGRST116') {
        console.error('Exact search error:', exactError);
        setError('Terjadi kesalahan saat mencari pasien');
        setSearching(false);
        return;
      }

      // If found by NRM or NIK, directly select that patient
      if (exactMatch) {
        setSearchResults([exactMatch]);
        setSelectedPatient(exactMatch);
        setNotFound(false);
        await fetchVisits(exactMatch.id);
        setSearching(false);
        return;
      }

      // If not found by NRM/NIK, search by name
      const { data: nameMatches, error: nameError } = await supabase
        .from('patients')
        .select('*')
        .ilike('nama', `%${query}%`);

      if (nameError) {
        console.error('Name search error:', nameError);
        setError('Terjadi kesalahan saat mencari pasien');
        setSearching(false);
        return;
      }

      if (!nameMatches || nameMatches.length === 0) {
        setNotFound(true);
        setSearchResults([]);
      } else {
        setSearchResults(nameMatches);
        setNotFound(false);
        // Fetch visit history for all found patients
        nameMatches.forEach(patient => {
          fetchVisits(patient.id);
        });
        
        // If only one result found by name, auto-select it
        if (nameMatches.length === 1) {
          setSelectedPatient(nameMatches[0]);
        }
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

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
  };

  const handleConfirmPatient = () => {
    if (selectedPatient) {
      onPatientSelected(selectedPatient);
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-bottom-5">
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
              Tambah Pasien Baru
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
              Cari Pasien
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Masukkan NRM, NIK, atau Nama pasien"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setError('');
                    setNotFound(false);
                  }}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={searching}
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={searching}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700"
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

          {/* Search Results - Multiple Patients Found */}
          {searchResults.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">✓</span>
                </div>
                <h4 className="font-bold text-green-800 text-lg">
                  {searchResults.length} Pasien Ditemukan
                </h4>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {searchResults.map((patient) => (
                  <div 
                    key={patient.id}
                    className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                      selectedPatient?.id === patient.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                    onClick={() => handleSelectPatient(patient)}
                  >
                    {/* Patient Info */}
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        selectedPatient?.id === patient.id ? 'bg-blue-600' : 'bg-gray-200'
                      }`}>
                        <User className={`w-6 h-6 ${
                          selectedPatient?.id === patient.id ? 'text-white' : 'text-gray-500'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                          <div>
                            <span className="text-gray-600">NRM:</span>
                            <p className="font-semibold text-gray-900">{patient.nrm}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">NIK:</span>
                            <p className="font-semibold text-gray-900">{patient.nik}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Jenis Kelamin:</span>
                            <p className="font-semibold text-gray-900">
                              {patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600">Nama Lengkap:</span>
                            <p className="font-semibold text-gray-900 text-base">{patient.nama}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Umur:</span>
                            <p className="font-semibold text-gray-900">
                              {patient.tanggal_lahir 
                                ? `${new Date().getFullYear() - new Date(patient.tanggal_lahir).getFullYear()} tahun`
                                : '-'
                              }
                            </p>
                          </div>
                        </div>

                        {/* Visit History - Only show if selected */}
                        {selectedPatient?.id === patient.id && (
                          <div className="bg-white rounded-lg p-3 border border-gray-200 mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <h5 className="font-semibold text-gray-900 text-sm">
                                Riwayat Kunjungan (5 Terakhir)
                              </h5>
                            </div>
                            
                            {loadingVisits[patient.id] ? (
                              <p className="text-center py-2 text-gray-500 text-xs">Memuat riwayat...</p>
                            ) : visits[patient.id]?.length === 0 || !visits[patient.id] ? (
                              <p className="text-center py-2 text-gray-500 text-xs">Belum ada riwayat kunjungan</p>
                            ) : (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {visits[patient.id]?.map((visit, index) => (
                                  <div key={visit.id} className="border border-gray-100 rounded p-2 bg-gray-50">
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
                        )}
                      </div>

                      {selectedPatient?.id === patient.id && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg">✓</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button - Only show when patient is selected */}
              {selectedPatient && (
                <div className="mt-4">
                  <Button 
                    onClick={handleConfirmPatient}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Tambah Kunjungan untuk {selectedPatient.nama}
                  </Button>
                </div>
              )}
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
                Tidak ada pasien dengan NRM, NIK, atau Nama <strong>"{searchQuery}"</strong> dalam database.
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
          {searchResults.length === 0 && !notFound && !searching && (
            <div className="text-center py-12 text-gray-400">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Masukkan NRM, NIK, atau Nama untuk mencari data pasien</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
