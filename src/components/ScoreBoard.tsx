import React from 'react';
import { Fighter, GameMode, ArenaMap } from '../types/game';
interface ScoreBoardProps {
  p1: Fighter;
  p2: Fighter;
  p1Wins: number;
  p2Wins: number;
  maxRounds: number;
  round: number;
  gameMode: GameMode;
  arena: ArenaMap;
  onlineRoomCode?: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenPause: () => void;
  onOpenControls: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}
export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  p1,
  p2,
  p1Wins,
  p2Wins,
  maxRounds,
  round,
  gameMode,
  arena,
  onlineRoomCode,
  isMuted,
  onToggleMute,
  onOpenPause,
  onOpenControls,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const neededWins = Math.ceil(maxRounds / 2);
  return (
    <div className="absolute top-0 left-0 right-0 p-3 pointer-events-none select-none z-10 flex flex-col items-center">
      {}
      <div className="w-full max-w-4xl flex items-center justify-between">
        {}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onOpenPause}
            className="w-10 h-10 rounded-xl bg-black/60 border border-white/20 backdrop-blur-md text-white font-bold flex items-center justify-center hover:bg-black/80 active:scale-95 shadow-md"
            title="Menu / Opções"
          >
            ❚❚
          </button>
          <button
            onClick={onToggleMute}
            className="w-10 h-10 rounded-xl bg-black/60 border border-white/20 backdrop-blur-md text-white font-bold flex items-center justify-center hover:bg-black/80 active:scale-95 shadow-md"
            title={isMuted ? 'Desmutar' : 'Mutar Áudio'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="w-10 h-10 rounded-xl bg-black/60 border border-white/20 backdrop-blur-md text-white font-bold text-base flex items-center justify-center hover:bg-black/80 active:scale-95 shadow-md"
              title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia Landscape 📱'}
            >
              {isFullscreen ? '⤦' : '⛶'}
            </button>
          )}
          <button
            onClick={onOpenControls}
            className="px-3 h-10 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            title="Ver controles"
          >
            <span>🎮</span> CONTROLES
          </button>
        </div>
        {}
        <div className="flex flex-col items-center bg-black/75 backdrop-blur-md border border-yellow-500/50 px-5 py-2 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            {}
            <div className="flex gap-1">
              {Array.from({ length: neededWins }).map((_, idx) => (
                <span
                  key={idx}
                  className={`text-sm ${
                    idx < p1Wins ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'text-neutral-600'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black tracking-widest text-yellow-400 uppercase">
                RODADA {round}
              </span>
              <span className="text-xs font-black text-white font-mono">
                {p1Wins} - {p2Wins}
              </span>
            </div>
            {}
            <div className="flex gap-1">
              {Array.from({ length: neededWins }).map((_, idx) => (
                <span
                  key={idx}
                  className={`text-sm ${
                    idx < p2Wins ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'text-neutral-600'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] text-neutral-300 font-semibold truncate max-w-[140px]">
              {arena.name}
            </span>
            {gameMode === 'online' && onlineRoomCode && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-yellow-400 text-black font-black font-mono">
                SALA {onlineRoomCode}
              </span>
            )}
          </div>
        </div>
        {}
        <div className="bg-black/60 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-right">
          <span className="block text-[10px] font-bold text-neutral-400 uppercase">MODO</span>
          <span className="text-xs font-black text-white">
            {gameMode === 'solo' ? 'SOLO VS IA 🤖' : 'ONLINE 🌐'}
          </span>
        </div>
      </div>
      {}
      <div className="hidden sm:flex mt-1 items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-1 rounded-full border border-white/10 text-[10px] font-medium text-neutral-300">
        <div>
          <strong className="text-sky-400">P1:</strong> [A/D] Mover | [W/Espaço ou ▲] Pular | [Mouse] Mirar | [1-4 ou J,K,L,U] Poderes
        </div>
      </div>
    </div>
  );
};
