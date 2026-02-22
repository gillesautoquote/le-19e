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

export function applyKeyboardRotation(state: CameraState, delta: number, keys: Set<string>): CameraState {
  let { theta, phi, distance } = state;

  if (keys.has('q')) theta += CAMERA.keyRotateSpeed * delta;
  if (keys.has('d')) theta -= CAMERA.keyRotateSpeed * delta;
  if (keys.has('z')) phi = MathUtils.clamp(phi - delta, CAMERA.phiMin, CAMERA.phiMax);
  if (keys.has('s')) phi = MathUtils.clamp(phi + delta, CAMERA.phiMin, CAMERA.phiMax);
  if (keys.has('+') || keys.has('=')) distance = MathUtils.clamp(distance - 20 * delta, CAMERA.distanceMin, CAMERA.distanceMax);
  if (keys.has('-')) distance = MathUtils.clamp(distance + 20 * delta, CAMERA.distanceMin, CAMERA.distanceMax);

  return { theta, phi, distance };
}

export function sphericalToOffset(state: CameraState): [number, number, number] {
  const { distance, theta, phi } = state;
  return [
    distance * Math.sin(phi) * Math.sin(theta),
    distance * Math.cos(phi),
    distance * Math.sin(phi) * Math.cos(theta),
  ];
}
