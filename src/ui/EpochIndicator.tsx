import { useWorldStore } from '@/store/worldStore';

const EPOCH_LABELS: Record<'A' | 'B', string> = {
  A: 'Paris, 2024',
  B: 'Paris, 2089',
};

export default function EpochIndicator() {
  const epoch = useWorldStore((s) => s.epoch);

  return (
    <div
      className={`epoch-indicator ${epoch === 'A' ? 'epoch-indicator--hidden' : ''}`}
      aria-label={`\u00c9poque : ${EPOCH_LABELS[epoch]}`}
    >
      {EPOCH_LABELS[epoch]}
    </div>
  );
}
