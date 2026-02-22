import type { ThreeElements } from '@react-three/fiber';

// R3F v8 extends global JSX.IntrinsicElements, but @types/react@19
// moved JSX into React.JSX. This augmentation bridges the gap.
declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

declare module 'react/jsx-dev-runtime' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
