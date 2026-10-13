import React, { useState } from 'react';
import { ARENAS } from '../game/arenas';
import { sounds } from '../audio/soundManager';
interface LobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (playerName: string, maxRounds: number, mapIndex: number) => void;
  onJoinRoom: (code: string, playerName: string) => void;
  roomData: {
    code: string;
    hostId: string;
    players: Record<string, { id: string; name: string; character: string; slot: 1 | 2 }>;
  } | null;
  currentSocketId: string | null;
  onStartOnlineMatch: () => void;
  errorMessage?: string | null;
}
export const LobbyModal: React.FC<LobbyModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  roomData,
  currentSocketId,
  onStartOnlineMatch,
  errorMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState<string>('Guerreiro');
  const [joinCode, setJoinCode] = useState<string>('');
  const [maxRounds, setMaxRounds] = useState<number>(3);
  const [selectedMapIndex, setSelectedMapIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  if (!isOpen) return null;
  const handleCopyCode = () => {
    if (!roomData?.code) return;
    navigator.clipboard.writeText(roomData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const isHost = roomData && currentSocketId && roomData.hostId === currentSocketId;
  const playersCount = roomData ? Object.keys(roomData.players).length : 0;
  const isRoomFull = playersCount >= 2;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-neutral-950 border-4 border-yellow-500 rounded-3xl p-6 shadow-2xl flex flex-col">
        {}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <span>🌐</span> MULTIPLAYER ONLINE
            </h2>
            <p className="text-xs text-neutral-400">Jogue com amigos em salas privadas em tempo real!</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>
        {}
        {roomData ? (
          <div className="space-y-5">
            {}
            <div className="bg-neutral-900 border-2 border-yellow-500/80 rounded-2xl p-4 flex items-center justify-between shadow-inner">
              <div>
                <span className="text-[11px] font-bold uppercase text-neutral-400 tracking-wider">
                  Código da Sala Privada
                </span>
                <div className="text-4xl font-black text-yellow-400 font-mono tracking-widest">
                  {roomData.code}
                </div>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase shadow transition-all active:scale-95"
              >
                {copied ? '✓ COPIADO!' : 'COPIAR CÓDIGO'}
              </button>
            </div>
            {}
            <div className="bg-neutral-900/60 rounded-2xl p-4 border border-neutral-800 space-y-3">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Jogadores Conectados ({playersCount}/2)
              </h3>
              <div className="space-y-2">
                {Object.values(roomData.players).map((p) => {
                  const isMe = p.id === currentSocketId;
                  const isRoomHost = p.id === roomData.hostId;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between bg-black/40 border border-neutral-800 px-3.5 py-2.5 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-yellow-500 text-black font-black flex items-center justify-center text-xs">
                          P{p.slot}
                        </span>
                        <div>
                          <span className="text-sm font-bold text-white">
                            {p.name} {isMe && '(Você)'}
                          </span>
                          {isRoomHost && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              LÍDER
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-green-400 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Conectado
                      </span>
                    </div>
                  );
                })}
                {playersCount < 2 && (
                  <div className="border-2 border-dashed border-neutral-800 rounded-xl p-4 text-center">
                    <span className="text-xs text-neutral-400 animate-pulse">
                      Aguardando adversário entrar com o código...
                    </span>
                  </div>
                )}
              </div>
            </div>
            {}
            {isHost ? (
              <button
                onClick={onStartOnlineMatch}
                disabled={!isRoomFull}
                className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider transition-all shadow-xl ${
                  isRoomFull
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:brightness-110 active:scale-95 shadow-yellow-500/20'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {isRoomFull ? 'INICIAR PARTIDA! ⚔️' : 'AGUARDANDO 2º JOGADOR...'}
              </button>
            ) : (
              <div className="text-center py-3 text-sm text-yellow-400 font-bold animate-pulse">
                Aguardando o Líder da sala iniciar o combate...
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {errorMessage && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-xs font-bold text-center">
                {errorMessage}
              </div>
            )}
            {}
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Seu Nome de Lutador:
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={15}
                className="w-full bg-neutral-900 border-2 border-neutral-700 focus:border-yellow-400 rounded-xl px-4 py-2.5 text-white font-bold outline-none transition-colors"
                placeholder="Ex: Arthur Destruidor"
              />
            </div>
            {}
            <div className="flex border-b border-neutral-800">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-3 font-black text-sm uppercase transition-colors border-b-2 ${
                  activeTab === 'create'
                    ? 'border-yellow-400 text-yellow-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Criar Sala Privada
              </button>
              <button
                onClick={() => setActiveTab('join')}
                className={`flex-1 py-3 font-black text-sm uppercase transition-colors border-b-2 ${
                  activeTab === 'join'
                    ? 'border-yellow-400 text-yellow-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Entrar com Código
              </button>
            </div>
            {activeTab === 'create' ? (
              <div className="space-y-4">
                {}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Formato da Partida:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMaxRounds(3)}
                      className={`p-3 rounded-xl border-2 font-bold text-xs transition-all ${
                        maxRounds === 3
                          ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                      }`}
                    >
                      Melhor de 3 Rodadas (2 Vitórias)
                    </button>
                    <button
                      onClick={() => setMaxRounds(5)}
                      className={`p-3 rounded-xl border-2 font-bold text-xs transition-all ${
                        maxRounds === 5
                          ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                      }`}
                    >
                      Melhor de 5 Rodadas (3 Vitórias)
                    </button>
                  </div>
                </div>
                {}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Arena Inicial:
                  </label>
                  <select
                    value={selectedMapIndex}
                    onChange={(e) => setSelectedMapIndex(Number(e.target.value))}
                    className="w-full bg-neutral-900 border-2 border-neutral-700 focus:border-yellow-400 rounded-xl px-4 py-2.5 text-white font-bold outline-none"
                  >
                    {ARENAS.map((arena, idx) => (
                      <option key={arena.id} value={idx}>
                        {arena.name} ({arena.subtitle})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => onCreateRoom(playerName, maxRounds, selectedMapIndex)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black text-base uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  CRIAR SALA E GERAR CÓDIGO 🚀
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Digite o Código da Sala (4 letras):
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={4}
                    placeholder="EX: DUEL"
                    className="w-full bg-neutral-900 border-2 border-neutral-700 focus:border-yellow-400 rounded-xl px-4 py-3 text-yellow-400 font-mono text-2xl font-black text-center tracking-widest outline-none uppercase"
                  />
                </div>
                <button
                  onClick={() => onJoinRoom(joinCode, playerName)}
                  disabled={joinCode.trim().length < 4}
                  className={`w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider transition-all shadow-lg ${
                    joinCode.trim().length >= 4
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:brightness-110 active:scale-95'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  ENTRAR NA SALA ⚔️
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
