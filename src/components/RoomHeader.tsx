import React, { useState } from 'react';
import { CampaignRoom } from '../types/rpg';
import { TransactionAnimationData } from '../types/animation';
import { sound } from '../utils/audio';
import {
  Crown,
  Copy,
  Check,
  Compass,
  Coins,
  FileSpreadsheet,
  BookOpen,
  Sparkles,
  ScrollText,
  Skull,
  Share2,
  Backpack,
  Store,
  FlaskConical,
  Package,
} from 'lucide-react';

interface RoomHeaderProps {
  campaign: CampaignRoom;
  activeRole: 'gm' | string; // 'gm' or characterId
  onRoleChange: (newRole: 'gm' | string) => void;
  activeView: 'sheet' | 'bank' | 'master' | 'inventory' | 'catalog' | 'shop' | 'ledger' | 'lobby' | 'rules' | 'bestiary' | 'map' | 'journal' | 'alchemy';
  onViewChange: (view: 'sheet' | 'bank' | 'master' | 'inventory' | 'catalog' | 'shop' | 'ledger' | 'lobby' | 'rules' | 'bestiary' | 'map' | 'journal' | 'alchemy') => void;
  onOpenLobby: () => void;
  onOpenNewCharacter: () => void;
  onOpenTutorial?: () => void;
  onTriggerAnimation?: (data: TransactionAnimationData) => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  campaign,
  activeRole,
  onRoleChange,
  activeView,
  onViewChange,
  onOpenLobby,
  onOpenNewCharacter,
  onOpenTutorial,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = () => {
    sound.playCoinClink('PRT');
    navigator.clipboard.writeText(campaign.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyInviteLink = () => {
    sound.playCoinClink('ORO');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteUrl = `${origin}/nexaria?room=${encodeURIComponent(campaign.code)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const activeChar = campaign.players.find((p) => p.id === activeRole);

  const criticalDurabilityCount = (activeChar?.inventory || []).filter((item) => {
    const dur = item.durability || (item.category === 'arma' ? { current: 20, max: 20 } : undefined);
    return Boolean(dur && dur.max > 0 && (dur.current / dur.max) < 0.10);
  }).length;

  return (
    <header className="sticky top-0 z-40 bg-[#090510]/95 backdrop-blur-md border-b border-amber-600/30 shadow-lg shadow-purple-950/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        {/* Linha 1: Marca do Jogo, Sala, Papel ativo */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pb-2.5 border-b border-purple-900/40">
          {/* Marca Nexaria & Info da Campanha */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              {/* Símbolo Bússola Arcana / Estrela de 8 pontas de Nexaria com orbe púrpura */}
              <div
                onClick={() => onViewChange('lobby')}
                className="w-9 h-9 rounded-xl border border-amber-500/60 bg-gradient-to-br from-amber-950/60 via-purple-950/70 to-zinc-950 flex items-center justify-center text-amber-300 shrink-0 cursor-pointer shadow-md shadow-amber-950/50 hover:scale-105 transition"
                title="Nexaria — O Legado do Abismo"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-amber-400 stroke-2">
                  <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10Z" fill="rgba(234, 179, 8, 0.25)" />
                  <circle cx="12" cy="12" r="2.5" fill="#a855f7" stroke="#fef08a" strokeWidth="1" />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-cinzel font-black text-sm sm:text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 uppercase">
                    NEXARIA
                  </h1>
                  <span className="text-[11px] font-cinzel text-purple-300 font-bold tracking-widest hidden sm:inline">
                    &bull; O LEGADO DO ABISMO &bull;
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-sans">
                  <span className="text-amber-300 font-medium truncate max-w-[130px] sm:max-w-[180px]">
                    {campaign.name}
                  </span>
                  <span>•</span>
                  <span>Mestre: <strong className="text-zinc-200 font-medium">{campaign.gmName}</strong></span>
                  <span>•</span>
                  <span>{campaign.players.length} Fichas</span>
                </div>
              </div>
            </div>

            {/* Código da Sala com Cópia Rápida e Compartilhamento de Link */}
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-950/70 to-zinc-900/90 border border-amber-500/40 px-2.5 py-1 rounded-lg shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Mesa Conectada Online em Tempo Real" />
              <span className="text-[10px] uppercase text-purple-300 font-cinzel font-bold">
                Sala:
              </span>
              <span className="text-xs font-mono font-bold text-amber-300 tracking-wider">
                {campaign.code}
              </span>
              <button
                onClick={handleCopyCode}
                title="Copiar Código da Sala"
                className="p-1 rounded text-amber-400 hover:text-amber-200 hover:bg-amber-950/50 transition"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={handleCopyInviteLink}
                title="Copiar Link de Convite Direto para Jogadores"
                className="p-1 rounded text-purple-300 hover:text-purple-100 hover:bg-purple-900/50 transition"
              >
                {copiedLink ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Ações da Direita: Troca de Papel e Salas */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {/* Seletor de Papel / Ficha Ativa */}
            <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-purple-900/60 rounded-lg px-2 py-1">
              <span className="text-[11px] text-zinc-400 hidden sm:inline font-sans">
                Atuando como:
              </span>
              <select
                value={activeRole}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    onOpenNewCharacter();
                  } else {
                    onRoleChange(e.target.value);
                  }
                }}
                className="bg-transparent text-xs font-medium text-amber-200 focus:outline-none cursor-pointer"
              >
                <option value="gm" className="bg-zinc-900 text-amber-300">
                  👑 Mestre ({campaign.gmName})
                </option>
                {campaign.players.length > 0 && (
                  <optgroup label="Fichas de Jogadores">
                    {campaign.players.map((p) => (
                      <option key={p.id} value={p.id} className="bg-zinc-900 text-zinc-200">
                        ⚔️ {p.name} ({p.characterClass})
                      </option>
                    ))}
                  </optgroup>
                )}
                <option value="new" className="bg-zinc-900 text-zinc-300">
                  + Criar Nova Ficha...
                </option>
              </select>
            </div>

            {/* Botão de Tutorial / Guia do Jogador */}
            {onOpenTutorial && (
              <button
                type="button"
                onClick={() => {
                  sound.playCoinClink('PRT');
                  onOpenTutorial();
                }}
                className="px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-purple-950/60 to-zinc-900 text-amber-200 hover:text-amber-100 hover:border-amber-400 text-xs font-cinzel font-semibold flex items-center gap-1.5 transition shadow-sm"
                title="Abrir Guia do Jogador & Tutorial de Nexaria"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Guia</span>
              </button>
            )}
          </div>
        </div>

        {/* Linha 2: Abas de Navegação Estilizadas como Grimório & Caixa do Jogo */}
        <div className="flex items-center justify-between pt-2 gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 bg-[#120a22]/80 p-1 rounded-xl border border-purple-900/50 shrink-0">
            {/* Tab: Salas & Fichas */}
            <button
              onClick={() => onViewChange('lobby')}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition ${
                activeView === 'lobby'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-950/40'
                  : 'text-zinc-400 hover:text-amber-200 hover:bg-purple-950/40'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Salas</span>
            </button>

            {/* Tab: Ficha de Personagem */}
            <button
              onClick={() => onViewChange('sheet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition ${
                activeView === 'sheet'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-950/40'
                  : 'text-zinc-400 hover:text-amber-200 hover:bg-purple-950/40'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                Ficha {activeChar ? `(${activeChar.name.split(' ')[0]})` : ''}
              </span>
            </button>

            {/* Tab: Inventário & Mochila do Jogador */}
            <button
              onClick={() => onViewChange('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition ${
                activeView === 'inventory'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-950/40'
                  : 'text-zinc-400 hover:text-amber-200 hover:bg-purple-950/40'
              }`}
            >
              <div className="relative flex items-center">
                <Backpack className="w-3.5 h-3.5" />
                {criticalDurabilityCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-600 text-white font-mono text-[8px] font-extrabold flex items-center justify-center animate-pulse border border-red-300 shadow"
                    title={`${criticalDurabilityCount} item(ns) com durabilidade crítica (< 10%)`}
                  >
                    {criticalDurabilityCount}
                  </span>
                )}
              </div>
              <span>
                Mochila {activeChar ? `(${activeChar.inventory.length})` : ''}
              </span>
              {criticalDurabilityCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white font-mono text-[9px] font-bold animate-pulse border border-red-400 shadow flex items-center gap-0.5">
                  ⚠️ {criticalDurabilityCount}
                </span>
              )}
            </button>

