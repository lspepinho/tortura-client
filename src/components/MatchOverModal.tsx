import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CharacterId, CHARACTERS } from '../types/game';
import { sounds } from '../audio/soundManager';
interface MatchOverModalProps {
  winnerSlot: 1 | 2;
  winnerName: string;
  winnerCharacter: CharacterId;
  p1Score: number;
  p2Score: number;
  onRematch: () => void;
  onBackToMenu: () => void;
}
export const MatchOverModal: React.FC<MatchOverModalProps> = ({
  winnerSlot,
  winnerName,
  winnerCharacter,
  p1Score,
  p2Score,
  onRematch,
  onBackToMenu,
}) => {
  const config = CHARACTERS[winnerCharacter];
  useEffect(() => {
    sounds.playVictory();
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: [config.color, config.accentColor, '#ffffff', '#fbbf24'],
      });
    } catch {
    }
  }, [config]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200">
      <div className="w-full max-w-md bg-neutral-950 border-4 border-yellow-500 rounded-3xl p-6 text-center shadow-2xl space-y-6">
        {}
        <div className="text-6xl animate-bounce">👑</div>
        <div>
          <span className="text-xs font-black text-yellow-400 uppercase tracking-widest block mb-1">
            CAMPEÃO DO DUELO!
          </span>
          <h2
            className="text-4xl font-black uppercase tracking-tight"
            style={{ color: config.color }}
          >
            {winnerName}
          </h2>
          <span className="text-sm font-bold text-neutral-300">
            jogando de {config.name} ({config.title})
          </span>
        </div>
        {}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-center gap-6">
          <div className="text-center">
            <span className="text-[10px] text-neutral-400 block font-bold">JOGADOR 1</span>
            <span className="text-3xl font-black text-white font-mono">{p1Score}</span>
          </div>
          <span className="text-xl font-black text-yellow-400">VS</span>
          <div className="text-center">
            <span className="text-[10px] text-neutral-400 block font-bold">JOGADOR 2</span>
            <span className="text-3xl font-black text-white font-mono">{p2Score}</span>
          </div>
        </div>
        {}
        <div className="space-y-3">
          <button
            onClick={onRematch}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black text-lg uppercase tracking-wider shadow-xl hover:brightness-110 active:scale-95 transition-all"
          >
            JOGAR REVANCHE! ⚔️
          </button>
          <button
            onClick={onBackToMenu}
            className="w-full py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider transition-all"
          >
            Menu Principal 🏠
          </button>
        </div>
      </div>
    </div>
  );
};
