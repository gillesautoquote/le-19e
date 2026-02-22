import { Howl, Howler } from 'howler';

let bgHowl: Howl | null = null;
let waterHowl: Howl | null = null;
let isInitialized = false;

export function initAudio(): void {
  if (isInitialized) return;

  // Placeholder: silent howls (will be replaced with real audio files)
  // For now, create a simple oscillator-based ambiance via Howler's Web Audio integration
  bgHowl = new Howl({
    src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='],
    loop: true,
    volume: 0,
  });

  waterHowl = new Howl({
    src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='],
    loop: true,
    volume: 0,
  });

  isInitialized = true;
}

export function toggleMute(muted: boolean): void {
  Howler.mute(muted);
}

export function isAudioInitialized(): boolean {
  return isInitialized;
}
