import { MathUtils } from 'three';
import { CAMERA } from '@/constants/world';

export interface CameraState {
  distance: number;
  theta: number;
  phi: number;
}

export function createInitialCameraState(): CameraState {
  return {
    distance: CAMERA.distanceDefault,
    theta: CAMERA.initialTheta,
    phi: CAMERA.initialPhi,
  };
}

export function applyZoom(state: CameraState, deltaY: number): CameraState {
  const delta = deltaY * 0.01 * CAMERA.zoomSpeed;
  return {
    ...state,
    distance: MathUtils.clamp(state.distance + delta, CAMERA.distanceMin, CAMERA.distanceMax),
  };
}

export function applyOrbit(state: CameraState, dx: number, dy: number): CameraState {
  return {
    ...state,
    theta: state.theta - dx * CAMERA.orbitSpeed,
    phi: MathUtils.clamp(state.phi - dy * CAMERA.tiltSpeed, CAMERA.phiMin, CAMERA.phiMax),
  };
}

/** Zoom via +/- keyboard keys (no ZQSD — those are now player movement). */
export function applyKeyboardZoom(state: CameraState, delta: number, keys: Set<string>): CameraState {
  let { distance } = state;
  if (keys.has('+') || keys.has('=')) distance = MathUtils.clamp(distance - 20 * delta, CAMERA.distanceMin, CAMERA.distanceMax);
  if (keys.has('-')) distance = MathUtils.clamp(distance + 20 * delta, CAMERA.distanceMin, CAMERA.distanceMax);
  if (distance === state.distance) return state;
  return { ...state, distance };
}

/**
 * Auto-follow: when the player has been moving for longer than autoFollowDelay,
 * gently orbit the camera behind them (theta → playerRotation + PI).
 */
export function applyAutoFollow(
  state: CameraState,
  playerRotation: number,
  isMoving: boolean,
  movingTime: number,
  delta: number,
): CameraState {
  if (!isMoving || movingTime < CAMERA.autoFollowDelay) return state;

  const behindTheta = playerRotation + Math.PI;
  let diff = behindTheta - state.theta;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;

  const t = Math.min(1, CAMERA.autoFollowSpeed * delta);
  return {
    ...state,
    theta: state.theta + diff * t,
  };
}

export function sphericalToOffset(state: CameraState): [number, number, number] {
  const { distance, theta, phi } = state;
  return [
    distance * Math.sin(phi) * Math.sin(theta),
    distance * Math.cos(phi),
    distance * Math.sin(phi) * Math.cos(theta),
  ];
}
