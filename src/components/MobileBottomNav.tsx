import React, { useState } from 'react';
import {
  BookOpen,
  Backpack,
  Coins,
  Compass,
  Menu,
  Skull,
  Store,
  Sparkles,
  FileSpreadsheet,
  Crown,
  HelpCircle,
  X,
  Layers,
  ScrollText,
  FlaskConical,
  Package,
} from 'lucide-react';
import { sound } from '../utils/audio';

export type MainViewType =
  | 'lobby'
  | 'sheet'
  | 'inventory'
  | 'catalog'
  | 'journal'
  | 'shop'
  | 'bank'
  | 'master'
  | 'rules'
  | 'map'
  | 'bestiary'
  | 'ledger'
  | 'alchemy';

interface MobileBottomNavProps {
  activeView: MainViewType;
  onViewChange: (view: MainViewType) => void;
  activeRole: string;
  isGm: boolean;
  onOpenTutorial: () => void;
  onOpenLobby: () => void;
  charName?: string;
  inventoryCount?: number;
  criticalDurabilityCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onViewChange,
  isGm,
  onOpenTutorial,
  charName,
  inventoryCount = 0,
  criticalDurabilityCount = 0,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const isMoreViewActive = [
    'catalog',
    'journal',
    'bestiary',
    'shop',
    'rules',
    'ledger',
    'master',
    'lobby',
    'alchemy',
  ].includes(activeView);

