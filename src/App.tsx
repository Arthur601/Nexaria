import React, { useState, useEffect, useRef } from 'react';
import { CampaignRoom, CharacterSheet, CurrencyType } from './types/rpg';
import { TransactionAnimationData } from './types/animation';
import { campaignService } from './services/campaignService';
import { RoomHeader } from './components/RoomHeader';
import { CharacterSheetView } from './components/CharacterSheetView';
import { CoinBankView } from './components/CoinBankView';
import { MasterDashboardView } from './components/MasterDashboardView';
import { TransactionLedgerView } from './components/TransactionLedgerView';
import { RoomLobbyView } from './components/RoomLobbyView';
import { RulesReferenceView } from './components/RulesReferenceView';
import { AbyssBestiaryView } from './components/AbyssBestiaryView';
import { GameMapView } from './components/GameMapView';
import { PlayerTutorialModal } from './components/PlayerTutorialModal';
import { LobbyModal } from './components/LobbyModal';
import { TransactionAnimationOverlay } from './components/TransactionAnimationOverlay';
import { PlayerInventoryView } from './components/PlayerInventoryView';
import { CampaignShopView } from './components/CampaignShopView';
import { Backpack, Lock, Crown, ShieldAlert } from 'lucide-react';
import { sound } from './utils/audio';
import { normalizeRoomCode } from './utils/roomCode';

