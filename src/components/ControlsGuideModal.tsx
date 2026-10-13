import React from 'react';
interface ControlsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export const ControlsGuideModal: React.FC<ControlsGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-neutral-950 border-4 border-yellow-400 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎮</span>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                CONTROLES MELHORADOS NO PC
              </h2>
              <p className="text-xs text-neutral-400">
                Layout de ação otimizado com mira a laser no Mouse e movimentação fluida!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        {}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {}
            <div className="bg-neutral-900 border-2 border-sky-500/70 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="font-black text-sky-400 text-sm">P1: TECLADO + MOUSE (RECOMENDADO)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                  MELHOR MIRA
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-xl">
                  <span className="text-neutral-300">Andar (Esquerda/Direita):</span>
                  <div className="flex gap-1 font-mono font-bold text-white">
                    <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">A</kbd>
                    <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">D</kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-xl">
                  <span className="text-neutral-300">Pular / Pulo Duplo:</span>
                  <div className="flex gap-1 font-mono font-bold text-white">
                    <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">W</kbd>
                    <span className="text-neutral-500 font-sans">ou</span>
                    <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">Espaço</kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-xl">
                  <span className="text-neutral-300">Mergulhar / Descer Rápido:</span>
                  <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono font-bold text-white">
                    S
                  </kbd>
                </div>
                <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-xl">
                  <span className="text-neutral-300">Mirar arma (360°):</span>
                  <span className="font-bold text-yellow-400">Mouse na Tela 🖱️</span>
                </div>
                <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-xl border border-yellow-500/20">
                  <span className="text-neutral-300 font-bold">Poder 1:</span>
                  <div className="flex gap-1 font-mono font-bold text-yellow-300">
                    <span>Clique Esquerdo</span>
                    <span className="text-neutral-500 font-sans">/</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-white">J</kbd>
                    <span className="text-neutral-500 font-sans">/</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-white">1</kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-xl border border-yellow-500/20">
                  <span className="text-neutral-300 font-bold">Poder 2:</span>
                  <div className="flex gap-1 font-mono font-bold text-yellow-300">
                    <span>Clique Direito</span>
                    <span className="text-neutral-500 font-sans">/</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-white">K</kbd>
                    <span className="text-neutral-500 font-sans">/</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-white">2</kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-xl">
                  <span className="text-neutral-300 font-bold">Poder 3:</span>
                  <div className="flex gap-1 font-mono font-bold text-white">
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700">E</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700">F</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700">L</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700">3</kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-xl">
                  <span className="text-neutral-300 font-bold">Poder 4 (Ultimate):</span>
                  <div className="flex gap-1 font-mono font-bold text-white">
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700">Q</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700">R</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700">Shift</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700">4</kbd>
                  </div>
                </div>
              </div>
            </div>
            {}
            <div className="bg-neutral-900 border-2 border-yellow-500/70 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="font-black text-yellow-400 text-sm">DICAS DE COMBATE & COMBOS</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold">
                  PRO TIPS ⚔️
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="bg-black/40 p-2.5 rounded-xl space-y-1">
                  <span className="font-bold text-sky-400 block">💥 Pulo Acrobático com Salto Duplo:</span>
                  <p className="text-neutral-300 leading-relaxed text-[11px]">
                    Aperte Pular duas vezes no ar para ativar o giro ragdoll supremo e alcançar plataformas elevadas!
                  </p>
                </div>
                <div className="bg-black/40 p-2.5 rounded-xl space-y-1">
                  <span className="font-bold text-orange-400 block">🔥 Foguete a Jato com Peido Quente:</span>
                  <p className="text-neutral-300 leading-relaxed text-[11px]">
                    Como Arthur, aponte a mira para baixo e use o Peido Quente para ser lançado aos céus e escapar do abismo!
                  </p>
                </div>
                <div className="bg-black/40 p-2.5 rounded-xl space-y-1">
                  <span className="font-bold text-purple-400 block">🌾 Recuo da Espingarda de Arroz:</span>
                  <p className="text-neutral-300 leading-relaxed text-[11px]">
                    Como Lucas, o disparo da escopeta empurra você para trás. Use esse recuo para fazer manobras aéreas!
                  </p>
                </div>
              </div>
            </div>
          </div>
          {}
          <div className="bg-gradient-to-r from-sky-950/60 to-purple-950/60 border-2 border-emerald-400/80 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="font-black text-emerald-400 text-sm flex items-center gap-2">
                <span>📱</span> CONTROLES MOBILE & TOUCH SUPREME
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                100% FLUIDO
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-black/50 p-3 rounded-xl space-y-1">
                <span className="font-bold text-sky-400 block">🕹️ Analógico Dinâmico 360° (Esquerda):</span>
                <p className="text-neutral-300 leading-relaxed text-[11px]">
                  Toque em qualquer lugar da metade esquerda da tela. O manche aparece direto sob o seu polegar!
                  Arraste para mover e mirar sua arma em 360°.
                </p>
              </div>
              <div className="bg-black/50 p-3 rounded-xl space-y-1">
                <span className="font-bold text-emerald-400 block">⬆️ Pulo Duplo Supremo:</span>
                <p className="text-neutral-300 leading-relaxed text-[11px]">
                  <strong>2 formas de pular:</strong> empurre o analógico para cima <strong>(▲)</strong> OU toque no botão redondo <strong>PULAR ⬆</strong> na direita!
                </p>
              </div>
              <div className="bg-black/50 p-3 rounded-xl space-y-1">
                <span className="font-bold text-amber-400 block">🎯 Mira Inteligente nos Poderes:</span>
                <p className="text-neutral-300 leading-relaxed text-[11px]">
                  Ao tocar nos 4 poderes na direita, se você não estiver mirando manualmente, o ataque mira automaticamente no oponente!
                </p>
              </div>
              <div className="bg-black/50 p-3 rounded-xl space-y-1">
                <span className="font-bold text-purple-400 block">📳 Resposta Tátil & Tela Cheia:</span>
                <p className="text-neutral-300 leading-relaxed text-[11px]">
                  Vibração háptica ao tocar nos poderes e botão de <strong>Tela Cheia Landscape</strong> no topo para visão total sem barras!
                </p>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-base uppercase tracking-wider shadow-lg active:scale-95 transition-all"
        >
          TUDO PRONTO, VAMOS COMBATER! ⚔️
        </button>
      </div>
    </div>
  );
};
