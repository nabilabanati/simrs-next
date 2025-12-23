import LoketInterface from '@/components/loket/LoketInterface';
import { LoketLayout } from '@/components/layout/LoketLayout';

export default function Loket5Page() {
  return (
    <LoketLayout loketId={5}>
      <LoketInterface loketId={5} />
    </LoketLayout>
  );
}
