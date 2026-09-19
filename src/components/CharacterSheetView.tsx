import React, { useState } from 'react';
import {
  CharacterSheet,
  CurrencyType,
  CURRENCY_CONFIGS,
  calculateTotalNetWorthInBRZ,
  SpellCard,
  getExpForNextLevel,
  ExternalActionType,
  ExternalActionPayload,
  PLAYABLE_RACES,
  PLAYABLE_CLASSES,
  CampaignRoom,
} from '../types/rpg';
import { ORIGIN_REGIONS, getRegionById } from '../data/eldriaWorldMap';
import { TransactionAnimationData } from '../types/animation';
import { CoinVisual } from './CoinVisual';
import { SpellCardView } from './SpellCardView';
import { SpellModal } from './SpellModal';
import { CoinTransferModal } from './CoinTransferModal';
import { PlayerInventoryView } from './PlayerInventoryView';
import { sound } from '../utils/audio';
import {
  Heart,
  Droplets,
  Shield,
  Zap,
  Footprints,
  Plus,
  Minus,
  Sparkles,
  Dice5,
  Coins,
  BookOpen,
  Backpack,
  FileText,
  Send,
  Edit3,
  Star,
  CheckCircle,
  Lock,
  Award,
  TrendingUp,
  Sliders,
  Swords,
  FlaskConical,
  Wand2,
  RefreshCw,
  X,
  Skull,
  Flame,
  Moon,
  Sun,
  Dices,
  Info,
  HeartPulse,
  Globe2,
  Languages,
  Compass,
  MapPin,
  Store,
} from 'lucide-react';

interface CharacterSheetViewProps {
  character: CharacterSheet;
  campaignCode: string;
  gmName: string;
  otherPlayers: CharacterSheet[];
  onUpdateCharacter: (char: CharacterSheet) => void;
  onExecuteTransaction: (params: {
    receiverId: string;
    receiverName: string;
    amount: number;
    currency: CurrencyType;
    reason: string;
  }) => { success: boolean; message: string };
  isGmView?: boolean;
  onTriggerAnimation?: (data: TransactionAnimationData) => void;
  onAllocateAttribute?: (
    characterId: string,
    attrKey: 'FOR' | 'DES' | 'CON' | 'INT' | 'SAB' | 'CAR'
  ) => void;
  onUpdateVitals?: (characterId: string, vitals: Partial<CharacterSheet>) => void;
  onAwardExp?: (targetId: string, amount: number, reason?: string) => Promise<any>;
  onApplyExternalAction?: (
    characterId: string,
    action: ExternalActionPayload
  ) => Promise<any>;
  campaign?: CampaignRoom;
  onNavigateToShop?: () => void;
  onUpdateCampaign?: (updated: CampaignRoom) => void;
}

