/**
 * Shared keyboard input state — singleton module.
 * Both CameraRig and Player read from the same Set of pressed keys.
 */

const pressedKeys = new Set<string>();
let initialized = false;

function onKeyDown(e: KeyboardEvent): void {
  // Prevent page scroll when arrow keys are used for movement
  if (e.key.startsWith('Arrow')) {
    e.preventDefault();
  }
  pressedKeys.add(e.key.toLowerCase());
}

function onKeyUp(e: KeyboardEvent): void {
  pressedKeys.delete(e.key.toLowerCase());
}

export function initInput(): void {
  if (initialized) return;
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  initialized = true;
}

export function disposeInput(): void {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  pressedKeys.clear();
  initialized = false;
}

export function getKeys(): Set<string> {
  return pressedKeys;
}
