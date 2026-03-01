export interface KenneyModuleDef {
  key: string;
  path: string;
}

/** A coherent facade style applied to an entire building. */
export interface BuildingStyle {
  /** The ONE upper-floor window module used on all upper floors. */
  upperWindow: KenneyModuleDef;
  /** Ground floor window (non-door slots). */
  groundWindow: KenneyModuleDef;
  /** Ground floor door module (~30 % of ground slots). */
  groundDoor: KenneyModuleDef;
}

// ─── Individual module definitions ──────────────────────────────

const BASE = '/models/kenney/modular-buildings';

// Upper floors
const WINDOW: KenneyModuleDef =
  { key: 'window', path: `${BASE}/building-window.glb` };
const WINDOW_SILL: KenneyModuleDef =
  { key: 'window-sill', path: `${BASE}/building-window-sill.glb` };
const WINDOW_BALCONY: KenneyModuleDef =
  { key: 'window-balcony', path: `${BASE}/building-window-balcony.glb` };
const WINDOWS: KenneyModuleDef =
  { key: 'windows', path: `${BASE}/building-windows.glb` };
const WINDOWS_ROUND: KenneyModuleDef =
  { key: 'windows-round', path: `${BASE}/building-windows-round.glb` };
const WINDOWS_SILLS: KenneyModuleDef =
  { key: 'windows-sills', path: `${BASE}/building-windows-sills.glb` };
const WINDOW_AWNINGS: KenneyModuleDef =
  { key: 'window-awnings', path: `${BASE}/building-window-awnings.glb` };

// Ground floor doors
const DOOR_WINDOW: KenneyModuleDef =
  { key: 'door-window', path: `${BASE}/building-door-window.glb` };
const DOOR: KenneyModuleDef =
  { key: 'door', path: `${BASE}/building-door.glb` };
const WINDOW_DOOR_WINDOW: KenneyModuleDef =
  { key: 'window-door-window', path: `${BASE}/building-window-door-window.glb` };

// Solid wall filler
const BLOCK: KenneyModuleDef =
  { key: 'block', path: `${BASE}/building-block.glb` };

// Detail overlay
const DETAIL_AC: KenneyModuleDef =
  { key: 'detail-ac', path: `${BASE}/detail-ac-a.glb` };

// ─── Building styles ────────────────────────────────────────────

export const BUILDING_STYLES: readonly BuildingStyle[] = [
  { // classic — plain windows, simple doors
    upperWindow: WINDOW,
    groundWindow: WINDOW,
    groundDoor: DOOR_WINDOW,
  },
  { // sill — windows with sills, elegant
    upperWindow: WINDOW_SILL,
    groundWindow: WINDOW_SILL,
    groundDoor: DOOR_WINDOW,
  },
  { // balcony — balconies on every floor, Haussmann-inspired
    upperWindow: WINDOW_BALCONY,
    groundWindow: WINDOW,
    groundDoor: WINDOW_DOOR_WINDOW,
  },
  { // double — multi-window panels, modern
    upperWindow: WINDOWS,
    groundWindow: WINDOWS,
    groundDoor: DOOR,
  },
  { // haussmann — round windows, Parisian character
    upperWindow: WINDOWS_ROUND,
    groundWindow: WINDOW,
    groundDoor: WINDOW_DOOR_WINDOW,
  },
  { // awning — shopfront with awnings, commercial ground floor
    upperWindow: WINDOW_SILL,
    groundWindow: WINDOW_AWNINGS,
    groundDoor: DOOR_WINDOW,
  },
  { // ornate — double windows with sills, elaborate
    upperWindow: WINDOWS_SILLS,
    groundWindow: WINDOWS_SILLS,
    groundDoor: WINDOW_DOOR_WINDOW,
  },
];

// ─── Deduplicated module list for preloading + instancing ───────

function dedup(modules: KenneyModuleDef[]): KenneyModuleDef[] {
  const seen = new Set<string>();
  return modules.filter((m) => {
    if (seen.has(m.key)) return false;
    seen.add(m.key);
    return true;
  });
}

/** Every unique module used across all styles — drives preload & InstancedMesh creation. */
export const ALL_FACADE_MODULES: KenneyModuleDef[] = dedup([
  ...BUILDING_STYLES.flatMap((s) => [s.upperWindow, s.groundWindow, s.groundDoor]),
  BLOCK,
  DETAIL_AC,
]);