export const CharacterSheetView: React.FC<CharacterSheetViewProps> = ({
  character,
  campaignCode,
  gmName,
  otherPlayers,
  onUpdateCharacter,
  onExecuteTransaction,
  isGmView = false,
  onTriggerAnimation,
  onAllocateAttribute,
  onUpdateVitals,
  onAwardExp,
  onApplyExternalAction,
  campaign,
  onNavigateToShop,
  onUpdateCampaign,
}) => {
  const [activeTab, setActiveTab] = useState<'coins' | 'spells' | 'inventory' | 'notes'>('coins');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isSpellModalOpen, setIsSpellModalOpen] = useState(false);
  const [editingSpell, setEditingSpell] = useState<SpellCard | null>(null);
  const [diceRollResult, setDiceRollResult] = useState<{ attr: string; roll: number; total: number } | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [customAvatarInput, setCustomAvatarInput] = useState('');

  // GM Modals
  const [isGmExpModalOpen, setIsGmExpModalOpen] = useState(false);
  const [gmExpInput, setGmExpInput] = useState(50);
  const [gmExpReason, setGmExpReason] = useState('Desafio Superado / Combate');
  const [isGmVitalsModalOpen, setIsGmVitalsModalOpen] = useState(false);
  const [editCa, setEditCa] = useState(character.armorClass);
  const [editSpeed, setEditSpeed] = useState(character.speed || '9m');
  const [editInitiative, setEditInitiative] = useState(character.initiative || 0);
  const [editNotes, setEditNotes] = useState(character.notes || '');
  const [editRace, setEditRace] = useState(character.race || 'Humano');

  // External Actions (Exclusively managed by GM: monster attack, dot, potions, healing / restoration, rests)
  const [isExternalActionModalOpen, setIsExternalActionModalOpen] = useState(false);
  const [extActionType, setExtActionType] = useState<ExternalActionType>('monster_attack');
  const [extSourceName, setExtSourceName] = useState('Verme Devorador do Abismo');
  const [extAmount, setExtAmount] = useState<number>(12);
  const [extDetails, setExtDetails] = useState('Mordida Ácida e Perfurante');
  const [extDamageType, setExtDamageType] = useState('Físico');
  const [extMultiplier, setExtMultiplier] = useState<number>(1);
  const [extTargetVitals, setExtTargetVitals] = useState<'hp' | 'mana' | 'both'>('hp');
  const [extDiceFormula, setExtDiceFormula] = useState('');
  const [lastDiceRoll, setLastDiceRoll] = useState<{ formula: string; result: number } | null>(null);
  const [actionFeedbackToast, setActionFeedbackToast] = useState<string | null>(null);

  // Preset portrait avatars for fantasy RPG
  const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80', // Rogue/Assassin
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80', // Paladin
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80', // Mage
    'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=80', // Cyber-mage
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80', // Dark Knight
  ];

  const totalNetWorth = calculateTotalNetWorthInBRZ(character.wallet);

  // EXP Progress calculation
  const expNeeded = getExpForNextLevel(character.level);
  const expCurrent = character.experience || 0;
  const expPercent = Math.min(100, Math.round((expCurrent / expNeeded) * 100));

  // Helper to calculate D&D style ability modifier
  const getModifier = (val: number): string => {
    const mod = Math.floor((val - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const rollD20 = (attrName: string, attrVal: number) => {
    sound.playCoinClink('PRT');
    const d20 = Math.floor(Math.random() * 20) + 1;
    const mod = Math.floor((attrVal - 10) / 2);
    const total = d20 + mod;
    setDiceRollResult({ attr: attrName, roll: d20, total });
    setTimeout(() => {
      setDiceRollResult(null);
    }, 4500);
  };

  // Quick dice roller for GM damage & healing customization
  const handleQuickDiceRoll = (formula: string) => {
    sound.playCoinClink('PRT');
    let total = 0;
    const match = formula.match(/^(\d+)d(\d+)$/i);
    if (match) {
      const count = parseInt(match[1], 10);
      const sides = parseInt(match[2], 10);
      for (let i = 0; i < count; i++) {
        total += Math.floor(Math.random() * sides) + 1;
      }
    } else {
      total = Math.floor(Math.random() * 8) + 1;
    }
    setExtAmount(total);
    setExtDiceFormula(formula);
    setLastDiceRoll({ formula, result: total });
  };

  // Trigger External Actions - EXCLUSIVELY AVAILABLE TO THE MASTER
  const triggerExternalAction = async (payload: ExternalActionPayload) => {
    if (!isGmView) {
      console.warn('External actions (HP/MP modifications) are restricted to the Game Master.');
      return;
    }

    const { actionType, sourceName, amount, multiplier, targetVitals, damageType, details } = payload;
    const mult = multiplier && multiplier > 0 ? multiplier : 1;
    const baseAmount = Math.max(0, amount || 0);
    const numAmount = Math.max(1, Math.round(baseAmount * mult));

    if (
      actionType === 'monster_attack' ||
      actionType === 'poison_burn_dot' ||
      actionType === 'environmental_trap' ||
      (actionType === 'custom_damage' && targetVitals !== 'mana')
    ) {
      sound.playMonsterHit();
    } else if (actionType === 'potion_hp' || actionType === 'potion_mana') {
      sound.playPotionDrink();
    } else {
      sound.playHealingSpell();
    }

    if (onApplyExternalAction) {
      const res = await onApplyExternalAction(character.id, payload);
      if (res && res.message) {
        setActionFeedbackToast(res.message);
        setTimeout(() => setActionFeedbackToast(null), 4000);
      }
    } else {
      // Local fallback
      const newHp = { ...character.hp };
      const newMana = { ...character.mana };
      let msg = '';

      if (actionType === 'monster_attack') {
        newHp.current = Math.max(0, newHp.current - numAmount);
        msg = `Ataque de ${sourceName || 'Criatura'}: -${numAmount} PV! (${newHp.current}/${newHp.max} PV)`;
      } else if (actionType === 'poison_burn_dot') {
        newHp.current = Math.max(0, newHp.current - numAmount);
        msg = `Dano Contínuo (${sourceName || 'Veneno'}${damageType ? ` - ${damageType}` : ''}): -${numAmount} PV! (${newHp.current}/${newHp.max} PV)`;
      } else if (actionType === 'environmental_trap') {
        newHp.current = Math.max(0, newHp.current - numAmount);
        msg = `Perigo Ambiental (${sourceName || 'Armadilha'}): -${numAmount} PV! (${newHp.current}/${newHp.max} PV)`;
      } else if (actionType === 'potion_hp') {
        const prev = newHp.current;
        newHp.current = Math.min(newHp.max, newHp.current + numAmount);
        msg = `Bebeu ${sourceName || 'Poção de Vida'}: +${newHp.current - prev} PV! (${newHp.current}/${newHp.max} PV)`;
      } else if (actionType === 'potion_mana') {
        const prev = newMana.current;
        newMana.current = Math.min(newMana.max, newMana.current + numAmount);
        msg = `Bebeu ${sourceName || 'Frasco de Mana'}: +${newMana.current - prev} PM! (${newMana.current}/${newMana.max} PM)`;
      } else if (actionType === 'heal_spell') {
        const prev = newHp.current;
        newHp.current = Math.min(newHp.max, newHp.current + numAmount);
        msg = `Magia de Cura (${sourceName || 'Regeneração'}): +${newHp.current - prev} PV! (${newHp.current}/${newHp.max} PV)`;
      } else if (actionType === 'mana_spell') {
        const prev = newMana.current;
        newMana.current = Math.min(newMana.max, newMana.current + numAmount);
        msg = `Harmonização Arcana (${sourceName || 'Éter'}): +${newMana.current - prev} PM! (${newMana.current}/${newMana.max} PM)`;
      } else if (actionType === 'short_rest') {
        const prevHp = newHp.current;
        const prevMana = newMana.current;
        newHp.current = Math.min(newHp.max, newHp.current + numAmount);
        newMana.current = Math.min(newMana.max, newMana.current + Math.round(numAmount / 2));
        msg = `Descanso Curto: +${newHp.current - prevHp} PV e +${newMana.current - prevMana} PM!`;
      } else if (actionType === 'long_rest') {
        newHp.current = newHp.max;
        newMana.current = newMana.max;
        msg = `Descanso Longo concluído! PV e PM totalmente restaurados.`;
      } else if (actionType === 'custom_damage') {
        if (targetVitals === 'mana') {
          newMana.current = Math.max(0, newMana.current - numAmount);
          msg = `Dano de Mana (${sourceName || 'Dreno'}): -${numAmount} PM! (${newMana.current}/${newMana.max} PM)`;
        } else {
          newHp.current = Math.max(0, newHp.current - numAmount);
          msg = `Dano (${sourceName || 'Efeito'}${damageType ? ` - ${damageType}` : ''}): -${numAmount} PV! (${newHp.current}/${newHp.max} PV)`;
        }
      } else if (actionType === 'custom_recovery') {
        if (targetVitals === 'mana') {
          const prev = newMana.current;
          newMana.current = Math.min(newMana.max, newMana.current + numAmount);
          msg = `Restauração Arcana: +${newMana.current - prev} PM!`;
        } else if (targetVitals === 'both') {
          const prevHp = newHp.current;
          const prevMana = newMana.current;
          newHp.current = Math.min(newHp.max, newHp.current + numAmount);
          newMana.current = Math.min(newMana.max, newMana.current + numAmount);
          msg = `Restauração Completa: +${newHp.current - prevHp} PV e +${newMana.current - prevMana} PM!`;
        } else {
          const prev = newHp.current;
          newHp.current = Math.min(newHp.max, newHp.current + numAmount);
          msg = `Restauração de Vida: +${newHp.current - prev} PV!`;
        }
      }

      onUpdateCharacter({
        ...character,
        hp: newHp,
        mana: newMana,
      });
      setActionFeedbackToast(msg);
      setTimeout(() => setActionFeedbackToast(null), 4000);
    }
    setIsExternalActionModalOpen(false);
  };

  // Player distributes an earned status point (CON -> +5 HP Max, INT -> +5 Mana Max)
  const handleAllocateAttributePoint = (key: 'FOR' | 'DES' | 'CON' | 'INT' | 'SAB' | 'CAR') => {
    if ((character.unspentAttributePoints || 0) <= 0) return;
    sound.playSuccessFanfare();
    if (onAllocateAttribute) {
      onAllocateAttribute(character.id, key);
    } else {
      const newAttrs = { ...character.attributes, [key]: (character.attributes[key] || 10) + 1 };
      const newHp = { ...character.hp };
      const newMana = { ...character.mana };
      if (key === 'CON') {
        newHp.max += 5;
        newHp.current = Math.min(newHp.max, newHp.current + 5);
      } else if (key === 'INT') {
        newMana.max += 5;
        newMana.current = Math.min(newMana.max, newMana.current + 5);
      }
      onUpdateCharacter({
        ...character,
        attributes: newAttrs,
        unspentAttributePoints: (character.unspentAttributePoints || 0) - 1,
        hp: newHp,
        mana: newMana,
      });
    }
  };

  // Master saves non-vital character parameters (CA, Deslocamento, Iniciativa, Notas, Raça)
  const handleSaveGmParameters = () => {
    if (!isGmView) return;
    const params = {
      armorClass: editCa,
      speed: editSpeed,
      initiative: editInitiative,
      notes: editNotes,
      race: editRace,
    };
    if (onUpdateVitals) {
      onUpdateVitals(character.id, params);
    } else {
      onUpdateCharacter({
        ...character,
        ...params,
      });
    }
    setIsGmVitalsModalOpen(false);
  };

  // Master submits quick EXP to this character
  const handleGmAwardExpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAwardExp || gmExpInput <= 0) return;
    await onAwardExp(character.id, gmExpInput, gmExpReason);
    setIsGmExpModalOpen(false);
  };

  const handleCastSpell = (card: SpellCard) => {
    // Extract numerical mana cost if present
    const numericCost = parseInt(card.magicCost) || 0;
    if (numericCost > 0 && character.mana.current < numericCost) {
      alert(`Mana insuficiente para lançar ${card.name}! Custo: ${card.magicCost}`);
      return;
    }

    if (numericCost > 0) {
      const newMana = { ...character.mana, current: Math.max(0, character.mana.current - numericCost) };
      onUpdateCharacter({
        ...character,
        mana: newMana,
      });
      sound.playCoinClink('PLN');
    }
  };

  const handleSaveSpell = (card: SpellCard) => {
    let updatedAbilities = [...character.abilities];
    const existing = updatedAbilities.findIndex((s) => s.id === card.id);
    if (existing >= 0) {
      updatedAbilities[existing] = card;
    } else {
      updatedAbilities.push(card);
    }
    onUpdateCharacter({ ...character, abilities: updatedAbilities });
    setEditingSpell(null);
  };

  const handleDeleteSpell = (cardId: string) => {
    const updated = character.abilities.filter((s) => s.id !== cardId);
    onUpdateCharacter({ ...character, abilities: updated });
  };

  const handleAddInventoryItem = () => {
    const name = prompt('Nome do novo item:');
    if (!name) return;
    const item = {
      id: 'inv-' + Date.now(),
      name,
      quantity: 1,
      category: 'geral' as const,
      description: 'Item encontrado na campanha.',
      valueAmount: 1,
      valueCurrency: 'BRZ' as CurrencyType,
    };
    onUpdateCharacter({ ...character, inventory: [...character.inventory, item] });
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto p-1 sm:p-2">
      {/* Minimalist Character Sheet Frame */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-100 p-4 sm:p-6 shadow-sm">
        {/* Dice Roll Toast */}
        {diceRollResult && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-700 text-zinc-100 px-5 py-2 rounded-full shadow-lg flex items-center gap-2.5 text-xs">
            <Dice5 className="w-4 h-4 text-zinc-400" />
            <div>
              Rolagem de <strong>{diceRollResult.attr}</strong>: d20 ({diceRollResult.roll}) + Mod ={' '}
              <span className="font-mono font-bold text-amber-400">
                {diceRollResult.total}
              </span>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TOP HEADER: Level Badge, EXP Bar, Name & Role, Room Code */}
        {/* ============================================================ */}
        <div className="grid grid-cols-12 gap-3 items-center pb-4 mb-4 border-b border-zinc-800/80">
          {/* Left: Level Badge & EXP Progress */}
          <div className="col-span-12 sm:col-span-4 flex items-center gap-3">
            <div className="w-12 h-14 rounded-lg border border-amber-500/30 bg-gradient-to-b from-zinc-900 to-zinc-950 flex flex-col items-center justify-center shrink-0 shadow-inner">
              <span className="text-[9px] uppercase tracking-wider text-amber-400 font-medium">
                NÍVEL
              </span>
              <span className="text-xl font-bold text-zinc-100 leading-none">
                {character.level}
              </span>
              <span className="text-[8px] font-mono text-zinc-400 mt-0.5">
                EXP {expPercent}%
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs text-zinc-300 uppercase tracking-wide font-medium flex items-center gap-1.5">
                <span>{character.race} • {character.characterClass}</span>
              </div>

              {/* EXP Progress Bar towards next level */}
              <div className="mt-1">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-0.5">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-amber-400" />
                    <span>{expCurrent} / {expNeeded} XP</span>
                  </span>
                  <span className="text-zinc-500 font-sans text-[9px]">Próx. Nv {character.level + 1}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                    style={{ width: `${expPercent}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 font-mono mt-1 flex items-center gap-2">
                <span>Sala: <strong className="text-zinc-300 font-semibold">{campaignCode}</strong></span>
              </div>
            </div>
          </div>

          {/* Middle: Character Name & Title */}
          <div className="col-span-12 sm:col-span-5 flex flex-col items-start sm:items-center text-left sm:text-center">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-100 tracking-tight">
                {character.name}
              </h2>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                title="Editar Perfil"
                className="text-zinc-500 hover:text-zinc-300 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-zinc-400 italic">
              "{character.title}"
            </p>

            {/* Badges de Classe, Raça, Região e Idioma */}
            <div className="flex flex-wrap items-center justify-start sm:justify-center gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-full bg-zinc-850 border border-zinc-700/60 text-zinc-200 text-[10px] font-medium flex items-center gap-1">
                <Swords className="w-2.5 h-2.5 text-amber-400" />
                {character.characterClass || 'Guerreiro Rúnico'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-zinc-850 border border-zinc-700/60 text-zinc-300 text-[10px] font-medium">
                {character.race || 'Humano'}
              </span>
              {(() => {
                const reg = getRegionById(character.originRegion || 'caeldrin');
                return (
                  <span
                    className="px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-200 text-[10px] font-medium flex items-center gap-1"
                    title={reg ? `Origem: ${reg.name} • Bônus: ${reg.bonusAttribute} • ${reg.culturalTrait}` : 'Origem em Eldria'}
                  >
                    <Globe2 className="w-2.5 h-2.5 text-purple-400" />
                    <span>{reg ? `${reg.symbol} ${reg.name}` : (character.originRegion || 'Caeldrin')}</span>
                  </span>
                );
              })()}
              <span
                className="px-2 py-0.5 rounded-full bg-amber-950/50 border border-amber-800/50 text-amber-200 text-[10px] font-medium flex items-center gap-1"
                title={`Língua materna oficial`}
              >
                <Languages className="w-2.5 h-2.5 text-amber-400" />
                <span>{character.primaryLanguage || 'Caeldrico'}</span>
              </span>
              {character.currentLocation && (
                <span
                  className="px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800/50 text-emerald-200 text-[10px] font-medium flex items-center gap-1"
                  title="Localização Atual em Eldria"
                >
                  <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="truncate max-w-[140px]">{character.currentLocation}</span>
                </span>
              )}
            </div>
          </div>

          {/* Right: GM Actions / Quick Net Worth */}
          <div className="col-span-12 sm:col-span-3 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                Patrimônio
              </span>
              <span className="text-xs font-mono font-medium text-amber-400">
                {totalNetWorth.toLocaleString('pt-BR')} BRZ
              </span>
            </div>

            {isGmView ? (
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => setIsGmExpModalOpen(true)}
                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition"
                  title="Conceder Pontos de Experiência como Mestre (+3 pts de atributo por nível)"
                >
                  <Award className="w-3 h-3" />
                  <span>+ Dar EXP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExternalActionModalOpen(true)}
                  className="px-2 py-1 rounded bg-red-950/60 hover:bg-red-900/60 border border-red-700/60 text-red-300 text-[11px] font-semibold flex items-center gap-1 transition"
                  title="Aplicar Ação Externa: Ataque de Monstro, Poção ou Magia"
                >
                  <Swords className="w-3 h-3 text-red-400" />
                  <span>Ação Externa</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditCa(character.armorClass);
                    setEditSpeed(character.speed || '9m');
                    setEditInitiative(character.initiative || 0);
                    setEditNotes(character.notes || '');
                    setIsGmVitalsModalOpen(true);
                  }}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[11px] font-medium flex items-center gap-1 transition"
                  title="Ajustar CA, Deslocamento e Notas da Ficha"
                >
                  <Sliders className="w-3 h-3 text-zinc-400" />
                  <span>Parâmetros</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span
                  className="px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-[11px] font-medium flex items-center gap-1.5 shadow-sm"
                  title="A perda e ganho de PV e PM por combate, armadilhas, poções e magias são controlados exclusivamente pelo Mestre da mesa."
                >
                  <Lock className="w-3 h-3 text-amber-500/80" />
                  <span>Vitis: Apenas Mestre</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Feedback Toast */}
        {actionFeedbackToast && (
          <div className="mb-3 p-2.5 rounded-lg border border-emerald-500/50 bg-emerald-950/50 text-emerald-300 text-xs font-medium flex items-center justify-between shadow-lg shadow-emerald-950/30">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              {actionFeedbackToast}
            </span>
            <button
              onClick={() => setActionFeedbackToast(null)}
              className="text-emerald-400 hover:text-emerald-200 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Level Up: Unspent Attribute Points Banner */}
        {(character.unspentAttributePoints || 0) > 0 && (
          <div className="mb-4 p-3.5 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-cinzel font-bold text-amber-200 uppercase tracking-wide">
                    {character.unspentAttributePoints} Ponto{character.unspentAttributePoints > 1 ? 's' : ''} de Status Disponível!
                  </h4>
                  <span className="px-1.5 py-0.5 rounded bg-amber-400 text-zinc-950 text-[9px] font-extrabold uppercase">
                    Level Up
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 mt-0.5">
                  Você evoluiu! Clique no botão <strong>+1 Ponto</strong> no atributo desejado abaixo (Força, Destreza, Constituição, Inteligência, Sabedoria ou Carisma) para aprimorá-lo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Optional Profile Editor */}
        {isEditingProfile && (
          <div className="p-4 mb-5 rounded-lg border border-zinc-800 bg-zinc-900/80 text-xs space-y-3">
            <h4 className="font-medium text-zinc-200 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5" /> Editar Informações Básicas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1">Nome do Personagem</label>
                <input
                  type="text"
                  value={character.name}
                  onChange={(e) => onUpdateCharacter({ ...character, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Título / Arquétipo</label>
                <input
                  type="text"
                  value={character.title}
                  onChange={(e) => onUpdateCharacter({ ...character, title: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Classe ({PLAYABLE_CLASSES.length} opções)</label>
                <select
                  value={PLAYABLE_CLASSES.some((c) => c.name.toLowerCase() === (character.characterClass || '').toLowerCase()) ? character.characterClass : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      onUpdateCharacter({ ...character, characterClass: e.target.value });
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-600"
                >
                  {['Marcial & Tanque', 'Conjurador Arcano', 'Divino & Espiritual', 'Especialista & Furtivo', 'Cibernético & Tecnomágico'].map((category) => (
                    <optgroup key={category} label={category}>
                      {PLAYABLE_CLASSES.filter((c) => c.category === category).map((cls) => (
                        <option key={cls.id} value={cls.name}>
                          {cls.icon} {cls.name} ({cls.primaryAttribute})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="custom">Outra / Personalizada...</option>
                </select>
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Raça ({PLAYABLE_RACES.length} opções)</label>
                <select
                  value={PLAYABLE_RACES.some((r) => r.name.toLowerCase() === (character.race || '').toLowerCase()) ? character.race : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      onUpdateCharacter({ ...character, race: e.target.value });
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-600"
                >
                  {['Comum', 'Élfica', 'Anã & Pequena', 'Planar & Abissal', 'Tecnológica & Fera'].map((category) => (
                    <optgroup key={category} label={category}>
                      {PLAYABLE_RACES.filter((r) => r.category === category).map((race) => (
                        <option key={race.name} value={race.name}>
                          {race.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="custom">Outra / Personalizada...</option>
                </select>
              </div>
            </div>

            {/* Linha 2 do Perfil: Região de Origem em Eldria, Idioma Materno e Localização Atual */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-zinc-800/60">
              <div>
                <label className="text-amber-300 block mb-1 flex items-center gap-1">
                  <Globe2 className="w-3 h-3 text-amber-400" /> Região de Origem (Eldria)
                </label>
                <select
                  value={character.originRegion || 'caeldrin'}
                  onChange={(e) => {
                    const regId = e.target.value;
                    const reg = getRegionById(regId);
                    onUpdateCharacter({
                      ...character,
                      originRegion: regId,
                      primaryLanguage: reg ? reg.language : character.primaryLanguage,
                    });
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  {ORIGIN_REGIONS.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.symbol} {reg.name} ({reg.language})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-amber-300 block mb-1 flex items-center gap-1">
                  <Languages className="w-3 h-3 text-amber-400" /> Idioma Materno
                </label>
                <input
                  type="text"
                  value={character.primaryLanguage || ''}
                  onChange={(e) => onUpdateCharacter({ ...character, primaryLanguage: e.target.value })}
                  placeholder="Ex: Caeldrico, Frosten, Zarikh..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-emerald-300 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" /> Localização Atual
                </label>
                <input
                  type="text"
                  value={character.currentLocation || ''}
                  onChange={(e) => onUpdateCharacter({ ...character, currentLocation: e.target.value })}
                  placeholder="Ex: Caeldrin — Cidadela Estelar"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Se a classe personalizada for escolhida */}
            {(!PLAYABLE_CLASSES.some((c) => c.name.toLowerCase() === (character.characterClass || '').toLowerCase()) || !character.characterClass) && (
              <div>
                <label className="text-zinc-400 block mb-1">Digitar Classe Personalizada:</label>
                <input
                  type="text"
                  value={character.characterClass}
                  onChange={(e) => onUpdateCharacter({ ...character, characterClass: e.target.value })}
                  placeholder="ex: Artífice Temporal, Guardião de Runas..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
            )}

            {/* Custom race text input if selected */}
            {(!PLAYABLE_RACES.some((r) => r.name.toLowerCase() === (character.race || '').toLowerCase()) || !character.race) && (
              <div>
                <label className="text-zinc-400 block mb-1">Digitar Raça Personalizada:</label>
                <input
                  type="text"
                  value={character.race}
                  onChange={(e) => onUpdateCharacter({ ...character, race: e.target.value })}
                  placeholder="ex: Centauro, Gárgula, Draconato Solar..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
            )}

            {/* Racial Traits Preview Card */}
            {(() => {
              const raceData = PLAYABLE_RACES.find(
                (r) => r.name.toLowerCase() === (character.race || '').toLowerCase()
              );
              if (!raceData) return null;
              return (
                <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/90 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Características Raciais ({raceData.name})
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 text-[10px]">
                      Categoria: {raceData.category}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed italic">
                    "{raceData.description}"
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {raceData.traits.split(',').map((trait, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-purple-950/40 border border-purple-800/50 text-purple-200 text-[10px] font-medium"
                      >
                        ✦ {trait.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div>
              <label className="text-zinc-400 block mb-1">Escolher Retrato:</label>
              <div className="flex items-center gap-2">
                {AVATAR_PRESETS.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="Avatar preset"
                    onClick={() => onUpdateCharacter({ ...character, avatarUrl: url })}
                    className={`w-9 h-9 rounded-md object-cover cursor-pointer border transition ${
                      character.avatarUrl === url ? 'border-zinc-300 scale-105' : 'border-zinc-800 opacity-60'
                    }`}
                  />
                ))}
                <input
                  type="text"
                  placeholder="Ou cole a URL de uma imagem..."
                  value={customAvatarInput}
                  onChange={(e) => setCustomAvatarInput(e.target.value)}
                  onBlur={() => {
                    if (customAvatarInput) onUpdateCharacter({ ...character, avatarUrl: customAvatarInput });
                  }}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-950 font-medium rounded-md text-xs transition"
              >
                Concluir Edição
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MAIN SECTION: Left Column (Portrait & Vitals) vs Right Column (Attributes & Traits) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-12 gap-4 items-stretch mb-5">
          {/* LEFT COLUMN: Portrait + Vital Stats */}
          <div className="col-span-12 lg:col-span-5 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5 flex flex-col justify-between">
            {/* Character Portrait Frame */}
            <div className="relative rounded-md overflow-hidden border border-zinc-800 h-48 sm:h-56 bg-zinc-950 group">
              <img
                src={
                  character.avatarUrl ||
                  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80'
                }
                alt={character.name}
                className="w-full h-full object-cover object-center"
              />

              {/* Shading overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none" />

              {/* Floating Vitals in portrait corner */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-zinc-950/90 px-2.5 py-1 rounded-md border border-zinc-800">
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-200">
                  CA {character.armorClass}
                </span>
              </div>

              <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-zinc-950/90 px-2.5 py-1 rounded-md border border-zinc-800">
                <Footprints className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-mono text-zinc-300">{character.speed}</span>
              </div>
            </div>

            {/* Vital Bars */}
            <div className="space-y-2.5 mt-3">
              {/* HP BAR */}
              <div className="rounded-md border border-zinc-800 bg-zinc-900/80 p-2.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1 text-red-400 font-medium">
                    <Heart className="w-3.5 h-3.5" /> Pontos de Vida (PV)
                  </span>
                  <span className="font-mono text-xs font-semibold text-zinc-200">
                    {character.hp.current} / {character.hp.max}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{
                      width: `${Math.max(0, Math.min(100, (character.hp.current / character.hp.max) * 100))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2 pt-1.5 border-t border-zinc-800/60">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Heart className="w-2.5 h-2.5 text-red-400" /> Dano / Regeneração Externa
                  </span>
                  <span className="font-mono text-zinc-300 font-semibold">
                    {Math.round((character.hp.current / character.hp.max) * 100)}%
                  </span>
                </div>
              </div>

              {/* MANA BAR */}
              <div className="rounded-md border border-zinc-800 bg-zinc-900/80 p-2.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1 text-blue-400 font-medium">
                    <Droplets className="w-3.5 h-3.5" /> Pontos de Mana (PM)
                  </span>
                  <span className="font-mono text-xs font-semibold text-zinc-200">
                    {character.mana.current} / {character.mana.max}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${Math.max(0, Math.min(100, (character.mana.current / character.mana.max) * 100))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2 pt-1.5 border-t border-zinc-800/60">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Droplets className="w-2.5 h-2.5 text-blue-400" /> Poções / Magias Arcanas
                  </span>
                  <span className="font-mono text-zinc-300 font-semibold">
                    {Math.round((character.mana.current / character.mana.max) * 100)}%
                  </span>
                </div>
              </div>

              {/* AÇÕES EXTERNAS EM JOGO (Apenas Mestre) */}
              {isGmView ? (
                <div className="rounded-lg border border-purple-900/50 bg-[#120822]/95 p-2.5 space-y-2 shadow-lg shadow-purple-950/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-purple-300 flex items-center gap-1.5 font-cinzel">
                      <Swords className="w-3.5 h-3.5 text-red-400" /> Ações do Mestre (Combate & Efeitos)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsExternalActionModalOpen(true)}
                      className="text-[10px] px-2 py-0.5 rounded bg-purple-900/60 hover:bg-purple-800/70 border border-purple-700/60 text-purple-200 transition font-medium flex items-center gap-1 shadow-sm"
                    >
                      <Sliders className="w-3 h-3 text-purple-300" />
                      <span>Personalizar...</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        triggerExternalAction({
                          actionType: 'monster_attack',
                          sourceName: 'Ataque Físico de Monstro',
                          amount: 10,
                          damageType: 'Físico',
                          details: 'Dano de combate sofrido',
                        })
                      }
                      className="py-1 px-2 rounded bg-red-950/70 hover:bg-red-900/80 border border-red-800/60 text-red-200 text-[10px] font-medium flex items-center justify-center gap-1 transition shadow-sm"
                      title="Simular ataque de criatura: causa -10 PV"
                    >
                      <Swords className="w-3 h-3 text-red-400 shrink-0" /> -10 Dano Monstro
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        triggerExternalAction({
                          actionType: 'poison_burn_dot',
                          sourceName: 'Veneno / Queimadura',
                          amount: 5,
                          damageType: 'Veneno',
                          details: 'Efeito contínuo de status',
                        })
                      }
                      className="py-1 px-2 rounded bg-orange-950/70 hover:bg-orange-900/80 border border-orange-800/60 text-orange-200 text-[10px] font-medium flex items-center justify-center gap-1 transition shadow-sm"
                      title="Dano contínuo / veneno: causa -5 PV"
                    >
                      <Skull className="w-3 h-3 text-orange-400 shrink-0" /> -5 Veneno / DoT
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        triggerExternalAction({
                          actionType: 'potion_hp',
                          sourceName: 'Poção de Cura Alquímica',
                          amount: 15,
                          details: 'Consumo de elixir vital',
                        })
                      }
                      className="py-1 px-2 rounded bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-800/60 text-emerald-200 text-[10px] font-medium flex items-center justify-center gap-1 transition shadow-sm"
                      title="Beber poção de cura: restaura +15 PV"
                    >
                      <FlaskConical className="w-3 h-3 text-emerald-400 shrink-0" /> +15 Poção Vida
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        triggerExternalAction({
                          actionType: 'potion_mana',
                          sourceName: 'Frasco de Éter',
                          amount: 15,
                          details: 'Consumo de elixir mágico',
                        })
                      }
                      className="py-1 px-2 rounded bg-blue-950/70 hover:bg-blue-900/80 border border-blue-800/60 text-blue-200 text-[10px] font-medium flex items-center justify-center gap-1 transition shadow-sm"
                      title="Beber frasco de mana: restaura +15 PM"
                    >
                      <FlaskConical className="w-3 h-3 text-blue-400 shrink-0" /> +15 Poção Mana
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        triggerExternalAction({
                          actionType: 'short_rest',
                          sourceName: 'Descanso Curto',
                          amount: 10,
                          details: 'Pausa rápida para estancar ferimentos',
                        })
                      }
                      className="py-1 px-2 rounded bg-amber-950/70 hover:bg-amber-900/80 border border-amber-800/60 text-amber-200 text-[10px] font-medium flex items-center justify-center gap-1 transition shadow-sm"
                      title="Descanso curto: restaura +10 PV e +5 PM"
                    >
                      <Moon className="w-3 h-3 text-amber-400 shrink-0" /> Descanso Curto
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        triggerExternalAction({
                          actionType: 'long_rest',
                          sourceName: 'Descanso Longo',
                          amount: 0,
                          details: 'Recuperação total de PV e PM após acampamento seguro',
                        })
                      }
                      className="py-1 px-2 rounded bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-800/60 text-indigo-200 text-[10px] font-medium flex items-center justify-center gap-1 transition shadow-sm"
                      title="Descanso longo: restaura 100% de PV e PM"
                    >
                      <Sun className="w-3 h-3 text-indigo-300 shrink-0" /> Descanso Longo (100%)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-2.5 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-zinc-300 font-semibold">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Shield className="w-3.5 h-3.5 text-amber-400" /> Vitis & Combate
                    </span>
                    <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-amber-400" /> Apenas Narrador
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[10.5px] leading-relaxed">
                    A perda e ganho de PV e PM por danos de criaturas, armadilhas, poções e magias são controlados exclusivamente pelo Mestre da mesa.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: 6 Core Attributes + 2 Trait Panels */}
          <div className="col-span-12 lg:col-span-7 flex flex-col justify-between gap-3">
            {/* 6 Attributes */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-medium text-zinc-200 uppercase tracking-wider">
                  Atributos Principais (Apenas Jogador)
                </span>
                <span className="text-[10px] text-amber-400/90 font-medium">
                  +3 Pontos por Nível Alcançado
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'FOR', name: 'Força', val: character.attributes.FOR, perk: null },
                  { key: 'DES', name: 'Destreza', val: character.attributes.DES, perk: null },
                  { key: 'CON', name: 'Constituição', val: character.attributes.CON, perk: '+5 PV Máx/pt' },
                  { key: 'INT', name: 'Inteligência', val: character.attributes.INT, perk: '+5 PM Máx/pt' },
                  { key: 'SAB', name: 'Sabedoria', val: character.attributes.SAB, perk: null },
                  { key: 'CAR', name: 'Carisma/Cyber', val: character.attributes.CAR, perk: null },
                ].map((attr) => {
                  const mod = getModifier(attr.val);
                  return (
                    <div
                      key={attr.key}
                      className={`group rounded-lg border bg-zinc-900/90 p-2.5 flex flex-col items-center justify-between transition ${
                        (character.unspentAttributePoints || 0) > 0
                          ? 'border-amber-500/50 bg-amber-950/15 shadow-sm shadow-amber-950/20'
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div
                        onClick={() => rollD20(attr.name, attr.val)}
                        className="w-full flex flex-col items-center cursor-pointer"
                        title="Clique para rolar teste d20"
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                            {attr.key}
                          </span>
                          {attr.perk && (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-purple-950/80 border border-purple-700/60 text-purple-300 font-semibold">
                              {attr.perk}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500">{attr.name}</span>

                        <div className="my-1 flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-zinc-100">
                            {attr.val}
                          </span>
                          <span className="text-xs font-mono font-medium text-zinc-300 bg-zinc-800 px-1 rounded border border-zinc-700">
                            {mod}
                          </span>
                        </div>

                        <div className="text-[9px] text-zinc-500 group-hover:text-zinc-300 transition flex items-center gap-1 mb-1">
                          <Dice5 className="w-2.5 h-2.5" /> Rolar teste
                        </div>
                      </div>

                      {/* Attribute distribution button (Level up points: only players spend) */}
                      {(character.unspentAttributePoints || 0) > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAllocateAttributePoint(attr.key as any);
                          }}
                          className="w-full py-1 px-1 rounded bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-[10px] flex items-center justify-center gap-1 shadow-md shadow-amber-950/40 animate-pulse transition mt-1"
                          title={`Gastar 1 ponto livre para aumentar ${attr.name} (+1)`}
                        >
                          <Plus className="w-3 h-3" /> +1 Ponto
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {(character.unspentAttributePoints || 0) === 0 && (
                <div className="text-[10px] text-zinc-500 text-center pt-1 border-t border-zinc-800/60 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500/60" />
                  Acumule EXP em combates para subir de nível e desbloquear +3 pontos de atributos.
                </div>
              )}
            </div>

            {/* 2 Feature Panels: Perícias & Talentos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
              {/* Perícias / Especializações */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 flex flex-col">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-2">
                  <span className="text-xs font-medium text-zinc-200">
                    Perícias Treinadas
                  </span>
                  <span className="text-[9px] text-zinc-500">Auto</span>
                </div>
                <div className="space-y-1 overflow-y-auto max-h-28 pr-1 text-xs">
                  {character.skillsList.map((skill, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-zinc-300 bg-zinc-950/60 px-2 py-1 rounded border border-zinc-800"
                    >
                      <span>{skill}</span>
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Habilidades & Foco */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 flex flex-col">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-2">
                  <span className="text-xs font-medium text-zinc-200">
                    Habilidades Passivas
                  </span>
                  <span className="text-[9px] text-zinc-500">{character.traits.length} traços</span>
                </div>
                <div className="space-y-1 overflow-y-auto max-h-28 pr-1 text-xs">
                  {character.traits.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-zinc-300 bg-zinc-950/60 px-2 py-1 rounded border border-zinc-800"
                    >
                      <span className="text-[11px]">{t.label}</span>
                      <span className="font-mono text-[11px] text-zinc-400">{t.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* HORIZONTAL RIBBON: 6 Quick Parameters */}
        {/* ============================================================ */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 mb-5">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="border-r border-zinc-800 pr-1">
              <span className="text-[10px] text-zinc-500 uppercase block">INICIATIVA</span>
              <span className="text-base font-mono font-semibold text-zinc-200">
                +{character.initiative}
              </span>
            </div>
            <div className="border-r border-zinc-800 pr-1">
              <span className="text-[10px] text-zinc-500 uppercase block">BÔNUS PROF.</span>
              <span className="text-base font-mono font-semibold text-zinc-200">+3</span>
            </div>
            <div className="border-r border-zinc-800 pr-1">
              <span className="text-[10px] text-zinc-500 uppercase block">SINTONIA</span>
              <span className="text-base font-mono font-semibold text-zinc-200">Nível {character.level}</span>
            </div>
            <div className="border-r border-zinc-800 pr-1">
              <span className="text-[10px] text-zinc-500 uppercase block">DESLOCAMENTO</span>
              <span className="text-base font-mono font-semibold text-zinc-200">{character.speed}</span>
            </div>
            <div className="border-r border-zinc-800 pr-1">
              <span className="text-[10px] text-zinc-500 uppercase block">ESTAMINA</span>
              <span className="text-base font-mono font-semibold text-zinc-200">
                {character.stamina.current}/{character.stamina.max}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block">PATRIMÔNIO BRZ</span>
              <span className="text-base font-mono font-semibold text-amber-400">
                {totalNetWorth.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BOTTOM MAJOR PANEL: Tabs (Coins, Spells, Inventory, Notes) */}
        {/* ============================================================ */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('coins')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                  activeTab === 'coins'
                    ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Bolsa de Moedas ({totalNetWorth} BRZ)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('spells')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                  activeTab === 'spells'
                    ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Magias ({character.abilities.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                  activeTab === 'inventory'
                    ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Backpack className="w-3.5 h-3.5" />
                <span>Inventário ({character.inventory.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                  activeTab === 'notes'
                    ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Anotações</span>
              </button>
            </div>

            {/* Action buttons on the tab right */}
            {activeTab === 'coins' && (
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(true)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs rounded-md border border-zinc-700 flex items-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                Pagar ao Mestre
              </button>
            )}

            {activeTab === 'spells' && (
              <button
                type="button"
                onClick={() => {
                  setEditingSpell(null);
                  setIsSpellModalOpen(true);
                }}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-md flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Magia
              </button>
            )}

            {activeTab === 'inventory' && (
              isGmView ? (
                <button
                  type="button"
                  onClick={handleAddInventoryItem}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-md flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Conceder Item (Mestre)
                </button>
              ) : onNavigateToShop ? (
                <button
                  type="button"
                  onClick={onNavigateToShop}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-cinzel font-bold text-xs rounded-md flex items-center gap-1.5 transition shadow-sm"
                >
                  <Store className="w-3.5 h-3.5" />
                  Ir à Loja do Mestre
                </button>
              ) : null
            )}
          </div>

          {/* TAB CONTENT: 1. BOLSA DE MOEDAS */}
          {activeTab === 'coins' && (
            <div className="space-y-4">
              {/* Informative Security Notice */}
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Saldo Protegido:</strong> Os valores da bolsa são inalteráveis manualmente e mudam apenas através de transferências, pagamentos, saques ou tesouros concedidos.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(true)}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium text-xs rounded border border-amber-500/30 shrink-0 flex items-center gap-1.5 transition"
                >
                  <Send className="w-3 h-3 text-amber-400" />
                  <span>Transferir</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(['BRZ', 'PRT', 'ORO', 'PLN', 'CYB'] as CurrencyType[]).map((curr) => {
                  const cfg = CURRENCY_CONFIGS[curr];
                  const amount = character.wallet[curr] || 0;
                  const subtotalBRZ = amount * cfg.unitValueInBRZ;

                  return (
                    <div
                      key={curr}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 flex flex-col items-center justify-between text-center"
                    >
                      <CoinVisual type={curr} size="md" />

                      <div className="mt-2">
                        <span className="text-[11px] uppercase tracking-wider text-zinc-400 block font-medium">
                          {cfg.name}
                        </span>
                        <span className="text-xl font-bold font-mono text-zinc-100">
                          {amount}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono block">
                          (= {subtotalBRZ.toLocaleString('pt-BR')} BRZ)
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-zinc-800/80 w-full flex items-center justify-center text-[10px] text-zinc-500 gap-1 font-mono">
                        <Lock className="w-2.5 h-2.5 text-zinc-600" />
                        <span>Inalterável</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Transaction Callout */}
              <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400 shrink-0">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-medium text-zinc-200">
                      Transações com o Mestre ({gmName})
                    </h5>
                    <p className="text-zinc-400 text-[11px]">
                      Pague taxas, equipamentos ou serviços diretamente para a reserva da campanha.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(true)}
                  className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-md shadow-sm shrink-0 flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Transferir Moedas
                </button>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 2. MAGIAS */}
          {activeTab === 'spells' && (
            <div>
              {character.abilities.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/20">
                  <BookOpen className="w-8 h-8 text-zinc-500 mx-auto mb-2 opacity-60" />
                  <h5 className="font-medium text-zinc-300 text-sm">Grimório Vazio</h5>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-3">
                    Adicione suas magias e habilidades à ficha.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSpell(null);
                      setIsSpellModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium rounded-md transition"
                  >
                    Criar Magia
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {character.abilities.map((spell) => (
                    <SpellCardView
                      key={spell.id}
                      card={spell}
                      onCast={handleCastSpell}
                      onEdit={(card) => {
                        setEditingSpell(card);
                        setIsSpellModalOpen(true);
                      }}
                      onDelete={handleDeleteSpell}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: 3. INVENTÁRIO */}
          {activeTab === 'inventory' && (
            <div className="pt-1">
              <PlayerInventoryView
                character={character}
                onUpdateCharacter={onUpdateCharacter}
                isGmView={isGmView}
                campaign={campaign}
                onNavigateToShop={onNavigateToShop}
                onUpdateCampaign={onUpdateCampaign}
              />
            </div>
          )}

          {/* TAB CONTENT: 4. ANOTAÇÕES */}
          {activeTab === 'notes' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Diário da Campanha & Anotações
              </label>
              <textarea
                rows={8}
                value={character.notes}
                onChange={(e) => onUpdateCharacter({ ...character, notes: e.target.value })}
                placeholder="Escreva missões, pistas do Mestre, segredos encontrados na campanha..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 leading-relaxed font-sans"
              />
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* BOTTOM BAR: Maestria Markers & Sync Status */}
        {/* ============================================================ */}
        <div className="flex items-center justify-between pt-4 mt-5 border-t border-zinc-800 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Grau de Maestria:
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onUpdateCharacter({ ...character, starsLevel: s })}
                  title={`Definir Grau ${s}`}
                  className="p-0.5 hover:scale-110 transition"
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      s <= (character.starsLevel || 1)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-zinc-700'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-[11px] text-zinc-400">Sincronizado na Sala</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CoinTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        senderCharacter={character}
        campaignCode={campaignCode}
        gmName={gmName}
        otherPlayers={otherPlayers}
        onTransfer={onExecuteTransaction}
        onTriggerAnimation={onTriggerAnimation}
      />

      <SpellModal
        isOpen={isSpellModalOpen}
        initialCard={editingSpell}
        onClose={() => {
          setIsSpellModalOpen(false);
          setEditingSpell(null);
        }}
        onSave={handleSaveSpell}
      />

      {/* GM Modal: Conceder EXP */}
      {isGmExpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 text-sm">
                    Conceder EXP — {character.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Nível Atual: <strong>{character.level}</strong> • EXP: <strong>{character.experience}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGmExpModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 font-medium block mb-1.5">
                  Quantidade de Experiência (XP):
                </label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[50, 100, 250, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGmExpInput(preset)}
                      className={`py-1 text-xs rounded font-mono border transition ${
                        gmExpInput === preset
                          ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  value={gmExpInput}
                  onChange={(e) => setGmExpInput(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
                  placeholder="Quantidade de XP"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-medium block mb-1">
                  Motivo / Feito da Campanha:
                </label>
                <input
                  type="text"
                  value={gmExpReason}
                  onChange={(e) => setGmExpReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                  placeholder="Ex: Derrotou o Guardião do Abismo"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Regra de Progressão:</span>
                </div>
                <p>
                  A cada <strong>1.000 XP</strong> acumulado, o jogador sobe de nível, ganha <strong>+3 pontos de atributos</strong> para distribuir livremente e tem seus PV/PM máximos ampliados.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsGmExpModalOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGmAwardExpSubmit}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-bold text-xs rounded-lg shadow-md transition flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Conceder EXP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GM Modal: Ajustar Parâmetros Não-Vitais (CA, Deslocamento, Iniciativa, Notas) */}
      {isGmVitalsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 text-sm">
                    Parâmetros da Ficha: {character.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Ajuste de CA, movimentação e notas (PV/PM são alterados apenas por ações externas)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGmVitalsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Informative Note regarding Rules */}
              <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-200/90 leading-relaxed">
                <strong>Regra da Mesa:</strong> PV e Mana são inalteráveis manualmente pelo Mestre. Dano e recuperação ocorrem exclusivamente através de <em>Ações Externas</em> (ataque de monstros, poções ou magias). Atributos são distribuídos exclusivamente pelo jogador (+3 pontos ao subir de nível).
              </div>

              {/* CA & Deslocamento */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-300 font-medium flex items-center gap-1 mb-1">
                    <Shield className="w-3 h-3 text-zinc-400" /> Classe Armadura (CA):
                  </label>
                  <input
                    type="number"
                    value={editCa}
                    onChange={(e) => setEditCa(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-mono focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-300 font-medium flex items-center gap-1 mb-1">
                    <Footprints className="w-3 h-3 text-zinc-400" /> Deslocamento:
                  </label>
                  <input
                    type="text"
                    value={editSpeed}
                    onChange={(e) => setEditSpeed(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-mono focus:border-zinc-500"
                    placeholder="ex: 9m"
                  />
                </div>
              </div>

              {/* Iniciativa & Raça */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-300 font-medium flex items-center gap-1 mb-1">
                    <Zap className="w-3 h-3 text-amber-400" /> Bônus de Iniciativa:
                  </label>
                  <input
                    type="number"
                    value={editInitiative}
                    onChange={(e) => setEditInitiative(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-mono focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-300 font-medium flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3 text-purple-400" /> Raça do Personagem:
                  </label>
                  <select
                    value={PLAYABLE_RACES.some((r) => r.name.toLowerCase() === editRace.toLowerCase()) ? editRace : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') setEditRace(e.target.value);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:border-purple-500"
                  >
                    {['Comum', 'Élfica', 'Anã & Pequena', 'Planar & Abissal', 'Tecnológica & Fera'].map((category) => (
                      <optgroup key={category} label={category}>
                        {PLAYABLE_RACES.filter((r) => r.category === category).map((race) => (
                          <option key={race.name} value={race.name}>
                            {race.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <option value="custom">Outra / Personalizada</option>
                  </select>
                </div>
              </div>

              {/* Notas do Mestre */}
              <div>
                <label className="text-xs text-zinc-300 font-medium flex items-center gap-1 mb-1">
                  <FileText className="w-3 h-3 text-zinc-400" /> Notas do Narrador:
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:border-zinc-500 resize-none"
                  placeholder="Observações, condições ativas ou efeitos especiais..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsGmVitalsModalOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveGmParameters}
                className="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs rounded-lg shadow-md transition"
              >
                Salvar Parâmetros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ações Externas & Efeitos em Jogo (Exclusivo do Mestre) */}
      {isGmView && isExternalActionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-zinc-900 border border-purple-900/70 rounded-xl max-w-xl w-full p-5 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-purple-950/90 border border-purple-700/60 flex items-center justify-center text-purple-300 shadow-inner">
                  <Swords className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 text-sm flex items-center gap-1.5 font-cinzel">
                    Painel do Mestre: Ações Externas & Efeitos
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Alvo: <strong className="text-amber-300">{character.name}</strong> • PV: {character.hp.current}/{character.hp.max} | PM: {character.mana.current}/{character.mana.max}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExternalActionModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 text-xs p-1.5 rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Categoria / Tipo de Ação */}
              <div>
                <label className="text-xs text-zinc-300 font-medium block mb-1.5 flex items-center justify-between">
                  <span>Tipo de Efeito Externo:</span>
                  <span className="text-[10px] text-purple-400 font-mono">11 Presets Disponíveis</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    {
                      id: 'monster_attack',
                      name: 'Ataque Criatura',
                      sub: '- PV (Dano Físico)',
                      icon: Swords,
                      color: 'border-red-600 bg-red-950/40 text-red-200',
                      defaultSource: 'Ataque de Monstro',
                      defaultAmt: 12,
                      defaultDetails: 'Golpe físico sofrido em combate',
                    },
                    {
                      id: 'poison_burn_dot',
                      name: 'Dano Contínuo / DoT',
                      sub: '- PV (Veneno/Fogo)',
                      icon: Skull,
                      color: 'border-orange-600 bg-orange-950/40 text-orange-200',
                      defaultSource: 'Veneno Letal',
                      defaultAmt: 6,
                      defaultDetails: 'Efeito contínuo por rodada',
                    },
                    {
                      id: 'environmental_trap',
                      name: 'Armadilha / Queda',
                      sub: '- PV (Perigo Ambiental)',
                      icon: Flame,
                      color: 'border-amber-600 bg-amber-950/40 text-amber-200',
                      defaultSource: 'Fosso de Estacas',
                      defaultAmt: 15,
                      defaultDetails: 'Falha em teste de reflexos',
                    },
                    {
                      id: 'potion_hp',
                      name: 'Poção de Vida',
                      sub: '+ PV (Consumível)',
                      icon: FlaskConical,
                      color: 'border-emerald-600 bg-emerald-950/40 text-emerald-200',
                      defaultSource: 'Poção de Cura Maior',
                      defaultAmt: 20,
                      defaultDetails: 'Consumo de elixir vital',
                    },
                    {
                      id: 'potion_mana',
                      name: 'Frasco de Mana',
                      sub: '+ PM (Consumível)',
                      icon: FlaskConical,
                      color: 'border-blue-600 bg-blue-950/40 text-blue-200',
                      defaultSource: 'Frasco de Éter Refinado',
                      defaultAmt: 15,
                      defaultDetails: 'Consumo de elixir mágico',
                    },
                    {
                      id: 'heal_spell',
                      name: 'Magia de Cura',
                      sub: '+ PV (Milagre Divino)',
                      icon: Wand2,
                      color: 'border-teal-600 bg-teal-950/40 text-teal-200',
                      defaultSource: 'Palavra Curativa',
                      defaultAmt: 18,
                      defaultDetails: 'Magia sagrada de restauração',
                    },
                    {
                      id: 'mana_spell',
                      name: 'Harmonização Arcana',
                      sub: '+ PM (Éter Ambiente)',
                      icon: Zap,
                      color: 'border-indigo-600 bg-indigo-950/40 text-indigo-200',
                      defaultSource: 'Comunhão Mágica',
                      defaultAmt: 15,
                      defaultDetails: 'Canalização de mana espiritual',
                    },
                    {
                      id: 'short_rest',
                      name: 'Descanso Curto',
                      sub: '+ PV & + PM Parciais',
                      icon: Moon,
                      color: 'border-amber-500 bg-amber-950/40 text-amber-200',
                      defaultSource: 'Pausa Tática',
                      defaultAmt: 10,
                      defaultDetails: 'Curativo rápido e respiração',
                    },
                    {
                      id: 'long_rest',
                      name: 'Descanso Longo',
                      sub: '100% PV & PM Total',
                      icon: Sun,
                      color: 'border-yellow-500 bg-yellow-950/40 text-yellow-200',
                      defaultSource: 'Noite de Descanso',
                      defaultAmt: 0,
                      defaultDetails: 'Recuperação completa em local seguro',
                    },
                    {
                      id: 'custom_damage',
                      name: 'Dano Customizado',
                      sub: 'Configurável (PV/PM)',
                      icon: Swords,
                      color: 'border-rose-600 bg-rose-950/40 text-rose-200',
                      defaultSource: 'Efeito Especial',
                      defaultAmt: 10,
                      defaultDetails: 'Dano customizado pelo mestre',
                    },
                    {
                      id: 'custom_recovery',
                      name: 'Cura Customizada',
                      sub: 'Configurável (PV/PM)',
                      icon: HeartPulse,
                      color: 'border-green-600 bg-green-950/40 text-green-200',
                      defaultSource: 'Bênção de Santuário',
                      defaultAmt: 15,
                      defaultDetails: 'Recuperação concedida pelo mestre',
                    },
                  ].map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = extActionType === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setExtActionType(preset.id as ExternalActionType);
                          setExtSourceName(preset.defaultSource);
                          setExtAmount(preset.defaultAmt);
                          setExtDetails(preset.defaultDetails);
                        }}
                        className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition ${
                          isSelected
                            ? preset.color + ' ring-1 ring-white/20'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                      >
                        <span className="text-[11px] font-semibold flex items-center gap-1">
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{preset.name}</span>
                        </span>
                        <span className="text-[9.5px] text-zinc-500 truncate">{preset.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Elemento / Tipo de Dano (se for dano) */}
              {(extActionType === 'monster_attack' ||
                extActionType === 'poison_burn_dot' ||
                extActionType === 'environmental_trap' ||
                extActionType === 'custom_damage') && (
                <div>
                  <label className="text-xs text-zinc-300 font-medium block mb-1">
                    Tipo / Elemento de Dano:
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {[
                      'Físico',
                      'Fogo',
                      'Gelo',
                      'Ácido',
                      'Elétrico',
                      'Veneno',
                      'Necrótico',
                      'Radiante',
                      'Psíquico',
                      'Força',
                    ].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setExtDamageType(type)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
                          extDamageType === type
                            ? 'bg-red-950/80 border-red-600 text-red-200'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Alvo do Efeito (para ações customizadas) */}
              {(extActionType === 'custom_damage' || extActionType === 'custom_recovery') && (
                <div>
                  <label className="text-xs text-zinc-300 font-medium block mb-1">
                    Atributo Vital Afetado:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setExtTargetVitals('hp')}
                      className={`p-1.5 rounded border text-center font-medium text-xs transition ${
                        extTargetVitals === 'hp'
                          ? 'border-red-500 bg-red-950/60 text-red-200'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      Pontos de Vida (PV)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExtTargetVitals('mana')}
                      className={`p-1.5 rounded border text-center font-medium text-xs transition ${
                        extTargetVitals === 'mana'
                          ? 'border-blue-500 bg-blue-950/60 text-blue-200'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      Pontos de Mana (PM)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExtTargetVitals('both')}
                      className={`p-1.5 rounded border text-center font-medium text-xs transition ${
                        extTargetVitals === 'both'
                          ? 'border-purple-500 bg-purple-950/60 text-purple-200'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      Ambos (PV & PM)
                    </button>
                  </div>
                </div>
              )}

              {/* Origem / Nome da Fonte */}
              <div>
                <label className="text-xs text-zinc-300 font-medium block mb-1">
                  Origem do Efeito / Nome da Criatura, Magia ou Consumível:
                </label>
                <input
                  type="text"
                  value={extSourceName}
                  onChange={(e) => setExtSourceName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:border-purple-500"
                  placeholder="ex: Dragão Negro Ancião, Poção de Cura Maior..."
                />
              </div>

              {/* Rolador Rápido de Dados & Modificadores */}
              {extActionType !== 'long_rest' && (
                <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Dices className="w-3.5 h-3.5 text-purple-400" /> Rolador de Dados Rápido:
                    </span>
                    {lastDiceRoll && (
                      <span className="text-[10px] text-amber-300 font-mono bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded">
                        Dado {lastDiceRoll.formula} rolou: {lastDiceRoll.result}!
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['1d4', '1d6', '1d8', '1d10', '1d12', '2d6', '2d8', '3d6', '4d6', '1d20'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => handleQuickDiceRoll(f)}
                        className={`px-2 py-1 text-xs rounded border font-mono transition ${
                          extDiceFormula === f
                            ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {/* Valor Numérico Base & Multiplicador */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-zinc-800/80">
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">
                        Valor Base ({extActionType.includes('attack') || extActionType.includes('dot') || extActionType.includes('trap') || extActionType === 'custom_damage' ? 'Dano' : 'Cura'}):
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={extAmount}
                        onChange={(e) => {
                          setExtAmount(Math.max(0, Number(e.target.value)));
                          setExtDiceFormula('');
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-100 font-mono focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">
                        Multiplicador (Crítico / Resistência):
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { label: '0.5x', val: 0.5, tip: 'Resistência' },
                          { label: '1x', val: 1, tip: 'Normal' },
                          { label: '1.5x', val: 1.5, tip: 'Vulnerável' },
                          { label: '2x', val: 2, tip: 'Crítico' },
                        ].map((m) => (
                          <button
                            key={m.val}
                            type="button"
                            onClick={() => setExtMultiplier(m.val)}
                            className={`py-1 text-center rounded border font-mono text-[11px] transition ${
                              extMultiplier === m.val
                                ? 'bg-purple-600 text-white border-purple-500 font-bold'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850'
                            }`}
                            title={m.tip}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detalhes Narrativos */}
              <div>
                <label className="text-xs text-zinc-300 font-medium block mb-1">
                  Detalhes / Narrativa da Ação (opcional):
                </label>
                <input
                  type="text"
                  value={extDetails}
                  onChange={(e) => setExtDetails(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:border-purple-500"
                  placeholder="ex: Acerto crítico de garras, falhou no teste de resistência..."
                />
              </div>

              {/* Simulador / Previsão em Tempo Real */}
              {(() => {
                const mult = extMultiplier > 0 ? extMultiplier : 1;
                const calcAmt = Math.max(0, Math.round(extAmount * mult));
                let projectedHp = character.hp.current;
                let projectedMana = character.mana.current;

                if (
                  extActionType === 'monster_attack' ||
                  extActionType === 'poison_burn_dot' ||
                  extActionType === 'environmental_trap'
                ) {
                  projectedHp = Math.max(0, projectedHp - calcAmt);
                } else if (extActionType === 'potion_hp' || extActionType === 'heal_spell') {
                  projectedHp = Math.min(character.hp.max, projectedHp + calcAmt);
                } else if (extActionType === 'potion_mana' || extActionType === 'mana_spell') {
                  projectedMana = Math.min(character.mana.max, projectedMana + calcAmt);
                } else if (extActionType === 'short_rest') {
                  projectedHp = Math.min(character.hp.max, projectedHp + calcAmt);
                  projectedMana = Math.min(character.mana.max, projectedMana + Math.round(calcAmt / 2));
                } else if (extActionType === 'long_rest') {
                  projectedHp = character.hp.max;
                  projectedMana = character.mana.max;
                } else if (extActionType === 'custom_damage') {
                  if (extTargetVitals === 'mana') projectedMana = Math.max(0, projectedMana - calcAmt);
                  else projectedHp = Math.max(0, projectedHp - calcAmt);
                } else if (extActionType === 'custom_recovery') {
                  if (extTargetVitals === 'mana') projectedMana = Math.min(character.mana.max, projectedMana + calcAmt);
                  else if (extTargetVitals === 'both') {
                    projectedHp = Math.min(character.hp.max, projectedHp + calcAmt);
                    projectedMana = Math.min(character.mana.max, projectedMana + calcAmt);
                  } else projectedHp = Math.min(character.hp.max, projectedHp + calcAmt);
                }

                return (
                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-purple-900/40 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between text-zinc-300 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <HeartPulse className="w-3.5 h-3.5 text-purple-400" /> Previsão de Impacto nos Vitis:
                      </span>
                      <span className="font-mono text-purple-300">
                        Total a aplicar: {extActionType === 'long_rest' ? '100% Total' : calcAmt}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                        <span className="text-red-400">PV:</span>
                        <span>
                          {character.hp.current}/{character.hp.max} ➔{' '}
                          <strong className={projectedHp < character.hp.current ? 'text-red-400' : 'text-emerald-400'}>
                            {projectedHp}/{character.hp.max}
                          </strong>
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                        <span className="text-blue-400">PM:</span>
                        <span>
                          {character.mana.current}/{character.mana.max} ➔{' '}
                          <strong className={projectedMana < character.mana.current ? 'text-rose-400' : 'text-blue-400'}>
                            {projectedMana}/{character.mana.max}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsExternalActionModalOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() =>
                  triggerExternalAction({
                    actionType: extActionType,
                    sourceName: extSourceName,
                    amount: extAmount,
                    multiplier: extMultiplier,
                    damageType: extDamageType,
                    targetVitals: extTargetVitals,
                    diceFormula: extDiceFormula,
                    details: extDetails,
                  })
                }
                className={`px-4 py-2 font-bold text-xs rounded-lg shadow-lg transition flex items-center gap-1.5 ${
                  extActionType === 'monster_attack' ||
                  extActionType === 'poison_burn_dot' ||
                  extActionType === 'environmental_trap' ||
                  (extActionType === 'custom_damage' && extTargetVitals !== 'mana')
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                }`}
              >
                {extActionType === 'monster_attack' ||
                extActionType === 'poison_burn_dot' ||
                extActionType === 'environmental_trap' ||
                extActionType === 'custom_damage' ? (
                  <>
                    <Swords className="w-4 h-4" /> Aplicar Dano de Combate
                  </>
                ) : (
                  <>
                    <FlaskConical className="w-4 h-4" /> Aplicar Restauração / Efeito
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
