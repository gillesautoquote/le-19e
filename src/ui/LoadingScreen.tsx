import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  progress: number;
  isLoaded: boolean;
}

const QUOTES: string[] = [
  '\u00ab Paris est une f\u00eate. \u00bb \u2014 Ernest Hemingway',
  '\u00ab Fluctuat nec mergitur \u00bb',
  '\u00ab Il est des canaux qui ne m\u00e8nent nulle part, sinon \u00e0 soi-m\u00eame. \u00bb',
  '\u00ab Le temps ne passe pas, il se prom\u00e8ne. \u00bb',
];

export default function LoadingScreen({ progress, isLoaded }: LoadingScreenProps) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteFading, setQuoteFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteFading(true);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        setQuoteFading(false);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`loading-screen ${isLoaded ? 'loading-screen--hidden' : ''}`}
      aria-label="Chargement en cours"
    >
      <h1 className="loading-title">Le 19e</h1>
      <p className="loading-subtitle">19e arrondissement de Paris</p>
      <div className="loading-bar-track" role="progressbar" aria-valuenow={Math.round(progress)}>
        <div
          className="loading-bar-fill"
          style={{ width: `${Math.round(progress)}%` }}
        />
      </div>
      <p className={`loading-quote ${quoteFading ? 'loading-quote--fade' : ''}`}>
        {QUOTES[quoteIndex]}
      </p>
    </div>
  );
}
