# Thread 4 — UI & Interface — Summary

## Fichiers cr\u00e9\u00e9s

### `src/styles/ui.css`
- Variables CSS globales (`--ui-bg`, `--ui-border`, `--ui-text`, `--ui-accent`, `--ui-radius`, `--ui-font`)
- Body reset (margin, background, overflow)
- Classes pour tous les composants UI : `.minimap`, `.mute-btn`, `.loading-screen`, `.main-menu`, `.epoch-indicator`
- Keyframe `ui-fade-in` partag\u00e9e
- Animations d'entr\u00e9e d\u00e9cal\u00e9es pour le menu principal (title \u2192 subtitle \u2192 bouton \u2192 controls)
- Tooltips, transitions, \u00e9tats hover

### `src/ui/LoadingScreen.tsx`
- \u00c9cran de chargement fond noir avec titre "Le 19e" et sous-titre
- Barre de progression anim\u00e9e (couleur accent `#4ECDC4`, glow effect)
- Citations po\u00e9tiques sur Paris qui alternent toutes les 3 secondes avec fondu
- Transition de sortie : fondu CSS quand `isLoaded = true`
- Props : `progress: number`, `isLoaded: boolean`

### `src/ui/MainMenu.tsx`
- \u00c9cran de d\u00e9marrage minimaliste, fond noir
- Titre "Le 19e" en grand, sous-titre po\u00e9tique "Une promenade dans le Paris qui fut"
- Bouton "Explorer" avec bordure fine, effets hover
- Indication controles en petit, version en bas
- Animations d'entr\u00e9e d\u00e9cal\u00e9es (staggered fade-in)
- Props : `onStart: () => void`

### `src/ui/EpochIndicator.tsx`
- Indicateur d'\u00e9poque en haut \u00e0 gauche
- Affiche "Paris, 2024" (\u00e9poque A) ou "Paris, 2089" (\u00e9poque B)
- Cach\u00e9 par d\u00e9faut en \u00e9poque A (MVP) via classe `epoch-indicator--hidden`
- Lit l'\u00e9poque depuis `worldStore.epoch`

## Fichiers modifi\u00e9s

### `src/ui/Minimap.tsx`
- Canvas 180x180px (avant : 200x100px)
- Fond semi-transparent arrondi via conteneur div avec classe CSS
- Zones de quai dessin\u00e9es avec couleurs distinctes
- Canal repr\u00e9sent\u00e9 en bleu-vert semi-transparent
- B\u00e2timents : 24 rectangles beiges g\u00e9n\u00e9r\u00e9s de fa\u00e7on d\u00e9terministe dans les zones de construction
- Point joueur rouge pulsant (animation canvas temps-bas\u00e9e)
- Triangle directionnel orient\u00e9 selon la rotation du joueur
- Rectangle de zone de vue autour du joueur
- Clic sur la minimap pour t\u00e9l\u00e9porter le joueur (optionnel impl\u00e9ment\u00e9)
- Mapping nord-en-haut (Z invers\u00e9 pour orientation naturelle)

### `src/ui/MuteButton.tsx`
- Remplacement du texte "Son: ON/OFF" par des ic\u00f4nes SVG (onde sonore / barr\u00e9)
- Bouton 44x44px (r\u00e8gle accessibilit\u00e9 mobile)
- Tooltip au hover ("Son activ\u00e9" / "Son d\u00e9sactiv\u00e9")
- Transitions douces sur hover et sur l'ic\u00f4ne
- Style via classes CSS au lieu de styles inline

### `src/App.tsx`
- Import de `@/styles/ui.css` pour les styles globaux
- Remplacement de `StartScreen` par `MainMenu`
- Ajout de `LoadingScreen` et `EpochIndicator`
- Flux : LoadingScreen \u2192 MainMenu \u2192 Game
- Simulation de chargement progressif pour le MVP
- Transition fluide : le loading screen s'efface pour r\u00e9v\u00e9ler le menu

## Fichiers NON touch\u00e9s

- Aucun fichier 3D (atoms, molecules, organisms, scenes)
- Aucun store (playerStore, worldStore, audioStore)
- Aucun system (playerSystem, cameraSystem, audioSystem)
- `src/ui/StartScreen.tsx` conserv\u00e9 mais plus import\u00e9 (remplac\u00e9 par MainMenu)

## R\u00e8gles respect\u00e9es

- TypeScript strict : toutes les props typ\u00e9es avec des interfaces nomm\u00e9es
- UI en dehors du Canvas (DOM classique, pas dans R3F)
- CSS vanilla uniquement, pas de librairie externe
- Accessibilit\u00e9 : `aria-label` sur tous les \u00e9l\u00e9ments interactifs, zones cliquables \u2265 44x44px
- Couleurs 3D issues de `epochs.ts` (utilis\u00e9es dans le canvas minimap)
- Composants UI < 150 lignes chacun
