import { EPOCH_A } from '@/constants/epochs';

interface PlayerIndicatorData {
  px: number;
  py: number;
  rotation: number;
  theta: number;
  time: number;
  viewWidth: number;
  viewHeight: number;
}

export function drawPlayerIndicators(
  ctx: CanvasRenderingContext2D,
  data: PlayerIndicatorData,
): void {
  const { px, py, rotation, theta, time, viewWidth, viewHeight } = data;

  // View zone rectangle (aligned with camera direction)
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(-theta);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-viewWidth / 2, -viewHeight / 2, viewWidth, viewHeight);
  ctx.restore();

  // Direction triangle (shows player facing relative to camera)
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(rotation - theta);
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(-3.5, 2);
  ctx.lineTo(3.5, 2);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fill();
  ctx.restore();

  // Pulsing player dot
  const pulse = 1 + Math.sin(time * 4) * 0.25;

  ctx.beginPath();
  ctx.arc(px, py, 4 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(231, 76, 60, ${0.25 * (2 - pulse)})`;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(px, py, 3, 0, Math.PI * 2);
  ctx.fillStyle = EPOCH_A.minimapPlayer;
  ctx.fill();
  ctx.strokeStyle = EPOCH_A.minimapPlayerStroke;
  ctx.lineWidth = 1;
  ctx.stroke();
}
