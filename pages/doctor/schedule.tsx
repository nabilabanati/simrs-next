import { useState, useEffect } from 'react'
import DoctorLayout from '@/components/layout/DoctorLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Calendar, Clock, Plus, Trash2, AlertCircle, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/router'
import Breadcrumb from '@/components/dashboard/poli/Breadcrumb'

const DAYS = [
    { value: 'senin', label: 'Senin' },
    { value: 'selasa', label: 'Selasa' },
    { value: 'rabu', label: 'Rabu' },
    { value: 'kamis', label: 'Kamis' },
    { value: 'jumat', label: 'Jumat' },
    { value: 'sabtu', label: 'Sabtu' },
    { value: 'minggu', label: 'Minggu' }
]

interface Schedule {
    id: string
    hari: string
    jam_mulai: string
    jam_selesai: string
    session_name: string | null
    max_patients_per_day: number | null
    is_active: boolean
}

interface ScheduleOverride {
    id: string
    tanggal: string
    jam_mulai: string | null
    jam_selesai: string | null
    is_cancelled: boolean
    reason: string | null
}

export default function DoctorSchedulePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [overrides, setOverrides] = useState<ScheduleOverride[]>([])
    const [dokterId, setDokterId] = useState<string>('')
    const [poliName, setPoliName] = useState<string>('')

    // Regular schedule modal
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
    const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
    const [selectedDay, setSelectedDay] = useState('')
    const [jamMulai, setJamMulai] = useState('')
    const [jamSelesai, setJamSelesai] = useState('')
    const [sessionName, setSessionName] = useState('')
    const [maxPatients, setMaxPatients] = useState('')

    // Override modal
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false)
    const [overrideDate, setOverrideDate] = useState('')
    const [overrideJamMulai, setOverrideJamMulai] = useState('')
    const [overrideJamSelesai, setOverrideJamSelesai] = useState('')
    const [isCancelled, setIsCancelled] = useState(false)
    const [reason, setReason] = useState('')

    useEffect(() => {
        // Get doctor ID from localStorage
        const userStr = localStorage.getItem('user')
        if (!userStr) {
            router.push('/login')
            return
        }

        const user = JSON.parse(userStr)
        if (user.role !== 'dokter') {
            router.push('/login')
            return
        }

        // Get doctor record
        fetchDoctorId(user.id)
    }, [])

    const fetchDoctorId = async (userId: string) => {
        try {
            const { supabase } = await import('@/lib/supabase')
            const { data, error } = await supabase
                .from('doctors')
                .select('id')
                .eq('user_id', userId)
                .single()

            if (error || !data) {
                toast.error('Gagal mendapatkan data dokter')
                return
            }

            setDokterId(data.id)

            // Get poli info
            const { data: poliRelasi } = await supabase
                .from('doctor_poli')
                .select('poli ( id, nama )')
                .eq('dokter_id', data.id)
                .limit(1)

            if (poliRelasi && poliRelasi.length > 0) {
                const poliData = poliRelasi[0] as any
                setPoliName(poliData.poli.nama)
            }

            fetchSchedules(data.id)
            fetchOverrides(data.id)
        } catch (error) {
            console.error('Error fetching doctor ID:', error)
            toast.error('Terjadi kesalahan')
        }
    }

    const fetchSchedules = async (doctorId: string) => {
        setLoading(true)
        try {
            const response = await fetch(`/api/doctor/schedule?dokter_id=${doctorId}`, {
                credentials: 'include'
            })
            const data = await response.json()

            if (data.success) {
                setSchedules(data.data)
            }
        } catch (error) {
            console.error('Error fetching schedules:', error)
            toast.error('Gagal memuat jadwal')
        } finally {
            setLoading(false)
        }
    }

    const fetchOverrides = async (doctorId: string) => {
        try {
            const response = await fetch(`/api/doctor/schedule-override?dokter_id=${doctorId}`, {
                credentials: 'include'
            })
            const data = await response.json()

            if (data.success) {
                setOverrides(data.data)
            }
        } catch (error) {
            console.error('Error fetching overrides:', error)
        }
    }

    const handleSaveSchedule = async () => {
        if (!selectedDay || !jamMulai || !jamSelesai) {
            toast.error('Semua field harus diisi')
            return
        }

        if (jamSelesai <= jamMulai) {
            toast.error('Jam selesai harus lebih besar dari jam mulai')
            return
        }

        try {
            if (editingScheduleId) {
                // Update existing schedule
                const response = await fetch(`/api/doctor/schedule?id=${editingScheduleId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        hari: selectedDay,
                        jam_mulai: jamMulai,
                        jam_selesai: jamSelesai,
                        session_name: sessionName || null,
                        max_patients_per_day: maxPatients ? parseInt(maxPatients) : null
                    })
                })

                const data = await response.json()

                if (data.success) {
                    toast.success('Jadwal berhasil diupdate')
                    setIsScheduleModalOpen(false)
                    resetScheduleForm()
                    fetchSchedules(dokterId)
                } else {
                    toast.error(data.error || 'Gagal mengupdate jadwal')
                }
            } else {
                // Create new schedule
                const response = await fetch('/api/doctor/schedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        dokter_id: dokterId,
                        hari: selectedDay,
                        jam_mulai: jamMulai,
                        jam_selesai: jamSelesai,
                        session_name: sessionName || null,
                        max_patients_per_day: maxPatients ? parseInt(maxPatients) : null
                    })
                })

                const data = await response.json()

                if (data.success) {
                    toast.success('Jadwal berhasil disimpan')
                    setIsScheduleModalOpen(false)
                    resetScheduleForm()
                    fetchSchedules(dokterId)
                } else {
                    toast.error(data.error || 'Gagal menyimpan jadwal')
                }
            }
        } catch (error) {
            console.error('Error saving schedule:', error)
            toast.error('Terjadi kesalahan')
        }
    }

    const handleEditSchedule = (schedule: Schedule) => {
        setEditingScheduleId(schedule.id)
        setSelectedDay(schedule.hari)
        setJamMulai(schedule.jam_mulai)
        setJamSelesai(schedule.jam_selesai)
        setSessionName(schedule.session_name || '')
        setMaxPatients(schedule.max_patients_per_day?.toString() || '')
        setIsScheduleModalOpen(true)
    }

    const handleSaveOverride = async () => {
        if (!overrideDate) {
            toast.error('Tanggal harus diisi')
            return
        }

        if (!isCancelled && (!overrideJamMulai || !overrideJamSelesai)) {
            toast.error('Jam mulai dan jam selesai harus diisi')
            return
        }

        if (!isCancelled && overrideJamSelesai <= overrideJamMulai) {
            toast.error('Jam selesai harus lebih besar dari jam mulai')
            return
        }

        try {
            const response = await fetch('/api/doctor/schedule-override', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    dokter_id: dokterId,
                    tanggal: overrideDate,
                    jam_mulai: isCancelled ? null : overrideJamMulai,
                    jam_selesai: isCancelled ? null : overrideJamSelesai,
                    is_cancelled: isCancelled,
                    reason: reason || null
                })
            })

            const data = await response.json()

            if (data.success) {
                toast.success(data.message)
                setIsOverrideModalOpen(false)
                resetOverrideForm()
                fetchOverrides(dokterId)
            } else {
                toast.error(data.error || 'Gagal menyimpan override')
            }
        } catch (error) {
            console.error('Error saving override:', error)
            toast.error('Terjadi kesalahan')
        }
    }

    const handleDeleteSchedule = async (id: string) => {
        if (!confirm('Yakin ingin menghapus jadwal ini?')) return

        try {
            const response = await fetch(`/api/doctor/schedule?id=${id}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            const data = await response.json()

            if (data.success) {
                toast.success('Jadwal berhasil dihapus')
                fetchSchedules(dokterId)
            } else {
                toast.error(data.error || 'Gagal menghapus jadwal')
            }
        } catch (error) {
            console.error('Error deleting schedule:', error)
            toast.error('Terjadi kesalahan')
        }
    }

    const handleDeleteOverride = async (id: string) => {
        if (!confirm('Yakin ingin menghapus override ini?')) return

        try {
            const response = await fetch(`/api/doctor/schedule-override?id=${id}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            const data = await response.json()

            if (data.success) {
                toast.success('Override berhasil dihapus')
                fetchOverrides(dokterId)
            } else {
                toast.error(data.error || 'Gagal menghapus override')
            }
        } catch (error) {
            console.error('Error deleting override:', error)
            toast.error('Terjadi kesalahan')
        }
    }

    const resetScheduleForm = () => {
        setEditingScheduleId(null)
        setSelectedDay('')
        setJamMulai('')
        setJamSelesai('')
        setSessionName('')
        setMaxPatients('')
    }

    const resetOverrideForm = () => {
        setOverrideDate('')
        setOverrideJamMulai('')
        setOverrideJamSelesai('')
        setIsCancelled(false)
        setReason('')
    }

    const formatTime = (time: string) => {
        // Convert HH:MM:SS to HH.MM (Indonesian format)
        if (!time) return time
        const parts = time.split(':')
        if (parts.length >= 2) {
            return `${parts[0]}.${parts[1]}`
        }
        return time
    }

    const getDayLabel = (day: string) => {
        return DAYS.find(d => d.value === day)?.label || day
    }

    return (
        <DoctorLayout>
            <div className="min-h-screen bg-white">
                <div className="px-12 pb-12 py-12 pr-12 pl-12 pt-16">
                    <Breadcrumb
                        items={[
                            { label: `${poliName}`, href: '/doctor' },
                            { label: 'Jadwal Praktik' },
                        ]}
                    />

                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-6">Jadwal Praktik</h1>
                    </div>

                    {/* Regular Schedules */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Jadwal Rutin Mingguan</CardTitle>
                                    <div className='mb-2'></div>
                                    <CardDescription>
                                        Jadwal praktik regular per hari
                                    </CardDescription>
                                </div>
                                <Button onClick={() => setIsScheduleModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah Jadwal
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <p className="text-center py-8 text-gray-500">Loading...</p>
                            ) : schedules.length === 0 ? (
                                <p className="text-center py-8 text-gray-500">
                                    Belum ada jadwal. Klik "Tambah Jadwal" untuk menambahkan.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <div className="grid grid-cols-7 gap-2 min-w-max">
                                        {DAYS.map(day => {
                                            const daySchedules = schedules.filter(s => s.hari === day.value)
                                            return (
                                                <div
                                                    key={day.value}
                                                    className={`p-3 rounded-lg border min-w-[140px] ${daySchedules.length > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-3 justify-center">
                                                        <Calendar className="h-4 w-4 text-gray-600" />
                                                        <p className="font-semibold text-sm">{day.label}</p>
                                                    </div>

                                                    {daySchedules.length === 0 ? (
                                                        <p className="text-xs text-gray-500 text-center">Tidak ada jadwal</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {daySchedules.map((schedule, idx) => (
                                                                <div
                                                                    key={schedule.id}
                                                                    className="bg-white p-2 rounded border border-blue-100"
                                                                >
                                                                    {schedule.session_name && (
                                                                        <p className="text-xs font-medium text-blue-600 mb-1 truncate">
                                                                            {schedule.session_name}
                                                                        </p>
                                                                    )}
                                                                    <p className="text-xs text-gray-700 flex items-center gap-1 mb-1">
                                                                        <Clock className="h-3 w-3 flex-shrink-0" />
                                                                        <span className="text-xs">{formatTime(schedule.jam_mulai)} - {formatTime(schedule.jam_selesai)}</span>
                                                                    </p>
                                                                    {schedule.max_patients_per_day && (
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            Kuota: {schedule.max_patients_per_day}
                                                                        </p>
                                                                    )}
                                                                    <div className="flex gap-1 mt-2">
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleEditSchedule(schedule)}
                                                                            className="h-6 px-2 bg-blue-50 hover:bg-blue-100 text-blue-600"
                                                                        >
                                                                            <Edit className="h-3 w-3" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleDeleteSchedule(schedule.id)}
                                                                            className="h-6 px-2 bg-red-50 hover:bg-red-100 text-red-600"
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <div className='mb-6'></div>
                    {/* Schedule Overrides */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Override Jadwal (Kasus Darurat)</CardTitle>
                                    <div className='mb-2'></div>
                                    <CardDescription>
                                        Ubah jadwal untuk tanggal tertentu atau batalkan praktik
                                    </CardDescription>
                                </div>
                                <Button onClick={() => setIsOverrideModalOpen(true)} className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    Tambah Override
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {overrides.length === 0 ? (
                                <p className="text-center py-8 text-gray-500">
                                    Tidak ada override jadwal
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {overrides.map(override => (
                                        <div
                                            key={override.id}
                                            className={`flex items-center justify-between p-4 rounded-lg border ${override.is_cancelled
                                                ? 'bg-red-50 border-red-200'
                                                : 'bg-yellow-50 border-yellow-200'
                                                }`}
                                        >
                                            <div>
                                                <p className="font-semibold">
                                                    {new Date(override.tanggal).toLocaleDateString('id-ID', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                {override.is_cancelled ? (
                                                    <p className="text-sm text-red-600 font-medium">LIBUR / TIDAK TERSEDIA</p>
                                                ) : (
                                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatTime(override.jam_mulai || '')} - {formatTime(override.jam_selesai || '')}
                                                    </p>
                                                )}
                                                {override.reason && (
                                                    <p className="text-xs text-gray-500 mt-1">Alasan: {override.reason}</p>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleDeleteOverride(override.id)}
                                                className="bg-red-50 hover:bg-red-100 text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Add Schedule Modal */}
                    <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingScheduleId ? 'Edit Jadwal' : 'Tambah Jadwal Rutin'}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label>Hari</Label>
                                    <select
                                        value={selectedDay}
                                        onChange={(e) => setSelectedDay(e.target.value)}
                                        className="w-full border rounded-md px-3 py-2 mt-1"
                                    >
                                        <option value="">Pilih Hari</option>
                                        {DAYS.map(day => (
                                            <option key={day.value} value={day.value}>{day.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Nama Sesi (Opsional)</Label>
                                    <Input
                                        value={sessionName}
                                        onChange={(e) => setSessionName(e.target.value)}
                                        placeholder="Contoh: Sesi Pagi, Sesi Siang"
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Untuk membedakan jika ada multiple sesi di hari yang sama
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Jam Mulai</Label>
                                        <Input
                                            type="time"
                                            value={jamMulai}
                                            onChange={(e) => setJamMulai(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Jam Selesai</Label>
                                        <Input
                                            type="time"
                                            value={jamSelesai}
                                            onChange={(e) => setJamSelesai(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Kuota Pasien (Opsional)</Label>
                                    <Input
                                        type="number"
                                        value={maxPatients}
                                        onChange={(e) => setMaxPatients(e.target.value)}
                                        placeholder="Contoh: 10"
                                        className="mt-1"
                                        min="1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Maksimal pasien untuk sesi ini. Kosongkan untuk unlimited.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                                    Batal
                                </Button>
                                <Button onClick={handleSaveSchedule} className="bg-blue-600 hover:bg-blue-700 text-white">Simpan</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Add Override Modal */}
                    <Dialog open={isOverrideModalOpen} onOpenChange={setIsOverrideModalOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Override Jadwal</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label>Tanggal</Label>
                                    <Input
                                        type="date"
                                        value={overrideDate}
                                        onChange={(e) => setOverrideDate(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is-cancelled"
                                        checked={isCancelled}
                                        onChange={(e) => setIsCancelled(e.target.checked)}
                                        className="rounded"
                                    />
                                    <Label htmlFor="is-cancelled" className="cursor-pointer">
                                        Batalkan praktik (Libur total)
                                    </Label>
                                </div>
                                {!isCancelled && (
                                    <>
                                        <div>
                                            <Label>Jam Mulai</Label>
                                            <Input
                                                type="time"
                                                value={overrideJamMulai}
                                                onChange={(e) => setOverrideJamMulai(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>Jam Selesai</Label>
                                            <Input
                                                type="time"
                                                value={overrideJamSelesai}
                                                onChange={(e) => setOverrideJamSelesai(e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <Label>Alasan (Opsional)</Label>
                                    <Input
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Contoh: Darurat di RS lain"
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsOverrideModalOpen(false)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                                    Batal
                                </Button>
                                <Button onClick={handleSaveOverride} className="bg-blue-600 hover:bg-blue-700 text-white">Simpan</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </DoctorLayout>
    )
}
