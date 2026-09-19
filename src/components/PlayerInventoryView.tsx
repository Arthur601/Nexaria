import React, { useState } from 'react';
import {
  CharacterSheet,
  InventoryItem,
  ItemCategory,
  CurrencyType,
  CampaignRoom,
} from '../types/rpg';
import {
  calculateInventoryWeight,
  calculateMaxCarryCapacity,
  RARITY_CONFIG,
  CATEGORY_LABELS,
} from '../data/defaultItems';
import { ItemModal } from './ItemModal';
import { ItemTradeModal } from './ItemTradeModal';
import { sound } from '../utils/audio';
import {
  Backpack,
  Plus,
  Search,
  Filter,
  Shield,
  Swords,
  Sparkles,
  Trash2,
  Edit2,
  CheckCircle2,
  CircleDot,
  AlertTriangle,
  Scale,
  Zap,
  Store,
  Coins,
  ArrowLeftRight,
} from 'lucide-react';

interface PlayerInventoryViewProps {
  character: CharacterSheet;
  onUpdateCharacter: (updated: CharacterSheet) => void;
  isGmView?: boolean;
  campaign?: CampaignRoom;
  onNavigateToShop?: () => void;
  onUpdateCampaign?: (updated: CampaignRoom) => void;
}

export const PlayerInventoryView: React.FC<PlayerInventoryViewProps> = ({
  character,
  onUpdateCharacter,
  isGmView = false,
  campaign,
  onNavigateToShop,
  onUpdateCampaign,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Item Trade and Selling Modal State
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeItemTarget, setTradeItemTarget] = useState<InventoryItem | null>(null);
  const [tradeInitialMode, setTradeInitialMode] = useState<'sell' | 'trade'>('sell');

  const totalWeight = calculateInventoryWeight(character.inventory);
  const maxCapacity = calculateMaxCarryCapacity(character.attributes?.FOR || 10);
  const weightPercent = Math.min(100, Math.round((totalWeight / maxCapacity) * 100));
  const isOverburdened = totalWeight > maxCapacity;

  // Filter items
  const filteredItems = character.inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.effectText?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'equipped' ? item.equipped : item.category === selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const equippedItems = character.inventory.filter((i) => i.equipped);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => {
      setActionFeedback(null);
    }, 3500);
  };

  // Toggle equip
  const handleToggleEquip = (itemId: string) => {
    sound.playCoinClink('PRT');
    const updatedInventory = character.inventory.map((item) => {
      if (item.id === itemId) {
        const nextEquipped = !item.equipped;
        showFeedback(
          nextEquipped
            ? `${item.name} foi equipado(a)!`
            : `${item.name} foi desequipado(a).`
        );
        return { ...item, equipped: nextEquipped };
      }
      return item;
    });

    onUpdateCharacter({
      ...character,
      inventory: updatedInventory,
    });
  };

  // Adjust quantity
  const handleQuantityChange = (itemId: string, delta: number) => {
    sound.playCoinClink('BRZ');
    const updatedInventory = character.inventory
      .map((item) => {
        if (item.id === itemId) {
          const newQty = Math.max(0, (item.quantity || 1) + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);

    onUpdateCharacter({
      ...character,
      inventory: updatedInventory,
    });
  };

  // Consume / Use Item (e.g. Health potion)
  const handleConsumeItem = (item: InventoryItem) => {
    sound.playSuccessFanfare();

    let hpRestored = 0;
    let manaRestored = 0;
    const lowerName = item.name.toLowerCase();
    const lowerDesc = (item.effectText || item.description || '').toLowerCase();

    // Heurística de poções clássicas
    if (lowerName.includes('vida') || lowerName.includes('cura') || lowerDesc.includes('pv')) {
      hpRestored = 15;
    }
    if (lowerName.includes('mana') || lowerName.includes('éter') || lowerDesc.includes('pm')) {
      manaRestored = 20;
    }

    const newHp = Math.min(character.hp.max, character.hp.current + hpRestored);
    const newMana = Math.min(character.mana.max, character.mana.current + manaRestored);

    const updatedInventory = character.inventory
      .map((i) => {
        if (i.id === item.id) {
          return { ...i, quantity: i.quantity - 1 };
        }
        return i;
      })
      .filter((i) => i.quantity > 0);

    onUpdateCharacter({
      ...character,
      hp: { ...character.hp, current: newHp },
      mana: { ...character.mana, current: newMana },
      inventory: updatedInventory,
    });

    const msg =
      hpRestored > 0
        ? `Consumiu ${item.name}! Recuperou +${hpRestored} PV!`
        : manaRestored > 0
        ? `Consumiu ${item.name}! Restaurou +${manaRestored} PM!`
        : `Consumiu ${item.name}! Efeito ativado.`;

    showFeedback(msg);
  };

  // Delete item
  const handleDeleteItem = (itemId: string) => {
    sound.playCoinClink('BRZ');
    const updated = character.inventory.filter((i) => i.id !== itemId);
    onUpdateCharacter({
      ...character,
      inventory: updated,
    });
    showFeedback('Item descartado do inventário.');
  };

  // Save item (created or edited)
  const handleSaveItem = (item: InventoryItem) => {
    const exists = character.inventory.some((i) => i.id === item.id);
    let updated: InventoryItem[];

    if (exists) {
      updated = character.inventory.map((i) => (i.id === item.id ? item : i));
      showFeedback(`${item.name} foi atualizado!`);
    } else {
      updated = [item, ...character.inventory];
      showFeedback(`${item.name} foi adicionado à mochila!`);
    }

    onUpdateCharacter({
      ...character,
      inventory: updated,
    });
  };

  return (
    <div className="space-y-4">
      {/* Toast de Feedback de Ação */}
      {actionFeedback && (
        <div className="p-2.5 rounded-xl border border-amber-500/60 bg-gradient-to-r from-purple-950 via-zinc-900 to-purple-950 text-amber-200 text-xs font-cinzel font-semibold flex items-center justify-between shadow-lg">
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {actionFeedback}
          </span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-zinc-400 hover:text-white text-[10px]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Painel Superior: Barra de Peso / Carga & Botão Adicionar Item */}
      <div className="rounded-xl border border-purple-900/50 bg-[#0e091a]/90 p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-purple-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Backpack className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-cinzel font-bold text-amber-300">
                Mochila de Aventureiro &amp; Carga
              </h3>
              <p className="text-[11px] text-zinc-400">
                {character.inventory.length} itens distintos &bull;{' '}
                {character.inventory.reduce((sum, i) => sum + i.quantity, 0)} unidades no total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isGmView ? (
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setIsModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-cinzel font-bold text-xs shadow-md shadow-amber-950/40 flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Conceder Item (Mestre)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {onNavigateToShop && (
                  <button
                    type="button"
                    onClick={onNavigateToShop}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-cinzel font-bold text-xs shadow-md shadow-amber-950/40 flex items-center gap-1.5 transition"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Ir à Loja do Mestre</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setTradeItemTarget(null);
                    setTradeInitialMode('trade');
                    setIsTradeModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-950/90 hover:bg-purple-900 border border-purple-700/70 text-purple-200 hover:text-white font-cinzel font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400" />
                  <span>Negociar / Trocar</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Medidor de Peso & Capacidade de Carga */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-purple-400" />
              <span>Capacidade de Carga (Baseada em FOR {character.attributes?.FOR || 10})</span>
            </span>
            <span
              className={`font-bold ${
                isOverburdened
                  ? 'text-red-400 animate-pulse'
                  : weightPercent > 75
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {totalWeight.toFixed(1)} kg / {maxCapacity} kg ({weightPercent}%)
            </span>
          </div>

          <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-purple-950">
            <div
              className={`h-full transition-all duration-300 ${
                isOverburdened
                  ? 'bg-red-500'
                  : weightPercent > 75
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(100, weightPercent)}%` }}
            />
          </div>

          {isOverburdened && (
            <div className="text-[11px] text-red-400 flex items-center gap-1 mt-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                Sobrecarga ativa! Seu personagem carrega mais peso que a força suporta (deslocamento reduzido pela metade).
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Seção de Equipamentos em Uso (Slots Rápidos) */}
      {equippedItems.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-purple-950/40 via-[#100b20] to-amber-950/30 p-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <Swords className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider">
              Itens Atualmente Equipados &amp; Empunhados ({equippedItems.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {equippedItems.map((item) => {
              const rarCfg = RARITY_CONFIG[item.rarity || 'comum'];
              return (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg border border-amber-500/50 bg-zinc-950/70 flex items-center justify-between gap-2 shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg select-none shrink-0">{item.iconEmoji || '🛡️'}</span>
                    <div className="truncate">
                      <div className="text-xs font-cinzel font-bold text-amber-200 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {item.effectText || item.category}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleEquip(item.id)}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-cinzel font-semibold shrink-0 transition"
                  >
                    Desequipar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Barra de Filtros por Categoria & Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Barra de Pesquisa */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, efeito ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-purple-900/50 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filtros em Botões de Abas Rápidas */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-cinzel font-semibold transition whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-purple-950/40'
            }`}
          >
            Todos
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('equipped')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-cinzel font-semibold transition whitespace-nowrap ${
              selectedCategory === 'equipped'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-purple-950/40'
            }`}
          >
            ⚔️ Equipados
          </button>

          {(['arma', 'armadura', 'pocao', 'reliquia', 'cyber'] as ItemCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-cinzel font-semibold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-purple-950/40'
              }`}
            >
              {CATEGORY_LABELS[cat]?.icon} {CATEGORY_LABELS[cat]?.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Lista / Grade de Itens do Inventário */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-purple-900/60 bg-[#0d0818]/60 p-6">
          <Backpack className="w-10 h-10 text-purple-400/40 mx-auto mb-2" />
          <h4 className="text-sm font-cinzel font-bold text-zinc-300 mb-1">
            Nenhum Item Encontrado
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
            {searchQuery || selectedCategory !== 'all'
              ? 'Nenhum item corresponde aos filtros selecionados.'
              : isGmView
              ? 'A mochila do aventureiro está vazia. Você pode conceder itens como mestre.'
              : 'Sua mochila está vazia. Novos itens são adquiridos na Loja do Mestre, espólios de combate ou trocas com aliados da mesa.'}
          </p>
          {isGmView ? (
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 font-cinzel font-bold text-xs transition"
            >
              Conceder Item Agora
            </button>
          ) : (
            onNavigateToShop && (
              <button
                type="button"
                onClick={onNavigateToShop}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-cinzel font-bold text-xs transition shadow-md flex items-center gap-1.5 mx-auto"
              >
                <Store className="w-4 h-4" />
                <span>Explorar Loja de Equipamentos</span>
              </button>
            )
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((item) => {
            const rarCfg = RARITY_CONFIG[item.rarity || 'comum'];
            const isEquippable = ['arma', 'armadura', 'reliquia', 'cyber'].includes(item.category);
            const isConsumable = item.category === 'pocao' || item.category === 'geral';
            const itemWeight = item.weightKg ?? (parseFloat(item.weight || '0') || 0.5);

            return (
              <div
                key={item.id}
                className={`rounded-xl border ${
                  item.equipped
                    ? 'border-amber-500/80 bg-gradient-to-b from-[#180f2c] via-[#100a1f] to-[#0a0714] shadow-amber-950/30'
                    : `${rarCfg.border} bg-gradient-to-b from-[#120b22] to-[#0a0614]`
                } p-3.5 flex flex-col justify-between shadow-lg transition hover:border-amber-400/70`}
              >
                <div>
                  {/* Topo do Card: Ícone, Nome, Raridade e Tag Equipado */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-2xl select-none shrink-0">
                        {item.iconEmoji || CATEGORY_LABELS[item.category]?.icon || '🎒'}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-cinzel font-bold text-zinc-100 truncate">
                            {item.name}
                          </h4>
                          {item.equipped && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-zinc-950 font-cinzel font-bold uppercase tracking-wider">
                              Equipado
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-mono font-semibold ${rarCfg.border} ${rarCfg.bg} ${rarCfg.text}`}
                          >
                            {rarCfg.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-sans">
                            {CATEGORY_LABELS[item.category]?.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantidade */}
                    <div className="flex items-center gap-1 bg-zinc-950 border border-purple-950 rounded-lg px-1.5 py-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, -1)}
                        className="w-4 h-4 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs"
                        title="Diminuir"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-bold text-amber-300 px-1">
                        x{item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="w-4 h-4 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs"
                        title="Aumentar"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Efeito em Destaque */}
                  {item.effectText && (
                    <div className="rounded-lg bg-amber-950/30 border border-amber-500/30 px-2 py-1 mb-2 text-[11px] text-amber-300 font-sans font-medium flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{item.effectText}</span>
                    </div>
                  )}

                  {/* Descrição */}
                  {item.description && (
                    <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2 mb-2.5 font-sans">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Rodapé do Card: Peso, Preço e Ações */}
                <div className="pt-2 border-t border-purple-900/40 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>
                      ⚖️ {(itemWeight * item.quantity).toFixed(1)} kg{' '}
                      <span className="text-zinc-500">({itemWeight} kg/un)</span>
                    </span>
                    <span className="text-amber-300 font-bold">
                      {item.valueAmount} {item.valueCurrency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    <div className="flex items-center gap-1">
                      {isEquippable && (
                        <button
                          type="button"
                          onClick={() => handleToggleEquip(item.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-cinzel font-bold flex items-center gap-1 transition ${
                            item.equipped
                              ? 'bg-amber-500 text-zinc-950 shadow-sm'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{item.equipped ? 'Equipado' : 'Equipar'}</span>
                        </button>
                      )}

                      {isConsumable && (
                        <button
                          type="button"
                          onClick={() => handleConsumeItem(item)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-700/80 hover:bg-emerald-900 text-emerald-300 text-[10px] font-cinzel font-bold flex items-center gap-1 transition"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>Usar</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Vender item para a loja/mercador */}
                      <button
                        type="button"
                        onClick={() => {
                          setTradeItemTarget(item);
                          setTradeInitialMode('sell');
                          setIsTradeModalOpen(true);
                        }}
                        className="px-2 py-1 rounded bg-amber-950/70 hover:bg-amber-900/90 border border-amber-500/40 text-amber-300 text-[10px] font-cinzel font-bold flex items-center gap-1 transition"
                        title="Vender ao mercador (70% do valor)"
                      >
                        <Coins className="w-3 h-3 text-amber-400" />
                        <span>Vender</span>
                      </button>

                      {/* Trocar ou enviar item para outro jogador */}
                      {campaign && campaign.players.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTradeItemTarget(item);
                            setTradeInitialMode('trade');
                            setIsTradeModalOpen(true);
                          }}
                          className="px-2 py-1 rounded bg-purple-950/70 hover:bg-purple-900/90 border border-purple-700/60 text-purple-300 text-[10px] font-cinzel font-bold flex items-center gap-1 transition"
                          title="Trocar ou vender para outro jogador da mesa"
                        >
                          <ArrowLeftRight className="w-3 h-3 text-purple-400" />
                          <span>Trocar</span>
                        </button>
                      )}

                      {isGmView && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setIsModalOpen(true);
                          }}
                          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                          title="Editar Item (Mestre)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 transition"
                        title="Descartar Item da Mochila"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Criação ou Edição de Itens (Mestre) */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSaveItem={handleSaveItem}
        editingItem={editingItem}
      />

      {/* Modal de Comércio e Troca entre Jogadores e Venda ao Bazar */}
      {campaign && (
        <ItemTradeModal
          isOpen={isTradeModalOpen}
          onClose={() => {
            setIsTradeModalOpen(false);
            setTradeItemTarget(null);
          }}
          currentCharacter={character}
          campaign={campaign}
          initialItem={tradeItemTarget}
          initialMode={tradeInitialMode}
          onUpdateCharacter={onUpdateCharacter}
          onUpdateCampaign={onUpdateCampaign}
        />
      )}
    </div>
  );
};
