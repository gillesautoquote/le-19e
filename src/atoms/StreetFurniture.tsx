import StreetBench from '@/atoms/StreetBench';
import StreetWasteBin from '@/atoms/StreetWasteBin';

interface StreetFurnitureProps {
  type: 'bench' | 'bin';
  position: [number, number, number];
  rotation?: number;
}

export function StreetFurniture({ type, position, rotation = 0 }: StreetFurnitureProps) {
  if (type === 'bench') {
    return <StreetBench position={position} rotation={rotation} />;
  }
  return <StreetWasteBin position={position} />;
}
