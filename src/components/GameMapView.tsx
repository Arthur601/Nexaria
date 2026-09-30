import React, { useState, useEffect, useMemo } from 'react';
import { CampaignRoom, CharacterSheet } from '../types/rpg';
import {
  ORIGIN_REGIONS,
  getRegionById,
  translateTextToRunes,
  REGIONAL_RUNIC_ALPHABETS,
  ELDRIA_WORLD_ATLAS_IMAGE,
  ELDRIA_WORLD_MAP_IMAGE,
  ELDRIA_CONTINENTAL_SATELLITE_IMAGE,
} from '../data/eldriaWorldMap';
import { sound } from '../utils/audio';
import { ambientAudio, REGION_AUDIO_PROFILES } from '../utils/ambientAudio';
import {
  MapPin,
  Compass,
  Sparkles,
  Search,
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Copy,
  Check,
  ChevronRight,
  Eye,
  Shield,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  Globe2,
  Flame,
  Snowflake,
  Trees,
  Sun,
  Crown,
  Cpu,
  Wind,
  Anchor,
  Skull,
  Info,
  Maximize2,
  X,
  Image as ImageIcon,
  Clock,
  Radio,
  Sliders,
  Flag,
  Crosshair,
} from 'lucide-react';

interface GameMapViewProps {
  campaign: CampaignRoom;
  activeRole: string; // 'gm' or characterId
  onUpdatePartyLocation?: (locationName: string, regionId: string) => void;
  onBackToSheet?: () => void;
}

