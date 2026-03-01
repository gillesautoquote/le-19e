# Plan — Intégration complète des assets KayKit

## Résumé

Intégrer tous les assets KayKit exploitables dans le projet :
herbes 3D, rochers, mobilier urbain GLB (bench, firehydrant, dumpster, streetlight_old),
voitures statiques garées, arbres/buissons supplémentaires.
Les parcs restent en polygones plats (OSMParks inchangé), enrichis visuellement par-dessus.

---

## Phase 1 — Conversion GLTF → GLB

Script bash unique avec `npx gltf-transform cp` (déjà installé en devDep) pour convertir :

### Herbes (8 modèles — singlesided pour la perf)
```
Grass_1_A_Singlesided_Color1 → public/models/kaykit/forest/Grass_1_A.glb
Grass_1_B_Singlesided_Color1 → Grass_1_B.glb
Grass_1_C_Singlesided_Color1 → Grass_1_C.glb
Grass_1_D_Singlesided_Color1 → Grass_1_D.glb
Grass_2_A_Singlesided_Color1 → Grass_2_A.glb
Grass_2_B_Singlesided_Color1 → Grass_2_B.glb
Grass_2_C_Singlesided_Color1 → Grass_2_C.glb
Grass_2_D_Singlesided_Color1 → Grass_2_D.glb
```

### Rochers (8 modèles — 2-3 par taille pour variété sans surcharge)
```
Rock_1_A, Rock_1_D, Rock_1_H          → petits rochers (3 variants)
Rock_2_A, Rock_2_D                     → rochers moyens (2 variants)
Rock_3_A, Rock_3_E, Rock_3_K          → gros rochers (3 variants)
```

### Mobilier urbain (City Builder Bits → GLB)
```
streetlight_old_double → public/models/kaykit/streetlight_old_double.glb
```
(bench.glb, firehydrant.glb, dumpster.glb déjà convertis)

### Voitures (City Builder Bits → GLB, 5 modèles)
```
car_sedan      → public/models/kaykit/cars/car_sedan.glb
car_hatchback  → public/models/kaykit/cars/car_hatchback.glb
car_taxi       → public/models/kaykit/cars/car_taxi.glb
car_stationwagon → public/models/kaykit/cars/car_stationwagon.glb
car_police     → public/models/kaykit/cars/car_police.glb
```

### Arbres/buissons supplémentaires (Forest Pack, 6+6)
```
Tree_1_C, Tree_2_B, Tree_2_D, Tree_2_E, Tree_3_C, Tree_4_C → 6 arbres
Bush_1_B, Bush_1_C, Bush_2_B, Bush_2_C, Bush_3_B, Bush_4_B → 6 buissons
```

---

## Phase 2 — Constantes & types

### 2a. `src/constants/kaykitGrass.ts` (nouveau)
```typescript
interface KaykitGrassDef { key: string; path: string; nativeHeight: number; }
KAYKIT_GRASSES: KaykitGrassDef[] // 8 entrées
```
Pattern identique à `kaykitForest.ts`.

### 2b. `src/constants/kaykitRocks.ts` (nouveau)
```typescript
interface KaykitRockDef { key: string; path: string; nativeHeight: number; }
KAYKIT_ROCKS: KaykitRockDef[] // 8 entrées
```

### 2c. `src/constants/kaykitUrban.ts` (modifier)
Ajouter :
- `KAYKIT_BENCHES` — bench.glb (déjà converti)
- `KAYKIT_FIRE_HYDRANTS` — firehydrant.glb (déjà converti)
- `KAYKIT_DUMPSTERS` — dumpster.glb (déjà converti)
- `KAYKIT_STREETLIGHTS` — streetlight_old_double.glb (à convertir)
Mettre à jour `ALL_KAYKIT_URBAN` pour inclure les nouvelles catégories.

### 2d. `src/constants/kaykitCars.ts` (nouveau)
```typescript
interface KaykitCarDef { key: string; path: string; nativeLength: number; scale: number; }
KAYKIT_STATIC_CARS: KaykitCarDef[] // 5 entrées
```

### 2e. `src/constants/kaykitForest.ts` (modifier)
Ajouter les 6 arbres et 6 buissons supplémentaires aux tableaux existants.

---

## Phase 3 — Composants de rendu

### 3a. Refonte `GrassPatches.tsx` (atom, ~120 lignes)
- Remplacer les triangles procéduraux par des modèles GLB KayKit herbe
- Même pattern que `OSMBushes.tsx` : InstancedMesh par variant, grid+jitter+pointInPolygon
- Conserver le seed offset existant (7000) pour éviter les collisions avec les buissons
- Utiliser `KAYKIT_GRASSES` au lieu de la géométrie procédurale