export default function App() {
  const [campaignCode, setCampaignCode] = useState<string>('NEXARIA-01');
  const [campaign, setCampaign] = useState<CampaignRoom | null>(null);
  const [availableCampaigns, setAvailableCampaigns] = useState<CampaignRoom[]>([]);
  const [activeRole, setActiveRole] = useState<string>('gm'); // 'gm' or characterId
  const [inspectedCharacterId, setInspectedCharacterId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'lobby' | 'sheet' | 'bank' | 'master' | 'inventory' | 'shop' | 'ledger' | 'rules' | 'bestiary' | 'map'>('lobby');
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(() => {
    try {
      const seen = localStorage.getItem('nexaria_tutorial_seen_v1');
      return seen !== 'true';
    } catch {
      return true;
    }
  });
  const [animationData, setAnimationData] = useState<TransactionAnimationData | null>(null);
  const prevTxCountRef = useRef<number>(0);

  const handleCloseTutorial = () => {
    setIsTutorialOpen(false);
    try {
      localStorage.setItem('nexaria_tutorial_seen_v1', 'true');
    } catch {
      // ignore
    }
  };

  // 1. Detect invite link parameter in URL: e.g. /?room=NX-9M2K4
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const roomParam = searchParams.get('room') || searchParams.get('sala') || searchParams.get('code');
      if (roomParam) {
        const cleanCode = normalizeRoomCode(roomParam);
        if (cleanCode) {
          setCampaignCode(cleanCode);
          campaignService.fetchCampaignFromServer(cleanCode).then((camp) => {
            if (camp) {
              setCampaign(camp);
              // If this room has players, assume player role or show sheet/lobby
              if (camp.players.length > 0) {
                setActiveRole(camp.players[0].id);
                setActiveView('sheet');
              } else {
                setActiveRole('gm');
                setActiveView('lobby');
              }
            }
          });
        }
      }
    }
  }, []);

  // 2. Subscribe to global changes (room creations, deletions, resets)
  useEffect(() => {
    const refreshCampaigns = () => {
      setAvailableCampaigns(campaignService.getAllCampaigns());
    };
    refreshCampaigns();
    const unsubGlobal = campaignService.subscribeGlobal(refreshCampaigns);
    return () => unsubGlobal();
  }, []);

  // 3. Subscribe to active campaign real-time updates (SSE + Polling)
  useEffect(() => {
    const unsub = campaignService.subscribe(campaignCode, (updated) => {
      // Check if new transaction arrived where active user is receiver
      if (
        updated.transactions.length > prevTxCountRef.current &&
        prevTxCountRef.current > 0
      ) {
        const latestTx = updated.transactions[0];
        if (
          latestTx &&
          latestTx.receiverId === activeRole &&
          latestTx.senderId !== activeRole
        ) {
          setAnimationData({
            id: 'anim-rx-' + latestTx.id,
            type: 'receiving',
            currency: latestTx.currency,
            amount: latestTx.amount,
            senderName: latestTx.senderName,
            receiverName: latestTx.receiverName,
            reason: latestTx.reason,
            timestamp: Date.now(),
          });
        }
      }
      prevTxCountRef.current = updated.transactions.length;
      setCampaign({ ...updated });
    });

    const initial = campaignService.getCampaign(campaignCode);
    if (initial) {
      prevTxCountRef.current = initial.transactions.length;
      setCampaign({ ...initial });
      if (activeRole !== 'gm' && !initial.players.some((p) => p.id === activeRole)) {
        if (initial.players.length > 0) {
          setActiveRole(initial.players[0].id);
        } else {
          setActiveRole('gm');
        }
      }
    } else {
      // Try fetching from server
      campaignService.fetchCampaignFromServer(campaignCode).then((camp) => {
        if (camp) {
          setCampaign(camp);
        } else {
          const all = campaignService.getAllCampaigns();
          if (all.length > 0) {
            setCampaignCode(all[0].code);
            setCampaign({ ...all[0] });
          }
        }
      });
    }

    return () => unsub();
  }, [campaignCode, activeRole]);

  // Handle Character Sheet update
  const handleUpdateCharacter = async (updatedChar: CharacterSheet) => {
    if (!campaign) return;
    await campaignService.saveOrUpdateCharacter(campaign.code, updatedChar);
  };

  // Handle Campaign update
  const handleUpdateCampaign = (updatedCamp: CampaignRoom) => {
    campaignService.saveCampaign(updatedCamp);
  };

  // Handle Transaction execution
  const handleExecuteTransaction = async (params: {
    receiverId: string;
    receiverName: string;
    amount: number;
    currency: CurrencyType;
    reason: string;
    senderId?: string;
    senderName?: string;
  }) => {
    if (!campaign) return { success: false, message: 'Campanha não encontrada.' };

    const senderId = params.senderId || (activeRole === 'gm' ? 'gm' : activeRole);
    let senderName = campaign.gmName;
    if (senderId !== 'gm') {
      const char = campaign.players.find((p) => p.id === senderId);
      if (char) senderName = char.name;
    }

    const type =
      senderId === 'gm'
        ? 'gm_to_player'
        : params.receiverId === 'gm'
        ? 'player_to_gm'
        : 'player_to_player';

    const result = await campaignService.executeTransaction(campaign.code, {
      senderId,
      senderName,
      receiverId: params.receiverId,
      receiverName: params.receiverName,
      amount: params.amount,
      currency: params.currency,
      reason: params.reason,
      type,
    });

    if (result.success) {
      if (senderId === activeRole) {
        setAnimationData({
          id: 'anim-' + Date.now(),
          type: 'sending',
          currency: params.currency,
          amount: params.amount,
          senderName,
          receiverName: params.receiverName,
          reason: params.reason,
          timestamp: Date.now(),
        });
      } else if (params.receiverId === activeRole) {
        setAnimationData({
          id: 'anim-' + Date.now(),
          type: 'receiving',
          currency: params.currency,
          amount: params.amount,
          senderName,
          receiverName: params.receiverName,
          reason: params.reason,
          timestamp: Date.now(),
        });
      }
    } else {
      if (result.message.toLowerCase().includes('saldo')) {
        const curBal =
          senderId === 'gm'
            ? campaign.gmWallet[params.currency] || 0
            : campaign.players.find((p) => p.id === senderId)?.wallet[params.currency] || 0;

        setAnimationData({
          id: 'anim-' + Date.now(),
          type: 'insufficient_funds',
          currency: params.currency,
          amount: params.amount,
          currentBalance: curBal,
          shortage: Math.max(0, params.amount - curBal),
          senderName,
          receiverName: params.receiverName,
          reason: params.reason,
          timestamp: Date.now(),
        });
      }
    }

    return result;
  };

  // Handle Currency conversion
  const handleConvertCurrency = async (
    fromCurrency: CurrencyType,
    toCurrency: CurrencyType,
    amount: number
  ) => {
    if (!campaign) return { success: false, message: 'Campanha não carregada.' };
    const charId = activeRole === 'gm' ? campaign.players[0]?.id : activeRole;
    if (!charId) {
      return { success: false, message: 'Nenhum personagem selecionado para conversão.' };
    }
    return await campaignService.convertCurrency(
      campaign.code,
      charId,
      fromCurrency,
      toCurrency,
      amount
    );
  };

  // Handle Payment Request creation by GM
  const handleCreatePaymentRequest = async (req: {
    targetCharacterId: string;
    amount: number;
    currency: CurrencyType;
    reason: string;
  }) => {
    if (!campaign) return false;
    return await campaignService.createPaymentRequest(campaign.code, req);
  };

  // Handle Paying GM Request
  const handlePayRequest = async (requestId: string) => {
    if (!campaign) return { success: false, message: 'Campanha não encontrada.' };
    const charId = activeRole === 'gm' ? campaign.players[0]?.id : activeRole;
    if (!charId) return { success: false, message: 'Selecione um personagem para pagar.' };
    return await campaignService.payPaymentRequest(campaign.code, requestId, charId);
  };

  // Create new online campaign with random code
  const handleCreateCampaign = async (
    name: string,
    gmName: string,
    description: string,
    customCode?: string
  ) => {
    const created = await campaignService.createCampaign(name, gmName, description, customCode);
    setCampaignCode(created.code);
    setCampaign(created);
    setActiveRole('gm');
    setActiveView('master');
    return created;
  };

  // Create new character
  const handleCreateCharacter = async (code: string, char: CharacterSheet) => {
    await campaignService.saveOrUpdateCharacter(code, char);
    setCampaignCode(code);
    setActiveRole(char.id);
    setActiveView('sheet');
  };

  // Delete Campaign
  const handleDeleteCampaign = async (code: string) => {
    await campaignService.deleteCampaign(code);
    sound.playCoinClink('BRZ');
    const remaining = campaignService.getAllCampaigns();
    if (campaignCode === code) {
      if (remaining.length > 0) {
        setCampaignCode(remaining[0].code);
        setActiveRole('gm');
      } else {
        const fresh = await campaignService.createCampaign(
          'Nexaria — O Legado do Abismo',
          'Mestre do Jogo',
          'Mesa de RPG criada em Nexaria.'
        );
        setCampaignCode(fresh.code);
        setActiveRole('gm');
      }
      setActiveView('lobby');
    }
  };

  // Reset all site data
  const handleResetAllData = () => {
    campaignService.resetAllData();
    sound.playSuccessFanfare();
    setCampaignCode('NEXARIA-01');
    setActiveRole('gm');
    setActiveView('lobby');
  };

  if (!campaign) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-300 flex items-center justify-center p-4">
        <div className="text-center p-6 border border-zinc-800 rounded-xl bg-zinc-900 max-w-sm w-full">
          <div className="w-8 h-8 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium mb-4">Conectando ao Servidor Online de Nexaria...</p>
          <button
            onClick={handleResetAllData}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs rounded-md text-zinc-300 transition"
          >
            Resetar e Carregar
          </button>
        </div>
      </div>
    );
  }

  const isGm = activeRole === 'gm';
  const activeCharacter = isGm
    ? campaign.players.find((p) => p.id === inspectedCharacterId) || campaign.players[0] || null
    : campaign.players.find((p) => p.id === activeRole) || null;
  const otherPlayers = campaign.players.filter((p) => p.id !== activeCharacter?.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-zinc-700 selection:text-white font-sans">
      {/* Top Header with Room Code and Navigation */}
      <RoomHeader
        campaign={campaign}
        activeRole={activeRole}
        onRoleChange={(newRole) => {
          setActiveRole(newRole);
          sound.playCoinClink('PRT');
          if (newRole === 'gm') {
            setActiveView('master');
          } else {
            setActiveView('sheet');
          }
        }}
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view);
          sound.playCoinClink('PRT');
        }}
        onOpenLobby={() => setActiveView('lobby')}
        onOpenNewCharacter={() => {
          setActiveView('lobby');
        }}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onTriggerAnimation={(data) => setAnimationData(data)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {/* VIEW: TELA PARA ENTRAR, CRIAR SALA, GERENCIAR E CRIAR FICHA */}
        {activeView === 'lobby' && (
          <RoomLobbyView
            availableCampaigns={availableCampaigns}
            currentCampaignCode={campaign.code}
            onSelectCampaign={(code) => {
              setCampaignCode(code);
              const found = availableCampaigns.find((c) => c.code === code);
              if (found && found.players.length > 0) {
                setActiveRole(found.players[0].id);
                setActiveView('sheet');
              } else {
                setActiveRole('gm');
                setActiveView('master');
              }
            }}
            onCreateCampaign={handleCreateCampaign}
            onCreateCharacter={handleCreateCharacter}
            onDeleteCampaign={handleDeleteCampaign}
            onResetAllData={handleResetAllData}
            onOpenTutorial={() => setIsTutorialOpen(true)}
            onCloseLobbyView={() => {
              if (activeRole === 'gm') {
                setActiveView('master');
              } else {
                setActiveView('sheet');
              }
            }}
          />
        )}

        {/* VIEW 1: Ficha de Personagem */}
        {activeView === 'sheet' && (
          <div>
            {isGm && campaign.players.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-amber-300">Modo Mestre Ativo:</span>
                    <span className="text-zinc-400 ml-1.5">
                      Você pode conceder EXP e alterar status, PV e PM deste aventureiro.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-zinc-400 shrink-0 font-medium">Selecionar Ficha:</span>
                  <select
                    value={activeCharacter?.id || ''}
                    onChange={(e) => setInspectedCharacterId(e.target.value)}
                    className="bg-zinc-900 border border-amber-500/40 rounded-lg px-3 py-1 text-xs text-amber-200 focus:outline-none"
                  >
                    {campaign.players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.characterClass} Nv {p.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {activeCharacter ? (
              <CharacterSheetView
                character={activeCharacter}
                campaignCode={campaign.code}
                gmName={campaign.gmName}
                otherPlayers={otherPlayers}
                onUpdateCharacter={handleUpdateCharacter}
                onExecuteTransaction={handleExecuteTransaction}
                isGmView={isGm}
                onTriggerAnimation={(data) => setAnimationData(data)}
                onAwardExp={async (characterId, amount, reason) => {
                  return await campaignService.awardExp(campaign.code, characterId, amount, reason);
                }}
                onAllocateAttribute={async (characterId, attributeKey) => {
                  return await campaignService.allocateAttributePoint(campaign.code, characterId, attributeKey);
                }}
                onUpdateVitals={async (characterId, vitals) => {
                  return await campaignService.updateCharacterVitalsByGm(campaign.code, characterId, vitals);
                }}
                onApplyExternalAction={async (characterId, action) => {
                  return await campaignService.applyExternalAction(campaign.code, characterId, action);
                }}
                campaign={campaign}
                onNavigateToShop={() => setActiveView('shop')}
                onUpdateCampaign={handleUpdateCampaign}
              />
            ) : (
              <div className="text-center py-16 rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 max-w-xl mx-auto">
                <h3 className="text-base font-semibold text-zinc-100 mb-2">
                  Nenhuma Ficha Ativa Selecionada
                </h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto mb-5 leading-relaxed">
                  {campaign.players.length === 0
                    ? 'Esta sala ainda não possui fichas de personagens cadastradas. Crie a sua primeira ficha para iniciar a aventura!'
                    : 'Você está no modo Mestre ou nenhuma ficha está selecionada. Escolha um aventureiro ou forje uma nova ficha.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveView('lobby')}
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-zinc-950 font-bold text-xs rounded-lg transition"
                  >
                    Criar Nova Ficha
                  </button>
                  {campaign.players.length > 0 && (
                    <button
                      onClick={() => {
                        setActiveRole(campaign.players[0].id);
                      }}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition"
                    >
                      Assumir {campaign.players[0]?.name}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 1.5: Inventário & Mochila do Jogador */}
        {activeView === 'inventory' && (
          <div className="space-y-4">
            {activeCharacter ? (
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#120a22]/80 border border-purple-900/50 p-4 rounded-xl mb-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-amber-500/40 shrink-0 bg-purple-950">
                      <img
                        src={activeCharacter.avatarUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80'}
                        alt={activeCharacter.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-cinzel font-bold text-amber-200">
                          Mochila &amp; Inventário de {activeCharacter.name}
                        </h2>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-300 font-mono">
                          {activeCharacter.inventory.length} {activeCharacter.inventory.length === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Classe: <span className="text-zinc-200">{activeCharacter.characterClass}</span> &bull; Nível <span className="text-amber-400">{activeCharacter.level}</span> &bull; Raça: <span className="text-zinc-200">{activeCharacter.race}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveView('sheet')}
                    className="px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-purple-200 text-xs rounded-lg transition font-cinzel flex items-center gap-1.5"
                  >
                    Ver Ficha Completa
                  </button>
                </div>
                <PlayerInventoryView
                  character={activeCharacter}
                  onUpdateCharacter={handleUpdateCharacter}
                  isGmView={false}
                  campaign={campaign}
                  onNavigateToShop={() => setActiveView('shop')}
                  onUpdateCampaign={handleUpdateCampaign}
                />
              </div>
            ) : (
              <div className="text-center py-16 rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 max-w-xl mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-purple-950/70 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3">
                  <Backpack className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-zinc-100 mb-2">
                  Nenhuma Mochila Aberta
                </h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto mb-5 leading-relaxed">
                  {campaign.players.length === 0
                    ? 'Esta sala ainda não possui fichas de jogadores. Crie uma ficha para começar a acumular itens, armas, poções e tesouros!'
                    : 'Você está no modo Mestre ou nenhuma ficha está selecionada. Escolha um aventureiro para abrir seu inventário.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveView('lobby')}
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-zinc-950 font-bold text-xs rounded-lg transition"
                  >
                    Criar Ficha
                  </button>
                  {campaign.players.length > 0 && (
                    <button
                      onClick={() => {
                        setActiveRole(campaign.players[0].id);
                      }}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition"
                    >
                      Assumir {campaign.players[0]?.name}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 1.8: Loja & Bazar do Mestre (Visível para Jogadores e Mestre) */}
        {activeView === 'shop' && (
          <CampaignShopView
            campaign={campaign}
            activeRole={activeRole}
            onUpdateCampaign={handleUpdateCampaign}
            onUpdateCharacter={handleUpdateCharacter}
            onTriggerAnimation={(data) => setAnimationData(data)}
          />
        )}

        {/* VIEW 2: Moedas & Banco do RPG */}
        {activeView === 'bank' && (
          <CoinBankView
            campaign={campaign}
            activeCharacter={activeCharacter}
            onExecuteTransaction={handleExecuteTransaction}
            onConvertCurrency={handleConvertCurrency}
            onPayRequest={handlePayRequest}
            onTriggerAnimation={(data) => setAnimationData(data)}
          />
        )}

        {/* VIEW 3: Painel do Mestre (Restrito apenas ao Mestre) */}
        {activeView === 'master' && (
          activeRole === 'gm' ? (
            <MasterDashboardView
              campaign={campaign}
              onUpdateCampaign={handleUpdateCampaign}
              onExecuteTransaction={handleExecuteTransaction}
              onCreatePaymentRequest={handleCreatePaymentRequest}
              onSelectCharacter={(charId) => {
                setInspectedCharacterId(charId);
                setActiveView('sheet');
              }}
              onTriggerAnimation={(data) => setAnimationData(data)}
              onAwardExp={async (characterId, amount, reason) => {
                return await campaignService.awardExp(campaign.code, characterId, amount, reason);
              }}
            />
          ) : (
            <div className="text-center py-16 rounded-xl border border-red-900/40 bg-zinc-900/60 p-8 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400 mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-zinc-100 mb-1">
                Painel Restrito ao Mestre
              </h3>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                O painel de gerenciamento, distribuição de recursos e status da mesa é exclusivo do narrador da campanha.
              </p>
              <button
                onClick={() => setActiveView('sheet')}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition"
              >
                Voltar à Minha Ficha
              </button>
            </div>
          )
        )}

        {/* VIEW 4: Tabela de Referências (da imagem oficial de Nexaria) */}
        {activeView === 'rules' && (
          <RulesReferenceView onBack={() => setActiveView('sheet')} />
        )}

        {/* VIEW 5: Bestiário do Abismo (117 criaturas e miniaturas das tabelas oficiais) */}
        {activeView === 'bestiary' && (
          <AbyssBestiaryView
            campaign={campaign}
            activeRole={activeRole}
            onExecuteTransaction={handleExecuteTransaction}
            onApplyExternalAction={async (characterId, action) => {
              return await campaignService.applyExternalAction(campaign.code, characterId, action);
            }}
          />
        )}

        {/* VIEW 6: Atlas e Mapa Múndi dos Reinos de Eldria & Decodificador Rúnico */}
        {activeView === 'map' && (
          <GameMapView
            campaign={campaign}
            activeRole={activeRole}
            onUpdatePartyLocation={(locationName, regionId) => {
              if (activeCharacter) {
                handleUpdateCharacter({
                  ...activeCharacter,
                  currentLocation: locationName,
                });
              }
            }}
            onBackToSheet={() => setActiveView('sheet')}
          />
        )}

        {/* VIEW 7: Extrato de Transações */}
        {activeView === 'ledger' && (
          <TransactionLedgerView
            transactions={campaign.transactions}
            activeCharacterId={activeCharacter?.id}
          />
        )}
      </main>

      {/* Transaction Animation Feedback Overlay */}
      <TransactionAnimationOverlay
        currentEvent={animationData}
        onDismiss={() => setAnimationData(null)}
        onNavigateToBank={() => {
          setActiveView('bank');
          setAnimationData(null);
        }}
      />

      {/* Campaign & Character Lobby Modal */}
      <LobbyModal
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        availableCampaigns={availableCampaigns}
        currentCampaignCode={campaign.code}
        onSelectCampaign={(code) => {
          setCampaignCode(code);
        }}
        onCreateCampaign={handleCreateCampaign}
        onCreateCharacter={handleCreateCharacter}
        onDeleteCampaign={handleDeleteCampaign}
      />

      {/* Tutorial Interativo para Novos Jogadores */}
      <PlayerTutorialModal
        isOpen={isTutorialOpen}
        onClose={handleCloseTutorial}
        onOpenCreateSheet={() => {
          setActiveView('lobby');
        }}
      />

      {/* Footer */}
      <footer className="border-t border-purple-900/40 bg-[#07040d] py-4 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-cinzel text-zinc-400">
            Nexaria — O Legado do Abismo &bull; Sistema Oficial de RPG &amp; Moedas Online
          </span>
          <span className="font-mono text-[11px] text-amber-400/90">
            BRZ (1) &bull; PRT (10) &bull; ORO (100) &bull; PLN (1.000) &bull; CYB (5.000)
          </span>
        </div>
      </footer>
    </div>
  );
}
