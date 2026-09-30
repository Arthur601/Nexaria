import React, { useState, useMemo } from 'react';
import {
  ALL_GAME_ITEMS_CATALOG,
  CatalogItemDefinition,
  CATALOG_CATEGORIES_CONFIG,
  CATALOG_RARITIES_CONFIG,
  createInventoryItemFromCatalog,
} from '../data/allGameItemsCatalog';
import {
  CharacterSheet,
  CampaignRoom,
  ItemCategory,
  ItemRarity,
  CurrencyType,
  CURRENCY_CONFIGS,
} from '../types/rpg';
import { RARITY_CONFIG } from '../data/defaultItems';
import { sound } from '../utils/audio';
import {
  Search,
  Filter,
  Sparkles,
  Backpack,
  Store,
  Copy,
  Check,
  Info,
  X,
  Plus,
  Coins,
  Shield,
  Swords,
  Layers,
  ArrowUpDown,
  BookOpen,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Flame,
  LayoutGrid,
  List,
  Crown,
  HeartHandshake,
} from 'lucide-react';

interface ItemsCatalogViewProps {
  campaign?: CampaignRoom | null;
  activeCharacter?: CharacterSheet | null;
  activeRole: string;
  isGm: boolean;
  onUpdateCharacter?: (updated: CharacterSheet) => void;
  onUpdateCampaign?: (updated: CampaignRoom) => void;
  onNavigateToInventory?: () => void;
  onNavigateToShop?: () => void;
}

