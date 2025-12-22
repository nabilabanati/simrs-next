import { Card, CardContent } from '@/components/ui/card';

interface NurseSummaryCardsProps {
    totalPatients: number;
    waitingTTV: number;
    completedTTV: number;
}

export default function NurseSummaryCards({
    totalPatients,
    waitingTTV,
    completedTTV,
}: NurseSummaryCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
                <CardContent className="p-6">
                    <p className="text-sm text-gray-600">Total Pasien Hari Ini</p>
                    <p className="text-3xl font-bold text-blue-600">
                        {totalPatients}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <p className="text-sm text-gray-600">Menunggu TTV</p>
                    <p className="text-3xl font-bold text-yellow-600">
                        {waitingTTV}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <p className="text-sm text-gray-600">TTV Selesai</p>
                    <p className="text-3xl font-bold text-green-600">
                        {completedTTV}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
