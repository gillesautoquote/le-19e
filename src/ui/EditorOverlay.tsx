import { useEditorStore } from '@/store/editorStore';

const PANEL: React.CSSProperties = {
  position: 'fixed',
  top: 8,
  right: 8,
  background: 'rgba(20, 20, 40, 0.85)',
  color: '#fff',
  fontFamily: 'monospace',
  fontSize: 11,
  padding: '8px 12px',
  borderRadius: 4,
  zIndex: 200,
  lineHeight: 1.6,
  border: '1px solid rgba(100, 100, 255, 0.3)',
  minWidth: 200,
  pointerEvents: 'none',
};

const MODE_COLORS: Record<string, string> = {
  translate: 'rgba(80, 200, 80, 0.9)',
  rotate: 'rgba(80, 80, 255, 0.9)',
  scale: 'rgba(255, 200, 80, 0.9)',
};

const BADGE: React.CSSProperties = {
  position: 'fixed',
  top: 8,
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(255, 80, 80, 0.8)',
  color: '#fff',
  fontFamily: 'monospace',
  fontSize: 12,
  fontWeight: 'bold',
  padding: '4px 12px',
  borderRadius: 4,
  zIndex: 200,
  letterSpacing: '0.1em',
  pointerEvents: 'none',
};

export default function EditorOverlay() {
  const enabled = useEditorStore((s) => s.enabled);
  const selectedObject = useEditorStore((s) => s.selectedObject);
  const transformMode = useEditorStore((s) => s.transformMode);

  if (!enabled) return null;

  const objName = selectedObject?.name || selectedObject?.type || 'none';
  const objId = selectedObject?.uuid?.slice(0, 8) ?? '--';
  const pos = selectedObject?.position;
  const posStr = pos
    ? `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`
    : '--';

  return (
    <>
      <div style={BADGE}>EDITOR</div>
      <div style={PANEL}>
        <div style={{ marginBottom: 6, fontWeight: 'bold' }}>Editor Mode</div>
        <div>
          Mode:{' '}
          <span style={{ color: MODE_COLORS[transformMode] }}>
            {transformMode.toUpperCase()}
          </span>
        </div>
        <div style={{ marginTop: 4 }}>Selected: {objName}</div>
        <div>UUID: {objId}</div>
        <div>Pos: {posStr}</div>
        <div style={{ marginTop: 8, opacity: 0.5, fontSize: 10 }}>
          T=translate  R=rotate  S=scale
          <br />
          Click=select  Esc=deselect  E=exit
        </div>
      </div>
    </>
  );
}
