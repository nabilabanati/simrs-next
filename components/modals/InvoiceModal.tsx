import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Printer } from 'lucide-react';

interface InvoiceData {
    invoice_id: string;
    visit_id: string;
    no_reg: string;
    created_at: string;
    patient: {
        nrm: string;
        nama: string;
        nik: string;
    };
    poli: {
        nama: string;
        kode: string;
    };
    biaya_poli: number;
    biaya_obat: number;
    total: number;
    paid: boolean;
    paid_at?: string;
    medicine_items: Array<{
        nama_obat: string;
        qty: number;
        satuan: string;
        harga: number;
        subtotal: number;
    }>;
}

interface InvoiceModalProps {
    open: boolean;
    onClose: () => void;
    visitId: string;
}

export default function InvoiceModal({ open, onClose, visitId }: InvoiceModalProps) {
    const [loading, setLoading] = useState(true);
    const [invoice, setInvoice] = useState<InvoiceData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && visitId) {
            fetchInvoice();
        }
    }, [open, visitId]);

    const fetchInvoice = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/doctor/get-invoice?visit_id=${visitId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Gagal memuat invoice');
            }

            setInvoice(data.data);
        } catch (err: any) {
            console.error('Error fetching invoice:', err);
            setError(err.message || 'Terjadi kesalahan saat memuat invoice');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!open) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <div
                    className="bg-white rounded-lg w-full max-w-md shadow-2xl animate-in fade-in slide-in-from-bottom-5 print:shadow-none print:max-w-full"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header - Hidden when printing */}
                    <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center print:hidden">
                        <h3 className="text-lg font-semibold uppercase">
                            Struk Pembayaran
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-full p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="text-gray-500">Memuat invoice...</div>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8">
                                <div className="text-red-600 mb-4">{error}</div>
                                <Button onClick={onClose} variant="outline">
                                    Tutup
                                </Button>
                            </div>
                        ) : invoice ? (
                            <>
                                {/* Hospital Header */}
                                <div className="text-center pb-4 mb-4 border-b-2 border-dashed border-gray-300">
                                    <h4 className="text-xl font-bold text-gray-900">RSUD SLAWI</h4>
                                    <p className="text-sm font-semibold text-gray-600 uppercase">
                                        Struk Pembayaran Rawat Jalan
                                    </p>
                                </div>

                                {/* Invoice Details */}
                                <div className="space-y-2 text-sm mb-4">
                                    <div className="grid grid-cols-[auto_auto_1fr] gap-2">
                                        <span className="text-gray-700">No. Registrasi</span>
                                        <span className="text-gray-700">:</span>
                                        <span className="text-gray-900 font-medium">{invoice.no_reg}</span>
                                    </div>
                                    <div className="grid grid-cols-[auto_auto_1fr] gap-2">
                                        <span className="text-gray-700">Tanggal</span>
                                        <span className="text-gray-700">:</span>
                                        <span className="text-gray-900 font-medium">
                                            {formatDate(invoice.created_at)}
                                        </span>
                                    </div>
                                </div>

                                {/* Separator */}
                                <div className="border-t border-dashed border-gray-300 my-3"></div>

                                {/* Patient Info */}
                                <div className="space-y-2 text-sm mb-4">
                                    <div className="grid grid-cols-[auto_auto_1fr] gap-2">
                                        <span className="text-gray-700">NRM</span>
                                        <span className="text-gray-700">:</span>
                                        <span className="text-gray-900 font-medium">{invoice.patient.nrm}</span>
                                    </div>
                                    <div className="grid grid-cols-[auto_auto_1fr] gap-2">
                                        <span className="text-gray-700">Nama Pasien</span>
                                        <span className="text-gray-700">:</span>
                                        <span className="text-gray-900 font-medium">{invoice.patient.nama}</span>
                                    </div>
                                    <div className="grid grid-cols-[auto_auto_1fr] gap-2">
                                        <span className="text-gray-700">Poli</span>
                                        <span className="text-gray-700">:</span>
                                        <span className="text-gray-900 font-medium">{invoice.poli.nama}</span>
                                    </div>
                                </div>

                                {/* Separator */}
                                <div className="border-t-2 border-gray-300 my-3"></div>

                                {/* Cost Breakdown */}
                                <div className="space-y-2 text-sm mb-3">
                                    <div className="font-semibold text-gray-900 mb-2">Rincian Biaya:</div>

                                    {/* Poli Fee */}
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Biaya Pendaftaran Poli</span>
                                        <span className="text-gray-900 font-medium">
                                            {formatCurrency(invoice.biaya_poli)}
                                        </span>
                                    </div>

                                    {/* Medicine Items */}
                                    {invoice.medicine_items.length > 0 && (
                                        <>
                                            <div className="font-semibold text-gray-900 mt-3 mb-1">Obat-obatan:</div>
                                            {invoice.medicine_items.map((item, index) => (
                                                <div key={index} className="ml-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">
                                                            {item.nama_obat}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-gray-600 ml-2">
                                                        <span>
                                                            {item.qty} {item.satuan} × {formatCurrency(item.harga)}
                                                        </span>
                                                        <span className="font-medium text-gray-900">
                                                            {formatCurrency(item.subtotal)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex justify-between mt-2 text-gray-700">
                                                <span>Subtotal Obat</span>
                                                <span className="font-medium">
                                                    {formatCurrency(invoice.biaya_obat)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Separator */}
                                <div className="border-t-2 border-gray-900 my-3"></div>

                                {/* Total */}
                                <div className="flex justify-between text-base font-bold">
                                    <span className="text-gray-900">TOTAL PEMBAYARAN</span>
                                    <span className="text-gray-900">{formatCurrency(invoice.total)}</span>
                                </div>

                                {/* Separator */}
                                <div className="border-t border-dashed border-gray-300 my-4"></div>

                                {/* Footer Message */}
                                <div className="text-center text-xs text-gray-600 space-y-1">
                                    <p className="font-semibold">Harap membawa struk ini ke kasir untuk pembayaran</p>
                                    <p>Setelah pembayaran, silakan ke farmasi untuk mengambil obat</p>
                                    <p className="mt-2">Terima kasih atas kunjungan Anda</p>
                                </div>

                                {/* Action Buttons - Hidden when printing */}
                                <div className="flex gap-3 mt-6 print:hidden">
                                    <Button
                                        onClick={onClose}
                                        className="flex-1"
                                        variant="outline"
                                    >
                                        Tutup
                                    </Button>
                                    <Button
                                        onClick={handlePrint}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Printer className="w-4 h-4 mr-2" />
                                        Print Struk
                                    </Button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .fixed {
                        position: static;
                    }
                    @page {
                        size: 80mm auto;
                        margin: 5mm;
                    }
                }
            `}</style>
        </>
    );
}
