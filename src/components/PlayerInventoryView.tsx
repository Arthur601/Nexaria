import React, { useState, useMemo } from 'react';
import {
  CharacterSheet,
  InventoryItem,
  ItemCategory,
  ItemRarity,
  CampaignRoom,
} from '../types/rpg';
import {
  calculateInventoryWeight,
  calculateMaxCarryCapacity,
  getCharacterCarryBreakdown,
  RARITY_CONFIG,
  CATEGORY_LABELS,
} from '../data/defaultItems';
import { ItemModal } from './ItemModal';
import { ItemTradeModal } from './ItemTradeModal';
import { ItemRepairModal } from './ItemRepairModal';
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
  AlertTriangle,
  Scale,
  Zap,
  Store,
  Coins,
  ArrowLeftRight,
  Info,
  X,
  Package,
  Sliders,
  Hammer,
  Anvil,
  Wrench,
  BookOpen,
  ArrowUpDown,
  Check,
  Heart,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';

interface PlayerInventoryViewProps {
  character: CharacterSheet;
  onUpdateCharacter: (updated: CharacterSheet) => void;
  isGmView?: boolean;
  campaign?: CampaignRoom;
  onNavigateToShop?: () => void;
  onNavigateToCatalog?: () => void;
  onUpdateCampaign?: (updated: CampaignRoom) => void;
}

const FILTER_CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'all', label: 'Todos', icon: '🎒' },
  { id: 'equipped', label: 'Equipados', icon: '⚔️' },
  { id: 'arma', label: 'Armas', icon: '🗡️' },
  { id: 'armadura', label: 'Armaduras & Escudos', icon: '🛡️' },
  { id: 'pocao', label: 'Poções & Consumíveis', icon: '🧪' },
  { id: 'reliquia', label: 'Relíquias', icon: '💍' },
  { id: 'cyber', label: 'Cyberware', icon: '💠' },
  { id: 'material', label: 'Materiais de Forja', icon: '⛏️' },
  { id: 'equipamento', label: 'Equipamentos', icon: '⛺' },
  { id: 'chave', label: 'Itens de Missão', icon: '🗝️' },
  { id: 'geral', label: 'Gerais', icon: '📜' },
];

