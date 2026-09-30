import React, { useState, useMemo } from 'react';
import {
  CampaignRoom,
  CampaignChronicleEvent,
  ChronicleCategory,
  ItemRarity,
} from '../types/rpg';
import { sound } from '../utils/audio';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  MapPin,
  Award,
  Crown,
  Share2,
  Check,
  X,
  Swords,
  ScrollText,
  Compass,
  Hammer,
  Zap,
  Tag,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';

interface CampaignChroniclesViewProps {
  campaign: CampaignRoom;
  isGm: boolean;
  onUpdateCampaign: (updated: CampaignRoom) => void;
}

export const CampaignChroniclesView: React.FC<CampaignChroniclesViewProps> = ({
  campaign,
  isGm,
  onUpdateCampaign,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | ChronicleCategory>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState(false);

  // Modal Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<ChronicleCategory>('mestre');
  const [formImportance, setFormImportance] = useState<'normal' | 'notavel' | 'epico' | 'lendario'>('notavel');
  const [formIconEmoji, setFormIconEmoji] = useState('📜');
  const [formCharacterName, setFormCharacterName] = useState('Todo o Grupo');
  const [formLocationName, setFormLocationName] = useState('');

  const chroniclesList = campaign.chronicles || [];

  // Filtered Chronicles
  const filteredChronicles = useMemo(() => {
    return chroniclesList.filter((chronicle) => {
      const matchCategory = activeFilter === 'all' || chronicle.category === activeFilter;
      const matchSearch =
        chronicle.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chronicle.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (chronicle.characterName && chronicle.characterName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (chronicle.locationName && chronicle.locationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (chronicle.itemName && chronicle.itemName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [chroniclesList, activeFilter, searchQuery]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: chroniclesList.length,
      nivel: 0,
      item: 0,
      mapa: 0,
      forja: 0,
      mestre: 0,
      geral: 0,
    };
    chroniclesList.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return counts;
  }, [chroniclesList]);

  // Add Manual Chronicle
  const handleSaveManualChronicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    sound.playSuccessFanfare();

    const newChronicle: CampaignChronicleEvent = {
      id: `chronicle-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'master_note',
      category: formCategory,
      title: formTitle.trim(),
      description: formDescription.trim(),
      characterName: formCharacterName.trim() || undefined,
      locationName: formLocationName.trim() || undefined,
      importance: formImportance,
      iconEmoji: formIconEmoji,
      author: campaign.gmName,
      timestamp: Date.now(),
    };

    onUpdateCampaign({
      ...campaign,
      chronicles: [newChronicle, ...chroniclesList],
    });

    setIsModalOpen(false);
    setFormTitle('');
    setFormDescription('');
  };

  // Delete Chronicle
  const handleDeleteChronicle = (id: string) => {
    sound.playCoinClink('BRZ');
    const updated = chroniclesList.filter((c) => c.id !== id);
    onUpdateCampaign({
      ...campaign,
      chronicles: updated,
    });
  };

  // Auto-scan and sync current campaign deeds
  const handleAutoSyncDeeds = () => {
    sound.playDiceRoll();
    const existingTitles = new Set(chroniclesList.map((c) => c.title.toLowerCase()));
    const generated: CampaignChronicleEvent[] = [];

    // 1. Scan Player Levels
    campaign.players.forEach((player) => {
      const levelTitle = `Ascensão Heroica: ${player.name} alcançou o Nível ${player.level}!`;
      if (!existingTitles.has(levelTitle.toLowerCase())) {
        generated.push({
          id: `chronicle-lvl-${player.id}-${Date.now()}`,
          type: 'level_up',
          category: 'nivel',
          title: levelTitle,
          description: `${player.name} (${player.characterClass}, ${player.race}) evoluiu para o Nível ${player.level} com ${player.hp.max} PV e Maestria Grau ${player.starsLevel || 1}.`,
          characterName: player.name,
          characterId: player.id,
          levelReached: player.level,
          importance: player.level >= 5 ? 'lendario' : 'epico',
          iconEmoji: '🌟',
          timestamp: Date.now() - Math.floor(Math.random() * 3600000),
        });
      }

      // 2. Scan Rare / Epic / Legendary Items in inventory
      (player.inventory || []).forEach((item) => {
        if (['raro', 'epico', 'lendario', 'abissal'].includes(item.rarity || '')) {
          const itemTitle = `Tesouro Conquistado: ${item.name}`;
          if (!existingTitles.has(itemTitle.toLowerCase())) {
            generated.push({
              id: `chronicle-item-${item.id}-${Date.now()}`,
              type: 'valuable_item',
              category: 'item',
              title: itemTitle,
              description: `${player.name} adquiriu ${item.name} (${item.rarity?.toUpperCase()}). ${item.effectText || item.description || ''}`,
              characterName: player.name,
              characterId: player.id,
              itemName: item.name,
              itemRarity: item.rarity,
              importance: item.rarity === 'lendario' || item.rarity === 'abissal' ? 'lendario' : 'notavel',
              iconEmoji: item.iconEmoji || '💎',
              timestamp: Date.now() - Math.floor(Math.random() * 7200000),
            });
          }
        }
      });

      // 3. Scan Location
      if (player.currentLocation) {
        const locTitle = `Chegada a ${player.currentLocation}`;
        if (!existingTitles.has(locTitle.toLowerCase())) {
          generated.push({
            id: `chronicle-loc-${player.id}-${Date.now()}`,
            type: 'map_change',
            category: 'mapa',
            title: locTitle,
            description: `A comitiva de aventureiros viajou pelas terras de Eldria e estabeleceu-se em ${player.currentLocation}.`,
            locationName: player.currentLocation,
            characterName: player.name,
            importance: 'notavel',
            iconEmoji: '🗺️',
            timestamp: Date.now() - Math.floor(Math.random() * 10800000),
          });
        }
      }
    });

    if (generated.length === 0) {
      sound.playCoinClink('PRT');
      alert('Nenhum novo feito pendente. Todos os níveis e tesouros já estão registrados nas crônicas!');
      return;
    }

    sound.playSuccessFanfare();
    onUpdateCampaign({
      ...campaign,
      chronicles: [...generated, ...chroniclesList],
    });
  };

  // Copy Markdown Feed
  const handleCopyChronicles = () => {
    sound.playCoinClink('PRT');
    const header = `# 📜 Crônicas de Campanha — Sala ${campaign.code}\n**Campanha:** ${campaign.name} | **Mestre:** ${campaign.gmName}\n\n`;
    const body = chroniclesList
      .map((c) => {
        const date = new Date(c.timestamp).toLocaleDateString('pt-BR');
        return `### ${c.iconEmoji || '•'} ${c.title} (${date})\n**Categoria:** ${c.category.toUpperCase()} | **Grau:** ${c.importance.toUpperCase()}\n${c.description}\n`;
      })
      .join('\n---\n\n');

    navigator.clipboard.writeText(header + body);
    setCopiedFeed(true);
    setTimeout(() => setCopiedFeed(false), 2500);
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'lendario':
        return 'bg-amber-950/80 border-amber-500 text-amber-300 ring-1 ring-amber-500/50';
      case 'epico':
        return 'bg-purple-950/80 border-purple-500 text-purple-300 ring-1 ring-purple-500/50';
      case 'notavel':
        return 'bg-blue-950/80 border-blue-500 text-blue-300';
      default:
        return 'bg-zinc-900 border-zinc-700 text-zinc-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner of Chronicles */}
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-[#170a2b] via-[#0d071a] to-[#250d18] p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-[10px] font-cinzel font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Linha do Tempo Oficial
              </span>
              <span className="text-xs text-purple-300 font-mono">
                {chroniclesList.length} feitos registrados
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-cinzel font-bold text-zinc-100 flex items-center gap-2">
              <span>Crônicas de Campanha &amp; Feitos Heroicos</span>
            </h2>
            <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed font-sans">
              Registro contínuo e automático da saga: ascensões de nível, tesouros lendários descobertos, marcos de viagem no mapa e anotações históricas do Mestre.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isGm && (
              <>
                <button
                  type="button"
                  onClick={handleAutoSyncDeeds}
                  className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-600/50 text-purple-200 text-xs font-cinzel font-bold flex items-center gap-1.5 transition shadow"
                  title="Detectar e gerar crônicas para níveis atuais, armas raras e locais de jogadores"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sincronizar Feitos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 text-xs font-cinzel font-bold flex items-center gap-1.5 transition shadow-lg active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ Anotação do Mestre</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleCopyChronicles}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-cinzel font-semibold flex items-center gap-1.5 transition"
              title="Copiar linha do tempo em texto para Discord ou notas"
            >
              {copiedFeed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedFeed ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filtrar por herói, feito, item raro ou local..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-amber-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin text-xs">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-cinzel font-semibold transition whitespace-nowrap text-xs ${
              activeFilter === 'all'
                ? 'bg-zinc-100 text-zinc-950 font-bold shadow'
                : 'bg-zinc-950/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Todos ({categoryCounts.all})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('nivel')}
            className={`px-2.5 py-1 rounded-lg font-cinzel font-semibold transition whitespace-nowrap text-xs flex items-center gap-1 ${
              activeFilter === 'nivel'
                ? 'bg-amber-950 border border-amber-500 text-amber-200 font-bold'
                : 'bg-zinc-950/80 text-zinc-400 hover:text-amber-300 border border-zinc-800'
            }`}
          >
            <span>🌟 Níveis</span>
            <span className="font-mono text-[10px]">({categoryCounts.nivel || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('item')}
            className={`px-2.5 py-1 rounded-lg font-cinzel font-semibold transition whitespace-nowrap text-xs flex items-center gap-1 ${
              activeFilter === 'item'
                ? 'bg-purple-950 border border-purple-500 text-purple-200 font-bold'
                : 'bg-zinc-950/80 text-zinc-400 hover:text-purple-300 border border-zinc-800'
            }`}
          >
            <span>💎 Itens Raros</span>
            <span className="font-mono text-[10px]">({categoryCounts.item || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('mapa')}
            className={`px-2.5 py-1 rounded-lg font-cinzel font-semibold transition whitespace-nowrap text-xs flex items-center gap-1 ${
              activeFilter === 'mapa'
                ? 'bg-emerald-950 border border-emerald-500 text-emerald-200 font-bold'
                : 'bg-zinc-950/80 text-zinc-400 hover:text-emerald-300 border border-zinc-800'
            }`}
          >
            <span>🗺️ Viagens</span>
            <span className="font-mono text-[10px]">({categoryCounts.mapa || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('mestre')}
            className={`px-2.5 py-1 rounded-lg font-cinzel font-semibold transition whitespace-nowrap text-xs flex items-center gap-1 ${
              activeFilter === 'mestre'
                ? 'bg-rose-950 border border-rose-500 text-rose-200 font-bold'
                : 'bg-zinc-950/80 text-zinc-400 hover:text-rose-300 border border-zinc-800'
            }`}
          >
            <span>✍️ Mestre</span>
            <span className="font-mono text-[10px]">({categoryCounts.mestre || 0})</span>
          </button>
        </div>
      </div>

      {/* Timeline Feed Container */}
      <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-amber-500/80 before:via-purple-600/60 before:to-zinc-800">
        {filteredChronicles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center space-y-3">
            <ScrollText className="w-10 h-10 text-purple-400/40 mx-auto" />
            <h3 className="font-cinzel font-bold text-zinc-200 text-sm">
              Nenhuma crônica registrada neste filtro
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              As crônicas registram automaticamente quando heróis sobem de nível, encontram itens valiosos ou chegam a novas cidades no mapa.
            </p>
            {isGm && (
              <button
                type="button"
                onClick={handleAutoSyncDeeds}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-cinzel font-bold transition inline-flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Sincronizar Feitos dos Personagens</span>
              </button>
            )}
          </div>
        ) : (
          filteredChronicles.map((event) => {
            const dateStr = new Date(event.timestamp).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
            const timeStr = new Date(event.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={event.id} className="relative group">
                {/* Timeline Node Marker */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-3.5 w-3.5 h-3.5 rounded-full border-2 bg-zinc-950 flex items-center justify-center transition-transform group-hover:scale-125 ${
                    event.importance === 'lendario'
                      ? 'border-amber-400 shadow-lg shadow-amber-500/50'
                      : event.importance === 'epico'
                      ? 'border-purple-400 shadow-md shadow-purple-500/40'
                      : 'border-zinc-500'
                  }`}
                />

                {/* Chronicle Card */}
                <div
                  className={`p-4 rounded-xl border bg-gradient-to-r from-zinc-950/90 via-zinc-900/90 to-zinc-950/90 shadow-md transition-all hover:border-zinc-700 ${
                    event.importance === 'lendario'
                      ? 'border-amber-500/50 ring-1 ring-amber-500/30'
                      : event.importance === 'epico'
                      ? 'border-purple-500/50'
                      : 'border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0 p-1.5 rounded-xl bg-black/40 border border-white/5">
                        {event.iconEmoji || '📜'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-cinzel font-bold text-sm sm:text-base text-zinc-100">
                            {event.title}
                          </h4>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold uppercase border ${getImportanceBadge(
                              event.importance
                            )}`}
                          >
                            {event.importance}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-300 leading-relaxed font-sans mt-1">
                          {event.description}
                        </p>

                        {/* Details Tags */}
                        <div className="flex items-center gap-2 flex-wrap mt-2.5 text-[11px] text-zinc-400">
                          {event.characterName && (
                            <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 flex items-center gap-1 font-cinzel">
                              <Crown className="w-3 h-3 text-amber-400" />
                              {event.characterName}
                            </span>
                          )}

                          {event.locationName && (
                            <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-400" />
                              {event.locationName}
                            </span>
                          )}

                          {event.itemName && (
                            <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-700/50 text-purple-300 flex items-center gap-1 font-mono">
                              <Tag className="w-3 h-3 text-purple-400" />
                              {event.itemName} ({event.itemRarity?.toUpperCase()})
                            </span>
                          )}

                          {event.levelReached && (
                            <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/50 text-amber-300 flex items-center gap-1 font-mono font-bold">
                              ★ Nível {event.levelReached}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
                      <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{dateStr}</span>
                        <span className="text-zinc-500">• {timeStr}</span>
                      </div>

                      {isGm && (
                        <button
                          type="button"
                          onClick={() => handleDeleteChronicle(event.id)}
                          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition mt-2"
                          title="Excluir este registro de crônica"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Adding Manual Master Chronicle */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gradient-to-b from-[#180a29] to-[#0c0516] border border-amber-500/50 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-cinzel font-bold text-sm text-zinc-100">
                    Anotação Oficial do Mestre
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-sans">
                    Insira um marco histórico na Linha do Tempo da mesa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualChronicle} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Título da Crônica / Feito *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: A Queda do Dragão de Vulkar; Tratado com os Elfos..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ChronicleCategory)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="mestre">✍️ Anotação do Mestre</option>
                    <option value="nivel">🌟 Nível &amp; Evolução</option>
                    <option value="item">💎 Tesouro / Relíquia</option>
                    <option value="mapa">🗺️ Viagem &amp; Exploração</option>
                    <option value="forja">⚒️ Forja &amp; Criação</option>
                    <option value="geral">📜 Feito Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Importância
                  </label>
                  <select
                    value={formImportance}
                    onChange={(e) => setFormImportance(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="normal">Normal</option>
                    <option value="notavel">Notável</option>
                    <option value="epico">Épico</option>
                    <option value="lendario">Lendário (Dourado)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Ícone Emoji
                  </label>
                  <select
                    value={formIconEmoji}
                    onChange={(e) => setFormIconEmoji(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="📜">📜 Pergaminho</option>
                    <option value="⚔️">⚔️ Espadas</option>
                    <option value="👑">👑 Coroa</option>
                    <option value="🐉">🐉 Dragão / Besta</option>
                    <option value="💀">💀 Caveira / Morte</option>
                    <option value="🏰">🏰 Castelo / Cidade</option>
                    <option value="💎">💎 Joia / Artefato</option>
                    <option value="🌟">🌟 Estrela / Nível</option>
                    <option value="⚗️">⚗️ Alquimia</option>
                    <option value="⚒️">⚒️ Forja</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Personagem Relacionado
                  </label>
                  <select
                    value={formCharacterName}
                    onChange={(e) => setFormCharacterName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="Todo o Grupo">Todo o Grupo (Companhia)</option>
                    {campaign.players.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.characterClass})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Localidade de Eldria (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Caeldrin, Ruínas de Vulkar, Floresta de Verdância..."
                  value={formLocationName}
                  onChange={(e) => setFormLocationName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Descrição dos Acontecimentos *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva o que ocorreu, os desafios superados e as consequências para a história da mesa..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-sans resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-cinzel font-semibold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 text-xs font-cinzel font-bold rounded-xl shadow-lg transition"
                >
                  Registrar na Linha do Tempo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
