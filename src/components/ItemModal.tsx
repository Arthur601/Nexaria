import React, { useState, useEffect } from 'react';
import {
  InventoryItem,
  ItemCategory,
  ItemRarity,
  CurrencyType,
} from '../types/rpg';
import {
  PRESET_NEXARIA_ITEMS,
  CATEGORY_LABELS,
  RARITY_CONFIG,
} from '../data/defaultItems';
import { sound } from '../utils/audio';
import {
  X,
  Plus,
  Package,
  Sparkles,
  Shield,
  Coins,
  Check,
} from 'lucide-react';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (item: InventoryItem) => void;
  editingItem?: InventoryItem | null;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSaveItem,
  editingItem,
}) => {
  const [modalMode, setModalMode] = useState<'custom' | 'presets'>('custom');

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('equipamento');
  const [rarity, setRarity] = useState<ItemRarity>('comum');
  const [quantity, setQuantity] = useState<number>(1);
  const [weightKg, setWeightKg] = useState<number>(1.0);
  const [effectText, setEffectText] = useState('');
  const [description, setDescription] = useState('');
  const [valueAmount, setValueAmount] = useState<number>(5);
  const [valueCurrency, setValueCurrency] = useState<CurrencyType>('BRZ');
  const [iconEmoji, setIconEmoji] = useState('🎒');

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || '');
      setCategory(editingItem.category || 'equipamento');
      setRarity(editingItem.rarity || 'comum');
      setQuantity(editingItem.quantity || 1);
      setWeightKg(editingItem.weightKg ?? (parseFloat(editingItem.weight || '1') || 1));
      setEffectText(editingItem.effectText || '');
      setDescription(editingItem.description || '');
      setValueAmount(editingItem.valueAmount || 0);
      setValueCurrency(editingItem.valueCurrency || 'BRZ');
      setIconEmoji(editingItem.iconEmoji || CATEGORY_LABELS[editingItem.category]?.icon || '🎒');
      setModalMode('custom');
    } else {
      setName('');
      setCategory('equipamento');
      setRarity('comum');
      setQuantity(1);
      setWeightKg(1.0);
      setEffectText('');
      setDescription('');
      setValueAmount(10);
      setValueCurrency('BRZ');
      setIconEmoji('🎒');
      setModalMode('custom');
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: InventoryItem = {
      id: editingItem?.id || 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: name.trim(),
      category,
      rarity,
      quantity: Math.max(1, quantity),
      weightKg: Math.max(0, weightKg),
      weight: `${weightKg} kg`,
      effectText: effectText.trim(),
      description: description.trim(),
      valueAmount: Math.max(0, valueAmount),
      valueCurrency,
      iconEmoji: iconEmoji.trim() || CATEGORY_LABELS[category]?.icon || '🎒',
      equipped: editingItem?.equipped || false,
    };

    sound.playCoinClink('PRT');
    onSaveItem(newItem);
    onClose();
  };

  const handleSelectPreset = (preset: (typeof PRESET_NEXARIA_ITEMS)[0]) => {
    const newItem: InventoryItem = {
      id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: preset.name,
      category: preset.category,
      rarity: preset.rarity,
      quantity: preset.quantity || 1,
      weightKg: preset.weightKg ?? 1.0,
      weight: `${preset.weightKg ?? 1.0} kg`,
      effectText: preset.effectText || '',
      description: preset.description,
      valueAmount: preset.valueAmount,
      valueCurrency: preset.valueCurrency,
      iconEmoji: preset.iconEmoji || CATEGORY_LABELS[preset.category]?.icon || '🎒',
      equipped: preset.equipped || false,
    };

    sound.playCoinClink(preset.valueCurrency);
    onSaveItem(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-purple-900/60 bg-gradient-to-b from-[#140c24] via-[#0e081a] to-[#08050e] p-5 sm:p-6 text-zinc-100 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-900/50 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center text-amber-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-cinzel font-bold text-amber-300">
                {editingItem ? 'Editar Item do Inventário' : 'Adicionar ao Inventário'}
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans">
                {editingItem
                  ? 'Modifique os detalhes, peso e propriedades do item.'
                  : 'Forje um item sob medida ou escolha do Armazém de Nexaria.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas: Item Customizado vs Catálogo de Presets */}
        {!editingItem && (
          <div className="flex items-center gap-1.5 p-1 bg-zinc-950/70 border border-purple-900/40 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => setModalMode('custom')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center justify-center gap-1.5 transition ${
                modalMode === 'custom'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-950/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Forjar Novo Item</span>
            </button>

            <button
              type="button"
              onClick={() => setModalMode('presets')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center justify-center gap-1.5 transition ${
                modalMode === 'presets'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-950/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Armazém de Nexaria (Pronto)</span>
            </button>
          </div>
        )}

        {/* Modo 1: Catálogo de Presets do Armazém */}
        {modalMode === 'presets' && !editingItem && (
          <div className="space-y-3">
            <div className="text-xs text-zinc-400 mb-2">
              Escolha um item canônico de Nexaria para adicionar instantaneamente à sua mochila:
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
              {PRESET_NEXARIA_ITEMS.map((preset, idx) => {
                const rarCfg = RARITY_CONFIG[preset.rarity || 'comum'];
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/70 hover:bg-zinc-850 hover:border-amber-500/50 flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl select-none">{preset.iconEmoji || '🎒'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-cinzel font-bold text-zinc-100">
                            {preset.name}
                          </h4>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-mono font-semibold ${rarCfg.border} ${rarCfg.bg} ${rarCfg.text}`}
                          >
                            {rarCfg.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {preset.weightKg} kg
                          </span>
                        </div>

                        {preset.effectText && (
                          <div className="text-[11px] text-amber-300 font-medium mt-0.5">
                            ⚡ {preset.effectText}
                          </div>
                        )}

                        <p className="text-[11px] text-zinc-400 leading-tight mt-0.5 line-clamp-1">
                          {preset.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-zinc-200">
                          {preset.valueAmount} {preset.valueCurrency}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/90 hover:bg-amber-400 text-zinc-950 font-cinzel font-bold text-xs flex items-center gap-1 shadow-sm transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modo 2: Formulário Customizado */}
        {modalMode === 'custom' && (
          <form onSubmit={handleSubmitCustom} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1">
                  Nome do Item *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Machado de Guerra Cibernético"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-purple-900/60 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1">
                  Ícone / Emoji
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={iconEmoji}
                  onChange={(e) => setIconEmoji(e.target.value)}
                  className="w-full bg-zinc-950 border border-purple-900/60 rounded-lg px-3 py-2 text-center text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const cat = e.target.value as ItemCategory;
                    setCategory(cat);
                    setIconEmoji(CATEGORY_LABELS[cat]?.icon || '🎒');
                  }}
                  className="w-full bg-zinc-950 border border-purple-900/60 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="arma">⚔️ Arma</option>
                  <option value="armadura">🛡️ Armadura / Escudo</option>
                  <option value="pocao">🧪 Poção / Consumível</option>
                  <option value="reliquia">💍 Relíquia Arcana</option>
                  <option value="cyber">💠 Tecnomagia / Cyber</option>
                  <option value="equipamento">🎒 Equipamento de Aventura</option>
                  <option value="geral">📜 Geral / Documento</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1">
                  Raridade
                </label>
                <select
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value as ItemRarity)}
                  className="w-full bg-zinc-950 border border-purple-900/60 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="comum">Comum (Cinza)</option>
                  <option value="incomum">Incomum (Verde)</option>
                  <option value="raro">Raro (Azul)</option>
                  <option value="epico">Épico (Roxo)</option>
                  <option value="lendario">Lendário (Dourado)</option>
                  <option value="abissal">Abissal (Vermelho Sangue)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full bg-zinc-950 border border-purple-900/60 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1">
                  Peso Unitário (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={200}
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-purple-900/60 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1">
                  Preço de Mercado
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={valueAmount}
                    onChange={(e) => setValueAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-purple-900/60 rounded-lg px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <select
                    value={valueCurrency}
                    onChange={(e) => setValueCurrency(e.target.value as CurrencyType)}
                    className="bg-zinc-900 border border-purple-900/60 rounded-lg px-2 py-2 text-xs text-amber-300 focus:outline-none"
                  >
                    <option value="BRZ">BRZ</option>
                    <option value="PRT">PRT</option>
                    <option value="ORO">ORO</option>
                    <option value="PLN">PLN</option>
                    <option value="CYB">CYB</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1">
                Efeito / Propriedade Mecânica (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Recupera 15 PV ao consumir | +2 na CA | 1d8+2 dano cortante"
                value={effectText}
                onChange={(e) => setEffectText(e.target.value)}
                className="w-full bg-zinc-950 border border-purple-900/60 rounded-lg px-3 py-2 text-xs text-amber-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1">
                Descrição &amp; Lore do Item
              </label>
              <textarea
                rows={3}
                placeholder="Detalhes visuais, origem no Abismo, materiais de forja..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-950 border border-purple-900/60 rounded-lg p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-900/50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-cinzel font-semibold transition"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 text-xs font-cinzel font-bold shadow-md shadow-amber-950/40 flex items-center gap-1.5 transition"
              >
                <Check className="w-4 h-4" />
                <span>{editingItem ? 'Salvar Alterações' : 'Guardar na Mochila'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
