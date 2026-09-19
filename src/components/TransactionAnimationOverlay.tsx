import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TransactionAnimationData } from '../types/animation';
import { CURRENCY_CONFIGS, CurrencyType } from '../types/rpg';
import { CoinVisual } from './CoinVisual';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Send,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
  Coins,
  ShieldAlert,
} from 'lucide-react';

interface TransactionAnimationOverlayProps {
  currentEvent: TransactionAnimationData | null;
  onDismiss: () => void;
  onNavigateToBank?: () => void;
}

export const TransactionAnimationOverlay: React.FC<TransactionAnimationOverlayProps> = ({
  currentEvent,
  onDismiss,
  onNavigateToBank,
}) => {
  const [stage, setStage] = useState<'animating' | 'completed'>('animating');

  useEffect(() => {
    if (!currentEvent) {
      setStage('animating');
      return;
    }

    setStage('animating');

    if (currentEvent.type === 'sending') {
      sound.playCoinClink(currentEvent.currency);

      // Play arrival sound & confetti after coin flight
      const timer1 = setTimeout(() => {
        setStage('completed');
        sound.playSuccessFanfare();
        confetti({
          particleCount: 45,
          spread: 70,
          origin: { y: 0.65 },
          colors:
            currentEvent.currency === 'CYB'
              ? ['#06b6d4', '#38bdf8', '#c084fc']
              : currentEvent.currency === 'ORO'
              ? ['#eab308', '#fef08a', '#ca8a04']
              : currentEvent.currency === 'PLN'
              ? ['#c7d2fe', '#818cf8', '#e0e7ff']
              : ['#cd7f32', '#d97706', '#f59e0b'],
        });
      }, 1200);

      const autoClose = setTimeout(() => {
        onDismiss();
      }, 3400);

      return () => {
        clearTimeout(timer1);
        clearTimeout(autoClose);
      };
    } else if (currentEvent.type === 'receiving') {
      sound.playCoinReceived(currentEvent.currency);

      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#eab308', '#38bdf8', '#10b981', '#f59e0b'],
      });

      const autoClose = setTimeout(() => {
        onDismiss();
      }, 3800);

      return () => clearTimeout(autoClose);
    } else if (currentEvent.type === 'insufficient_funds') {
      sound.playInsufficientBalance();

      const autoClose = setTimeout(() => {
        onDismiss();
      }, 4500);

      return () => clearTimeout(autoClose);
    }
  }, [currentEvent, onDismiss]);

  if (!currentEvent) return null;

  const config = CURRENCY_CONFIGS[currentEvent.currency] || CURRENCY_CONFIGS.BRZ;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        {/* Backdrop dismiss */}
        <div className="absolute inset-0" onClick={onDismiss} />

        {/* ANIMATION 1: ENVIO DE MOEDAS (SENDING) */}
        {currentEvent.type === 'sending' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-700/80 bg-zinc-900/95 p-6 shadow-2xl text-zinc-100 overflow-hidden"
          >
            {/* Background Ambient Glow */}
            <div
              className="absolute -top-24 -left-24 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: config.colorHex }}
            />
            <div
              className="absolute -bottom-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: config.colorHex }}
            />

            {/* Close Button */}
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-800 transition"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Badge */}
            <div className="flex items-center gap-2 mb-5">
              <span className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
                <Send className="w-4 h-4 text-sky-400" />
              </span>
              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
                  {stage === 'animating' ? 'Processando Envio...' : 'Transferência Concluída'}
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-zinc-100">
                    {stage === 'animating' ? 'Transferindo Moedas' : 'Moedas Entregues!'}
                  </span>
                  {stage === 'completed' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Visual Route: Sender -> Coins in Flight -> Receiver */}
            <div className="relative my-6 py-4 px-2 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
              <div className="flex items-center justify-between relative z-10 px-2">
                {/* Sender node */}
                <div className="flex flex-col items-center gap-1.5 w-24 text-center">
                  <motion.div
                    animate={
                      stage === 'animating'
                        ? { scale: [1, 0.95, 1], borderColor: ['#71717a', '#a1a1aa', '#71717a'] }
                        : {}
                    }
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-12 h-12 rounded-full bg-zinc-900 border-2 border-zinc-600 flex items-center justify-center text-zinc-200 shadow-md font-semibold text-xs"
                  >
                    {currentEvent.senderName.slice(0, 2).toUpperCase()}
                  </motion.div>
                  <span className="text-[11px] font-medium text-zinc-300 truncate max-w-full">
                    {currentEvent.senderName}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">
                    Origem
                  </span>
                </div>

                {/* Center Flight Track */}
                <div className="flex-1 relative flex items-center justify-center h-16 mx-2 overflow-visible">
                  {/* Dashed line */}
                  <div className="absolute inset-x-0 h-0.5 border-b border-dashed border-zinc-700" />

                  {/* Flying Coins */}
                  {stage === 'animating' && (
                    <div className="relative w-full flex items-center justify-center">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ x: -70, y: 0, scale: 0.6, opacity: 0 }}
                          animate={{
                            x: [-70, 0, 70],
                            y: [0, -18 - (i % 2) * 8, 0],
                            scale: [0.6, 1.2, 0.8],
                            opacity: [0, 1, 0.8],
                            rotateY: [0, 180, 360],
                            rotateZ: [0, 45, 90],
                          }}
                          transition={{
                            duration: 0.9,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: 'easeInOut',
                          }}
                          className="absolute pointer-events-none drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]"
                        >
                          <CoinVisual type={currentEvent.currency} size="sm" />
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Reached state arrow */}
                  {stage === 'completed' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-600 flex items-center justify-center text-emerald-400"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </motion.div>
                  )}
                </div>

                {/* Receiver node */}
                <div className="flex flex-col items-center gap-1.5 w-24 text-center">
                  <motion.div
                    animate={
                      stage === 'completed'
                        ? { scale: [1, 1.15, 1], borderColor: ['#10b981', '#34d399', '#10b981'] }
                        : {}
                    }
                    transition={{ duration: 0.5 }}
                    className="w-12 h-12 rounded-full bg-zinc-900 border-2 border-zinc-600 flex items-center justify-center text-zinc-200 shadow-md font-semibold text-xs"
                  >
                    {currentEvent.receiverName.slice(0, 2).toUpperCase()}
                  </motion.div>
                  <span className="text-[11px] font-medium text-zinc-300 truncate max-w-full">
                    {currentEvent.receiverName}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">
                    Destino
                  </span>
                </div>
              </div>
            </div>

            {/* Amount Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <div className="flex items-center gap-2">
                <CoinVisual type={currentEvent.currency} size="md" />
                <div>
                  <div className="text-base font-bold text-zinc-100 flex items-center gap-1">
                    <span>{currentEvent.amount}</span>
                    <span style={{ color: config.colorHex }}>{config.name}</span>
                    <span className="text-xs text-zinc-500 font-mono font-normal">
                      ({config.code})
                    </span>
                  </div>
                  {currentEvent.reason && (
                    <p className="text-[11px] text-zinc-400 truncate max-w-[220px]">
                      {currentEvent.reason}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                  Cotação
                </span>
                <span className="text-xs font-mono text-zinc-300 font-medium">
                  {currentEvent.amount * config.unitValueInBRZ} BRZ
                </span>
              </div>
            </div>

            {/* Quick Action */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={onDismiss}
                className="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-lg shadow-sm transition"
              >
                Concluir
              </button>
            </div>
          </motion.div>
        )}

        {/* ANIMATION 2: RECEBIMENTO DE MOEDAS (RECEIVING) */}
        {currentEvent.type === 'receiving' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-amber-500/40 bg-zinc-900/95 p-6 shadow-2xl text-zinc-100 overflow-hidden"
          >
            {/* Glowing Auroral Background */}
            <div
              className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
              style={{ backgroundColor: config.colorHex }}
            />

            {/* Close Button */}
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-800 transition"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Badge */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-semibold mb-2 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Moedas Recebidas!</span>
              </div>
              <h3 className="text-lg font-bold text-zinc-100">
                Tesouro Adicionado à Bolsa
              </h3>
              <p className="text-xs text-zinc-400">
                Enviado por <strong className="text-zinc-200">{currentEvent.senderName}</strong>
              </p>
            </div>

            {/* Animated Bouncing Coin Shower */}
            <div className="relative my-4 flex flex-col items-center justify-center p-6 rounded-xl bg-zinc-950/70 border border-zinc-800">
              {/* Radial glow */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute w-28 h-28 rounded-full pointer-events-none blur-xl"
                style={{ backgroundColor: config.colorHex }}
              />

              {/* Central Bouncing Coin Icon */}
              <motion.div
                initial={{ y: -70, scale: 0.35, opacity: 0, rotate: -20 }}
                animate={{
                  y: 0,
                  scale: 1,
                  opacity: 1,
                  rotate: 0,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 280,
                  damping: 14,
                  mass: 0.8,
                }}
                className="relative z-10 mb-3 drop-shadow-[0_0_20px_rgba(234,179,8,0.7)]"
              >
                <CoinVisual type={currentEvent.currency} size="xl" />
              </motion.div>

              {/* Huge Amount Indicator */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center relative z-10"
              >
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-400 font-mono">
                  +{currentEvent.amount}
                </span>
                <span
                  className="ml-2 text-lg font-bold uppercase tracking-wider"
                  style={{ color: config.colorHex }}
                >
                  {config.name}
                </span>
              </motion.div>

              {currentEvent.reason && (
                <div className="mt-2 text-center text-xs text-zinc-400 max-w-xs bg-zinc-900/80 px-3 py-1 rounded-md border border-zinc-800">
                  <span className="text-zinc-500">Motivo:</span> {currentEvent.reason}
                </div>
              )}
            </div>

            {/* Bottom info & dismiss */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-zinc-400 font-mono">
                Valor Total: +{currentEvent.amount * config.unitValueInBRZ} BRZ
              </span>
              <button
                onClick={onDismiss}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-lg shadow-sm transition"
              >
                Coletar Moedas
              </button>
            </div>
          </motion.div>
        )}

        {/* ANIMATION 3: SALDO INSUFICIENTE (INSUFFICIENT FUNDS) */}
        {currentEvent.type === 'insufficient_funds' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: [-14, 14, -10, 10, -6, 6, -2, 2, 0], // Vigorous shake
            }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-red-500/80 bg-zinc-900/95 p-6 shadow-2xl text-zinc-100 overflow-hidden"
          >
            {/* Red Pulse Ambient Glow */}
            <motion.div
              animate={{ opacity: [0.15, 0.35, 0.15] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="absolute -top-20 -left-20 w-52 h-52 bg-red-600 rounded-full blur-3xl pointer-events-none"
            />

            {/* Close Button */}
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-800 transition"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Badge */}
            <div className="flex items-center gap-2.5 mb-4">
              <motion.div
                animate={{ rotate: [-8, 8, -6, 6, 0] }}
                transition={{ duration: 0.5, repeat: 2, ease: 'easeInOut' }}
                className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-600 flex items-center justify-center text-red-400 shadow-md shrink-0"
              >
                <ShieldAlert className="w-5 h-5" />
              </motion.div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-semibold block">
                  Erro de Validação
                </span>
                <h3 className="text-base font-bold text-red-200">
                  Saldo Insuficiente na Bolsa!
                </h3>
              </div>
            </div>

            {/* Breakdown Card */}
            <div className="space-y-2.5 p-4 rounded-xl bg-zinc-950/80 border border-red-950/60 my-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Valor que tentou enviar:</span>
                <span className="font-mono font-bold text-red-400 text-sm flex items-center gap-1">
                  {currentEvent.amount} {currentEvent.currency}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Seu saldo atual disponível:</span>
                <span className="font-mono font-medium text-zinc-300">
                  {currentEvent.currentBalance ?? 0} {currentEvent.currency}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-red-300 font-semibold">Moedas que faltam:</span>
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-mono font-bold">
                  {currentEvent.shortage ??
                    Math.max(0, currentEvent.amount - (currentEvent.currentBalance ?? 0))}{' '}
                  {currentEvent.currency}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Você não possui moedas de <strong className="text-zinc-200">{config.name}</strong>{' '}
              suficientes para efetuar este pagamento. Converta moedas no Banco ou reduza a quantia.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onDismiss}
                className="px-3.5 py-1.5 text-xs rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition font-medium"
              >
                Entendido
              </button>

              {onNavigateToBank && (
                <button
                  onClick={() => {
                    onDismiss();
                    onNavigateToBank();
                  }}
                  className="px-4 py-1.5 bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-700/80 font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition"
                >
                  <Coins className="w-3.5 h-3.5" />
                  Ir ao Banco de Câmbio
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};
