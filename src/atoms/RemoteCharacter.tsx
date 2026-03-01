import { useMemo } from 'react';
import { BoxGeometry, MeshLambertMaterial } from 'three';
import { PLAYER } from '@/constants/player';

interface RemoteCharacterProps {
  bodyColor: string;
  headColor: string;
  legsColor: string;
}

/** Memoized geometries shared across all remote characters */
function useCharacterGeometries() {
  return useMemo(() => ({
    body: new BoxGeometry(PLAYER.bodyWidth, PLAYER.bodyHeight, PLAYER.bodyDepth),
    head: new BoxGeometry(PLAYER.headSize, PLAYER.headSize, PLAYER.headSize),
    leg: new BoxGeometry(PLAYER.legWidth, PLAYER.legHeight, PLAYER.legDepth),
  }), []);
}

export default function RemoteCharacter({ bodyColor, headColor, legsColor }: RemoteCharacterProps) {
  const geo = useCharacterGeometries();

  const bodyMat = useMemo(
    () => new MeshLambertMaterial({ color: bodyColor, flatShading: true }),
    [bodyColor],
  );
  const headMat = useMemo(
    () => new MeshLambertMaterial({ color: headColor, flatShading: true }),
    [headColor],
  );
  const legsMat = useMemo(
    () => new MeshLambertMaterial({ color: legsColor, flatShading: true }),
    [legsColor],
  );

  return (
    <group>
      <mesh position={[0, PLAYER.bodyY, 0]} geometry={geo.body} material={bodyMat} castShadow />
      <mesh position={[0, PLAYER.headY, 0]} geometry={geo.head} material={headMat} castShadow />
      <mesh
        position={[-PLAYER.legOffsetX, PLAYER.legY, 0]}
        geometry={geo.leg}
        material={legsMat}
        castShadow
      />
      <mesh
        position={[PLAYER.legOffsetX, PLAYER.legY, 0]}
        geometry={geo.leg}
        material={legsMat}
        castShadow
      />
    </group>
  );
}
