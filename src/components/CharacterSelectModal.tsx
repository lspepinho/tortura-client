import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CharacterId, CHARACTERS, GameMode } from '../types/game';
import { sounds } from '../audio/soundManager';
interface CharacterSelectModalProps {
  round: number;
  gameMode: GameMode;
  initialP1Char: CharacterId;
  initialP2Char: CharacterId;
  onConfirm: (p1Char: CharacterId, p2Char: CharacterId) => void;
  isOnlineWaiting?: boolean;
  onlinePlayerSlot?: 1 | 2;
  opponentSelected?: boolean;
}
export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  round,
  gameMode,
  initialP1Char,
  initialP2Char,
  onConfirm,
  isOnlineWaiting = false,
  onlinePlayerSlot = 1,
  opponentSelected = false,
}) => {
  const [p1Char, setP1Char] = useState<CharacterId>(initialP1Char);
  const [p2Char, setP2Char] = useState<CharacterId>(() => {
    if (gameMode === 'solo') {
      return initialP1Char === 'arthur' ? 'lucas' : 'arthur';
    }
    return initialP2Char;
  });
  const [timer, setTimer] = useState<number>(7);
  const [lockedIn, setLockedIn] = useState<boolean>(false);
  const p1CharRef = useRef<CharacterId>(p1Char);
  p1CharRef.current = p1Char;
  const p2CharRef = useRef<CharacterId>(p2Char);
  p2CharRef.current = p2Char;
  const lockedInRef = useRef<boolean>(lockedIn);
  lockedInRef.current = lockedIn;
  const handleConfirm = useCallback(() => {
    if (lockedInRef.current) return;
    setLockedIn(true);
    lockedInRef.current = true;
    sounds.playBeep(true);
    const p1Selected = p1CharRef.current;
    const p2Selected = gameMode === 'solo'
      ? (p1Selected === 'arthur' ? 'lucas' : 'arthur')
      : p2CharRef.current;
    onConfirm(p1Selected, p2Selected);
  }, [onConfirm, gameMode]);
  useEffect(() => {
    if (lockedIn) return;
    if (timer <= 0) {
      handleConfirm();
      return;
    }
    if (timer <= 3) {
      sounds.playBeep(false);
    }
    const timeout = setTimeout(() => {
      setTimer((t) => t - 1);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [timer, lockedIn, handleConfirm]);
  const renderCharacterCard = (
    charId: CharacterId,
    isPlayerSelected: boolean,
    isBotSelected: boolean,
    onSelect: () => void,
    playerLabel: string,
    badgeColor: string
  ) => {
    const config = CHARACTERS[charId];
    return (
      <div
        onClick={() => {
          if (!lockedIn) {
            sounds.playHit(0.7);
            onSelect();
          }
        }}
        className={`relative flex-1 cursor-pointer rounded-2xl p-5 border-4 transition-all duration-200 transform ${
          isPlayerSelected
            ? 'border-yellow-400 bg-neutral-900/95 shadow-2xl scale-[1.02] ring-4 ring-yellow-400/30'
            : isBotSelected
            ? 'border-purple-500/70 bg-neutral-900/80 shadow-lg'
            : 'border-neutral-700 bg-neutral-900/70 hover:border-neutral-500 opacity-80 hover:opacity-100'
        }`}
      >
        {}
        {isPlayerSelected && (
          <div
            className="absolute -top-3 left-4 px-3 py-0.5 rounded-full text-xs font-black uppercase text-black shadow-md tracking-wider flex items-center gap-1"
            style={{ backgroundColor: badgeColor }}
          >
            <span>👑</span> {playerLabel}
          </div>
        )}
        {}
        {isBotSelected && (
          <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-xs font-black uppercase bg-purple-600 text-white shadow-md tracking-wider flex items-center gap-1 border border-purple-400">
            <span>🤖</span> BOT DA IA
          </div>
        )}
        {}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 border-white/20"
            style={{ backgroundColor: config.color }}
          >
            {charId === 'arthur' ? '🧢' : '🥋'}
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-wide">{config.name}</h3>
            <span className="text-xs font-semibold text-yellow-300">{config.title}</span>
          </div>
        </div>
        <p className="text-xs text-neutral-300 mb-4 italic">{config.description}</p>
        {}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase text-neutral-400 tracking-wider">
            Poderes Únicos:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {config.powers.map((pow) => (
              <div
                key={pow.id}
                className="bg-black/50 border border-white/10 rounded-xl p-2.5 flex items-start gap-2 hover:border-white/30 transition-colors"
              >
                <span className="text-2xl mt-0.5">{pow.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-xs font-bold text-white truncate">{pow.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono">
                      {pow.cooldown}s
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-300 line-clamp-2 leading-tight mt-0.5">
                    {pow.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  const isSolo = gameMode === 'solo';
  const playerChoice = gameMode === 'online' ? (onlinePlayerSlot === 1 ? p1Char : p2Char) : p1Char;
  const botChoice: CharacterId = playerChoice === 'arthur' ? 'lucas' : 'arthur';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-neutral-950 border-4 border-yellow-500/80 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-yellow-500 text-black font-black text-xs tracking-wider">
                RODADA {round}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ESCOLHA SEU PERSONAGEM!
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              {isSolo
                ? 'Escolha seu guerreiro! O Bot da IA jogará automaticamente com o personagem oposto.'
                : 'A cada rodada você pode trocar de personagem para surpreender o adversário!'}
            </p>
          </div>
          {}
          <div className="flex flex-col items-center justify-center bg-neutral-900 border-2 border-yellow-400 px-4 py-2 rounded-2xl shadow-inner">
            <span className="text-[10px] font-bold text-neutral-400">INÍCIO EM</span>
            <span className="text-3xl font-black text-yellow-400 font-mono">{timer}s</span>
          </div>
        </div>
        {}
        <div className="flex flex-col md:flex-row gap-5 mb-6">
          {}
          {renderCharacterCard(
            'arthur',
            playerChoice === 'arthur',
            isSolo && botChoice === 'arthur',
            () => {
              if (gameMode === 'online') {
                if (onlinePlayerSlot === 1) setP1Char('arthur');
                else setP2Char('arthur');
              } else {
                setP1Char('arthur');
                setP2Char('lucas');
              }
            },
            gameMode === 'online' ? 'Você' : 'Você (P1)',
            '#38bdf8'
          )}
          {}
          {renderCharacterCard(
            'lucas',
            playerChoice === 'lucas',
            isSolo && botChoice === 'lucas',
            () => {
              if (gameMode === 'online') {
                if (onlinePlayerSlot === 1) setP1Char('lucas');
                else setP2Char('lucas');
              } else {
                setP1Char('lucas');
                setP2Char('arthur');
              }
            },
            gameMode === 'online' ? 'Você' : 'Você (P1)',
            '#f59e0b'
          )}
        </div>
        {}
        {gameMode === 'online' && (
          <div className="mb-4 text-center">
            {opponentSelected ? (
              <span className="text-xs text-green-400 font-bold">
                ✓ Adversário já escolheu! Pronto para o combate!
              </span>
            ) : (
              <span className="text-xs text-neutral-400 font-medium animate-pulse">
                Aguardando escolha do adversário...
              </span>
            )}
          </div>
        )}
        {}
        {isSolo && (
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-neutral-900 to-purple-950/70 border-2 border-purple-500/50 flex items-center justify-between text-xs shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-pulse">🤖</span>
              <div>
                <span className="text-purple-200 font-bold block">
                  Duelo dos Opostos (1v1):
                </span>
                <span className="text-neutral-300 text-[11px]">
                  Você escolheu{' '}
                  <strong className={playerChoice === 'arthur' ? 'text-sky-400 font-black' : 'text-amber-400 font-black'}>
                    {playerChoice === 'arthur' ? 'Arthur' : 'Lucas'}
                  </strong>
                  . O Bot da IA enfrentará você como{' '}
                  <strong className={botChoice === 'arthur' ? 'text-sky-400 font-black' : 'text-amber-400 font-black'}>
                    {botChoice === 'arthur' ? 'Arthur' : 'Lucas'}
                  </strong>
                  !
                </span>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase text-purple-200 bg-purple-900/90 border border-purple-400/50 px-3 py-1.5 rounded-xl shadow">
              Bot Oposto ⚔️
            </span>
          </div>
        )}
        {}
        <button
          onClick={handleConfirm}
          disabled={lockedIn}
          className={`w-full py-4 rounded-2xl font-black text-lg sm:text-xl uppercase tracking-wider text-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${
            lockedIn
              ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:brightness-110 shadow-yellow-500/20'
          }`}
        >
          <span>{lockedIn ? 'AGUARDANDO RODADA...' : 'PRONTO PARA A BATALHA! ⚔️'}</span>
        </button>
      </div>
    </div>
  );
};
