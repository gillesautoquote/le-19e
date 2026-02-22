import { BusFurniture } from '@/atoms/BusFurniture';

interface BusStopProps {
  position: [number, number, number];
  rotation?: number;
  name: string;
  lines: string[];
}

/**
 * Bus stop molecule: physical shelter + route info.
 * The shelter geometry is handled by BusFurniture atom.
 * Name and lines are available for Html overlay in the integration thread.
 */
export function BusStop({ position, rotation = 0, name, lines }: BusStopProps) {
  // Suppress unused vars — available for Html labels in future integration
  void name;
  void lines;

  return (
    <BusFurniture position={position} rotation={rotation} />
  );
}
