import React, { useState, useEffect } from 'react';
import { CampaignRoom, CharacterSheet } from '../types/rpg';
import {
  ORIGIN_REGIONS,
  getRegionById,
  translateTextToRunes,
  REGIONAL_RUNIC_ALPHABETS,
  ELDRIA_WORLD_MAP_IMAGE,
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
  const [mapViewStyle, setMapViewStyle] = useState<'illustrated' | 'tactical'>('illustrated');
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
  const activeChar = campaign.players.find((p) => p.id === activeRole);
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
    const formatted = `${selectedRegion.name} — ${locationName}`;
    setPartyCurrentLocation(formatted);
    if (onUpdatePartyLocation) {
      onUpdatePartyLocation(formatted, regId);
    }
    setLocationToast(`Comitiva reposicionada para: ${formatted}`);
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

  const currentAlphabet = REGIONAL_RUNIC_ALPHABETS[selectedRegion.id] || REGIONAL_RUNIC_ALPHABETS['caeldrin'];
  const translatedRuneCards = translateTextToRunes(runicInputText, selectedRegion.id);
  const runeStringOnly = translatedRuneCards.map((r) => r.runeSymbol).join('');

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4 py-3">
      {/* Toast Feedback de Viagem */}
      {locationToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-950 via-purple-950 to-zinc-900 border border-amber-400/70 text-amber-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce"
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
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-cinzel font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ✦ MAPA MÚNDI OFICIAL &bull; REINOS DE ELDRIA
              </span>
              <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
                Grade de Coordenadas A–AE / 1–40
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-cinzel font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500">
              Atlas dos Reinos de Eldria &amp; As 9 Nações
            </h2>
            <p className="text-xs text-zinc-300 max-w-3xl mt-1 leading-relaxed">
              Explore os 9 grandes domínios com suas respectivas culturas, idiomas ancestrais, alfabetos rúnicos originais e pontos de interesse cartografados para a campanha.
            </p>
          </div>

          {/* Card de Localização Atual da Comitiva */}
          <div className="flex items-center gap-3 bg-zinc-950/80 border border-amber-500/30 px-3.5 py-2.5 rounded-xl shrink-0 shadow-md">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <MapPin className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-cinzel font-bold text-amber-400 tracking-wider">
                Posição da Comitiva:
              </div>
              <div className="text-xs font-bold text-zinc-100 max-w-[200px] truncate">
                {partyCurrentLocation}
              </div>
              <div className="text-[10px] text-zinc-400">
                {campaign.players.length} Aventureiros Presentes
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
            <span>Mapa Geral de Eldria</span>
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
            <span>Região Selecionada: {selectedRegion.name}</span>
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
            <span>Alfabeto Rúnico &amp; Decodificador ({selectedRegion.language})</span>
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
            <span>Pontos de Interesse ({selectedRegion.pointsOfInterest.length})</span>
          </button>
        </div>
      </div>

      {/* Carrossel Rápido de Seleção das 9 Regiões */}
      <div className="bg-[#0b0615]/90 border border-purple-900/40 rounded-xl p-2.5">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <span className="text-[11px] font-cinzel font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" /> As 9 Regiões dos Reinos de Eldria
          </span>
          <span className="text-[10px] text-zinc-400">
            Clique em qualquer região para ver seu mapa regional, lore e idioma
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
                className={`p-2 rounded-lg text-left transition flex flex-col justify-between min-h-[68px] border relative overflow-hidden group ${
                  isSelected
                    ? `${reg.badgeBg} ring-2 ring-amber-400 shadow-md font-semibold`
                    : 'bg-zinc-900/70 border-zinc-800/80 hover:border-amber-500/40 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {reg.imageUrl && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-35 transition-opacity duration-300"
                    style={{ backgroundImage: `url(${reg.imageUrl})` }}
                  />
                )}
                <div className="relative z-10 flex items-center justify-between w-full">
                  <span className="text-xs drop-shadow">{reg.symbol}</span>
                  <span className="text-[10px] font-mono text-zinc-400 drop-shadow">#{reg.number}</span>
                </div>
                <div className="relative z-10 mt-1">
                  <div className="text-[11px] font-cinzel font-bold leading-tight truncate drop-shadow">
                    {reg.name}
                  </div>
                  <div className="text-[9px] text-amber-300/90 font-mono truncate">
                    {reg.language}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* BARRA DE ÁUDIO AMBIENTE REGIONAL (Sons Procedurais das 9 Regiões via Web Audio API) */}
      <div className="bg-gradient-to-r from-[#0d0718] via-[#170a2a] to-[#0a0515] border border-purple-800/50 rounded-xl p-3 shadow-lg shadow-purple-950/30 flex flex-col sm:flex-row items-center justify-between gap-3">
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
                  <span className="hidden sm:inline">Reproduzindo Som Ambiente</span>
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
            <span className="text-[11px] text-zinc-300 font-medium">Troca Automática</span>
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
          <div className="bg-[#080410] border border-amber-600/30 rounded-2xl p-3 sm:p-5 shadow-2xl relative">
            {/* Barra de Ferramentas do Mapa */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-purple-900/40">
              <div className="flex items-center gap-2">
                <span className="text-xs font-cinzel font-bold text-amber-200">
                  ✦ Mapa dos Reinos de Eldria:
                </span>
                <span className="text-xs text-zinc-400">
                  Selecione uma área do mapa para viajar ou inspecionar detalhes
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Alternador de Estilo de Mapa: Ilustrado vs Grade Tática */}
                <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setMapViewStyle('illustrated')}
                    className={`px-2.5 py-1 rounded text-xs font-cinzel font-bold flex items-center gap-1.5 transition ${
                      mapViewStyle === 'illustrated'
                        ? 'bg-amber-500 text-zinc-950 shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Mapa Ilustrado</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapViewStyle('tactical')}
                    className={`px-2.5 py-1 rounded text-xs font-cinzel font-bold flex items-center gap-1.5 transition ${
                      mapViewStyle === 'tactical'
                        ? 'bg-amber-500 text-zinc-950 shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Grade Tática</span>
                  </button>
                </div>

                {/* Botão de Tela Cheia / Lightbox da Arte Cartográfica */}
                <button
                  type="button"
                  onClick={() => setViewingModalImage({
                    url: ELDRIA_WORLD_MAP_IMAGE,
                    title: 'Mapa Cartográfico dos Reinos de Eldria',
                    subtitle: 'Atlas Continental de Nexaria — 9 Regiões Sagradas (Coordenadas A-AE / 1-40)',
                    lore: 'O continente de Eldria compreende os nove reinos desde as Montanhas de Gelo ao extremo norte até a impenetrável Cidadela das Sombras no sul abissal.'
                  })}
                  title="Ampliar Arte do Mapa Múndi"
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 text-xs font-cinzel font-bold flex items-center gap-1.5 transition"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ampliar Mapa</span>
                </button>

                {/* Controles de Zoom */}
                <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 px-2 py-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.min(prev + 0.15, 1.6))}
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
                    title="Resetar Visualização"
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Stage Cartográfico com Suporte a Zoom & Coordenadas A-AE / 1-40 */}
            <div className="overflow-auto max-h-[640px] rounded-xl border border-amber-500/20 bg-[#06030c] relative p-4 scrollbar-thin scrollbar-thumb-purple-900">
              <div
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
                className="transition-transform duration-200 min-w-[850px] relative"
              >
                {mapViewStyle === 'illustrated' ? (
                  /* MAPA ILUSTRADO DE ALTA DEFINIÇÃO (ARTWORK CARTOGRÁFICO OFICIAL) */
                  <div className="relative w-[920px] h-[640px] rounded-2xl border-2 border-amber-500/50 overflow-hidden shadow-2xl bg-black">
                    <img
                      src={ELDRIA_WORLD_MAP_IMAGE}
                      alt="Mapa Ilustrado dos Reinos de Eldria"
                      className="w-full h-full object-cover object-center filter brightness-95 contrast-105 select-none"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/35 pointer-events-none" />

                    {/* Grade de Coordenadas Cartográficas Norte/Sul/Oeste */}
                    <div className="absolute top-2 left-10 right-10 flex justify-between text-[9px] font-mono text-amber-300 font-bold bg-black/60 px-3 py-0.5 rounded backdrop-blur-sm select-none border border-amber-500/30">
                      <span>A [01]</span><span>E [08]</span><span>J [15]</span><span>O [22]</span><span>T [29]</span><span>Y [36]</span><span>AE [40]</span>
                    </div>
                    <div className="absolute bottom-2 left-10 right-10 flex justify-between text-[9px] font-mono text-amber-300 font-bold bg-black/60 px-3 py-0.5 rounded backdrop-blur-sm select-none border border-amber-500/30">
                      <span>A [01]</span><span>E [08]</span><span>J [15]</span><span>O [22]</span><span>T [29]</span><span>Y [36]</span><span>AE [40]</span>
                    </div>
                    <div className="absolute left-2 top-10 bottom-10 flex flex-col justify-between text-[9px] font-mono text-amber-300 font-bold bg-black/60 px-1 py-1 rounded backdrop-blur-sm select-none border border-amber-500/30">
                      <span>01</span><span>10</span><span>20</span><span>30</span><span>40</span>
                    </div>

                    {/* Rosa dos Ventos Tradicional */}
                    <div className="absolute top-8 right-8 p-2 rounded-xl bg-black/80 border border-amber-500/50 text-center shadow-2xl backdrop-blur-md pointer-events-none z-10">
                      <div className="w-10 h-10 flex items-center justify-center text-amber-400 mx-auto">
                        <Compass className="w-8 h-8 animate-pulse" />
                      </div>
                      <span className="text-[9px] font-cinzel font-bold text-amber-300 block">ELDRIAS</span>
                      <span className="text-[7px] font-mono text-zinc-400">SEPTENTRIO</span>
                    </div>

                    {/* Hotspots / Marcadores Interativos das 9 Regiões com Imagem e Status */}
                    {ORIGIN_REGIONS.map((reg) => {
                      const isSelected = reg.id === selectedRegionId;
                      const positions: Record<string, { top: string; left: string }> = {
                        montanhas_gelo: { top: '16%', left: '30%' },
                        floresta_verdancia: { top: '36%', left: '16%' },
                        terras_aridas: { top: '22%', left: '72%' },
                        terras_igneas: { top: '44%', left: '80%' },
                        caeldrin: { top: '44%', left: '46%' },
                        dominio_cibernetico: { top: '64%', left: '72%' },
                        campos_alarion: { top: '62%', left: '32%' },
                        ilhas_esquecidas: { top: '68%', left: '12%' },
                        cidadela_sombras: { top: '82%', left: '48%' },
                      };
                      const pos = positions[reg.id] || { top: '50%', left: '50%' };

                      return (
                        <div
                          key={reg.id}
                          style={{ top: pos.top, left: pos.left }}
                          onClick={() => handleSelectRegion(reg.id)}
                          className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 group z-20 ${
                            isSelected ? 'scale-110 z-30' : 'hover:scale-105'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            {/* Pin / Marcador Circular */}
                            <div
                              className={`w-9 h-9 rounded-full border-2 shadow-2xl backdrop-blur-md flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-amber-500 text-zinc-950 border-white ring-4 ring-amber-400/60 shadow-amber-500/50 animate-pulse'
                                  : 'bg-black/85 text-amber-300 border-amber-500/70 group-hover:border-amber-300 group-hover:bg-zinc-900 shadow-black/80'
                              }`}
                            >
                              <span className="text-base">{reg.symbol}</span>
                            </div>

                            {/* Card / Etiqueta Flutuante da Região */}
                            <div
                              className={`mt-1 px-2.5 py-1 rounded-xl border backdrop-blur-md shadow-2xl text-center whitespace-nowrap transition-all ${
                                isSelected
                                  ? 'bg-zinc-950/95 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 font-bold'
                                  : 'bg-black/85 border-amber-500/30 text-zinc-200 group-hover:border-amber-400/80 group-hover:bg-zinc-900/95'
                              }`}
                            >
                              <div className="text-[11px] font-cinzel font-bold flex items-center gap-1 justify-center">
                                <span>#{reg.number}</span>
                                <span>{reg.name}</span>
                              </div>
                              <div className="text-[9px] text-amber-300/90 font-mono flex items-center gap-1.5 justify-center">
                                <span>{reg.language}</span>
                                <span>&bull;</span>
                                <span>{reg.pointsOfInterest.length} POIs</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* SVG Visual do Continente de Eldria com as 9 Regiões */
                  <div className="relative w-[920px] h-[640px] bg-gradient-to-br from-[#080d1a] via-[#0d071b] to-[#120814] rounded-2xl border-2 border-amber-500/40 p-3 shadow-inner shadow-purple-950/80">
                  {/* Grade de Coordenadas A-AE (Horizontal) e 1-40 (Vertical) */}
                  <div className="absolute top-1 left-8 right-8 flex justify-between text-[9px] font-mono text-amber-500/40 select-none">
                    <span>A</span><span>E</span><span>J</span><span>O</span><span>T</span><span>Y</span><span>AE</span>
                  </div>
                  <div className="absolute bottom-1 left-8 right-8 flex justify-between text-[9px] font-mono text-amber-500/40 select-none">
                    <span>A</span><span>E</span><span>J</span><span>O</span><span>T</span><span>Y</span><span>AE</span>
                  </div>
                  <div className="absolute left-1 top-8 bottom-8 flex flex-col justify-between text-[9px] font-mono text-amber-500/40 select-none">
                    <span>1</span><span>10</span><span>20</span><span>30</span><span>40</span>
                  </div>

                  {/* Rosa dos Ventos Tradicional no Canto Superior Direito */}
                  <div className="absolute top-6 right-6 p-2 rounded-xl bg-zinc-950/80 border border-amber-500/30 text-center shadow-lg pointer-events-none">
                    <div className="w-12 h-12 flex items-center justify-center text-amber-400 mx-auto">
                      <Compass className="w-10 h-10 animate-pulse" />
                    </div>
                    <span className="text-[9px] font-cinzel font-bold text-amber-300 block">
                      ELDRIAS
                    </span>
                    <span className="text-[8px] font-mono text-zinc-400">SEPTENTRIO</span>
                  </div>

                  {/* 9 REGION TILES NO MAPA MÚNDI */}

                  {/* 1. MONTANHAS DE GELO (NORTE) */}
                  <div
                    onClick={() => handleSelectRegion('montanhas_gelo')}
                    className={`absolute top-8 left-40 w-72 h-36 rounded-2xl border p-3 cursor-pointer transition transform hover:scale-[1.02] shadow-xl ${
                      selectedRegionId === 'montanhas_gelo'
                        ? 'border-sky-400 bg-sky-950/60 ring-2 ring-sky-300'
                        : 'border-sky-500/30 bg-sky-950/30 hover:bg-sky-950/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-cinzel font-black text-sky-200 flex items-center gap-1.5">
                        <Snowflake className="w-4 h-4 text-sky-400" />
                        1. Montanhas de Gelo
                      </span>
                      <span className="text-[9px] font-mono text-sky-300 bg-sky-900/60 px-1.5 py-0.5 rounded">
                        Frosten
                      </span>
                    </div>
                    <div className="text-[10px] text-sky-300/80 mt-1 italic">
                      Terras dos Ventos Cortantes
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1 text-[9px]">
                      <span className="px-1.5 py-0.5 rounded bg-sky-900/40 text-sky-200 border border-sky-700/40">
                        Fortaleza Frostgard
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-sky-900/40 text-sky-200 border border-sky-700/40">
                        Vinterlund
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-sky-900/40 text-sky-200 border border-sky-700/40">
                        Cavernas de Cristal
                      </span>
                    </div>
                  </div>

                  {/* 2. FLORESTA DE VERDÂNCIA (OESTE) */}
                  <div
                    onClick={() => handleSelectRegion('floresta_verdancia')}
                    className={`absolute top-48 left-16 w-64 h-48 rounded-2xl border p-3 cursor-pointer transition transform hover:scale-[1.02] shadow-xl ${
                      selectedRegionId === 'floresta_verdancia'
                        ? 'border-emerald-400 bg-emerald-950/60 ring-2 ring-emerald-300'
                        : 'border-emerald-500/30 bg-emerald-950/30 hover:bg-emerald-950/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-cinzel font-black text-emerald-200 flex items-center gap-1.5">
                        <Trees className="w-4 h-4 text-emerald-400" />
                        2. Floresta de Verdância
                      </span>
                      <span className="text-[9px] font-mono text-emerald-300 bg-emerald-900/60 px-1.5 py-0.5 rounded">
                        Verdan
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-300/80 mt-1 italic">
                      Coração Verde &bull; Bosque Sussurrante
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1 text-[9px]">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-200 border border-emerald-700/40">
                        Eldervale
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-200 border border-emerald-700/40">
                        Árvore Ancestral
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-200 border border-emerald-700/40">
                        Porto Solista
                      </span>
                    </div>
                  </div>

                  {/* 3. TERRAS ÁRIDAS (NORDESTE) */}
                  <div
                    onClick={() => handleSelectRegion('terras_aridas')}
                    className={`absolute top-16 right-20 w-64 h-40 rounded-2xl border p-3 cursor-pointer transition transform hover:scale-[1.02] shadow-xl ${
                      selectedRegionId === 'terras_aridas'
                        ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-300'
                        : 'border-amber-500/30 bg-amber-950/30 hover:bg-amber-950/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-cinzel font-black text-amber-200 flex items-center gap-1.5">
                        <Sun className="w-4 h-4 text-amber-400" />
                        3. Terras Áridas
                      </span>
                      <span className="text-[9px] font-mono text-amber-300 bg-amber-900/60 px-1.5 py-0.5 rounded">
                        Zarikh
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-300/80 mt-1 italic">
                      Domínio dos Clãs do Sol
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1 text-[9px]">
                      <span className="px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-200 border border-amber-700/40">
                        Oásis de Zafir
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-200 border border-amber-700/40">
                        Templo do Sol
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-200 border border-amber-700/40">
                        Cânion da Sede
                      </span>
                    </div>
                  </div>

                  {/* 4. TERRAS ÍGNEAS (LESTE) */}
                  <div
                    onClick={() => handleSelectRegion('terras_igneas')}
                    className={`absolute top-60 right-10 w-64 h-44 rounded-2xl border p-3 cursor-pointer transition transform hover:scale-[1.02] shadow-xl ${
                      selectedRegionId === 'terras_igneas'
                        ? 'border-red-400 bg-red-950/60 ring-2 ring-red-300'
                        : 'border-red-500/30 bg-red-950/30 hover:bg-red-950/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-cinzel font-black text-red-200 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-red-400" />
                        4. Terras Ígneas
                      </span>
                      <span className="text-[9px] font-mono text-red-300 bg-red-900/60 px-1.5 py-0.5 rounded">
                        Vulkan
                      </span>
                    </div>
                    <div className="text-[10px] text-red-300/80 mt-1 italic">
                      Domínio do Fogo Eterno &bull; Vulcões
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1 text-[9px]">
                      <span className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-200 border border-red-700/40">
                        Cidade de Vulkar
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-200 border border-red-700/40">
                        Remolino de Magma
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-200 border border-red-700/40">
                        Bastião de Obsidiana
                      </span>
                    </div>
                  </div>

                  {/* 5. CAELDRIN — CAPITAL IMPERIAL (CENTRO) */}
                  <div
                    onClick={() => handleSelectRegion('caeldrin')}
                    className={`absolute top-48 left-[340px] w-64 h-44 rounded-2xl border-2 p-3 cursor-pointer transition transform hover:scale-105 shadow-2xl z-20 ${
                      selectedRegionId === 'caeldrin'
                        ? 'border-amber-300 bg-amber-950/80 ring-4 ring-amber-400/50 shadow-amber-950'
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
                      Sede da Coroa &bull; Caeldrico
                    </div>
                    <div className="mt-2 text-[10px] text-zinc-300 leading-snug">
                      Coração de Eldria onde convergem todas as estradas e pactos do mundo.
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[9px] text-amber-300 font-mono">
                        Cidadela Estelar &bull; Porto Real
                      </span>
                      {partyCurrentLocation.includes('Caeldrin') && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded">
                          <MapPin className="w-3 h-3" /> Aqui
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 6. DOMÍNIO CIBERNÉTICO (SUDESTE) */}
                  <div
                    onClick={() => handleSelectRegion('dominio_cibernetico')}
                    className={`absolute bottom-16 right-16 w-64 h-44 rounded-2xl border p-3 cursor-pointer transition transform hover:scale-[1.02] shadow-xl ${
                      selectedRegionId === 'dominio_cibernetico'
                        ? 'border-cyan-400 bg-cyan-950/60 ring-2 ring-cyan-300'
                        : 'border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-950/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-cinzel font-black text-cyan-200 flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        6. Domínio Cibernético
                      </span>
                      <span className="text-[9px] font-mono text-cyan-300 bg-cyan-900/60 px-1.5 py-0.5 rounded">
                        Nexari
                      </span>
                    </div>
                    <div className="text-[10px] text-cyan-300/80 mt-1 italic">
                      Nexus da Inovação e Controle
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1 text-[9px]">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-200 border border-cyan-700/40">
                        Núcleo Prime
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-200 border border-cyan-700/40">
                        Singularidade
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-200 border border-cyan-700/40">
                        Fábricas Hexa
                      </span>
                    </div>
                  </div>

                  {/* 7. CAMPOS DE ALARION (SUDOESTE) */}
                  <div
                    onClick={() => handleSelectRegion('campos_alarion')}
                    className={`absolute bottom-36 left-44 w-60 h-40 rounded-2xl border p-3 cursor-pointer transition transform hover:scale-[1.02] shadow-xl ${
                      selectedRegionId === 'campos_alarion'
                        ? 'border-lime-400 bg-lime-950/60 ring-2 ring-lime-300'
                        : 'border-lime-500/30 bg-lime-950/30 hover:bg-lime-950/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-cinzel font-black text-lime-200 flex items-center gap-1.5">
                        <Wind className="w-4 h-4 text-lime-400" />
                        7. Campos de Alarion
                      </span>
                      <span className="text-[9px] font-mono text-lime-300 bg-lime-900/60 px-1.5 py-0.5 rounded">
                        Alariano
                      </span>
                    </div>
                    <div className="text-[10px] text-lime-300/80 mt-1 italic">
                      Planícies da Liberdade &bull; Ventos
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1 text-[9px]">
                      <span className="px-1.5 py-0.5 rounded bg-lime-900/40 text-lime-200 border border-lime-700/40">
                        Vila Serena
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-lime-900/40 text-lime-200 border border-lime-700/40">
                        Moinhos de Trigo
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-lime-900/40 text-lime-200 border border-lime-700/40">
                        Lago da Reflexão
                      </span>
                    </div>
                  </div>

                  {/* 8. ILHAS ESQUECIDAS (EXTREMO SUDOESTE) */}
                  <div
                    onClick={() => handleSelectRegion('ilhas_esquecidas')}
                    className={`absolute bottom-8 left-8 w-56 h-36 rounded-2xl border p-3 cursor-pointer transition transform hover:scale-[1.02] shadow-xl ${
                      selectedRegionId === 'ilhas_esquecidas'
                        ? 'border-blue-400 bg-blue-950/60 ring-2 ring-blue-300'
                        : 'border-blue-500/30 bg-blue-950/30 hover:bg-blue-950/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-cinzel font-black text-blue-200 flex items-center gap-1.5">
                        <Anchor className="w-4 h-4 text-blue-400" />
                        8. Ilhas Esquecidas
                      </span>
                      <span className="text-[9px] font-mono text-blue-300 bg-blue-900/60 px-1.5 py-0.5 rounded">
                        Thalass
                      </span>
                    </div>
                    <div className="text-[10px] text-blue-300/80 mt-1 italic">
                      Ecos de uma Era Antiga &bull; Mar
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1 text-[9px]">
                      <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-200 border border-blue-700/40">
                        Farol de Elyndor
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-200 border border-blue-700/40">
                        Thalor Submersa
                      </span>
                    </div>
                  </div>

                  {/* 9. CIDADELA DAS SOMBRAS (SUL) */}
                  <div
                    onClick={() => handleSelectRegion('cidadela_sombras')}
                    className={`absolute bottom-6 left-[340px] w-64 h-36 rounded-2xl border p-3 cursor-pointer transition transform hover:scale-[1.02] shadow-xl ${
                      selectedRegionId === 'cidadela_sombras'
                        ? 'border-purple-400 bg-purple-950/80 ring-2 ring-purple-300'
                        : 'border-purple-500/30 bg-purple-950/30 hover:bg-purple-950/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-cinzel font-black text-purple-200 flex items-center gap-1.5">
                        <Skull className="w-4 h-4 text-purple-400" />
                        9. Cidadela das Sombras
                      </span>
                      <span className="text-[9px] font-mono text-purple-300 bg-purple-900/60 px-1.5 py-0.5 rounded">
                        Umbren
                      </span>
                    </div>
                    <div className="text-[10px] text-purple-300/80 mt-1 italic">
                      Reino da Corrupção &bull; Fenda Abissal
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1 text-[9px]">
                      <span className="px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-200 border border-purple-700/40">
                        Torre da Corrupção
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-200 border border-purple-700/40">
                        Bastião do Luto
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-200 border border-purple-700/40">
                        Necrópole Eterna
                      </span>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>

            {/* Painel Inferior de Atalho da Região Selecionada */}
            <div className="mt-4 p-4 rounded-xl bg-zinc-950/90 border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3">
                {/* Miniatura Ilustrada da Região com Botão de Ampliar */}
                {selectedRegion.imageUrl ? (
                  <div
                    onClick={() => setViewingModalImage({
                      url: selectedRegion.imageUrl!,
                      title: `${selectedRegion.name} — ${selectedRegion.subtitle}`,
                      subtitle: `Idioma Materno: ${selectedRegion.language} | Alfabeto: ${selectedRegion.alphabet}`,
                      lore: selectedRegion.lore
                    })}
                    className="w-16 h-14 rounded-xl overflow-hidden border-2 border-amber-500/50 shrink-0 cursor-pointer relative group shadow-md"
                    title="Clique para ampliar a imagem oficial desta região"
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
                    <span>Região Ativa: {selectedRegion.name}</span>
                    <span className="text-xs font-normal text-amber-400 italic">({selectedRegion.subtitle})</span>
                  </h3>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs text-zinc-400 mt-0.5 flex-wrap">
                    <span>Idioma: <strong className="text-zinc-200">{selectedRegion.language}</strong></span>
                    <span>•</span>
                    <span>Alfabeto: <strong className="text-zinc-200">{selectedRegion.alphabet}</strong></span>
                    <span>•</span>
                    <span>Grade: <strong className="text-zinc-200">{selectedRegion.mapGrid}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedRegion.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setViewingModalImage({
                      url: selectedRegion.imageUrl!,
                      title: `${selectedRegion.name} — ${selectedRegion.subtitle}`,
                      subtitle: `Idioma: ${selectedRegion.language} | Alfabeto: ${selectedRegion.alphabet}`,
                      lore: selectedRegion.lore
                    })}
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
                  <span>Ver Lore Completa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('runes')}
                  className="px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Abrir Decodificador ({selectedRegion.language})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: DETALHES REGIONAIS & LORE OFICIAL */}
      {activeTab === 'regions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Coluna 1: Visão Geral da Região e Traço Cultural */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0b0615] border border-amber-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              {/* Ilustração / Banner Panorâmico Oficial da Região */}
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
                      onClick={() => setViewingModalImage({
                        url: selectedRegion.imageUrl!,
                        title: `${selectedRegion.name} — ${selectedRegion.subtitle}`,
                        subtitle: `Idioma Materno: ${selectedRegion.language} | Alfabeto Rúnico: ${selectedRegion.alphabet}`,
                        lore: selectedRegion.lore
                      })}
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

                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-400 block">Região Oficial</span>
                  <span className="text-xs font-bold text-amber-300">Nº {selectedRegion.number} de Eldria</span>
                </div>
              </div>

              {/* Lore oficial transcrita das tabelas */}
              <div className="bg-zinc-950/70 border border-purple-900/30 rounded-xl p-3.5 mb-4">
                <div className="text-[10px] font-cinzel font-bold text-purple-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Registro Histórico e Cartográfico:
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed italic">
                  "{selectedRegion.lore}"
                </p>
              </div>

              {/* Bônus Cultural & Idioma Materno */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/60">
                  <div className="text-[10px] font-cinzel font-bold text-amber-400 uppercase">
                    Idioma Regional Materno:
                  </div>
                  <div className="text-sm font-bold text-zinc-100 mt-0.5">
                    {selectedRegion.language}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Alfabeto Rúnico: <strong className="text-zinc-200">{selectedRegion.alphabet}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
                  <div className="text-[10px] font-cinzel font-bold text-amber-400 uppercase flex items-center justify-between">
                    <span>Herança Cultural:</span>
                    <span className="text-[10px] text-amber-300 font-mono">+{selectedRegion.bonusAttribute}</span>
                  </div>
                  <p className="text-xs text-zinc-200 mt-1 leading-snug">
                    {selectedRegion.culturalTrait}
                  </p>
                </div>
              </div>

              {/* Pontos de Interesse da Região */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" /> Pontos de Interesse Marcados no Mapa ({selectedRegion.pointsOfInterest.length})
                  </h4>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Grade: {selectedRegion.mapGrid}
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedRegion.pointsOfInterest.map((poi) => (
                    <div
                      key={poi.id}
                      className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-amber-500/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-100 font-cinzel">
                            {poi.name}
                          </span>
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-900/60">
                            {poi.coords}
                          </span>
                          <span className="text-[10px] text-zinc-400 italic">
                            ({poi.title})
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                          {poi.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleMovePartyTo(poi.name, selectedRegion.id)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-amber-500 hover:text-zinc-950 text-amber-300 border border-amber-500/40 text-[11px] font-cinzel font-bold transition shrink-0 self-end sm:self-auto min-h-[36px]"
                      >
                        Mover Comitiva
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 2: Informações de Jogo e Cartão do Idioma */}
          <div className="space-y-4">
            <div className="bg-[#0d071a] border border-amber-500/30 rounded-2xl p-4 shadow-xl">
              <div className="text-xs font-cinzel font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Cartilha do Idioma {selectedRegion.language}
              </div>
              <p className="text-xs text-zinc-300 mb-3 leading-relaxed">
                Cada região tem seu alfabeto rúnico sagrado. Qualquer personagem originário desta região sabe ler e pronunciar perfeitamente estas runas.
              </p>

              {/* Prévia de Runas Chave */}
              <div className="grid grid-cols-4 gap-1.5 bg-zinc-950/80 p-2.5 rounded-xl border border-purple-900/40 text-center mb-3">
                {['A', 'E', 'M', 'R', 'S', 'T', 'V', 'Z'].map((letter) => {
                  const glyph = currentAlphabet[letter];
                  if (!glyph) return null;
                  return (
                    <div key={letter} className="p-1.5 rounded bg-zinc-900/90 border border-zinc-800">
                      <div className="text-base text-amber-300 font-serif">{glyph.symbol}</div>
                      <div className="text-[10px] font-mono text-zinc-400">{letter} &bull; {glyph.name.split('-')[0]}</div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('runes')}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-cinzel font-bold text-xs rounded-xl transition shadow"
              >
                Abrir Alfabeto Rúnico Completo (A-Z)
              </button>
            </div>

            {/* Aventureiros com Origem Nesta Região */}
            <div className="bg-[#0d071a] border border-purple-900/40 rounded-2xl p-4">
              <div className="text-xs font-cinzel font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" /> Aventureiros Desta Região
              </div>

              {(() => {
                const natives = campaign.players.filter(
                  (p) =>
                    p.originRegion === selectedRegion.id ||
                    (p.primaryLanguage && p.primaryLanguage.toLowerCase() === selectedRegion.language.toLowerCase())
                );
                if (natives.length === 0) {
                  return (
                    <p className="text-xs text-zinc-400 italic">
                      Nenhum personagem na mesa é nativo desta região no momento. Ao criar uma ficha, você pode selecioná-la!
                    </p>
                  );
                }
                return (
                  <div className="space-y-1.5">
                    {natives.map((p) => (
                      <div
                        key={p.id}
                        className="p-2 rounded-lg bg-zinc-950/80 border border-purple-900/50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-amber-200">{p.name}</strong>
                          <span className="text-[11px] text-zinc-400 block">{p.characterClass} &bull; Nv {p.level}</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900">
                          {p.primaryLanguage || selectedRegion.language}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: ALFABETO RÚNICO COMPLETO & DECODIFICADOR */}
      {activeTab === 'runes' && (
        <div className="space-y-4">
          <div className="bg-[#0b0615] border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/40 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedRegion.symbol}</span>
                  <h3 className="text-base sm:text-lg font-cinzel font-bold text-amber-200">
                    Alfabeto Rúnico de {selectedRegion.name}: {selectedRegion.alphabet}
                  </h3>
                </div>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Idioma oficial: <strong className="text-amber-300">{selectedRegion.language}</strong> &bull; Sistema de escrita das 9 nações de Nexaria.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedRegionId}
                  onChange={(e) => handleSelectRegion(e.target.value)}
                  className="bg-zinc-900 border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-xs text-amber-200 focus:outline-none focus:border-amber-400 font-cinzel"
                >
                  {ORIGIN_REGIONS.map((r) => (
                    <option key={r.id} value={r.id} className="bg-zinc-950 text-zinc-100">
                      {r.name} ({r.language})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tradutor Interativo em Tempo Real */}
            <div className="bg-zinc-950/90 border border-amber-500/30 rounded-xl p-4 mb-5 shadow-inner">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                <label className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Escreva para Decodificar em {selectedRegion.language} ({selectedRegion.alphabet})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyRunes(runeStringOnly)}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs flex items-center gap-1 transition"
                  >
                    {copiedRuneText ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar Runas</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => sound.playRuneChime()}
                    className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-400 transition"
                    title="Tocar Ressonância Rúnica"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={runicInputText}
                onChange={(e) => {
                  setRunicInputText(e.target.value.toUpperCase());
                  sound.playRuneChime();
                }}
                placeholder="DIGITE A MENSAGEM SECRETA AQUI..."
                className="w-full bg-zinc-900 border border-purple-900/60 rounded-lg px-3 py-2 text-xs font-mono text-amber-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 mb-3"
              />

              {/* Resultado Rúnico Visual */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/60 via-zinc-900 to-amber-950/40 border border-amber-500/40 min-h-[64px] flex flex-wrap items-center gap-2">
                {translatedRuneCards.map((card, idx) => (
                  <div
                    key={idx}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-950/80 border border-amber-500/30 text-center shadow-md hover:scale-110 transition cursor-default"
                    title={`${card.original} = ${card.runeName} (${card.runeMeaning})`}
                  >
                    <div className="text-xl font-serif text-amber-300 leading-none">
                      {card.runeSymbol}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-400 mt-1">
                      {card.original}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grade Completa das 26 Letras Rúnicas Oficiais (A - Z) */}
            <div>
              <div className="text-xs font-cinzel font-bold text-amber-400 uppercase tracking-wider mb-2.5">
                Tabela Alfabeto Completo (A a Z) &bull; {selectedRegion.alphabet}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {Object.keys(currentAlphabet).map((char) => {
                  const glyph = currentAlphabet[char];
                  return (
                    <div
                      key={char}
                      className="p-2 rounded-xl bg-zinc-950/90 border border-purple-900/50 hover:border-amber-500/60 text-center transition shadow-sm"
                    >
                      <div className="text-2xl font-serif text-amber-300 mb-1">
                        {glyph.symbol}
                      </div>
                      <div className="text-xs font-bold text-zinc-200">
                        {glyph.letter}
                      </div>
                      <div className="text-[10px] text-amber-400/90 font-mono truncate">
                        {glyph.name}
                      </div>
                      <div className="text-[9px] text-zinc-400 truncate">
                        {glyph.meaning}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 4: LISTA COMPLETA DE PONTOS DE INTERESSE (POIS) */}
      {activeTab === 'pois' && (
        <div className="space-y-4">
          <div className="bg-[#0b0615] border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-900/40 pb-3 mb-4">
              <div>
                <h3 className="text-base font-cinzel font-bold text-amber-200">
                  Pontos de Interesse Cartografados de {selectedRegion.name}
                </h3>
                <p className="text-xs text-zinc-400">
                  Fortalezas, cidades capitais, masmorras, santuários e segredos locais.
                </p>
              </div>

              {/* Filtro por Categoria */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {['all', 'capital', 'fortress', 'dungeon', 'sanctuary', 'port'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterPoiCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-cinzel font-semibold transition whitespace-nowrap ${
                      filterPoiCategory === cat
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {cat === 'all' && 'Todos'}
                    {cat === 'capital' && 'Cidades'}
                    {cat === 'fortress' && 'Fortalezas'}
                    {cat === 'dungeon' && 'Masmorras/Abismos'}
                    {cat === 'sanctuary' && 'Santuários'}
                    {cat === 'port' && 'Portos'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedRegion.pointsOfInterest
                .filter((p) => filterPoiCategory === 'all' || p.type === filterPoiCategory)
                .map((poi) => (
                  <div
                    key={poi.id}
                    className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/50 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-cinzel font-bold text-amber-200">
                          {poi.name}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900/60">
                          {poi.coords}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 italic mb-2">
                        {poi.title}
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {poi.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-900 flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-purple-300">
                        Tipo: {poi.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMovePartyTo(poi.name, selectedRegion.id)}
                        className="px-2.5 py-1 rounded bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 text-xs font-bold transition flex items-center gap-1"
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
