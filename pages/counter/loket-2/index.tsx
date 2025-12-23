import LoketInterface from '@/components/loket/LoketInterface';
import { LoketLayout } from '@/components/layout/LoketLayout';

export default function Loket2Page() {
  return (
    <LoketLayout loketId={2}>
      <LoketInterface loketId={2} />
    </LoketLayout>
  );
}
