import React, { useState, useEffect } from 'react';
import { requestFullscreenLandscape, isFullscreenActive } from '../utils/fullscreen';
export const RotateDeviceOverlay: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const checkOrientation = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isNarrow = window.innerWidth <= 900;
      setIsMobile(isTouch || isNarrow);
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
      if (!portrait) {
        setDismissed(false);
      }
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);
  if (!isMobile || !isPortrait || dismissed) return null;
  const handleActivateLandscape = async () => {
    await requestFullscreenLandscape();
    setDismissed(true);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-neutral-950 border-4 border-yellow-400 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
        {}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="w-12 h-20 border-4 border-yellow-400 rounded-2xl flex items-center justify-center animate-[spin_4s_ease-in-out_infinite]">
            <span className="text-xl">⚔️</span>
          </div>
          <span className="absolute -top-1 -right-1 text-2xl animate-bounce">🔄</span>
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">
            GIRE O CELULAR NA HORIZONTAL!
          </h3>
          <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
            O estilo <strong>Supreme Duelist Stickman</strong> foi projetado para telas na horizontal (Landscape) para visualização completa da arena e dos controles!
          </p>
        </div>
        <div className="space-y-2.5">
          <button
            onClick={handleActivateLandscape}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-110 active:scale-95 text-black font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <span>⛶</span> ATIVAR TELA CHEIA LANDSCAPE
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-bold text-xs uppercase transition-colors"
          >
            Continuar em Retrato (Vertical)
          </button>
        </div>
      </div>
    </div>
  );
};
