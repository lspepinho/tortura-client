import React from 'react';
import { GameMode, AiDifficulty } from '../types/game';
interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  onRestartMatch: () => void;
  onSelectMode: (mode: GameMode) => void;
  currentMode: GameMode;
  aiDifficulty: AiDifficulty;
  onChangeAiDifficulty: (diff: AiDifficulty) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenOnlineLobby: () => void;
  showHitboxes?: boolean;
  onToggleHitboxes?: () => void;
}
export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  onResume,
  onRestartMatch,
  onSelectMode,
  currentMode,
  aiDifficulty,
  onChangeAiDifficulty,
  isMuted,
  onToggleMute,
  onOpenOnlineLobby,
  showHitboxes = false,
  onToggleHitboxes,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-neutral-950 border-4 border-yellow-500 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>⏸️</span> JOGO PAUSADO
          </h2>
          <button
            onClick={onResume}
            className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>
        {}
        <div className="space-y-2.5">
          <button
            onClick={onResume}
            className="w-full py-3.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-base uppercase tracking-wider shadow-lg active:scale-95 transition-all"
          >
            CONTINUAR BATALHA ▶️
          </button>
          <button
            onClick={onRestartMatch}
            className="w-full py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm uppercase tracking-wider transition-all"
          >
            Reiniciar Partida 🔄
          </button>
        </div>
        {}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
            Escolher Modo de Jogo:
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onSelectMode('solo')}
              className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                currentMode === 'solo'
                  ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300 shadow-md'
                  : 'border-neutral-800 bg-black/40 text-neutral-400 hover:text-white'
              }`}
            >
              Solo vs IA 🤖
            </button>
            <button
              onClick={() => {
                onResume();
                onOpenOnlineLobby();
              }}
              className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                currentMode === 'online'
                  ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300 shadow-md'
                  : 'border-neutral-800 bg-black/40 text-neutral-400 hover:text-white'
              }`}
            >
              Online 🌐
            </button>
          </div>
          {}
          {currentMode === 'solo' && (
            <div className="pt-2 border-t border-neutral-800">
              <span className="text-[11px] font-bold text-neutral-400 block mb-1.5">
                Dificuldade da IA:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['facil', 'medio', 'insano'] as AiDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => onChangeAiDifficulty(d)}
                    className={`py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                      aiDifficulty === d
                        ? 'bg-yellow-500 text-black font-black'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {d === 'facil' ? 'Fácil' : d === 'medio' ? 'Médio' : 'Insano 🔥'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-2">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
            Guia de Controles (PC & Mobile):
          </span>
          <div className="text-[11px] text-neutral-300 space-y-1.5 leading-relaxed">
            <p>
              <strong className="text-sky-400">P1 (Teclado):</strong> Mover: <strong>A / D</strong> |
              Pular: <strong>W / Espaço</strong> | Poderes 1 a 4: <strong>1, 2, 3, 4</strong> ou{' '}
              <strong>J, K, L, U</strong>.
            </p>
            <p>
              <strong className="text-amber-400">P2 (Teclado Local):</strong> Mover: <strong>Setas ◀ ▶</strong> |
              Pular: <strong>Seta ▲</strong> | Poderes: <strong>Num 1, 2, 3, 4</strong> ou{' '}
              <strong>U, I, O, P</strong>.
            </p>
            <p>
              <strong className="text-green-400">Mobile / Touch:</strong> Use o joystick virtual no canto inferior esquerdo para mover/pular e os 4 botões de poder no canto direito!
            </p>
            <p>
              <strong className="text-pink-400">Visualizar Hitboxes:</strong> Pressione a tecla <strong>H</strong> ou o botão abaixo para inspecionar as hitboxes dos mapas em tempo real!
            </p>
          </div>
        </div>
        {}
        {onToggleHitboxes && (
          <button
            onClick={onToggleHitboxes}
            className={`w-full py-2.5 rounded-xl border text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${
              showHitboxes
                ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            <span>🎯 HITBOXES DOS MAPAS: {showHitboxes ? 'LIGADAS (VISÍVEIS)' : 'DESLIGADAS (PADRÃO)'}</span>
          </button>
        )}
        {}
        <button
          onClick={onToggleMute}
          className="w-full py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors"
        >
          <span>{isMuted ? '🔇 ÁUDIO MUTADO (CLIQUE P/ ATIVAR)' : '🔊 ÁUDIO ATIVADO (CLIQUE P/ MUTAR)'}</span>
        </button>
      </div>
    </div>
  );
};