export const PlayerInventoryView: React.FC<PlayerInventoryViewProps> = ({
  character,
  onUpdateCharacter,
  isGmView = false,
  campaign,
  onNavigateToShop,
  onNavigateToCatalog,
  onUpdateCampaign,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rarity' | 'weight' | 'value'>('rarity');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [inspectingItem, setInspectingItem] = useState<InventoryItem | null>(null);

  // Trade and Repair Modal State
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeItemTarget, setTradeItemTarget] = useState<InventoryItem | null>(null);
  const [tradeInitialMode, setTradeInitialMode] = useState<'sell' | 'trade'>('sell');
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [repairTargetItem, setRepairTargetItem] = useState<InventoryItem | null>(null);

  // Capacity breakdown modal
  const [isCapacityInfoOpen, setIsCapacityInfoOpen] = useState(false);
  const [isEquipmentSummaryOpen, setIsEquipmentSummaryOpen] = useState(true);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => {
      setActionFeedback(null);
    }, 3500);
  };

  // Itens com durabilidade crítica (< 10%)
  const criticalDurabilityItems = useMemo(() => {
    return character.inventory.filter((item) => {
      const dur = item.durability || (item.category === 'arma' ? { current: 20, max: 20 } : undefined);
      if (!dur || !dur.max || dur.max <= 0) return false;
      return dur.current / dur.max < 0.1;
    });
  }, [character.inventory]);

  // Simular desgaste no item para testar durabilidade
  const handleWearItem = (itemId: string, amount: number = 5) => {
    const updated = character.inventory.map((item) => {
      if (item.id === itemId) {
        const curDur = item.durability || { current: 20, max: 20 };
        const newCur = Math.max(0, curDur.current - amount);
        const newDur = { ...curDur, current: newCur };
        const pct = Math.round((newCur / curDur.max) * 100);
        sound.playCoinClink('BRZ');
        showFeedback(
          pct < 10
            ? `⚠️ ALERTA: ${item.name} sofreu desgaste severo! Durabilidade crítica: ${newCur}/${curDur.max} (${pct}%)!`
            : `${item.name} desgastou -${amount} pts. Integridade restante: ${newCur}/${curDur.max} (${pct}%).`
        );
        return {
          ...item,
          durability: newDur,
        };
      }
      return item;
    });

    onUpdateCharacter({
      ...character,
      inventory: updated,
    });
  };

  // Capacidade e espaço da mochila (derivado de FOR + Classe + Melhorias)
  const capacityBreakdown = useMemo(() => {
    return getCharacterCarryBreakdown(
      character,
      campaign?.levelProgressionConfig?.inventoryCapacityPerLevel
    );
  }, [
    character.attributes?.FOR,
    character.characterClass,
    character.inventory,
    character.level,
    campaign?.levelProgressionConfig?.inventoryCapacityPerLevel,
  ]);

  const maxCapacity = capacityBreakdown.maxCapacity;
  const totalWeight = calculateInventoryWeight(character.inventory);
  const weightPercent = Math.min(100, Math.round((totalWeight / maxCapacity) * 100));
  const isOverburdened = totalWeight > maxCapacity;
  const excessWeight = Math.max(0, totalWeight - maxCapacity);

  // Contagem dinâmica por categoria
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: character.inventory.length,
      equipped: character.inventory.filter((i) => i.equipped).length,
    };
    for (const item of character.inventory) {
      counts[item.category] = (counts[item.category] || 0) + 1;
      const descLower = (item.description || '').toLowerCase();
      const effLower = (item.effectText || '').toLowerCase();
      if (
        item.category === 'chave' ||
        descLower.includes('missao') ||
        descLower.includes('chave') ||
        effLower.includes('desbloqueia')
      ) {
        counts['chave'] = (counts['chave'] || 0) + 1;
      }
    }
    return counts;
  }, [character.inventory]);

  // Filtro e busca de itens
  const filteredItems = useMemo(() => {
    let result = character.inventory.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const nameNorm = item.name.toLowerCase();
      const descNorm = (item.description || '').toLowerCase();
      const effectNorm = (item.effectText || '').toLowerCase();

      const isKeyItem =
        item.category === 'chave' ||
        descNorm.includes('missao') ||
        descNorm.includes('chave') ||
        effectNorm.includes('desbloqueia');

      const matchesSearch =
        !query ||
        nameNorm.includes(query) ||
        descNorm.includes(query) ||
        effectNorm.includes(query) ||
        item.category.includes(query) ||
        (item.rarity || '').includes(query);

      const matchesCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'equipped'
          ? item.equipped
          : selectedCategory === 'chave'
          ? isKeyItem
          : item.category === selectedCategory);

      const matchesRarity =
        selectedRarity === 'all' || (item.rarity || 'comum') === selectedRarity;

      return matchesSearch && matchesCategory && matchesRarity;
    });

    // Ordenação
    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'rarity') {
      const rank: Record<string, number> = {
        abissal: 6,
        lendario: 5,
        epico: 4,
        raro: 3,
        incomum: 2,
        comum: 1,
      };
      result.sort((a, b) => (rank[b.rarity || 'comum'] || 1) - (rank[a.rarity || 'comum'] || 1));
    } else if (sortBy === 'weight') {
      result.sort(
        (a, b) =>
          (b.weightKg ?? 0.5) * (b.quantity || 1) - (a.weightKg ?? 0.5) * (a.quantity || 1)
      );
    } else if (sortBy === 'value') {
      result.sort((a, b) => (b.valueAmount || 0) - (a.valueAmount || 0));
    }

    return result;
  }, [character.inventory, searchQuery, selectedCategory, selectedRarity, sortBy]);

  // Itens atualmente equipados
  const equippedItems = character.inventory.filter((i) => i.equipped);

  // Toggle equip
  const handleToggleEquip = (itemId: string) => {
    sound.playCoinClink('PRT');
    const updatedInventory = character.inventory.map((item) => {
      if (item.id === itemId) {
        const nextEquipped = !item.equipped;
        showFeedback(
          nextEquipped
            ? `⚔️ ${item.name} foi equipado(a)!`
            : `🛡️ ${item.name} foi guardado(a) na mochila.`
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
    if (delta < 0) {
      return;
    }
    if (delta > 0 && !isGmView) {
      sound.playInsufficientBalance();
      showFeedback(
        'Bloqueado: Novos itens só podem ser obtidos derrotando monstros, forjando ou na Loja do Mestre!'
      );
      return;
    }
    sound.playCoinClink('BRZ');
    const updatedInventory = character.inventory.map((item) => {
      if (item.id === itemId) {
        const newQty = (item.quantity || 1) + delta;
        return { ...item, quantity: newQty };
      }
      return item;
    });

    onUpdateCharacter({
      ...character,
      inventory: updatedInventory,
    });
  };

  // Consume / Use Item (e.g. Health potion)
  const handleConsumeItem = (item: InventoryItem) => {
    sound.playSuccessFanfare();

    let hpRestored = 0;
    const lowerName = item.name.toLowerCase();
    const lowerDesc = (item.effectText || item.description || '').toLowerCase();

    if (lowerName.includes('vida') || lowerName.includes('cura') || lowerDesc.includes('pv')) {
      hpRestored = 15;
    }

    const currentHp = character.hp?.current ?? 20;
    const maxHp = character.hp?.max ?? 20;
    let updatedHp = currentHp;
    if (hpRestored > 0) {
      updatedHp = Math.min(maxHp, currentHp + hpRestored);
    }

    const updatedInventory = character.inventory
      .map((it) => {
        if (it.id === item.id) {
          if ((it.quantity || 1) > 1) {
            return { ...it, quantity: (it.quantity || 1) - 1 };
          }
          return null;
        }
        return it;
      })
      .filter(Boolean) as InventoryItem[];

    onUpdateCharacter({
      ...character,
      hp: {
        ...(character.hp || { current: 20, max: 20 }),
        current: updatedHp,
      },
      inventory: updatedInventory,
    });

    showFeedback(
      `✨ Você usou ${item.name}!${
        hpRestored > 0 ? ` (+${hpRestored} PV restaurados na ficha)` : ''
      }`
    );
  };

  // Delete item
  const handleDeleteItem = (itemId: string) => {
    const item = character.inventory.find((i) => i.id === itemId);
    if (!item) return;

    if (window.confirm(`Tem certeza que deseja descartar definitivamente "${item.name}"?`)) {
      sound.playCoinClink('BRZ');
      const updatedInventory = character.inventory.filter((i) => i.id !== itemId);
      onUpdateCharacter({
        ...character,
        inventory: updatedInventory,
      });
      showFeedback(`🗑️ "${item.name}" foi descartado.`);
    }
  };

  // Save new or edited item
  const handleSaveItem = (itemData: Partial<InventoryItem>) => {
    if (editingItem) {
      const updatedInventory = character.inventory.map((item) =>
        item.id === editingItem.id ? ({ ...item, ...itemData } as InventoryItem) : item
      );
      onUpdateCharacter({
        ...character,
        inventory: updatedInventory,
      });
      showFeedback(`✓ "${itemData.name}" atualizado com sucesso!`);
    } else {
      const newItem: InventoryItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: itemData.name || 'Novo Item',
        quantity: itemData.quantity || 1,
        category: itemData.category || 'geral',
        rarity: itemData.rarity || 'comum',
        weightKg: itemData.weightKg || 0.5,
        equipped: itemData.equipped || false,
        effectText: itemData.effectText || '',
        description: itemData.description || '',
        valueAmount: itemData.valueAmount || 5,
        valueCurrency: itemData.valueCurrency || 'BRZ',
        iconEmoji: itemData.iconEmoji || '📦',
        durability: itemData.durability,
      };

      onUpdateCharacter({
        ...character,
        inventory: [...character.inventory, newItem],
      });
      showFeedback(`✓ "${newItem.name}" adicionado à mochila!`);
    }

    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleOpenTradeModal = (item: InventoryItem, mode: 'sell' | 'trade' = 'sell') => {
    setTradeItemTarget(item);
    setTradeInitialMode(mode);
    setIsTradeModalOpen(true);
  };

  const handleOpenRepairModal = (item: InventoryItem) => {
    setRepairTargetItem(item);
    setIsRepairModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/50 bg-[#140b24]/95 text-amber-200 text-xs sm:text-sm font-cinzel font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* CABEÇALHO DO INVENTÁRIO COM CARTEIRA, STATUS & AÇÕES RÁPIDAS */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-[#170e2b] via-[#0d071a] to-[#120822] p-5 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Identidade do Aventureiro */}
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-purple-950/80 border border-amber-500/40 flex items-center justify-center text-3xl shadow-inner shrink-0 overflow-hidden">
              {character.avatarUrl ? (
                <img
                  src={character.avatarUrl}
                  alt={character.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                '🎒'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-cinzel font-bold text-amber-100">
                  Mochila de {character.name}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/40">
                  Nv. {character.level} {character.characterClass}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-300 mt-1 font-mono">
                <span className="flex items-center gap-1 text-red-400 font-bold">
                  <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                  {character.hp?.current ?? 20}/{character.hp?.max ?? 20} PV
                </span>
                <span className="flex items-center gap-1 text-blue-400 font-bold">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  {character.mana?.current ?? 10}/{character.mana?.max ?? 10} PM
                </span>
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  CA {character.armorClass ?? 10}
                </span>
                <span className="text-zinc-400">
                  • <strong>{character.inventory.length}</strong> itens guardados
                </span>
              </div>
            </div>
          </div>

          {/* Botões de Ação Rápida */}
          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToCatalog && (
              <button
                type="button"
                onClick={onNavigateToCatalog}
                className="px-3 py-1.5 rounded-xl bg-purple-900/50 hover:bg-purple-800/60 border border-purple-600/40 text-purple-200 text-xs font-cinzel font-semibold flex items-center gap-1.5 transition shadow"
                title="Consultar o Grande Catálogo de Itens e Lore de Eldria"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Catálogo Geral</span>
              </button>
            )}

            {onNavigateToShop && (
              <button
                type="button"
                onClick={onNavigateToShop}
                className="px-3 py-1.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/70 border border-amber-600/40 text-amber-300 text-xs font-cinzel font-semibold flex items-center gap-1.5 transition shadow"
                title="Visitar o Bazar do Mestre para compras e suprimentos"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Loja do Mestre</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setRepairTargetItem(null);
                setIsRepairModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-purple-800/50 text-amber-300 text-xs font-cinzel font-semibold flex items-center gap-1.5 transition shadow"
              title="Abrir Bigorna de Reparos"
            >
              <Anvil className="w-3.5 h-3.5" />
              <span>Bigorna</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-cinzel font-bold text-xs flex items-center gap-1.5 shadow transition"
              title="Adicionar um item personalizado na mochila"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-950" />
              <span>Criar Item</span>
            </button>
          </div>
        </div>

        {/* BARRA DE CAPACIDADE DE CARGA & CARTEIRA DE MOEDAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-purple-900/40">
          {/* Carga & Capacidade Baseada em FOR */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setIsCapacityInfoOpen(true)}
                className="font-cinzel text-zinc-300 hover:text-amber-300 flex items-center gap-1 transition"
                title="Ver detalhes de capacidade de carga"
              >
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>Capacidade de Carga (FOR {character.attributes?.FOR ?? 10}):</span>
                <Info className="w-3 h-3 text-zinc-500 hover:text-amber-400" />
              </button>
              <span
                className={`font-mono font-bold ${
                  isOverburdened ? 'text-red-400 animate-pulse' : 'text-zinc-200'
                }`}
              >
                {totalWeight.toFixed(1)} / {maxCapacity} kg ({weightPercent}%)
              </span>
            </div>

            <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverburdened
                    ? 'bg-red-500'
                    : weightPercent > 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, weightPercent)}%` }}
              />
            </div>

            {isOverburdened && (
              <p className="text-[11px] text-red-400 font-mono flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Sobrecarga ativa (+{excessWeight.toFixed(1)} kg além do limite). Deslocamento reduzido pela metade!
              </p>
            )}
          </div>

          {/* Carteira de Moedas de Eldria */}
          <div className="flex items-center justify-between md:justify-end gap-2 text-xs font-mono font-bold flex-wrap">
            <div className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-700/50 text-amber-300 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{character.wallet.BRZ}</span>
              <span className="text-[10px] text-amber-400/70 font-normal">BRZ</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-600 text-zinc-200 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-zinc-300" />
              <span>{character.wallet.PRT}</span>
              <span className="text-[10px] text-zinc-400 font-normal">PRT</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-yellow-950/60 border border-yellow-500/60 text-yellow-300 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span>{character.wallet.ORO}</span>
              <span className="text-[10px] text-yellow-400/70 font-normal">ORO</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-500/50 text-blue-300 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-blue-400" />
              <span>{character.wallet.PLN}</span>
              <span className="text-[10px] text-blue-400/70 font-normal">PLN</span>
            </div>
            {character.wallet.CYB !== undefined && (
              <div className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>{character.wallet.CYB}</span>
                <span className="text-[10px] text-cyan-400/70 font-normal">CYB</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ALERTA DE DURABILIDADE CRÍTICA (< 10%) */}
      {criticalDurabilityItems.length > 0 && (
        <div className="p-4 rounded-xl border border-red-500/60 bg-red-950/40 text-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-900/60 border border-red-500 flex items-center justify-center text-red-300 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-cinzel font-bold text-red-100">
                Alerta de Durabilidade Crítica (&lt; 10%)
              </h4>
              <p className="text-xs text-red-300">
                {criticalDurabilityItems.map((i) => i.name).join(', ')} estão à beira de quebrar!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenRepairModal(criticalDurabilityItems[0])}
            className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-cinzel font-bold text-xs shadow flex items-center gap-1.5 shrink-0"
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>Reparar Agora na Bigorna</span>
          </button>
        </div>
      )}

      {/* PAINEL DE EQUIPAMENTOS EM USO (SHOWCASE) */}
      <div className="rounded-xl border border-purple-900/50 bg-[#0d0718]/90 overflow-hidden shadow-lg">
        <div
          onClick={() => setIsEquipmentSummaryOpen(!isEquipmentSummaryOpen)}
          className="p-3.5 bg-gradient-to-r from-purple-950/70 to-zinc-950 flex items-center justify-between cursor-pointer border-b border-purple-900/40"
        >
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-cinzel font-bold text-amber-100 uppercase tracking-wider">
              Equipamento Ativo em Combate ({equippedItems.length})
            </h3>
          </div>
          <div className="flex items-center gap-1 text-zinc-400 text-xs">
            <span>{isEquipmentSummaryOpen ? 'Recolher' : 'Expandir'}</span>
            {isEquipmentSummaryOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>

        {isEquipmentSummaryOpen && (
          <div className="p-4">
            {equippedItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {equippedItems.map((item) => {
                  const rarityStyle = RARITY_CONFIG[item.rarity || 'comum'] || RARITY_CONFIG.comum;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border ${rarityStyle.border} ${rarityStyle.bg} bg-opacity-40 flex items-center justify-between gap-3 shadow-md`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl shrink-0">{item.iconEmoji || '⚔️'}</span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-cinzel font-bold text-amber-100 truncate">
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-zinc-400 font-mono block">
                            {item.category.toUpperCase()} • {item.weightKg || 0.5} kg
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleEquip(item.id)}
                        className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] font-cinzel text-zinc-300 hover:text-white border border-zinc-700 shrink-0"
                        title="Desequipar e guardar na mochila"
                      >
                        Desequipar
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-zinc-400">
                Nenhum item equipado no momento. Clique no botão "Equipar" em uma arma ou armadura abaixo para ativá-lo!
              </div>
            )}
          </div>
        )}
      </div>

      {/* BARRA DE CONTROLE: PESQUISA, FILTROS POR CATEGORIA & ORDENAÇÃO */}
      <div className="space-y-3 bg-[#0d0718]/90 border border-purple-900/60 p-4 rounded-xl shadow-lg">
        {/* Linha 1: Input de Pesquisa & Ordenação */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome, propriedades, dano, efeito ou descrição..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/90 border border-purple-900/60 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400/80 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-zinc-950 border border-purple-900/60 text-xs font-cinzel text-amber-200 focus:outline-none focus:border-amber-400"
            >
              <option value="rarity">Ordenar: Raridade</option>
              <option value="name">Ordenar: Nome (A-Z)</option>
              <option value="weight">Ordenar: Mais Pesados</option>
              <option value="value">Ordenar: Valor em Moedas</option>
            </select>
          </div>
        </div>

        {/* Linha 2: Chips de Categoria */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-semibold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-purple-900/40'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-zinc-950/40 text-zinc-950 font-bold'
                      : 'bg-purple-950/80 text-purple-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Linha 3: Filtro de Raridades */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-purple-900/30 scrollbar-none">
          <span className="text-[11px] font-cinzel text-zinc-400 shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-400" />
            Raridade:
          </span>
          <button
            type="button"
            onClick={() => setSelectedRarity('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-cinzel transition shrink-0 ${
              selectedRarity === 'all'
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todas
          </button>
          {Object.entries(RARITY_CONFIG).map(([key, config]) => {
            const isSel = selectedRarity === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedRarity(key)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-cinzel uppercase transition shrink-0 border ${
                  config.border
                } ${isSel ? `${config.bg} ${config.text} font-bold ring-1 ring-amber-400` : 'text-zinc-400 bg-zinc-950/60'}`}
              >
                {config.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* GRADE DE CARDS DOS ITENS DO INVENTÁRIO */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const rarityStyle = RARITY_CONFIG[item.rarity || 'comum'] || RARITY_CONFIG.comum;
            const dur = item.durability || (item.category === 'arma' ? { current: 20, max: 20 } : undefined);
            const durPct = dur && dur.max > 0 ? Math.round((dur.current / dur.max) * 100) : null;
            const isDurCritical = durPct !== null && durPct < 10;

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-2xl border ${rarityStyle.border} ${rarityStyle.bg} bg-opacity-70 p-4 shadow-lg hover:shadow-2xl transition duration-200 group relative backdrop-blur-sm ${
                  item.equipped ? 'ring-2 ring-amber-400/60' : ''
                }`}
              >
                <div>
                  {/* Linha Superior: Ícone, Subcategoria, Raridade e Equipado */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900/90 border border-purple-800/50 flex items-center justify-center text-2xl shrink-0 shadow-inner group-hover:scale-105 transition">
                        {item.iconEmoji || '📦'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-purple-950/70 border border-purple-800/50 text-purple-300">
                          {item.category}
                        </span>
                        <h3 className="font-cinzel font-bold text-sm sm:text-base text-zinc-100 group-hover:text-amber-200 transition mt-1 truncate">
                          {item.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span
                        className={`text-[10px] font-cinzel font-bold px-2 py-0.5 rounded-md border ${rarityStyle.border} ${rarityStyle.text} bg-zinc-950/70 uppercase`}
                      >
                        {item.rarity || 'comum'}
                      </span>
                      {item.equipped && (
                        <span className="mt-1 text-[10px] font-cinzel font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 flex items-center gap-1">
                          <Check className="w-3 h-3 text-amber-400" />
                          Equipado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Efeito em Destaque */}
                  {item.effectText && (
                    <div className="p-2.5 rounded-xl bg-zinc-950/85 border border-purple-900/40 text-xs font-sans text-emerald-300 font-semibold mb-2.5">
                      {item.effectText}
                    </div>
                  )}

                  {/* Descrição */}
                  {item.description && (
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}

                  {/* Durabilidade e Estatísticas */}
                  <div className="space-y-1.5 pt-2 border-t border-purple-900/30 text-xs font-mono">
                    {dur && durPct !== null && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-amber-400" />
                            Durabilidade:
                          </span>
                          <span
                            className={`font-bold ${
                              isDurCritical
                                ? 'text-red-400 animate-pulse'
                                : durPct < 30
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {dur.current} / {dur.max} ({durPct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                          <div
                            className={`h-full transition-all ${
                              durPct < 20
                                ? 'bg-red-500'
                                : durPct < 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${durPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                      <span>Peso: {(item.weightKg || 0.5) * (item.quantity || 1)} kg</span>
                      <span className="text-amber-300 font-bold">
                        {item.valueAmount || 5} {item.valueCurrency || 'BRZ'}
                      </span>
                      <span>Qtd: {item.quantity || 1}</span>
                    </div>
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO DO CARD */}
                <div className="pt-3 mt-3 border-t border-purple-900/40 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Botão Equipar / Desequipar */}
                    <button
                      type="button"
                      onClick={() => handleToggleEquip(item.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-cinzel font-bold transition shadow flex items-center gap-1 ${
                        item.equipped
                          ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-purple-800/60'
                      }`}
                      title={item.equipped ? 'Desequipar' : 'Equipar'}
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>{item.equipped ? 'Desequipar' : 'Equipar'}</span>
                    </button>

                    {/* Botão Usar (se for poção ou consumível) */}
                    {(item.category === 'pocao' || item.category === 'geral') && (
                      <button
                        type="button"
                        onClick={() => handleConsumeItem(item)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-cinzel font-semibold bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 transition flex items-center gap-1"
                        title="Consumir / Usar Item"
                      >
                        <span>🧪 Usar</span>
                      </button>
                    )}

                    {/* Botão Reparar (se tiver durabilidade desgastada) */}
                    {dur && dur.current < dur.max && (
                      <button
                        type="button"
                        onClick={() => handleOpenRepairModal(item)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-amber-600/50 text-amber-300 transition"
                        title="Reparar durabilidade na Bigorna"
                      >
                        <Hammer className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Botão Negociar / Vender */}
                    <button
                      type="button"
                      onClick={() => handleOpenTradeModal(item, 'sell')}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-purple-800/50 text-purple-200 transition"
                      title="Vender ou trocar com outro jogador"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Botão Inspecionar Detalhes */}
                    <button
                      type="button"
                      onClick={() => setInspectingItem(item)}
                      className="p-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-800/40 text-purple-300 transition"
                      title="Ver ficha completa"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>

                    {/* Botão Editar Item */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(item);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
                      title="Editar item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Botão Descartar / Excluir */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/80 text-zinc-500 hover:text-red-400 transition"
                      title="Descartar item da mochila"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl border border-purple-900/50 bg-[#120822]/80 p-8 max-w-lg mx-auto shadow-xl space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto text-2xl">
            🎒
          </div>
          <h3 className="text-base font-cinzel font-bold text-zinc-100">
            Nenhum Item Encontrado
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Nenhum item corresponde aos filtros selecionados. Tente ajustar o termo de busca ou adicione um novo equipamento.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedRarity('all');
            }}
            className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-cinzel text-xs font-semibold"
          >
            Limpar Filtros
          </button>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE ITEM */}
      {isModalOpen && (
        <ItemModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveItem}
          initialItem={editingItem}
        />
      )}

      {/* MODAL DE INSPEÇÃO COMPLETA */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-amber-500/40 bg-[#160d28] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center text-3xl shadow-inner">
                  {inspectingItem.iconEmoji || '📦'}
                </div>
                <div>
                  <h3 className="text-lg font-cinzel font-bold text-amber-100">
                    {inspectingItem.name}
                  </h3>
                  <span className="text-xs font-mono uppercase text-amber-400">
                    {inspectingItem.rarity || 'comum'} • {inspectingItem.category}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectingItem.effectText && (
              <div className="p-3 rounded-xl bg-zinc-950/90 border border-purple-900/60 text-xs text-emerald-300 font-semibold">
                <strong>Efeito Ativo: </strong> {inspectingItem.effectText}
              </div>
            )}

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-purple-900/40 space-y-2 text-xs font-mono text-zinc-300">
              <div className="flex items-center justify-between">
                <span>Peso Unitário:</span>
                <span className="text-amber-300 font-bold">{inspectingItem.weightKg || 0.5} kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Quantidade em Posse:</span>
                <span className="text-amber-300 font-bold">{inspectingItem.quantity || 1} un.</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Valor de Mercado:</span>
                <span className="text-amber-300 font-bold">
                  {inspectingItem.valueAmount || 5} {inspectingItem.valueCurrency || 'BRZ'}
                </span>
              </div>
              {inspectingItem.durability && (
                <div className="flex items-center justify-between pt-1 border-t border-purple-900/30">
                  <span>Integridade da Forja:</span>
                  <span className="text-amber-300 font-bold">
                    {inspectingItem.durability.current} / {inspectingItem.durability.max} pts
                  </span>
                </div>
              )}
            </div>

            {inspectingItem.description && (
              <div className="space-y-1">
                <span className="text-xs font-cinzel font-bold text-amber-300 uppercase">
                  História &amp; Descrição
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans bg-zinc-950/40 p-3 rounded-xl border border-zinc-800">
                  {inspectingItem.description}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-purple-900/40">
              <button
                type="button"
                onClick={() => handleToggleEquip(inspectingItem.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold transition shadow flex items-center gap-1.5 ${
                  inspectingItem.equipped
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-purple-800/60'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>{inspectingItem.equipped ? 'Desequipar' : 'Equipar'}</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="px-4 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-cinzel font-semibold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE TROCA E VENDA */}
      {isTradeModalOpen && tradeItemTarget && (
        <ItemTradeModal
          isOpen={isTradeModalOpen}
          onClose={() => {
            setIsTradeModalOpen(false);
            setTradeItemTarget(null);
          }}
          item={tradeItemTarget}
          character={character}
          campaign={campaign}
          onUpdateCharacter={onUpdateCharacter}
          onUpdateCampaign={onUpdateCampaign}
          initialMode={tradeInitialMode}
        />
      )}

      {/* MODAL DE REPARO NA BIGORNA */}
      {isRepairModalOpen && (
        <ItemRepairModal
          isOpen={isRepairModalOpen}
          onClose={() => {
            setIsRepairModalOpen(false);
            setRepairTargetItem(null);
          }}
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          initialSelectedItem={repairTargetItem}
        />
      )}

      {/* MODAL DE DETALHAMENTO DE CAPACIDADE DE CARGA */}
      {isCapacityInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-[#160d28] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-cinzel font-bold text-amber-100">
                  Cálculo de Carga &amp; Transporte
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCapacityInfoOpen(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              O limite de carga máxima é calculado com base no atributo de <strong>Força (FOR)</strong> e na classe de personagem, permitindo que guerreiros e bárbaros transportem equipamentos pesados sem penalidades.
            </p>

            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-purple-900/50 space-y-2 text-xs font-mono text-zinc-300">
              <div className="flex items-center justify-between">
                <span>Força do Personagem (FOR):</span>
                <span className="text-amber-300 font-bold">{character.attributes?.FOR ?? 10}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Capacidade Base por FOR:</span>
                <span className="text-amber-300 font-bold">{capacityBreakdown.baseCapacity} kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Bônus de Classe ({character.characterClass}):</span>
                <span className="text-amber-300 font-bold">+{capacityBreakdown.classBonus} kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Bônus por Nível ({character.level}):</span>
                <span className="text-amber-300 font-bold">+{capacityBreakdown.levelBonus} kg</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-purple-900/40 font-bold text-sm">
                <span className="text-amber-200">Capacidade Máxima Total:</span>
                <span className="text-amber-400">{maxCapacity} kg</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 font-sans">
              <strong>Regra de Sobrecarga:</strong> Caso o peso total ultrapasse {maxCapacity} kg, o personagem sofre penalidade de 50% em seu deslocamento tático e desvantagem em esquivas.
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsCapacityInfoOpen(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-cinzel font-bold text-xs shadow"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