  const handleSelectTab = (view: MainViewType) => {
    sound.playCoinClink('PRT');
    onViewChange(view);
    setIsMoreMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Drawer / Bottom Sheet do Menu "Mais" no Mobile */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="flex-1 w-full"
            onClick={() => setIsMoreMenuOpen(false)}
          />

          <div className="bg-gradient-to-b from-[#140b29] to-[#0a0514] border-t border-amber-500/40 rounded-t-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-cinzel font-bold text-amber-200">
                    Mais Painéis &amp; Guias
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Nexaria — O Legado do Abismo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition"
                aria-label="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid de Atalhos no Drawer */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Catálogo Geral de Itens */}
              <button
                type="button"
                onClick={() => handleSelectTab('catalog')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                  activeView === 'catalog'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                    : 'border-purple-950 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-amber-300 shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-cinzel font-bold text-zinc-100 truncate">
                    Catálogo
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    135 Itens &amp; Armas
                  </div>
                </div>
              </button>

              {/* Diário de Campanha & Crônicas */}
              <button
                type="button"
                onClick={() => handleSelectTab('journal')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                  activeView === 'journal'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                    : 'border-purple-950 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-600/60 flex items-center justify-center text-amber-400 shrink-0">
                  <ScrollText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-cinzel font-bold text-zinc-100 truncate">
                    Diário da Mesa
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Crônicas &amp; Eventos
                  </div>
                </div>
              </button>

              {/* Bestiário do Abismo */}
              <button
                type="button"
                onClick={() => handleSelectTab('bestiary')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                  activeView === 'bestiary'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                    : 'border-purple-950 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-300 shrink-0">
                  <Skull className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-cinzel font-bold text-zinc-100 truncate">
                    Bestiário
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Miniaturas 3D
                  </div>
                </div>
              </button>

              {/* Loja do Mestre */}
              <button
                type="button"
                onClick={() => handleSelectTab('shop')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                  activeView === 'shop'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                    : 'border-purple-950 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-300 shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-cinzel font-bold text-zinc-100 truncate">
                    Loja &amp; Bazar
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Comprar Itens
                  </div>
                </div>
              </button>

              {/* Alquimia & Forja do Ferreiro */}
              <button
                type="button"
                onClick={() => handleSelectTab('alchemy')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                  activeView === 'alchemy'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200 shadow-md ring-1 ring-emerald-500/50'
                    : 'border-purple-950 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-300 shrink-0">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-cinzel font-bold text-zinc-100 truncate">
                    Alquimia &amp; Forja
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Poções &amp; Reparo
                  </div>
                </div>
              </button>

              {/* Tabela de Regras */}
              <button
                type="button"
                onClick={() => handleSelectTab('rules')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                  activeView === 'rules'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                    : 'border-purple-950 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-300 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-cinzel font-bold text-zinc-100 truncate">
                    Tabela de Regras
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Mecânicas &amp; D20
                  </div>
                </div>
              </button>

              {/* Livro Contábil / Extrato */}
              <button
                type="button"
                onClick={() => handleSelectTab('ledger')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                  activeView === 'ledger'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                    : 'border-purple-950 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-300 shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-cinzel font-bold text-zinc-100 truncate">
                    Livro Contábil
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Extrato de Moedas
                  </div>
                </div>
              </button>

              {/* Salas & Campanhas */}
              <button
                type="button"
                onClick={() => handleSelectTab('lobby')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                  activeView === 'lobby'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                    : 'border-purple-950 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-300 shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-cinzel font-bold text-zinc-100 truncate">
                    Salas Online
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Mudar de Mesa
                  </div>
                </div>
              </button>

              {/* Painel do Mestre (exclusivo para narrador) */}
              {isGm && (
                <button
                  type="button"
                  onClick={() => handleSelectTab('master')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                    activeView === 'master'
                      ? 'border-amber-500 bg-amber-500/20 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                      : 'border-purple-950 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-amber-400 shrink-0">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-cinzel font-bold text-amber-300 truncate">
                      Painel Mestre
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      Gestão da Mesa
                    </div>
                  </div>
                </button>
              )}

              {/* Guia & Tutorial */}
              <button
                type="button"
                onClick={() => {
                  sound.playCoinClink('PRT');
                  setIsMoreMenuOpen(false);
                  onOpenTutorial();
                }}
                className="p-3 rounded-xl border border-purple-950 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-left flex items-center gap-3 transition"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-300 shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-cinzel font-bold text-zinc-100 truncate">
                    Guia &amp; Tutorial
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Como Jogar
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra Inferior Fixa (Bottom Navigation Bar) */}
      <nav
        aria-label="Navegação móvel"
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#0a0514]/95 backdrop-blur-xl border-t border-amber-500/30 px-2 py-1 flex items-center justify-around shadow-[0_-8px_25px_rgba(0,0,0,0.6)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
      >
        {/* Aba 1: Ficha */}
        <button
          type="button"
          onClick={() => handleSelectTab('sheet')}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition min-h-[44px] ${
            activeView === 'sheet'
              ? 'text-amber-300 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <BookOpen className={`w-5 h-5 transition-transform ${activeView === 'sheet' ? 'scale-110 stroke-[2.5]' : ''}`} />
            {activeView === 'sheet' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
            )}
          </div>
          <span className="text-[10px] font-cinzel tracking-wider mt-0.5 truncate max-w-[64px]">
            {charName ? charName.split(' ')[0] : 'Ficha'}
          </span>
        </button>

        {/* Aba 2: Mochila */}
        <button
          type="button"
          onClick={() => handleSelectTab('inventory')}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition min-h-[44px] ${
            activeView === 'inventory'
              ? 'text-amber-300 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Backpack className={`w-5 h-5 transition-transform ${activeView === 'inventory' ? 'scale-110 stroke-[2.5]' : ''}`} />
            {criticalDurabilityCount > 0 ? (
              <span
                className="absolute -top-1.5 -right-2 text-[9px] font-mono font-bold bg-red-600 text-white rounded-full min-w-4 h-4 px-1 flex items-center justify-center border border-red-300 shadow animate-pulse"
                title={`${criticalDurabilityCount} itens com durabilidade abaixo de 10%`}
              >
                {criticalDurabilityCount}
              </span>
            ) : inventoryCount > 0 ? (
              <span className="absolute -top-1 -right-2 text-[9px] font-mono font-bold bg-purple-700 text-purple-100 rounded-full w-4 h-4 flex items-center justify-center border border-purple-400/50">
                {inventoryCount}
              </span>
            ) : null}
            {activeView === 'inventory' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
            )}
          </div>
          <span className="text-[10px] font-cinzel tracking-wider mt-0.5">
            Mochila
          </span>
        </button>

        {/* Aba 3: Banco & Moedas */}
        <button
          type="button"
          onClick={() => handleSelectTab('bank')}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition min-h-[44px] ${
            activeView === 'bank'
              ? 'text-amber-300 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Coins className={`w-5 h-5 transition-transform ${activeView === 'bank' ? 'scale-110 stroke-[2.5]' : ''}`} />
            {activeView === 'bank' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
            )}
          </div>
          <span className="text-[10px] font-cinzel tracking-wider mt-0.5">
            Banco
          </span>
        </button>

        {/* Aba 4: Mapa de Eldria */}
        <button
          type="button"
          onClick={() => handleSelectTab('map')}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition min-h-[44px] ${
            activeView === 'map'
              ? 'text-amber-300 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Compass className={`w-5 h-5 transition-transform ${activeView === 'map' ? 'scale-110 stroke-[2.5]' : ''}`} />
            {activeView === 'map' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
            )}
          </div>
          <span className="text-[10px] font-cinzel tracking-wider mt-0.5">
            Mapa
          </span>
        </button>

        {/* Aba 5: Mais (Menu) */}
        <button
          type="button"
          onClick={() => {
            sound.playCoinClink('PRT');
            setIsMoreMenuOpen(!isMoreMenuOpen);
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition min-h-[44px] ${
            isMoreViewActive
              ? 'text-amber-300 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Menu className={`w-5 h-5 transition-transform ${isMoreViewActive ? 'scale-110 stroke-[2.5]' : ''}`} />
            {isMoreViewActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
            )}
          </div>
          <span className="text-[10px] font-cinzel tracking-wider mt-0.5">
            Mais
          </span>
        </button>
      </nav>
    </>
  );
};
