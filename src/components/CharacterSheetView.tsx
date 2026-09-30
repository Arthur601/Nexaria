import React, { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
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
  CLASS_CATEGORIES,
  RACE_CATEGORIES,
  CampaignRoom,
  DEFAULT_AVATAR_PRESETS,
  InventoryItem,
} from '../types/rpg';
import { ORIGIN_REGIONS, getRegionById } from '../data/eldriaWorldMap';
import { TransactionAnimationData } from '../types/animation';
import { CoinVisual } from './CoinVisual';
import { SpellCardView } from './SpellCardView';
import { SpellModal } from './SpellModal';
import { CoinTransferModal } from './CoinTransferModal';
import { PlayerInventoryView } from './PlayerInventoryView';
import { AdventureNotesView } from './AdventureNotesView';
import { CharacterCreationModal } from './CharacterCreationModal';
import { ItemRepairModal } from './ItemRepairModal';
import { AlchemyWorkbenchView } from './AlchemyWorkbenchView';
import {
  calculateInventoryWeight,
  getCharacterMaxCarryWeight,
} from '../data/defaultItems';
import { campaignService } from '../services/campaignService';
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
  Scroll,
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
  Hammer,
  Anvil,
  AlertTriangle,
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
  Loader2,
  User,
  ArrowRight,
  Crown,
  Trash2,
  UserPlus,
  FileDown,
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
  onDeleteCharacter?: (characterId: string) => void;
  onCreateCharacter?: (char: CharacterSheet) => void;
  onSelectCharacter?: (characterId: string) => void;
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
  onDeleteCharacter,
  onCreateCharacter,
  onSelectCharacter,
}) => {
  const [activeTab, setActiveTab] = useState<'coins' | 'spells' | 'inventory' | 'alchemy' | 'notes'>('coins');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isSpellModalOpen, setIsSpellModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingSpell, setEditingSpell] = useState<SpellCard | null>(null);
  const [diceRollResult, setDiceRollResult] = useState<{ attr: string; roll: number; total: number } | null>(null);
  const [attackCombatResult, setAttackCombatResult] = useState<{
    weaponName: string;
    attackRoll: number;
    attackTotal: number;
    damageTotal: number;
    isFumble: boolean;
    isCrit: boolean;
    durabilityLost: number;
    remainingDurability: number;
    maxDurability: number;
    message: string;
  } | null>(null);
  const [sheetRepairModalOpen, setSheetRepairModalOpen] = useState(false);
  const [sheetRepairTargetItem, setSheetRepairTargetItem] = useState<InventoryItem | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [isGeneratingAiPortrait, setIsGeneratingAiPortrait] = useState(false);
  const [aiPortraitFeedback, setAiPortraitFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [aiCustomDetails, setAiCustomDetails] = useState('');
  const [recentAiPortraits, setRecentAiPortraits] = useState<string[]>([]);

  // Level-up celebration & inventory capacity updates tracking
  const [levelUpData, setLevelUpData] = useState<{
    oldLevel: number;
    newLevel: number;
    levelsGained: number;
    prevMaxCapacity: number;
    newMaxCapacity: number;
    capacityGain: number;
    hpGain: number;
    manaGain: number;
    attrPointsGain: number;
    timestamp: number;
  } | null>(null);
  const [showLevelUpAlertBanner, setShowLevelUpAlertBanner] = useState<boolean>(false);
  const prevLevelRef = useRef<number>(character.level);
  const isInitialMountRef = useRef<boolean>(true);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevLevelRef.current = character.level;
      return;
    }

    if (character.level > prevLevelRef.current) {
      const oldLevel = prevLevelRef.current;
      const newLevel = character.level;
      const levelsGained = newLevel - oldLevel;

      const prevCap = getCharacterMaxCarryWeight(
        { ...character, level: oldLevel },
        campaign?.levelProgressionConfig?.inventoryCapacityPerLevel
      );
      const newCap = getCharacterMaxCarryWeight(
        character,
        campaign?.levelProgressionConfig?.inventoryCapacityPerLevel
      );

      setLevelUpData({
        oldLevel,
        newLevel,
        levelsGained,
        prevMaxCapacity: prevCap,
        newMaxCapacity: newCap,
        capacityGain: Math.max(0, newCap - prevCap),
        hpGain: levelsGained * 5,
        manaGain: levelsGained * 3,
        attrPointsGain: levelsGained * 3,
        timestamp: Date.now(),
      });
      setShowLevelUpAlertBanner(true);

      // Sound fanfare
      sound.playLevelUp();
      sound.playSuccessFanfare();

      // Confetti celebratory burst
      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#fbbf24', '#f59e0b', '#a855f7', '#6366f1', '#10b981'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 60,
            origin: { x: 0.05, y: 0.6 },
            colors: ['#fbbf24', '#a855f7', '#38bdf8'],
          });
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 60,
            origin: { x: 0.95, y: 0.6 },
            colors: ['#fbbf24', '#a855f7', '#38bdf8'],
          });
        }, 300);
      } catch (err) {
        console.warn('Confetti animation error:', err);
      }

      prevLevelRef.current = newLevel;
    } else if (character.level < prevLevelRef.current) {
      prevLevelRef.current = character.level;
    }
  }, [character.level, campaign?.levelProgressionConfig]);

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
  const AVATAR_PRESETS = DEFAULT_AVATAR_PRESETS;

  const totalNetWorth = calculateTotalNetWorthInBRZ(character.wallet);

  // Capacidade de Carga e Estado de Sobrecarga
  const totalInvWeight = calculateInventoryWeight(character.inventory);
  const charMaxCapacity = getCharacterMaxCarryWeight(
    character,
    campaign?.levelProgressionConfig?.inventoryCapacityPerLevel
  );
  const isCharOverburdened = totalInvWeight > charMaxCapacity;

  // Itens com durabilidade crítica (< 10%)
  const criticalDurabilityCount = useMemo(() => {
    return (character.inventory || []).filter((item) => {
      const dur = item.durability || (item.category === 'arma' ? { current: 20, max: 20 } : undefined);
      return Boolean(dur && dur.max > 0 && (dur.current / dur.max) < 0.10);
    }).length;
  }, [character.inventory]);

  const getHalvedSpeed = (speedStr: string): string => {
    const match = (speedStr || '9m').match(/([0-9.]+)\s*([a-zA-Z]*)/);
    if (!match) return '4.5m';
    const val = parseFloat(match[1]);
    const unit = match[2] || 'm';
    const halved = Math.max(1, Math.round((val / 2) * 10) / 10);
    return `${halved}${unit}`;
  };

  // EXP Progress calculation
  const expNeeded = getExpForNextLevel(
    character.level,
    campaign?.levelProgressionConfig?.xpRequiredPerLevel
  );
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

  // Attack action with weapon wear mechanics
  const handleAttackWithWeapon = (weapon: InventoryItem, isHeavyStrike = false) => {
    sound.playDiceRoll();

    const d20 = Math.floor(Math.random() * 20) + 1;
    const isFumble = d20 === 1;
    const isCrit = d20 === 20;

    const forMod = Math.floor((character.attributes.FOR - 10) / 2);
    const desMod = Math.floor((character.attributes.DES - 10) / 2);
    const profBonus = 3;
    const attackBonus = Math.max(forMod, desMod) + profBonus;
    const attackTotal = d20 + attackBonus;

    let baseDamage = Math.floor(Math.random() * 8) + 1;
    if (isCrit) baseDamage *= 2;
    let damageTotal = Math.max(1, baseDamage + Math.max(forMod, desMod));

    if (isHeavyStrike) {
      damageTotal += 4;
    }

    const curDur = weapon.durability || (weapon.category === 'arma' ? { current: 20, max: 20 } : { current: 15, max: 15 });
    const isCriticalDurability = curDur.max > 0 && (curDur.current / curDur.max) < 0.10;

    if (isCriticalDurability) {
      damageTotal = Math.max(1, damageTotal - 2);
    }

    if (curDur.current <= 0) {
      damageTotal = 1;
    }

    let durabilityLost = 0;
    let wearMessage = '';

    if (curDur.current <= 0) {
      durabilityLost = 0;
      wearMessage = 'A arma já está estilhaçada/quebrada! Requer reparo para funcionar.';
    } else if (isHeavyStrike) {
      durabilityLost = 2;
      wearMessage = 'Golpe Pesado executado! O impacto causou -2 de durabilidade.';
    } else if (isFumble) {
      durabilityLost = 3;
      wearMessage = 'FALHA CRÍTICA (d20: 1)! A lâmina bateu em rocha sólida! -3 de durabilidade!';
    } else if (d20 <= 5) {
      durabilityLost = 1;
      wearMessage = `Impacto forte com armadura (d20: ${d20}) causou -1 de desgaste.`;
    } else {
      durabilityLost = 0;
      wearMessage = 'Golpe limpo e certeiro! O fio da lâmina foi preservado.';
    }

    const newDurability = Math.max(0, curDur.current - durabilityLost);

    const updatedInventory = character.inventory.map((inv) => {
      if (inv.id === weapon.id) {
        return {
          ...inv,
          durability: { current: newDurability, max: curDur.max },
        };
      }
      return inv;
    });

    onUpdateCharacter({
      ...character,
      inventory: updatedInventory,
    });

    setAttackCombatResult({
      weaponName: weapon.name,
      attackRoll: d20,
      attackTotal,
      damageTotal,
      isFumble,
      isCrit,
      durabilityLost,
      remainingDurability: newDurability,
      maxDurability: curDur.max,
      message: wearMessage,
    });

    setTimeout(() => {
      setAttackCombatResult(null);
    }, 6000);
  };

  const handleDirectWear = (weapon: InventoryItem, amount: number) => {
    sound.playDiceRoll();
    const curDur = weapon.durability || (weapon.category === 'arma' ? { current: 20, max: 20 } : { current: 15, max: 15 });
    const newDurability = Math.max(0, curDur.current - amount);

    const updatedInventory = character.inventory.map((inv) => {
      if (inv.id === weapon.id) {
        return {
          ...inv,
          durability: { current: newDurability, max: curDur.max },
        };
      }
      return inv;
    });

    onUpdateCharacter({
      ...character,
      inventory: updatedInventory,
    });

    setAttackCombatResult({
      weaponName: weapon.name,
      attackRoll: 0,
      attackTotal: 0,
      damageTotal: 0,
      isFumble: false,
      isCrit: false,
      durabilityLost: amount,
      remainingDurability: newDurability,
      maxDurability: curDur.max,
      message: `Desgaste de combate aplicado: -${amount} de durabilidade (${newDurability}/${curDur.max}).`,
    });

    setTimeout(() => {
      setAttackCombatResult(null);
    }, 4500);
  };

  const handleGenerateAiPortrait = async () => {
    if (isGeneratingAiPortrait) return;
    setIsGeneratingAiPortrait(true);
    setAiPortraitFeedback(null);
    sound.playDiceRoll();

    const raceName = character.race || 'Humano';
    const className = character.characterClass || 'Guerreiro';
    const genderName = character.gender || '';

    try {
      const res = await campaignService.generateCharacterPortrait({
        race: raceName,
        characterClass: className,
        gender: genderName,
        name: character.name,
        title: character.title,
        originRegion: character.originRegion,
        customDetails: aiCustomDetails.trim(),
      });

      if (res.success && res.imageUrl) {
        sound.playCoinClink('ORO');
        onUpdateCharacter({
          ...character,
          avatarUrl: res.imageUrl,
        });
        setRecentAiPortraits((prev) => [res.imageUrl!, ...prev.filter((u) => u !== res.imageUrl).slice(0, 4)]);
        setAiPortraitFeedback({
          type: 'success',
          message: `Retrato épico conjurado com IA para ${raceName} ${className}!`,
        });
        setTimeout(() => setAiPortraitFeedback(null), 5000);
      } else {
        setAiPortraitFeedback({
          type: 'error',
          message: res.error || 'Não foi possível gerar o retrato no momento.',
        });
      }
    } catch (err: any) {
      setAiPortraitFeedback({
        type: 'error',
        message: err?.message || 'Erro inesperado na geração de retrato.',
      });
    } finally {
      setIsGeneratingAiPortrait(false);
    }
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

  const [quickActionFilter, setQuickActionFilter] = useState<'all' | 'attack' | 'heal' | 'buff' | 'utility'>('all');
  const [quickSpellFeedback, setQuickSpellFeedback] = useState<{
    spellName: string;
    rollTotal?: number;
    formula?: string;
    message: string;
    type: 'success' | 'mana_error';
  } | null>(null);

  const handleCastSpell = (card: SpellCard) => {
    // Extract numerical mana cost if present
    const numericCost = parseInt(card.magicCost) || 0;
    if (numericCost > 0 && character.mana.current < numericCost) {
      sound.playInsufficientBalance();
      setQuickSpellFeedback({
        spellName: card.name,
        message: `Mana insuficiente para ${card.name}! Custo: ${card.magicCost} (Você possui ${character.mana.current} PM)`,
        type: 'mana_error',
      });
      setTimeout(() => setQuickSpellFeedback(null), 4500);
      return;
    }

    // Roll damage or heal if formula exists (e.g. 2d8+3, 1d10, 1d8+2)
    let rollResult: { formula: string; total: number } | null = null;
    const formulaStr = card.damage || '';
    const diceMatch = formulaStr.match(/(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i);
    if (diceMatch) {
      const numDice = parseInt(diceMatch[1], 10);
      const sides = parseInt(diceMatch[2], 10);
      const sign = diceMatch[3];
      const modifier = diceMatch[4] ? parseInt(diceMatch[4], 10) : 0;
      let total = 0;
      for (let i = 0; i < numDice; i++) {
        total += Math.floor(Math.random() * sides) + 1;
      }
      if (sign === '+') total += modifier;
      if (sign === '-') total = Math.max(1, total - modifier);
      rollResult = { formula: diceMatch[0], total };
    }

    const isHeal =
      card.name.toLowerCase().includes('cura') ||
      card.description.toLowerCase().includes('cura') ||
      card.description.toLowerCase().includes('regener') ||
      (card.category || '').toLowerCase().includes('cura');

    if (isHeal) {
      sound.playHealingSpell();
    } else {
      sound.playSpellCast();
    }

    const newMana = {
      ...character.mana,
      current: Math.max(0, character.mana.current - numericCost),
    };

    onUpdateCharacter({
      ...character,
      mana: newMana,
    });

    const msg = rollResult
      ? `Disparou ${card.name}! Rolagem (${rollResult.formula}): ${rollResult.total} de efeito.${numericCost > 0 ? ` (-${numericCost} PM)` : ''}`
      : `Disparou ${card.name}!${numericCost > 0 ? ` (-${numericCost} PM consumidos)` : ' (Truque/Habilidade livre)'}`;

    setQuickSpellFeedback({
      spellName: card.name,
      rollTotal: rollResult?.total,
      formula: rollResult?.formula,
      message: msg,
      type: 'success',
    });
    setTimeout(() => setQuickSpellFeedback(null), 4500);

    // Record chronicle event in campaign
    if (campaignCode) {
      campaignService.recordChronicleEvent(campaignCode, {
        type: 'master_note',
        category: 'geral',
        title: `Ação Rápida: ${card.name}`,
        description: `${character.name} disparou "${card.name}" gastando ${numericCost} PM.${
          rollResult ? ` Rolagem de impacto: ${rollResult.total} (${rollResult.formula}).` : ''
        }`,
        characterName: character.name,
        importance: rollResult && rollResult.total >= 14 ? 'notavel' : 'normal',
        iconEmoji: isHeal ? '✨' : '⚡',
      });
    }
  };

  const handleLoadStarterSpells = () => {
    sound.playRuneChime();
    const cls = (character.characterClass || '').toLowerCase();
    let starterSpells: SpellCard[] = [];

    if (cls.includes('guerreiro') || cls.includes('bárbaro') || cls.includes('paladino')) {
      starterSpells = [
        {
          id: `spell-st-${Date.now()}-1`,
          name: 'Golpe Rúnico Pesado',
          classification: 'Habilidade Marcial',
          type: 'Ataque Físico/Rúnico',
          useLimit: 'Conforme PM',
          effects: '1d10+3 de Dano Contundente/Cortante',
          notes: 'Foco de combate',
          tier: 'Nv 1',
          magicCost: '3 PM',
          category: 'Ataque',
          damage: '1d10+3',
          range: 'Corpo a Corpo',
          description: 'Concentra energia na lâmina ou maça, desferindo um impacto rúnico devastador.',
        },
        {
          id: `spell-st-${Date.now()}-2`,
          name: 'Postura Inabalável',
          classification: 'Tática Defensiva',
          type: 'Defesa / Reação',
          useLimit: 'Conforme PM',
          effects: '+3 CA por 2 rodadas',
          notes: 'Requer escudo ou arma de duas mãos',
          tier: 'Nv 1',
          magicCost: '4 PM',
          category: 'Defesa',
          damage: '+3 CA (2 rodadas)',
          range: 'Pessoal',
          description: 'Firma a base no chão e ergue o escudo, recebendo bônus de Armadura contra investidas.',
        },
        {
          id: `spell-st-${Date.now()}-3`,
          name: 'Fúria de Batalha',
          classification: 'Grito de Guerra',
          type: 'Suporte / Buff',
          useLimit: 'Conforme PM',
          effects: '+2 em todas as rolagens de dano físico',
          notes: 'Dura 3 rodadas',
          tier: 'Truque',
          magicCost: '2 PM',
          category: 'Suporte',
          damage: '+2 Dano Físico',
          range: 'Pessoal',
          description: 'Grito de guerra que acelera o pulso e amplia a contundência dos ataques.',
        },
      ];
    } else if (cls.includes('mago') || cls.includes('arcan') || cls.includes('feiticeir') || cls.includes('bruxo')) {
      starterSpells = [
        {
          id: `spell-st-${Date.now()}-1`,
          name: 'Dardo Místico de Éter',
          classification: 'Evocação Arcana',
          type: 'Ataque Mágico',
          useLimit: 'À vontade',
          effects: '2d4+2 de Dano de Éter Teleguiado',
          notes: 'Não erra alvos visíveis',
          tier: 'Truque',
          magicCost: '3 PM',
          category: 'Ataque',
          damage: '2d4+2',
          range: '30 metros',
          description: 'Dispara três projéteis reluzentes de energia arcana pura que perseguem o alvo.',
        },
        {
          id: `spell-st-${Date.now()}-2`,
          name: 'Raio de Fogo Abissal',
          classification: 'Evocação Elemental',
          type: 'Ataque de Fogo',
          useLimit: 'Conforme PM',
          effects: '2d8+3 de Dano Ígneo',
          notes: 'Chamas violáceas que iluminam a área',
          tier: 'Nv 1',
          magicCost: '6 PM',
          category: 'Ataque',
          damage: '2d8+3',
          range: '24 metros',
          description: 'Conjurador aponta a mão e dispara um feixe crepitante de fogo violáceo.',
        },
        {
          id: `spell-st-${Date.now()}-3`,
          name: 'Escudo Arcano de Força',
          classification: 'Abjuração Protetora',
          type: 'Defesa / Reação',
          useLimit: 'Conforme PM',
          effects: '+4 CA contra ataque iminente',
          notes: 'Ativação instantânea',
          tier: 'Nv 1',
          magicCost: '4 PM',
          category: 'Defesa',
          damage: '+4 CA (Reação)',
          range: 'Pessoal',
          description: 'Uma barreira geométrica luminosa de éter se materializa bloqueando ataques iminentes.',
        },
      ];
    } else if (cls.includes('clérigo') || cls.includes('druida') || cls.includes('bardo')) {
      starterSpells = [
        {
          id: `spell-st-${Date.now()}-1`,
          name: 'Luz Restauradora',
          classification: 'Magia Sagrada / Cura',
          type: 'Restauração de PV',
          useLimit: 'Conforme PM',
          effects: '1d8+3 de Vida Restaurada',
          notes: 'Purifica ferimentos leves',
          tier: 'Nv 1',
          magicCost: '4 PM',
          category: 'Cura',
          damage: '1d8+3',
          range: 'Toque',
          description: 'Onda de calor reconfortante que purifica o corpo e fecha feridas abertas de aliados.',
        },
        {
          id: `spell-st-${Date.now()}-2`,
          name: 'Chama Sagrada de Eldria',
          classification: 'Evocação Radiante',
          type: 'Ataque Sagrado',
          useLimit: 'À vontade',
          effects: '1d8+2 de Dano Radiante',
          notes: 'Ignora armadura física',
          tier: 'Truque',
          magicCost: '2 PM',
          category: 'Ataque',
          damage: '1d8+2',
          range: '18 metros',
          description: 'Luz radiante cai dos céus sobre a criatura inimiga ignorando armaduras de ferro.',
        },
        {
          id: `spell-st-${Date.now()}-3`,
          name: 'Bênção do Guardião',
          classification: 'Encantamento Divino',
          type: 'Suporte de Grupo',
          useLimit: 'Conforme PM',
          effects: '+2 em Ataques & Testes por 1 minuto',
          notes: 'Afeta até 3 aliados próximos',
          tier: 'Nv 1',
          magicCost: '5 PM',
          category: 'Suporte',
          damage: '+2 em Ataques & Testes',
          range: '9 metros',
          description: 'Eleva a moral e a precisão do grupo nos combates mais sombrios de Nexaria.',
        },
      ];
    } else {
      // Ladino, Caçador, etc.
      starterSpells = [
        {
          id: `spell-st-${Date.now()}-1`,
          name: 'Ataque Cirúrgico nas Sombras',
          classification: 'Técnica de Furtividade',
          type: 'Ataque Furtivo',
          useLimit: 'Conforme PM',
          effects: '2d6+3 de Dano Perfurante Crítico',
          notes: 'Vantagem se atacar de surpresa',
          tier: 'Nv 1',
          magicCost: '3 PM',
          category: 'Ataque',
          damage: '2d6+3',
          range: 'Corpo a Corpo',
          description: 'Aproveita brecha na defesa do adversário para cravada mortal em ponto vital.',
        },
        {
          id: `spell-st-${Date.now()}-2`,
          name: 'Bomba de Fumaça & Éter',
          classification: 'Alquimia Tática',
          type: 'Evasão / Utilitário',
          useLimit: 'Conforme PM',
          effects: 'Desengajar Livre & Camuflagem',
          notes: 'Cobre raio de 3m de névoa densa',
          tier: 'Truque',
          magicCost: '2 PM',
          category: 'Utilitário',
          damage: 'Desengajar Livre',
          range: 'Pessoal',
          description: 'Detona cápsula de fumaça cinzenta permitindo recuo tático sem sofrer ataques.',
        },
        {
          id: `spell-st-${Date.now()}-3`,
          name: 'Tiro Perfurante de Precisão',
          classification: 'Técnica de Balística',
          type: 'Ataque à Distância',
          useLimit: 'Conforme PM',
          effects: '1d10+4 de Dano Perfurante',
          notes: 'Ignora metade da cobertura do alvo',
          tier: 'Nv 1',
          magicCost: '4 PM',
          category: 'Ataque',
          damage: '1d10+4',
          range: '40 metros',
          description: 'Respiração controlada e disparo que perfura escudos e carapaças abissais.',
        },
      ];
    }

    onUpdateCharacter({
      ...character,
      abilities: [...character.abilities, ...starterSpells],
    });
    setActionFeedbackToast(`+${starterSpells.length} habilidades temáticas de ${character.characterClass || 'classe'} carregadas!`);
    setTimeout(() => setActionFeedbackToast(null), 4000);
  };

  const handleQuickDrinkPotion = (potionItem: InventoryItem) => {
    sound.playPotionDrink();
    const itemName = potionItem.name.toLowerCase();
    let healAmount = 8;
    const isManaPotion = itemName.includes('mana') || itemName.includes('éter');

    if (itemName.includes('maior')) healAmount = 18;
    else if (itemName.includes('menor')) healAmount = 6;
    else healAmount = 10;

    const updatedInventory = character.inventory.map((item) => {
      if (item.id === potionItem.id) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    }).filter((item) => item.quantity > 0);

    let updatedVitals = {};
    let msg = '';
    if (isManaPotion) {
      const newMana = Math.min(character.mana.max, character.mana.current + healAmount);
      updatedVitals = { mana: { ...character.mana, current: newMana } };
      msg = `Bebeu ${potionItem.name}: +${newMana - character.mana.current} PM restaurados!`;
    } else {
      const newHp = Math.min(character.hp.max, character.hp.current + healAmount);
      updatedVitals = { hp: { ...character.hp, current: newHp } };
      msg = `Bebeu ${potionItem.name}: +${newHp - character.hp.current} PV restaurados!`;
    }

    onUpdateCharacter({
      ...character,
      ...updatedVitals,
      inventory: updatedInventory,
    });

    setActionFeedbackToast(msg);
    setTimeout(() => setActionFeedbackToast(null), 4000);

    if (campaignCode) {
      campaignService.recordChronicleEvent(campaignCode, {
        type: 'master_note',
        category: 'geral',
        title: `Consumo de Poção: ${potionItem.name}`,
        description: `${character.name} bebeu ${potionItem.name} em combate, recuperando pontos de vitais.`,
        characterName: character.name,
        importance: 'normal',
        iconEmoji: '🧪',
      });
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

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  /**
   * Generates and downloads a clean, printable simplified PDF version of the character sheet.
   */
  const handleExportPdf = () => {
    try {
      sound.playRuneChime();
      setIsExportingPdf(true);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Page dimensions
      const margin = 14;
      const pageWidth = 210;
      const pageHeight = 297;
      const contentWidth = pageWidth - margin * 2;

      // Header Banner (Dark Arcane Purple #140b24)
      doc.setFillColor(20, 11, 36);
      doc.rect(0, 0, pageWidth, 36, 'F');

      // Golden border line
      doc.setDrawColor(245, 158, 11); // Amber
      doc.setLineWidth(0.8);
      doc.line(0, 36, pageWidth, 36);

      // Character Name & Title
      doc.setTextColor(245, 158, 11);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(character.name.toUpperCase(), margin, 13);

      doc.setTextColor(226, 232, 240);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(character.title || 'Aventureiro de Nexaria', margin, 19);

      // Right Header Badge: Level, Class, Race, Region
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(245, 158, 11);
      doc.text(`NÍVEL ${character.level}`, pageWidth - margin, 13, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(203, 213, 225);
      doc.text(`${character.characterClass} • ${character.race} (${character.gender || 'Gênero livre'})`, pageWidth - margin, 19, { align: 'right' });

      const regName = getRegionById(character.originRegion || '')?.name || character.originRegion || 'Caeldrin';
      doc.text(`Origem: ${regName} | Idioma: ${character.primaryLanguage || 'Caeldrico'}`, pageWidth - margin, 25, { align: 'right' });
      doc.text(`Mesa: ${campaignCode} | Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 31, { align: 'right' });

      let y = 43;

      // SECTION 1: VITALS (PV, PM, Estamina, CA, Deslocamento, Iniciativa)
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, 'FD');

      const vitals = [
        { label: 'PONTOS DE VIDA', value: `${character.hp.current} / ${character.hp.max}` },
        { label: 'PONTOS DE MANA', value: `${character.mana.current} / ${character.mana.max}` },
        { label: 'ESTAMINA', value: `${character.stamina.current} / ${character.stamina.max}` },
        { label: 'CLASSE ARMADURA', value: `${character.armorClass} CA` },
        { label: 'DESLOCAMENTO', value: `${character.speed}` },
        { label: 'INICIATIVA', value: `+${character.initiative}` },
      ];

      const colW = contentWidth / vitals.length;
      vitals.forEach((v, idx) => {
        const vx = margin + idx * colW + colW / 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(100, 116, 139);
        doc.text(v.label, vx, y + 6, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(v.value, vx, y + 14, { align: 'center' });
      });

      y += 26;

      // SECTION 2: ATRIBUTOS PRINCIPAIS (FOR, DES, CON, INT, SAB, CAR)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('ATRIBUTOS PRINCIPAIS', margin, y);
      y += 3.5;

      const attrs = [
        { key: 'FOR', name: 'Força', val: character.attributes.FOR },
        { key: 'DES', name: 'Destreza', val: character.attributes.DES },
        { key: 'CON', name: 'Constituição', val: character.attributes.CON },
        { key: 'INT', name: 'Inteligência', val: character.attributes.INT },
        { key: 'SAB', name: 'Sabedoria', val: character.attributes.SAB },
        { key: 'CAR', name: 'Carisma', val: character.attributes.CAR },
      ];

      const attrColW = contentWidth / attrs.length;
      attrs.forEach((a, idx) => {
        const ax = margin + idx * attrColW;
        const mod = Math.floor((a.val - 10) / 2);
        const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.roundedRect(ax + 1, y, attrColW - 2, 19, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`${a.key} (${a.name})`, ax + attrColW / 2, y + 5, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(String(a.val), ax + attrColW / 2, y + 12, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Mod: ${modStr}`, ax + attrColW / 2, y + 17, { align: 'center' });
      });

      y += 24;

      // SECTION 3: PERÍCIAS TREINADAS & TRAÇOS DE CLASSE (2 Columns)
      const col2W = (contentWidth - 6) / 2;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text('PERÍCIAS TREINADAS', margin, y);
      doc.text('ESPECIALIZAÇÕES & TRAÇOS', margin + col2W + 6, y);
      y += 3.5;

      const skillsText = (character.skillsList || []).join(' • ') || 'Nenhuma perícia selecionada';
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, col2W, 16, 1.5, 1.5, 'FD');
      doc.roundedRect(margin + col2W + 6, y, col2W, 16, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const splitSkills = doc.splitTextToSize(skillsText, col2W - 4);
      doc.text(splitSkills, margin + 2.5, y + 4.5);

      const traitsText = (character.traits || []).map(t => `${t.label}: ${t.value}`).join(' | ') || 'Padrão';
      const splitTraits = doc.splitTextToSize(traitsText, col2W - 4);
      doc.text(splitTraits, margin + col2W + 8.5, y + 4.5);

      y += 21;

      // SECTION 4: ARSENAL DE COMBATE (Armas equipadas e durabilidade)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text('ARSENAL DE COMBATE & ARMAS', margin, y);
      y += 3.5;

      const weapons = character.inventory.filter(i => i.equipped || i.category === 'arma');
      if (weapons.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhuma arma empunhada (Golpe desarmado básico: 1d4 + FOR)', margin, y + 3.5);
        y += 7;
      } else {
        weapons.slice(0, 3).forEach(w => {
          const dur = w.durability ? ` | Durabilidade: ${w.durability.current}/${w.durability.max}` : '';
          const wLine = `• ${w.name}: ${w.effectText || w.description || 'Arma'}${dur}`;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
          const splitW = doc.splitTextToSize(wLine, contentWidth);
          doc.text(splitW, margin, y + 3.5);
          y += splitW.length * 4;
        });
      }

      y += 3;

      // SECTION 5: MAGIAS & HABILIDADES ESPECIAIS
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`MAGIAS & HABILIDADES (${character.abilities.length})`, margin, y);
      y += 3.5;

      if (character.abilities.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhuma habilidade cadastrada.', margin, y + 3.5);
        y += 7;
      } else {
        character.abilities.slice(0, 4).forEach(sp => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
          const spHead = `✦ ${sp.name} [${sp.magicCost || 'Livre'}] — ${sp.classification || sp.type}`;
          doc.text(spHead, margin, y + 3.5);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(71, 85, 105);
          const descText = sp.effects ? `${sp.effects} • ${sp.description}` : sp.description;
          const splitSp = doc.splitTextToSize(descText, contentWidth - 4);
          doc.text(splitSp, margin + 4, y + 7.5);
          y += 8 + splitSp.length * 3.5;
        });
      }

      y += 2;

      // SECTION 6: INVENTÁRIO & BOLSA DE MOEDAS
      const totalBrz = calculateTotalNetWorthInBRZ(character.wallet);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`BOLSA DE MOEDAS & RECURSOS (Total: ${totalBrz.toLocaleString('pt-BR')} BRZ)`, margin, y);
      y += 3.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(
        `Bronze (BRZ): ${character.wallet.BRZ} | Prata (PRT): ${character.wallet.PRT} | Ouro (ORO): ${character.wallet.ORO} | Platina (PLN): ${character.wallet.PLN} | Cyber (CYB): ${character.wallet.CYB}`,
        margin,
        y + 3.5
      );
      y += 8;

      // Mochila de Itens
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`INVENTÁRIO (${character.inventory.length} itens)`, margin, y);
      y += 3.5;

      const invSummary = character.inventory.map(i => `${i.name} (x${i.quantity})`).join(', ') || 'Mochila vazia';
      const splitInv = doc.splitTextToSize(invSummary, contentWidth);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(splitInv, margin, y + 3.5);
      y += Math.max(8, splitInv.length * 4);

      // SECTION 7: ANTECEDENTES & NOTAS
      if (character.notes || (character.adventureNotes && character.adventureNotes.length > 0)) {
        if (y > 230) {
          doc.addPage();
          y = 16;
        }

        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text('ANTECEDENTES & NOTAS DE CAMPANHA', margin, y);
        y += 3.5;

        const notesText = character.notes || character.adventureNotes?.map(n => `[${n.category.toUpperCase()}] ${n.title}: ${n.content}`).join('\n\n') || '';
        const splitNotes = doc.splitTextToSize(notesText.slice(0, 800), contentWidth);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(splitNotes, margin, y + 3.5);
      }

      // Footer
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.4);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Nexaria RPG — Ficha Oficial de Personagem • Gerado em ${new Date().toLocaleString('pt-BR')}`,
          margin,
          pageHeight - 7
        );
        doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
      }

      const safeName = (character.name || 'personagem').trim().replace(/[^a-zA-Z0-9_\u00C0-\u00FF]/g, '_');
      doc.save(`${safeName}_Ficha_Nexaria.pdf`);
      setActionFeedbackToast('Ficha em PDF gerada e baixada com sucesso!');
      setTimeout(() => setActionFeedbackToast(null), 4000);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setActionFeedbackToast('Erro ao exportar PDF da ficha.');
      setTimeout(() => setActionFeedbackToast(null), 4000);
    } finally {
      setIsExportingPdf(false);
    }
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

        {/* Attack & Weapon Wear Toast */}
        {attackCombatResult && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs border animate-in slide-in-from-top-2 duration-300 ${
            attackCombatResult.isFumble
              ? 'bg-red-950/95 border-red-500 text-red-200 ring-2 ring-red-500/50'
              : attackCombatResult.durabilityLost > 0
              ? 'bg-amber-950/95 border-amber-500 text-amber-200'
              : 'bg-zinc-900/95 border-emerald-500 text-emerald-200'
          }`}>
            <Swords className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              {attackCombatResult.attackRoll > 0 && (
                <div className="font-cinzel font-bold text-sm">
                  {attackCombatResult.weaponName}: Acerto{' '}
                  <span className="font-mono text-amber-400 text-base">{attackCombatResult.attackTotal}</span>{' '}
                  (d20: {attackCombatResult.attackRoll}) • Dano:{' '}
                  <span className="font-mono text-red-400 text-base font-extrabold">{attackCombatResult.damageTotal}</span>
                </div>
              )}
              <div className="text-[11px] text-zinc-300 mt-0.5 font-sans">
                {attackCombatResult.message}{' '}
                {attackCombatResult.durabilityLost > 0 && (
                  <span className="font-mono font-bold text-red-400">
                    [-{attackCombatResult.durabilityLost} Durabilidade: {attackCombatResult.remainingDurability}/{attackCombatResult.maxDurability}]
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* BARRA DE GESTÃO DA FICHA: Alternar, + Criar Nova Ficha, Excluir Ficha */}
        {/* ============================================================ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-3 mb-4 border-b border-zinc-800/80 bg-zinc-950/60 p-3 rounded-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-cinzel font-bold text-amber-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Ficha:</span>
            </span>

            <select
              value={character.id}
              onChange={(e) => {
                if (e.target.value === 'create_new') {
                  setIsCreateModalOpen(true);
                } else if (onSelectCharacter) {
                  onSelectCharacter(e.target.value);
                }
              }}
              className="bg-zinc-900 border border-zinc-700/80 hover:border-amber-500/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 font-medium focus:outline-none focus:border-amber-400 cursor-pointer max-w-[220px] sm:max-w-[280px] truncate"
              title="Trocar de Ficha ou Criar Nova Ficha"
            >
              <optgroup label="Fichas da Mesa" className="bg-zinc-900 text-amber-300">
                <option value={character.id} className="bg-zinc-950 text-zinc-100">
                  ⚔️ {character.name} ({character.characterClass} Nv {character.level})
                </option>
                {otherPlayers.map((p) => (
                  <option key={p.id} value={p.id} className="bg-zinc-950 text-zinc-200">
                    ⚔️ {p.name} ({p.characterClass} Nv {p.level})
                  </option>
                ))}
              </optgroup>
              <option value="create_new" className="bg-purple-950 text-amber-300 font-bold">
                + Forjar Nova Ficha...
              </option>
            </select>
          </div>

          <div className="flex items-center gap-2 justify-end flex-wrap">
            {/* Botão Baixar Ficha em PDF Simplificado */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-500/60 text-zinc-200 hover:text-amber-300 text-xs font-cinzel font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Baixar versão em formato PDF simplificado da sua ficha de personagem atual"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isExportingPdf ? 'Gerando PDF...' : 'Baixar PDF'}</span>
            </button>

            {/* Botão + Criar Ficha diretamente na Ficha */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 text-xs font-cinzel font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Criar uma nova ficha de personagem diretamente na aba Ficha"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-950" />
              <span>Nova Ficha</span>
            </button>

            {/* Botão Excluir Ficha */}
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 hover:border-rose-600 text-rose-300 hover:text-rose-100 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Excluir permanentemente esta ficha de personagem"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Excluir Ficha</span>
            </button>
          </div>
        </div>

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

            {/* Badges de Classe, Raça, Sexo, Região e Idioma */}
            <div className="flex flex-wrap items-center justify-start sm:justify-center gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-full bg-zinc-850 border border-zinc-700/60 text-zinc-200 text-[10px] font-medium flex items-center gap-1">
                <Swords className="w-2.5 h-2.5 text-amber-400" />
                {character.characterClass || 'Guerreiro Rúnico'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-zinc-850 border border-zinc-700/60 text-zinc-300 text-[10px] font-medium">
                {character.race || 'Humano'}
              </span>
              {character.gender && (
                <span
                  className="px-2 py-0.5 rounded-full bg-zinc-850 border border-zinc-700/60 text-zinc-300 text-[10px] font-medium flex items-center gap-1"
                  title="Sexo / Gênero"
                >
                  <User className="w-2.5 h-2.5 text-amber-400" />
                  <span>{character.gender}</span>
                </span>
              )}
              {character.fightingStyle && (
                <span
                  className="px-2 py-0.5 rounded-full bg-red-950/60 border border-red-800/60 text-red-200 text-[10px] font-medium flex items-center gap-1"
                  title={character.fightingStyleDesc ? `Estilo de Luta: ${character.fightingStyle} — ${character.fightingStyleDesc}` : `Estilo de Luta: ${character.fightingStyle}`}
                >
                  <Swords className="w-2.5 h-2.5 text-red-400" />
                  <span>{character.fightingStyle}</span>
                </span>
              )}
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

        {/* Stylized Level-Up Notification Banner (Triggered when GM awards XP reaching next level) */}
        {showLevelUpAlertBanner && (
          <div className="mb-4 p-4 rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-950/90 via-[#1e0e38] to-amber-950/90 shadow-2xl shadow-amber-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-zinc-100 animate-pulse-slow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-zinc-950 shadow-md shrink-0 font-bold">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                    <span>⚔️ PROGRESSÃO DE NÍVEL RECONHECIDA: NÍVEL {character.level} ATINGIDO!</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950 font-cinzel font-extrabold text-[9px] shadow">
                    LEVEL UP
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 mt-0.5 font-sans">
                  O Mestre concedeu XP suficiente! A capacidade de carga da mochila foi recalculada e ampliada para <strong>{charMaxCapacity} kg</strong> (~{Math.round(charMaxCapacity / 2)} slots).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => {
                  sound.playSuccessFanfare();
                  setActiveTab('inventory');
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-200 text-xs font-cinzel font-bold flex items-center gap-1.5 transition"
              >
                <Backpack className="w-3.5 h-3.5 text-amber-400" />
                <span>Ver Mochila Atualizada</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLevelUpAlertBanner(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
                title="Fechar notificação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
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
                  {CLASS_CATEGORIES.map((category) => (
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
                  {RACE_CATEGORIES.map((category) => (
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
              <div>
                <label className="text-zinc-400 block mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-amber-400" /> Sexo / Gênero
                </label>
                <select
                  value={character.gender || 'Masculino'}
                  onChange={(e) => onUpdateCharacter({ ...character, gender: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-600"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Não-Binário">Não-Binário</option>
                  <option value="Andrógino">Andrógino</option>
                  <option value="Agênero / Inorgânico">Agênero / Inorgânico</option>
                  <option value="Outro">Outro</option>
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

            {/* AI Portrait Generator Section */}
            <div className="p-3.5 rounded-lg bg-gradient-to-r from-purple-950/40 via-zinc-950 to-amber-950/30 border border-purple-800/40 shadow-inner space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-purple-900/60 border border-purple-600/50 flex items-center justify-center text-amber-300">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-cinzel font-bold text-xs text-amber-200">
                      Gerador de Retrato com IA
                    </span>
                    <p className="text-[10px] text-zinc-400">
                      Ilustração épica baseada no sexo <strong>{character.gender || 'Masculino'}</strong>, raça <strong>{character.race || 'Humano'}</strong> e classe <strong>{character.characterClass || 'Classe'}</strong>
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 self-start sm:self-auto px-2 py-0.5 rounded-full bg-purple-900/50 border border-purple-700/50 text-[10px] text-purple-200 font-mono">
                  ✦ {character.gender ? `${character.gender} • ` : ''}{character.race || 'Humano'} • {character.characterClass || 'Guerreiro'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Detalhes opcionais (ex: elmo rúnico, olhos de fogo azul, manto esfarrapado...)"
                  value={aiCustomDetails}
                  onChange={(e) => setAiCustomDetails(e.target.value)}
                  className="flex-1 bg-zinc-950/90 border border-purple-900/40 rounded-md px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleGenerateAiPortrait}
                  disabled={isGeneratingAiPortrait}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-cinzel font-bold flex items-center justify-center gap-1.5 transition shadow-sm whitespace-nowrap ${
                    isGeneratingAiPortrait
                      ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50 cursor-wait'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 hover:shadow-amber-900/30'
                  }`}
                >
                  {isGeneratingAiPortrait ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Conjurando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                      <span>Gerar Retrato com IA</span>
                    </>
                  )}
                </button>
              </div>

              {aiPortraitFeedback && (
                <div
                  className={`p-2 rounded-md text-[11px] flex items-center gap-1.5 ${
                    aiPortraitFeedback.type === 'success'
                      ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                      : 'bg-red-950/60 border border-red-800 text-red-300'
                  }`}
                >
                  {aiPortraitFeedback.type === 'success' ? (
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Info className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{aiPortraitFeedback.message}</span>
                </div>
              )}

              {recentAiPortraits.length > 0 && (
                <div className="pt-1.5 border-t border-purple-900/30">
                  <span className="text-[10px] text-zinc-400 block mb-1">
                    Retratos gerados nesta sessão (clique para alternar):
                  </span>
                  <div className="flex items-center gap-1.5">
                    {recentAiPortraits.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt="Recent generation"
                        onClick={() => onUpdateCharacter({ ...character, avatarUrl: url })}
                        className={`w-8 h-8 rounded-md object-cover cursor-pointer border transition ${
                          character.avatarUrl === url
                            ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                            : 'border-zinc-800 opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

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

              {/* AI Portrait Quick Generation Action on Portrait */}
              <div className="absolute bottom-2 inset-x-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    if (!isEditingProfile) {
                      setIsEditingProfile(true);
                    }
                    handleGenerateAiPortrait();
                  }}
                  disabled={isGeneratingAiPortrait}
                  title={`Gerar novo retrato com IA baseado em ${character.race || 'Humano'} ${character.characterClass || 'Guerreiro'}`}
                  className="px-3 py-1.5 rounded-lg bg-zinc-950/85 hover:bg-zinc-900 border border-purple-600/60 hover:border-amber-400 text-amber-200 text-xs font-cinzel font-semibold flex items-center gap-1.5 shadow-xl backdrop-blur-md transition-all hover:scale-105"
                >
                  {isGeneratingAiPortrait ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span className="text-amber-300">Conjurando Retrato...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Gerar Retrato IA</span>
                    </>
                  )}
                </button>
              </div>

              {/* Generation in progress overlay */}
              {isGeneratingAiPortrait && (
                <div className="absolute inset-0 bg-purple-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10 animate-pulse">
                  <Sparkles className="w-8 h-8 text-amber-400 animate-spin mb-2" />
                  <span className="text-xs font-cinzel font-bold text-amber-200">
                    Conjurando Ilustração IA
                  </span>
                  <span className="text-[10px] text-purple-200 mt-1">
                    {character.race || 'Humano'} • {character.characterClass || 'Guerreiro'}
                  </span>
                </div>
              )}
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
              <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                DESLOCAMENTO
                {isCharOverburdened && (
                  <span className="text-red-400 font-bold" title="Sobrecarga Ativa: Deslocamento reduzido à metade!">
                    ⚠️
                  </span>
                )}
              </span>
              <span className="text-base font-mono font-semibold text-zinc-200">
                {isCharOverburdened ? (
                  <span className="text-red-400 font-bold" title={`Sobrecarga: ${character.speed} reduzido para ${getHalvedSpeed(character.speed)}`}>
                    {getHalvedSpeed(character.speed)}
                  </span>
                ) : (
                  character.speed
                )}
              </span>
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
        {/* SEÇÃO DE AÇÕES RÁPIDAS & DISPARO INSTANTÂNEO DE MAGIAS/HABILIDADES */}
        {/* ============================================================ */}
        <div className="rounded-xl border border-purple-800/60 bg-gradient-to-br from-purple-950/40 via-zinc-950/80 to-indigo-950/30 p-3.5 mb-5 shadow-lg shadow-purple-950/20 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-purple-900/50 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 border border-purple-400/60 flex items-center justify-center text-amber-300 shadow-md shadow-purple-950/60">
                <Wand2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-cinzel font-bold text-zinc-100 flex items-center gap-1.5">
                    <span>Ações Rápidas &amp; Disparo Instantâneo</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-900/70 text-purple-200 font-mono text-[9px] border border-purple-700/60">
                      Sem Trocar de Aba
                    </span>
                  </h3>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Dispare feitiços, habilidades marciais e consuma elixires com 1 clique direto no calor do combate.
                </p>
              </div>
            </div>

            {/* Mana Gauge & Quick Starter Button */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Mana Gauge Indicator */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-950/70 border border-blue-800/60 text-blue-200 text-xs font-mono shadow-sm">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-bold">{character.mana.current}</span>
                <span className="text-blue-400/80">/ {character.mana.max} PM</span>
                <div className="w-12 h-1.5 bg-blue-950 rounded-full overflow-hidden border border-blue-700/60 ml-1">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, (character.mana.current / (character.mana.max || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {character.abilities.length === 0 ? (
                <button
                  type="button"
                  onClick={handleLoadStarterSpells}
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 text-[11px] font-cinzel font-bold flex items-center gap-1 transition shadow active:scale-95"
                  title="Carregar 3 magias/habilidades temáticas de classe para disparo rápido"
                >
                  <Sparkles className="w-3 h-3 text-zinc-950" />
                  <span>Carregar Habilidades ({character.characterClass || 'Classe'})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSpell(null);
                    setIsSpellModalOpen(true);
                  }}
                  className="px-2 py-1 rounded-lg bg-purple-900/60 hover:bg-purple-800/70 border border-purple-700/60 text-purple-200 text-[11px] font-cinzel font-semibold flex items-center gap-1 transition"
                  title="Adicionar nova habilidade à ficha"
                >
                  <Plus className="w-3 h-3 text-purple-300" />
                  <span className="hidden sm:inline">Nova</span> Habilidade
                </button>
              )}
            </div>
          </div>

          {/* Quick Spell Feedback Toast / Banner */}
          {quickSpellFeedback && (
            <div
              className={`p-2.5 rounded-lg mb-3 flex items-center justify-between gap-2 text-xs transition animate-fade-in ${
                quickSpellFeedback.type === 'mana_error'
                  ? 'bg-red-950/80 border border-red-700 text-red-200 shadow-md shadow-red-950/40'
                  : 'bg-emerald-950/80 border border-emerald-600 text-emerald-200 shadow-md shadow-emerald-950/40'
              }`}
            >
              <div className="flex items-center gap-2">
                {quickSpellFeedback.type === 'mana_error' ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold mr-1">{quickSpellFeedback.spellName}:</span>
                  <span>{quickSpellFeedback.message}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickSpellFeedback(null)}
                className="p-1 text-zinc-400 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Filters & Tabs for Quick Actions */}
          <div className="flex items-center justify-between pb-2 mb-2.5 flex-wrap gap-2 text-[11px]">
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: 'all', label: 'Todas as Ações', icon: Wand2 },
                { id: 'attack', label: 'Ataque & Dano', icon: Swords },
                { id: 'heal', label: 'Cura & Regeneração', icon: HeartPulse },
                { id: 'buff', label: 'Defesa & Buffs', icon: Shield },
                { id: 'utility', label: 'Poções de Bolso', icon: FlaskConical },
              ].map((f) => {
                const Icon = f.icon;
                const isActive = quickActionFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setQuickActionFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition font-medium ${
                      isActive
                        ? 'bg-purple-600 text-white font-semibold shadow-sm'
                        : 'bg-zinc-950/60 hover:bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            <span className="text-[10px] text-zinc-400 font-mono">
              {character.abilities.length} habilidade(s) registrada(s)
            </span>
          </div>

          {/* Quick Actions Grid */}
          {(() => {
            // Filter abilities
            const filteredSpells = character.abilities.filter((card) => {
              if (quickActionFilter === 'all') return true;
              const text = `${card.name} ${card.classification} ${card.type} ${card.effects} ${card.description} ${card.category || ''}`.toLowerCase();
              if (quickActionFilter === 'attack') {
                return text.includes('ataque') || text.includes('dano') || text.includes('dardo') || text.includes('raio') || text.includes('golpe') || text.includes('fogo');
              }
              if (quickActionFilter === 'heal') {
                return text.includes('cura') || text.includes('regener') || text.includes('vida') || text.includes('restaur');
              }
              if (quickActionFilter === 'buff') {
                return text.includes('defesa') || text.includes('ca') || text.includes('escudo') || text.includes('bênção') || text.includes('fúria') || text.includes('suporte');
              }
              if (quickActionFilter === 'utility') {
                return false; // Potions rendered separately below
              }
              return true;
            });

            // Quick Potions from Inventory
            const availablePotions = character.inventory.filter(
              (item) =>
                item.category === 'pocao' ||
                item.name.toLowerCase().includes('poção') ||
                item.name.toLowerCase().includes('pocao') ||
                item.name.toLowerCase().includes('elixir') ||
                item.name.toLowerCase().includes('éter')
            );

            const showPotionsOnly = quickActionFilter === 'utility';

            if (showPotionsOnly) {
              if (availablePotions.length === 0) {
                return (
                  <div className="p-4 rounded-lg border border-dashed border-purple-900/40 bg-zinc-950/40 text-center text-xs text-zinc-400 space-y-1">
                    <FlaskConical className="w-5 h-5 mx-auto text-zinc-500 mb-1" />
                    <p>Nenhuma poção ou elixir encontrado na mochila.</p>
                    <p className="text-[10px] text-zinc-500">
                      Você pode forjar poções na aba "Alquimia &amp; Forja" ou comprá-las com o Mestre.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {availablePotions.map((potion) => {
                    const isMana = potion.name.toLowerCase().includes('mana') || potion.name.toLowerCase().includes('éter');
                    return (
                      <div
                        key={potion.id}
                        className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/80 flex items-center justify-between gap-2 transition hover:border-zinc-700"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{potion.iconEmoji || '🧪'}</span>
                          <div>
                            <span className="font-cinzel font-bold text-xs text-zinc-100 block">
                              {potion.name}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              Quantidade: <strong className="text-amber-300">{potion.quantity}x</strong>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleQuickDrinkPotion(potion)}
                          className={`px-3 py-1.5 rounded-md text-xs font-cinzel font-bold flex items-center gap-1 transition shadow-sm active:scale-95 ${
                            isMana
                              ? 'bg-blue-600 hover:bg-blue-500 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          <FlaskConical className="w-3 h-3" />
                          <span>Beber</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            }

            if (filteredSpells.length === 0 && character.abilities.length === 0) {
              return (
                <div className="p-4 rounded-lg border border-dashed border-purple-900/60 bg-purple-950/20 text-center space-y-2">
                  <Wand2 className="w-6 h-6 mx-auto text-purple-400 mb-1" />
                  <p className="text-xs text-zinc-300 font-cinzel font-semibold">
                    Nenhuma habilidade ou magia rápida configurada nesta ficha.
                  </p>
                  <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
                    Carregue um conjunto pronto de 3 magias recomendadas para {character.characterClass || 'sua classe'} ou adicione habilidades personalizadas.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleLoadStarterSpells}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 text-xs font-cinzel font-bold flex items-center gap-1.5 transition shadow"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                      <span>Carregar Habilidades de {character.characterClass || 'Classe'}</span>
                    </button>
                  </div>
                </div>
              );
            }

            if (filteredSpells.length === 0) {
              return (
                <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/40 text-center text-xs text-zinc-400">
                  Nenhuma habilidade encontrada para o filtro selecionado. Experimente alternar para "Todas as Ações".
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {filteredSpells.map((card) => {
                  const numericCost = parseInt(card.magicCost) || 0;
                  const canAfford = numericCost === 0 || character.mana.current >= numericCost;
                  const isHeal =
                    card.name.toLowerCase().includes('cura') ||
                    card.description.toLowerCase().includes('cura') ||
                    card.description.toLowerCase().includes('regener') ||
                    (card.category || '').toLowerCase().includes('cura');

                  return (
                    <div
                      key={card.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition relative overflow-hidden group ${
                        !canAfford
                          ? 'border-zinc-800/80 bg-zinc-950/60 opacity-80'
                          : isHeal
                          ? 'border-emerald-800/60 bg-gradient-to-br from-emerald-950/30 to-zinc-950 hover:border-emerald-600/70'
                          : 'border-purple-800/60 bg-gradient-to-br from-purple-950/30 to-zinc-950 hover:border-purple-600/70 shadow-sm'
                      }`}
                    >
                      {/* Top: Name, Type & Cost */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{card.iconEmoji || (isHeal ? '✨' : '⚡')}</span>
                          <div>
                            <span className="font-cinzel font-bold text-xs text-zinc-100 group-hover:text-amber-300 transition block">
                              {card.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-sans block line-clamp-1">
                              {card.classification || card.type}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              numericCost === 0
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                : canAfford
                                ? 'bg-blue-950/80 text-cyan-300 border-blue-700'
                                : 'bg-red-950/80 text-red-300 border-red-800'
                            }`}
                          >
                            {card.magicCost || 'Livre'}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Effects & Range */}
                      <div className="text-[10px] text-zinc-300 bg-zinc-900/70 p-1.5 rounded border border-zinc-800/80 space-y-0.5">
                        {card.effects && (
                          <div className="flex items-center gap-1 font-mono text-amber-300">
                            <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="font-semibold line-clamp-1">{card.effects}</span>
                          </div>
                        )}
                        {card.range && (
                          <div className="text-zinc-400 text-[9.5px]">
                            Alcance: <strong>{card.range}</strong>
                          </div>
                        )}
                        <p className="text-zinc-400 text-[10px] line-clamp-2 italic font-sans">
                          "{card.description}"
                        </p>
                      </div>

                      {/* Bottom Trigger Action */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
                        <button
                          type="button"
                          onClick={() => handleCastSpell(card)}
                          className={`w-full py-1.5 px-3 rounded-lg text-xs font-cinzel font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm ${
                            !canAfford
                              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 cursor-not-allowed'
                              : isHeal
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/40'
                          }`}
                        >
                          {isHeal ? (
                            <HeartPulse className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                          )}
                          <span>{canAfford ? 'Disparar Ação' : 'Mana Insuficiente'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* ============================================================ */}
        {/* SEÇÃO DE COMBATE & ARMAS EM USO: DESGASTE & ATAQUES (RPG) */}
        {/* ============================================================ */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 mb-5 shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                <Swords className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-cinzel font-bold text-zinc-100 flex items-center gap-1.5">
                  <span>Arsenal de Combate &amp; Desgaste das Armas</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 font-mono border border-amber-800/40">
                    Durabilidade Ativa
                  </span>
                </h3>
                <p className="text-[10px] text-zinc-400">
                  Desfira ataques com armas empunhadas, aplique golpes pesados ou registre o desgaste em batalha.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('alchemy')}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/40 text-emerald-300 text-[11px] font-cinzel font-semibold flex items-center gap-1 transition"
                title="Ir para a Bancada de Alquimia e Forja"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Oficina de</span> Alquimia &amp; Forja
              </button>
            </div>
          </div>

          {/* List of Equipped Weapons or Fallback */}
          {(() => {
            const equippedWeapons = character.inventory.filter(
              (item) => item.equipped && (item.category === 'arma' || item.durability)
            );

            if (equippedWeapons.length === 0) {
              return (
                <div className="p-3 rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 text-center flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Shield className="w-4 h-4 text-zinc-500" />
                    <span>Nenhuma arma equipada no momento. Golpe desarmado básico: <strong>1d4 + FOR</strong>.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('inventory')}
                    className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-cinzel font-bold transition flex items-center gap-1"
                  >
                    <Backpack className="w-3 h-3" /> Equipar Arma na Mochila
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {equippedWeapons.map((weapon) => {
                  const dur = weapon.durability || { current: 20, max: 20 };
                  const durPct = Math.round((dur.current / dur.max) * 100);
                  const isCritical = dur.max > 0 && (dur.current / dur.max) < 0.10;
                  const isBroken = dur.current <= 0;

                  return (
                    <div
                      key={weapon.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition relative overflow-hidden ${
                        isCritical
                          ? 'border-red-500/80 bg-red-950/30 ring-1 ring-red-500/50'
                          : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{weapon.iconEmoji || '⚔️'}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-cinzel font-bold text-xs text-zinc-100">
                                {weapon.name}
                              </span>
                              {isBroken && (
                                <span className="px-1.5 py-0.2 rounded bg-red-600 text-white font-mono text-[9px] font-bold animate-pulse">
                                  QUEBRADA
                                </span>
                              )}
                              {isCritical && !isBroken && (
                                <span className="px-1.5 py-0.2 rounded bg-red-950 border border-red-500 text-red-300 font-mono text-[9px] font-bold animate-pulse">
                                  &lt; 10%
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-400 font-sans block line-clamp-1">
                              {weapon.effectText || '1d8 Dano Cortante'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-xs font-mono font-bold ${
                            isCritical ? 'text-red-400 animate-pulse' : 'text-amber-300'
                          }`}>
                            {dur.current} / {dur.max} ({durPct}%)
                          </span>
                        </div>
                      </div>

                      {/* Durability Progress Bar */}
                      <div>
                        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 shadow-inner">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isCritical
                                ? 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse'
                                : durPct < 35
                                ? 'bg-gradient-to-r from-amber-600 to-orange-500'
                                : durPct < 70
                                ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(2, durPct))}%` }}
                          />
                        </div>
                        {isCritical && (
                          <div className="mt-1 text-[10px] text-red-300 font-sans flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 animate-bounce" />
                            <span>Aviso: -2 penalidade no dano pelo fio lascado!</span>
                          </div>
                        )}
                      </div>

                      {/* Weapon Action Buttons: Attack, Heavy Strike, Manual Wear, Repair */}
                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between flex-wrap gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleAttackWithWeapon(weapon, false)}
                            disabled={isBroken}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-cinzel font-bold flex items-center gap-1 transition ${
                              isBroken
                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-sm active:scale-95'
                            }`}
                            title="Rolar teste de ataque (d20 + Modificador). Falhas e impactos podem desgastar a lâmina."
                          >
                            <Swords className="w-3 h-3" />
                            <span>Atacar (d20)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAttackWithWeapon(weapon, true)}
                            disabled={isBroken}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1 transition border ${
                              isBroken
                                ? 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                                : 'bg-red-950/70 hover:bg-red-900/80 text-red-200 border-red-700/60 active:scale-95'
                            }`}
                            title="Golpe Devastador: +4 dano extra ao custo garantido de -2 durabilidade na arma."
                          >
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>Golpe (+4 / -2 Dur)</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Quick Wear Trigger */}
                          <button
                            type="button"
                            onClick={() => handleDirectWear(weapon, 1)}
                            className="px-1.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono border border-zinc-700 transition"
                            title="Desgastar -1 ponto de durabilidade por impacto"
                          >
                            -1 Dur
                          </button>

                          {/* Repair Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSheetRepairTargetItem(weapon);
                              setSheetRepairModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-amber-500/40 text-amber-300 text-[11px] font-cinzel font-bold flex items-center gap-1 transition shadow-sm"
                            title="Reparar durabilidade usando moedas ou descanso"
                          >
                            <Hammer className="w-3 h-3 text-amber-400" />
                            <span>Reparar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* ============================================================ */}
        {/* BOTTOM MAJOR PANEL: Tabs (Coins, Spells, Inventory, Alchemy, Notes) */}
        {/* ============================================================ */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
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
                <span>Inventário ({character.inventory.length})</span>
                {criticalDurabilityCount > 0 && (
                  <span
                    className="px-1.5 py-0.2 rounded bg-red-600 text-white font-mono text-[9px] font-bold animate-pulse border border-red-400 shadow flex items-center gap-0.5"
                    title={`${criticalDurabilityCount} item(ns) com durabilidade abaixo de 10%!`}
                  >
                    ⚠️ {criticalDurabilityCount}
                  </span>
                )}
                {isCharOverburdened && (
                  <span
                    className="px-1.5 py-0.2 rounded bg-red-600 text-white font-mono text-[9px] font-bold animate-pulse"
                    title="Atenção: Personagem com sobrecarga de itens ativa!"
                  >
                    SOBRECARGA
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('alchemy')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                  activeTab === 'alchemy'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                <span>Alquimia &amp; Forja</span>
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
                <Scroll className="w-3.5 h-3.5 text-amber-400" />
                <span>Notas de Aventura ({character.adventureNotes?.length || 0})</span>
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

          {/* TAB CONTENT: 4. ALQUIMIA & FORJA DO FERREIRO */}
          {activeTab === 'alchemy' && (
            <div className="pt-1">
              <AlchemyWorkbenchView
                character={character}
                onUpdateCharacter={onUpdateCharacter}
                isGmView={isGmView}
                onNavigateToInventory={() => setActiveTab('inventory')}
              />
            </div>
          )}

          {/* TAB CONTENT: 5. NOTAS DE AVENTURA */}
          {activeTab === 'notes' && (
            <div className="pt-1">
              <AdventureNotesView
                character={character}
                onUpdateCharacter={onUpdateCharacter}
                isGmView={isGmView}
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

      {/* Modal de Reparo de Armas e Itens na Ficha */}
      <ItemRepairModal
        isOpen={sheetRepairModalOpen}
        onClose={() => {
          setSheetRepairModalOpen(false);
          setSheetRepairTargetItem(null);
        }}
        item={sheetRepairTargetItem}
        character={character}
        onRepairSuccess={(updatedItem, updatedCharacter) => {
          onUpdateCharacter(updatedCharacter);
          sound.playCoinClink('ORO');
        }}
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
                    {RACE_CATEGORIES.map((category) => (
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
      {/* MODAL DE CELEBRAÇÃO DE SUBIDA DE NÍVEL (LEVEL UP) */}
      {levelUpData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-[#1c0e35] via-[#100820] to-[#0a0515] p-6 text-zinc-100 shadow-2xl shadow-amber-500/20 overflow-hidden">
            {/* Efeitos de Fundo Arcanos */}
            <div className="absolute -right-16 -top-16 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-4 top-4 opacity-10 pointer-events-none text-8xl font-cinzel select-none">
              ✦
            </div>

            {/* Cabeçalho do Modal */}
            <div className="text-center space-y-2 relative">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-zinc-950 shadow-xl shadow-amber-950/60 ring-4 ring-amber-400/30">
                <Crown className="w-8 h-8 animate-bounce" />
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold tracking-widest text-amber-400 uppercase">
                  ✦ AVANÇO DE PATAMAR LENDÁRIO ✦
                </span>
                <h3 className="text-2xl font-cinzel font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-100 tracking-wide mt-1">
                  SUBIDA DE NÍVEL!
                </h3>
                <p className="text-xs text-zinc-300 font-sans max-w-sm mx-auto mt-1">
                  O Mestre concedeu XP suficiente para alcançar um novo patamar de poder em Nexaria!
                </p>
              </div>
            </div>

            {/* Transição de Níveis Visual */}
            <div className="mt-5 p-3.5 rounded-2xl bg-black/60 border border-amber-500/40 flex items-center justify-center gap-5 text-center">
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase font-cinzel text-zinc-400">Nível Anterior</span>
                <span className="text-2xl font-mono font-bold text-zinc-400 line-through">
                  Nv. {levelUpData.oldLevel}
                </span>
              </div>

              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-400">
                <ArrowRight className="w-5 h-5 animate-pulse" />
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase font-cinzel text-amber-400 font-bold">Novo Nível</span>
                <span className="text-3xl font-mono font-black text-amber-300 drop-shadow">
                  Nv. {levelUpData.newLevel}
                </span>
              </div>
            </div>

            {/* Atributos Atualizados e Capacidade de Inventário */}
            <div className="mt-4 space-y-2.5">
              <div className="text-[10px] font-cinzel font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Atributos &amp; Capacidade de Inventário Atualizados</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {/* 1. Capacidade de Carga da Mochila */}
                <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-purple-300 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Backpack className="w-3.5 h-3.5 text-amber-400" />
                      <strong>Mochila / Carga Máx.</strong>
                    </span>
                    <span className="text-amber-400 font-bold font-mono">
                      +{levelUpData.capacityGain} kg
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-lg font-bold text-white font-mono">
                      {levelUpData.newMaxCapacity} kg
                    </span>
                    <span className="text-[10px] text-zinc-400 font-sans">
                      (era {levelUpData.prevMaxCapacity} kg)
                    </span>
                  </div>
                  <div className="text-[9px] text-zinc-400 font-sans mt-1">
                    Equivalente a <strong>~{Math.round(levelUpData.newMaxCapacity / 2)} slots de itens</strong>
                  </div>
                </div>

                {/* 2. Pontos de Atributos Livres */}
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-amber-300 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <strong>Pontos de Atributos</strong>
                    </span>
                    <span className="text-amber-300 font-bold font-mono">
                      +{levelUpData.attrPointsGain} pts
                    </span>
                  </div>
                  <div className="mt-2 text-lg font-bold text-amber-200 font-mono">
                    +{levelUpData.attrPointsGain} Livres p/ Gastar
                  </div>
                  <div className="text-[9px] text-zinc-400 font-sans mt-1">
                    Distribua em FOR, DES, CON, INT, SAB ou CAR na ficha
                  </div>
                </div>

                {/* 3. Pontos de Vida (PV) */}
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">❤️</span>
                    <div>
                      <div className="text-[11px] font-bold text-red-200">Pontos de Vida Máximos</div>
                      <div className="text-[9px] text-red-300/80">Vitalidade expandida</div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-red-300 font-mono">
                    +{levelUpData.hpGain} PV
                  </span>
                </div>

                {/* 4. Pontos de Mana (PM) */}
                <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💧</span>
                    <div>
                      <div className="text-[11px] font-bold text-sky-200">Pontos de Mana Máximos</div>
                      <div className="text-[9px] text-sky-300/80">Reserva arcana ampliada</div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-sky-300 font-mono">
                    +{levelUpData.manaGain} PM
                  </span>
                </div>
              </div>
            </div>

            {/* Ações do Modal */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  sound.playCoinClink('PRT');
                  setActiveTab('inventory');
                  setLevelUpData(null);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-700/80 text-purple-200 text-xs font-cinzel font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Backpack className="w-4 h-4 text-amber-400" />
                <span>Examinar Mochila ({levelUpData.newMaxCapacity} kg)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playCoinClink('ORO');
                  setLevelUpData(null);
                }}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-zinc-950 text-xs font-cinzel font-extrabold shadow-lg transition"
              >
                Comemorar Conquista ✦
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Criação de Ficha Direta na Variável Ficha */}
      <CharacterCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        campaignCode={campaignCode}
        onCreateCharacter={(newChar) => {
          if (onCreateCharacter) {
            onCreateCharacter(newChar);
          } else {
            onUpdateCharacter(newChar);
          }
        }}
      />

      {/* Modal de Confirmação para Excluir Ficha */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#1f0b15] via-[#14060e] to-[#0a0307] border border-rose-500/60 rounded-2xl shadow-2xl p-6 text-zinc-100">
            <div className="flex items-center gap-3 pb-3 border-b border-rose-900/40 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-950/70 border border-rose-600/50 flex items-center justify-center text-rose-400 shrink-0 shadow-md">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-cinzel font-bold text-rose-200">
                  Excluir Ficha de Personagem
                </h3>
                <p className="text-xs text-zinc-400">
                  Ação definitiva e irreversível
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6 text-xs text-zinc-300 leading-relaxed">
              <p>
                Tem certeza de que deseja excluir permanentemente a ficha de{' '}
                <strong className="text-rose-300 font-semibold">{character.name}</strong>{' '}
                ({character.characterClass} Nível {character.level})?
              </p>
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-[11px] text-rose-300">
                ⚠️ Todos os dados de atributos, dados vitais, moedas, itens da mochila e magias vinculados a este aventureiro serão removidos da sala <strong>{campaignCode}</strong>.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-700 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  if (onDeleteCharacter) {
                    onDeleteCharacter(character.id);
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/50 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sim, Excluir Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
