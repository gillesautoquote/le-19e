import {
  EffectComposer,
  Bloom,
  Vignette,
} from '@react-three/postprocessing';

interface PostProcessingProps {
  enabled?: boolean;
}

export default function PostProcessing({ enabled = true }: PostProcessingProps) {
  if (!enabled) return null;

  return (
    <EffectComposer>
      <Bloom
        intensity={0.15}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.3}
      />
      <Vignette
        offset={0.3}
        darkness={0.4}
      />
    </EffectComposer>
  );
}
