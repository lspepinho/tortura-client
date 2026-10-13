import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CHARACTERS, Fighter } from '../types/game';
interface VirtualControlsProps {
  fighter: Fighter;
  enemy?: Fighter;
  onMove: (dx: number, dy: number) => void;
  onAim: (ax: number, ay: number) => void;
  onJump: () => void;
  onPower: (powerIndex: number) => void;
  onPause: () => void;
  isPlayerTwo?: boolean;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}
export const VirtualControls: React.FC<VirtualControlsProps> = ({
  fighter,
  enemy,
  onMove,
  onAim,
  onJump,
  onPower,
  onPause,
  isPlayerTwo = false,
  onToggleFullscreen,
  isFullscreen = false,
}) => {
  const touchAreaRef = useRef<HTMLDivElement>(null);
  const charConfig = CHARACTERS[fighter.character];
  const [isStickActive, setIsStickActive] = useState<boolean>(false);
  const [stickOrigin, setStickOrigin] = useState<{ x: number; y: number }>({ x: 90, y: 0 });
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAimingUp, setIsAimingUp] = useState<boolean>(false);
  const activeTouchIdRef = useRef<number | null>(null);
  const stickOriginRef = useRef<{ x: number; y: number }>({ x: 90, y: 0 });
  const lastAnalogJumpRef = useRef<boolean>(false);
  const MAX_RADIUS = 54;
  const triggerHaptic = useCallback((duration = 20) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
      }
    }
  }, []);
  useEffect(() => {
    const area = touchAreaRef.current;
    if (!area) return;
    const handleTouchStart = (e: TouchEvent) => {
      if (activeTouchIdRef.current !== null) return;
      const touch = e.changedTouches[0];
      activeTouchIdRef.current = touch.identifier;
      const rect = area.getBoundingClientRect();
      const originX = touch.clientX - rect.left;
      const originY = touch.clientY - rect.top;
      stickOriginRef.current = { x: originX, y: originY };
      setStickOrigin({ x: originX, y: originY });
      setIsStickActive(true);
      setKnobPos({ x: 0, y: 0 });
      lastAnalogJumpRef.current = false;
      triggerHaptic(15);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (activeTouchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchIdRef.current) {
          const areaRect = area.getBoundingClientRect();
          const currentX = touch.clientX - areaRect.left;
          const currentY = touch.clientY - areaRect.top;
          let dx = currentX - stickOriginRef.current.x;
          let dy = currentY - stickOriginRef.current.y;
          const dist = Math.hypot(dx, dy);
          if (dist > MAX_RADIUS) {
            dx = (dx / dist) * MAX_RADIUS;
            dy = (dy / dist) * MAX_RADIUS;
          }
          setKnobPos({ x: dx, y: dy });
          const normX = dx / MAX_RADIUS;
          const normY = dy / MAX_RADIUS;
          onMove(normX, normY);
          if (dist > 8) {
            onAim(normX, normY);
          }
          if (normY < -0.48) {
            setIsAimingUp(true);
            if (!lastAnalogJumpRef.current) {
              lastAnalogJumpRef.current = true;
              onJump();
              triggerHaptic(22);
            }
          } else {
            setIsAimingUp(false);
            if (normY > -0.32) {
              lastAnalogJumpRef.current = false;
            }
          }
          break;
        }
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchIdRef.current) {
          activeTouchIdRef.current = null;
          setIsStickActive(false);
          setKnobPos({ x: 0, y: 0 });
          setIsAimingUp(false);
          lastAnalogJumpRef.current = false;
          onMove(0, 0);
          break;
        }
      }
    };
    area.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      area.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onMove, onAim, onJump, triggerHaptic]);
  const handlePowerPress = (index: number) => {
    if (fighter.cooldowns[index] > 0) return;
    triggerHaptic(25);
    if (enemy && Math.abs(knobPos.x) < 12 && Math.abs(knobPos.y) < 12) {
      const dx = enemy.x - fighter.x;
      const dy = (enemy.y - 28) - (fighter.y - 28);
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        onAim(dx / dist, dy / dist);
      }
    }
    onPower(index);
  };
  const handleJumpPress = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    triggerHaptic(25);
    onJump();
  };
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden safe-area-landscape">
      {}
      <div className="absolute top-3 left-3 pointer-events-auto flex items-center gap-2 z-30">
        <button
          onClick={onPause}
          className="w-11 h-11 rounded-xl bg-black/60 backdrop-blur-md border-2 border-white/70 flex items-center justify-center text-white active:scale-95 shadow-xl transition-all"
          title="Pausar Jogo"
        >
          <span className="font-black text-lg tracking-tighter">❚❚</span>
        </button>
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="w-11 h-11 rounded-xl bg-black/60 backdrop-blur-md border-2 border-yellow-400/80 flex items-center justify-center text-yellow-300 active:scale-95 shadow-xl text-base font-black transition-all"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          >
            {isFullscreen ? '⤦' : '⛶'}
          </button>
        )}
      </div>
      {}
      <div
        ref={touchAreaRef}
        className="absolute left-0 bottom-0 w-[46vw] h-[82vh] pointer-events-auto touch-none"
      >
        {}
        <div
          style={{
            transform: isStickActive
              ? `translate(${stickOrigin.x - 72}px, ${stickOrigin.y - 72}px)`
              : `translate(32px, calc(100% - 170px))`,
          }}
          className={`absolute pointer-events-none w-36 h-36 rounded-full border-4 transition-opacity duration-150 flex items-center justify-center shadow-2xl ${
            isStickActive
              ? 'opacity-95 border-sky-400 bg-sky-950/40 backdrop-blur-sm shadow-sky-500/20'
              : 'opacity-40 border-sky-400/50 bg-sky-950/20'
          }`}
        >
          {}
          <div
            className={`absolute top-1 text-center flex flex-col items-center transition-transform ${
              isAimingUp ? 'scale-125 text-yellow-300 font-black' : 'text-sky-300/80 font-bold'
            }`}
          >
            <span className="text-sm">▲</span>
            <span className="text-[8px] tracking-tight uppercase">Pular</span>
          </div>
          <span className="absolute bottom-1.5 text-sky-300/70 text-xs font-bold">▼</span>
          <span className="absolute left-1.5 text-sky-300/70 text-xs font-bold">◀</span>
          <span className="absolute right-1.5 text-sky-300/70 text-xs font-bold">▶</span>
          {}
          <div className="absolute w-16 h-0.5 bg-sky-400/25 pointer-events-none" />
          <div className="absolute h-16 w-0.5 bg-sky-400/25 pointer-events-none" />
          {}
          <div
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
            className={`w-16 h-16 rounded-full border-3 flex items-center justify-center shadow-lg transition-transform duration-75 ${
              isAimingUp
                ? 'bg-gradient-to-b from-yellow-400 to-amber-500 border-white shadow-yellow-400/50 scale-110'
                : 'bg-gradient-to-b from-sky-400 to-blue-600 border-white shadow-blue-500/50'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white/70 shadow-inner" />
          </div>
        </div>
        {}
        {!isStickActive && (
          <div className="absolute bottom-4 left-8 text-neutral-400/60 text-[10px] font-bold uppercase tracking-wider pointer-events-none">
            Toque e arraste p/ mover e mirar (▲ Pula)
          </div>
        )}
      </div>
      {}
      <div className="absolute right-3 bottom-3 pointer-events-auto flex items-end gap-3 z-30">
        {}
        <div className="flex flex-col items-center gap-1 mb-2">
          <button
            onTouchStart={handleJumpPress}
            onMouseDown={handleJumpPress}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-emerald-400 via-teal-500 to-emerald-700 border-3 border-white text-white font-black flex flex-col items-center justify-center shadow-2xl active:scale-90 active:brightness-125 transition-transform"
            title="Pular (Também pode empurrar o analógico para cima!)"
          >
            <span className="text-2xl leading-none">⬆</span>
            <span className="text-[10px] uppercase tracking-wider drop-shadow-md">PULAR</span>
          </button>
          <span className="text-[8px] font-bold text-emerald-300/80 uppercase">ou Analógico ▲</span>
        </div>
        {}
        <div className="grid grid-cols-2 gap-3 mb-1">
          {charConfig.powers.map((pow, idx) => {
            const cooldown = fighter.cooldowns[idx];
            const maxCd = fighter.maxCooldowns[idx];
            const isOnCd = cooldown > 0;
            const cdFraction = isOnCd ? cooldown / maxCd : 0;
            return (
              <button
                key={pow.id}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handlePowerPress(idx);
                }}
                onClick={() => handlePowerPress(idx)}
                disabled={isOnCd}
                style={{
                  borderColor: isOnCd ? '#525252' : pow.color,
                  boxShadow: isOnCd ? 'none' : `0 4px 16px ${pow.color}40`,
                }}
                className={`relative w-17 h-17 sm:w-19 sm:h-19 rounded-2xl border-3 flex flex-col items-center justify-center text-white transition-all active:scale-90 overflow-hidden ${
                  isOnCd
                    ? 'bg-neutral-900/90 opacity-60'
                    : 'bg-neutral-950/85 backdrop-blur-md active:brightness-125'
                }`}
              >
                {}
                {isOnCd && (
                  <div
                    className="absolute inset-x-0 bottom-0 bg-red-950/80 pointer-events-none transition-all duration-75"
                    style={{ height: `${cdFraction * 100}%` }}
                  />
                )}
                {}
                <span className="text-2xl sm:text-3xl z-10 filter drop-shadow-md">{pow.icon}</span>
                {}
                <span className="text-[9px] sm:text-[10px] font-black z-10 leading-tight truncate max-w-[58px] uppercase tracking-tight">
                  {isOnCd ? `${cooldown.toFixed(1)}s` : pow.shortName}
                </span>
                {}
                {!isOnCd && (
                  <span
                    style={{ backgroundColor: pow.color }}
                    className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full animate-ping opacity-75"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
