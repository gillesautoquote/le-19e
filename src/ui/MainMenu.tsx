interface MainMenuProps {
  onStart: () => void;
}

export default function MainMenu({ onStart }: MainMenuProps) {
  return (
    <div className="main-menu">
      <h1 className="main-menu-title">Le 19e</h1>
      <p className="main-menu-subtitle">Une promenade dans le Paris qui fut</p>
      <button
        className="main-menu-start"
        onClick={onStart}
        aria-label="Commencer l'exploration"
      >
        Explorer
      </button>
      <p className="main-menu-controls">Cliquez pour vous d&eacute;placer</p>
      <p className="main-menu-version">v0.1.0</p>
    </div>
  );
}
