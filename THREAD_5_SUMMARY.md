# Thread 5 — Données exhaustives OSM + Paris Data : Résumé

## Fichiers créés (13)

### Données
| Fichier | Contenu |
|---|---|
| `public/data/canal-ourcq-full.geojson` | GeoJSON complet : 29 bâtiments, 1 canal, 2 écluses, 4 parcs/jardins, 9 routes, 18 bancs, 28 lampadaires, 8 fontaines (3 Wallace), 12 poubelles, 12 stations Vélib', 6 arrêts de bus, 5 feux, 10 commerces, 5 péniches, 24 arbres |
| `public/data/paris-trees-19e.json` | 50 arbres Paris Data : 24 platanes (quai nord), 10 marronniers (quai sud), 16 tilleuls/robiniers/érables (parcs) |

### Atoms (composants 3D)
| Fichier | Description |
|---|---|
| `src/atoms/StreetFurniture.tsx` | Banc low poly (assise bois + pieds métal) + poubelle (cylindre vert + couvercle) |
| `src/atoms/WallaceFountain.tsx` | Fontaine Wallace (base octogonale, 4 cariatides, dôme) + fontaine standard simple |
| `src/atoms/Velib.tsx` | Vélo low poly sur dock (roues torus, cadre, selle) — `count` prop pour rangées |
| `src/atoms/TrafficLight.tsx` | Feu tricolore : poteau + boîtier avec 3 cercles colorés |
| `src/atoms/Shop.tsx` | Devanture : auvent coloré par type + panneau enseigne + poteaux |
| `src/atoms/Barge.tsx` | Péniche : coque + pont bois + cabine + timonerie + cheminée. Variante bateau-mouche |
| `src/atoms/Lock.tsx` | Écluse : 2 portes bois sur charnières + murs latéraux + bittes d'amarrage. Prop `isOpen` |
| `src/atoms/BusFurniture.tsx` | Abribus : toit + panneaux vitrés semi-transparents + poteau RATP + panneau |

### Molecules (assemblages)
| Fichier | Description |
|---|---|
| `src/molecules/BikeStation.tsx` | Station Vélib' complète : rail + vélos (60% capacité) + terminal de paiement |
| `src/molecules/BusStop.tsx` | Arrêt de bus : abribus + données nom/lignes (prêt pour Html labels) |
| `src/molecules/ShopFront.tsx` | Devanture commerce : délègue à Shop atom (prêt pour hover/interaction) |

## Fichiers modifiés (5)

### `src/types/osm.ts`
+15 nouvelles interfaces : `OSMBench`, `OSMLamp`, `OSMFountain`, `OSMVelib`, `OSMBusStop`, `OSMTrafficLight`, `OSMShop`, `OSMBarge`, `OSMLock`, `OSMWasteBin`, `OSMTree`, `ParisTree`, `ParisTreeRaw`, `ParisTreeCollection`
+13 interfaces scène : `ScenePointObject`, `SceneBench`, `SceneLamp`, `SceneFountain`, `SceneVelib`, `SceneBusStop`, `SceneTrafficLight`, `SceneShop`, `SceneBarge`, `SceneLock`, `SceneWasteBin`, `SceneTree`
`OSMData` et `SceneObjects` enrichis avec tous les nouveaux champs.

### `src/utils/osmParser.ts`
Réécrit complètement :
- `extractPointCoords()` — nouveau extracteur pour les Points GeoJSON
- 12 nouveaux détecteurs : `isBench`, `isLamp`, `isFountain`, `isVelib`, `isBusStop`, `isTrafficLight`, `isShop`, `isBarge`, `isLock`, `isWasteBin`, `isTree`
- 12 nouveaux parsers typés correspondants
- `isWaterway` corrigé (exclut les locks qui sont des Points)
- `isRoad` corrigé (exclut `street_lamp`, `bus_stop`, `traffic_signals`, `crossing`)
- `isPark` enrichi (accepte aussi `leisure=garden`)
- `CANAL_DEFAULT_WIDTH` changé de 30 à 35m (plus réaliste)
- Largeurs route cycleway (3m) et footway (2m) ajoutées