### 3b. Nouveau `OSMRocks.tsx` (organism, ~130 lignes)
- Rochers instanciés dans les parcs ET le long des berges (waterways)
- Pour les parcs : même pattern pointInPolygon, mais grid plus large (~12m) pour des rochers épars
- Pour les berges : sampling le long des polylines waterway avec offset latéral aléatoire
- InstancedMesh par variant, scale aléatoire (0.5–2.0)

### 3c. Refonte `OSMFurniture.tsx` (organism, ~140 lignes)
- Remplacer la géométrie procédurale (BoxGeometry, CylinderGeometry) par des InstancedMesh GLB
- **Bancs** → `bench.glb` avec scale calculé pour ≈1.5m
- **Lampadaires** → `streetlight_old_double.glb` avec scale pour ≈4m
- Les données OSM (position, orientation) restent inchangées
- Conserver `getTerrainHeight` pour le Y
- Pattern identique à `InstancedModel` dans `OSMPointFeatures.tsx`

### 3d. Nouveau `OSMStaticCars.tsx` (organism, ~120 lignes)
- Voitures garées le long des routes résidentielles/tertiaires
- Sampling : parcourir les `SceneRoad[]` de type residential/tertiary,
  placer une voiture tous les ~20m sur le côté droit de la route (offset latéral)
- Variant aléatoire parmi les 5 modèles, rotation alignée sur la route
- InstancedMesh par variant, max ~200 voitures (culling par distance au joueur possible)

### 3e. Mise à jour `OSMPointFeatures.tsx`
- Ajouter les bouches d'incendie et bennes si les points OSM existent
  (sinon placer avec sampling le long des routes)
- Utiliser les nouvelles entrées de `kaykitUrban.ts`

---

## Phase 4 — Câblage & preloading

### 4a. `useAssets.ts`
Ajouter les preloads :
```typescript
KAYKIT_GRASSES.forEach(def => useGLTF.preload(def.path));
KAYKIT_ROCKS.forEach(def => useGLTF.preload(def.path));
KAYKIT_STATIC_CARS.forEach(def => useGLTF.preload(def.path));
// Les nouveaux urban sont déjà dans ALL_KAYKIT_URBAN
```

### 4b. `CanalOurcq.tsx`
Ajouter les nouveaux organisms :
```tsx
<OSMRocks parks={osmData.parks} waterways={osmData.waterways} />
<OSMStaticCars roads={osmData.roads} />
```
`GrassPatches` et `OSMFurniture` restent câblés — seule leur implémentation interne change.

---

## Fichiers touchés (résumé)

| Action | Fichier |
|--------|---------|
| **Nouveau** | `src/constants/kaykitGrass.ts` |
| **Nouveau** | `src/constants/kaykitRocks.ts` |
| **Nouveau** | `src/constants/kaykitCars.ts` |
| **Nouveau** | `src/organisms/OSMRocks.tsx` |
| **Nouveau** | `src/organisms/OSMStaticCars.tsx` |
| **Modifier** | `src/constants/kaykitForest.ts` (6 arbres + 6 buissons) |
| **Modifier** | `src/constants/kaykitUrban.ts` (bench, firehydrant, dumpster, streetlight) |
| **Modifier** | `src/atoms/GrassPatches.tsx` (triangles → GLB instances) |
| **Modifier** | `src/organisms/OSMFurniture.tsx` (procédural → GLB instances) |
| **Modifier** | `src/organisms/OSMPointFeatures.tsx` (ajout hydrants/dumpsters) |
| **Modifier** | `src/hooks/useAssets.ts` (preloads) |
| **Modifier** | `src/scenes/CanalOurcq.tsx` (câblage OSMRocks, OSMStaticCars) |

---

## Ordre d'exécution

1. Phase 1 : conversion batch GLTF → GLB (script bash)
2. Phase 2 : constantes (kaykitGrass, kaykitRocks, kaykitCars, màj kaykitUrban, màj kaykitForest)
3. Phase 3a : GrassPatches refonte
4. Phase 3b : OSMRocks nouveau
5. Phase 3c : OSMFurniture refonte
6. Phase 3d : OSMStaticCars nouveau
7. Phase 3e : OSMPointFeatures màj (hydrants/dumpsters)
8. Phase 4 : useAssets preloads + CanalOurcq câblage
9. Test `npm run dev` et vérification visuelle

---

## Contraintes CLAUDE.md respectées

- TypeScript strict, interfaces nommées pour tous les props
- InstancedMesh pour la performance (pas de mesh individuel)
- Géométries/matériaux dans `useMemo`
- Composants < 150 lignes, systems < 250 lignes
- Couleurs existantes des modèles GLB KayKit (texture intégrée) — pas de conflit avec epochs.ts
- Imports nommés Three.js uniquement
- Pas de `console.log`, pas de `any`
