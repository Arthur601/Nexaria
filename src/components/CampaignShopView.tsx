import React, { useState } from 'react';
import {
  CampaignRoom,
  CharacterSheet,
  ShopItem,
  CurrencyType,
  ItemCategory,
  ItemRarity,
  CURRENCY_CONFIGS,
  calculateTotalNetWorthInBRZ,
  InventoryItem,
} from '../types/rpg';
import { PRESET_NEXARIA_ITEMS, CATEGORY_LABELS, RARITY_CONFIG } from '../data/defaultItems';
import { sound } from '../utils/audio';
import {
  Store,
  Plus,
  ShoppingBag,
  Coins,
  Sparkles,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Package,
  Crown,
  Shield,
  Zap,
  Filter,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface CampaignShopViewProps {
  campaign: CampaignRoom;
  activeCharacter: CharacterSheet | null;
  activeRole: string; // 'gm' or characterId
  onUpdateCampaign: (updated: CampaignRoom) => void;
  onUpdateCharacter?: (updated: CharacterSheet) => void;
  onNavigateToSheet?: () => void;
}

export const CampaignShopView: React.FC<CampaignShopViewProps> = ({
  campaign,
  activeCharacter,
  activeRole,
  onUpdateCampaign,
  onUpdateCharacter,
  onNavigateToSheet,
}) => {
  const isGm = activeRole === 'gm';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // GM Add Item state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ItemCategory>('arma');
  const [newItemRarity, setNewItemRarity] = useState<ItemRarity>('comum');
  const [newItemPrice, setNewItemPrice] = useState<number>(10);
  const [newItemCurrency, setNewItemCurrency] = useState<CurrencyType>('PRT');
  const [newItemStock, setNewItemStock] = useState<number>(5);
  const [newItemWeight, setNewItemWeight] = useState<number>(1.0);
  const [newItemEffect, setNewItemEffect] = useState<string>('');
  const [newItemDesc, setNewItemDesc] = useState<string>('');
  const [newItemIcon, setNewItemIcon] = useState<string>('⚔️');

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Filter items in market
  const filteredItems = campaign.marketItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Handle player purchase
  const handleBuyItem = (item: ShopItem) => {
    if (!activeCharacter) {
      showToast('error', 'Selecione uma ficha de personagem para comprar itens no Bazar.');
      return;
    }

    const currentBalance = activeCharacter.wallet[item.currency] || 0;
    if (currentBalance < item.price) {
      sound.playInsufficientBalance();
      showToast(
        'error',
        `Moedas insuficientes! Você possui ${currentBalance} ${item.currency}, mas o item custa ${item.price} ${item.currency}.`
      );
      return;
    }

    if (item.stock !== undefined && item.stock <= 0) {
      showToast('error', `O item "${item.name}" está esgotado no estoque do mercador!`);
      return;
    }

    sound.playCoinReceived(item.currency);

    // 1. Deduct price from character's wallet
    const updatedWallet = {
      ...activeCharacter.wallet,
      [item.currency]: currentBalance - item.price,
    };

    // 2. Add item to character's inventory
    const existingInvItem = activeCharacter.inventory.find(
      (i) => i.name.toLowerCase() === item.name.toLowerCase()
    );

    let updatedInventory: InventoryItem[];
    if (existingInvItem) {
      updatedInventory = activeCharacter.inventory.map((i) =>
        i.id === existingInvItem.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      const newInvItem: InventoryItem = {
        id: 'item-bought-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        name: item.name,
        category: item.category,
        rarity: item.rarity || 'comum',
        quantity: 1,
        weightKg: item.weightKg || 1.0,
        effectText: item.effectText || '',
        description: item.description,
        valueAmount: item.price,
        valueCurrency: item.currency,
        iconEmoji: item.icon,
        equipped: false,
      };
      updatedInventory = [newInvItem, ...activeCharacter.inventory];
    }

    const updatedChar: CharacterSheet = {
      ...activeCharacter,
      wallet: updatedWallet,
      inventory: updatedInventory,
    };

    // 3. Decrement stock in market if tracked
    const updatedMarketItems = campaign.marketItems.map((m) => {
      if (m.id === item.id && m.stock !== undefined) {
        return { ...m, stock: Math.max(0, m.stock - 1) };
      }
      return m;
    });

    // 4. Record transaction in campaign
    const newTx = {
      id: 'tx-shop-' + Date.now(),
      campaignCode: campaign.code,
      senderId: activeCharacter.id,
      senderName: activeCharacter.name,
      receiverId: 'gm',
      receiverName: campaign.gmName || 'Bazar do Mestre',
      amount: item.price,
      currency: item.currency,
      reason: `Compra de ${item.name}`,
      type: 'shop_purchase' as const,
      status: 'confirmed' as const,
      timestamp: Date.now(),
    };

    const updatedPlayers = campaign.players.map((p) =>
      p.id === activeCharacter.id ? updatedChar : p
    );

    const updatedCampaign: CampaignRoom = {
      ...campaign,
      players: updatedPlayers,
      marketItems: updatedMarketItems,
      transactions: [newTx, ...campaign.transactions],
    };

    if (onUpdateCharacter) {
      onUpdateCharacter(updatedChar);
    }
    onUpdateCampaign(updatedCampaign);

    showToast(
      'success',
      `Compra realizada! 1x ${item.name} foi adicionado(a) à sua mochila por ${item.price} ${item.currency}.`
    );
  };

  // GM: Add new custom shop item
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      showToast('error', 'Preencha o nome do item.');
      return;
    }

    const createdItem: ShopItem = {
      id: 'shop-item-' + Date.now(),
      name: newItemName.trim(),
      category: newItemCategory,
      rarity: newItemRarity,
      price: Math.max(1, newItemPrice),
      currency: newItemCurrency,
      stock: newItemStock > 0 ? newItemStock : undefined,
      weightKg: newItemWeight,
      effectText: newItemEffect.trim(),
      description: newItemDesc.trim() || 'Equipamento disponível no Bazar de Eldria.',
      icon: newItemIcon || '⚔️',
    };

    const updatedMarket = [createdItem, ...campaign.marketItems];
    onUpdateCampaign({ ...campaign, marketItems: updatedMarket });
    sound.playCoinClink('ORO');

    // Reset form
    setNewItemName('');
    setNewItemDesc('');
    setNewItemEffect('');
    setIsAddingItem(false);
    showToast('success', `Item "${createdItem.name}" adicionado à loja do Mestre!`);
  };

  // GM: Load standard preset items into shop
  const handleLoadPresets = () => {
    sound.playSuccessFanfare();
    const presetsToAdd: ShopItem[] = PRESET_NEXARIA_ITEMS.slice(0, 10).map((preset, idx) => ({
      id: 'shop-preset-' + Date.now() + '-' + idx,
      name: preset.name,
      category: preset.category,
      rarity: preset.rarity,
      description: preset.description,
      price: preset.valueAmount,
      currency: preset.valueCurrency,
      stock: 5,
      icon: preset.iconEmoji || '🎒',
      weightKg: preset.weightKg,
      effectText: preset.effectText,
    }));

    // Filter out duplicates by name
    const existingNames = new Set(campaign.marketItems.map((i) => i.name.toLowerCase()));
    const newItems = presetsToAdd.filter((p) => !existingNames.has(p.name.toLowerCase()));

    if (newItems.length === 0) {
      showToast('error', 'Os equipamentos pré-definidos já estão presentes na loja.');
      return;
    }

    const updatedMarket = [...campaign.marketItems, ...newItems];
    onUpdateCampaign({ ...campaign, marketItems: updatedMarket });
    showToast('success', `+${newItems.length} equipamentos oficiais adicionados ao catálogo da loja!`);
  };

  // GM: Remove item from shop
  const handleRemoveItem = (itemId: string) => {
    sound.playCoinClink('BRZ');
    const updatedMarket = campaign.marketItems.filter((i) => i.id !== itemId);
    onUpdateCampaign({ ...campaign, marketItems: updatedMarket });
    showToast('success', 'Item removido do catálogo.');
  };

  return (
    <div className="space-y-4">
      {/* Banner da Loja de Eldria */}
      <div className="relative rounded-2xl border border-amber-600/40 bg-gradient-to-r from-[#140b25] via-[#1c0f33] to-[#0c0716] p-4 sm:p-6 shadow-2xl overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-4 bottom-2 opacity-10 pointer-events-none text-8xl font-cinzel">
          ✦
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-950 via-purple-950 to-zinc-950 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-950/50 shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-100">
                  Bazar dos Reinos &amp; Loja de Equipamentos
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-cinzel font-bold uppercase">
                  Mesa {campaign.code}
                </span>
              </div>
              <p className="text-xs text-zinc-400 max-w-xl mt-0.5 leading-relaxed">
                Mercadorias oficiais aprovadas pelo Mestre da Mesa (<strong className="text-zinc-200">{campaign.gmName}</strong>).
                Compre armas, armaduras, consumíveis e relíquias com suas moedas da campanha.
              </p>
            </div>
          </div>

          {/* Saldo do Jogador Ativo */}
          {activeCharacter ? (
            <div className="flex flex-col items-start sm:items-end bg-zinc-950/70 border border-amber-500/30 px-3.5 py-2 rounded-xl shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-cinzel">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Carteira de <strong className="text-amber-200">{activeCharacter.name}</strong>:</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs mt-1">
                <span className="text-amber-600 font-bold">{activeCharacter.wallet.BRZ || 0} BRZ</span>
                <span className="text-zinc-300 font-bold">{activeCharacter.wallet.PRT || 0} PRT</span>
                <span className="text-amber-400 font-bold">{activeCharacter.wallet.ORO || 0} ORO</span>
                <span className="text-indigo-300 font-bold">{activeCharacter.wallet.PLN || 0} PLN</span>
                <span className="text-cyan-400 font-bold">{activeCharacter.wallet.CYB || 0} CYB</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-700/50 px-3 py-1.5 rounded-xl text-xs text-amber-300 font-cinzel">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Modo Mestre — Gerenciando Catálogo da Loja</span>
            </div>
          )}
        </div>

        {/* Notificação Toast */}
        {feedback && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-300'
                : 'bg-red-950/80 border-red-700/80 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      {/* Controles de Gerenciamento para o Mestre */}
      {isGm && (
        <div className="rounded-xl border border-amber-500/40 bg-[#110b22] p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-purple-900/40">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <h3 className="font-cinzel font-bold text-amber-300 text-xs uppercase tracking-wider">
                Ferramentas do Mestre: Gestão da Loja
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadPresets}
                className="px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-200 hover:text-purple-100 text-xs font-cinzel font-semibold flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Carregar 10 Equipamentos Pré-definidos</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 text-xs font-cinzel font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingItem ? 'Fechar Cadastro' : 'Cadastrar Novo Item'}</span>
              </button>
            </div>
          </div>

          {/* Formulário de Cadastro de Novo Item pelo Mestre */}
          {isAddingItem && (
            <form onSubmit={handleAddNewItem} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-cinzel text-zinc-300 mb-1">
                  Nome do Item *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Machado de Guerra Rúnico"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-zinc-950 border border-purple-900/60 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-cinzel text-zinc-300 mb-1">
                  Categoria
                </label>
                <select
                  value={newItemCategory}
                  onChange={(e) => {
                    const cat = e.target.value as ItemCategory;
                    setNewItemCategory(cat);
                    if (cat === 'arma') setNewItemIcon('⚔️');
                    else if (cat === 'armadura') setNewItemIcon('🛡️');
                    else if (cat === 'pocao') setNewItemIcon('🧪');
                    else if (cat === 'reliquia') setNewItemIcon('💍');
                    else if (cat === 'cyber') setNewItemIcon('💠');
                    else setNewItemIcon('🎒');
                  }}
                  className="w-full bg-zinc-950 border border-purple-900/60 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="arma">Arma (⚔️)</option>
                  <option value="armadura">Armadura (🛡️)</option>
                  <option value="pocao">Poção / Consumível (🧪)</option>
                  <option value="reliquia">Relíquia Arcana (💍)</option>
                  <option value="cyber">Tecnomagia / Cyber (💠)</option>
                  <option value="equipamento">Equipamento (🎒)</option>
                  <option value="geral">Item Geral (📜)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-cinzel text-zinc-300 mb-1">
                  Preço e Moeda *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-20 bg-zinc-950 border border-purple-900/60 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                  <select
                    value={newItemCurrency}
                    onChange={(e) => setNewItemCurrency(e.target.value as CurrencyType)}
                    className="flex-1 bg-zinc-950 border border-purple-900/60 rounded-lg px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="BRZ">BRZ (Bronze)</option>
                    <option value="PRT">PRT (Prata)</option>
                    <option value="ORO">ORO (Ouro)</option>
                    <option value="PLN">PLN (Platina)</option>
                    <option value="CYB">CYB (Cybermoeda)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-cinzel text-zinc-300 mb-1">
                  Raridade &amp; Estoque
                </label>
                <div className="flex gap-2">
                  <select
                    value={newItemRarity}
                    onChange={(e) => setNewItemRarity(e.target.value as ItemRarity)}
                    className="flex-1 bg-zinc-950 border border-purple-900/60 rounded-lg px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="comum">Comum</option>
                    <option value="incomum">Incomum</option>
                    <option value="raro">Raro</option>
                    <option value="epico">Épico</option>
                    <option value="lendario">Lendário</option>
                    <option value="abissal">Abissal</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    title="Estoque disponível"
                    placeholder="Qtd"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 bg-zinc-950 border border-purple-900/60 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-200"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-cinzel text-zinc-300 mb-1">
                  Efeito Mágico / Mecânico
                </label>
                <input
                  type="text"
                  placeholder="Ex: Causa 1d8+2 de dano cortante e emite luz mágica."
                  value={newItemEffect}
                  onChange={(e) => setNewItemEffect(e.target.value)}
                  className="w-full bg-zinc-950 border border-purple-900/60 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-cinzel text-zinc-300 mb-1">
                  Descrição &amp; Lore do Item
                </label>
                <input
                  type="text"
                  placeholder="Ex: Forjada nas profundezas das forjas de Eldria."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-purple-900/60 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-4 flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-cinzel font-bold text-xs"
                >
                  Adicionar ao Catálogo
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Barra de Busca e Filtros por Categoria */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar item pelo nome ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-purple-900/50 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Abas Rápidas de Categoria */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'arma', label: 'Armas' },
            { id: 'armadura', label: 'Armaduras' },
            { id: 'pocao', label: 'Poções' },
            { id: 'reliquia', label: 'Relíquias' },
            { id: 'cyber', label: 'Cyber' },
            { id: 'equipamento', label: 'Equipamentos' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Catálogo de Itens da Loja */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
          <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-cinzel font-bold text-zinc-300 mb-1">
            Nenhum Item Encontrado
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
            {campaign.marketItems.length === 0
              ? 'O Mestre ainda não colocou itens à venda neste Bazar. Aguarde o Mestre adicionar equipamentos ou espólios da aventura!'
              : 'Nenhum equipamento corresponde aos filtros selecionados.'}
          </p>
          {isGm && campaign.marketItems.length === 0 && (
            <button
              type="button"
              onClick={handleLoadPresets}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-cinzel font-bold text-xs rounded-xl shadow-md transition"
            >
              Carregar 10 Itens de Exemplo na Loja
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredItems.map((item) => {
            const rarCfg = RARITY_CONFIG[item.rarity || 'comum'];
            const playerBalance = activeCharacter ? activeCharacter.wallet[item.currency] || 0 : 0;
            const canAfford = activeCharacter ? playerBalance >= item.price : false;
            const isOutOfStock = item.stock !== undefined && item.stock <= 0;

            return (
              <div
                key={item.id}
                className={`rounded-xl border bg-gradient-to-br from-[#100a1f] to-[#090510] p-4 flex flex-col justify-between shadow-md transition-all hover:border-amber-500/60 ${
                  item.rarity === 'abissal'
                    ? 'border-red-900/60'
                    : item.rarity === 'lendario'
                    ? 'border-amber-500/60'
                    : 'border-purple-900/50'
                }`}
              >
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 mb-2 border-b border-purple-900/30">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
                        {item.icon || '🎒'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-cinzel font-bold text-xs text-amber-200 truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-mono font-semibold ${rarCfg.border} ${rarCfg.bg} ${rarCfg.text}`}
                          >
                            {rarCfg.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-sans">
                            {CATEGORY_LABELS[item.category]?.label || item.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isGm && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-800 transition"
                        title="Remover Item da Loja"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Efeito Mecânico */}
                  {item.effectText && (
                    <div className="rounded-lg bg-amber-950/30 border border-amber-500/30 px-2 py-1 mb-2 text-[11px] text-amber-300 font-sans font-medium flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="line-clamp-2">{item.effectText}</span>
                    </div>
                  )}

                  {/* Descrição */}
                  <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3 mb-3 font-sans">
                    {item.description}
                  </p>
                </div>

                {/* Rodapé: Preço, Estoque & Botão de Compra */}
                <div className="pt-2.5 border-t border-purple-900/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-400 font-cinzel">Preço:</span>
                      <span className="font-mono font-extrabold text-amber-300 text-sm">
                        {item.price} {item.currency}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block font-cinzel">Estoque:</span>
                      <span
                        className={`text-xs font-mono font-semibold ${
                          isOutOfStock ? 'text-red-400' : 'text-zinc-300'
                        }`}
                      >
                        {item.stock !== undefined ? (isOutOfStock ? 'Esgotado' : `${item.stock} un`) : 'Infinito'}
                      </span>
                    </div>
                  </div>

                  {/* Botão de Compra para o Jogador */}
                  {activeCharacter ? (
                    <button
                      type="button"
                      disabled={!canAfford || isOutOfStock}
                      onClick={() => handleBuyItem(item)}
                      className={`w-full py-2 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm ${
                        isOutOfStock
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                          : canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 shadow-amber-950/40'
                          : 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>
                        {isOutOfStock
                          ? 'Item Esgotado'
                          : canAfford
                          ? `Comprar (${item.price} ${item.currency})`
                          : `Falta ${item.price - playerBalance} ${item.currency}`}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full py-1.5 rounded-xl bg-zinc-900 text-zinc-500 text-[11px] font-cinzel font-medium text-center border border-zinc-800"
                    >
                      Mestre (Somente Visualização)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
