import { EPOCH_A } from '@/constants/epochs';
import { PLAYER } from '@/constants/player';

/** Procedural low-poly character fallback (no external model). */
export default function CharacterProcedural() {
  return (
    <group>
      <mesh position={[0, PLAYER.bodyY, 0]} castShadow>
        <boxGeometry args={[PLAYER.bodyWidth, PLAYER.bodyHeight, PLAYER.bodyDepth]} />
        <meshLambertMaterial color={EPOCH_A.playerBody} flatShading />
      </mesh>
      <mesh position={[0, PLAYER.headY, 0]} castShadow>
        <boxGeometry args={[PLAYER.headSize, PLAYER.headSize, PLAYER.headSize]} />
        <meshLambertMaterial color={EPOCH_A.playerHead} flatShading />
      </mesh>
      <mesh position={[-PLAYER.legOffsetX, PLAYER.legY, 0]} castShadow>
        <boxGeometry args={[PLAYER.legWidth, PLAYER.legHeight, PLAYER.legDepth]} />
        <meshLambertMaterial color={EPOCH_A.playerLegs} flatShading />
      </mesh>
      <mesh position={[PLAYER.legOffsetX, PLAYER.legY, 0]} castShadow>
        <boxGeometry args={[PLAYER.legWidth, PLAYER.legHeight, PLAYER.legDepth]} />
        <meshLambertMaterial color={EPOCH_A.playerLegs} flatShading />
      </mesh>
    </group>
  );
}
