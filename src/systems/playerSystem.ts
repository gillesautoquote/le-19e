import { Vector3, MathUtils } from 'three';
import { PLAYER } from '@/constants/player';
import { WORLD } from '@/constants/world';
import { getTerrainHeight } from '@/systems/terrainSystem';

interface KeyboardMovementResult {
  x: number;
  y: number;
  z: number;
  rotation: number;
}

const _direction = new Vector3();

interface PlayerState {
  positionX: number;
  positionY: number;
  positionZ: number;
  rotation: number;
  isMoving: boolean;
  walkTime: number;
}

interface PlayerUpdateResult {
  x: number;
  y: number;
  z: number;
  rotation: number;
  isMoving: boolean;
  walkTime: number;
  arrived: boolean;
}

/**
 * Compute player movement from arrow keys, relative to camera orientation.
 * Returns null if no arrow key is pressed.
 */
export function computeKeyboardMovement(
  posX: number,
  posZ: number,
  keys: Set<string>,
  cameraTheta: number,
  delta: number,
  turbo: boolean = false
): KeyboardMovementResult | null {
  let inputForward = 0;
  let inputRight = 0;

  if (keys.has('arrowup')) inputForward += 1;
  if (keys.has('arrowdown')) inputForward -= 1;
  if (keys.has('arrowleft')) inputRight -= 1;
  if (keys.has('arrowright')) inputRight += 1;

  if (inputForward === 0 && inputRight === 0) return null;

  // Normalize diagonal movement
  const len = Math.sqrt(inputForward * inputForward + inputRight * inputRight);
  inputForward /= len;
  inputRight /= len;

  // Camera-relative directions (forward = away from camera)
  const forwardX = -Math.sin(cameraTheta);
  const forwardZ = -Math.cos(cameraTheta);
  const rightX = Math.cos(cameraTheta);
  const rightZ = -Math.sin(cameraTheta);

  const dx = inputForward * forwardX + inputRight * rightX;
  const dz = inputForward * forwardZ + inputRight * rightZ;

  const speed = PLAYER.keyboardMoveSpeed * (turbo ? PLAYER.turboMultiplier : 1);
  const [newX, newZ] = clampTarget(posX + dx * speed * delta, posZ + dz * speed * delta);
  const rotation = Math.atan2(dx, dz);

  return { x: newX, y: getTerrainHeight(newX, newZ), z: newZ, rotation };
}

export function clampTarget(x: number, z: number): [number, number] {
  const cx = MathUtils.clamp(x, WORLD.boundsXMin, WORLD.boundsXMax);
  const cz = MathUtils.clamp(z, WORLD.boundsZMin, WORLD.boundsZMax);
  return [cx, cz];
}

export function updatePlayerMovement(
  state: PlayerState,
  targetX: number,
  targetZ: number,
  delta: number,
  turbo: boolean = false
): PlayerUpdateResult {
  const [tx, tz] = clampTarget(targetX, targetZ);

  _direction.set(tx - state.positionX, 0, tz - state.positionZ);
  const distance = _direction.length();

  if (distance < PLAYER.arrivalThreshold) {
    return {
      x: state.positionX,
      y: getTerrainHeight(state.positionX, state.positionZ),
      z: state.positionZ,
      rotation: state.rotation,
      isMoving: false,
      walkTime: state.walkTime,
      arrived: true,
    };
  }

  _direction.normalize();
  const speed = PLAYER.walkSpeed * (turbo ? PLAYER.turboMultiplier : 1);
  const moveDistance = Math.min(speed * delta, distance);

  const newX = state.positionX + _direction.x * moveDistance;
  const newZ = state.positionZ + _direction.z * moveDistance;
  const newRotation = Math.atan2(_direction.x, _direction.z);
  const newWalkTime = state.walkTime + delta * PLAYER.bobSpeed;
  const bobY = Math.abs(Math.sin(newWalkTime)) * PLAYER.bobAmplitude;
  const terrainY = getTerrainHeight(newX, newZ);

  return {
    x: newX,
    y: terrainY + bobY,
    z: newZ,
    rotation: newRotation,
    isMoving: true,
    walkTime: newWalkTime,
    arrived: false,
  };
}
