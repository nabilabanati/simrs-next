import LoketInterface from '@/components/loket/LoketInterface';
import { LoketLayout } from '@/components/layout/LoketLayout';

export default function Loket1Page() {
  return (
    <LoketLayout loketId={1}>
      <LoketInterface loketId={1} />
    </LoketLayout>
  );
}
