import React, { useState } from 'react';
import {
  CampaignRoom,
  CurrencyType,
  CURRENCY_CONFIGS,
  calculateTotalNetWorthInBRZ,
  ShopItem,
} from '../types/rpg';
import { TransactionAnimationData } from '../types/animation';
import { CoinVisual } from './CoinVisual';
import { sound } from '../utils/audio';
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
  onTriggerAnimation,
  onAwardExp,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'rewards' | 'bills' | 'market' | 'players'>(
    'rewards'
  );

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
                          {char.race} • {char.characterClass} (Nv {char.level})
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
    </div>
  );
};
