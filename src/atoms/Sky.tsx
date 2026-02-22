import { Sky as DreiSky } from '@react-three/drei';

interface SkyProps {
  sunPosition?: [number, number, number];
}

export default function Sky({ sunPosition = [1, 0.3, 0] }: SkyProps) {
  return (
    <DreiSky
      sunPosition={sunPosition}
      turbidity={8}
      rayleigh={0.5}
      mieCoefficient={0.005}
      mieDirectionalG={0.8}
    />
  );
}
