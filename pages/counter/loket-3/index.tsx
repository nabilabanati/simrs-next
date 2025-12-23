import LoketInterface from '@/components/loket/LoketInterface';
import { LoketLayout } from '@/components/layout/LoketLayout';

export default function Loket3Page() {
  return (
    <LoketLayout loketId={3}>
      <LoketInterface loketId={3} />
    </LoketLayout>
  );
}
