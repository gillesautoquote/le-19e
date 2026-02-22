import { useRef, useEffect, type MouseEvent } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { useCameraStore } from '@/store/cameraStore';
import { useStreamingStore } from '@/store/streamingStore';
import { MINIMAP_SIZE, worldToMinimap, minimapToWorld, drawMinimap } from '@/ui/minimapDraw';

export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const t = performance.now() * 0.001;

      const { merged } = useStreamingStore.getState();
      const { position, rotation } = usePlayerStore.getState();
      const { theta } = useCameraStore.getState();
      const pp = worldToMinimap(position[0], position[2]);

      drawMinimap(ctx, { merged, playerPos: pp, rotation, theta, time: t });
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = MINIMAP_SIZE / rect.width;
    const scaleY = MINIMAP_SIZE / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Undo the rotation applied to the minimap canvas
    const { position } = usePlayerStore.getState();
    const { theta } = useCameraStore.getState();
    const pp = worldToMinimap(position[0], position[2]);
    const dx = mx - pp.x;
    const dy = my - pp.y;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const origX = pp.x + dx * cos - dy * sin;
    const origY = pp.y + dx * sin + dy * cos;

    const worldPos = minimapToWorld(origX, origY);
    usePlayerStore.getState().setTargetPosition(worldPos);
  };

  return (
    <div className="minimap" aria-label="Mini-carte">
      <canvas
        ref={canvasRef}
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
        onClick={handleClick}
      />
    </div>
  );
}
