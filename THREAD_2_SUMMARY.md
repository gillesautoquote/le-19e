# Thread 2 — Assets 3D Kenney.nl — Summary

## Files created
- `src/hooks/useAssets.ts` — Centralized model preloading hook (MODEL_PATHS, useAssets, ModelErrorBoundary)
- `src/atoms/Bench.tsx` — Procedural bench atom (seat, backrest, metal legs)
- `src/atoms/Lamppost.tsx` — Procedural lamppost atom (base, pole, arm, lamp head)
- `public/models/` — Directory for Kenney GLB models (empty, awaiting assets)

## Files modified
- `src/atoms/Tree.tsx` — Added named export `Tree` atom with GLB support (tree_pine/tree_oak, seeded random selection) + procedural fallback. Default export `Trees` (batched) preserved for CanalOurcq backward compat.
- `src/atoms/Building.tsx` — Added named export `Building` atom with GLB support (building_A/B/C by height) + ExtrudeGeometry fallback. Default export `Buildings` (batched) preserved.
- `src/atoms/Player.tsx` — Added GLB character model support (character_male.glb) with body part coloring heuristic (head/legs/body). Procedural box fallback preserved. Movement logic unchanged.
- `src/atoms/Barge.tsx` — Rewritten with thread-spec props (position, rotation). Procedural peniche: hull 12x2x3, cabin, wheelhouse, deck, chimney, rope posts and ropes.
- `src/molecules/Quay.tsx` — Added lampposts (every 30 units) and benches (every 40 units) along both canal edges.

## Architecture decisions
- **GLB fallback pattern**: Each atom wraps its GLB version in `<ModelErrorBoundary>` + `<Suspense>`, falling back to procedural geometry if models are missing or fail to load.
- **Batched exports preserved**: `Trees` and `Buildings` default exports (merged geometry, 2 draw calls each) kept unchanged for CanalOurcq compatibility. Individual `Tree`/`Building` named exports added for molecule use.
- **Materials**: All meshes use `MeshLambertMaterial` with `flatShading`. All colors from `epochs.ts`.
- **Shadows**: `castShadow` and `receiveShadow` enabled on all meshes.

## What was NOT modified
- `src/scenes/CanalOurcq.tsx`
- `src/organisms/`
- `src/store/`
- `src/systems/`
- `src/App.tsx`
- `src/constants/epochs.ts` (already had all needed colors)