            {/* Tab: Catálogo Geral de Itens */}
            <button
              onClick={() => onViewChange('catalog')}
              role="tab"
              aria-selected={activeView === 'catalog'}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition ${
                activeView === 'catalog'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-950/40'
                  : 'text-zinc-400 hover:text-amber-200 hover:bg-purple-950/40'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Catálogo (135)</span>
            </button>

            {/* Tab: Alquimia & Forja */}
            <button
              onClick={() => onViewChange('alchemy')}
              role="tab"
              aria-selected={activeView === 'alchemy'}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition ${
                activeView === 'alchemy'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold shadow-md shadow-emerald-950/40'
                  : 'text-zinc-400 hover:text-emerald-200 hover:bg-purple-950/40'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
              <span>Alquimia &amp; Forja</span>
            </button>

            {/* Tab: Diário de Campanha & Crônicas */}
            <button
              onClick={() => onViewChange('journal')}
              role="tab"
              aria-selected={activeView === 'journal'}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition ${
                activeView === 'journal'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-950/40'
                  : 'text-zinc-400 hover:text-amber-200 hover:bg-purple-950/40'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Diário {campaign.diaryEntries && campaign.diaryEntries.length > 0 ? `(${campaign.diaryEntries.length})` : ''}
              </span>
            </button>

            {/* Tab: Loja & Bazar do Mestre */}
            <button
              onClick={() => onViewChange('shop')}
              role="tab"
              aria-selected={activeView === 'shop'}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition ${
                activeView === 'shop'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-950/40'
                  : 'text-zinc-400 hover:text-amber-200 hover:bg-purple-950/40'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Loja do Mestre {campaign.marketItems.length > 0 ? `(${campaign.marketItems.length})` : ''}
              </span>
            </button>

            {/* Tab: Banco & Moedas */}
            <button
              onClick={() => onViewChange('bank')}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition ${
                activeView === 'bank'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-950/40'
                  : 'text-zinc-400 hover:text-amber-200 hover:bg-purple-950/40'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Banco &amp; Moedas</span>
            </button>

            {/* Tab: Painel do Mestre - Visível exclusivamente para o Mestre */}
            {activeRole === 'gm' && (
              <button
                onClick={() => onViewChange('master')}
                className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition ${
                  activeView === 'master'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-950/40'
                    : 'text-zinc-400 hover:text-amber-200 hover:bg-purple-950/40'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Mestre</span>
              </button>
            )}

            {/* Tab: Tabela de Referências (da imagem do jogo!) */}
            <button
              onClick={() => onViewChange('rules')}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition ${
                activeView === 'rules'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-950/40'
                  : 'text-zinc-400 hover:text-amber-200 hover:bg-purple-950/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tabela de Regras</span>
            </button>

            {/* Tab: Mapa dos Reinos de Eldria */}
            <button
              onClick={() => onViewChange('map')}
              role="tab"
              aria-selected={activeView === 'map'}
              aria-label="Abrir Mapa Múndi de Eldria e Tradutor Rúnico"
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition min-h-[38px] ${
                activeView === 'map'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-950/40'
                  : 'text-zinc-400 hover:text-amber-200 hover:bg-purple-950/40'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Mapa de Eldria</span>
            </button>

            {/* Tab: Bestiário de Monstros (com as 24 criaturas da imagem!) */}
            <button
              onClick={() => onViewChange('bestiary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition ${
                activeView === 'bestiary'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-950/40'
                  : 'text-zinc-400 hover:text-amber-200 hover:bg-purple-950/40'
              }`}
            >
              <Skull className="w-3.5 h-3.5 text-purple-400" />
              <span>Bestiário</span>
            </button>

            {/* Tab: Livro Contábil */}
            <button
              onClick={() => onViewChange('ledger')}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition ${
                activeView === 'ledger'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-950/40'
                  : 'text-zinc-400 hover:text-amber-200 hover:bg-purple-950/40'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Histórico</span>
            </button>
          </div>

          <div className="hidden xl:flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-purple-300 font-cinzel text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Nexaria Online
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
