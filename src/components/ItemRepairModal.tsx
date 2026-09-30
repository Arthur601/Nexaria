import React, { useState } from 'react';
import {
  CharacterSheet,
  InventoryItem,
  CurrencyType,
  CURRENCY_CONFIGS,
} from '../types/rpg';
import { sound } from '../utils/audio';
import {
  X,
  Hammer,
  Anvil,
  Coins,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Flame,
  Wrench,
  Moon,
  SunMedium,
} from 'lucide-react';

interface ItemRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  character: CharacterSheet;
  onRepairSuccess: (
    updatedItem: InventoryItem,
    updatedCharacter: CharacterSheet,
    feedbackMessage: string
  ) => void;
}

export const ItemRepairModal: React.FC<ItemRepairModalProps> = ({
  isOpen,
  onClose,
  item,
  character,
  onRepairSuccess,
}) => {
  const [repairMethod, setRepairMethod] = useState<'currency' | 'rest'>('currency');
  const [restType, setRestType] = useState<'short' | 'long'>('short');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>('BRZ');

  if (!isOpen || !item) return null;

  const durability = item.durability || { current: 15, max: 20 };
  const maxDurability = Math.max(5, durability.max);
  const currentDurability = Math.max(0, durability.current);
  const missingDurability = Math.max(0, maxDurability - currentDurability);
  const currentPct = Math.round((currentDurability / maxDurability) * 100);
  const isCritical = currentPct < 10;
  const isBroken = currentDurability <= 0;

  // Cálculo de custo em moedas proporcional ao dano sofrido
  const damageRatio = missingDurability / maxDurability;
  // Custo base em Bronze (mínimo 2 BRZ, escala com valor do item)
  const baseValueInBRZ = Math.max(
    10,
    (item.valueAmount || 5) *
      (CURRENCY_CONFIGS[item.valueCurrency || 'BRZ']?.unitValueInBRZ || 1)
  );
  const totalCostInBRZ = Math.max(2, Math.ceil(baseValueInBRZ * 0.25 * damageRatio));

  // Opções de moeda suportadas para pagamento
  const availableCurrencies: CurrencyType[] = ['BRZ', 'PRT', 'ORO'];
  const getCostInCurrency = (curr: CurrencyType): number => {
    const rate = CURRENCY_CONFIGS[curr]?.unitValueInBRZ || 1;
    return Math.max(1, Math.ceil(totalCostInBRZ / rate));
  };

  const activeCost = getCostInCurrency(selectedCurrency);
  const playerBalance = character.wallet?.[selectedCurrency] ?? 0;
  const canAffordCurrency = playerBalance >= activeCost;

  // Efeitos do descanso
  const shortRestRestoration = Math.min(
    maxDurability,
    currentDurability + Math.max(3, Math.ceil(maxDurability * 0.5))
  );
  const longRestRestoration = maxDurability;

  const targetDurabilityAfterRest =
    restType === 'short' ? shortRestRestoration : longRestRestoration;
  const targetPctAfterRest = Math.round(
    (targetDurabilityAfterRest / maxDurability) * 100
  );

  // Executa reparo via moedas
  const handleRepairWithCurrency = () => {
    if (!canAffordCurrency) {
      sound.playInsufficientBalance();
      return;
    }

    sound.playCoinClink(selectedCurrency);

    const updatedWallet = {
      ...character.wallet,
      [selectedCurrency]: Math.max(0, playerBalance - activeCost),
    };

    const updatedItem: InventoryItem = {
      ...item,
      durability: {
        current: maxDurability,
        max: maxDurability,
      },
      effectText: item.effectText
        ? item.effectText.replace(/Durabilidade:\s*\d+\/\d+/i, `Durabilidade: ${maxDurability}/${maxDurability}`)
        : undefined,
    };

    const updatedInventory = character.inventory.map((inv) =>
      inv.id === item.id ? updatedItem : inv
    );

    const updatedCharacter: CharacterSheet = {
      ...character,
      wallet: updatedWallet,
      inventory: updatedInventory,
    };

    sound.playSuccessFanfare();
    onRepairSuccess(
      updatedItem,
      updatedCharacter,
      `⚒️ ${item.name} foi totalmente reparado(a) no ferreiro por ${activeCost} ${selectedCurrency}! Durabilidade restaurada: ${maxDurability}/${maxDurability}.`
    );
    onClose();
  };

  // Executa reparo via tempo de descanso
  const handleRepairWithRest = () => {
    sound.playSuccessFanfare();

    const newDurabilityCurrent =
      restType === 'short' ? shortRestRestoration : longRestRestoration;

    const updatedItem: InventoryItem = {
      ...item,
      durability: {
        current: newDurabilityCurrent,
        max: maxDurability,
      },
      effectText: item.effectText
        ? item.effectText.replace(
            /Durabilidade:\s*\d+\/\d+/i,
            `Durabilidade: ${newDurabilityCurrent}/${maxDurability}`
          )
        : undefined,
    };

    const updatedInventory = character.inventory.map((inv) =>
      inv.id === item.id ? updatedItem : inv
    );

    // No descanso longo, recupera todo HP e Mana
    // No descanso curto, recupera um pouco de Stamina / HP
    let newHp = character.hp.current;
    let newMana = character.mana.current;
    let newStamina = character.stamina?.current ?? 0;

    if (restType === 'long') {
      newHp = character.hp.max;
      newMana = character.mana.max;
      newStamina = character.stamina?.max ?? 100;
    } else {
      newHp = Math.min(character.hp.max, character.hp.current + 5);
      newMana = Math.min(character.mana.max, character.mana.current + 5);
      newStamina = Math.min(
        character.stamina?.max ?? 100,
        (character.stamina?.current ?? 0) + 15
      );
    }

    const updatedCharacter: CharacterSheet = {
      ...character,
      hp: { ...character.hp, current: newHp },
      mana: { ...character.mana, current: newMana },
      stamina: character.stamina
        ? { ...character.stamina, current: newStamina }
        : character.stamina,
      inventory: updatedInventory,
    };

    const restLabel =
      restType === 'short'
        ? 'Descanso Curto (1 hora de afiação de campo)'
        : 'Descanso Longo (8 horas no acampamento)';

    onRepairSuccess(
      updatedItem,
      updatedCharacter,
      `🏕️ ${restLabel} concluído! ${item.name} teve sua integridade restaurada para ${newDurabilityCurrent}/${maxDurability} (${Math.round(
        (newDurabilityCurrent / maxDurability) * 100
      )}%).`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border-2 border-amber-500/70 bg-gradient-to-b from-[#180e28] via-[#10081d] to-[#090510] p-5 sm:p-6 text-zinc-100 shadow-2xl shadow-amber-950/50 my-auto overflow-hidden">
        {/* Faixa decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        {/* Header do Modal */}
        <div className="flex items-start justify-between pb-3 border-b border-amber-500/30 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-inner">
              <Anvil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-cinzel font-bold text-amber-300 flex items-center gap-2">
                <span>Bancada de Reparos &amp; Forja</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans">
                Restaure o fio e a integridade de equipamentos desgastados
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

        {/* Card do Item Selecionado e Medidor de Durabilidade Atual */}
        <div
          className={`p-3.5 rounded-xl border-2 mb-4 relative overflow-hidden transition-all ${
            isCritical
              ? 'border-red-500 bg-red-950/40 shadow-lg shadow-red-950/70 ring-1 ring-red-500/60'
              : 'border-purple-800/80 bg-black/40'
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl select-none shrink-0">
                {item.iconEmoji || '🗡️'}
              </span>
              <div className="min-w-0">
                <h4 className="text-sm font-cinzel font-bold text-zinc-100 truncate">
                  {item.name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] font-mono text-zinc-400">
                    {item.category === 'arma' ? 'Arma' : item.category}
                  </span>
                  {isCritical ? (
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-mono text-[9px] font-bold border border-red-300 animate-pulse flex items-center gap-1 shadow">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>
                        {isBroken ? 'QUEBRADA (0%)' : `CRÍTICA (${currentPct}%)`}
                      </span>
                    </span>
                  ) : currentPct >= 100 ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/60 text-emerald-300 font-mono text-[9px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Íntegra (100%)</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/60 text-amber-300 font-mono text-[9px] font-bold">
                      Desgaste Moderado ({currentPct}%)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase font-mono text-zinc-400">
                Integridade
              </div>
              <div className="text-sm font-bold font-mono text-amber-300">
                {currentDurability} / {maxDurability} pts
              </div>
            </div>
          </div>

          {/* Barra de Durabilidade Visual */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span
                className={
                  isCritical
                    ? 'text-red-400 font-bold flex items-center gap-1'
                    : 'text-zinc-400'
                }
              >
                {isCritical && <AlertTriangle className="w-3 h-3 text-red-400" />}
                <span>
                  {isCritical
                    ? 'Abaixo de 10% — Risco de Quebra em Combate!'
                    : 'Estado Atual:'}
                </span>
              </span>
              <span className="font-bold text-zinc-200">{currentPct}%</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-purple-950/80 shadow-inner">
              <div
                className={`h-full transition-all duration-300 ${
                  isCritical
                    ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse'
                    : currentPct < 35
                    ? 'bg-gradient-to-r from-amber-600 to-orange-500'
                    : currentPct < 70
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(3, currentPct))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Escolha do Método de Reparo (Moedas vs Descanso) */}
        <div className="mb-4">
          <label className="text-xs font-cinzel font-bold text-amber-300 block mb-2">
            Escolha o Método de Restauração:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playCoinClink('PRT');
                setRepairMethod('currency');
              }}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                repairMethod === 'currency'
                  ? 'border-amber-400 bg-amber-950/40 text-amber-200 ring-1 ring-amber-400 shadow-md'
                  : 'border-purple-900/60 bg-black/40 text-zinc-400 hover:text-zinc-200 hover:bg-purple-950/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-cinzel font-bold text-amber-200">
                  Pagar Ferreiro
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-sans leading-snug">
                Reparo instantâneo usando moedas da carteira com o ferreiro local.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playCoinClink('BRZ');
                setRepairMethod('rest');
              }}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                repairMethod === 'rest'
                  ? 'border-purple-400 bg-purple-950/50 text-purple-200 ring-1 ring-purple-400 shadow-md'
                  : 'border-purple-900/60 bg-black/40 text-zinc-400 hover:text-zinc-200 hover:bg-purple-950/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-cinzel font-bold text-purple-200">
                  Tempo de Descanso
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-sans leading-snug">
                Afiação manual de campo ou manutenção completa no acampamento.
              </p>
            </button>
          </div>
        </div>

        {/* MÉTODO 1: REPARO POR MOEDA */}
        {repairMethod === 'currency' && (
          <div className="p-3.5 rounded-xl bg-black/50 border border-amber-500/40 space-y-3 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-cinzel font-bold flex items-center gap-1.5">
                <Hammer className="w-3.5 h-3.5 text-amber-400" />
                <span>Custo do Serviço de Forja:</span>
              </span>
              <span className="text-amber-300 font-mono font-bold text-sm">
                {activeCost} {selectedCurrency}
              </span>
            </div>

            {/* Seleção de Moeda */}
            <div>
              <div className="text-[10px] text-zinc-400 font-mono uppercase mb-1.5 flex items-center justify-between">
                <span>Pagar com:</span>
                <span>
                  Saldo atual:{' '}
                  <strong
                    className={
                      canAffordCurrency ? 'text-emerald-400' : 'text-red-400'
                    }
                  >
                    {playerBalance} {selectedCurrency}
                  </strong>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {availableCurrencies.map((curr) => {
                  const cost = getCostInCurrency(curr);
                  const bal = character.wallet?.[curr] ?? 0;
                  const isSelected = selectedCurrency === curr;
                  const hasFunds = bal >= cost;
                  return (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => {
                        sound.playCoinClink(curr);
                        setSelectedCurrency(curr);
                      }}
                      className={`p-2 rounded-lg border text-center transition font-mono ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-bold'
                          : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="text-xs font-bold">
                        {cost} {curr}
                      </div>
                      <div
                        className={`text-[9px] ${
                          hasFunds ? 'text-zinc-400' : 'text-red-400'
                        }`}
                      >
                        (Tem {bal})
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Restaura <strong>100% da integridade</strong> da arma instantaneamente
                para {maxDurability}/{maxDurability}.
              </span>
            </div>

            {!canAffordCurrency && (
              <div className="p-2 rounded-lg bg-red-950/80 border border-red-500/60 text-[11px] text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  Saldo insuficiente de {selectedCurrency}. Escolha outra moeda ou
                  utilize o método por <strong>Tempo de Descanso</strong>!
                </span>
              </div>
            )}
          </div>
        )}

        {/* MÉTODO 2: REPARO POR TEMPO DE DESCANSO */}
        {repairMethod === 'rest' && (
          <div className="p-3.5 rounded-xl bg-black/50 border border-purple-500/40 space-y-3 mb-4">
            <div className="text-xs text-zinc-300 font-cinzel font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Modalidade de Descanso &amp; Afiação:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRestType('short')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  restType === 'short'
                    ? 'border-purple-400 bg-purple-950/50 text-purple-200 ring-1 ring-purple-400'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-cinzel font-bold text-xs text-purple-200 mb-1">
                  <SunMedium className="w-3.5 h-3.5 text-amber-400" />
                  <span>Descanso Curto (1h)</span>
                </div>
                <div className="text-[10px] text-zinc-300 font-sans">
                  Afiação de emergência com pedra-sabão. Restaura{' '}
                  <strong className="text-amber-300">
                    +{Math.ceil(maxDurability * 0.5)} pts
                  </strong>{' '}
                  de durabilidade ({targetPctAfterRest}% total) e +15 de Vigor.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRestType('long')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  restType === 'long'
                    ? 'border-purple-400 bg-purple-950/50 text-purple-200 ring-1 ring-purple-400'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-cinzel font-bold text-xs text-purple-200 mb-1">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Descanso Longo (8h)</span>
                </div>
                <div className="text-[10px] text-zinc-300 font-sans">
                  Acampamento seguro. Restaura{' '}
                  <strong className="text-emerald-400">100% da integridade</strong>{' '}
                  ({maxDurability}/{maxDurability}) e recupera todo PV e Mana da ficha!
                </div>
              </button>
            </div>

            <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-800/40 text-[11px] text-purple-200">
              💡 <strong>Custo em Moedas:</strong> Gratuito (0 moedas). O custo é o
              tempo narrativo gasto pelo grupo em descanso.
            </div>
          </div>
        )}

        {/* Rodapé com Botões de Ação */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-cinzel font-semibold transition"
          >
            Cancelar
          </button>

          {repairMethod === 'currency' ? (
            <button
              type="button"
              disabled={!canAffordCurrency || missingDurability === 0}
              onClick={handleRepairWithCurrency}
              className={`px-4 py-2 rounded-xl font-cinzel font-bold text-xs flex items-center gap-1.5 transition shadow-lg ${
                missingDurability === 0
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : canAffordCurrency
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 hover:brightness-110 shadow-amber-950/60'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-red-500/40'
              }`}
            >
              <Hammer className="w-4 h-4" />
              <span>
                {missingDurability === 0
                  ? 'Arma Já Está Íntegra'
                  : `Pagar ${activeCost} ${selectedCurrency} e Reparar`}
              </span>
            </button>
          ) : (
            <button
              type="button"
              disabled={missingDurability === 0}
              onClick={handleRepairWithRest}
              className={`px-4 py-2 rounded-xl font-cinzel font-bold text-xs flex items-center gap-1.5 transition shadow-lg ${
                missingDurability === 0
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-purple-950/60'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>
                {missingDurability === 0
                  ? 'Arma Já Está Íntegra'
                  : restType === 'short'
                  ? 'Descansar 1h (+50% Durabilidade)'
                  : 'Descansar 8h (100% Durabilidade + Cura)'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