export const ItemsCatalogView: React.FC<ItemsCatalogViewProps> = ({
  campaign,
  activeCharacter,
  activeRole,
  isGm,
  onUpdateCharacter,
  onUpdateCampaign,
  onNavigateToInventory,
  onNavigateToShop,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<ItemRarity | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rarity' | 'price_asc' | 'price_desc' | 'weight'>('rarity');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [inspectingItem, setInspectingItem] = useState<CatalogItemDefinition | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [giveToCharModalItem, setGiveToCharModalItem] = useState<CatalogItemDefinition | null>(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [compareItems, setCompareItems] = useState<CatalogItemDefinition[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => {
      setActionFeedback(null);
    }, 3200);
  };

  const handleToggleCompare = (item: CatalogItemDefinition) => {
    sound.playCoinClink('PRT');
    if (compareItems.some((i) => i.id === item.id)) {
      setCompareItems(compareItems.filter((i) => i.id !== item.id));
      showToast(`"${item.name}" removido da comparação.`);
    } else if (compareItems.length >= 2) {
      setCompareItems([compareItems[1], item]);
      showToast(`Comparando "${compareItems[1].name}" e "${item.name}".`);
      setIsCompareModalOpen(true);
    } else {
      const updated = [...compareItems, item];
      setCompareItems(updated);
      if (updated.length === 2) {
        showToast(`2 itens selecionados! Abrindo comparador.`);
        setIsCompareModalOpen(true);
      } else {
        showToast(`1º Item selecionado: "${item.name}". Selecione outro para comparar.`);
      }
    }
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ALL_GAME_ITEMS_CATALOG.length };
    for (const item of ALL_GAME_ITEMS_CATALOG) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, []);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let list = [...ALL_GAME_ITEMS_CATALOG];

    if (selectedCategory !== 'all') {
      list = list.filter((i) => i.category === selectedCategory);
    }

    if (selectedRarity !== 'all') {
      list = list.filter((i) => i.rarity === selectedRarity);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.effectText.toLowerCase().includes(q) ||
          i.subcategory.toLowerCase().includes(q) ||
          (i.properties && i.properties.toLowerCase().includes(q)) ||
          (i.loreQuote && i.loreQuote.toLowerCase().includes(q))
      );
    }

    const rarityRank: Record<ItemRarity, number> = {
      comum: 1,
      incomum: 2,
      raro: 3,
      epico: 4,
      lendario: 5,
      abissal: 6,
    };

    const currencyValueInBrz: Record<CurrencyType, number> = {
      BRZ: 1,
      PRT: 10,
      ORO: 100,
      PLN: 1000,
      CYB: 5000,
    };

    if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'rarity') {
      list.sort((a, b) => rarityRank[b.rarity] - rarityRank[a.rarity]);
    } else if (sortBy === 'price_asc') {
      list.sort(
        (a, b) =>
          a.valueAmount * currencyValueInBrz[a.valueCurrency] -
          b.valueAmount * currencyValueInBrz[b.valueCurrency]
      );
    } else if (sortBy === 'price_desc') {
      list.sort(
        (a, b) =>
          b.valueAmount * currencyValueInBrz[b.valueCurrency] -
          a.valueAmount * currencyValueInBrz[a.valueCurrency]
      );
    } else if (sortBy === 'weight') {
      list.sort((a, b) => a.weightKg - b.weightKg);
    }

    return list;
  }, [selectedCategory, selectedRarity, searchQuery, sortBy]);

  // Handler: GM adds item to Campaign Shop (Bazar)
  const handleAddShopMarketItem = (catalogItem: CatalogItemDefinition) => {
    if (!campaign || !onUpdateCampaign) return;

    const newMarketItem = {
      id: `market-${catalogItem.id}-${Date.now()}`,
      name: catalogItem.name,
      category: catalogItem.category,
      rarity: catalogItem.rarity,
      quantity: 5,
      weightKg: catalogItem.weightKg,
      effectText: catalogItem.effectText,
      description: catalogItem.description,
      priceAmount: catalogItem.valueAmount,
      priceCurrency: catalogItem.valueCurrency,
      iconEmoji: catalogItem.iconEmoji,
      isInfinite: false,
    };

    onUpdateCampaign({
      ...campaign,
      marketItems: [newMarketItem, ...campaign.marketItems],
    });

    sound.playSuccessFanfare();
    showToast(`✓ "${catalogItem.name}" colocado à venda na Loja do Mestre!`);
  };

  // Handler: GM gives item directly to a chosen player
  const handleConfirmGiveToPlayer = () => {
    if (!giveToCharModalItem || !selectedRecipientId || !campaign || !onUpdateCampaign) return;

    const targetPlayer = campaign.players.find((p) => p.id === selectedRecipientId);
    if (!targetPlayer) return;

    const newItem = createInventoryItemFromCatalog(giveToCharModalItem, 1);
    const updatedPlayers = campaign.players.map((p) => {
      if (p.id === selectedRecipientId) {
        return {
          ...p,
          inventory: [...p.inventory, newItem],
        };
      }
      return p;
    });

    onUpdateCampaign({
      ...campaign,
      players: updatedPlayers,
    });

    sound.playCoinClink('ORO');
    showToast(`✓ "${giveToCharModalItem.name}" entregue diretamente a ${targetPlayer.name}!`);
    setGiveToCharModalItem(null);
    setSelectedRecipientId('');
  };

  // Handler: Copy item stats to clipboard
  const handleCopyStats = (catalogItem: CatalogItemDefinition) => {
    const text = `**[${catalogItem.iconEmoji} ${catalogItem.name}]** (${catalogItem.rarity.toUpperCase()} - ${catalogItem.subcategory})
• Efeito/Dano: ${catalogItem.effectText}
• Peso: ${catalogItem.weightKg} kg | Valor: ${catalogItem.valueAmount} ${catalogItem.valueCurrency}
• Descrição: ${catalogItem.description}
${catalogItem.properties ? `• Propriedades: ${catalogItem.properties}\n` : ''}${catalogItem.loreQuote ? `> ${catalogItem.loreQuote}` : ''}`;

    navigator.clipboard.writeText(text);
    setCopiedItemId(catalogItem.id);
    sound.playCoinClink('PRT');
    setTimeout(() => setCopiedItemId(null), 2000);
    showToast(`Estatísticas de "${catalogItem.name}" copiadas para a área de transferência!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast de Notificação */}
      {actionFeedback && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top duration-300">
          <div className="px-4 py-3 rounded-xl bg-purple-950/95 border border-amber-500/80 text-amber-200 text-xs font-cinzel font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 max-w-md">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        </div>
      )}

      {/* HEADER BANNER MAJESTOSO */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-[#1b0a2a] via-[#12071d] to-[#0a0410] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-cinzel font-bold text-amber-400 tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Compêndio Universal de Eldria</span>
              <span>•</span>
              <span className="text-purple-300">135 Itens Oficiais</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-cinzel font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-500">
              ✦ Grande Catálogo &amp; Enciclopédia de Itens ✦
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
              Consulte absolutamente todas as armas, armaduras, escudos, poções curativas, relíquias arcanas,
              tecnomagia cyberware, minérios de forja e equipamentos de aventura registrados nas crônicas de Nexaria.
            </p>

            {/* Aviso de Compêndio Exclusivo para Conhecimento */}
            <div className="mt-2 flex items-start gap-2.5 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-sans">
              <BookOpen className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Compêndio de Conhecimento:</strong> Este catálogo é um livro de registros e enciclopédia para pesquisa de atributos, lore e lendas de jogo. Equipamentos devem ser adquiridos no <strong>Bazar do Mestre</strong> ou encontrados em baús e masmorras.
              </span>
            </div>

            {/* Quick badges com contagem real */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] font-sans">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-purple-900/60 text-zinc-300 flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-amber-400" />
                <strong>{ALL_GAME_ITEMS_CATALOG.filter(i => i.category === 'arma').length}</strong> Armas
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-purple-900/60 text-zinc-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <strong>{ALL_GAME_ITEMS_CATALOG.filter(i => i.category === 'armadura').length}</strong> Armaduras &amp; Escudos
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-purple-900/60 text-zinc-300 flex items-center gap-1.5">
                <span>🧪</span>
                <strong>{ALL_GAME_ITEMS_CATALOG.filter(i => i.category === 'pocao').length}</strong> Poções &amp; Óleos
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-purple-900/60 text-zinc-300 flex items-center gap-1.5">
                <span>💍</span>
                <strong>{ALL_GAME_ITEMS_CATALOG.filter(i => i.category === 'reliquia').length}</strong> Relíquias
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-purple-900/60 text-zinc-300 flex items-center gap-1.5">
                <span>💠</span>
                <strong>{ALL_GAME_ITEMS_CATALOG.filter(i => i.category === 'cyber').length}</strong> Cyberware
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-purple-900/60 text-zinc-300 flex items-center gap-1.5">
                <span>⛏️</span>
                <strong>{ALL_GAME_ITEMS_CATALOG.filter(i => i.category === 'material').length}</strong> Materiais
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-purple-900/60 text-zinc-300 flex items-center gap-1.5">
                <span>🎒</span>
                <strong>{ALL_GAME_ITEMS_CATALOG.filter(i => i.category === 'equipamento').length}</strong> Equipamentos
              </span>
            </div>
          </div>

          {/* Quick Context & Navigation Box */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 bg-purple-950/40 border border-purple-900/70 p-3.5 rounded-xl">
            <div className="text-xs">
              <span className="text-zinc-400 font-sans">Aventureiro Ativo:</span>
              <p className="font-cinzel font-bold text-amber-300 text-sm">
                {activeCharacter ? activeCharacter.name : isGm ? '👑 Mestre da Campanha' : 'Nenhum selecionado'}
              </p>
              {activeCharacter && (
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  Mochila: {activeCharacter.inventory.length} itens &bull; {activeCharacter.wallet.BRZ} BRZ / {activeCharacter.wallet.PRT} PRT / {activeCharacter.wallet.ORO} ORO
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-purple-900/50">
              {onNavigateToInventory && (
                <button
                  type="button"
                  onClick={onNavigateToInventory}
                  className="px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-cinzel font-semibold transition flex items-center gap-1.5"
                >
                  <Backpack className="w-3.5 h-3.5" />
                  <span>Minha Mochila</span>
                </button>
              )}
              {onNavigateToShop && (
                <button
                  type="button"
                  onClick={onNavigateToShop}
                  className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-200 text-xs font-cinzel font-semibold transition flex items-center gap-1.5"
                >
                  <Store className="w-3.5 h-3.5 text-amber-400" />
                  <span>Loja do Mestre</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE CONTROLE: PESQUISA, CATEGORIAS, RARIDADES E ORDENAÇÃO */}
      <div className="space-y-3 bg-[#0d0718]/90 border border-purple-900/60 p-4 rounded-xl shadow-lg">
        {/* Linha 1: Input de Pesquisa & Ordenação */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Campo de Busca Livre */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, dano, efeito, subcategoria, propriedades rúnicas..."
              className="w-full pl-10 pr-9 py-2.5 bg-zinc-900/90 border border-purple-800/60 focus:border-amber-400 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Ordenação & Modo de Visualização */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-purple-800/60 rounded-xl px-2.5 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-medium text-amber-200 focus:outline-none cursor-pointer"
              >
                <option value="rarity" className="bg-zinc-900 text-zinc-100">
                  Raridade (Maior para Menor)
                </option>
                <option value="name" className="bg-zinc-900 text-zinc-100">
                  Nome (A &rarr; Z)
                </option>
                <option value="price_asc" className="bg-zinc-900 text-zinc-100">
                  Preço: Mais Barato
                </option>
                <option value="price_desc" className="bg-zinc-900 text-zinc-100">
                  Preço: Mais Valioso
                </option>
                <option value="weight" className="bg-zinc-900 text-zinc-100">
                  Peso (Mais Leve)
                </option>
              </select>
            </div>

            {/* Alternar Grid / Lista */}
            <div className="flex items-center bg-zinc-900/90 border border-purple-800/60 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Modo Grade com Cards Detalhados"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Modo Tabela Compacta"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Linha 2: Filtro por Categorias (com contadores) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-1">
          {CATALOG_CATEGORIES_CONFIG.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  sound.playCoinClink('PRT');
                  setSelectedCategory(cat.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-cinzel font-semibold flex items-center gap-1.5 shrink-0 transition ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-950/40'
                    : 'bg-zinc-900/70 hover:bg-purple-950/60 text-zinc-300 hover:text-amber-200 border border-purple-900/40'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-zinc-950 text-amber-300 font-bold' : 'bg-purple-950/80 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Linha 3: Filtro por Raridade */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[11px] font-cinzel text-zinc-400 shrink-0 mr-1">Raridade:</span>
          {CATALOG_RARITIES_CONFIG.map((rar) => {
            const isSelected = selectedRarity === rar.id;
            return (
              <button
                key={rar.id}
                type="button"
                onClick={() => {
                  sound.playCoinClink('BRZ');
                  setSelectedRarity(rar.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-cinzel font-semibold shrink-0 transition flex items-center gap-1 border ${
                  isSelected
                    ? `${rar.badgeBg} ${rar.borderClass} text-white shadow-sm ring-1 ring-amber-400/40`
                    : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
                }`}
                style={isSelected ? { color: rar.color } : {}}
              >
                <span>{rar.label}</span>
              </button>
            );
          })}

          {(selectedCategory !== 'all' || selectedRarity !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedRarity('all');
                setSearchQuery('');
              }}
              className="text-[11px] text-amber-400 hover:underline ml-auto pl-2 shrink-0"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* CONTADOR DE RESULTADOS */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>
          Exibindo <strong className="text-amber-300">{filteredItems.length}</strong> de{' '}
          <strong>{ALL_GAME_ITEMS_CATALOG.length}</strong> itens catalogados
        </span>
        {selectedCategory !== 'all' && (
          <span className="text-purple-300 font-cinzel">
            Categoria: {CATALOG_CATEGORIES_CONFIG.find((c) => c.id === selectedCategory)?.label}
          </span>
        )}
      </div>

      {/* MODO 1: GRADE DE CARDS (GRID VIEW) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, index) => {
            const rarityStyle = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.comum;
            const currencyConfig = CURRENCY_CONFIGS[item.valueCurrency] || CURRENCY_CONFIGS.BRZ;
            const isComparing = compareItems.some((i) => i.id === item.id);

            return (
              <div
                key={item.id || `catalog-grid-item-${index}-${item.name}`}
                className={`flex flex-col justify-between rounded-2xl border ${rarityStyle.border} ${rarityStyle.bg} bg-opacity-70 p-4.5 shadow-lg hover:shadow-2xl transition duration-200 group relative backdrop-blur-sm`}
              >
                {/* Linha Superior: Ícone, Subcategoria, Raridade e Preço */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900/90 border border-purple-800/50 flex items-center justify-center text-2xl shrink-0 shadow-inner group-hover:scale-105 transition">
                        {item.iconEmoji}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-purple-950/70 border border-purple-800/50 text-purple-300">
                          {item.subcategory}
                        </span>
                        <h3
                          className="font-cinzel font-bold text-sm sm:text-base text-zinc-100 group-hover:text-amber-200 transition mt-1 line-clamp-1"
                          title={item.name}
                        >
                          {item.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span
                        className={`text-[10px] font-cinzel font-bold px-2 py-0.5 rounded-md border ${rarityStyle.border} ${rarityStyle.text} bg-zinc-950/70 uppercase`}
                      >
                        {item.rarity}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-300 mt-1">
                        <Coins className="w-3 h-3 text-amber-400" />
                        <span>
                          {item.valueAmount > 0 ? `${item.valueAmount} ${item.valueCurrency}` : 'Inestimável'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Efeito em Destaque / Dano / Bônus */}
                  <div className="bg-zinc-950/70 border border-purple-900/50 rounded-xl p-2.5 mb-2.5">
                    <div className="text-[11px] font-sans font-semibold text-emerald-300 leading-snug">
                      ✦ {item.effectText}
                    </div>
                  </div>

                  {/* Descrição & Lore */}
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed line-clamp-2 mb-3">
                    {item.description}
                  </p>

                  {/* Propriedades & Durabilidade */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-900/80 border border-zinc-700/60 text-zinc-300 font-mono">
                      ⚖️ {item.weightKg} kg
                    </span>
                    {item.properties && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-800/40 text-purple-300">
                        🏷️ {item.properties}
                      </span>
                    )}
                    {item.durability && (
                      <span className="px-2 py-0.5 rounded-md bg-zinc-900/80 border border-amber-600/40 text-amber-300 font-mono">
                        🔨 Durab: {item.durability.current}/{item.durability.max}
                      </span>
                    )}
                  </div>
                </div>

                {/* AÇÕES NO CARD: Consulta & Conhecimento */}
                <div className="pt-3 border-t border-purple-900/40 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {/* Botão Inspecionar Detalhes */}
                    <button
                      type="button"
                      onClick={() => setInspectingItem(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-200 font-cinzel font-bold text-[11px] transition shadow flex items-center gap-1"
                      title="Inspecionar ficha completa, história e atributos do item"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-300" />
                      <span>Inspecionar</span>
                    </button>

                    {/* Botão Comparar */}
                    <button
                      type="button"
                      onClick={() => handleToggleCompare(item)}
                      className={`px-2 py-1.5 rounded-lg border text-[11px] font-cinzel font-semibold transition flex items-center gap-1 ${
                        isComparing
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
                      }`}
                      title="Comparar com outro item selecionado"
                    >
                      <ArrowUpDown className="w-3 h-3 text-amber-400" />
                      <span>{isComparing ? 'Comparando' : 'Comparar'}</span>
                    </button>

                    {/* Ações Específicas do Mestre */}
                    {isGm && (
                      <button
                        type="button"
                        onClick={() => handleAddShopMarketItem(item)}
                        className="p-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-600/50 text-amber-300 transition"
                        title="Adicionar à Loja/Bazar do Mestre para os jogadores comprarem durante a sessão"
                      >
                        <Store className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Botão Copiar */}
                    <button
                      type="button"
                      onClick={() => handleCopyStats(item)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
                      title="Copiar estatísticas para a área de transferência"
                    >
                      {copiedItemId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Botão Inspecionar Detalhes */}
                    <button
                      type="button"
                      onClick={() => {
                        sound.playCoinClink('PRT');
                        setInspectingItem(item);
                      }}
                      className="p-1.5 rounded-lg text-purple-300 hover:text-amber-200 hover:bg-purple-950 transition"
                      title="Ver ficha completa e história deste item"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODO 2: TABELA COMPACTA (LIST VIEW) */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-purple-900/60 bg-[#0c0617]/90 shadow-xl">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#180a2b] border-b border-purple-900/60 text-zinc-300 font-cinzel font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3">Raridade</th>
                <th className="py-3 px-4">Efeito / Dano Principal</th>
                <th className="py-3 px-3">Peso</th>
                <th className="py-3 px-3">Preço</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-950/60">
              {filteredItems.map((item, index) => {
                const rarityStyle = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.comum;
                return (
                  <tr
                    key={item.id || `catalog-table-item-${index}-${item.name}`}
                    className="hover:bg-purple-950/30 transition cursor-pointer"
                    onClick={() => setInspectingItem(item)}
                  >
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <span className="text-xl shrink-0">{item.iconEmoji}</span>
                      <div>
                        <div className="font-cinzel font-bold text-zinc-100 hover:text-amber-300 transition">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {item.subcategory}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-purple-900 text-zinc-300 text-[10px] uppercase font-mono">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-cinzel font-bold px-2 py-0.5 rounded-md border ${rarityStyle.border} ${rarityStyle.text} bg-zinc-950/60 uppercase`}
                      >
                        {item.rarity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-emerald-300 font-semibold max-w-xs truncate">
                      {item.effectText}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-400">{item.weightKg} kg</td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-300 whitespace-nowrap">
                      {item.valueAmount > 0 ? `${item.valueAmount} ${item.valueCurrency}` : 'Inestimável'}
                    </td>
                    <td
                      className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setInspectingItem(item)}
                        className="px-2.5 py-1 rounded bg-purple-900/40 hover:bg-purple-900/70 border border-purple-700/50 text-purple-200 text-[11px] font-cinzel font-semibold inline-flex items-center gap-1 transition"
                        title="Inspecionar ficha completa"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspecionar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyStats(item)}
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] inline-flex items-center transition"
                        title="Copiar Ficha"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {isGm && (
                        <button
                          type="button"
                          onClick={() => handleAddShopMarketItem(item)}
                          className="p-1 rounded bg-amber-950/60 hover:bg-amber-900 text-amber-300 text-[11px] inline-flex items-center transition"
                          title="Pôr no Bazar do Mestre"
                        >
                          <Store className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ESTADO VAZIO */}
      {filteredItems.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-purple-900/50 bg-[#120822]/80 p-8 max-w-lg mx-auto shadow-xl space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto text-2xl">
            🔍
          </div>
          <h3 className="text-base font-cinzel font-bold text-zinc-100">
            Nenhum Item Encontrado no Compêndio
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Nenhum item corresponde aos filtros e termos de pesquisa informados. Tente buscar por outros termos ou limpe os filtros ativos.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedRarity('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-cinzel font-bold text-xs rounded-xl shadow transition"
          >
            Limpar Todos os Filtros
          </button>
        </div>
      )}

      {/* MODAL DE INSPEÇÃO COMPLETA DO ITEM */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-xl bg-gradient-to-b from-[#180a29] via-[#10061c] to-[#0a0312] border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fechar Modal */}
            <button
              type="button"
              onClick={() => setInspectingItem(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do Item */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-purple-700/60 flex items-center justify-center text-3xl shrink-0 shadow-lg">
                {inspectingItem.iconEmoji}
              </div>
              <div className="space-y-1 pr-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-cinzel font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                      RARITY_CONFIG[inspectingItem.rarity]?.border || 'border-zinc-500'
                    } ${RARITY_CONFIG[inspectingItem.rarity]?.text || 'text-zinc-300'} bg-zinc-950`}
                  >
                    {inspectingItem.rarity}
                  </span>
                  <span className="text-xs text-purple-300 font-mono bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-800/40">
                    {inspectingItem.subcategory}
                  </span>
                </div>
                <h2 className="text-xl font-cinzel font-black text-amber-200">
                  {inspectingItem.name}
                </h2>
              </div>
            </div>

            {/* Caixa Mecânica / Efeito Principal */}
            <div className="bg-zinc-950/80 border border-emerald-500/40 rounded-xl p-4 space-y-1">
              <div className="text-[11px] uppercase tracking-wider font-cinzel font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Efeito Mecânico &amp; Combate</span>
              </div>
              <p className="text-sm font-sans font-bold text-emerald-200">
                {inspectingItem.effectText}
              </p>
            </div>

            {/* Propriedades, Durabilidade e Valores */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-sans">
              <div className="bg-purple-950/40 border border-purple-900/60 rounded-xl p-2.5">
                <span className="text-zinc-400 block text-[10px] uppercase font-mono">Preço Oficial</span>
                <span className="text-amber-300 font-bold text-sm">
                  {inspectingItem.valueAmount > 0
                    ? `${inspectingItem.valueAmount} ${inspectingItem.valueCurrency}`
                    : 'Inestimável / Relíquia de Missão'}
                </span>
              </div>

              <div className="bg-purple-950/40 border border-purple-900/60 rounded-xl p-2.5">
                <span className="text-zinc-400 block text-[10px] uppercase font-mono">Peso de Carga</span>
                <span className="text-zinc-200 font-bold text-sm">
                  {inspectingItem.weightKg} kg
                </span>
              </div>

              <div className="bg-purple-950/40 border border-purple-900/60 rounded-xl p-2.5">
                <span className="text-zinc-400 block text-[10px] uppercase font-mono">Durabilidade</span>
                <span className="text-amber-400 font-bold text-sm">
                  {inspectingItem.durability
                    ? `${inspectingItem.durability.current}/${inspectingItem.durability.max}`
                    : 'Inquebrável'}
                </span>
              </div>
            </div>

            {inspectingItem.properties && (
              <div className="text-xs bg-zinc-900/60 border border-purple-900/40 rounded-xl p-3">
                <span className="text-zinc-400 font-mono text-[10px] uppercase block mb-1">
                  Propriedades Táticas:
                </span>
                <p className="text-purple-200 font-semibold">{inspectingItem.properties}</p>
              </div>
            )}

            {/* Descrição Imersiva de Lore */}
            <div className="space-y-1.5">
              <span className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wide">
                História &amp; Descrição
              </span>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
                {inspectingItem.description}
              </p>
            </div>

            {/* Citação / Lore Quote */}
            {inspectingItem.loreQuote && (
              <blockquote className="border-l-2 border-amber-500/60 pl-3 py-1 italic text-xs text-amber-200/90 font-serif">
                {inspectingItem.loreQuote}
              </blockquote>
            )}

            {/* Ações dentro do Modal */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-purple-900/60">
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-300 font-cinzel bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Item registrado no compêndio para consulta</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleToggleCompare(inspectingItem);
                    setInspectingItem(null);
                  }}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-purple-500/40 text-purple-200 text-xs font-cinzel font-semibold rounded-xl transition flex items-center gap-1.5"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Comparar Item</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyStats(inspectingItem)}
                  className="px-3.5 py-2 bg-purple-950/60 hover:bg-purple-900 border border-purple-800/60 text-purple-200 text-xs font-cinzel font-semibold rounded-xl transition flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Ficha</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DO MESTRE: ENTREGAR ITEM AO PERSONAGEM */}
      {giveToCharModalItem && campaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-gradient-to-b from-[#180a2b] to-[#0c0516] border border-amber-500/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-purple-900/60">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-cinzel font-bold text-amber-200 text-base">
                  Entregar Item ao Jogador
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGiveToCharModalItem(null)}
                className="text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-zinc-900/80 rounded-xl border border-purple-900/40">
              <span className="text-3xl">{giveToCharModalItem.iconEmoji}</span>
              <div>
                <h4 className="font-cinzel font-bold text-zinc-100 text-sm">
                  {giveToCharModalItem.name}
                </h4>
                <p className="text-xs text-zinc-400 font-mono">
                  {giveToCharModalItem.subcategory} &bull; {giveToCharModalItem.rarity.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-cinzel font-semibold text-zinc-300">
                Selecione o Destinatário na Mesa:
              </label>
              {campaign.players.length === 0 ? (
                <p className="text-xs text-red-400">
                  Não há jogadores cadastrados nesta campanha no momento.
                </p>
              ) : (
                <select
                  value={selectedRecipientId}
                  onChange={(e) => setSelectedRecipientId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-purple-800/80 text-zinc-100 text-xs focus:outline-none focus:border-amber-400 font-sans cursor-pointer"
                >
                  {campaign.players.map((p) => (
                    <option key={p.id} value={p.id}>
                      ⚔️ {p.name} ({p.characterClass} - Nível {p.level})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-900/60">
              <button
                type="button"
                onClick={() => setGiveToCharModalItem(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmGiveToPlayer}
                disabled={campaign.players.length === 0}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-cinzel font-bold text-xs shadow disabled:opacity-50"
              >
                Entregar Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
