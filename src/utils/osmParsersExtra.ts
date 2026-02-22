import { resolveId, extractPointCoords } from '@/utils/osmDetectors';
import type {
  GeoJSONFeature,
  OSMBarge,
  OSMLock,
  OSMWasteBin,
  OSMTree,
} from '@/types/osm';

export function parseBarge(feature: GeoJSONFeature): OSMBarge | null {
  const pos = extractPointCoords(feature);
  if (!pos) return null;

  const lengthStr = feature.properties.length;
  const length = lengthStr ? parseFloat(lengthStr) : 20;

  return {
    id: resolveId(feature, 'barge'),
    position: pos,
    length: isNaN(length) ? 20 : length,
    name: feature.properties.name ?? null,
    isTourBoat: feature.properties.tourism === 'boat_tour',
  };
}

export function parseLock(feature: GeoJSONFeature): OSMLock | null {
  const pos = extractPointCoords(feature);
  if (!pos) return null;

  return {
    id: resolveId(feature, 'lock'),
    position: pos,
    name: feature.properties.name ?? null,
  };
}

export function parseWasteBin(feature: GeoJSONFeature): OSMWasteBin | null {
  const pos = extractPointCoords(feature);
  if (!pos) return null;

  return {
    id: resolveId(feature, 'bin'),
    position: pos,
  };
}

export function parseTree(feature: GeoJSONFeature): OSMTree | null {
  const pos = extractPointCoords(feature);
  if (!pos) return null;

  return {
    id: resolveId(feature, 'tree'),
    position: pos,
  };
}
