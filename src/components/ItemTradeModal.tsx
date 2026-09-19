import React, { useState } from 'react';
import {
  CharacterSheet,
  InventoryItem,
  CampaignRoom,
  CurrencyType,
  CURRENCY_CONFIGS,
} from '../types/rpg';
import { sound } from '../utils/audio';
import {
  ArrowLeftRight,
  Coins,
  Send,
  X,
  Sparkles,
  User,
  AlertCircle,
  CheckCircle2,
  Package,
} from 'lucide-react';

interface ItemTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCharacter: CharacterSheet;
  campaign: CampaignRoom;
  initialItem?: InventoryItem | null;
  initialMode?: 'sell' | 'trade';
  onUpdateCharacter: (updated: CharacterSheet) => void;
  onUpdateCampaign?: (updated: CampaignRoom) => void;
}

export const ItemTradeModal: React.FC<ItemTradeModalProps> = ({
  isOpen,
  onClose,
  currentCharacter,
  campaign,
  initialItem = null,
  initialMode = 'sell',
  onUpdateCharacter,
  onUpdateCampaign,
}) => {
  const [tradeMode, setTradeMode] = useState<'sell' | 'trade'>(initialMode);
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialItem ? initialItem.id : currentCharacter.inventory[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);

  // Trade with player options
  const otherPlayers = campaign.players.filter((p) => p.id !== currentCharacter.id);
  const [targetPlayerId, setTargetPlayerId] = useState<string>(
    otherPlayers[0]?.id || ''
  );
  const [isFreeTransfer, setIsFreeTransfer] = useState<boolean>(true);
  const [chargePrice, setChargePrice] = useState<number>(1);
  const [chargeCurrency, setChargeCurrency] = useState<CurrencyType>('PRT');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentItem = currentCharacter.inventory.find((i) => i.id === selectedItemId);
  const targetPlayer = campaign.players.find((p) => p.id === targetPlayerId);

  // Resale calculation (70% of base value, minimum 1 coin)
  const basePrice = currentItem?.valueAmount || 1;
  const resaleUnitVal = Math.max(1, Math.round(basePrice * 0.7));
  const resaleCurrency = currentItem?.valueCurrency || 'PRT';
  const totalResaleEarned = resaleUnitVal * quantity;

  // Handle Selling Item to Merchant / Shop
  const handleSellToShop = () => {
    setErrorMsg(null);
    if (!currentItem) {
      setErrorMsg('Nenhum item selecionado para venda.');
      return;
    }
    if (quantity <= 0 || quantity > currentItem.quantity) {
      setErrorMsg(`Quantidade inválida. Você possui ${currentItem.quantity} unidade(s).`);
      return;
    }

    sound.playCoinReceived(resaleCurrency);

    // 1. Update character inventory
    let updatedInventory: InventoryItem[];
    if (quantity >= currentItem.quantity) {
      updatedInventory = currentCharacter.inventory.filter((i) => i.id !== currentItem.id);
    } else {
      updatedInventory = currentCharacter.inventory.map((i) =>
        i.id === currentItem.id ? { ...i, quantity: i.quantity - quantity } : i
      );
    }

    // 2. Update character wallet
    const updatedWallet = {
      ...currentCharacter.wallet,
      [resaleCurrency]: (currentCharacter.wallet[resaleCurrency] || 0) + totalResaleEarned,
    };

    const updatedChar: CharacterSheet = {
      ...currentCharacter,
      inventory: updatedInventory,
      wallet: updatedWallet,
    };

    // 3. Record transaction in campaign
    const newTx = {
      id: 'tx-sell-' + Date.now(),
      campaignCode: campaign.code,
      senderId: 'merchant-bazaar',
      senderName: 'Mercador de Eldria',
      receiverId: currentCharacter.id,
      receiverName: currentCharacter.name,
      amount: totalResaleEarned,
      currency: resaleCurrency,
      reason: `Venda de ${quantity}x ${currentItem.name} ao Bazar`,
      type: 'shop_purchase' as const,
      status: 'confirmed' as const,
      timestamp: Date.now(),
    };

    const updatedPlayers = campaign.players.map((p) =>
      p.id === currentCharacter.id ? updatedChar : p
    );

    const updatedCampaign: CampaignRoom = {
      ...campaign,
      players: updatedPlayers,
      transactions: [newTx, ...campaign.transactions],
    };

    onUpdateCharacter(updatedChar);
    if (onUpdateCampaign) {
      onUpdateCampaign(updatedCampaign);
    }

    setSuccessMsg(`Vendeu ${quantity}x ${currentItem.name} por +${totalResaleEarned} ${resaleCurrency}!`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Handle Player-to-Player Trade / Transfer
  const handleTradeWithPlayer = () => {
    setErrorMsg(null);
    if (!currentItem) {
      setErrorMsg('Selecione um item da sua mochila.');
      return;
    }
    if (!targetPlayer) {
      setErrorMsg('Selecione um jogador destinatário da mesa.');
      return;
    }
    if (quantity <= 0 || quantity > currentItem.quantity) {
      setErrorMsg(`Quantidade inválida. Você possui ${currentItem.quantity} unidade(s).`);
      return;
    }

    // Check target player balance if payment is requested
    if (!isFreeTransfer) {
      const targetBalance = targetPlayer.wallet[chargeCurrency] || 0;
      if (targetBalance < chargePrice) {
        setErrorMsg(
          `${targetPlayer.name} possui apenas ${targetBalance} ${chargeCurrency}, insuficiente para pagar o valor de ${chargePrice} ${chargeCurrency}.`
        );
        sound.playInsufficientBalance();
        return;
      }
    }

    sound.playSuccessFanfare();

    // 1. Remove from sender inventory
    let senderInventory: InventoryItem[];
    if (quantity >= currentItem.quantity) {
      senderInventory = currentCharacter.inventory.filter((i) => i.id !== currentItem.id);
    } else {
      senderInventory = currentCharacter.inventory.map((i) =>
        i.id === currentItem.id ? { ...i, quantity: i.quantity - quantity } : i
      );
    }

    // 2. Add to receiver inventory
    const existingInReceiver = targetPlayer.inventory.find(
      (i) => i.name.toLowerCase() === currentItem.name.toLowerCase()
    );
    let receiverInventory: InventoryItem[];

    if (existingInReceiver) {
      receiverInventory = targetPlayer.inventory.map((i) =>
        i.id === existingInReceiver.id ? { ...i, quantity: i.quantity + quantity } : i
      );
    } else {
      const itemClone: InventoryItem = {
        ...currentItem,
        id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        quantity: quantity,
        equipped: false,
      };
      receiverInventory = [itemClone, ...targetPlayer.inventory];
    }

    // 3. Coin exchange if paid
    let senderWallet = { ...currentCharacter.wallet };
    let receiverWallet = { ...targetPlayer.wallet };

    if (!isFreeTransfer && chargePrice > 0) {
      senderWallet[chargeCurrency] = (senderWallet[chargeCurrency] || 0) + chargePrice;
      receiverWallet[chargeCurrency] = (receiverWallet[chargeCurrency] || 0) - chargePrice;
    }

    const updatedSender: CharacterSheet = {
      ...currentCharacter,
      inventory: senderInventory,
      wallet: senderWallet,
    };

    const updatedReceiver: CharacterSheet = {
      ...targetPlayer,
      inventory: receiverInventory,
      wallet: receiverWallet,
    };

    // 4. Record transaction in campaign
    const newTx = {
      id: 'tx-trade-' + Date.now(),
      campaignCode: campaign.code,
      senderId: currentCharacter.id,
      senderName: currentCharacter.name,
      receiverId: targetPlayer.id,
      receiverName: targetPlayer.name,
      amount: isFreeTransfer ? 0 : chargePrice,
      currency: chargeCurrency,
      reason: isFreeTransfer
        ? `Troca de item: ${quantity}x ${currentItem.name} entregue a ${targetPlayer.name}`
        : `Comércio entre jogadores: ${quantity}x ${currentItem.name} vendido a ${targetPlayer.name}`,
      type: 'player_to_player' as const,
      status: 'confirmed' as const,
      timestamp: Date.now(),
    };

    const updatedPlayers = campaign.players.map((p) => {
      if (p.id === updatedSender.id) return updatedSender;
      if (p.id === updatedReceiver.id) return updatedReceiver;
      return p;
    });

    const updatedCampaign: CampaignRoom = {
      ...campaign,
      players: updatedPlayers,
      transactions: [newTx, ...campaign.transactions],
    };

    onUpdateCharacter(updatedSender);
    if (onUpdateCampaign) {
      onUpdateCampaign(updatedCampaign);
    }

    setSuccessMsg(
      isFreeTransfer
        ? `Entregou ${quantity}x ${currentItem.name} para ${targetPlayer.name} com sucesso!`
        : `Vendeu ${quantity}x ${currentItem.name} para ${targetPlayer.name} por ${chargePrice} ${chargeCurrency}!`
    );

    setTimeout(() => {
      onClose();
    }, 1300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-[#0e0a18] border border-amber-600/40 rounded-2xl shadow-2xl p-5 overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-950 to-purple-950 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-amber-200 text-sm">
                Comércio &amp; Troca de Equipamentos
              </h3>
              <p className="text-[11px] text-zinc-400">
                Personagem Ativo: <strong className="text-zinc-200">{currentCharacter.name}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Seletor de Modo (Vender ao Comerciante vs Trocar com Jogador) */}
        <div className="flex gap-2 mt-4 p-1 bg-zinc-950/80 rounded-xl border border-purple-950">
          <button
            type="button"
            onClick={() => {
              setTradeMode('sell');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-cinzel font-semibold flex items-center justify-center gap-2 transition ${
              tradeMode === 'sell'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-md shadow-amber-950/40'
                : 'text-zinc-400 hover:text-amber-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Vender ao Mercador</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTradeMode('trade');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-cinzel font-semibold flex items-center justify-center gap-2 transition ${
              tradeMode === 'trade'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold shadow-md shadow-purple-950/40'
                : 'text-zinc-400 hover:text-purple-200'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Trocar / Enviar a Jogador</span>
          </button>
        </div>

        {/* Notificações de Erro ou Sucesso */}
        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-950/70 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {currentCharacter.inventory.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-400 font-cinzel">
              Sua mochila está sem itens para negociar ou vender.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3.5">
            {/* 1. Seleção do Item da Mochila */}
            <div>
              <label className="block text-[11px] font-cinzel font-semibold text-zinc-300 mb-1">
                Item a Negociar *
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  setQuantity(1);
                  setErrorMsg(null);
                }}
                className="w-full bg-zinc-950 border border-purple-900/60 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                {currentCharacter.inventory.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.iconEmoji || '🎒'} {i.name} (x{i.quantity}) — Valor Base: {i.valueAmount} {i.valueCurrency}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Seleção da Quantidade */}
            {currentItem && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-purple-900/40">
                <div>
                  <span className="text-xs font-cinzel font-medium text-zinc-300 block">
                    Quantidade a Comercializar
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Disponível na mochila: {currentItem.quantity} un
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center font-mono font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-mono font-bold text-amber-300">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(currentItem.quantity, quantity + 1))}
                    className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center font-mono font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* MODO 1: VENDA AO MERCADOR */}
            {tradeMode === 'sell' && (
              <div className="rounded-xl border border-amber-600/40 bg-gradient-to-br from-amber-950/30 to-zinc-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300 font-cinzel">Preço Unitário de Venda (70%):</span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {resaleUnitVal} {resaleCurrency} / un
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-amber-900/40">
                  <span className="text-xs font-cinzel font-bold text-amber-200">
                    Total a Receber na Carteira:
                  </span>
                  <span className="text-sm font-mono font-extrabold text-amber-300">
                    +{totalResaleEarned} {resaleCurrency}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSellToShop}
                  className="w-full py-2.5 mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-cinzel font-bold text-xs rounded-xl shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition"
                >
                  <Coins className="w-4 h-4" />
                  <span>Confirmar Venda (+{totalResaleEarned} {resaleCurrency})</span>
                </button>
              </div>
            )}

            {/* MODO 2: TROCA COM OUTRO JOGADOR */}
            {tradeMode === 'trade' && (
              <div className="rounded-xl border border-purple-800/40 bg-gradient-to-br from-purple-950/40 to-zinc-950 p-4 space-y-3.5">
                {otherPlayers.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-2">
                    Não há outros aventureiros conectados nesta mesa para trocar.
                  </p>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] font-cinzel font-semibold text-purple-300 mb-1">
                        Destinatário da Mesa *
                      </label>
                      <select
                        value={targetPlayerId}
                        onChange={(e) => setTargetPlayerId(e.target.value)}
                        className="w-full bg-zinc-950 border border-purple-900/60 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                      >
                        {otherPlayers.map((p) => (
                          <option key={p.id} value={p.id}>
                            ⚔️ {p.name} ({p.characterClass} - Nv {p.level})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Opção: Grátis ou Cobrar Moedas */}
                    <div className="space-y-2 pt-1 border-t border-purple-900/40">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isFreeTransfer}
                          onChange={(e) => setIsFreeTransfer(e.target.checked)}
                          className="w-4 h-4 rounded border-purple-800 text-purple-600 focus:ring-0"
                        />
                        <span className="text-xs text-zinc-300 font-cinzel">
                          Presente de Aventura (Transferir Gratuitamente)
                        </span>
                      </label>

                      {!isFreeTransfer && (
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-purple-950">
                          <div>
                            <label className="block text-[10px] text-zinc-400 font-cinzel mb-1">
                              Cobrar Preço do Jogador
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={chargePrice}
                              onChange={(e) => setChargePrice(Math.max(1, parseInt(e.target.value) || 0))}
                              className="w-full bg-zinc-950 border border-purple-900 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-zinc-400 font-cinzel mb-1">
                              Moeda
                            </label>
                            <select
                              value={chargeCurrency}
                              onChange={(e) => setChargeCurrency(e.target.value as CurrencyType)}
                              className="w-full bg-zinc-950 border border-purple-900 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                            >
                              <option value="BRZ">Bronze (BRZ)</option>
                              <option value="PRT">Prata (PRT)</option>
                              <option value="ORO">Ouro (ORO)</option>
                              <option value="PLN">Platina (PLN)</option>
                              <option value="CYB">Cybermoeda (CYB)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleTradeWithPlayer}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-cinzel font-bold text-xs rounded-xl shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2 transition"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {isFreeTransfer
                          ? `Enviar Item para ${targetPlayer?.name || 'Jogador'}`
                          : `Vender para ${targetPlayer?.name || 'Jogador'} (${chargePrice} ${chargeCurrency})`}
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
