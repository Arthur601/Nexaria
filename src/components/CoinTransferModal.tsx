import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterSheet, CurrencyType, CURRENCY_CONFIGS } from '../types/rpg';
import { TransactionAnimationData } from '../types/animation';
import { CoinVisual } from './CoinVisual';
import { sound } from '../utils/audio';
import { X, Send, Crown, User, AlertTriangle, ShieldAlert } from 'lucide-react';

interface CoinTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderCharacter: CharacterSheet;
  campaignCode: string;
  gmName: string;
  otherPlayers: CharacterSheet[];
  onTransfer: (params: {
    receiverId: string;
    receiverName: string;
    amount: number;
    currency: CurrencyType;
    reason: string;
  }) => { success: boolean; message: string };
  onTriggerAnimation?: (data: TransactionAnimationData) => void;
}

const COMMON_REASONS = [
  'Taverna: Diária do Quarto e Refeição',
  'Compra de Equipamento com Ferreiro',
  'Compra de Poções e Ingredientes',
  'Suborno ao Guarda do Portão',
  'Informação Secreta / Boato do Informante',
  'Tributo / Pedágio do Reino',
  'Reparo de Armaduras Danificadas',
  'Aposta na Mesa de Jogo',
];

export const CoinTransferModal: React.FC<CoinTransferModalProps> = ({
  isOpen,
  onClose,
  senderCharacter,
  gmName,
  otherPlayers,
  onTransfer,
  onTriggerAnimation,
}) => {
  const [targetId, setTargetId] = useState<string>('gm');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>('BRZ');
  const [amount, setAmount] = useState<number>(5);
  const [reason, setReason] = useState<string>(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState<number>(0);

  if (!isOpen) return null;

  const currentBalance = senderCharacter.wallet[selectedCurrency] || 0;
  const isInsufficient = amount > currentBalance;

  const triggerInsufficientShake = () => {
    setShakeKey((prev) => prev + 1);
    sound.playInsufficientBalance();
  };

  const handleCurrencySelect = (curr: CurrencyType) => {
    setSelectedCurrency(curr);
    sound.playCoinClink(curr);
    setErrorMsg(null);
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val);
    sound.playCoinClink(selectedCurrency);
    setErrorMsg(null);
    if (val > currentBalance) {
      triggerInsufficientShake();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (amount <= 0) {
      setErrorMsg('Informe um valor maior que 0.');
      return;
    }

    let receiverName = gmName;
    if (targetId !== 'gm') {
      const targetChar = otherPlayers.find((p) => p.id === targetId);
      if (targetChar) {
        receiverName = targetChar.name;
      }
    }

    const finalReason = customReason.trim() || reason;

    if (amount > currentBalance) {
      triggerInsufficientShake();
      setErrorMsg(`Saldo insuficiente! Você só possui ${currentBalance} ${selectedCurrency}.`);

      if (onTriggerAnimation) {
        onTriggerAnimation({
          id: 'anim-' + Date.now(),
          type: 'insufficient_funds',
          currency: selectedCurrency,
          amount,
          currentBalance,
          shortage: amount - currentBalance,
          senderName: senderCharacter.name,
          receiverName,
          reason: finalReason,
          timestamp: Date.now(),
        });
        onClose();
      }
      return;
    }

    const result = onTransfer({
      receiverId: targetId,
      receiverName,
      amount,
      currency: selectedCurrency,
      reason: finalReason,
    });

    if (result.success) {
      if (onTriggerAnimation) {
        onTriggerAnimation({
          id: 'anim-' + Date.now(),
          type: 'sending',
          currency: selectedCurrency,
          amount,
          senderName: senderCharacter.name,
          receiverName,
          reason: finalReason,
          timestamp: Date.now(),
        });
      } else {
        sound.playSuccessFanfare();
      }
      onClose();
    } else {
      triggerInsufficientShake();
      setErrorMsg(result.message);
      if (result.message.toLowerCase().includes('saldo') && onTriggerAnimation) {
        onTriggerAnimation({
          id: 'anim-' + Date.now(),
          type: 'insufficient_funds',
          currency: selectedCurrency,
          amount,
          currentBalance,
          shortage: Math.max(0, amount - currentBalance),
          senderName: senderCharacter.name,
          receiverName,
          reason: finalReason,
          timestamp: Date.now(),
        });
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        key={shakeKey}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: shakeKey > 0 ? [-12, 12, -9, 9, -5, 5, -2, 2, 0] : 0,
        }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
        className={`relative w-full max-w-lg rounded-xl border bg-zinc-900 p-5 sm:p-6 text-zinc-100 shadow-2xl my-8 transition-colors ${
          isInsufficient ? 'border-red-600/80 shadow-red-950/40' : 'border-zinc-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-md border flex items-center justify-center transition ${
              isInsufficient
                ? 'bg-red-950/60 border-red-700 text-red-400'
                : 'bg-zinc-800 border-zinc-700 text-zinc-200'
            }`}>
              {isInsufficient ? <ShieldAlert className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-zinc-100">
                Transferência de Moedas
              </h3>
              <p className="text-xs text-zinc-400">
                Pagamento de {senderCharacter.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Destinatário */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
              Destinatário *
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetId('gm')}
                className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition ${
                  targetId === 'gm'
                    ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center text-amber-400 shrink-0">
                  <Crown className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200">
                    Mestre ({gmName})
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    Cofre da Campanha
                  </span>
                </div>
              </button>

              {otherPlayers.length > 0 ? (
                <div className="flex flex-col">
                  <select
                    value={targetId === 'gm' ? '' : targetId}
                    onChange={(e) => {
                      if (e.target.value) {
                        setTargetId(e.target.value);
                      }
                    }}
                    className={`h-full p-2.5 rounded-lg border text-xs text-zinc-200 bg-zinc-950 focus:outline-none transition ${
                      targetId !== 'gm'
                        ? 'border-zinc-500 bg-zinc-800'
                        : 'border-zinc-800'
                    }`}
                  >
                    <option value="">Outro Jogador...</option>
                    {otherPlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.characterClass})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/40 flex items-center gap-2 text-zinc-500 text-xs">
                  <User className="w-3.5 h-3.5" />
                  <span>Sem outros jogadores online.</span>
                </div>
              )}
            </div>
          </div>

          {/* Currency Selector */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
              Moeda
            </label>

            <div className="grid grid-cols-5 gap-1.5">
              {(['BRZ', 'PRT', 'ORO', 'PLN', 'CYB'] as CurrencyType[]).map((curr) => {
                const bal = senderCharacter.wallet[curr] || 0;
                const isSelected = selectedCurrency === curr;

                return (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => handleCurrencySelect(curr)}
                    className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition ${
                      isSelected
                        ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <CoinVisual type={curr} size="sm" />
                    <span className="text-[11px] font-semibold text-zinc-300">
                      {curr}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {bal}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Input and Quick Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-zinc-400 font-medium">
                Quantidade
              </label>
              <span className={`text-xs font-mono transition-colors ${
                isInsufficient ? 'text-red-400 font-bold' : 'text-zinc-500'
              }`}>
                Saldo: <strong>{currentBalance} {selectedCurrency}</strong>
              </span>
            </div>

            <motion.div
              animate={shakeKey > 0 && isInsufficient ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="flex items-center gap-2"
            >
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setAmount(val);
                  setErrorMsg(null);
                  if (val > currentBalance) {
                    triggerInsufficientShake();
                  }
                }}
                className={`w-full bg-zinc-950 border rounded-md px-3 py-2 text-base font-mono font-semibold focus:outline-none transition ${
                  isInsufficient
                    ? 'border-red-500 bg-red-950/20 text-red-300 focus:border-red-400'
                    : 'border-zinc-800 text-zinc-100 focus:border-zinc-600'
                }`}
              />

              <button
                type="button"
                onClick={() => handleQuickAmount(currentBalance)}
                className="shrink-0 px-3 py-2 text-xs rounded-md border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 transition font-medium"
              >
                Tudo ({currentBalance})
              </button>
            </motion.div>

            {/* Insufficient balance inline notice */}
            {isInsufficient && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 p-2 rounded-lg bg-red-950/50 border border-red-800/80 text-red-300 text-xs flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  Saldo insuficiente! Você possui {currentBalance} {selectedCurrency} (faltam {amount - currentBalance} {selectedCurrency}).
                </span>
              </motion.div>
            )}

            {/* Quick Steppers */}
            <div className="flex items-center gap-1.5 mt-2">
              {[1, 5, 10, 25, 50, 100].map((step) => (
                <button
                  key={step}
                  type="button"
                  disabled={step > currentBalance}
                  onClick={() => handleQuickAmount(step)}
                  className="flex-1 py-1 text-[11px] font-mono rounded bg-zinc-950 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  +{step}
                </button>
              ))}
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1 font-medium">
              Motivo do Pagamento
            </label>

            <select
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setCustomReason('');
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 mb-2"
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="custom">Outro motivo...</option>
            </select>

            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Ou digite o motivo..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-md bg-red-950/40 border border-red-900/60 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs rounded-md border border-zinc-800 text-zinc-400 hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={amount <= 0 || amount > currentBalance}
              className="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-md shadow-sm flex items-center gap-1.5 transition disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              Confirmar Pagamento ({amount} {selectedCurrency})
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
