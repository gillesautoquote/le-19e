export const MULTIPLAYER = {
  // Network
  positionBroadcastInterval: 100, // ms (10 Hz)
  positionDeltaThreshold: 0.1, // units — skip if position unchanged
  reconnectMaxRetries: 5,
  reconnectBaseDelay: 1000, // ms (exponential backoff)
  sessionGracePeriod: 30_000, // ms before reconnect timeout

  // Remote player rendering
  visibilityRadius: 200, // meters — beyond this, don't render
  lodRadius: 100, // meters — beyond this → simplified capsule
  maxVisiblePlayers: 50, // cap for performance
  interpolationDuration: 100, // ms — lerp duration between 2 updates
  idleTimeout: 500, // ms — no update → idle animation

  // Chat
  chatMaxMessages: 100, // history in store
  chatMaxLength: 200, // chars per message
  chatRateLimit: 5, // max messages per 10 seconds
  chatProximityRadius: 50, // meters — proximity chat range
  speechBubbleDuration: 5_000, // ms — display duration above head

  // Identity
  nameMaxLength: 20,
  nameDefault: 'Flâneur',
  bodyColorCount: 8, // number of body color variants

  // Minimap
  minimapDotRadius: 2, // pixels

  // Name label
  nameLabelYOffset: 2.5, // units above player
  nameLabelFontSize: 0.3,
} as const;
