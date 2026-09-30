import React, { useState, useMemo, useEffect } from 'react';
import {
  CampaignRoom,
  CurrencyType,
  CURRENCY_CONFIGS,
  calculateTotalNetWorthInBRZ,
  ShopItem,
  QuestHook,
  LevelProgressionConfig,
  DEFAULT_XP_PER_LEVEL,
  DEFAULT_INVENTORY_BONUS_PER_LEVEL,
  RoomColorScheme,
  ROOM_COLOR_SCHEMES,
} from '../types/rpg';
import { campaignService } from '../services/campaignService';
import { TransactionAnimationData } from '../types/animation';
import { CoinVisual } from './CoinVisual';
import { sound, AMBIENT_TRACKS, AmbientTrackInfo } from '../utils/audio';
import {
  Crown,
  Plus,
  Users,
  Award,
  Receipt,
  Heart,
  Droplets,
  Send,
  Backpack,
  Sparkles,
  Shield,
  Zap,
  Sliders,
  Check,
  Compass,
  ScrollText,
  Copy,
  MapPin,
  Flame,
  Skull,
  Wand2,
  RefreshCw,
  Bookmark,
  Coins,
  TrendingUp,
  Scale,
  Save,
  RotateCcw,
  Trash2,
  Layers,
  ArrowRight,
  Info,
  Palette,
  Music,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Pause,
  Square,
  Waves,
  Radio,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MasterDashboardViewProps {
  campaign: CampaignRoom;
  onUpdateCampaign: (updated: CampaignRoom) => void;
  onExecuteTransaction: (params: {
    receiverId: string;
    receiverName: string;
    amount: number;
    currency: CurrencyType;
    reason: string;
    senderId?: string;
    senderName?: string;
  }) => { success: boolean; message: string };
  onCreatePaymentRequest: (req: {
    targetCharacterId: string;
    amount: number;
    currency: CurrencyType;
    reason: string;
  }) => boolean;
  onSelectCharacter: (charId: string) => void;
  onDeleteCharacter?: (charId: string) => void;
  onTriggerAnimation?: (data: TransactionAnimationData) => void;
  onAwardExp?: (
    characterId: string,
    amount: number,
    reason: string
  ) => Promise<{ success: boolean; message: string; leveledUp?: boolean }>;
}

export const MasterDashboardView: React.FC<MasterDashboardViewProps> = ({
  campaign,
  onUpdateCampaign,
  onExecuteTransaction,
  onCreatePaymentRequest,
  onSelectCharacter,
  onDeleteCharacter,
  onTriggerAnimation,
  onAwardExp,
}) => {
  const [charToDelete, setCharToDelete] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<
    'rewards' | 'bills' | 'market' | 'players' | 'hooks' | 'progression' | 'audio' | 'settings'
  >('rewards');

  // Ambient Audio State synchronized with sound controller
  const [ambientAudioState, setAmbientAudioState] = useState<{
    isPlaying: boolean;
    trackId: string | null;
    volume: number;
  }>({
    isPlaying: sound.isAmbientPlaying(),
    trackId: sound.getCurrentAmbientTrack(),
    volume: sound.getAmbientVolume(),
  });

  useEffect(() => {
    const unsub = sound.subscribeAmbientState((state) => {
      setAmbientAudioState({ ...state });
    });
    return () => unsub();
  }, []);

  // Level Progression & Inventory Capacity Config State
  const [progressionXp, setProgressionXp] = useState<Record<number, number>>(() => ({
    ...DEFAULT_XP_PER_LEVEL,
    ...(campaign.levelProgressionConfig?.xpRequiredPerLevel || {}),
  }));
  const [progressionCapacity, setProgressionCapacity] = useState<Record<number, number>>(() => ({
    ...DEFAULT_INVENTORY_BONUS_PER_LEVEL,
    ...(campaign.levelProgressionConfig?.inventoryCapacityPerLevel || {}),
  }));
  const [progressionFeedback, setProgressionFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [themeFeedback, setThemeFeedback] = useState<string | null>(null);

  const handleSelectColorScheme = (schemeId: RoomColorScheme) => {
    sound.playSuccessFanfare();
    campaignService.setRoomColorScheme(campaign.code, schemeId);
    onUpdateCampaign({
      ...campaign,
      colorScheme: schemeId,
    });
    const cfg = ROOM_COLOR_SCHEMES[schemeId];
    setThemeFeedback(`Esquema de cores alterado para "${cfg?.name || schemeId}"! As cores foram aplicadas dinamicamente a toda a sala.`);
    setTimeout(() => setThemeFeedback(null), 4000);
  };

  // Cumulative Total XP threshold to reach each level (1 to 20)
  const cumulativeXpMap = useMemo(() => {
    const map: Record<number, number> = { 1: 0 };
    let running = 0;
    for (let lvl = 1; lvl <= 20; lvl++) {
      map[lvl] = running;
      running += (progressionXp[lvl] ?? 100);
    }
    return map;
  }, [progressionXp]);

  const handleSetCumulativeXp = (lvl: number, newTotal: number) => {
    if (lvl <= 1) return;
    const prevCumulative = cumulativeXpMap[lvl - 1];
    const newDelta = Math.max(1, newTotal - prevCumulative);
    setProgressionXp((prev) => ({
      ...prev,
      [lvl - 1]: newDelta,
    }));
  };

  const handleScaleInventoryStep = (kgPerLvl: number) => {
    sound.playCoinClink('PRT');
    const newCap: Record<number, number> = {};
    for (let lvl = 1; lvl <= 20; lvl++) {
      newCap[lvl] = (lvl - 1) * kgPerLvl;
    }
    setProgressionCapacity(newCap);
    setProgressionFeedback({
      type: 'success',
      text: `Bônus escalonado de mochila aplicado: +${kgPerLvl} kg (~${Math.round(kgPerLvl / 2)} slots) por nível! Clique em salvar para confirmar.`,
    });
  };

  const handleScaleXpStep = (xpPerLvl: number) => {
    sound.playCoinClink('PRT');
    const newXp: Record<number, number> = {};
    for (let lvl = 1; lvl <= 20; lvl++) {
      newXp[lvl] = lvl * xpPerLvl;
    }
    setProgressionXp(newXp);
    setProgressionFeedback({
      type: 'success',
      text: `Escala de XP aplicada: ${xpPerLvl}x por nível! Clique em salvar para confirmar.`,
    });
  };

  const handleApplyProgressionPreset = (type: 'classic' | 'linear' | 'dnd5e' | 'fast') => {
    sound.playCoinClink('PRT');
    let newXp: Record<number, number> = {};
    let newCap: Record<number, number> = {};

    if (type === 'classic') {
      newXp = { ...DEFAULT_XP_PER_LEVEL };
      newCap = { ...DEFAULT_INVENTORY_BONUS_PER_LEVEL };
    } else if (type === 'linear') {
      for (let lvl = 1; lvl <= 20; lvl++) {
        newXp[lvl] = lvl * 100;
        newCap[lvl] = (lvl - 1) * 2;
      }
    } else if (type === 'dnd5e') {
      const dnd5eTable: Record<number, number> = {
        1: 300,
        2: 600,
        3: 1800,
        4: 3800,
        5: 7500,
        6: 9000,
        7: 11000,
        8: 14000,
        9: 16000,
        10: 21000,
        11: 15000,
        12: 20000,
        13: 20000,
        14: 25000,
        15: 30000,
        16: 30000,
        17: 40000,
        18: 40000,
        19: 50000,
        20: 50000,
      };
      newXp = dnd5eTable;
      for (let lvl = 1; lvl <= 20; lvl++) {
        newCap[lvl] = (lvl - 1) * 3;
      }
    } else if (type === 'fast') {
      for (let lvl = 1; lvl <= 20; lvl++) {
        newXp[lvl] = Math.min(2000, lvl * 60);
        newCap[lvl] = (lvl - 1) * 3;
      }
    }

    setProgressionXp(newXp);
    setProgressionCapacity(newCap);
    setProgressionFeedback({
      type: 'success',
      text: `Preset carregado! Clique em "Salvar Tabela de Progressão" para gravar permanentemente.`,
    });
  };

  const handleSaveProgression = () => {
    sound.playSuccessFanfare();
    const updatedConfig: LevelProgressionConfig = {
      xpRequiredPerLevel: progressionXp,
      inventoryCapacityPerLevel: progressionCapacity,
    };
    onUpdateCampaign({
      ...campaign,
      levelProgressionConfig: updatedConfig,
    });
    setProgressionFeedback({
      type: 'success',
      text: 'Tabela de EXP e Bônus de Carga salva com sucesso para todos os aventureiros da mesa!',
    });
    setTimeout(() => setProgressionFeedback(null), 6000);
  };

  // Reward state (GM gives coins to players)
  const [rewardTargetId, setRewardTargetId] = useState<string>('all');
  const [rewardCurrency, setRewardCurrency] = useState<CurrencyType>('ORO');
  const [rewardAmount, setRewardAmount] = useState<number>(2);
  const [rewardReason, setRewardReason] = useState<string>(
    'Recompensa por cumprir a missão da sessão'
  );

  // Bill state (GM charges players)
  const [billTargetId, setBillTargetId] = useState<string>('all');
  const [billCurrency, setBillCurrency] = useState<CurrencyType>('PRT');
  const [billAmount, setBillAmount] = useState<number>(5);
  const [billReason, setBillReason] = useState<string>(
    'Taxa de entrada na cidadela ou diária de estalagem'
  );

  // EXP distribution state (GM gives EXP to players)
  const [expTargetId, setExpTargetId] = useState<string>('all');
  const [expAmount, setExpAmount] = useState<number>(100);
  const [expReason, setExpReason] = useState<string>('Superou os perigos e combate da sessão');
  const [expFeedback, setExpFeedback] = useState<{ success: boolean; text: string } | null>(null);

  // New Shop Item modal/form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(10);
  const [newItemCurrency, setNewItemCurrency] = useState<CurrencyType>('PRT');
  const [newItemDesc, setNewItemDesc] = useState('');

  // AI Quest Hooks Generator State
  const partyAverageLevel =
    campaign.players.length > 0
      ? Math.max(
          1,
          Math.round(
            campaign.players.reduce((sum, p) => sum + (p.level || 1), 0) /
              campaign.players.length
          )
        )
      : 1;

  const [overridePartyLevel, setOverridePartyLevel] = useState<number>(partyAverageLevel);
  const [questHooks, setQuestHooks] = useState<QuestHook[]>([]);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [hookFeedback, setHookFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [hookEnvironment, setHookEnvironment] = useState<string>('Fendas do Abismo');
  const [hookTone, setHookTone] = useState<string>('Sombrio & Misterioso');
  const [hookCustomPrompt, setHookCustomPrompt] = useState<string>('');
  const [hookCopiedId, setHookCopiedId] = useState<string | null>(null);
  const [savedHooks, setSavedHooks] = useState<QuestHook[]>([]);

  const handleGenerateQuestHooks = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isGeneratingHooks) return;

    setIsGeneratingHooks(true);
    setHookFeedback(null);
    sound.playDiceRoll();

    try {
      const res = await campaignService.generateQuestHooks(campaign.code, {
        environment: hookEnvironment,
        tone: hookTone,
        customPrompt: hookCustomPrompt.trim() || undefined,
        partyLevelOverride: overridePartyLevel || partyAverageLevel,
      });

      if (res.success && res.questHooks && res.questHooks.length > 0) {
        sound.playCoinClink('ORO');
        setQuestHooks(res.questHooks);
        setHookFeedback({
          type: 'success',
          text: `3 ganchos de aventura conjurados com sucesso para Nível Médio ${res.targetAvgLevel || overridePartyLevel}!`,
        });
      } else {
        setHookFeedback({
          type: 'error',
          text: res.error || 'Falha ao conjurar ganchos de aventura.',
        });
      }
    } catch (err: any) {
      setHookFeedback({
        type: 'error',
        text: err?.message || 'Erro inesperado na geração de ganchos.',
      });
    } finally {
      setIsGeneratingHooks(false);
    }
  };

  const handleCopyHook = (hook: QuestHook) => {
    const text = `📜 GANCHO DE AVENTURA: ${hook.title}
• Categoria: ${hook.category} (Recomendado para: ${hook.recommendedLevel})
• Local: ${hook.location}
• Sinopse: ${hook.synopsis}
• Ameaça Principal: ${hook.threat}
• Reviravolta / Clímax: ${hook.climaxOrTwist}
• Recompensas: ${hook.rewards.coinsAmount} ${hook.rewards.currency} | ${hook.rewards.exp} XP${hook.rewards.suggestedItemDrop ? ` | Item: ${hook.rewards.suggestedItemDrop}` : ''}`;

    navigator.clipboard?.writeText(text);
    setHookCopiedId(hook.id);
    sound.playCoinClink('PRT');
    setTimeout(() => setHookCopiedId(null), 3000);
  };

  const handleUseRewardFromHook = (hook: QuestHook) => {
    setRewardTargetId('all');
    setRewardCurrency(hook.rewards.currency);
    setRewardAmount(hook.rewards.coinsAmount);
    setRewardReason(`Missão: ${hook.title}`);
    setExpTargetId('all');
    setExpAmount(hook.rewards.exp);
    setExpReason(`Missão Concluída: ${hook.title}`);
    setActiveSubTab('rewards');
    sound.playCoinClink('ORO');
  };

  const handleToggleSaveHook = (hook: QuestHook) => {
    sound.playCoinClink('BRZ');
    setSavedHooks((prev) => {
      const exists = prev.some((h) => h.id === hook.id);
      if (exists) {
        return prev.filter((h) => h.id !== hook.id);
      }
      return [hook, ...prev];
    });
  };

  const gmNetWorth = calculateTotalNetWorthInBRZ(campaign.gmWallet);

  const handleGiveExp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0) return;

    if (!onAwardExp) {
      const updatedPlayers = campaign.players.map((p) => {
        if (expTargetId === 'all' || p.id === expTargetId) {
          const newExp = (p.experience || 0) + expAmount;
          const newLevel = Math.max(1, Math.floor(newExp / 1000) + 1);
          const levelDiff = newLevel - p.level;
          return {
            ...p,
            experience: newExp,
            level: newLevel,
            unspentAttributePoints: (p.unspentAttributePoints || 0) + (levelDiff > 0 ? levelDiff * 3 : 0),
          };
        }
        return p;
      });
      onUpdateCampaign({ ...campaign, players: updatedPlayers });
      setExpFeedback({ success: true, text: `+${expAmount} XP distribuído com sucesso!` });
      setTimeout(() => setExpFeedback(null), 4000);
      return;
    }

    let hadLevelUp = false;
    if (expTargetId === 'all') {
      for (const p of campaign.players) {
        const res = await onAwardExp(p.id, expAmount, expReason);
        if (res.leveledUp) hadLevelUp = true;
      }
    } else {
      const res = await onAwardExp(expTargetId, expAmount, expReason);
      if (res.leveledUp) hadLevelUp = true;
    }

    sound.playLevelUp();
    if (hadLevelUp) {
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    }

    setExpFeedback({
      success: true,
      text: `+${expAmount} XP concedido com sucesso! ${hadLevelUp ? '🎉 Jogador(es) subiram de nível!' : ''}`,
    });
    setTimeout(() => setExpFeedback(null), 4000);
  };

  const handleGiveReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (rewardAmount <= 0) return;

    let targetName = 'Todos os Jogadores';
    if (rewardTargetId === 'all') {
      if (campaign.players.length === 0) {
        return;
      }
      campaign.players.forEach((p) => {
        onExecuteTransaction({
          senderId: 'gm',
          senderName: campaign.gmName,
          receiverId: p.id,
          receiverName: p.name,
          amount: rewardAmount,
          currency: rewardCurrency,
          reason: rewardReason,
        });
      });
    } else {
      const targetChar = campaign.players.find((p) => p.id === rewardTargetId);
      if (!targetChar) return;
      targetName = targetChar.name;
      onExecuteTransaction({
        senderId: 'gm',
        senderName: campaign.gmName,
        receiverId: targetChar.id,
        receiverName: targetChar.name,
        amount: rewardAmount,
        currency: rewardCurrency,
        reason: rewardReason,
      });
    }

    if (onTriggerAnimation) {
      onTriggerAnimation({
        id: 'anim-' + Date.now(),
        type: 'sending',
        currency: rewardCurrency,
        amount: rewardAmount,
        senderName: `Mestre (${campaign.gmName})`,
        receiverName: targetName,
        reason: rewardReason,
        timestamp: Date.now(),
      });
    } else {
      sound.playSuccessFanfare();
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (billAmount <= 0) return;

    const ok = onCreatePaymentRequest({
      targetCharacterId: billTargetId,
      amount: billAmount,
      currency: billCurrency,
      reason: billReason,
    });

    if (ok) {
      sound.playNotice();
      alert('Cobrança enviada com sucesso para os jogadores!');
    }
  };

  const handleAddNewShopItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: ShopItem = {
      id: 'shop-' + Date.now(),
      name: newItemName.trim(),
      category: 'equipamento',
      description: newItemDesc.trim() || 'Item à venda pelo Mestre.',
      price: newItemPrice,
      currency: newItemCurrency,
      stock: 5,
      icon: '📦',
    };

    onUpdateCampaign({
      ...campaign,
      marketItems: [newItem, ...campaign.marketItems],
    });

    setNewItemName('');
    setNewItemDesc('');
    sound.playCoinClink(newItemCurrency);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* GM Master Vault Header */}
      <div className="rounded-2xl border border-amber-600/40 bg-gradient-to-b from-purple-950/50 via-[#0e091b]/95 to-zinc-950 p-6 text-zinc-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-2 left-2 text-amber-500/30 text-xs font-cinzel select-none">✦</div>
        <div className="absolute top-2 right-2 text-amber-500/30 text-xs font-cinzel select-none">✦</div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-900/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-950/70 to-purple-950/80 border border-amber-500/60 flex items-center justify-center text-amber-300 shadow-md shadow-amber-950/40 shrink-0">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 uppercase tracking-wide">
                  PAINEL DO MESTRE DE NEXARIA
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-200 border border-purple-800">
                  {campaign.gmName}
                </span>
              </div>
              <p className="text-xs text-purple-200/80 font-sans">
                Mesa: <strong className="text-amber-300">{campaign.name}</strong> • Código:{' '}
                <span className="text-amber-300 font-mono font-bold">{campaign.code}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end p-2.5 rounded-xl border border-amber-500/30 bg-amber-950/30">
            <span className="text-[10px] uppercase tracking-wider text-purple-300 font-cinzel font-semibold">
              ✦ Tesouro Total do Mestre ✦
            </span>
            <span className="text-xl font-mono font-bold text-amber-300">
              {gmNetWorth.toLocaleString('pt-BR')} BRZ
            </span>
          </div>
        </div>

        {/* Master's 5 Currency Piles */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
          {(['BRZ', 'PRT', 'ORO', 'PLN', 'CYB'] as CurrencyType[]).map((curr) => {
            const cfg = CURRENCY_CONFIGS[curr];
            const balance = campaign.gmWallet[curr] || 0;

            return (
              <div
                key={curr}
                className="rounded-xl border border-purple-900/50 bg-[#140b24]/70 hover:bg-[#1a0e30]/90 p-3 flex flex-col items-center text-center transition-all hover:border-amber-500/50 shadow-md"
              >
                <CoinVisual type={curr} size="md" interactiveFlip />
                <span className="text-xs font-cinzel font-bold text-amber-200 mt-1">{cfg.name}</span>
                <span className="text-lg font-mono font-bold text-zinc-100">
                  {balance}
                </span>
                <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-purple-900/40 w-full justify-center">
                  <button
                    onClick={() => {
                      onUpdateCampaign({
                        ...campaign,
                        gmWallet: {
                          ...campaign.gmWallet,
                          [curr]: Math.max(0, balance - 50),
                        },
                      });
                    }}
                    className="px-2 py-0.5 text-[10px] font-mono bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800 rounded text-zinc-300 transition"
                  >
                    -50
                  </button>
                  <button
                    onClick={() => {
                      onUpdateCampaign({
                        ...campaign,
                        gmWallet: {
                          ...campaign.gmWallet,
                          [curr]: balance + 50,
                        },
                      });
                    }}
                    className="px-2 py-0.5 text-[10px] font-mono bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800 rounded text-zinc-300 transition"
                  >
                    +50
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Ambient Audio Floating Mini-Player for GM */}
      <div className="rounded-xl border border-purple-900/60 bg-gradient-to-r from-[#160b29]/90 via-[#0f071d]/95 to-[#160b29]/90 backdrop-blur-md p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition ${
            ambientAudioState.isPlaying
              ? 'bg-purple-950/90 border-purple-500 text-purple-300 shadow-md shadow-purple-950/50'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-500'
          }`}>
            {ambientAudioState.isPlaying ? (
              <Waves className="w-5 h-5 animate-pulse text-amber-400" />
            ) : (
              <Music className="w-4 h-4 text-zinc-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-cinzel font-bold text-zinc-200">
                Áudio Ambiente da Mesa:
              </span>
              <span className={`text-[11px] font-medium font-sans ${
                ambientAudioState.isPlaying ? 'text-amber-300 font-semibold' : 'text-zinc-400'
              }`}>
                {ambientAudioState.isPlaying && ambientAudioState.trackId
                  ? (AMBIENT_TRACKS.find((t) => t.id === ambientAudioState.trackId)?.name || 'Trilha Ativa')
                  : 'Nenhuma trilha ativa (Silêncio)'}
              </span>
              {ambientAudioState.isPlaying && (
                <span className="flex items-center gap-0.5 h-3 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
                  <span className="w-1 h-2 bg-amber-400 animate-bounce" />
                  <span className="w-1 h-3 bg-amber-400 animate-bounce delay-75" />
                  <span className="w-1 h-1.5 bg-amber-400 animate-bounce delay-150" />
                  <span className="ml-1 text-[9px]">TOCANDO</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Sintetizador procedural de áudio para masmorras, tavernas, combates épicos e ambientação.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          {/* Quick Play/Stop Button */}
          {ambientAudioState.isPlaying ? (
            <button
              type="button"
              onClick={() => sound.stopAmbientTrack()}
              className="px-3 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900/80 border border-red-700/60 text-red-200 text-xs font-cinzel font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Parar Áudio</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => sound.playAmbientTrack('caverna')}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 text-purple-100 text-xs font-cinzel font-bold flex items-center gap-1.5 border border-purple-500/40 shadow transition active:scale-95"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Tocar Caverna</span>
            </button>
          )}

          {/* Volume Slider */}
          <div className="flex items-center gap-1.5 bg-zinc-950/80 px-2.5 py-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => sound.setAmbientVolume(ambientAudioState.volume > 0 ? 0 : 0.65)}
              className="text-zinc-400 hover:text-amber-400 transition"
              title="Mutar/Desmutar"
            >
              {ambientAudioState.volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
              ) : ambientAudioState.volume < 0.4 ? (
                <Volume1 className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ambientAudioState.volume}
              onChange={(e) => sound.setAmbientVolume(parseFloat(e.target.value))}
              className="w-16 sm:w-20 accent-amber-400 cursor-pointer h-1 bg-zinc-800 rounded-lg"
              title={`Volume: ${Math.round(ambientAudioState.volume * 100)}%`}
            />
            <span className="text-[10px] font-mono text-zinc-400 min-w-[28px] text-right">
              {Math.round(ambientAudioState.volume * 100)}%
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveSubTab('audio')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-cinzel font-bold transition flex items-center gap-1 ${
              activeSubTab === 'audio'
                ? 'bg-purple-600 text-white border-purple-400 shadow'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
            title="Abrir painel completo de trilhas sonoras"
          >
            <span>Console</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Sub-tabs for GM actions */}
      <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('rewards')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
            activeSubTab === 'rewards'
              ? 'bg-zinc-100 text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Premiar Jogadores</span>
        </button>

        <button
          onClick={() => setActiveSubTab('bills')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
            activeSubTab === 'bills'
              ? 'bg-zinc-100 text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Cobrar Taxas</span>
        </button>

        <button
          onClick={() => setActiveSubTab('market')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
            activeSubTab === 'market'
              ? 'bg-zinc-100 text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Loja do Mestre ({campaign.marketItems.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('players')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
            activeSubTab === 'players'
              ? 'bg-zinc-100 text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Fichas ({campaign.players.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('hooks')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition border ${
            activeSubTab === 'hooks'
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-950/40 border-amber-300'
              : 'text-amber-300 hover:text-amber-100 hover:bg-purple-950/50 border-amber-600/40 bg-purple-950/20'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Ganchos de Aventura (IA)</span>
          {questHooks.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40">
              {questHooks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('progression')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
            activeSubTab === 'progression'
              ? 'bg-zinc-100 text-zinc-950 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
          <span>Níveis &amp; Progressão</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audio')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition border ${
            activeSubTab === 'audio'
              ? 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white font-bold shadow-md shadow-purple-950/40 border-purple-400/50'
              : 'text-purple-300 hover:text-purple-100 hover:bg-purple-950/50 border-purple-800/40 bg-purple-950/20'
          }`}
        >
          <Music className="w-3.5 h-3.5 text-purple-400" />
          <span>Áudio Ambiente &amp; Trilhas</span>
          {ambientAudioState.isPlaying && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
            activeSubTab === 'settings'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-950/40'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          <span>Esquema de Cores &amp; Sala</span>
        </button>
      </div>

      {/* 1. PREMIAR JOGADORES */}
      {activeSubTab === 'rewards' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800/80">
            <Award className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">
                Distribuir Recompensa
              </h3>
              <p className="text-xs text-zinc-400">
                Envie recompensas de missões, baús ou espólios aos jogadores.
              </p>
            </div>
          </div>

          <form onSubmit={handleGiveReward} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Beneficiário *
                </label>
                <select
                  value={rewardTargetId}
                  onChange={(e) => setRewardTargetId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                >
                  <option value="all">⭐ Todos os Jogadores da Mesa</option>
                  {campaign.players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.characterClass})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Moeda
                </label>
                <select
                  value={rewardCurrency}
                  onChange={(e) => setRewardCurrency(e.target.value as CurrencyType)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                >
                  <option value="BRZ">Bronze (BRZ)</option>
                  <option value="PRT">Prata (PRT)</option>
                  <option value="ORO">Ouro (ORO)</option>
                  <option value="PLN">Platina (PLN)</option>
                  <option value="CYB">Cybermoeda (CYB)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="1"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Motivo da Recompensa
              </label>
              <input
                type="text"
                value={rewardReason}
                onChange={(e) => setRewardReason(e.target.value)}
                placeholder="Ex: Espólio de masmorra, recompensa do rei..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-md shadow-sm flex items-center gap-2 transition"
            >
              <Award className="w-4 h-4" />
              Entregar Recompensa ({rewardAmount} {rewardCurrency})
            </button>
          </form>

          {/* NOVO: DISTRIBUIR EXPERIÊNCIA (EXP) */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">
                  Distribuir Experiência (EXP) aos Jogadores
                </h3>
                <p className="text-xs text-zinc-400">
                  A cada 1.000 XP acumulado, o jogador sobe de nível e ganha 3 pontos para distribuir nos atributos.
                </p>
              </div>
            </div>

            {expFeedback && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{expFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleGiveExp} className="space-y-3.5 bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Beneficiário do EXP *
                  </label>
                  <select
                    value={expTargetId}
                    onChange={(e) => setExpTargetId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">⭐ Todos os Jogadores da Mesa</option>
                    {campaign.players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — Nv {p.level} ({p.experience || 0} XP)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Quantidade de XP *
                  </label>
                  <div className="flex gap-1.5">
                    {[50, 100, 250, 500].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setExpAmount(preset)}
                        className={`py-1.5 px-2.5 text-xs rounded border transition ${
                          expAmount === preset
                            ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                        }`}
                      >
                        +{preset}
                      </button>
                    ))}
                    <input
                      type="number"
                      min="1"
                      value={expAmount}
                      onChange={(e) => setExpAmount(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-20 bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs font-mono text-zinc-100 text-center focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Motivo / Conquista da Sessão
                </label>
                <input
                  type="text"
                  value={expReason}
                  onChange={(e) => setExpReason(e.target.value)}
                  placeholder="Ex: Derrotou a criatura do abismo, completou a masmorra..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-500">
                  Progresso: EXP soma na ficha do jogador e desbloqueia pontos de atributos ao passar de nível.
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-bold text-xs rounded-lg shadow-md flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Conceder +{expAmount} XP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. COBRAR JOGADORES */}
      {activeSubTab === 'bills' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800/80">
            <Receipt className="w-4 h-4 text-zinc-400" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">
                Emitir Cobrança
              </h3>
              <p className="text-xs text-zinc-400">
                O jogador receberá uma notificação na tela para aprovar a transferência.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateBill} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Alvo da Cobrança *
                </label>
                <select
                  value={billTargetId}
                  onChange={(e) => setBillTargetId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                >
                  <option value="all">⭐ Todos os Jogadores</option>
                  {campaign.players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.characterClass})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Moeda Cobrada
                </label>
                <select
                  value={billCurrency}
                  onChange={(e) => setBillCurrency(e.target.value as CurrencyType)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                >
                  <option value="BRZ">Bronze (BRZ)</option>
                  <option value="PRT">Prata (PRT)</option>
                  <option value="ORO">Ouro (ORO)</option>
                  <option value="PLN">Platina (PLN)</option>
                  <option value="CYB">Cybermoeda (CYB)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Valor Cobrado
                </label>
                <input
                  type="number"
                  min="1"
                  value={billAmount}
                  onChange={(e) => setBillAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Motivo da Cobrança
              </label>
              <input
                type="text"
                value={billReason}
                onChange={(e) => setBillReason(e.target.value)}
                placeholder="Ex: Noite de sono na Taverna, Reparo de armadura..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-md shadow-sm flex items-center gap-2 transition"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar Cobrança ({billAmount} {billCurrency})
            </button>
          </form>
        </div>
      )}

      {/* 3. BAZAR DA CAMPANHA */}
      {activeSubTab === 'market' && (
        <div className="space-y-4">
          {/* Add item to store */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h4 className="font-semibold text-zinc-200 text-xs mb-3 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Adicionar Item à Venda
            </h4>

            <form onSubmit={handleAddNewShopItem} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div>
                <input
                  type="text"
                  placeholder="Nome do item"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-20 bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
                <select
                  value={newItemCurrency}
                  onChange={(e) => setNewItemCurrency(e.target.value as CurrencyType)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                >
                  <option value="BRZ">BRZ</option>
                  <option value="PRT">PRT</option>
                  <option value="ORO">ORO</option>
                  <option value="PLN">PLN</option>
                  <option value="CYB">CYB</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Descrição curta"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-md transition"
                >
                  Cadastrar Item
                </button>
              </div>
            </form>
          </div>

          {/* Item Catalog */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {campaign.marketItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{item.icon}</span>
                    <h5 className="font-medium text-zinc-200 text-xs truncate">
                      {item.name}
                    </h5>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <span className="font-mono font-medium text-zinc-200">
                    {item.price} {item.currency}
                  </span>
                  <button
                    onClick={() => {
                      const updated = campaign.marketItems.filter((i) => i.id !== item.id);
                      onUpdateCampaign({ ...campaign, marketItems: updated });
                    }}
                    className="text-[11px] text-red-400 hover:text-red-300"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. FICHAS DOS JOGADORES */}
      {activeSubTab === 'players' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {campaign.players.map((char) => {
            const netWorth = calculateTotalNetWorthInBRZ(char.wallet);

            return (
              <div
                key={char.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          char.avatarUrl ||
                          'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80'
                        }
                        alt={char.name}
                        className="w-9 h-9 rounded-md object-cover border border-zinc-800"
                      />
                      <div>
                        <h4 className="font-semibold text-zinc-100 text-sm">
                          {char.name}
                        </h4>
                        <span className="text-xs text-zinc-400">
                          {char.gender ? `${char.gender} • ` : ''}{char.race} • {char.characterClass} (Nv {char.level})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={async () => {
                          if (onAwardExp) {
                            const res = await onAwardExp(char.id, 100, 'Bônus de sessão concedido pelo Mestre');
                            sound.playLevelUp();
                            if (res.leveledUp) {
                              try {
                                confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
                              } catch {
                                // ignore
                              }
                            }
                          } else {
                            const newExp = (char.experience || 0) + 100;
                            const newLvl = Math.max(1, Math.floor(newExp / 1000) + 1);
                            const diff = newLvl - char.level;
                            const updated = campaign.players.map((p) =>
                              p.id === char.id
                                ? {
                                    ...p,
                                    experience: newExp,
                                    level: newLvl,
                                    unspentAttributePoints: (p.unspentAttributePoints || 0) + (diff > 0 ? diff * 3 : 0),
                                  }
                                : p
                            );
                            onUpdateCampaign({ ...campaign, players: updated });
                            sound.playLevelUp();
                          }
                        }}
                        className="px-2 py-1 text-xs rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition flex items-center gap-1"
                        title="Conceder +100 XP rápido a este jogador"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>+100 XP</span>
                      </button>

                      <button
                        onClick={() => onSelectCharacter(char.id)}
                        className="px-2.5 py-1 text-xs rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition flex items-center gap-1"
                        title="Abrir ficha no modo Mestre para alterar status, PV, PM e EXP"
                      >
                        <Sliders className="w-3 h-3 text-zinc-400" />
                        <span>Editar Status</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCharToDelete(char)}
                        className="p-1.5 rounded-md bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-800/50 transition"
                        title={`Excluir ficha de ${char.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    </div>
                  </div>

                  {/* EXP & Level progress */}
                  <div className="mb-2.5 p-2 rounded bg-zinc-950/70 border border-zinc-800/90 text-xs">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-400" />
                        Experiência: <strong className="text-zinc-200">{char.experience || 0} XP</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        {(char.unspentAttributePoints || 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/40 animate-pulse">
                            +{char.unspentAttributePoints} pts livres
                          </span>
                        )}
                        <span className="text-zinc-500 font-mono text-[10px]">
                          {(char.experience || 0) % 1000}/1000 XP (Nv {char.level})
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (((char.experience || 0) % 1000) / 1000) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Vitals quick view */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2.5">
                    <div className="p-1.5 rounded bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-red-400">
                        <Heart className="w-3 h-3" /> PV
                      </span>
                      <span className="font-mono text-zinc-200">
                        {char.hp.current}/{char.hp.max}
                      </span>
                    </div>

                    <div className="p-1.5 rounded bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-blue-400">
                        <Droplets className="w-3 h-3" /> PM
                      </span>
                      <span className="font-mono text-zinc-200">
                        {char.mana.current}/{char.mana.max}
                      </span>
                    </div>
                  </div>

                  {/* Coin overview */}
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                    <span>Moedas:</span>
                    <span className="font-mono text-zinc-300 text-[11px]">
                      {char.wallet.BRZ} BRZ • {char.wallet.PRT} PRT • {char.wallet.ORO} ORO •{' '}
                      {char.wallet.PLN} PLN • {char.wallet.CYB} CYB
                    </span>
                  </div>

                  {/* Inventory overview */}
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Backpack className="w-3 h-3 text-amber-400/80" /> Mochila:
                    </span>
                    <span className="font-mono text-zinc-300 text-[11px]">
                      {char.inventory.length} {char.inventory.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs mt-2">
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Total: {netWorth.toLocaleString('pt-BR')} BRZ
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        onExecuteTransaction({
                          senderId: 'gm',
                          senderName: campaign.gmName,
                          receiverId: char.id,
                          receiverName: char.name,
                          amount: 1,
                          currency: 'ORO',
                          reason: 'Recompensa concedida pelo Mestre',
                        });
                        sound.playCoinClink('ORO');
                      }}
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-[11px] border border-zinc-700"
                    >
                      +1 Ouro
                    </button>
                    <button
                      onClick={() => {
                        onExecuteTransaction({
                          senderId: 'gm',
                          senderName: campaign.gmName,
                          receiverId: char.id,
                          receiverName: char.name,
                          amount: 10,
                          currency: 'PRT',
                          reason: 'Recompensa concedida pelo Mestre',
                        });
                        sound.playCoinClink('PRT');
                      }}
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] border border-zinc-700"
                    >
                      +10 Prata
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. GERADOR DE GANCHOS DE AVENTURA COM IA (GEMINI) */}
      {activeSubTab === 'hooks' && (
        <div className="space-y-6">
          {/* Card de Configuração & Parâmetros com Base no Nível Médio */}
          <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-b from-[#1c1233] via-[#100a1f] to-[#0a0714] p-5 shadow-2xl text-zinc-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-950/60 font-bold shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-cinzel font-bold text-amber-300 uppercase tracking-wide">
                      Gerador de Ganchos de Aventura &bull; Gemini
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-purple-900/80 border border-purple-600/60 text-purple-200 text-[10px] font-mono">
                      Side-Quests Rápidas
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans">
                    Crie missões secundárias, encontros perigosos e reviravoltas balanceados para o nível dos jogadores.
                  </p>
                </div>
              </div>

              {/* Indicador e Controle do Nível Médio da Mesa */}
              <div className="flex items-center gap-3 p-2 rounded-xl bg-purple-950/70 border border-amber-500/30">
                <div>
                  <div className="text-[10px] uppercase font-cinzel text-amber-400/90 font-bold">
                    Nível Médio da Mesa
                  </div>
                  <div className="text-xs text-zinc-300 font-mono">
                    {campaign.players.length > 0 ? (
                      <span>
                        Calculado: <strong>Nível {partyAverageLevel}</strong> ({campaign.players.length} heróis)
                      </span>
                    ) : (
                      <span>Sem fichas conectadas</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pl-2 border-l border-purple-800">
                  <button
                    type="button"
                    onClick={() => setOverridePartyLevel(Math.max(1, overridePartyLevel - 1))}
                    className="w-6 h-6 rounded bg-purple-900/80 hover:bg-purple-800 border border-purple-700 text-xs font-mono font-bold text-purple-200 flex items-center justify-center transition"
                    title="Diminuir nível de calibração"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-amber-300 text-sm px-1.5">
                    Nv.{overridePartyLevel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOverridePartyLevel(Math.min(20, overridePartyLevel + 1))}
                    className="w-6 h-6 rounded bg-purple-900/80 hover:bg-purple-800 border border-purple-700 text-xs font-mono font-bold text-purple-200 flex items-center justify-center transition"
                    title="Aumentar nível de calibração"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Fichas de Heróis Conectados */}
            {campaign.players.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 overflow-x-auto text-[11px] font-mono text-zinc-400">
                <span className="shrink-0 text-zinc-500 font-sans text-xs">Aventureiros na Mesa:</span>
                {campaign.players.map((p) => (
                  <span
                    key={p.id}
                    className="px-2 py-0.5 rounded-lg bg-black/40 border border-purple-900/40 text-purple-200 shrink-0 flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <strong>{p.name}</strong>
                    <span className="text-zinc-500 font-sans">({p.characterClass}, Nv.{p.level})</span>
                  </span>
                ))}
              </div>
            )}

            {/* Controles de Geração */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ambiente / Cenário */}
              <div>
                <label className="block text-xs font-cinzel font-bold text-amber-200 mb-1.5">
                  Ambiente / Região de Nexaria:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Fendas do Abismo',
                    'Subsolo de Eldria',
                    'Bazar Subterrâneo',
                    'Criptas Mecânicas',
                    'Desfiladeiro Selvagem',
                    'Torre do Éter Corrompido',
                  ].map((env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => setHookEnvironment(env)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-sans transition ${
                        hookEnvironment === env
                          ? 'bg-amber-400 text-zinc-950 font-bold border border-amber-300 shadow'
                          : 'bg-purple-950/50 hover:bg-purple-900/70 border border-purple-800/60 text-purple-300'
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tom da Side-Quest */}
              <div>
                <label className="block text-xs font-cinzel font-bold text-amber-200 mb-1.5">
                  Tom da Aventura:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Sombrio & Misterioso',
                    'Combate & Perigo Extremo',
                    'Intriga Arcana',
                    'Sobrevivência & Fuga',
                    'Exploração e Relíquias',
                  ].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setHookTone(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-sans transition ${
                        hookTone === t
                          ? 'bg-amber-400 text-zinc-950 font-bold border border-amber-300 shadow'
                          : 'bg-purple-950/50 hover:bg-purple-900/70 border border-purple-800/60 text-purple-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detalhes Adicionais Opcionais */}
              <div className="md:col-span-2">
                <label className="block text-xs font-cinzel font-bold text-zinc-300 mb-1">
                  Detalhes Especiais ou Intenção do Mestre (Opcional):
                </label>
                <input
                  type="text"
                  value={hookCustomPrompt}
                  onChange={(e) => setHookCustomPrompt(e.target.value)}
                  placeholder="Ex: Conectar com o passado do guerreiro, incluir monstros do Bestiário, recompensa em Cybermoedas..."
                  className="w-full bg-zinc-950 border border-purple-900/80 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Feedback Message */}
            {hookFeedback && (
              <div
                className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  hookFeedback.type === 'success'
                    ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                    : 'bg-red-950/70 border-red-500/60 text-red-200'
                }`}
              >
                <span>{hookFeedback.type === 'success' ? '✨' : '⚠️'}</span>
                <span>{hookFeedback.text}</span>
              </div>
            )}

            {/* Botão de Disparo */}
            <div className="mt-4 pt-4 border-t border-purple-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-zinc-400 font-sans">
                💡 O Gemini formulará ganchos com ameaças e tesouros balanceados para <strong>Nível {overridePartyLevel}</strong>.
              </div>

              <button
                type="button"
                onClick={() => handleGenerateQuestHooks()}
                disabled={isGeneratingHooks}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-zinc-950 font-cinzel font-bold text-xs shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 disabled:opacity-50 transition transform active:scale-95"
              >
                {isGeneratingHooks ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Conjurando Ideias com Gemini...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-zinc-950" />
                    <span>Gerar 3 Ganchos de Aventura (Nível {overridePartyLevel})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Ganchos Gerados */}
          {questHooks.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-cinzel font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <ScrollText className="w-4 h-4 text-amber-400" />
                  <span>Ganchos de Aventura Disponíveis ({questHooks.length})</span>
                </h4>
                <span className="text-[11px] text-zinc-400 font-mono">
                  Calibrados para Nível Médio {overridePartyLevel}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {questHooks.map((hook) => {
                  const isCopied = hookCopiedId === hook.id;
                  const isSaved = savedHooks.some((h) => h.id === hook.id);

                  // Categoria cores
                  const categoryBadgeColor =
                    hook.category === 'Combate'
                      ? 'bg-red-950/80 text-red-300 border-red-500/50'
                      : hook.category === 'Investigação'
                      ? 'bg-blue-950/80 text-blue-300 border-blue-500/50'
                      : hook.category === 'Arcano'
                      ? 'bg-purple-950/80 text-purple-300 border-purple-500/50'
                      : hook.category === 'Sobrevivência'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                      : hook.category === 'Resgate'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                      : 'bg-violet-950/80 text-violet-300 border-violet-500/50';

                  return (
                    <div
                      key={hook.id}
                      className="rounded-2xl border border-purple-900/60 bg-gradient-to-b from-[#150d24] via-[#0e0918] to-[#090610] p-4 flex flex-col justify-between shadow-xl relative group hover:border-amber-500/50 transition-all"
                    >
                      <div>
                        {/* Badges de Categoria e Nível */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${categoryBadgeColor}`}
                          >
                            {hook.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-amber-300 font-mono text-[10px]">
                            {hook.recommendedLevel}
                          </span>
                        </div>

                        {/* Título */}
                        <h5 className="text-sm font-cinzel font-bold text-amber-200 group-hover:text-amber-300 transition leading-snug">
                          {hook.title}
                        </h5>

                        {/* Localização */}
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-1 font-mono">
                          <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="truncate">{hook.location}</span>
                        </div>

                        {/* Sinopse */}
                        <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed font-sans border-t border-white/5 pt-2">
                          {hook.synopsis}
                        </p>

                        {/* Ameaça Principal */}
                        <div className="mt-3 p-2 rounded-xl bg-black/40 border border-red-900/30 text-[11px]">
                          <div className="text-[9px] uppercase font-cinzel font-bold text-red-400 flex items-center gap-1">
                            <Skull className="w-3 h-3 text-red-400" />
                            <span>Ameaça Principal</span>
                          </div>
                          <div className="text-zinc-200 mt-0.5 font-sans font-medium">
                            {hook.threat}
                          </div>
                        </div>

                        {/* Reviravolta / Clímax */}
                        <div className="mt-2 p-2 rounded-xl bg-purple-950/30 border border-purple-800/40 text-[11px]">
                          <div className="text-[9px] uppercase font-cinzel font-bold text-amber-300 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>Reviravolta / Clímax</span>
                          </div>
                          <div className="text-purple-200/90 mt-0.5 font-sans italic text-[11px]">
                            &ldquo;{hook.climaxOrTwist}&rdquo;
                          </div>
                        </div>

                        {/* Recompensas Estimadas */}
                        <div className="mt-3 p-2 rounded-xl bg-black/50 border border-amber-500/20 text-[11px] font-mono space-y-1">
                          <div className="text-[9px] uppercase font-cinzel font-bold text-amber-400/90">
                            Recompensas Sugeridas:
                          </div>
                          <div className="flex items-center justify-between text-zinc-200">
                            <span className="flex items-center gap-1 text-amber-300 font-bold">
                              <Coins className="w-3 h-3" />
                              <span>{hook.rewards.coinsAmount} {hook.rewards.currency}</span>
                            </span>
                            <span className="text-purple-300 font-bold">
                              +{hook.rewards.exp} XP
                            </span>
                          </div>
                          {hook.rewards.suggestedItemDrop && (
                            <div className="text-[10px] text-zinc-400 truncate pt-1 border-t border-white/5 font-sans">
                              🎁 Espólio: <strong className="text-zinc-200">{hook.rewards.suggestedItemDrop}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ações Rápidas do Mestre */}
                      <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyHook(hook)}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-200 text-[11px] font-cinzel font-bold flex items-center justify-center gap-1 transition"
                            title="Copiar texto completo para a área de transferência"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-300">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-zinc-400" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleSaveHook(hook)}
                            className={`p-1.5 rounded-lg border text-xs transition ${
                              isSaved
                                ? 'bg-amber-400 text-zinc-950 border-amber-300'
                                : 'bg-zinc-850 text-zinc-400 hover:text-white border-zinc-700'
                            }`}
                            title={isSaved ? 'Remover dos favoritos' : 'Fixar missão'}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUseRewardFromHook(hook)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-200 hover:text-white text-[11px] font-cinzel font-bold flex items-center justify-center gap-1.5 transition"
                          title="Carregar estas moedas e EXP na aba de Premiar Jogadores"
                        >
                          <Award className="w-3 h-3 text-amber-400" />
                          <span>Premiar Mesa com este Espólio</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-purple-900/60 bg-purple-950/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                <Compass className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-cinzel font-bold text-amber-300">
                Nenhum Gancho Conjurado Ainda
              </h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto font-sans">
                Clique no botão <strong>&ldquo;Gerar 3 Ganchos de Aventura&rdquo;</strong> acima para conjurar side-quests temáticas calculadas para a força atual do seu grupo de aventureiros.
              </p>
            </div>
          )}

          {/* Missões Fixadas / Salvas */}
          {savedHooks.length > 0 && (
            <div className="mt-6 p-4 rounded-2xl border border-amber-500/30 bg-black/40 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-cinzel font-bold text-amber-300 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>Missões Fixadas pelo Mestre ({savedHooks.length})</span>
                </h5>
                <button
                  type="button"
                  onClick={() => setSavedHooks([])}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 font-sans"
                >
                  Limpar Todas
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {savedHooks.map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 rounded-xl bg-zinc-900/60 border border-purple-900/40 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-cinzel font-bold text-amber-200">{h.title}</div>
                      <div className="text-[10px] text-zinc-400">{h.location} &bull; {h.recommendedLevel}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSaveHook(h)}
                      className="text-zinc-500 hover:text-red-400 text-xs p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. NÍVEIS & PROGRESSÃO (XP & CAPACIDADE ESCALÁVEL) */}
      {activeSubTab === 'progression' && (
        <div className="rounded-xl border border-purple-900/50 bg-[#120b22] p-5 space-y-5">
          {/* Header com Resumo Global */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-purple-900/40">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-cinzel font-bold text-amber-200">
                  Tabela Oficial de Progressão de Níveis &amp; Capacidade Escalável de Inventário
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
                Vincule explicitamente os <strong>limites de XP Total Acumulado</strong> necessários para alcançar cada nível e configure as <strong>capacidades de inventário escaláveis (em peso máximo kg e slots equivalentes)</strong>. Todas as alterações são sincronizadas em tempo real com as fichas e mochilas dos jogadores da campanha.
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={handleSaveProgression}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-cinzel font-bold text-xs shadow-lg shadow-amber-950/40 flex items-center gap-2 transition hover:scale-[1.02]"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Tabela de Progressão</span>
              </button>
            </div>
          </div>

          {/* Feedback Toast */}
          {progressionFeedback && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-cinzel ${
                progressionFeedback.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/80 border-red-500/50 text-red-200'
              }`}
            >
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{progressionFeedback.text}</span>
            </div>
          )}

          {/* Cartões de Panorama & Métricas da Campanha */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-purple-900/50 bg-black/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center text-purple-300 shrink-0">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] font-cinzel uppercase text-zinc-400 block font-semibold">
                  Teto Máximo (Nível 20)
                </span>
                <span className="text-sm font-mono font-bold text-amber-300">
                  {cumulativeXpMap[20].toLocaleString('pt-BR')} XP Total
                </span>
                <span className="text-[10px] text-zinc-500 block">
                  Requer +{progressionXp[20] || 5000} XP além do Nv 19
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-purple-900/50 bg-black/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center text-sky-300 shrink-0">
                <Backpack className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <span className="text-[10px] font-cinzel uppercase text-zinc-400 block font-semibold">
                  Bônus Escalável no Nv. 20
                </span>
                <span className="text-sm font-mono font-bold text-sky-300">
                  +{progressionCapacity[20] || 40} kg de Mochila
                </span>
                <span className="text-[10px] text-zinc-500 block">
                  ~+{Math.round((progressionCapacity[20] || 40) / 2)} slots de inventário extras
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-purple-900/50 bg-black/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center text-emerald-300 shrink-0">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-cinzel uppercase text-zinc-400 block font-semibold">
                  Aventureiros na Sala
                </span>
                <span className="text-sm font-mono font-bold text-emerald-300">
                  {campaign.players.length} Personagem(ns)
                </span>
                <span className="text-[10px] text-zinc-500 truncate block">
                  {campaign.players.map((p) => `${p.name} (Nv ${p.level})`).join(', ') || 'Nenhum cadastrado'}
                </span>
              </div>
            </div>
          </div>

          {/* Curvas Pré-definidas / Presets e Ferramentas de Escala Rápida */}
          <div className="p-4 rounded-xl border border-purple-900/40 bg-zinc-950/70 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="text-[11px] font-cinzel font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Presets Oficiais de Progressão de XP</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-sans">
                Selecione uma curva padrão para preencher automaticamente
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleApplyProgressionPreset('classic')}
                className="p-2.5 rounded-lg border border-purple-800/60 bg-purple-950/40 hover:bg-purple-900/50 text-left transition hover:scale-[1.01]"
              >
                <div className="text-xs font-cinzel font-bold text-amber-300">Nexaria Clássica</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">100 a 5.000 XP &bull; +2 kg/nível</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyProgressionPreset('linear')}
                className="p-2.5 rounded-lg border border-purple-800/60 bg-purple-950/40 hover:bg-purple-900/50 text-left transition hover:scale-[1.01]"
              >
                <div className="text-xs font-cinzel font-bold text-sky-300">Linear (100x Nível)</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">100, 200, 300 XP &bull; +2 kg/nível</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyProgressionPreset('dnd5e')}
                className="p-2.5 rounded-lg border border-purple-800/60 bg-purple-950/40 hover:bg-purple-900/50 text-left transition hover:scale-[1.01]"
              >
                <div className="text-xs font-cinzel font-bold text-emerald-300">D&amp;D 5e Épico</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Escala alta oficial &bull; +3 kg/nível</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyProgressionPreset('fast')}
                className="p-2.5 rounded-lg border border-purple-800/60 bg-purple-950/40 hover:bg-purple-900/50 text-left transition hover:scale-[1.01]"
              >
                <div className="text-xs font-cinzel font-bold text-rose-300">Acelerada / Fast Play</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Subidas rápidas &bull; +3 kg/nível</div>
              </button>
            </div>

            {/* Ajustes Rápidos em Massa de Inventário e XP */}
            <div className="pt-3 border-t border-purple-900/30 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Escala de Capacidade de Inventário */}
              <div className="p-3 rounded-lg bg-black/40 border border-sky-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-cinzel font-bold text-sky-300 flex items-center gap-1">
                    <Scale className="w-3 h-3 text-sky-400" />
                    <span>Escalar Capacidade da Mochila / Nível:</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleScaleInventoryStep(1)}
                    className="px-2 py-1 rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-[10px] text-sky-200 transition"
                  >
                    +1 kg/nível (~0.5 slots)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScaleInventoryStep(2)}
                    className="px-2 py-1 rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-[10px] text-sky-200 font-bold transition"
                  >
                    +2 kg/nível (+1 slot)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScaleInventoryStep(3)}
                    className="px-2 py-1 rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-[10px] text-sky-200 transition"
                  >
                    +3 kg/nível (~1.5 slots)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScaleInventoryStep(4)}
                    className="px-2 py-1 rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-[10px] text-sky-200 transition"
                  >
                    +4 kg/nível (+2 slots)
                  </button>
                </div>
              </div>

              {/* Escala Rápida de Multiplicador de XP */}
              <div className="p-3 rounded-lg bg-black/40 border border-amber-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-cinzel font-bold text-amber-300 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-amber-400" />
                    <span>Escalar Curva Linear de XP / Nível:</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleScaleXpStep(50)}
                    className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-[10px] text-amber-200 transition"
                  >
                    50x por nível
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScaleXpStep(100)}
                    className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-[10px] text-amber-200 font-bold transition"
                  >
                    100x por nível
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScaleXpStep(200)}
                    className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-[10px] text-amber-200 transition"
                  >
                    200x por nível
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScaleXpStep(500)}
                    className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-[10px] text-amber-200 transition"
                  >
                    500x por nível
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Níveis 1 a 20 com Limites Explícitos de XP Total e Capacidade Escalável */}
          <div className="border border-purple-900/50 rounded-2xl overflow-hidden bg-black/60 shadow-xl">
            <div className="p-3 bg-[#180e2d] border-b border-purple-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-cinzel font-bold text-amber-200">
                  Progressão Detalhada: Nível 1 ao 20 (Limites de XP Total e Carga Escalável)
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-sans">
                💡 Nota: <strong>1 slot de inventário</strong> equivale convencionalmente a <strong>2 kg</strong> de carga máxima.
              </span>
            </div>

            <div className="overflow-x-auto max-h-[580px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#120822] text-amber-300 font-cinzel sticky top-0 z-10 border-b border-purple-900/50 text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Nível</th>
                    <th className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <span>XP Total Acumulado (Limite do Nível)</span>
                        <Info className="w-3 h-3 text-amber-400/80" />
                      </div>
                    </th>
                    <th className="py-3 px-3">XP do Nível (Delta p/ Subir)</th>
                    <th className="py-3 px-3">Capacidade Escalável (Peso Máx &amp; Slots)</th>
                    <th className="py-3 px-3">Carga Prevista (FOR 10 + Classe)</th>
                    <th className="py-3 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-950/40 font-mono">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => {
                    const xpDelta = progressionXp[lvl] ?? 100;
                    const cumulativeTotal = cumulativeXpMap[lvl] ?? 0;
                    const capBonus = progressionCapacity[lvl] ?? 0;
                    const slotsBonus = Math.round(capBonus / 2);
                    const estimatedTotalCapacity = 50 + 10 + capBonus; // Base FOR 10 (50kg) + Classe média (10kg) + Bônus de nível

                    // Personagens nesta sala que estão neste nível
                    const playersAtLevel = campaign.players.filter((p) => (p.level || 1) === lvl);

                    // Patamar temático de RPG
                    const tierName =
                      lvl <= 4
                        ? 'Heroico Inicial'
                        : lvl <= 10
                        ? 'Veterano de Eldria'
                        : lvl <= 16
                        ? 'Campeão Planar'
                        : 'Lenda do Abismo';

                    return (
                      <tr
                        key={lvl}
                        className={`transition ${
                          playersAtLevel.length > 0
                            ? 'bg-amber-950/30 hover:bg-amber-950/40 ring-1 ring-amber-500/30'
                            : 'hover:bg-purple-950/30'
                        }`}
                      >
                        {/* Nível com Patamar */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-purple-950 to-zinc-950 border border-purple-700/60 text-amber-300 font-cinzel font-bold text-xs shadow-sm">
                              {lvl}
                            </span>
                            <div>
                              <div className="font-cinzel font-bold text-amber-200 text-xs">
                                Nível {lvl}
                              </div>
                              <div className="text-[9px] text-zinc-500 font-sans">
                                {tierName}
                              </div>
                              {playersAtLevel.length > 0 && (
                                <div className="mt-0.5 flex items-center gap-1">
                                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-zinc-950 text-[8px] font-bold font-sans flex items-center gap-0.5">
                                    👤 {playersAtLevel.map((p) => p.name).join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* XP Total Acumulado (Limite / Threshold de Nível) */}
                        <td className="py-2.5 px-3">
                          {lvl === 1 ? (
                            <div className="text-zinc-400 font-mono text-xs">
                              <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold inline-block">
                                0 XP Total
                              </span>
                              <span className="text-[10px] text-zinc-500 ml-2 font-sans">
                                (Ponto de partida inicial)
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <input
                                  type="number"
                                  min={cumulativeXpMap[lvl - 1] + 1}
                                  value={cumulativeTotal}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    handleSetCumulativeXp(lvl, val);
                                  }}
                                  className="w-32 bg-zinc-900 border border-amber-500/50 rounded-lg px-2.5 py-1 text-xs text-amber-300 focus:outline-none focus:border-amber-400 font-mono font-bold"
                                  title="Editar diretamente o limite de XP Total Acumulado para atingir este nível"
                                />
                              </div>
                              <span className="text-[10px] text-amber-400/80 font-sans">
                                Limite p/ Nv {lvl}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* XP Necessário no Nível (Delta) */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              step={10}
                              value={xpDelta}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 0);
                                setProgressionXp((prev) => ({ ...prev, [lvl]: val }));
                              }}
                              className="w-28 bg-zinc-900 border border-purple-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-purple-400 font-mono"
                            />
                            <span className="text-[10px] text-zinc-400 font-sans">
                              +{xpDelta} XP p/ Nv {lvl + 1}
                            </span>
                          </div>
                        </td>

                        {/* Capacidade Escalável de Inventário (Peso Máximo & Slots) */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={capBonus}
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value) || 0);
                                  setProgressionCapacity((prev) => ({ ...prev, [lvl]: val }));
                                }}
                                className="w-20 bg-zinc-900 border border-sky-800 rounded-lg px-2 py-1 text-xs text-sky-200 focus:outline-none focus:border-sky-400 font-mono font-bold"
                              />
                              <span className="text-[10px] text-sky-400 font-sans font-bold">kg</span>
                            </div>

                            <span className="px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-800 text-[10px] text-sky-300 font-mono font-semibold">
                              ~{slotsBonus} slot{slotsBonus !== 1 ? 's' : ''}
                            </span>

                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setProgressionCapacity((prev) => ({
                                    ...prev,
                                    [lvl]: Math.max(0, capBonus - 2),
                                  }));
                                }}
                                className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center justify-center font-bold"
                                title="-1 slot (-2 kg)"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setProgressionCapacity((prev) => ({
                                    ...prev,
                                    [lvl]: capBonus + 2,
                                  }));
                                }}
                                className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center justify-center font-bold"
                                title="+1 slot (+2 kg)"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Prévia de Carga Total Estimada */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 text-[11px] font-mono">
                            <span className="text-zinc-200 font-bold">
                              {estimatedTotalCapacity} kg
                            </span>
                            <span className="text-[10px] text-zinc-500 font-sans">
                              (~{Math.round(estimatedTotalCapacity / 2)} slots tot.)
                            </span>
                          </div>
                        </td>

                        {/* Ação de Restaurar Padrão */}
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setProgressionXp((prev) => ({
                                ...prev,
                                [lvl]: DEFAULT_XP_PER_LEVEL[lvl] || 100,
                              }));
                              setProgressionCapacity((prev) => ({
                                ...prev,
                                [lvl]: DEFAULT_INVENTORY_BONUS_PER_LEVEL[lvl] || 0,
                              }));
                            }}
                            className="px-2 py-1 text-[10px] text-zinc-400 hover:text-amber-300 hover:bg-purple-950/60 rounded border border-purple-900/40 transition"
                            title="Restaurar valores padrão originais para o Nível"
                          >
                            Padrão
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rodapé com Informações de Cálculo e Salvar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-purple-900/40">
            <div className="text-[11px] text-zinc-400 font-sans max-w-xl">
              💡 <strong>Regra de Cálculo Automático:</strong> Carga Máxima = <code>FOR &times; 5 kg + Bônus de Classe + <strong>Bônus Escalável do Nível configurado</strong> + Melhorias de Mochila</code>.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setProgressionXp({ ...DEFAULT_XP_PER_LEVEL });
                  setProgressionCapacity({ ...DEFAULT_INVENTORY_BONUS_PER_LEVEL });
                  setProgressionFeedback({
                    type: 'success',
                    text: 'Valores resetados para o padrão oficial de Nexaria.',
                  });
                }}
                className="px-3 py-1.5 rounded-lg border border-purple-900 bg-purple-950/40 hover:bg-purple-900/60 text-zinc-300 text-xs font-cinzel transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                <span>Restaurar Todos os Padrões</span>
              </button>
              <button
                type="button"
                onClick={handleSaveProgression}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-cinzel font-bold text-xs shadow-lg shadow-amber-950/40 flex items-center gap-1.5 transition hover:scale-[1.02]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Tabela de Progressão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6.5. PAINEL DE CONTROLE DE ÁUDIO AMBIENTE & TRILHAS TEMÁTICAS (EXCLUSIVO DO MESTRE) */}
      {activeSubTab === 'audio' && (
        <div className="space-y-6">
          {/* Main Audio Master Console Card */}
          <div className="rounded-2xl border border-purple-800/60 bg-gradient-to-b from-[#180d2d] via-[#100720] to-[#080410] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-900/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-900 border border-purple-400/60 flex items-center justify-center text-amber-300 shadow-xl shadow-purple-950/60 shrink-0">
                  <Music className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-cinzel font-black text-amber-300">
                      Console de Áudio Ambiente &amp; Trilhas Narrativas
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-cinzel font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" />
                      <span>Exclusivo do Mestre</span>
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 font-sans">
                    Selecione trilhas sonoras procedurais autenticamente sintetizadas para ambientar sessões e imergir os jogadores.
                  </p>
                </div>
              </div>

              {/* Master Volume & Controls */}
              <div className="flex items-center gap-3 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800 self-stretch sm:self-auto justify-between sm:justify-end">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => sound.setAmbientVolume(ambientAudioState.volume > 0 ? 0 : 0.65)}
                    className="p-1 rounded text-zinc-400 hover:text-amber-400 transition"
                    title="Silenciar / Ativar Volume"
                  >
                    {ambientAudioState.volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-amber-400" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ambientAudioState.volume}
                    onChange={(e) => sound.setAmbientVolume(parseFloat(e.target.value))}
                    className="w-24 sm:w-28 accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    title={`Volume da Trilha: ${Math.round(ambientAudioState.volume * 100)}%`}
                  />
                  <span className="text-xs font-mono font-bold text-amber-300 min-w-[35px]">
                    {Math.round(ambientAudioState.volume * 100)}%
                  </span>
                </div>

                {ambientAudioState.isPlaying && (
                  <button
                    type="button"
                    onClick={() => sound.stopAmbientTrack()}
                    className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-cinzel font-bold flex items-center gap-1.5 transition active:scale-95 shadow"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Silenciar Mesa</span>
                  </button>
                )}
              </div>
            </div>

            {/* Current Active Status Indicator */}
            <div className="mt-4 p-3.5 rounded-xl bg-purple-950/40 border border-purple-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full ${
                  ambientAudioState.isPlaying ? 'bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20' : 'bg-zinc-600'
                }`} />
                <div>
                  <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-mono">
                    Estado do Áudio:
                  </span>
                  <span className="text-sm font-cinzel font-bold text-zinc-100 flex items-center gap-2">
                    {ambientAudioState.isPlaying && ambientAudioState.trackId ? (
                      <>
                        <span className="text-amber-300">
                          {AMBIENT_TRACKS.find((t) => t.id === ambientAudioState.trackId)?.name || 'Trilha Ativa'}
                        </span>
                        <span className="text-xs text-zinc-400 font-normal font-sans">
                          ({AMBIENT_TRACKS.find((t) => t.id === ambientAudioState.trackId)?.tempo})
                        </span>
                      </>
                    ) : (
                      <span className="text-zinc-400 font-sans font-normal text-xs">
                        Nenhuma trilha sonora em execução no momento. Escolha uma abaixo para iniciar.
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {ambientAudioState.isPlaying && (
                <div className="flex items-center gap-1 h-6 px-3 py-1 rounded-lg bg-zinc-950/80 border border-purple-800/60">
                  <span className="w-1 h-3 bg-amber-400 animate-bounce" />
                  <span className="w-1 h-5 bg-amber-400 animate-bounce delay-75" />
                  <span className="w-1 h-2 bg-amber-400 animate-bounce delay-150" />
                  <span className="w-1 h-4 bg-amber-400 animate-bounce delay-100" />
                  <span className="w-1 h-3 bg-amber-400 animate-bounce delay-200" />
                  <span className="text-[10px] font-mono text-amber-300 ml-1.5 font-bold">AO VIVO</span>
                </div>
              )}
            </div>

            {/* Grid of Thematic Soundscapes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {AMBIENT_TRACKS.map((track) => {
                const isSelected = ambientAudioState.isPlaying && ambientAudioState.trackId === track.id;

                return (
                  <div
                    key={track.id}
                    className={`rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                      isSelected
                        ? 'border-amber-400 bg-gradient-to-b from-purple-950/90 to-[#120822] shadow-xl shadow-amber-950/30 scale-[1.02]'
                        : 'border-zinc-800/80 bg-zinc-950/70 hover:border-purple-700/60 hover:bg-zinc-900/60'
                    }`}
                  >
                    {/* Top Row: Icon + Mood */}
                    <div>
                      <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-zinc-800/60">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{track.icon}</span>
                          <div>
                            <h4 className="text-sm font-cinzel font-bold text-zinc-100 flex items-center gap-1.5">
                              <span>{track.name}</span>
                              {isSelected && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              )}
                            </h4>
                            <span className="text-[10px] text-zinc-400 font-sans block">
                              {track.subtitle}
                            </span>
                          </div>
                        </div>

                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono shrink-0">
                          {track.mood}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed font-sans mb-3 min-h-[48px]">
                        {track.description}
                      </p>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-zinc-400">
                        {track.tempo}
                      </span>

                      {isSelected ? (
                        <button
                          type="button"
                          onClick={() => sound.stopAmbientTrack()}
                          className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-cinzel font-bold flex items-center gap-1.5 transition active:scale-95 shadow"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          <span>Pausar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => sound.playAmbientTrack(track.id)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 text-xs font-cinzel font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-amber-950/40"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Tocar Trilha</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Master Dramatic Sound Effects Deck */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-cinzel font-bold text-amber-200">
                  Efeitos Sonoros Dramáticos de Narração (Disparo Imediato)
                </h4>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                Dispare durante descrições e revelações
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {[
                { label: 'Trovão & Raio', icon: '⚡', action: () => sound.playThunder(), color: 'hover:border-amber-400 text-amber-200' },
                { label: 'Rugido Abissal', icon: '🐉', action: () => sound.playMonsterRoar(), color: 'hover:border-red-400 text-red-200' },
                { label: 'Portão de Ferro', icon: '🚪', action: () => sound.playIronGate(), color: 'hover:border-zinc-400 text-zinc-200' },
                { label: 'Berrante de Guerra', icon: '📯', action: () => sound.playWarHorn(), color: 'hover:border-orange-400 text-orange-200' },
                { label: 'Rolagem de Dados', icon: '🎲', action: () => sound.playDiceRoll(), color: 'hover:border-emerald-400 text-emerald-200' },
                { label: 'Inscrição Rúnica', icon: '🔮', action: () => sound.playRuneChime(), color: 'hover:border-purple-400 text-purple-200' },
                { label: 'Brinde & Canecas', icon: '🍺', action: () => sound.playCoinReceived('ORO'), color: 'hover:border-yellow-400 text-yellow-200' },
                { label: 'Impacto de Combate', icon: '⚔️', action: () => sound.playMonsterHit(), color: 'hover:border-red-500 text-rose-200' },
                { label: 'Poção de Vitis', icon: '🧪', action: () => sound.playPotionDrink(), color: 'hover:border-teal-400 text-teal-200' },
                { label: 'Fanfarra de Triunfo', icon: '🎺', action: () => sound.playLevelUp(), color: 'hover:border-amber-300 text-amber-300' },
              ].map((sfx, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sfx.action()}
                  className={`p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800/90 flex items-center gap-2 text-xs font-cinzel font-semibold transition active:scale-95 shadow-sm ${sfx.color}`}
                >
                  <span className="text-base">{sfx.icon}</span>
                  <span className="truncate">{sfx.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. CONFIGURAÇÕES DA SALA & ESQUEMA DE CORES GLOBAL (APENAS MESTRE) */}
      {activeSubTab === 'settings' && (
        <div className="space-y-6">
          {/* Banner de Feedback de Alteração */}
          {themeFeedback && (
            <div className="p-4 rounded-xl border border-emerald-500/60 bg-emerald-950/80 text-emerald-200 text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-950/40 animate-in fade-in duration-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[3]" />
              <span className="font-semibold">{themeFeedback}</span>
            </div>
          )}

          {/* Card Principal: Esquema de Cores da Interface */}
          <div className="rounded-2xl border border-purple-900/60 bg-gradient-to-b from-[#180e2d] via-[#100820] to-[#080510] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-purple-900/50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-purple-950/90 border border-amber-500/60 flex items-center justify-center text-amber-400 shadow-lg shadow-purple-950/50 text-xl shrink-0">
                  <Palette className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-cinzel font-black text-amber-300">
                      Configurações da Sala &bull; Esquema de Cores Global
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-cinzel font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400" />
                      <span>Exclusivo do Mestre</span>
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 font-sans">
                    Escolha a identidade visual da sala. As classes CSS dinâmicas serão aplicadas globalmente em toda a interface.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800">
                <span>Tema Atual:</span>
                <strong className="text-amber-300 font-cinzel">
                  {ROOM_COLOR_SCHEMES[campaign.colorScheme || 'abismo_purpura']?.name || 'Abismo Púrpura'}
                </strong>
              </div>
            </div>

            {/* Grid dos 3 Esquemas de Cores Oficiais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              {(
                [
                  'abismo_purpura',
                  'forja_dourada',
                  'ruinas_elficas',
                ] as RoomColorScheme[]
              ).map((schemeId) => {
                const scheme = ROOM_COLOR_SCHEMES[schemeId];
                const isCurrent = (campaign.colorScheme || 'abismo_purpura') === schemeId;

                return (
                  <div
                    key={schemeId}
                    className={`rounded-2xl border transition-all duration-300 p-4 flex flex-col justify-between relative overflow-hidden ${
                      isCurrent
                        ? `${scheme.borderClass} ${scheme.badgeBg} shadow-2xl ${scheme.glowClass} scale-[1.02] ring-2 ring-amber-400/50`
                        : 'border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/60'
                    }`}
                  >
                    {/* Header do Card */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl p-2 rounded-xl bg-black/40 border border-white/10 shadow-inner">
                            {scheme.icon}
                          </span>
                          <div>
                            <h4 className="font-cinzel font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                              <span>{scheme.name}</span>
                            </h4>
                            <span className="text-[10px] text-zinc-400 font-sans">
                              {scheme.subtitle}
                            </span>
                          </div>
                        </div>

                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-cinzel font-black flex items-center gap-1 shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>ATIVO</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed font-sans mb-4">
                        {scheme.description}
                      </p>

                      {/* Swatches de Cores / Paleta */}
                      <div className="space-y-2 mb-4 p-2.5 rounded-xl bg-black/40 border border-white/5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                          Amostra da Paleta:
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-lg border border-white/20 shadow-sm"
                            style={{ backgroundColor: scheme.primaryColorHex }}
                            title={`Cor Primária: ${scheme.primaryColorHex}`}
                          />
                          <div
                            className="flex-1 h-6 rounded-lg border border-white/10"
                            style={{
                              background:
                                schemeId === 'abismo_purpura'
                                  ? 'linear-gradient(90deg, #120824, #a855f7, #f59e0b)'
                                  : schemeId === 'forja_dourada'
                                  ? 'linear-gradient(90deg, #221004, #f59e0b, #fbbf24)'
                                  : 'linear-gradient(90deg, #071d15, #10b981, #34d399)',
                            }}
                          />
                          <span className="font-mono text-[10px] text-zinc-400">
                            {scheme.primaryColorHex}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botão de Ação: Ativar Esquema */}
                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => handleSelectColorScheme(schemeId)}
                      className={`w-full py-2.5 px-4 rounded-xl font-cinzel font-bold text-xs flex items-center justify-center gap-2 transition ${
                        isCurrent
                          ? 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 cursor-default'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-lg shadow-amber-950/40 hover:scale-[1.02] cursor-pointer'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Esquema Ativo nesta Sala</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Aplicar {scheme.name}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Aviso Informativo & Impacto Global */}
            <div className="mt-5 p-3.5 rounded-xl border border-purple-800/40 bg-purple-950/30 flex items-start gap-3 text-xs text-purple-200/90 leading-relaxed font-sans">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 font-cinzel">Sincronização em Tempo Real:</strong> Ao selecionar um esquema de cores, a classe CSS correspondente (<code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 text-[11px] font-mono">theme-abismo-purpura</code>, <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 text-[11px] font-mono">theme-forja-dourada</code> ou <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 text-[11px] font-mono">theme-ruinas-elficas</code>) é aplicada no contêiner raiz da aplicação e propagada para todos os jogadores da sala.
              </div>
            </div>

            {/* Resumo da Sala do Mestre */}
            <div className="mt-4 pt-4 border-t border-purple-900/40 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Código da Sala</span>
                <strong className="text-amber-300 font-mono text-sm">{campaign.code}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Mestre da Mesa</span>
                <strong className="text-zinc-200 font-cinzel">{campaign.gmName}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Heróis Ativos</span>
                <strong className="text-zinc-200 font-mono text-sm">{campaign.players.length}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Crônicas Gravadas</span>
                <strong className="text-amber-400 font-mono text-sm">{campaign.chronicles?.length || 0}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Excluir Ficha pelo Mestre */}
      {charToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#1f0b15] via-[#14060e] to-[#0a0307] border border-rose-500/60 rounded-2xl shadow-2xl p-6 text-zinc-100">
            <div className="flex items-center gap-3 pb-3 border-b border-rose-900/40 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-950/70 border border-rose-600/50 flex items-center justify-center text-rose-400 shrink-0 shadow-md">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-cinzel font-bold text-rose-200">
                  Excluir Ficha ({charToDelete.name})
                </h3>
                <p className="text-xs text-zinc-400">
                  Exclusão de aventureiro pelo Mestre
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 mb-5 leading-relaxed">
              Tem certeza de que deseja remover permanentemente a ficha de <strong className="text-rose-300 font-semibold">{charToDelete.name}</strong> ({charToDelete.characterClass} Nível {charToDelete.level}) da sala <strong>{campaign.code}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCharToDelete(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-700 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = charToDelete.id;
                  setCharToDelete(null);
                  if (onDeleteCharacter) {
                    onDeleteCharacter(id);
                  } else {
                    onUpdateCampaign({
                      ...campaign,
                      players: campaign.players.filter((p) => p.id !== id),
                    });
                  }
                  sound.playCoinClink('BRZ');
                }}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
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
