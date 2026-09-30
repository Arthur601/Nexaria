import React, { useState, useMemo } from 'react';
import {
  CharacterSheet,
  InventoryItem,
  CurrencyType,
  CURRENCY_CONFIGS,
} from '../types/rpg';
import {
  ALCHEMY_RECIPES,
  BLACKSMITH_RECIPES,
  AlchemyRecipe,
  BlacksmithRecipe,
  CraftingIngredient,
} from '../data/alchemyAndCrafting';
import { sound } from '../utils/audio';
import {
  FlaskConical,
  Hammer,
  Anvil,
  Sparkles,
  Flame,
  Shield,
  Coins,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  Zap,
  Info,
  Wrench,
  X,
  Swords,
} from 'lucide-react';

interface AlchemyWorkbenchViewProps {
  character: CharacterSheet;
  onUpdateCharacter: (updated: CharacterSheet) => void;
  isGmView?: boolean;
  onNavigateToInventory?: () => void;
}

export const AlchemyWorkbenchView: React.FC<AlchemyWorkbenchViewProps> = ({
  character,
  onUpdateCharacter,
  isGmView = false,
  onNavigateToInventory,
}) => {
  const [activeTab, setActiveTab] = useState<'alchemy' | 'blacksmith'>('alchemy');
  const [selectedAlchemyRecipe, setSelectedAlchemyRecipe] = useState<AlchemyRecipe>(ALCHEMY_RECIPES[0]);
  const [selectedBlacksmithRecipe, setSelectedBlacksmithRecipe] = useState<BlacksmithRecipe>(BLACKSMITH_RECIPES[0]);
  const [selectedWeaponToRepairId, setSelectedWeaponToRepairId] = useState<string>('');
  const [isBrewing, setIsBrewing] = useState(false);
  const [craftingFeedback, setCraftingFeedback] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Detect Profession bonuses
  const charClassLower = (character.characterClass || '').toLowerCase();
  const isAlchemist = charClassLower.includes('alquimista') || charClassLower.includes('apotec');
  const isBlacksmith = charClassLower.includes('ferreiro') || charClassLower.includes('forjador');
  const isCarpenter = charClassLower.includes('carpinteiro');
  const isMiner = charClassLower.includes('mineiro');
  const isTailor = charClassLower.includes('alfaiate');

  // Find damaged items in character inventory
  const damagedItems = useMemo(() => {
    return character.inventory.filter((item) => {
      const dur = item.durability || (item.category === 'arma' ? { current: 20, max: 20 } : undefined);
      return dur && dur.current < dur.max;
    });
  }, [character.inventory]);

  // Set default weapon to repair if damaged items exist
  React.useEffect(() => {
    if (damagedItems.length > 0 && !selectedWeaponToRepairId) {
      setSelectedWeaponToRepairId(damagedItems[0].id);
    }
  }, [damagedItems, selectedWeaponToRepairId]);

  // Player's reagents count in inventory
  const playerIngredientsCount = useMemo(() => {
    const counts: Record<string, number> = {};
    character.inventory.forEach((item) => {
      const normalizedName = item.name.toLowerCase().trim();
      counts[normalizedName] = (counts[normalizedName] || 0) + (item.quantity || 1);
    });
    return counts;
  }, [character.inventory]);

  // Filtered recipes
  const filteredAlchemyRecipes = useMemo(() => {
    return ALCHEMY_RECIPES.filter((rec) => {
      const matchSearch =
        rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.effect.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'all' || rec.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [searchQuery, categoryFilter]);

  const filteredBlacksmithRecipes = useMemo(() => {
    return BLACKSMITH_RECIPES.filter((rec) => {
      const matchSearch =
        rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.effect.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'all' || rec.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [searchQuery, categoryFilter]);

  // Check if character can afford coin cost
  const canAffordCost = (cost?: { amount: number; currency: CurrencyType }) => {
    if (!cost) return true;
    let actualAmount = cost.amount;
    // Blacksmith 50% discount on blacksmithing
    if (isBlacksmith && activeTab === 'blacksmith') {
      actualAmount = Math.max(1, Math.floor(actualAmount / 2));
    }
    return (character.wallet[cost.currency] || 0) >= actualAmount;
  };

  // Add starter reagent pack for testing and exploration
  const handleCollectStarterReagents = () => {
    sound.playDiceRoll();
    const starterPack: Omit<InventoryItem, 'id'>[] = [
      {
        name: 'Raiz Vermelha Medicinal',
        category: 'material',
        rarity: 'comum',
        quantity: 5,
        weightKg: 0.1,
        effectText: 'Reagente botânico para poções restauradoras.',
        description: 'Raiz colhida em solo úmido com seiva revitalizante.',
        valueAmount: 3,
        valueCurrency: 'BRZ',
        iconEmoji: '🌱',
      },
      {
        name: 'Água Termal Purificada',
        category: 'material',
        rarity: 'comum',
        quantity: 3,
        weightKg: 0.2,
        effectText: 'Catalisador líquido destilado.',
        description: 'Água pura de nascente montanhosa.',
        valueAmount: 2,
        valueCurrency: 'BRZ',
        iconEmoji: '💧',
      },
      {
        name: 'Seiva de Pinheiro Rúnico',
        category: 'material',
        rarity: 'incomum',
        quantity: 4,
        weightKg: 0.1,
        effectText: 'Resina pegajosa usada em óleos de têmpera e manutenção.',
        description: 'Seiva âmbar aromática que impermeabiliza aço.',
        valueAmount: 5,
        valueCurrency: 'BRZ',
        iconEmoji: '🌲',
      },
      {
        name: 'Pó de Pirita Dourada',
        category: 'material',
        rarity: 'incomum',
        quantity: 3,
        weightKg: 0.1,
        effectText: 'Pó mineral para afiação e óleos de durabilidade.',
        description: 'Cristais dourados moídos que protegem lâminas.',
        valueAmount: 8,
        valueCurrency: 'BRZ',
        iconEmoji: '✨',
      },
      {
        name: 'Pedaço de Ferro Forjado',
        category: 'material',
        rarity: 'comum',
        quantity: 6,
        weightKg: 0.5,
        effectText: 'Material metálico para forja e reparos na bigorna.',
        description: 'Barras sólidas de ferro prontas para a bigorna.',
        valueAmount: 4,
        valueCurrency: 'BRZ',
        iconEmoji: '🔩',
      },
      {
        name: 'Carvão Mineral de Forja',
        category: 'material',
        rarity: 'comum',
        quantity: 5,
        weightKg: 0.4,
        effectText: 'Combustível de alta caloria para foles e cadinhos.',
        description: 'Carvão negro fóssil que atinge temperaturas extremas.',
        valueAmount: 2,
        valueCurrency: 'BRZ',
        iconEmoji: '⬛',
      },
      {
        name: 'Enxofre Abissal Vulcânico',
        category: 'material',
        rarity: 'incomum',
        quantity: 3,
        weightKg: 0.2,
        effectText: 'Reagente para frascos explosivos e Fogo Grego.',
        description: 'Minério amarelado com aroma pungente e calor latente.',
        valueAmount: 1,
        valueCurrency: 'PRT',
        iconEmoji: '🌋',
      },
    ];

    let newInventory = [...character.inventory];
    starterPack.forEach((item) => {
      const existingIdx = newInventory.findIndex(
        (inv) => inv.name.toLowerCase() === item.name.toLowerCase()
      );
      if (existingIdx >= 0) {
        newInventory[existingIdx] = {
          ...newInventory[existingIdx],
          quantity: (newInventory[existingIdx].quantity || 1) + item.quantity,
        };
      } else {
        newInventory.push({
          ...item,
          id: 'mat-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
        });
      }
    });

    onUpdateCharacter({
      ...character,
      inventory: newInventory,
    });

    sound.playCoinClink('PRT');
    setCraftingFeedback({
      success: true,
      message: 'Kit de Reagentes de Campo adicionado à mochila!',
      details: '7 tipos de materiais botânicos, metálicos e alquímicos foram disponibilizados.',
    });
  };

  // Craft Alchemy item
  const handleCraftAlchemy = (recipe: AlchemyRecipe) => {
    if (isBrewing) return;

    // Check coins
    let actualCoinCost = recipe.coinCost ? recipe.coinCost.amount : 0;
    const coinCurrency = recipe.coinCost ? recipe.coinCost.currency : 'BRZ';

    if (recipe.coinCost && !canAffordCost(recipe.coinCost)) {
      sound.playDiceRoll();
      setCraftingFeedback({
        success: false,
        message: 'Moedas insuficientes para a destilação!',
        details: `Você precisa de ${actualCoinCost} ${coinCurrency} para os catalisadores do laboratório.`,
      });
      return;
    }

    setIsBrewing(true);
    sound.playDiceRoll();

    setTimeout(() => {
      setIsBrewing(false);

      // Deduct coins if applicable
      const updatedWallet = { ...character.wallet };
      if (actualCoinCost > 0) {
        updatedWallet[coinCurrency] = Math.max(0, updatedWallet[coinCurrency] - actualCoinCost);
      }

      // Alchemist perk: 2x items or higher quantity!
      const yieldQty = isAlchemist ? 2 : 1;
      const craftedItem: InventoryItem = {
        ...recipe.resultItem,
        id: 'craft-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        quantity: (recipe.resultItem.quantity || 1) * yieldQty,
      };

      // Add to inventory
      const updatedInventory = [...character.inventory, craftedItem];

      onUpdateCharacter({
        ...character,
        wallet: updatedWallet,
        inventory: updatedInventory,
      });

      sound.playCoinClink('ORO');
      setCraftingFeedback({
        success: true,
        message: `Destilação Concluída: ${recipe.name}!`,
        details: isAlchemist
          ? `Bônus de Alquimista Ativo: Você destilou em dobro (+${yieldQty} frascos) com pureza estelar!`
          : `Item adicionado à sua mochila com sucesso (+${craftedItem.quantity} unid).`,
      });
    }, 1200);
  };

  // Forging or Repairing on Blacksmith Anvil
  const handleCraftBlacksmith = (recipe: BlacksmithRecipe) => {
    if (isBrewing) return;

    let actualCost = recipe.coinCost ? recipe.coinCost.amount : 0;
    if (isBlacksmith && actualCost > 0) {
      actualCost = Math.max(0, Math.floor(actualCost / 2));
    }
    const coinCurrency = recipe.coinCost ? recipe.coinCost.currency : 'BRZ';

    if (actualCost > 0 && (character.wallet[coinCurrency] || 0) < actualCost) {
      sound.playDiceRoll();
      setCraftingFeedback({
        success: false,
        message: 'Moedas insuficientes para a forja!',
        details: `Custo necessário: ${actualCost} ${coinCurrency}.`,
      });
      return;
    }

    setIsBrewing(true);
    sound.playDiceRoll();

    setTimeout(() => {
      setIsBrewing(false);

      const updatedWallet = { ...character.wallet };
      if (actualCost > 0) {
        updatedWallet[coinCurrency] = Math.max(0, updatedWallet[coinCurrency] - actualCost);
      }

      // Check if this is a repair or reinforcement recipe
      if (recipe.id === 'rec_reparo_forja_campo' && selectedWeaponToRepairId) {
        const updatedInventory = character.inventory.map((item) => {
          if (item.id === selectedWeaponToRepairId) {
            const currentMax = item.durability?.max || 25;
            return {
              ...item,
              durability: { current: currentMax, max: currentMax },
            };
          }
          return item;
        });

        onUpdateCharacter({
          ...character,
          wallet: updatedWallet,
          inventory: updatedInventory,
        });

        sound.playCoinClink('ORO');
        setCraftingFeedback({
          success: true,
          message: 'Lâmina Totalmente Reparada na Bigorna!',
          details: 'A durabilidade foi restaurada para 100% de sua integridade estrutural.',
        });
        return;
      }

      if (recipe.id === 'rec_reforco_durabilidade_maxima' && selectedWeaponToRepairId) {
        const bonusDur = isBlacksmith ? 15 : 10;
        const updatedInventory = character.inventory.map((item) => {
          if (item.id === selectedWeaponToRepairId) {
            const currentDur = item.durability || { current: 20, max: 20 };
            const newMax = currentDur.max + bonusDur;
            return {
              ...item,
              durability: { current: newMax, max: newMax },
            };
          }
          return item;
        });

        onUpdateCharacter({
          ...character,
          wallet: updatedWallet,
          inventory: updatedInventory,
        });

        sound.playCoinClink('ORO');
        setCraftingFeedback({
          success: true,
          message: `Têmpera Realizada: +${bonusDur} de Durabilidade Máxima!`,
          details: isBlacksmith
            ? 'Maestria do Ferreiro ativada: bônus ampliado e liga metálica perfeitamente unificada.'
            : 'Sua arma agora possui maior resistência ao desgaste permanente.',
        });
        return;
      }

      // Regular equipment forging
      const bonusDurability = isBlacksmith ? Math.floor(recipe.durabilityMax * 0.2) : 0;
      const finalMaxDur = recipe.durabilityMax + bonusDurability;

      const forgedItem: InventoryItem = {
        ...recipe.resultItem,
        id: 'forge-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        durability: { current: finalMaxDur, max: finalMaxDur },
      };

      const updatedInventory = [...character.inventory, forgedItem];

      onUpdateCharacter({
        ...character,
        wallet: updatedWallet,
        inventory: updatedInventory,
      });

      sound.playCoinClink('ORO');
      setCraftingFeedback({
        success: true,
        message: `Equipamento Forjado: ${recipe.name}!`,
        details: isBlacksmith
          ? `Bônus de Ferreiro: Durabilidade máxima ampliada para ${finalMaxDur}/${finalMaxDur} (+20%)!`
          : `Item forjado e inserido na sua mochila com durabilidade ${finalMaxDur}/${finalMaxDur}.`,
      });
    }, 1200);
  };

  // Quick wear down trigger to test durability loss and repair mechanics
  const handleWearWeapon = (amount: number) => {
    if (!selectedWeaponToRepairId) return;

    sound.playDiceRoll();
    const updatedInventory = character.inventory.map((item) => {
      if (item.id === selectedWeaponToRepairId) {
        const curDur = item.durability || (item.category === 'arma' ? { current: 20, max: 20 } : { current: 15, max: 15 });
        const newCur = Math.max(0, curDur.current - amount);
        return {
          ...item,
          durability: { current: newCur, max: curDur.max },
        };
      }
      return item;
    });

    onUpdateCharacter({
      ...character,
      inventory: updatedInventory,
    });

    setCraftingFeedback({
      success: true,
      message: `Desgaste de Combate Aplicado (-${amount} durabilidade)!`,
      details: 'O impacto lascou o fio da lâmina. Use a Forja do Ferreiro ou Óleo Alquímico para reparar!',
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Profession Status Banner */}
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-[#180a29] via-[#0d071a] to-[#250d18] p-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-[10px] font-cinzel font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Ofícios &amp; Manufatura de Eldria
              </span>
              <span className="text-xs text-purple-300 font-mono">
                Mesa: {character.campaignCode}
              </span>
            </div>
            <h2 className="text-xl font-cinzel font-bold text-zinc-100 flex items-center gap-2">
              <span>Bancada de Alquimia &amp; Forja do Ferreiro</span>
            </h2>
            <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
              Combine reagentes raros para destilar poções milagrosas, frascos de fogo grego e elixires mutagênicos, ou acenda os foles da bigorna para forjar armaduras e reparar armas desgastadas em batalha.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCollectStarterReagents}
              className="px-3.5 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-600/50 text-purple-200 text-xs font-cinzel font-bold flex items-center gap-1.5 transition shadow"
              title="Receber kit gratuito de ervas, minérios e carvão para testes e receitas"
            >
              <Plus className="w-3.5 h-3.5 text-purple-300" />
              <span>Coletar Reagentes</span>
            </button>

            {onNavigateToInventory && (
              <button
                type="button"
                onClick={onNavigateToInventory}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-cinzel font-semibold flex items-center gap-1.5 transition"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Ver Mochila</span>
              </button>
            )}
          </div>
        </div>

        {/* Profession Bonus Card */}
        <div className="mt-3.5 pt-3 border-t border-purple-900/40 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold">
              {isAlchemist ? '⚗️' : isBlacksmith ? '⚒️' : isCarpenter ? '🪵' : isMiner ? '⛏️' : isTailor ? '🧵' : '⚔️'}
            </div>
            <div>
              <span className="text-zinc-400 text-[11px]">Classe &amp; Vocação Ativa: </span>
              <strong className="text-amber-300 font-cinzel">{character.characterClass || 'Aventureiro'}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAlchemist && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-semibold text-[11px] flex items-center gap-1 animate-pulse">
                <Sparkles className="w-3 h-3" />
                Bônus de Alquimista: Destilação em Dobro (2x) ativa!
              </span>
            )}
            {isBlacksmith && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/60 text-amber-300 font-semibold text-[11px] flex items-center gap-1 animate-pulse">
                <Hammer className="w-3 h-3" />
                Bônus de Ferreiro: 50% de desconto em reparos e +20% durabilidade máxima!
              </span>
            )}
            {!isAlchemist && !isBlacksmith && (
              <span className="text-zinc-400 text-[11px]">
                Dica: Personagens com classes de <em>Alquimista</em> ou <em>Ferreiro</em> desbloqueiam bônus especiais de produção e têmpera.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs: Alquimia vs Forja */}
      <div className="flex items-center justify-between border-b border-purple-900/40 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('alchemy');
              setCategoryFilter('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-cinzel font-bold flex items-center gap-2 transition ${
              activeTab === 'alchemy'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-950/50 border border-emerald-400/50'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-emerald-300" />
            <span>Caldeirão de Alquimia ({ALCHEMY_RECIPES.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('blacksmith');
              setCategoryFilter('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-cinzel font-bold flex items-center gap-2 transition ${
              activeTab === 'blacksmith'
                ? 'bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-lg shadow-amber-950/50 border border-amber-400/50'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <Anvil className="w-4 h-4 text-amber-300" />
            <span>Bigorna &amp; Forja do Ferreiro ({BLACKSMITH_RECIPES.length})</span>
          </button>
        </div>

        {/* Player Wallet preview */}
        <div className="hidden sm:flex items-center gap-3 bg-zinc-950/80 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-mono">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Fundos:</span>
          </div>
          <span className="text-amber-600 font-bold">{character.wallet.BRZ} BRZ</span>
          <span className="text-slate-300 font-bold">{character.wallet.PRT} PRT</span>
          <span className="text-yellow-400 font-bold">{character.wallet.ORO} ORO</span>
        </div>
      </div>

      {/* Crafting Feedback Alert */}
      {craftingFeedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs animate-in fade-in duration-200 ${
            craftingFeedback.success
              ? 'bg-emerald-950/70 border-emerald-500/70 text-emerald-200'
              : 'bg-red-950/70 border-red-500/70 text-red-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {craftingFeedback.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold font-cinzel text-sm">{craftingFeedback.message}</div>
              {craftingFeedback.details && (
                <div className="text-[11px] opacity-90 mt-0.5 font-sans leading-relaxed">
                  {craftingFeedback.details}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCraftingFeedback(null)}
            className="text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Workbench Workspace: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Recipe Selection List (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search & Category Filter Bar */}
          <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 p-2 rounded-xl">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeTab === 'alchemy' ? 'Pesquisar poções, óleos ou elixires...' : 'Pesquisar armas, armaduras ou têmperas...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-zinc-950/80 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">Todas Categorias</option>
                {activeTab === 'alchemy' ? (
                  <>
                    <option value="pocao">Poções Restauradoras</option>
                    <option value="oleo">Óleos de Lâminas &amp; Durabilidade</option>
                    <option value="bomba">Frascos &amp; Fogo Grego</option>
                    <option value="elixir">Elixires Mutagênicos</option>
                    <option value="transmutacao">Transmutações</option>
                  </>
                ) : (
                  <>
                    <option value="reforco">Manutenção &amp; Têmperas</option>
                    <option value="arma">Armas Forjadas</option>
                    <option value="armadura">Armaduras &amp; Escudos</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Recipes Card Grid */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {activeTab === 'alchemy' ? (
              filteredAlchemyRecipes.map((rec) => {
                const isSelected = selectedAlchemyRecipe.id === rec.id;
                const canAfford = canAffordCost(rec.coinCost);

                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedAlchemyRecipe(rec)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? 'border-emerald-500 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 shadow-md ring-1 ring-emerald-500/50'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{rec.resultItem.iconEmoji || '🧪'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-cinzel font-bold text-sm text-zinc-100">
                              {rec.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 uppercase">
                              {rec.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1 font-sans">
                            {rec.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {rec.coinCost && (
                          <div className="text-xs font-mono font-bold text-amber-300">
                            {rec.coinCost.amount} {rec.coinCost.currency}
                          </div>
                        )}
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" /> {rec.craftDurationMinutes} min
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-amber-200/90 bg-black/30 p-2 rounded-lg border border-white/5 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="line-clamp-1">{rec.effect}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-zinc-500">Reagentes:</span>
                        {rec.ingredients.map((ing, idx) => {
                          const playerHas = playerIngredientsCount[ing.name.toLowerCase()] || 0;
                          return (
                            <span
                              key={idx}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                playerHas >= ing.quantity
                                  ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
                                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                              }`}
                              title={`Possui: ${playerHas}/${ing.quantity}`}
                            >
                              {ing.iconEmoji} {ing.name} ({playerHas}/{ing.quantity})
                            </span>
                          );
                        })}
                      </div>

                      {isSelected && (
                        <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                          <Check className="w-3 h-3" /> Selecionada
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              filteredBlacksmithRecipes.map((rec) => {
                const isSelected = selectedBlacksmithRecipe.id === rec.id;
                const canAfford = canAffordCost(rec.coinCost);

                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedBlacksmithRecipe(rec)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? 'border-amber-500 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 shadow-md ring-1 ring-amber-500/50'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{rec.resultItem.iconEmoji || '⚒️'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-cinzel font-bold text-sm text-zinc-100">
                              {rec.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-amber-950/80 border border-amber-600/50 text-amber-300 uppercase">
                              {rec.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1 font-sans">
                            {rec.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {rec.coinCost && (
                          <div className="text-xs font-mono font-bold text-amber-300">
                            {isBlacksmith ? Math.max(0, Math.floor(rec.coinCost.amount / 2)) : rec.coinCost.amount}{' '}
                            {rec.coinCost.currency}
                            {isBlacksmith && <span className="text-[9px] text-emerald-400 block">-50% Ferreiro</span>}
                          </div>
                        )}
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" /> {rec.craftDurationMinutes} min
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-amber-200/90 bg-black/30 p-2 rounded-lg border border-white/5 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="line-clamp-1">{rec.effect}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-zinc-500">Materiais:</span>
                        {rec.materials.map((mat, idx) => {
                          const playerHas = playerIngredientsCount[mat.name.toLowerCase()] || 0;
                          return (
                            <span
                              key={idx}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                playerHas >= mat.quantity
                                  ? 'bg-amber-950/40 border-amber-600/40 text-amber-300'
                                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                              }`}
                              title={`Possui: ${playerHas}/${mat.quantity}`}
                            >
                              {mat.iconEmoji} {mat.name} ({playerHas}/{mat.quantity})
                            </span>
                          );
                        })}
                      </div>

                      {isSelected && (
                        <span className="text-amber-400 font-bold text-[10px] flex items-center gap-1">
                          <Check className="w-3 h-3" /> Selecionada
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Interactive Workbench & Crucible (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-purple-900/60 bg-gradient-to-b from-[#150a26] to-[#0c0517] p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[500px]">
            {/* Ambient Crucible Glow */}
            <div
              className={`absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
                activeTab === 'alchemy' ? 'bg-emerald-500/15' : 'bg-amber-500/20'
              }`}
            />

            <div>
              {/* Header of Active Station */}
              <div className="flex items-center justify-between border-b border-purple-900/40 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                      activeTab === 'alchemy'
                        ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                        : 'bg-amber-950/70 border-amber-500/60 text-amber-300'
                    }`}
                  >
                    {activeTab === 'alchemy' ? <FlaskConical className="w-5 h-5 animate-pulse" /> : <Anvil className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-cinzel font-bold text-sm text-zinc-100">
                      {activeTab === 'alchemy' ? 'Caldeirão de Destilação' : 'Bigorna & Têmpera de Fogo'}
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      {activeTab === 'alchemy' ? 'Reações Arcanas & Soluções' : 'Reparos Mecânicos & Metalurgia'}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-black/40 border border-white/10 text-amber-300">
                  {character.name.split(' ')[0]}
                </span>
              </div>

              {/* Recipe Showcase & In-Depth Details */}
              {activeTab === 'alchemy' ? (
                <div className="space-y-3">
                  <div className="bg-zinc-950/60 border border-emerald-500/30 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{selectedAlchemyRecipe.resultItem.iconEmoji || '🧪'}</span>
                      <div>
                        <h4 className="font-cinzel font-bold text-zinc-100 text-base">
                          {selectedAlchemyRecipe.name}
                        </h4>
                        <span className="text-[10px] font-mono text-emerald-400 uppercase">
                          {selectedAlchemyRecipe.category} &bull; Grau {selectedAlchemyRecipe.rarity}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed font-sans mb-3">
                      {selectedAlchemyRecipe.description}
                    </p>

                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 font-medium flex items-start gap-2">
                      <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-300 block">Efeito de Destilação:</strong>
                        <span>{selectedAlchemyRecipe.effect}</span>
                      </div>
                    </div>
                  </div>

                  {/* Specialist Tip */}
                  <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-[11px] text-purple-200 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-amber-300 font-bold">Vantagem de Ofício: </span>
                      {selectedAlchemyRecipe.specialistBonusTip}
                    </div>
                  </div>

                  {/* Cost Summary */}
                  <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-400" /> Custo de Laboratório:
                    </span>
                    <span className="font-mono font-bold text-amber-300">
                      {selectedAlchemyRecipe.coinCost ? `${selectedAlchemyRecipe.coinCost.amount} ${selectedAlchemyRecipe.coinCost.currency}` : 'Sem custo em moedas'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-zinc-950/60 border border-amber-500/30 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{selectedBlacksmithRecipe.resultItem.iconEmoji || '⚒️'}</span>
                      <div>
                        <h4 className="font-cinzel font-bold text-zinc-100 text-base">
                          {selectedBlacksmithRecipe.name}
                        </h4>
                        <span className="text-[10px] font-mono text-amber-400 uppercase">
                          {selectedBlacksmithRecipe.category} &bull; Durabilidade {selectedBlacksmithRecipe.durabilityMax}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed font-sans mb-3">
                      {selectedBlacksmithRecipe.description}
                    </p>

                    <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 font-medium flex items-start gap-2">
                      <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300 block">Efeito de Forja &amp; Têmpera:</strong>
                        <span>{selectedBlacksmithRecipe.effect}</span>
                      </div>
                    </div>
                  </div>

                  {/* Weapon Selector for Repairs & Durability Boosts */}
                  {(selectedBlacksmithRecipe.id === 'rec_reparo_forja_campo' ||
                    selectedBlacksmithRecipe.id === 'rec_reforco_durabilidade_maxima') && (
                    <div className="bg-zinc-950/90 border border-zinc-800 p-3 rounded-xl space-y-2">
                      <label className="block text-xs font-semibold text-zinc-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Swords className="w-3.5 h-3.5 text-amber-400" />
                          <span>Equipamento Alvo da Forja:</span>
                        </span>
                        <span className="text-[10px] text-amber-400 font-mono">
                          {damagedItems.length} com desgaste
                        </span>
                      </label>
                      <select
                        value={selectedWeaponToRepairId}
                        onChange={(e) => setSelectedWeaponToRepairId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer font-sans"
                      >
                        {character.inventory.filter((i) => i.durability || i.category === 'arma' || i.category === 'armadura').map((item) => {
                          const dur = item.durability || { current: 20, max: 20 };
                          const pct = Math.round((dur.current / dur.max) * 100);
                          return (
                            <option key={item.id} value={item.id}>
                              {item.name} — Durabilidade: {dur.current}/{dur.max} ({pct}%) {item.equipped ? '★ Equipado' : ''}
                            </option>
                          );
                        })}
                      </select>

                      {/* Quick Wear Controls for Combat Testing */}
                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-sans">
                          Simular Desgaste em Batalha:
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleWearWeapon(2)}
                            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-red-400 text-[10px] font-mono border border-zinc-700 transition"
                            title="Desgastar -2 de durabilidade (Golpe normal)"
                          >
                            -2 Dur.
                          </button>
                          <button
                            type="button"
                            onClick={() => handleWearWeapon(5)}
                            className="px-2 py-0.5 rounded bg-red-950/60 hover:bg-red-900/60 text-red-300 text-[10px] font-mono border border-red-700/60 transition"
                            title="Desgastar -5 de durabilidade (Impacto severo)"
                          >
                            -5 Dur.
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Specialist Tip */}
                  <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-[11px] text-purple-200 flex items-start gap-2">
                    <Hammer className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-amber-300 font-bold">Vantagem do Ferreiro: </span>
                      {selectedBlacksmithRecipe.blacksmithBonusTip}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action Button (Brew / Forge) */}
            <div className="mt-5 pt-4 border-t border-purple-900/40 space-y-2">
              {activeTab === 'alchemy' ? (
                <button
                  type="button"
                  disabled={isBrewing}
                  onClick={() => handleCraftAlchemy(selectedAlchemyRecipe)}
                  className={`w-full py-3 rounded-xl text-sm font-cinzel font-bold flex items-center justify-center gap-2 transition shadow-xl ${
                    isBrewing
                      ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 text-zinc-950 hover:shadow-emerald-950/60 active:scale-[0.99]'
                  }`}
                >
                  {isBrewing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Destilando no Caldeirão...</span>
                    </>
                  ) : (
                    <>
                      <FlaskConical className="w-4 h-4" />
                      <span>
                        Destilar {selectedAlchemyRecipe.name} {isAlchemist ? '(2x Bônus)' : ''}
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isBrewing}
                  onClick={() => handleCraftBlacksmith(selectedBlacksmithRecipe)}
                  className={`w-full py-3 rounded-xl text-sm font-cinzel font-bold flex items-center justify-center gap-2 transition shadow-xl ${
                    isBrewing
                      ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 text-zinc-950 hover:shadow-amber-950/60 active:scale-[0.99]'
                  }`}
                >
                  {isBrewing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Martelando na Bigorna...</span>
                    </>
                  ) : (
                    <>
                      <Hammer className="w-4 h-4" />
                      <span>
                        Executar na Bigorna ({selectedBlacksmithRecipe.name.split(' ')[0]})
                      </span>
                    </>
                  )}
                </button>
              )}

              <p className="text-[10px] text-zinc-500 text-center font-sans">
                O resultado será automaticamente incorporado à mochila do seu personagem.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
