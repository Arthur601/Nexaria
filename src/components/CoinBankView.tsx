import React, { useState } from 'react';
import {
  CharacterSheet,
  CurrencyType,
  CURRENCY_CONFIGS,
  calculateTotalNetWorthInBRZ,
  CampaignRoom,
} from '../types/rpg';
import { TransactionAnimationData } from '../types/animation';
import { CoinVisual } from './CoinVisual';
import { sound } from '../utils/audio';
import {
  Coins,
  ArrowRightLeft,
  Send,
  Sparkles,
  Info,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  PlayCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CoinBankViewProps {
  campaign: CampaignRoom;
  activeCharacter: CharacterSheet | null;
  onExecuteTransaction: (params: {
    receiverId: string;
    receiverName: string;
    amount: number;
    currency: CurrencyType;
    reason: string;
  }) => { success: boolean; message: string };
  onConvertCurrency: (
    fromCurrency: CurrencyType,
    toCurrency: CurrencyType,
    amount: number
  ) => { success: boolean; message: string };
  onPayRequest: (requestId: string) => { success: boolean; message: string };
  onTriggerAnimation?: (data: TransactionAnimationData) => void;
}

export const CoinBankView: React.FC<CoinBankViewProps> = ({
  campaign,
  activeCharacter,
  onExecuteTransaction,
  onConvertCurrency,
  onPayRequest,
  onTriggerAnimation,
}) => {
  // Exchange state
  const [fromCurr, setFromCurr] = useState<CurrencyType>('BRZ');
  const [toCurr, setToCurr] = useState<CurrencyType>('PRT');
  const [convertAmount, setConvertAmount] = useState<number>(10);
  const [exchangeFeedback, setExchangeFeedback] = useState<{ success: boolean; text: string } | null>(null);

  // Direct transfer to GM state
  const [directCurrency, setDirectCurrency] = useState<CurrencyType>('BRZ');
  const [directAmount, setDirectAmount] = useState<number>(10);
  const [directReason, setDirectReason] = useState<string>('🍺 Pagamento da Taverna');
  const [transferFeedback, setTransferFeedback] = useState<{ success: boolean; text: string } | null>(null);

  const characterBalance = activeCharacter ? activeCharacter.wallet : campaign.startingWallet;
  const totalNetWorth = calculateTotalNetWorthInBRZ(characterBalance);

  // Conversion rates
  const fromRate = CURRENCY_CONFIGS[fromCurr].unitValueInBRZ;
  const toRate = CURRENCY_CONFIGS[toCurr].unitValueInBRZ;
  const estimatedResult = Math.floor((convertAmount * fromRate) / toRate);
  const costUsed = (estimatedResult * toRate) / fromRate;

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCharacter) {
      setExchangeFeedback({ success: false, text: 'Selecione ou crie um personagem primeiro.' });
      return;
    }

    const currentFromBal = activeCharacter.wallet[fromCurr] || 0;
    if (convertAmount > currentFromBal) {
      if (onTriggerAnimation) {
        onTriggerAnimation({
          id: 'anim-' + Date.now(),
          type: 'insufficient_funds',
          currency: fromCurr,
          amount: convertAmount,
          currentBalance: currentFromBal,
          shortage: convertAmount - currentFromBal,
          senderName: activeCharacter.name,
          receiverName: 'Banco de Câmbio de Nexaria',
          reason: `Conversão cambial de ${convertAmount} ${fromCurr} em ${toCurr}`,
          timestamp: Date.now(),
        });
      }
      setExchangeFeedback({
        success: false,
        text: `Saldo insuficiente! Você só possui ${currentFromBal} ${fromCurr}.`,
      });
      return;
    }

    const res = onConvertCurrency(fromCurr, toCurr, convertAmount);
    setExchangeFeedback({ success: res.success, text: res.message });
    if (res.success) {
      if (onTriggerAnimation) {
        onTriggerAnimation({
          id: 'anim-' + Date.now(),
          type: 'receiving',
          currency: toCurr,
          amount: estimatedResult,
          senderName: 'Casa de Câmbio Nexariana',
          receiverName: activeCharacter.name,
          reason: `Câmbio efetuado (${convertAmount} ${fromCurr} → ${estimatedResult} ${toCurr})`,
          timestamp: Date.now(),
        });
      } else {
        sound.playCoinClink(toCurr);
        confetti({
          particleCount: 25,
          spread: 50,
          origin: { y: 0.6 },
        });
      }
    } else {
      if (onTriggerAnimation && res.message.toLowerCase().includes('saldo')) {
        onTriggerAnimation({
          id: 'anim-' + Date.now(),
          type: 'insufficient_funds',
          currency: fromCurr,
          amount: convertAmount,
          currentBalance: currentFromBal,
          shortage: Math.max(0, convertAmount - currentFromBal),
          senderName: activeCharacter.name,
          receiverName: 'Banco de Câmbio',
          reason: 'Conversão de Moedas',
          timestamp: Date.now(),
        });
      }
    }
  };

  const handleDirectPayGM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCharacter) {
      setTransferFeedback({ success: false, text: 'Selecione um personagem para pagar o Mestre.' });
      return;
    }

    const currentBal = activeCharacter.wallet[directCurrency] || 0;
    if (directAmount > currentBal) {
      if (onTriggerAnimation) {
        onTriggerAnimation({
          id: 'anim-' + Date.now(),
          type: 'insufficient_funds',
          currency: directCurrency,
          amount: directAmount,
          currentBalance: currentBal,
          shortage: directAmount - currentBal,
          senderName: activeCharacter.name,
          receiverName: campaign.gmName,
          reason: directReason || 'Pagamento ao Mestre do Jogo',
          timestamp: Date.now(),
        });
      }
      setTransferFeedback({
        success: false,
        text: `Saldo insuficiente! Você possui apenas ${currentBal} ${directCurrency}.`,
      });
      return;
    }

    const res = onExecuteTransaction({
      receiverId: 'gm',
      receiverName: campaign.gmName,
      amount: directAmount,
      currency: directCurrency,
      reason: directReason || 'Pagamento ao Mestre do Jogo',
    });

    setTransferFeedback({ success: res.success, text: res.message });
    if (res.success) {
      if (onTriggerAnimation) {
        onTriggerAnimation({
          id: 'anim-' + Date.now(),
          type: 'sending',
          currency: directCurrency,
          amount: directAmount,
          senderName: activeCharacter.name,
          receiverName: campaign.gmName,
          reason: directReason || 'Pagamento ao Mestre',
          timestamp: Date.now(),
        });
      } else {
        sound.playSuccessFanfare();
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#eab308', '#cd7f32', '#06b6d4'],
        });
      }
    } else {
      if (onTriggerAnimation && res.message.toLowerCase().includes('saldo')) {
        onTriggerAnimation({
          id: 'anim-' + Date.now(),
          type: 'insufficient_funds',
          currency: directCurrency,
          amount: directAmount,
          currentBalance: currentBal,
          shortage: Math.max(0, directAmount - currentBal),
          senderName: activeCharacter.name,
          receiverName: campaign.gmName,
          reason: directReason,
          timestamp: Date.now(),
        });
      }
    }
  };

  // Pending requests for this character
  const myPendingRequests = campaign.paymentRequests.filter(
    (req) =>
      req.status === 'pending' &&
      (req.targetCharacterId === 'all' || req.targetCharacterId === activeCharacter?.id)
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Pending Payment Requests from Master */}
      {myPendingRequests.length > 0 && (
        <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-4 text-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-950 border border-red-800 flex items-center justify-center text-red-400 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-red-200 text-sm">
                Cobrança Pendente do Mestre ({campaign.gmName})
              </h4>
              <p className="text-xs text-zinc-400">
                {myPendingRequests[0].reason} — Valor:{' '}
                <strong className="text-zinc-200 font-mono">
                  {myPendingRequests[0].amount} {myPendingRequests[0].currency}
                </strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const req = myPendingRequests[0];
              const curBal = activeCharacter ? activeCharacter.wallet[req.currency] || 0 : 0;
              const res = onPayRequest(req.id);
              if (res.success) {
                if (onTriggerAnimation && activeCharacter) {
                  onTriggerAnimation({
                    id: 'anim-' + Date.now(),
                    type: 'sending',
                    currency: req.currency,
                    amount: req.amount,
                    senderName: activeCharacter.name,
                    receiverName: campaign.gmName,
                    reason: req.reason,
                    timestamp: Date.now(),
                  });
                } else {
                  sound.playSuccessFanfare();
                }
              } else {
                if (onTriggerAnimation && activeCharacter) {
                  onTriggerAnimation({
                    id: 'anim-' + Date.now(),
                    type: 'insufficient_funds',
                    currency: req.currency,
                    amount: req.amount,
                    currentBalance: curBal,
                    shortage: Math.max(0, req.amount - curBal),
                    senderName: activeCharacter.name,
                    receiverName: campaign.gmName,
                    reason: req.reason,
                    timestamp: Date.now(),
                  });
                } else {
                  sound.playInsufficientBalance();
                }
              }
            }}
            className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-lg transition shrink-0"
          >
            Pagar Cobrança Agora
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* DEMONSTRAÇÃO DE ANIMAÇÕES DE TRANSAÇÃO */}
      {/* ============================================================ */}
      {onTriggerAnimation && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-zinc-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-zinc-200">
                  Demonstração de Animações de Transação
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Visualize instantaneamente as animações de envio, recebimento e saldo insuficiente.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  onTriggerAnimation({
                    id: 'test-send-' + Date.now(),
                    type: 'sending',
                    currency: 'ORO',
                    amount: 25,
                    senderName: activeCharacter ? activeCharacter.name : 'Aventureiro',
                    receiverName: campaign.gmName || 'Mestre do Jogo',
                    reason: 'Compra de Espada Rúnica',
                    timestamp: Date.now(),
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-sky-300 font-medium flex items-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5 text-sky-400" />
                <span>Testar Envio</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onTriggerAnimation({
                    id: 'test-receive-' + Date.now(),
                    type: 'receiving',
                    currency: 'ORO',
                    amount: 100,
                    senderName: campaign.gmName || 'Mestre do Jogo',
                    receiverName: activeCharacter ? activeCharacter.name : 'Aventureiro',
                    reason: 'Recompensa por derrotar o Guardião do Templo',
                    timestamp: Date.now(),
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-emerald-300 font-medium flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Testar Recebimento</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const curr = 'ORO';
                  const curBal = activeCharacter ? activeCharacter.wallet[curr] || 0 : 5;
                  const attempted = curBal + 50;
                  onTriggerAnimation({
                    id: 'test-insuff-' + Date.now(),
                    type: 'insufficient_funds',
                    currency: curr,
                    amount: attempted,
                    currentBalance: curBal,
                    shortage: 50,
                    senderName: activeCharacter ? activeCharacter.name : 'Aventureiro',
                    receiverName: 'Ferreiro Anão de Nexaria',
                    reason: 'Forja de Armadura Completa de Mitral',
                    timestamp: Date.now(),
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-800/80 text-xs text-red-300 font-medium flex items-center gap-1.5 transition"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Testar Saldo Insuficiente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. SISTEMA MONETÁRIO DE RPG — MOEDAS DE NEXARIA */}
      {/* ============================================================ */}
      <div className="rounded-2xl border border-amber-600/30 bg-gradient-to-b from-purple-950/40 via-[#0e0a1a]/95 to-zinc-950/90 p-5 sm:p-6 text-zinc-100 shadow-xl relative overflow-hidden">
        {/* Adornos sutis nos cantos */}
        <div className="absolute top-2 left-2 text-amber-500/30 text-xs font-cinzel select-none">✦</div>
        <div className="absolute top-2 right-2 text-amber-500/30 text-xs font-cinzel select-none">✦</div>

        {/* Header */}
        <div className="pb-4 mb-5 border-b border-purple-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-cinzel tracking-widest text-amber-400 uppercase">
              ✦ Câmbio &amp; Moedas Oficiais do Jogo ✦
            </div>
            <h2 className="text-lg sm:text-2xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 tracking-wide">
              MOEDAS DE NEXARIA — O LEGADO DO ABISMO
            </h2>
            <p className="text-xs text-purple-200/80 mt-0.5 font-sans">
              Cada moeda possui valor intrínseco garantido pelo vórtice, com estrela rúnica na face e monograma &ldquo;N&rdquo; no reverso.
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded bg-zinc-950/70 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>Saldo Protegido: inalterável manualmente, atualizado via transações e recompensas</span>
            </div>
          </div>
          {activeCharacter && (
            <div className="text-left sm:text-right p-2.5 rounded-xl border border-amber-500/30 bg-amber-950/30">
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">Patrimônio Total:</span>
              <span className="font-mono text-sm font-bold text-amber-300">
                {calculateTotalNetWorthInBRZ(activeCharacter.wallet).toLocaleString('pt-BR')} BRZ
              </span>
            </div>
          )}
        </div>

        {/* The 5 Denominations Display (Bronze, Prata, Ouro, Platina, Cybermoedas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {(['BRZ', 'PRT', 'ORO', 'PLN', 'CYB'] as CurrencyType[]).map((curr) => {
            const cfg = CURRENCY_CONFIGS[curr];
            const balance = characterBalance[curr] || 0;

            return (
              <div
                key={curr}
                className="rounded-xl border border-purple-900/50 bg-[#120b22]/70 hover:bg-[#190f30]/90 p-4 flex flex-col justify-between text-left transition-all hover:border-amber-500/60 shadow-lg group"
              >
                <div>
                  {/* Coin header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-cinzel font-bold uppercase tracking-wide text-amber-200">
                      {cfg.name}
                    </span>
                    <CoinVisual type={curr} size="md" interactiveFlip />
                  </div>

                  <div className="mb-2">
                    <span className="text-base font-mono font-bold text-zinc-100">
                      {cfg.code}
                    </span>
                    <span className="text-[11px] text-amber-400/90 ml-1.5 font-mono">
                      = {cfg.unitValueInBRZ.toLocaleString('pt-BR')} BRZ
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-3 font-sans">
                    {cfg.description}
                  </p>
                </div>

                {/* Wallet Balance Pill */}
                <div className="pt-2.5 border-t border-purple-900/40 flex items-center justify-between text-xs">
                  <span className="text-purple-300/80 text-[11px] font-sans">
                    Na Bolsa:
                  </span>
                  <span className="font-mono font-bold text-xs text-amber-300">
                    {balance} {cfg.code}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Details & Lore Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-4 border-t border-zinc-800 text-xs">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-purple-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h5 className="font-medium text-zinc-200 text-xs">
                Pedra do Abismo
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed mt-0.5">
                Incisão central em cada moeda, simbolizando valor intrínseco e autenticidade contra fraudes.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <h5 className="font-medium text-zinc-200 text-xs">
                Runas Antigas & Bordas
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed mt-0.5">
                Micromagia e bordas de contenção forjadas para garantir circulação segura entre guildas.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-cyan-400">
              <Info className="w-3.5 h-3.5" />
            </div>
            <div>
              <h5 className="font-medium text-zinc-200 text-xs">
                Cybermoedas (5.000 BRZ)
              </h5>
              <p className="text-zinc-400 text-[11px] leading-relaxed mt-0.5">
                Moeda tecnomágica de ponta para artefatos avançados, portais e contratos de alto escalão.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. TRANSAÇÃO DIRETA PARA O MESTRE & CÂMBIO DE MOEDAS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT: Pagar Diretamente ao Mestre */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-zinc-800">
              <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400">
                <Send className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100 text-sm">
                  Pagar ao Mestre ({campaign.gmName})
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Envie fundos da sua bolsa diretamente para a reserva da campanha.
                </p>
              </div>
            </div>

            <form onSubmit={handleDirectPayGM} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Moeda
                  </label>
                  <select
                    value={directCurrency}
                    onChange={(e) => {
                      const c = e.target.value as CurrencyType;
                      setDirectCurrency(c);
                      sound.playCoinClink(c);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                  >
                    <option value="BRZ">Bronze (BRZ)</option>
                    <option value="PRT">Prata (PRT)</option>
                    <option value="ORO">Ouro (ORO)</option>
                    <option value="PLN">Platina (PLN)</option>
                    <option value="CYB">Cybermoeda (CYB)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={directAmount}
                    onChange={(e) => setDirectAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs font-mono font-semibold text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Motivo da Transação
                </label>
                <input
                  type="text"
                  value={directReason}
                  onChange={(e) => setDirectReason(e.target.value)}
                  placeholder="Ex: Hospedagem, Suborno, Compra de suprimentos..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600"
                />
              </div>

              {transferFeedback && (
                <div
                  className={`p-2 rounded-md text-xs flex items-center gap-1.5 ${
                    transferFeedback.success
                      ? 'bg-emerald-950/40 border border-emerald-800/80 text-emerald-300'
                      : 'bg-red-950/40 border border-red-800/80 text-red-300'
                  }`}
                >
                  {transferFeedback.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  <span>{transferFeedback.text}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-md shadow-sm flex items-center justify-center gap-1.5 transition mt-2"
              >
                <Send className="w-3.5 h-3.5" />
                Pagar {directAmount} {directCurrency} ao Mestre
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: Câmbio de Moedas */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-zinc-800">
              <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100 text-sm">
                  Câmbio de Moedas
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Converta denominações com taxa fixa proporcional ao Bronze.
                </p>
              </div>
            </div>

            <form onSubmit={handleConvert} className="space-y-3">
              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Converter de:
                  </label>
                  <select
                    value={fromCurr}
                    onChange={(e) => setFromCurr(e.target.value as CurrencyType)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                  >
                    <option value="BRZ">Bronze (1 BRZ)</option>
                    <option value="PRT">Prata (10 BRZ)</option>
                    <option value="ORO">Ouro (100 BRZ)</option>
                    <option value="PLN">Platina (1000 BRZ)</option>
                    <option value="CYB">Cybermoeda (5000 BRZ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    Para:
                  </label>
                  <select
                    value={toCurr}
                    onChange={(e) => setToCurr(e.target.value as CurrencyType)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-200 font-medium focus:outline-none focus:border-zinc-600"
                  >
                    <option value="PRT">Prata (10 BRZ)</option>
                    <option value="ORO">Ouro (100 BRZ)</option>
                    <option value="PLN">Platina (1000 BRZ)</option>
                    <option value="CYB">Cybermoeda (5000 BRZ)</option>
                    <option value="BRZ">Bronze (1 BRZ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Quantidade a converter ({fromCurr})
                </label>
                <input
                  type="number"
                  min="1"
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Exchange Preview */}
              <div className="p-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs flex items-center justify-between">
                <span className="text-zinc-400">Você receberá:</span>
                <span className="font-mono font-semibold text-zinc-100">
                  {estimatedResult} {toCurr}{' '}
                  <span className="text-[10px] text-zinc-500 font-normal">
                    (Custo: {costUsed} {fromCurr})
                  </span>
                </span>
              </div>

              {exchangeFeedback && (
                <div
                  className={`p-2 rounded-md text-xs flex items-center gap-1.5 ${
                    exchangeFeedback.success
                      ? 'bg-emerald-950/40 border border-emerald-800/80 text-emerald-300'
                      : 'bg-red-950/40 border border-red-800/80 text-red-300'
                  }`}
                >
                  {exchangeFeedback.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  <span>{exchangeFeedback.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={estimatedResult <= 0}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-xs rounded-md border border-zinc-700 flex items-center justify-center gap-1.5 transition disabled:opacity-40 mt-2"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Realizar Câmbio
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
