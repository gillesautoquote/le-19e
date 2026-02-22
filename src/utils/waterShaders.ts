// ─── Water shaders ──────────────────────────────────────────────

export const WATER_VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    vec3 pos = position;

    // Multi-layer sinusoidal waves (gentle canal ripples)
    float wave1 = sin(pos.x * 0.05 + uTime * 0.8) * 0.08;
    float wave2 = sin(pos.y * 0.3 + uTime * 1.2) * 0.03;
    float wave3 = sin((pos.x + pos.y) * 0.15 + uTime * 1.5) * 0.02;
    pos.z += wave1 + wave2 + wave3;

    // Compute displaced normal for lighting
    float dx = cos(pos.x * 0.05 + uTime * 0.8) * 0.004
             + cos((pos.x + pos.y) * 0.15 + uTime * 1.5) * 0.003;
    float dy = cos(pos.y * 0.3 + uTime * 1.2) * 0.009
             + cos((pos.x + pos.y) * 0.15 + uTime * 1.5) * 0.003;
    vNormal = normalize(vec3(-dx, -dy, 1.0));

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const WATER_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uDeepColor;
  uniform float uOpacity;
  uniform vec3 uCameraPosition;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    // View-dependent color variation (simplified fresnel)
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
    float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
    fresnel = pow(fresnel, 2.0);

    // Mix surface and deep color based on view angle
    vec3 color = mix(uColor, uDeepColor, fresnel * 0.4);

    // Subtle specular highlight from sun direction
    vec3 sunDir = normalize(vec3(50.0, 80.0, 30.0));
    vec3 halfDir = normalize(sunDir + viewDir);
    float specular = pow(max(dot(vNormal, halfDir), 0.0), 64.0);
    color += vec3(1.0, 0.98, 0.9) * specular * 0.3;

    gl_FragColor = vec4(color, uOpacity);
  }
`;
