# Thread 1 — Intégration OpenStreetMap : Résumé

## Fichiers créés

### 1. `src/types/osm.ts`
Types TypeScript pour tout le pipeline OSM :
- **GeoJSON brut** : `GeoJSONGeometry`, `GeoJSONProperties`, `GeoJSONFeature`, `GeoJSONCollection`
- **OSM parsé** : `OSMBuilding`, `OSMWaterway`, `OSMPark`, `OSMRoad`, `OSMData`
- **Scène Three.js** : `SceneBuilding`, `SceneWater`, `ScenePark`, `SceneRoad`, `SceneObjects`

### 2. `public/data/canal-ourcq.geojson`
Données OSM simulées réalistes pour la zone du canal de l'Ourcq (bbox 48.876–48.892, 2.358–2.382) :
- 1 canal (Canal de l'Ourcq — 7 points de LineString)
- 20 bâtiments (résidentiels, commerciaux, appartements, industriels) avec noms réels (MK2, Point Ephémère, Magasins Généraux)
- 3 parcs (Jardin de l'Écluse, Square de la Place de Bitche, Jardin du Bassin)
- 6 routes (Quai de la Loire, Quai de la Marne, Rue de Crimée, Rue de Thionville, Rue Petit, Avenue Jean Jaurès)

### 3. `src/utils/geoUtils.ts`
Fonctions de conversion géographique :
- `gpsToScene(lat, lng)` — GPS → coordonnées Three.js (1 unité = 1 mètre, centre = 48.8837, 2.3699)
- `sceneToGps(x, z)` — Conversion inverse
- `polygonToShape(coords)` — Polygone GPS → `THREE.Shape` pour ExtrudeGeometry
- `getBuildingHeight(feature)` — Extraction hauteur depuis tags OSM (height > building:levels × 3m > défaut 10m)
- `getBuildingColor(feature)` — Couleur EPOCH_A selon type de bâtiment OSM

### 4. `src/utils/osmParser.ts`
Parser GeoJSON → types domaine :
- `parseOSMGeoJSON(geojson)` — Sépare les features par type, nettoie les données manquantes
- Détection automatique : building, waterway, park, road
- Validation des types, gestion des coordonnées (flip GeoJSON [lng,lat] → [lat,lng])
- Largeurs de routes par défaut : primary 14m, secondary 10m, tertiary 8m, residential 6m

### 5. `src/hooks/useOSMData.ts`
Hook React pour charger les données :
- `useOSMData(geojsonPath)` — Charge, parse, et convertit en objets scène
- Retourne `{ buildings, waterways, parks, roads, isLoading, error }`
- Cache interne pour éviter les rechargements
- Support AbortController pour le cleanup

### 6. `src/systems/mapSystem.ts`
Génération de géométries Three.js :
- `buildingToGeometry(building)` — ExtrudeGeometry avec swap Y/Z pour extrusion verticale
- `waterwayToGeometry(waterway)` — Ribbon geometry (triangle strip) à partir de la ligne centrale
- `roadToGeometry(road)` — Même technique ribbon, légèrement au-dessus du sol
- `parkToGeometry(park)` — Polygone plat avec fan triangulation
- `generateSceneObjects(sceneObjects)` — Point d'entrée principal

## Fichiers non modifiés
Aucun fichier existant n'a été modifié. Tous les fichiers sont nouveaux.

## Requête Overpass API (pour données réelles)
Pour remplacer les données simulées par de vraies données OSM :

```
[out:json][timeout:30];
(
  way["building"](48.876,2.358,48.892,2.382);
  way["waterway"="canal"](48.876,2.358,48.892,2.382);
  way["leisure"="park"](48.876,2.358,48.892,2.382);
  way["highway"~"primary|secondary|tertiary|residential"](48.876,2.358,48.892,2.382);
);
out body;
>;
out skel qt;
```

URL directe : `https://overpass-api.de/api/interpreter?data=[out:json][timeout:30];(way["building"](48.876,2.358,48.892,2.382);way["waterway"="canal"](48.876,2.358,48.892,2.382);way["leisure"="park"](48.876,2.358,48.892,2.382);way["highway"~"primary|secondary|tertiary|residential"](48.876,2.358,48.892,2.382););out body;>;out skel qt;`

> Note : le résultat Overpass est en format JSON OSM, pas GeoJSON. Il faudra le convertir via un outil comme `osmtogeojson` ou via Overpass Turbo (export GeoJSON).

## Prêt pour Thread 3
Le hook `useOSMData` et le system `generateSceneObjects` sont prêts à être consommés par `CanalOurcq.tsx` dans le Thread 3 d'intégration.