export const GameMapView: React.FC<GameMapViewProps> = ({
  campaign,
  activeRole,
  onUpdatePartyLocation,
  onBackToSheet,
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<string>('caeldrin');
  const [activeTab, setActiveTab] = useState<'map' | 'regions' | 'runes' | 'pois'>('map');
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mapViewStyle, setMapViewStyle] = useState<'atlas' | 'satellite' | 'tactical'>('atlas');
  const [viewingModalImage, setViewingModalImage] = useState<{
    url: string;
    title: string;
    subtitle?: string;
    lore?: string;
  } | null>(null);

  const [partyCurrentLocation, setPartyCurrentLocation] = useState<string>('Caeldrin — Cidadela Estelar');
  const [copiedRuneText, setCopiedRuneText] = useState(false);
  const [runicInputText, setRunicInputText] = useState('NEXARIA ELDRIA');
  const [filterPoiCategory, setFilterPoiCategory] = useState<string>('all');
  const [locationToast, setLocationToast] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(ambientAudio.getIsPlaying());
  const [audioVolume, setAudioVolume] = useState<number>(ambientAudio.getVolume());
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);

  // Camadas interativas visíveis no mapa
  const [showRealms, setShowRealms] = useState<boolean>(true);
  const [showCapitals, setShowCapitals] = useState<boolean>(true);
  const [showDungeons, setShowDungeons] = useState<boolean>(true);
  const [showTradeRoutes, setShowTradeRoutes] = useState<boolean>(true);
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true);
  const [inspectingPoiDetail, setInspectingPoiDetail] = useState<{
    name: string;
    title: string;
    description: string;
    coords: string;
    type: string;
    regionName: string;
    regionId: string;
  } | null>(null);

  // Sincroniza estado de reprodução do motor de áudio procedural
  useEffect(() => {
    const unsubscribe = ambientAudio.subscribe((playing, _regId, vol) => {
      setIsAudioPlaying(playing);
      setAudioVolume(vol);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Quando a aba do mapa desmonta, pausa o áudio ambiente
  useEffect(() => {
    return () => {
      ambientAudio.stop();
    };
  }, []);

  const isGm = activeRole === 'gm';
  const selectedRegion = getRegionById(selectedRegionId) || ORIGIN_REGIONS[4]; // Default Caeldrin

  const handleSelectRegion = (regId: string) => {
    sound.playCoinClink('PRT');
    setSelectedRegionId(regId);
    setSelectedPoiId(null);
    if (autoPlayAudio) {
      ambientAudio.playRegion(regId);
    }
  };

  const handleMovePartyTo = (locationName: string, regId: string) => {
    sound.playMapTravel();
    const region = getRegionById(regId);
    const regName = region ? region.name : 'Eldria';
    const formatted = `${regName} — ${locationName}`;
    setPartyCurrentLocation(formatted);
    if (onUpdatePartyLocation) {
      onUpdatePartyLocation(formatted, regId);
    }
    setLocationToast(`✦ Comitiva reposicionada para: ${formatted}`);
    setTimeout(() => setLocationToast(null), 3500);
  };

  const handleCopyRunes = (text: string) => {
    sound.playRuneChime();
    navigator.clipboard.writeText(text);
    setCopiedRuneText(true);
    setTimeout(() => setCopiedRuneText(false), 2000);
  };

  // Ícone por região
  const getRegionIcon = (regionId: string) => {
    switch (regionId) {
      case 'montanhas_gelo':
        return <Snowflake className="w-4 h-4 text-sky-400" />;
      case 'floresta_verdancia':
        return <Trees className="w-4 h-4 text-emerald-400" />;
      case 'terras_aridas':
        return <Sun className="w-4 h-4 text-amber-400" />;
      case 'terras_igneas':
        return <Flame className="w-4 h-4 text-red-400" />;
      case 'caeldrin':
        return <Crown className="w-4 h-4 text-yellow-300" />;
      case 'dominio_cibernetico':
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'campos_alarion':
        return <Wind className="w-4 h-4 text-lime-400" />;
      case 'ilhas_esquecidas':
        return <Anchor className="w-4 h-4 text-blue-400" />;
      case 'cidadela_sombras':
        return <Skull className="w-4 h-4 text-purple-400" />;
      default:
        return <Globe2 className="w-4 h-4 text-amber-300" />;
    }
  };

  // Coordenadas calibradas dos 9 Reinos no Mapa Ilustrado (relativo em %)
  const REGION_POSITIONS: Record<string, { top: string; left: string; color: string; border: string }> = {
    montanhas_gelo: { top: '15%', left: '32%', color: '#38bdf8', border: 'border-sky-400' },
    floresta_verdancia: { top: '35%', left: '16%', color: '#22c55e', border: 'border-emerald-400' },
    terras_aridas: { top: '21%', left: '72%', color: '#eab308', border: 'border-amber-400' },
    terras_igneas: { top: '43%', left: '80%', color: '#ef4444', border: 'border-red-400' },
    caeldrin: { top: '44%', left: '46%', color: '#f59e0b', border: 'border-amber-300' },
    dominio_cibernetico: { top: '64%', left: '72%', color: '#06b6d4', border: 'border-cyan-400' },
    campos_alarion: { top: '62%', left: '32%', color: '#84cc16', border: 'border-lime-400' },
    ilhas_esquecidas: { top: '70%', left: '12%', color: '#0284c7', border: 'border-blue-400' },
    cidadela_sombras: { top: '83%', left: '49%', color: '#a855f7', border: 'border-purple-400' },
  };

  // Principais POIs mapeados geograficamente no mapa múndi
  const MAP_POIS = [
    // Capitais Principais
    { id: 'frostgard', name: 'Frostgard', type: 'fortress', regId: 'montanhas_gelo', coords: 'H-4', top: '13%', left: '36%', icon: '🏰', title: 'Fortaleza Frostgard' },
    { id: 'vinterlund', name: 'Vinterlund', type: 'capital', regId: 'montanhas_gelo', coords: 'J-6', top: '18%', left: '28%', icon: '👑', title: 'Cidade de Vinterlund' },
    { id: 'fenda_eterna', name: 'Fenda Eterna', type: 'dungeon', regId: 'montanhas_gelo', coords: 'L-5', top: '22%', left: '38%', icon: '☠️', title: 'Descida à Fenda Gélida' },

    { id: 'eldervale', name: 'Eldervale', type: 'capital', regId: 'floresta_verdancia', coords: 'E-18', top: '34%', left: '19%', icon: '👑', title: 'Cidade das Raízes' },
    { id: 'arvore_ancestral', name: 'Yggdras', type: 'sanctuary', regId: 'floresta_verdancia', coords: 'F-20', top: '39%', left: '14%', icon: '✨', title: 'Árvore Ancestral' },
    { id: 'porto_solista', name: 'Porto Solista', type: 'port', regId: 'floresta_verdancia', coords: 'J-23', top: '44%', left: '23%', icon: '⚓', title: 'Porto Solista Fluvial' },

    { id: 'oasiss_zafir', name: 'Oásis de Zafir', type: 'capital', regId: 'terras_aridas', coords: 'S-12', top: '23%', left: '68%', icon: '👑', title: 'Capital de Zafir' },
    { id: 'templo_sol', name: 'Templo do Sol', type: 'sanctuary', regId: 'terras_aridas', coords: 'U-14', top: '27%', left: '76%', icon: '☀️', title: 'Zimbório do Astro-Rei' },

    { id: 'cidade_vulkar', name: 'Vulkar', type: 'capital', regId: 'terras_igneas', coords: 'Y-22', top: '41%', left: '77%', icon: '👑', title: 'Cidade da Forja Ígnea' },
    { id: 'remolino_magma', name: 'Remolino de Magma', type: 'dungeon', regId: 'terras_igneas', coords: 'AA-24', top: '47%', left: '84%', icon: '🌋', title: 'Vórtice de Magma' },

    { id: 'cidadela_estelar', name: 'Caeldrin', type: 'capital', regId: 'caeldrin', coords: 'P-20', top: '44%', left: '46%', icon: '👑', title: 'Cidadela Estelar Imperial' },
    { id: 'porto_real', name: 'Porto Real', type: 'port', regId: 'caeldrin', coords: 'R-22', top: '48%', left: '48%', icon: '⚓', title: 'Porto Real de Caeldrin' },

    { id: 'nucleo_prime', name: 'Núcleo Prime', type: 'capital', regId: 'dominio_cibernetico', coords: 'X-30', top: '61%', left: '74%', icon: '👑', title: 'Centro Cyber Prime' },
    { id: 'torre_singularidade', name: 'Singularidade', type: 'tower', regId: 'dominio_cibernetico', coords: 'Z-29', top: '66%', left: '68%', icon: '💠', title: 'Torre Quântica' },
    { id: 'porto_neon', name: 'Porto Neon', type: 'port', regId: 'dominio_cibernetico', coords: 'W-35', top: '70%', left: '78%', icon: '⚓', title: 'Porto Tecnomágico' },

    { id: 'vila_serena', name: 'Vila Serena', type: 'capital', regId: 'campos_alarion', coords: 'K-27', top: '59%', left: '33%', icon: '👑', title: 'Capital das Planícies' },
    { id: 'moinhos_alaron', name: 'Moinhos de Trigo', type: 'nature', regId: 'campos_alarion', coords: 'J-29', top: '65%', left: '28%', icon: '🌾', title: 'Moinhos Brancos' },

    { id: 'farol_elyndor', name: 'Farol de Elyndor', type: 'tower', regId: 'ilhas_esquecidas', coords: 'D-30', top: '68%', left: '16%', icon: '🗼', title: 'Farol de Cristal' },
    { id: 'cidade_thalor', name: 'Thalor Submersa', type: 'dungeon', regId: 'ilhas_esquecidas', coords: 'C-36', top: '74%', left: '10%', icon: '🏛️', title: 'Glória Afogada' },

    { id: 'torre_corrupcao', name: 'Torre da Corrupção', type: 'tower', regId: 'cidadela_sombras', coords: 'P-37', top: '80%', left: '47%', icon: '☠️', title: 'Assento do Mal Ancestral' },
    { id: 'santuario_abismo', name: 'Fenda do Abismo', type: 'dungeon', regId: 'cidadela_sombras', coords: 'N-39', top: '86%', left: '52%', icon: '🕳️', title: 'Portal do Vazio' },
  ];

  const currentAlphabet = REGIONAL_RUNIC_ALPHABETS[selectedRegion.id] || REGIONAL_RUNIC_ALPHABETS['caeldrin'];
  const translatedRuneCards = translateTextToRunes(runicInputText, selectedRegion.id);
  const runeStringOnly = translatedRuneCards.map((r) => r.runeSymbol).join('');

  // Imagem de mapa a exibir conforme o estilo selecionado
  const activeMapArtwork = useMemo(() => {
    if (mapViewStyle === 'atlas') return ELDRIA_WORLD_ATLAS_IMAGE;
    if (mapViewStyle === 'satellite') return ELDRIA_CONTINENTAL_SATELLITE_IMAGE;
    return ELDRIA_WORLD_ATLAS_IMAGE;
  }, [mapViewStyle]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4 py-3">
      {/* Toast Feedback de Viagem */}
      {locationToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-950 via-purple-950 to-zinc-900 border border-amber-400/80 text-amber-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce"
        >
          <Compass className="w-5 h-5 text-amber-400 animate-spin" />
          <span className="text-xs font-cinzel font-bold">{locationToast}</span>
        </div>
      )}

      {/* Cabeçalho do Mapa de Eldria */}
      <div className="bg-gradient-to-r from-[#0f081d] via-[#160e29] to-[#0a0514] border border-amber-600/40 rounded-2xl p-3 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-radial from-amber-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-cinzel font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ✦ ATLAS CARTOGRÁFICO DE ELDRIA &bull; 9 NAÇÕES
              </span>
              <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
                Grade Continental A–AE / 1–40
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-cinzel font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500">
              Atlas dos Reinos de Eldria &amp; As 9 Nações
            </h2>
            <p className="text-xs text-zinc-300 max-w-3xl mt-1 leading-relaxed">
              Explore a cartografia oficial em papiro antigo, rotas comerciais imperiais, fronteiras dos 9 reinos, línguas ancestrais e segredos das fendas abissais.
            </p>
          </div>

          {/* Card de Localização Atual da Comitiva */}
          <div className="flex items-center gap-3 bg-zinc-950/90 border border-amber-500/40 px-3.5 py-2.5 rounded-xl shrink-0 shadow-lg">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 relative">
              <MapPin className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-cinzel font-bold text-amber-400 tracking-wider flex items-center gap-1">
                <span>Posição da Comitiva:</span>
              </div>
              <div className="text-xs font-bold text-zinc-100 max-w-[220px] truncate">
                {partyCurrentLocation}
              </div>
              <div className="text-[10px] text-zinc-400">
                {campaign.players.length} Aventureiros Presentes &bull; {selectedRegion.weather || 'Clima Estável'}
              </div>
            </div>
          </div>
        </div>

        {/* Abas Superiores do Atlas */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-purple-900/40 overflow-x-auto">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition whitespace-nowrap min-h-[44px] ${
              activeTab === 'map'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-950/50'
                : 'bg-zinc-900/60 text-zinc-300 hover:text-amber-200 hover:bg-zinc-800'
            }`}
          >
            <Globe2 className="w-4 h-4" />
            <span>Mapa Cartográfico dos 9 Reinos</span>
          </button>

          <button
            onClick={() => setActiveTab('regions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition whitespace-nowrap min-h-[44px] ${
              activeTab === 'regions'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-950/50'
                : 'bg-zinc-900/60 text-zinc-300 hover:text-amber-200 hover:bg-zinc-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Enciclopédia Regional: {selectedRegion.name}</span>
          </button>

          <button
            onClick={() => setActiveTab('runes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition whitespace-nowrap min-h-[44px] ${
              activeTab === 'runes'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-950/50'
                : 'bg-zinc-900/60 text-zinc-300 hover:text-amber-200 hover:bg-zinc-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Decodificador Rúnico ({selectedRegion.language})</span>
          </button>

          <button
            onClick={() => setActiveTab('pois')}
            className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-semibold flex items-center gap-1.5 transition whitespace-nowrap min-h-[44px] ${
              activeTab === 'pois'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-950/50'
                : 'bg-zinc-900/60 text-zinc-300 hover:text-amber-200 hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Locais &amp; Masmorras ({selectedRegion.pointsOfInterest.length})</span>
          </button>
        </div>
      </div>

      {/* Carrossel Rápido de Seleção das 9 Regiões com Artwork Real */}
      <div className="bg-[#0b0615]/95 border border-purple-900/50 rounded-xl p-2.5 shadow-md">
        <div className="flex items-center justify-between gap-2 mb-2 px-1 flex-wrap">
          <span className="text-[11px] font-cinzel font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" /> Os 9 Grandes Reinos de Eldria
          </span>
          <span className="text-[10px] text-zinc-400">
            Clique na região para focar mapa, paisagem sonora, perigo e traços culturais
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-1.5">
          {ORIGIN_REGIONS.map((reg) => {
            const isSelected = reg.id === selectedRegionId;
            return (
              <button
                key={reg.id}
                type="button"
                onClick={() => handleSelectRegion(reg.id)}
                className={`p-2 rounded-lg text-left transition flex flex-col justify-between min-h-[76px] border relative overflow-hidden group ${
                  isSelected
                    ? `${reg.badgeBg} ring-2 ring-amber-400 shadow-lg font-semibold`
                    : 'bg-zinc-900/80 border-zinc-800/80 hover:border-amber-500/50 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {reg.imageUrl && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-50 transition-opacity duration-300 filter brightness-95"
                    style={{ backgroundImage: `url(${reg.imageUrl})` }}
                  />
                )}
                <div className="relative z-10 flex items-center justify-between w-full">
                  <span className="text-sm drop-shadow">{reg.symbol}</span>
                  <span className="text-[9px] font-mono text-zinc-400 drop-shadow">#{reg.number}</span>
                </div>
                <div className="relative z-10 mt-1">
                  <div className="text-[11px] font-cinzel font-bold leading-tight truncate drop-shadow text-amber-100">
                    {reg.name}
                  </div>
                  <div className="text-[9px] text-amber-300/90 font-mono truncate flex items-center justify-between">
                    <span>{reg.language}</span>
                    {reg.travelDaysFromCapital !== undefined && (
                      <span className="text-[8px] text-zinc-400">{reg.travelDaysFromCapital}d</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* BARRA DE ÁUDIO AMBIENTE REGIONAL */}
      <div className="bg-gradient-to-r from-[#0d0718] via-[#170a2a] to-[#0a0515] border border-purple-800/50 rounded-xl p-3 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              if (isAudioPlaying) {
                ambientAudio.stop();
              } else {
                ambientAudio.playRegion(selectedRegionId);
              }
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition shrink-0 shadow-md ${
              isAudioPlaying
                ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 shadow-amber-500/20 hover:scale-105'
                : 'bg-zinc-800/90 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
            }`}
            title={isAudioPlaying ? 'Pausar Paisagem Sonora' : 'Tocar Paisagem Sonora da Região'}
          >
            {isAudioPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-cinzel font-bold tracking-wider px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/50 flex items-center gap-1">
                <span>{selectedRegion.symbol}</span>
                <span>{selectedRegion.name}</span>
              </span>
              {isAudioPlaying ? (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                  <span className="flex items-center gap-0.5 h-3">
                    <span className="w-1 bg-amber-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-3" />
                    <span className="w-1 bg-amber-400 rounded-full animate-[pulse_1.2s_ease-in-out_infinite] h-2" />
                    <span className="w-1 bg-amber-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3.5" />
                    <span className="w-1 bg-amber-400 rounded-full animate-[pulse_1.0s_ease-in-out_infinite] h-2.5" />
                  </span>
                  <span className="hidden sm:inline">Paisagem Sonora Ativa</span>
                </span>
              ) : (
                <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">Pausado</span>
              )}
            </div>
            <div className="text-xs font-bold text-amber-200 font-cinzel truncate mt-0.5">
              {REGION_AUDIO_PROFILES[selectedRegionId]?.soundscapeTitle || 'Sons de Eldria'}
            </div>
            <div className="text-[11px] text-zinc-400 truncate max-w-xs sm:max-w-md">
              {REGION_AUDIO_PROFILES[selectedRegionId]?.description || 'Paisagem sonora ambiente sintetizada proceduralmente.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-purple-900/40 pt-2 sm:pt-0">
          <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoPlayAudio}
              onChange={(e) => {
                setAutoPlayAudio(e.target.checked);
                if (e.target.checked && !isAudioPlaying) {
                  ambientAudio.playRegion(selectedRegionId);
                }
              }}
              className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5"
            />
            <span className="text-[11px] text-zinc-300 font-medium">Auto-troca Sonora</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (audioVolume > 0) {
                  ambientAudio.setVolume(0);
                } else {
                  ambientAudio.setVolume(0.35);
                }
              }}
              className="text-zinc-400 hover:text-zinc-200 transition"
              title={audioVolume === 0 ? 'Desmutar' : 'Mutar'}
            >
              {audioVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={audioVolume}
              onChange={(e) => ambientAudio.setVolume(parseFloat(e.target.value))}
              className="w-20 sm:w-28 accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
              title={`Volume do som ambiente: ${Math.round(audioVolume * 100)}%`}
            />
            <span className="font-mono text-[10px] text-zinc-400 w-8 text-right">
              {Math.round(audioVolume * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* CONTEÚDO DA ABA 1: MAPA GERAL INTERATIVO (VISUAL CARTOGRÁFICO DE ALTA FIDELIDADE) */}
      {activeTab === 'map' && (
        <div className="space-y-3">
          <div className="bg-[#080410] border border-amber-600/40 rounded-2xl p-3 sm:p-5 shadow-2xl relative">
            {/* Barra de Ferramentas do Mapa */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-purple-900/40">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-cinzel font-bold text-amber-200 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-400" />
                  Cartografia Oficial de Eldria:
                </span>
                <span className="text-xs text-zinc-400">
                  Clique nos marcadores para ver informações, perigo ou viajar
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Alternador de Estilo de Mapa: Atlas Cartográfico vs Satélite vs Grade Tática */}
                <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setMapViewStyle('atlas')}
                    className={`px-2.5 py-1 rounded text-xs font-cinzel font-bold flex items-center gap-1.5 transition ${
                      mapViewStyle === 'atlas'
                        ? 'bg-amber-500 text-zinc-950 shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Grande Atlas Cartográfico em Papiro (Estilo Clássico de Alta Fantasia)"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Atlas Papiro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMapViewStyle('satellite')}
                    className={`px-2.5 py-1 rounded text-xs font-cinzel font-bold flex items-center gap-1.5 transition ${
                      mapViewStyle === 'satellite'
                        ? 'bg-amber-500 text-zinc-950 shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Visual de Terreno Continental Físico e Elevação"
                  >
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>Topográfico</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMapViewStyle('tactical')}
                    className={`px-2.5 py-1 rounded text-xs font-cinzel font-bold flex items-center gap-1.5 transition ${
                      mapViewStyle === 'tactical'
                        ? 'bg-amber-500 text-zinc-950 shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Grade Tática Setorial de Defesa e Fronteiras"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Grade Tática</span>
                  </button>
                </div>

                {/* Botão de Tela Cheia / Lightbox da Arte Cartográfica */}
                <button
                  type="button"
                  onClick={() =>
                    setViewingModalImage({
                      url: activeMapArtwork,
                      title: 'Grande Atlas Cartográfico dos Reinos de Eldria',
                      subtitle: 'Papiro Original dos Mestres de Nexaria &bull; Grade A–AE / 1–40',
                      lore: 'Cartografado na Era do Despertar, detalhando os 9 domínios sagrados desde os cumes gélidos de Frosten até as profundezas do Vazio Abissal.',
                    })
                  }
                  title="Ampliar Arte do Mapa Múndi em Alta Resolução"
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 text-xs font-cinzel font-bold flex items-center gap-1.5 transition"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ampliar</span>
                </button>

                {/* Controles de Zoom */}
                <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 px-2 py-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.min(prev + 0.15, 1.8))}
                    title="Aumentar Zoom"
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 transition"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono font-bold text-amber-400 px-1">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.max(prev - 0.15, 0.75))}
                    title="Diminuir Zoom"
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 transition"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    title="Resetar Zoom"
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Barra de Filtros de Camadas do Mapa */}
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-cinzel text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-amber-400" /> Camadas:
              </span>
              <button
                type="button"
                onClick={() => setShowRealms(!showRealms)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-cinzel font-semibold transition border flex items-center gap-1 shrink-0 ${
                  showRealms
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-zinc-900/60 text-zinc-500 border-zinc-800'
                }`}
              >
                <span>👑 Brasões Regionais</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCapitals(!showCapitals)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-cinzel font-semibold transition border flex items-center gap-1 shrink-0 ${
                  showCapitals
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-zinc-900/60 text-zinc-500 border-zinc-800'
                }`}
              >
                <span>🏰 Cidades &amp; Fortes</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDungeons(!showDungeons)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-cinzel font-semibold transition border flex items-center gap-1 shrink-0 ${
                  showDungeons
                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : 'bg-zinc-900/60 text-zinc-500 border-zinc-800'
                }`}
              >
                <span>☠️ Masmorras &amp; Fendas</span>
              </button>
              <button
                type="button"
                onClick={() => setShowTradeRoutes(!showTradeRoutes)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-cinzel font-semibold transition border flex items-center gap-1 shrink-0 ${
                  showTradeRoutes
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-zinc-900/60 text-zinc-500 border-zinc-800'
                }`}
              >
                <span>🛤️ Estradas Imperiais</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCoordinates(!showCoordinates)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-cinzel font-semibold transition border flex items-center gap-1 shrink-0 ${
                  showCoordinates
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-zinc-900/60 text-zinc-500 border-zinc-800'
                }`}
              >
                <span>📐 Grade A–AE</span>
              </button>
            </div>

            {/* Stage Cartográfico com Suporte a Zoom & Coordenadas A-AE / 1-40 */}
            <div className="overflow-auto max-h-[660px] rounded-xl border border-amber-500/30 bg-[#06030c] relative p-3 sm:p-4 scrollbar-thin scrollbar-thumb-purple-900 select-none">
              <div
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
                className="transition-transform duration-200 min-w-[940px] relative"
              >
                {mapViewStyle !== 'tactical' ? (
                  /* MAPA ILUSTRADO EM PAPIRO OU TOPOGRÁFICO DE ALTA FIDELIDADE */
                  <div className="relative w-[960px] h-[660px] rounded-2xl border-2 border-amber-500/60 overflow-hidden shadow-2xl bg-black">
                    <img
                      src={activeMapArtwork}
                      alt="Grande Atlas Cartográfico dos Reinos de Eldria"
                      className="w-full h-full object-cover object-center filter brightness-95 contrast-105 select-none"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                    {/* Grade de Coordenadas Cartográficas A–AE / 1–40 */}
                    {showCoordinates && (
                      <>
                        <div className="absolute top-2 left-10 right-10 flex justify-between text-[9px] font-mono text-amber-300 font-bold bg-black/70 px-3 py-0.5 rounded backdrop-blur-sm select-none border border-amber-500/40">
                          <span>A [01]</span><span>E [08]</span><span>J [15]</span><span>O [22]</span><span>T [29]</span><span>Y [36]</span><span>AE [40]</span>
                        </div>
                        <div className="absolute bottom-2 left-10 right-10 flex justify-between text-[9px] font-mono text-amber-300 font-bold bg-black/70 px-3 py-0.5 rounded backdrop-blur-sm select-none border border-amber-500/40">
                          <span>A [01]</span><span>E [08]</span><span>J [15]</span><span>O [22]</span><span>T [29]</span><span>Y [36]</span><span>AE [40]</span>
                        </div>
                        <div className="absolute left-2 top-10 bottom-10 flex flex-col justify-between text-[9px] font-mono text-amber-300 font-bold bg-black/70 px-1 py-1 rounded backdrop-blur-sm select-none border border-amber-500/40">
                          <span>01</span><span>10</span><span>20</span><span>30</span><span>40</span>
                        </div>
                      </>
                    )}

                    {/* Rosa dos Ventos Tradicional */}
                    <div className="absolute top-8 right-8 p-2.5 rounded-xl bg-black/85 border border-amber-500/60 text-center shadow-2xl backdrop-blur-md pointer-events-none z-10">
                      <div className="w-10 h-10 flex items-center justify-center text-amber-400 mx-auto">
                        <Compass className="w-8 h-8 animate-pulse text-amber-400" />
                      </div>
                      <span className="text-[10px] font-cinzel font-bold text-amber-300 block">ELDRIAS</span>
                      <span className="text-[7px] font-mono text-zinc-400 uppercase tracking-widest">SEPTENTRIO</span>
                    </div>

                    {/* SVG com Rotas Comerciais e Estradas Reais Conectando Caeldrin aos 9 Reinos */}
                    {showTradeRoutes && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-15">
                        <defs>
                          <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#d97706" stopOpacity="0.8" />
                          </linearGradient>
                        </defs>
                        {/* Caeldrin (46%, 44%) -> Frostgard (32%, 15%) */}
                        <path d="M 441 290 Q 380 200 307 100" fill="none" stroke="url(#routeGlow)" strokeWidth="2.5" strokeDasharray="5,4" className="opacity-75" />
                        {/* Caeldrin -> Eldervale (16%, 35%) */}
                        <path d="M 441 290 Q 280 260 153 231" fill="none" stroke="url(#routeGlow)" strokeWidth="2.5" strokeDasharray="5,4" className="opacity-75" />
                        {/* Caeldrin -> Zafir (72%, 21%) */}
                        <path d="M 441 290 Q 560 210 691 138" fill="none" stroke="url(#routeGlow)" strokeWidth="2.5" strokeDasharray="5,4" className="opacity-75" />
                        {/* Caeldrin -> Vulkar (80%, 43%) */}
                        <path d="M 441 290 Q 610 280 768 284" fill="none" stroke="url(#routeGlow)" strokeWidth="2.5" strokeDasharray="5,4" className="opacity-75" />
                        {/* Caeldrin -> Núcleo Prime (72%, 64%) */}
                        <path d="M 441 290 Q 570 360 691 422" fill="none" stroke="url(#routeGlow)" strokeWidth="2.5" strokeDasharray="5,4" className="opacity-75" />
                        {/* Caeldrin -> Vila Serena (32%, 62%) */}
                        <path d="M 441 290 Q 360 360 307 409" fill="none" stroke="url(#routeGlow)" strokeWidth="2.5" strokeDasharray="5,4" className="opacity-75" />
                        {/* Caeldrin -> Ilhas Esquecidas (12%, 70%) */}
                        <path d="M 307 409 Q 210 440 115 462" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4,4" className="opacity-60" />
                        {/* Caeldrin -> Cidadela das Sombras (49%, 83%) */}
                        <path d="M 441 290 Q 460 420 470 548" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="4,4" className="opacity-75" />
                      </svg>
                    )}

                    {/* Marcadores das 9 Regiões com Brasões */}
                    {showRealms &&
                      ORIGIN_REGIONS.map((reg) => {
                        const isSelected = reg.id === selectedRegionId;
                        const pos = REGION_POSITIONS[reg.id] || { top: '50%', left: '50%', color: '#f59e0b', border: 'border-amber-400' };

                        return (
                          <div
                            key={reg.id}
                            style={{ top: pos.top, left: pos.left }}
                            onClick={() => handleSelectRegion(reg.id)}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 group z-20 ${
                              isSelected ? 'scale-115 z-30' : 'hover:scale-105'
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              {/* Pin / Brasão Circular */}
                              <div
                                className={`w-10 h-10 rounded-full border-2 shadow-2xl backdrop-blur-md flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-amber-500 text-zinc-950 border-white ring-4 ring-amber-400/70 shadow-amber-500/60 animate-pulse'
                                    : 'bg-black/90 text-amber-300 border-amber-500/80 group-hover:border-amber-300 group-hover:bg-zinc-900 shadow-black/80'
                                }`}
                              >
                                <span className="text-base drop-shadow">{reg.symbol}</span>
                              </div>

                              {/* Etiqueta Flutuante do Reino */}
                              <div
                                className={`mt-1 px-2.5 py-1 rounded-xl border backdrop-blur-md shadow-2xl text-center whitespace-nowrap transition-all ${
                                  isSelected
                                    ? 'bg-zinc-950/95 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 font-bold'
                                    : 'bg-black/90 border-amber-500/40 text-zinc-200 group-hover:border-amber-400 group-hover:bg-zinc-900/95'
                                }`}
                              >
                                <div className="text-[11px] font-cinzel font-bold flex items-center gap-1 justify-center">
                                  <span>#{reg.number}</span>
                                  <span>{reg.name}</span>
                                </div>
                                <div className="text-[9px] text-amber-300/90 font-mono flex items-center gap-1 justify-center">
                                  <span>{reg.language}</span>
                                  <span>&bull;</span>
                                  <span>{reg.pointsOfInterest.length} POIs</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    {/* Pontos de Interesse Interativos (Capitais, Fortes, Masmorras) */}
                    {(showCapitals || showDungeons) &&
                      MAP_POIS.map((poi) => {
                        const isCapital = poi.type === 'capital';
                        const isDungeon = poi.type === 'dungeon';
                        const isFortress = poi.type === 'fortress';

                        if (isCapital && !showCapitals) return null;
                        if ((isDungeon || isFortress) && !showDungeons) return null;

                        return (
                          <div
                            key={poi.id}
                            style={{ top: poi.top, left: poi.left }}
                            onClick={() => {
                              const reg = getRegionById(poi.regId);
                              const fullPoi = reg?.pointsOfInterest.find((p) => p.id === poi.id);
                              setInspectingPoiDetail({
                                name: poi.name,
                                title: poi.title,
                                description: fullPoi?.description || 'Local notável mapeado nos anais de Eldria.',
                                coords: poi.coords,
                                type: poi.type,
                                regionName: reg?.name || 'Eldria',
                                regionId: poi.regId,
                              });
                            }}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-25 group"
                          >
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/80 hover:bg-zinc-900 border border-amber-400/60 hover:border-amber-300 text-[10px] text-amber-200 font-cinzel font-bold shadow-md transition group-hover:scale-110">
                              <span>{poi.icon}</span>
                              <span className="hidden sm:inline drop-shadow">{poi.name}</span>
                            </div>
                          </div>
                        );
                      })}

                    {/* Localização da Comitiva com Pulso Luminoso */}
                    <div
                      style={{ top: '44%', left: '46%' }}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-35 pointer-events-none"
                    >
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-12 h-12 rounded-full bg-amber-400/20 animate-ping" />
                        <span className="absolute w-8 h-8 rounded-full bg-amber-400/40 animate-pulse" />
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 border-2 border-white flex items-center justify-center shadow-lg shadow-amber-500/80">
                          <MapPin className="w-3.5 h-3.5 text-zinc-950 fill-zinc-950" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* SVG Visual do Continente de Eldria com as 9 Regiões em Grade Tática */
                  <div className="relative w-[960px] h-[660px] bg-gradient-to-br from-[#080d1a] via-[#0d071b] to-[#120814] rounded-2xl border-2 border-amber-500/40 p-4 shadow-inner shadow-purple-950/80">
                    <div className="absolute top-2 left-8 right-8 flex justify-between text-[9px] font-mono text-amber-500/50 select-none">
                      <span>A [01]</span><span>E [08]</span><span>J [15]</span><span>O [22]</span><span>T [29]</span><span>Y [36]</span><span>AE [40]</span>
                    </div>

                    <div className="absolute top-6 right-6 p-2 rounded-xl bg-zinc-950/90 border border-amber-500/40 text-center shadow-lg pointer-events-none">
                      <Compass className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
                      <span className="text-[9px] font-cinzel font-bold text-amber-300 block">SETOR TÁTICO</span>
                      <span className="text-[7px] font-mono text-zinc-400">9 DOMÍNIOS</span>
                    </div>

                    {/* 9 REGION TILES EM GRADE TÁTICA */}
                    <div
                      onClick={() => handleSelectRegion('montanhas_gelo')}
                      className={`absolute top-10 left-44 w-72 h-36 rounded-2xl border p-3 cursor-pointer transition transform hover:scale-[1.02] shadow-xl ${
                        selectedRegionId === 'montanhas_gelo'
                          ? 'border-sky-400 bg-sky-950/70 ring-2 ring-sky-300'
                          : 'border-sky-500/30 bg-sky-950/30 hover:bg-sky-950/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-cinzel font-black text-sky-200 flex items-center gap-1.5">
                          <Snowflake className="w-4 h-4 text-sky-400" />
                          1. Montanhas de Gelo
                        </span>
                        <span className="text-[9px] font-mono text-sky-300 bg-sky-900/60 px-1.5 py-0.5 rounded">
                          Frosten &bull; CON +2
                        </span>
                      </div>
                      <div className="text-[10px] text-sky-300/80 mt-1 italic">
                        {ORIGIN_REGIONS[0].weather}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1 text-[9px]">
                        <span className="px-1.5 py-0.5 rounded bg-sky-900/40 text-sky-200 border border-sky-700/40">
                          Fortaleza Frostgard (H-4)
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-sky-900/40 text-sky-200 border border-sky-700/40">
                          Vinterlund (J-6)
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={() => handleSelectRegion('floresta_verdancia')}
                      className={`absolute top-48 left-16 w-64 h-48 rounded-2xl border p-3 cursor-pointer transition transform hover:scale-[1.02] shadow-xl ${
                        selectedRegionId === 'floresta_verdancia'
                          ? 'border-emerald-400 bg-emerald-950/70 ring-2 ring-emerald-300'
                          : 'border-emerald-500/30 bg-emerald-950/30 hover:bg-emerald-950/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-cinzel font-black text-emerald-200 flex items-center gap-1.5">
                          <Trees className="w-4 h-4 text-emerald-400" />
                          2. Floresta de Verdância
                        </span>
                        <span className="text-[9px] font-mono text-emerald-300 bg-emerald-900/60 px-1.5 py-0.5 rounded">
                          Verdan &bull; SAB +2
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-300/80 mt-1 italic">
                        {ORIGIN_REGIONS[1].weather}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1 text-[9px]">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-200 border border-emerald-700/40">
                          Eldervale (E-18)
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-200 border border-emerald-700/40">
                          Árvore Ancestral
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={() => handleSelectRegion('terras_aridas')}
                      className={`absolute top-16 right-20 w-64 h-40 rounded-2xl border p-3 cursor-pointer transition transform hover:scale-[1.02] shadow-xl ${
                        selectedRegionId === 'terras_aridas'
                          ? 'border-amber-400 bg-amber-950/70 ring-2 ring-amber-300'
                          : 'border-amber-500/30 bg-amber-950/30 hover:bg-amber-950/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-cinzel font-black text-amber-200 flex items-center gap-1.5">
                          <Sun className="w-4 h-4 text-amber-400" />
                          3. Terras Áridas
                        </span>
                        <span className="text-[9px] font-mono text-amber-300 bg-amber-900/60 px-1.5 py-0.5 rounded">
                          Zarikh &bull; CON +2
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-300/80 mt-1 italic">
                        {ORIGIN_REGIONS[2].weather}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1 text-[9px]">
                        <span className="px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-200 border border-amber-700/40">
                          Oásis de Zafir (S-12)
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={() => handleSelectRegion('terras_igneas')}
                      className={`absolute top-60 right-10 w-64 h-44 rounded-2xl border p-3 cursor-pointer transition transform hover:scale-[1.02] shadow-xl ${
                        selectedRegionId === 'terras_igneas'
                          ? 'border-red-400 bg-red-950/70 ring-2 ring-red-300'
                          : 'border-red-500/30 bg-red-950/30 hover:bg-red-950/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-cinzel font-black text-red-200 flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-red-400" />
                          4. Terras Ígneas
                        </span>
                        <span className="text-[9px] font-mono text-red-300 bg-red-900/60 px-1.5 py-0.5 rounded">
                          Vulkan &bull; FOR +2
                        </span>
                      </div>
                      <div className="text-[10px] text-red-300/80 mt-1 italic">
                        {ORIGIN_REGIONS[3].weather}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1 text-[9px]">
                        <span className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-200 border border-red-700/40">
                          Cidade de Vulkar (Y-22)
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={() => handleSelectRegion('caeldrin')}
                      className={`absolute top-48 left-[340px] w-64 h-44 rounded-2xl border-2 p-3 cursor-pointer transition transform hover:scale-105 shadow-2xl z-20 ${
                        selectedRegionId === 'caeldrin'
                          ? 'border-amber-300 bg-amber-950/90 ring-4 ring-amber-400/60 shadow-amber-950'
                          : 'border-amber-500/60 bg-[#160d26]/90 hover:bg-[#201336]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-cinzel font-black text-amber-200 flex items-center gap-1.5">
                          <Crown className="w-4 h-4 text-amber-400" />
                          5. Caeldrin
                        </span>
                        <span className="text-[9px] font-cinzel font-bold text-amber-200 bg-amber-500/30 px-2 py-0.5 rounded-full border border-amber-400/50">
                          Capital Imperial
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-300 mt-1 font-semibold">
                        Sede da Coroa &bull; Caeldrico &bull; CAR +2
                      </div>
                      <div className="mt-2 text-[10px] text-zinc-300 leading-snug">
                        {ORIGIN_REGIONS[4].lore}
                      </div>
                    </div>

                    <div
                      onClick={() => handleSelectRegion('dominio_cibernetico')}
                      className={`absolute bottom-16 right-16 w-64 h-44 rounded-2xl border p-3 cursor-pointer transition transform hover:scale-[1.02] shadow-xl ${
                        selectedRegionId === 'dominio_cibernetico'
                          ? 'border-cyan-400 bg-cyan-950/70 ring-2 ring-cyan-300'
                          : 'border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-950/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-cinzel font-black text-cyan-200 flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-cyan-400" />
                          6. Domínio Cibernético
                        </span>
                        <span className="text-[9px] font-mono text-cyan-300 bg-cyan-900/60 px-1.5 py-0.5 rounded">
                          Cybernex &bull; INT +2
                        </span>
                      </div>
                      <div className="text-[10px] text-cyan-300/80 mt-1 italic">
                        {ORIGIN_REGIONS[5].weather}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1 text-[9px]">
                        <span className="px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-200 border border-cyan-700/40">
                          Núcleo Prime (X-30)
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={() => handleSelectRegion('campos_alarion')}
                      className={`absolute bottom-36 left-44 w-60 h-40 rounded-2xl border p-3 cursor-pointer transition transform hover:scale-[1.02] shadow-xl ${
                        selectedRegionId === 'campos_alarion'
                          ? 'border-lime-400 bg-lime-950/70 ring-2 ring-lime-300'
                          : 'border-lime-500/30 bg-lime-950/30 hover:bg-lime-950/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-cinzel font-black text-lime-200 flex items-center gap-1.5">
                          <Wind className="w-4 h-4 text-lime-400" />
                          7. Campos de Alarion
                        </span>
                        <span className="text-[9px] font-mono text-lime-300 bg-lime-900/60 px-1.5 py-0.5 rounded">
                          Alariano &bull; DES +2
                        </span>
                      </div>
                      <div className="text-[10px] text-lime-300/80 mt-1 italic">
                        {ORIGIN_REGIONS[6].weather}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1 text-[9px]">
                        <span className="px-1.5 py-0.5 rounded bg-lime-900/40 text-lime-200 border border-lime-700/40">
                          Vila Serena (K-27)
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={() => handleSelectRegion('ilhas_esquecidas')}
                      className={`absolute bottom-8 left-8 w-56 h-36 rounded-2xl border p-3 cursor-pointer transition transform hover:scale-[1.02] shadow-xl ${
                        selectedRegionId === 'ilhas_esquecidas'
                          ? 'border-blue-400 bg-blue-950/70 ring-2 ring-blue-300'
                          : 'border-blue-500/30 bg-blue-950/30 hover:bg-blue-950/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-cinzel font-black text-blue-200 flex items-center gap-1.5">
                          <Anchor className="w-4 h-4 text-blue-400" />
                          8. Ilhas Esquecidas
                        </span>
                        <span className="text-[9px] font-mono text-blue-300 bg-blue-900/60 px-1.5 py-0.5 rounded">
                          Thalass &bull; SAB +2
                        </span>
                      </div>
                      <div className="text-[10px] text-blue-300/80 mt-1 italic">
                        {ORIGIN_REGIONS[7].weather}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1 text-[9px]">
                        <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-200 border border-blue-700/40">
                          Farol de Elyndor (D-30)
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={() => handleSelectRegion('cidadela_sombras')}
                      className={`absolute bottom-6 left-[340px] w-64 h-36 rounded-2xl border p-3 cursor-pointer transition transform hover:scale-[1.02] shadow-xl ${
                        selectedRegionId === 'cidadela_sombras'
                          ? 'border-purple-400 bg-purple-950/90 ring-2 ring-purple-300'
                          : 'border-purple-500/30 bg-purple-950/30 hover:bg-purple-950/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-cinzel font-black text-purple-200 flex items-center gap-1.5">
                          <Skull className="w-4 h-4 text-purple-400" />
                          9. Cidadela das Sombras
                        </span>
                        <span className="text-[9px] font-mono text-purple-300 bg-purple-900/60 px-1.5 py-0.5 rounded">
                          Umbren &bull; CON +2
                        </span>
                      </div>
                      <div className="text-[10px] text-purple-300/80 mt-1 italic">
                        {ORIGIN_REGIONS[8].threatLevel}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1 text-[9px]">
                        <span className="px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-200 border border-purple-700/40">
                          Torre da Corrupção (P-37)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Painel Inferior de Atalho da Região Selecionada */}
            <div className="mt-4 p-4 rounded-xl bg-zinc-950/95 border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3">
                {selectedRegion.imageUrl ? (
                  <div
                    onClick={() =>
                      setViewingModalImage({
                        url: selectedRegion.imageUrl!,
                        title: `${selectedRegion.name} — ${selectedRegion.subtitle}`,
                        subtitle: `Idioma: ${selectedRegion.language} | Alfabeto: ${selectedRegion.alphabet}`,
                        lore: selectedRegion.lore,
                      })
                    }
                    className="w-16 h-14 rounded-xl overflow-hidden border-2 border-amber-500/50 shrink-0 cursor-pointer relative group shadow-md"
                    title="Clique para ampliar a arte oficial desta região"
                  >
                    <img
                      src={selectedRegion.imageUrl}
                      alt={selectedRegion.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition" />
                    <div className="absolute bottom-1 right-1 p-0.5 rounded bg-black/80 text-amber-300">
                      <Eye className="w-3 h-3" />
                    </div>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-xl">
                    {selectedRegion.symbol}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-cinzel font-bold text-amber-200 flex items-center gap-2">
                    <span>Reino: {selectedRegion.name}</span>
                    <span className="text-xs font-normal text-amber-400 italic">({selectedRegion.subtitle})</span>
                  </h3>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs text-zinc-400 mt-0.5 flex-wrap">
                    <span>
                      Nível de Ameaça:{' '}
                      <strong
                        className={
                          selectedRegion.threatLevel?.includes('EXTREMO')
                            ? 'text-red-400'
                            : selectedRegion.threatLevel?.includes('Alto')
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {selectedRegion.threatLevel || 'Moderado'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Idioma: <strong className="text-zinc-200">{selectedRegion.language}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Viagem da Capital: <strong className="text-zinc-200">{selectedRegion.travelDaysFromCapital ?? 7} dias</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedRegion.imageUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setViewingModalImage({
                        url: selectedRegion.imageUrl!,
                        title: `${selectedRegion.name} — ${selectedRegion.subtitle}`,
                        subtitle: `Idioma: ${selectedRegion.language} | Alfabeto: ${selectedRegion.alphabet}`,
                        lore: selectedRegion.lore,
                      })
                    }
                    className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 text-xs font-cinzel font-semibold flex items-center gap-1.5 transition"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Ver Arte</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('regions')}
                  className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ver Lore &amp; Cultura</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('runes')}
                  className="px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Decodificador ({selectedRegion.language})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: DETALHES REGIONAIS & LORE OFICIAL */}
      {activeTab === 'regions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0b0615] border border-amber-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              {/* Banner Ilustrado Oficial da Região */}
              {selectedRegion.imageUrl && (
                <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden mb-5 border-2 border-amber-500/40 shadow-2xl group">
                  <img
                    src={selectedRegion.imageUrl}
                    alt={selectedRegion.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-95 contrast-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0615] via-[#0b0615]/25 to-black/40 pointer-events-none" />

                  {/* Badges Flutuantes */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-500/40 text-[11px] font-cinzel font-bold text-amber-300 shadow">
                      {selectedRegion.symbol} Região Oficial #{selectedRegion.number}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-purple-950/80 backdrop-blur-md border border-purple-500/40 text-[10px] font-mono text-purple-200">
                      Grade: {selectedRegion.mapGrid}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={() =>
                        setViewingModalImage({
                          url: selectedRegion.imageUrl!,
                          title: `${selectedRegion.name} — ${selectedRegion.subtitle}`,
                          subtitle: `Idioma Materno: ${selectedRegion.language} | Alfabeto Rúnico: ${selectedRegion.alphabet}`,
                          lore: selectedRegion.lore,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-black/80 hover:bg-amber-500 hover:text-zinc-950 text-amber-300 text-xs font-cinzel font-bold border border-amber-500/40 backdrop-blur-md flex items-center gap-1.5 transition shadow-lg"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Ampliar Imagem</span>
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-cinzel font-black text-amber-100 drop-shadow-lg">
                        {selectedRegion.name}
                      </h3>
                      <p className="text-xs text-amber-300 font-cinzel italic drop-shadow">
                        {selectedRegion.subtitle} &bull; Herança Cultural: +2 {selectedRegion.bonusAttribute}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-purple-900/40 pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{selectedRegion.symbol}</span>
                  <div>
                    <h3 className="text-lg font-cinzel font-bold text-amber-200">
                      {selectedRegion.name}
                    </h3>
                    <div className="text-xs text-amber-400 font-sans italic">
                      {selectedRegion.subtitle}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleMovePartyTo('Capital da Região', selectedRegion.id)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-cinzel font-bold flex items-center gap-1.5 transition shadow"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Viajar para cá com a Comitiva</span>
                </button>
              </div>

              {/* Informações Atmosféricas e Faccionais */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
                <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                  <span className="text-[10px] uppercase font-cinzel text-zinc-400 block mb-0.5">Nível de Ameaça</span>
                  <span className="text-xs font-bold text-amber-300">{selectedRegion.threatLevel || 'Moderado'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                  <span className="text-[10px] uppercase font-cinzel text-zinc-400 block mb-0.5">Clima &amp; Atmosfera</span>
                  <span className="text-xs font-bold text-zinc-200">{selectedRegion.weather || 'Estável'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                  <span className="text-[10px] uppercase font-cinzel text-zinc-400 block mb-0.5">Facção Hegemônica</span>
                  <span className="text-xs font-bold text-zinc-200">{selectedRegion.dominantFaction || 'Conselho Regional'}</span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
                <div>
                  <h4 className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider mb-1">
                    História Ancestral &amp; Geografia
                  </h4>
                  <p className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80">
                    {selectedRegion.lore}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider mb-1">
                    Traço Cultural &amp; Herança de Criação
                  </h4>
                  <p className="bg-amber-950/30 p-3 rounded-xl border border-amber-600/30 text-amber-200">
                    {selectedRegion.culturalTrait}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 2: Idioma, Alfabeto e POIs da Região */}
          <div className="space-y-4">
            <div className="bg-[#0b0615] border border-amber-500/40 rounded-2xl p-4 shadow-xl">
              <h3 className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Alfabeto Rúnico de {selectedRegion.name}
              </h3>
              <p className="text-xs text-zinc-300 mb-3">
                Língua falada: <strong className="text-amber-200">{selectedRegion.language}</strong> ({selectedRegion.alphabet})
              </p>

              <div className="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                {Object.entries(currentAlphabet).slice(0, 16).map(([char, glyph]) => (
                  <div
                    key={char}
                    className="p-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-center hover:border-amber-500/50 transition cursor-default"
                    title={`${glyph.name} — Significado: ${glyph.meaning}`}
                  >
                    <div className="text-lg font-serif text-amber-300">{glyph.symbol}</div>
                    <div className="text-[10px] font-mono text-zinc-400">{char}</div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('runes')}
                className="w-full mt-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 text-xs font-cinzel font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>Abrir Decodificador Completo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Lista Rápida de POIs */}
            <div className="bg-[#0b0615] border border-amber-500/40 rounded-2xl p-4 shadow-xl">
              <h3 className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Pontos Notáveis ({selectedRegion.pointsOfInterest.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {selectedRegion.pointsOfInterest.map((poi) => (
                  <div
                    key={poi.id}
                    className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 hover:border-amber-500/40 transition flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-cinzel font-bold text-amber-100">{poi.name}</div>
                      <div className="text-[10px] text-zinc-400">{poi.title} &bull; {poi.coords}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMovePartyTo(poi.name, selectedRegion.id)}
                      className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[10px] font-bold transition flex items-center gap-1 shrink-0"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>Ir</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: ALFABETO RÚNICO & DECODIFICADOR INTERATIVO */}
      {activeTab === 'runes' && (
        <div className="space-y-4">
          <div className="bg-[#0b0615] border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-purple-900/40">
              <div>
                <h3 className="text-base font-cinzel font-bold text-amber-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Decodificador Rúnico Oficial &bull; {selectedRegion.name} ({selectedRegion.language})
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Digite palavras ou frases para converter em runas antigas desta região.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleCopyRunes(runeStringOnly)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 text-xs font-cinzel font-bold flex items-center gap-1.5 transition shrink-0"
              >
                {copiedRuneText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedRuneText ? 'Runas Copiadas!' : 'Copiar Runas'}</span>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-cinzel text-zinc-300 mb-1">
                Texto em Português / Comum:
              </label>
              <input
                type="text"
                value={runicInputText}
                onChange={(e) => setRunicInputText(e.target.value.toUpperCase())}
                placeholder="Ex: TESOURO DO ABISMO"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-purple-900/60 text-zinc-100 text-sm font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Resultado Visual Rúnico */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/30 mb-4 text-center">
              <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-2">Inscrição Rúnica Decodificada</span>
              <div className="text-3xl sm:text-4xl font-serif text-amber-300 tracking-widest break-all select-all py-2">
                {runeStringOnly || 'ᚠᚱᛟᛊᛏ'}
              </div>
            </div>

            {/* Cards dos Glifos Traduzidos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {translatedRuneCards.map((card, idx) => (
                <div
                  key={`${card.original}-${idx}`}
                  className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center"
                >
                  <div className="text-xl font-serif text-amber-300">{card.runeSymbol}</div>
                  <div className="text-xs font-mono font-bold text-zinc-200 mt-0.5">{card.original}</div>
                  <div className="text-[9px] text-zinc-400 truncate">{card.runeName}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 4: PONTOS DE INTERESSE & MASMORRAS */}
      {activeTab === 'pois' && (
        <div className="space-y-4">
          <div className="bg-[#0b0615] border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-purple-900/40">
              <div>
                <h3 className="text-base font-cinzel font-bold text-amber-200">
                  Cartografia de Locais: {selectedRegion.name}
                </h3>
                <p className="text-xs text-zinc-400">
                  Cidades, capitais, masmorras, santuários e perigos cadastrados nesta região.
                </p>
              </div>

              {/* Filtro de Categoria */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['all', 'capital', 'fortress', 'dungeon', 'sanctuary', 'nature', 'port'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterPoiCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-cinzel transition capitalize ${
                      filterPoiCategory === cat
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {cat === 'all' ? 'Todos' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedRegion.pointsOfInterest
                .filter((p) => filterPoiCategory === 'all' || p.type === filterPoiCategory)
                .map((poi) => (
                  <div
                    key={poi.id}
                    className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-sm font-cinzel font-bold text-amber-100">{poi.name}</span>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900/60">
                          {poi.coords}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 italic mb-2">{poi.title}</div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{poi.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-purple-300">Tipo: {poi.type}</span>
                      <button
                        type="button"
                        onClick={() => handleMovePartyTo(poi.name, selectedRegion.id)}
                        className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Viajar Para Cá</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* POPUP / DRAWER DE INSPEÇÃO DE POI NO MAPA */}
      {inspectingPoiDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setInspectingPoiDetail(null)}
        >
          <div
            className="max-w-md w-full bg-[#0d071a] border-2 border-amber-500/60 rounded-2xl overflow-hidden shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-purple-900/50 pb-3 mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                  {inspectingPoiDetail.regionName} &bull; Grade {inspectingPoiDetail.coords}
                </span>
                <h4 className="text-lg font-cinzel font-black text-amber-100">
                  {inspectingPoiDetail.name}
                </h4>
                <p className="text-xs text-zinc-300 italic">{inspectingPoiDetail.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingPoiDetail(null)}
                className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-4 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
              {inspectingPoiDetail.description}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  handleMovePartyTo(inspectingPoiDetail.name, inspectingPoiDetail.regionId);
                  setInspectingPoiDetail(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 text-xs font-cinzel font-bold flex items-center justify-center gap-1.5 shadow-lg"
              >
                <MapPin className="w-4 h-4" />
                <span>Viajar para cá com a Comitiva</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRegionId(inspectingPoiDetail.regionId);
                  setActiveTab('regions');
                  setInspectingPoiDetail(null);
                }}
                className="px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-700"
              >
                Ver Lore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / LIGHTBOX DE ARTE CARTOGRÁFICA & REGIONAL */}
      {viewingModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setViewingModalImage(null)}
        >
          <div
            className="max-w-5xl w-full bg-[#0d071a] border-2 border-amber-500/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="p-3.5 sm:p-4 border-b border-purple-900/50 flex items-center justify-between bg-zinc-950/90">
              <div>
                <h4 className="text-sm sm:text-base font-cinzel font-bold text-amber-200">
                  {viewingModalImage.title}
                </h4>
                {viewingModalImage.subtitle && (
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {viewingModalImage.subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewingModalImage(null)}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 border border-zinc-700 transition"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Imagem Central */}
            <div className="relative flex-1 overflow-auto bg-black/95 flex items-center justify-center p-2 min-h-[300px]">
              <img
                src={viewingModalImage.url}
                alt={viewingModalImage.title}
                className="max-w-full max-h-[68vh] object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Rodapé com Lore */}
            {viewingModalImage.lore && (
              <div className="p-3.5 sm:p-4 bg-zinc-950/95 border-t border-purple-900/40 text-xs text-zinc-300 italic leading-relaxed">
                "{viewingModalImage.lore}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
