import React, { useState, useMemo } from 'react';
import {
  ALL_ABYSS_CREATURES,
  BESTIARY_COLLECTIONS,
  BESTIARY_CATEGORIES,
  CREATURE_TYPES_FILTER,
  CREATURE_SIZES_FILTER,
  MonsterCreature,
  BestiaryCollection,
} from '../data/abyssBestiary';
import { CampaignRoom, CurrencyType, ExternalActionPayload } from '../types/rpg';
import { CoinVisual } from './CoinVisual';
import { sound } from '../utils/audio';
import {
  Skull,
  Shield,
  Heart,
  Zap,
  Search,
  Swords,
  Coins,
  Sparkles,
  Award,
  BookOpen,
  Filter,
  Layers,
  Dices,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  ChevronRight,
  Crosshair,
} from 'lucide-react';

interface AbyssBestiaryViewProps {
  campaign: CampaignRoom;
  activeRole: string;
  onExecuteTransaction?: (params: {
    senderId: string;
    senderName: string;
    receiverId: string;
    receiverName: string;
    currency: CurrencyType;
    amount: number;
    reason: string;
  }) => boolean;
  onApplyExternalAction?: (
    characterId: string,
    action: ExternalActionPayload
  ) => Promise<boolean>;
}

export const AbyssBestiaryView: React.FC<AbyssBestiaryViewProps> = ({
  campaign,
  activeRole,
  onExecuteTransaction,
  onApplyExternalAction,
}) => {
  const isGm = activeRole === 'gm';

  // Filtros principais
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedThreat, setSelectedThreat] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Seleção e Combate
  const [selectedCreature, setSelectedCreature] = useState<MonsterCreature | null>(
    ALL_ABYSS_CREATURES[0]
  );
  const [lootTargetPlayerId, setLootTargetPlayerId] = useState<string>(
    campaign.players[0] ? campaign.players[0].id : 'all'
  );
  const [combatTargetPlayerId, setCombatTargetPlayerId] = useState<string>(
    campaign.players[0] ? campaign.players[0].id : ''
  );

  // Rolagem de Dados de Combate do Monstro
  const [lastRoll, setLastRoll] = useState<{
    attackName: string;
    d20Result: number;
    bonusNumber: number;
    totalToHit: number;
    damageRoll: number;
    damageFormula: string;
    damageType: string;
    isCritical: boolean;
  } | null>(null);

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Filtragem das categorias disponíveis de acordo com a coleção
  const availableCategories = useMemo(() => {
    if (selectedCollection === 'all') {
      return BESTIARY_CATEGORIES;
    }
    return [
      BESTIARY_CATEGORIES[0],
      ...BESTIARY_CATEGORIES.filter((c) => 'collection' in c && c.collection === selectedCollection),
    ];
  }, [selectedCollection]);

  // Lista filtrada
  const filteredCreatures = useMemo(() => {
    return ALL_ABYSS_CREATURES.filter((c) => {
      // Coleção
      if (selectedCollection !== 'all' && c.collection !== selectedCollection) {
        return false;
      }
      // Subcategoria
      if (selectedCategory !== 'all' && c.category !== selectedCategory) {
        return false;
      }
      // Ameaça
      if (selectedThreat !== 'all' && c.threatLevel !== selectedThreat) {
        return false;
      }
      // Tipo de criatura
      if (selectedType !== 'all' && c.creatureType !== selectedType) {
        return false;
      }
      // Porte / Tamanho
      if (selectedSize !== 'all' && c.size !== selectedSize) {
        return false;
      }
      // Busca textual
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesLore = c.lore.toLowerCase().includes(q);
        const matchesCat = c.categoryLabel.toLowerCase().includes(q);
        const matchesType = c.creatureType.toLowerCase().includes(q);
        const matchesNumber = c.number.toString() === q || `#${c.number}` === q;
        const matchesAttacks = c.attacks.some((a) =>
          a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesLore && !matchesCat && !matchesType && !matchesNumber && !matchesAttacks) {
          return false;
        }
      }
      return true;
    });
  }, [selectedCollection, selectedCategory, selectedThreat, selectedType, selectedSize, searchQuery]);

  // Resetar categoria ao trocar de coleção se não pertencer mais
  const handleSelectCollection = (colId: string) => {
    setSelectedCollection(colId);
    setSelectedCategory('all');
    sound.playDiceRoll();
  };

  // Rolar ataque do monstro
  const handleRollAttack = (
    att: { name: string; bonus: string; damage: string; damageType?: string }
  ) => {
    sound.playDiceRoll();
    const d20 = Math.floor(Math.random() * 20) + 1;
    const bonusMatch = att.bonus.match(/([+-]?\d+)/);
    const bonus = bonusMatch ? parseInt(bonusMatch[1], 10) : 0;
    const totalHit = d20 + bonus;
    const isCrit = d20 === 20;

    // Estimar ou rolar dano básico a partir da string (ex: '2d8+3')
    let calculatedDamage = 8;
    const diceMatch = att.damage.match(/(\d+)d(\d+)(?:([+-])(\d+))?/i);
    if (diceMatch) {
      const numDice = parseInt(diceMatch[1], 10);
      const dieSides = parseInt(diceMatch[2], 10);
      const sign = diceMatch[3] === '-' ? -1 : 1;
      const mod = diceMatch[4] ? parseInt(diceMatch[4], 10) * sign : 0;
      let sum = 0;
      for (let i = 0; i < (isCrit ? numDice * 2 : numDice); i++) {
        sum += Math.floor(Math.random() * dieSides) + 1;
      }
      calculatedDamage = Math.max(1, sum + mod);
    }

    setLastRoll({
      attackName: att.name,
      d20Result: d20,
      bonusNumber: bonus,
      totalToHit: totalHit,
      damageRoll: calculatedDamage,
      damageFormula: att.damage,
      damageType: att.damageType || 'Físico',
      isCritical: isCrit,
    });
  };

  // Causar dano direto ao jogador selecionado (apenas Mestre)
  const handleApplyDamageToPlayer = async () => {
    if (!isGm || !onApplyExternalAction || !combatTargetPlayerId || !selectedCreature) {
      return;
    }

    const targetPlayer = campaign.players.find((p) => p.id === combatTargetPlayerId);
    if (!targetPlayer) return;

    const damageToDeal = lastRoll ? lastRoll.damageRoll : 10;
    const attackUsed = lastRoll ? lastRoll.attackName : selectedCreature.attacks[0]?.name || 'Ataque';

    sound.playVitalsChange('damage');

    const success = await onApplyExternalAction(combatTargetPlayerId, {
      actionType: 'monster_attack',
      sourceName: `${selectedCreature.name} (#${selectedCreature.number})`,
      amount: damageToDeal,
      targetVitals: 'hp',
      damageType: lastRoll?.damageType || 'Físico',
      details: `Ataque "${attackUsed}" do monstro ${selectedCreature.name}`,
    });

    if (success) {
      setFeedbackMessage(
        `Dano de ${damageToDeal} PV aplicado a ${targetPlayer.name}!`
      );
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  // Conceder espólio
  const handleGrantLoot = (creature: MonsterCreature) => {
    if (!onExecuteTransaction) return;

    sound.playCoinClink(creature.lootCurrency);

    if (lootTargetPlayerId === 'all') {
      if (campaign.players.length === 0) {
        alert('Nenhum jogador na sala para receber o espólio!');
        return;
      }
      campaign.players.forEach((p) => {
        onExecuteTransaction({
          senderId: 'gm',
          senderName: `Mestre (${campaign.gmName})`,
          receiverId: p.id,
          receiverName: p.name,
          currency: creature.lootCurrency,
          amount: creature.lootAmount,
          reason: `Espólio por derrotar ${creature.name} (#${creature.number})`,
        });
      });
      setFeedbackMessage(
        `Espólio de +${creature.lootAmount} ${creature.lootCurrency} concedido a todos os jogadores!`
      );
      setTimeout(() => setFeedbackMessage(null), 4000);
    } else {
      const targetChar = campaign.players.find((p) => p.id === lootTargetPlayerId);
      if (!targetChar) return;
      onExecuteTransaction({
        senderId: 'gm',
        senderName: `Mestre (${campaign.gmName})`,
        receiverId: targetChar.id,
        receiverName: targetChar.name,
        currency: creature.lootCurrency,
        amount: creature.lootAmount,
        reason: `Espólio por derrotar ${creature.name} (#${creature.number})`,
      });
      setFeedbackMessage(
        `Espólio de +${creature.lootAmount} ${creature.lootCurrency} entregue a ${targetChar.name}!`
      );
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-14">
      {/* Banner Superior Principal de Nexaria */}
      <div className="relative rounded-2xl border border-amber-600/40 bg-gradient-to-r from-purple-950/90 via-[#0b0817] to-purple-950/90 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 top-0 w-96 h-32 bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-950/40 text-[11px] font-cinzel font-semibold tracking-wider text-amber-300 uppercase mb-2">
              <Skull className="w-3.5 h-3.5 text-purple-400" />
              <span>Bestiário Oficial de Nexaria &amp; Miniaturas do Abismo</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-cinzel font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100">
              BESTIÁRIO DO ABISMO
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-3xl font-sans leading-relaxed">
              Catálogo completo das <strong>{ALL_ABYSS_CREATURES.length} miniaturas oficiais</strong> extraídas das tabelas de Nexaria e Eldria: lendas do folclore europeu, mortos-vivos, entidades elementais, monstruosidades cibernéticas, feras das 9 regiões e horrores colossais com atributos de combate e espólios em moedas oficiais.
            </p>
          </div>

          {/* Campo de Busca Rápida */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar monstro, nº, ataque, tipo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/90 border border-purple-900/60 rounded-xl pl-9 pr-8 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setSelectedCollection('all');
                setSelectedCategory('all');
                setSelectedThreat('all');
                setSelectedType('all');
                setSelectedSize('all');
                setSearchQuery('');
                sound.playDiceRoll();
              }}
              className="px-3 py-2.5 rounded-xl border border-zinc-700/60 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs flex items-center justify-center gap-1.5 transition shrink-0"
              title="Redefinir todos os filtros"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          </div>
        </div>

        {/* Abas das 5 Coleções Principais de Miniaturas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mt-6 pt-5 border-t border-purple-900/40">
          {BESTIARY_COLLECTIONS.map((col) => {
            const isSelected = selectedCollection === col.id;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => handleSelectCollection(col.id)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1 relative overflow-hidden ${
                  isSelected
                    ? 'border-amber-500 bg-gradient-to-br from-amber-500/20 via-purple-900/40 to-zinc-950 text-white shadow-lg shadow-purple-950/60 ring-1 ring-amber-500/60'
                    : 'border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-800/60 hover:border-purple-800/60 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {col.badge}
                  </span>
                  {isSelected && <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
                </div>
                <div>
                  <h4 className={`text-xs font-cinzel font-bold mt-1 ${
                    isSelected ? 'text-amber-200' : 'text-zinc-200'
                  }`}>
                    {col.name}
                  </h4>
                  <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5 font-sans">
                    {col.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Barra de Filtros Refinados: Subcategoria, Ameaça, Tipo e Tamanho */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-purple-900/30 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400 font-cinzel font-semibold mr-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Filtros:</span>
          </div>

          {/* Seletor de Subcategoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-zinc-900/90 border border-purple-900/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            {availableCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Seletor de Nível de Ameaça */}
          <select
            value={selectedThreat}
            onChange={(e) => setSelectedThreat(e.target.value)}
            className="bg-zinc-900/90 border border-purple-900/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todas as Ameaças</option>
            <option value="Iniciante">Iniciante</option>
            <option value="Intermediário">Intermediário</option>
            <option value="Ameaça Maior">Ameaça Maior</option>
            <option value="Chefe Lendário">Chefe Lendário</option>
          </select>

          {/* Seletor de Tipo */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-zinc-900/90 border border-purple-900/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            {CREATURE_TYPES_FILTER.map((t) => (
              <option key={t} value={t === 'Todos os Tipos' ? 'all' : t}>
                {t}
              </option>
            ))}
          </select>

          {/* Seletor de Tamanho / Base da Miniatura */}
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="bg-zinc-900/90 border border-purple-900/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            {CREATURE_SIZES_FILTER.map((s) => (
              <option key={s} value={s === 'Todos os Portes' ? 'all' : s}>
                {s}
              </option>
            ))}
          </select>

          <span className="ml-auto text-[11px] font-mono text-zinc-400">
            Exibindo <strong className="text-amber-300">{filteredCreatures.length}</strong> de {ALL_ABYSS_CREATURES.length} monstros
          </span>
        </div>
      </div>

      {/* Alerta de Feedback (Dano aplicado ou Espólio Concedido) */}
      {feedbackMessage && (
        <div className="p-3 rounded-xl border border-amber-500/60 bg-amber-950/60 text-amber-200 text-xs font-semibold flex items-center gap-2 shadow-lg shadow-amber-950/30 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Grid Principal: Catálogo de Miniaturas à Esquerda e Ficha Tática à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Catálogo de Criaturas */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          {filteredCreatures.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-purple-900/40 bg-zinc-950/60">
              <Skull className="w-12 h-12 text-purple-400/40 mx-auto mb-3" />
              <h3 className="text-sm font-cinzel font-bold text-zinc-200">
                Nenhum monstro encontrado com estes filtros
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Tente ajustar a busca textual ou selecione &ldquo;Todo o Bestiário&rdquo;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredCreatures.map((creature) => {
                const isSelected = selectedCreature?.id === creature.id;
                return (
                  <div
                    key={creature.id}
                    onClick={() => {
                      sound.playCoinClink('PRT');
                      setSelectedCreature(creature);
                      setLastRoll(null);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-2.5 relative overflow-hidden group ${
                      isSelected
                        ? 'border-amber-500/90 bg-gradient-to-b from-purple-950/70 via-[#100b21] to-zinc-950 text-zinc-100 shadow-xl shadow-purple-950/40 ring-1 ring-amber-500/60'
                        : 'border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-800/70 hover:border-purple-700/60 text-zinc-300'
                    }`}
                  >
                    {/* Linha Superior: Número da Miniatura, Categoria e Ameaça */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-500/30">
                            #{String(creature.number).padStart(2, '0')}
                          </span>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300 truncate max-w-[130px]">
                            {creature.categoryLabel}
                          </span>
                        </div>
                        <h3 className="text-sm font-cinzel font-bold text-amber-100 group-hover:text-amber-300 mt-1 transition">
                          {creature.name}
                        </h3>
                      </div>
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border shrink-0 ${creature.badgeColor}`}>
                        {creature.threatLevel}
                      </span>
                    </div>

                    {/* Tipo e Tamanho de Base */}
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 font-mono">
                        {creature.creatureType}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/40 text-purple-300 font-mono">
                        {creature.size}
                      </span>
                    </div>

                    {/* Atributos Rápidos: Vida e CA */}
                    <div className="flex items-center justify-between text-xs font-mono pt-1">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-rose-400" title="Pontos de Vida">
                          <Heart className="w-3.5 h-3.5" />
                          <span>{creature.hp} PV</span>
                        </div>
                        <div className="flex items-center gap-1 text-sky-400" title="Classe de Armadura">
                          <Shield className="w-3.5 h-3.5" />
                          <span>CA {creature.ac}</span>
                        </div>
                      </div>

                      {/* Espólio */}
                      <div className="flex items-center gap-1">
                        <CoinVisual type={creature.lootCurrency} size="sm" />
                        <span className="text-[11px] font-bold text-amber-300 font-mono">
                          +{creature.lootAmount} {creature.lootCurrency}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ficha Tática do Monstro Selecionado à Direita */}
        {selectedCreature && (
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-20 rounded-2xl border border-amber-500/60 bg-gradient-to-b from-purple-950/85 via-[#0d091a]/95 to-zinc-950 p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-4">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Skull className="w-36 h-36 text-amber-400" />
              </div>

              {/* Cabeçalho da Miniatura Selecionada */}
              <div className="border-b border-purple-900/50 pb-3.5 relative z-10">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40">
                      MINIATURA #{String(selectedCreature.number).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-mono text-purple-300 uppercase tracking-wide">
                      {selectedCreature.categoryLabel}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${selectedCreature.badgeColor}`}>
                    {selectedCreature.threatLevel}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-cinzel font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 mt-2">
                  {selectedCreature.name}
                </h2>
                <p className="text-xs text-zinc-300/80 italic mt-1 font-sans leading-relaxed">
                  &ldquo;{selectedCreature.lore}&rdquo;
                </p>
              </div>

              {/* Comparador Visual de Escala da Miniatura (Conforme Imagem Oficial) */}
              <div className="p-3 rounded-xl border border-purple-900/40 bg-purple-950/30">
                <span className="text-[10px] font-cinzel font-bold text-purple-300 uppercase tracking-wider block mb-2">
                  Escala de Miniatura no Tabuleiro
                </span>
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono">
                  <div className={`p-1.5 rounded border ${
                    selectedCreature.size.includes('25mm')
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-bold'
                      : 'border-zinc-800 bg-zinc-900/40 text-zinc-500'
                  }`}>
                    <span className="block text-[8px] uppercase">Base</span>
                    25mm
                  </div>
                  <div className={`p-1.5 rounded border ${
                    selectedCreature.size.includes('40mm')
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-bold'
                      : 'border-zinc-800 bg-zinc-900/40 text-zinc-500'
                  }`}>
                    <span className="block text-[8px] uppercase">Base</span>
                    40mm
                  </div>
                  <div className={`p-1.5 rounded border ${
                    selectedCreature.size.includes('60mm')
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-bold'
                      : 'border-zinc-800 bg-zinc-900/40 text-zinc-500'
                  }`}>
                    <span className="block text-[8px] uppercase">Base</span>
                    60mm
                  </div>
                  <div className={`p-1.5 rounded border ${
                    selectedCreature.size.includes('80mm')
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-bold'
                      : 'border-zinc-800 bg-zinc-900/40 text-zinc-500'
                  }`}>
                    <span className="block text-[8px] uppercase">Base</span>
                    80mm
                  </div>
                </div>
              </div>

              {/* Estatísticas de Combate: Vida, CA e Deslocamento */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl border border-rose-900/50 bg-rose-950/30 text-center">
                  <span className="text-[10px] text-rose-300 block uppercase font-mono">Vida Máxima</span>
                  <span className="text-base font-bold text-rose-200 font-mono">{selectedCreature.hp} PV</span>
                </div>
                <div className="p-2.5 rounded-xl border border-sky-900/50 bg-sky-950/30 text-center">
                  <span className="text-[10px] text-sky-300 block uppercase font-mono">Armadura</span>
                  <span className="text-base font-bold text-sky-200 font-mono">CA {selectedCreature.ac}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-amber-900/50 bg-amber-950/30 text-center">
                  <span className="text-[10px] text-amber-300 block uppercase font-mono">Deslocamento</span>
                  <span className="text-xs font-bold text-amber-200 font-mono">{selectedCreature.speed}</span>
                </div>
              </div>

              {/* Habilidade Especial / Traço */}
              <div className="p-3 rounded-xl border border-purple-900/50 bg-purple-950/30">
                <span className="text-[11px] font-cinzel font-bold text-purple-300 flex items-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  Habilidade Especial &amp; Traço
                </span>
                <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                  {selectedCreature.specialTrait}
                </p>
              </div>

              {/* Ataques e Ações com Rolagem de Dados Interativa */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-cinzel font-bold text-amber-300 flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5 text-red-400" />
                    Ataques e Ações de Combate
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Clique para rolar
                  </span>
                </div>

                {selectedCreature.attacks.map((att, i) => (
                  <div
                    key={i}
                    onClick={() => handleRollAttack(att)}
                    className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:border-amber-500/50 text-xs transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between font-mono font-semibold">
                      <span className="text-amber-200 group-hover:text-amber-300 flex items-center gap-1.5">
                        <Crosshair className="w-3 h-3 text-red-400" />
                        {att.name}
                      </span>
                      <span className="text-red-300 text-[11px]">
                        {att.bonus} • {att.damage}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 font-sans">
                      {att.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Resultado da Rolagem de Ataque do Monstro */}
              {lastRoll && (
                <div className="p-3.5 rounded-xl border border-red-900/60 bg-gradient-to-r from-red-950/50 to-zinc-950 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                      <Dices className="w-3.5 h-3.5 text-amber-400" />
                      Resultado: {lastRoll.attackName}
                    </span>
                    {lastRoll.isCritical && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500 text-zinc-950 animate-bounce">
                        CRÍTICO! (20 NATURAL)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center font-mono">
                    <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                      <span className="text-[9px] text-zinc-400 block uppercase">Acerto (d20 + bônus)</span>
                      <span className="text-sm font-bold text-amber-300">
                        {lastRoll.totalToHit} (d20: {lastRoll.d20Result})
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                      <span className="text-[9px] text-zinc-400 block uppercase">Dano {lastRoll.damageType}</span>
                      <span className="text-sm font-bold text-rose-400">
                        {lastRoll.damageRoll} PV
                      </span>
                    </div>
                  </div>

                  {/* Ação de Dano Direto do Mestre no Personagem */}
                  {isGm && campaign.players.length > 0 && onApplyExternalAction && (
                    <div className="pt-2 border-t border-red-900/40 flex items-center gap-2">
                      <select
                        value={combatTargetPlayerId}
                        onChange={(e) => setCombatTargetPlayerId(e.target.value)}
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200"
                      >
                        {campaign.players.map((p) => (
                          <option key={p.id} value={p.id}>
                            Alvo: {p.name} ({p.vitals?.currentHp || 0}/{p.vitals?.maxHp || 0} PV)
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleApplyDamageToPlayer}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shrink-0 shadow-md shadow-red-950"
                      >
                        <Heart className="w-3 h-3 text-rose-200" />
                        <span>Aplicar Dano</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Espólio da Criatura & Distribuição de Moedas */}
              <div className="p-4 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-amber-950/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CoinVisual type={selectedCreature.lootCurrency} size="md" />
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-mono block">
                        Espólio Oficial ao Derrotar
                      </span>
                      <span className="text-base font-bold text-amber-300 font-mono">
                        +{selectedCreature.lootAmount} {selectedCreature.lootCurrency}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Moeda Oficial de Nexaria
                  </span>
                </div>

                {/* Seletor de Destinatário do Espólio */}
                <div className="pt-2 border-t border-amber-500/20 space-y-2">
                  <label className="text-[10px] text-zinc-400 font-sans block">
                    Conceder espólio para:
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={lootTargetPlayerId}
                      onChange={(e) => setLootTargetPlayerId(e.target.value)}
                      className="flex-1 bg-zinc-900/90 border border-purple-900/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="all">Grupo Inteiro (Todos os Jogadores)</option>
                      {campaign.players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.title || 'Aventureiro'})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleGrantLoot(selectedCreature)}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/50 transition shrink-0"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Entregar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
