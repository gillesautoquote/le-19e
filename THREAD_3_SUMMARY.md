# Thread 3 — Post-processing & Rendu Visuel — Résumé

## Dépendance ajoutée
- `@react-three/postprocessing@^2.19.1` (compatible avec `@react-three/fiber@^8`)

## Fichiers créés

### `src/components/Lighting.tsx` (nouveau)
- DirectionalLight principal : position [50, 80, 30], intensité 1.5, couleur dorée #FFF5E0, castShadow, shadow.mapSize 2048
- AmbientLight : intensité 0.4, couleur bleutée #E0E8FF
- HemisphereLight : sky #87CEEB, ground #8B7355, intensité 0.3
- Réactif à l'époque active (couleur sunLight change selon EPOCH_A/B)

### `src/components/PostProcessing.tsx` (nouveau)
- EffectComposer avec 4 effets :
  - **SSAO** : radius=0.5, intensity=20
  - **Bloom** : intensity=0.3, luminanceThreshold=0.9
  - **DepthOfField** : focusDistance=0.02, focalLength=0.05, bokehScale=3
  - **Vignette** : offset=0.3, darkness=0.5
- Prop `enabled` pour désactiver tous les effets
- Détecteur de performance : SSAO auto-désactivé si < 30fps pendant 3 secondes

### `src/atoms/Sky.tsx` (nouveau)
- Composant `<Sky>` de Drei avec soleil bas (sunPosition=[1, 0.3, 0])
- turbidity=8, rayleigh=0.5 pour un ciel chaud et légèrement voilé

### `src/types/r3f.d.ts` (nouveau)
- Correction du typage R3F v8 + @types/react@19 (JSX.IntrinsicElements)

## Fichiers modifiés

### `src/atoms/Water.tsx`
- Remplacé le MeshLambertMaterial modifié par un ShaderMaterial custom complet
- Vertex shader : ondulation sinusoïdale multi-couches
- Fragment shader : effet Fresnel simplifié, reflet spéculaire, mix surface/profondeur
- Réactif à l'époque : lerp de couleur/opacité entre EPOCH_A et EPOCH_B
- Époque B : eau plus sombre (#2C3E2D) et plus opaque (0.92)

### `src/scenes/CanalOurcq.tsx`
- Éclairage inline remplacé par le composant `<Lighting />`
- Ajout de `<Sky />` et `<PostProcessing />`
- Fog : FogExp2 remplacé par Fog linéaire (near=80, far=250 → ~150m de visibilité)
- Transition douce des couleurs fog/sky quand l'époque change (lerp dans useFrame)

### `src/App.tsx`
- Import de `PCFSoftShadowMap` depuis three
- Ajout de `gl={{ antialias: true }}` et `onCreated` pour forcer `PCFSoftShadowMap`

### `src/constants/world.ts`
- LIGHTING : ambientIntensity 0.6→0.4, sunIntensity 1.0→1.5, ajout ambientColor, sunColor, hemisphere*
- Ajout constante `FOG` : near=80, far=250, transitionSpeed=2
- Suppression de `fogDensity` (remplacé par FOG.near/far)

### `src/vite-env.d.ts`
- Nettoyé (uniquement la ref vite/client, types R3F dans r3f.d.ts)

## Ce qui n'a PAS été modifié
- Aucun autre atom (Building, Tree, Player, ClickIndicator)
- Aucun store (playerStore, worldStore, audioStore)
- Aucun system (playerSystem, cameraSystem, audioSystem)
- Aucune donnée OSM
- Aucun composant UI (Minimap, MuteButton, StartScreen)

## Vérification
- `npx tsc --noEmit` : 0 erreurs
- `npx vite build` : build réussi (1138 KB gzip 311 KB)