### `src/hooks/useOSMData.ts`
- Accepte maintenant un 2e paramètre optionnel `treesPath` pour Paris Data
- Charge GeoJSON et arbres en parallèle (`Promise.all`)
- Convertit les 15 types d'objets en coordonnées scène
- Retourne 15 champs au lieu de 4 : `{ buildings, waterways, parks, roads, benches, lamps, fountains, velibs, busStops, trafficLights, shops, barges, locks, wasteBins, trees, isLoading, error }`
- Fusionne arbres OSM + arbres Paris Data

### `src/systems/mapSystem.ts`
- `GeneratedScene` enrichi avec les 11 types point-based (passés tels quels aux atoms)
- `generateSceneObjects()` passe les données point-based en pass-through

### `src/constants/epochs.ts`
+36 nouvelles couleurs par époque (EPOCH_A + EPOCH_B) :
- Mobilier urbain : banc bois/métal, lampadaire, poubelle
- Fontaines : Wallace vert bouteille, standard gris-bleu
- Transport : Vélib' vert, abribus argenté/verre, panneau RATP violet, feux tricolores
- Péniches : coque brun, cabine crème, tour-boat bleu
- Écluses : bois sombre, métal
- Commerces : 8 couleurs par type (café, restaurant, bar, boulangerie, pharmacie, convenience, cinéma, autre)
- Routes : 6 couleurs par type (primary → cycleway)

## Requête Overpass complète

Pour extraire les vraies données OSM (remplacer les données simulées) :

```
[out:json][timeout:60];
(
  way["building"](48.876,2.358,48.892,2.382);
  relation["building"]["type"="multipolygon"](48.876,2.358,48.892,2.382);
  way["waterway"="canal"](48.876,2.358,48.892,2.382);
  way["waterway"="lock"](48.876,2.358,48.892,2.382);
  node["waterway"="lock_gate"](48.876,2.358,48.892,2.382);
  way["highway"~"primary|secondary|tertiary|residential|footway|cycleway|path"](48.876,2.358,48.892,2.382);
  way["leisure"~"park|garden"](48.876,2.358,48.892,2.382);
  way["landuse"~"grass|meadow"](48.876,2.358,48.892,2.382);
  node["amenity"="bench"](48.876,2.358,48.892,2.382);
  node["highway"="street_lamp"](48.876,2.358,48.892,2.382);
  node["amenity"="waste_basket"](48.876,2.358,48.892,2.382);
  node["amenity"="drinking_water"](48.876,2.358,48.892,2.382);
  node["amenity"="bicycle_rental"](48.876,2.358,48.892,2.382);
  node["highway"="bus_stop"](48.876,2.358,48.892,2.382);
  node["highway"="traffic_signals"](48.876,2.358,48.892,2.382);
  node["amenity"~"cafe|restaurant|bar"](48.876,2.358,48.892,2.382);
  node["shop"](48.876,2.358,48.892,2.382);
  node["waterway"="boat"](48.876,2.358,48.892,2.382);
  node["natural"="tree"](48.876,2.358,48.892,2.382);
);
out body;
>;
out skel qt;
```

## Vérification
- **0 erreur TypeScript** — projet entier (pas seulement Thread 5)
- Aucun fichier hors périmètre modifié
- Tous les atoms utilisent `MeshLambertMaterial` + `flatShading`
- Toutes les couleurs viennent de `epochs.ts`
- Toutes les géométries dans `useMemo`
- Aucun composant > 150 lignes

## Prêt pour intégration
Le hook `useOSMData` retourne tous les types nécessaires.
Le thread d'intégration peut maintenant appeler :
```tsx
const data = useOSMData('/data/canal-ourcq-full.geojson', '/data/paris-trees-19e.json');
```
et rendre chaque type d'objet avec l'atom/molecule correspondant.
