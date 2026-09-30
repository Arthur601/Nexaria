import React, { useState, useMemo } from 'react';
import { CampaignRoom, CampaignDiaryEntry, DiaryCategory } from '../types/rpg';
import { sound } from '../utils/audio';
import {
  ScrollText,
  Plus,
  Search,
  Filter,
  Pin,
  PinOff,
  Edit3,
  Trash2,
  Calendar,
  MapPin,
  Sparkles,
  BookOpen,
  Crown,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  Flame,
  Shield,
  Eye,
  Handshake,
  CheckCircle2,
} from 'lucide-react';
import { CampaignChroniclesView } from './CampaignChroniclesView';

interface CampaignDiaryViewProps {
  campaign: CampaignRoom;
  isGm: boolean;
  onUpdateCampaign: (updated: CampaignRoom) => void;
}

const CATEGORY_CONFIG: Record<
  DiaryCategory,
  {
    label: string;
    singular: string;
    icon: string;
    badgeBg: string;
    badgeText: string;
    border: string;
    glow: string;
    accent: string;
    placeholderTitle: string;
    placeholderContent: string;
  }
> = {
  sessao: {
    label: 'Sessões',
    singular: 'Sessão de Jogo',
    icon: '📖',
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-300',
    border: 'border-amber-500/80',
    glow: 'shadow-amber-950/50',
    accent: 'bg-gradient-to-r from-amber-400 to-yellow-400',
    placeholderTitle: 'Ex: Sessão 3 — A Queda da Ponte de Caeldrin',
    placeholderContent: 'Descreva os principais acontecimentos da sessão, decisões do grupo, inimigos derrotados e rumos tomados...',
  },
  evento: {
    label: 'Eventos',
    singular: 'Evento Decisivo',
    icon: '⚡',
    badgeBg: 'bg-rose-950/80',
    badgeText: 'text-rose-300',
    border: 'border-rose-500/80',
    glow: 'shadow-rose-950/50',
    accent: 'bg-gradient-to-r from-rose-500 to-red-500',
    placeholderTitle: 'Ex: O Rompimento do Selo Abissal de Vulkar',
    placeholderContent: 'Relate o acontecimento marcante, suas consequências mundiais, perdas de territórios ou mortes notáveis...',
  },
  lore: {
    label: 'Lore & Lendas',
    singular: 'Lore / Lenda Antiga',
    icon: '📜',
    badgeBg: 'bg-purple-950/80',
    badgeText: 'text-purple-300',
    border: 'border-purple-500/80',
    glow: 'shadow-purple-950/50',
    accent: 'bg-gradient-to-r from-purple-500 to-indigo-500',
    placeholderTitle: 'Ex: A Lenda dos Sete Cristais Primordiais de Nexaria',
    placeholderContent: 'Trecho histórico, canções de bardos, profecias encontradas em ruínas ou conhecimentos arcanos...',
  },
  revelacao: {
    label: 'Revelações',
    singular: 'Segredo / Revelação',
    icon: '🔮',
    badgeBg: 'bg-cyan-950/80',
    badgeText: 'text-cyan-300',
    border: 'border-cyan-500/80',
    glow: 'shadow-cyan-950/50',
    accent: 'bg-gradient-to-r from-cyan-400 to-blue-500',
    placeholderTitle: 'Ex: A Verdadeira Identidade do Conselheiro Maldito',
    placeholderContent: 'Verdades desvendadas pelos aventureiros, pistas conectadas e conspirações expostas...',
  },
  pacto: {
    label: 'Pactos & Acordos',
    singular: 'Pacto / Aliança',
    icon: '🤝',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-300',
    border: 'border-emerald-500/80',
    glow: 'shadow-emerald-950/50',
    accent: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    placeholderTitle: 'Ex: Tratado de Paz entre a Guilda e os Elfos de Verdância',
    placeholderContent: 'Termos do pacto, juramentos selados, testemunhas presentes e condições de cumprimento...',
  },
};

export const CampaignDiaryView: React.FC<CampaignDiaryViewProps> = ({
  campaign,
  isGm,
  onUpdateCampaign,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'chronicles' | 'diary' | 'master_notes'>('chronicles');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CampaignDiaryEntry | null>(null);
  const [isQuickNotesOpen, setIsQuickNotesOpen] = useState(false);

  // Form states
  const [formCategory, setFormCategory] = useState<DiaryCategory>('sessao');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formSessionNumber, setFormSessionNumber] = useState<number | ''>('');
  const [formInGameDate, setFormInGameDate] = useState('');
  const [formLocationTag, setFormLocationTag] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);

  const diaryList: CampaignDiaryEntry[] = useMemo(() => {
    return campaign.diaryEntries || [];
  }, [campaign.diaryEntries]);

  // Counts per category
  const counts = useMemo(() => {
    const res: Record<string, number> = {
      all: diaryList.length,
      pinned: 0,
      sessao: 0,
      evento: 0,
      lore: 0,
      revelacao: 0,
      pacto: 0,
    };
    diaryList.forEach((entry) => {
      if (entry.isPinned) res.pinned++;
      if (res[entry.category] !== undefined) res[entry.category]++;
    });
    return res;
  }, [diaryList]);

  // Normalize text for flexible search
  const normalize = (text: string) =>
    (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  // Filtered & sorted entries (pinned first, then chronological)
  const filteredEntries = useMemo(() => {
    const q = normalize(searchQuery);
    const filtered = diaryList.filter((entry) => {
      if (activeFilter === 'pinned' && !entry.isPinned) return false;
      if (activeFilter !== 'all' && activeFilter !== 'pinned' && entry.category !== activeFilter) {
        return false;
      }
      if (!q) return true;

      const titleNorm = normalize(entry.title);
      const contentNorm = normalize(entry.content);
      const locNorm = normalize(entry.locationTag || '');
      const dateNorm = normalize(entry.inGameDate || '');
      const catLabel = normalize(CATEGORY_CONFIG[entry.category]?.label || '');

      return (
        titleNorm.includes(q) ||
        contentNorm.includes(q) ||
        locNorm.includes(q) ||
        dateNorm.includes(q) ||
        catLabel.includes(q) ||
        (entry.sessionNumber !== undefined && String(entry.sessionNumber).includes(q))
      );
    });

    // Pinned always on top, then descending timestamp
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestamp - a.timestamp;
    });
  }, [diaryList, activeFilter, searchQuery]);

  const handleOpenCreateModal = (cat: DiaryCategory = 'sessao') => {
    sound.playCoinClink('PRT');
    setEditingEntry(null);
    setFormCategory(cat);
    setFormTitle('');
    setFormContent('');
    setFormSessionNumber(counts.sessao + 1);
    setFormInGameDate('');
    setFormLocationTag('');
    setFormIsPinned(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry: CampaignDiaryEntry) => {
    sound.playCoinClink('PRT');
    setEditingEntry(entry);
    setFormCategory(entry.category);
    setFormTitle(entry.title);
    setFormContent(entry.content);
    setFormSessionNumber(entry.sessionNumber ?? '');
    setFormInGameDate(entry.inGameDate || '');
    setFormLocationTag(entry.locationTag || '');
    setFormIsPinned(entry.isPinned || false);
    setIsModalOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    sound.playSuccessFanfare();

    let updatedList: CampaignDiaryEntry[];
    if (editingEntry) {
      updatedList = diaryList.map((entry) =>
        entry.id === editingEntry.id
          ? {
              ...entry,
              category: formCategory,
              title: formTitle.trim(),
              content: formContent.trim(),
              sessionNumber:
                typeof formSessionNumber === 'number' && formSessionNumber > 0
                  ? formSessionNumber
                  : undefined,
              inGameDate: formInGameDate.trim() || undefined,
              locationTag: formLocationTag.trim() || undefined,
              isPinned: formIsPinned,
              authorName: campaign.gmName,
            }
          : entry
      );
    } else {
      const newEntry: CampaignDiaryEntry = {
        id: `diary-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        category: formCategory,
        title: formTitle.trim(),
        content: formContent.trim(),
        sessionNumber:
          typeof formSessionNumber === 'number' && formSessionNumber > 0
            ? formSessionNumber
            : undefined,
        inGameDate: formInGameDate.trim() || undefined,
        locationTag: formLocationTag.trim() || undefined,
        isPinned: formIsPinned,
        authorName: campaign.gmName,
        timestamp: Date.now(),
      };
      updatedList = [newEntry, ...diaryList];
    }

    onUpdateCampaign({
      ...campaign,
      diaryEntries: updatedList,
    });

    setIsModalOpen(false);
  };

  const handleDeleteEntry = (id: string) => {
    sound.playCoinClink('BRZ');
    const updatedList = diaryList.filter((e) => e.id !== id);
    onUpdateCampaign({
      ...campaign,
      diaryEntries: updatedList,
    });
  };

  const handleTogglePin = (id: string) => {
    sound.playCoinClink('PRT');
    const updatedList = diaryList.map((entry) => {
      if (entry.id === id) {
        return { ...entry, isPinned: !entry.isPinned };
      }
      return entry;
    });
    onUpdateCampaign({
      ...campaign,
      diaryEntries: updatedList,
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Switcher: Crônicas de Campanha vs Diário de Sessões */}
      <div className="flex items-center gap-2 border-b border-purple-900/50 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            sound.playCoinClink('PRT');
            setActiveMainTab('chronicles');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-cinzel font-bold flex items-center gap-2 transition ${
            activeMainTab === 'chronicles'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-lg shadow-amber-950/40'
              : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-purple-950'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Crônicas de Campanha (Linha do Tempo)</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-bold">
            {campaign.chronicles?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playCoinClink('PRT');
            setActiveMainTab('diary');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-cinzel font-bold flex items-center gap-2 transition ${
            activeMainTab === 'diary'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/40'
              : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-purple-950'
          }`}
        >
          <ScrollText className="w-4 h-4 text-purple-300" />
          <span>Diário de Sessões &amp; Lore</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-bold">
            {diaryList.length}
          </span>
        </button>
      </div>

      {activeMainTab === 'chronicles' ? (
        <CampaignChroniclesView
          campaign={campaign}
          isGm={isGm}
          onUpdateCampaign={onUpdateCampaign}
        />
      ) : (
        <>
          {/* Top Banner: Diário de Campanha & Crônicas de Nexaria */}
          <div className="rounded-2xl border border-purple-900/60 bg-gradient-to-r from-purple-950/70 via-[#110a24] to-amber-950/40 p-4 sm:p-5 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-purple-900/50">
              <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/90 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-lg shadow-purple-950/50">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-cinzel font-black text-amber-300">
                  Diário de Campanha &amp; Crônicas
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-950/90 border border-purple-700/60 text-purple-200 text-[10px] font-mono font-bold">
                  {diaryList.length} registro{diaryList.length !== 1 ? 's' : ''}
                </span>
                {isGm && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-cinzel font-bold flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>Modo Mestre</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Crônica oficial da mesa: sessões realizadas, reviravoltas da história, eventos decisivos e lore do Abismo.
              </p>
            </div>
          </div>

          {/* GM Action: Add New Entry */}
          {isGm && (
            <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleOpenCreateModal('sessao')}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-cinzel font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/50 transition"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Registrar Sessão</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenCreateModal('evento')}
                className="px-2.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-600/70 text-rose-200 font-cinzel font-semibold text-xs flex items-center gap-1 transition shadow-sm"
                title="Registrar Evento Decisivo"
              >
                <span>⚡</span>
                <span className="hidden md:inline">+ Evento</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenCreateModal('lore')}
                className="px-2.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/70 text-purple-200 font-cinzel font-semibold text-xs flex items-center gap-1 transition shadow-sm"
                title="Anotar Lore ou Lenda"
              >
                <span>📜</span>
                <span className="hidden md:inline">+ Lore</span>
              </button>
            </div>
          )}
        </div>

        {/* Search Bar & Category Filters */}
        <div className="mt-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-amber-400/80 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por título, conteúdo, sessão, localidade (ex: Caeldrin, Sessão 2, Selo, Dragão)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950/90 border border-purple-900/70 focus:border-amber-400 rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5 rounded"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] text-zinc-400 font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800/50 text-purple-300 whitespace-nowrap">
                Exibindo <strong>{filteredEntries.length}</strong> de <strong>{diaryList.length}</strong> notas
              </span>
              {(searchQuery || activeFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  className="text-amber-400 hover:text-amber-300 text-[11px] underline font-sans whitespace-nowrap"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
            <button
              type="button"
              onClick={() => {
                sound.playCoinClink('BRZ');
                setActiveFilter('all');
              }}
              className={`px-3 py-1.5 rounded-lg font-cinzel font-semibold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                activeFilter === 'all'
                  ? 'bg-zinc-100 text-zinc-950 font-bold shadow'
                  : 'bg-zinc-950/80 border border-purple-950 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>🌟 Todos</span>
              <span className="text-[10px] font-mono opacity-80">({counts.all})</span>
            </button>

            {counts.pinned > 0 && (
              <button
                type="button"
                onClick={() => {
                  sound.playCoinClink('BRZ');
                  setActiveFilter('pinned');
                }}
                className={`px-3 py-1.5 rounded-lg font-cinzel font-semibold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${
                  activeFilter === 'pinned'
                    ? 'bg-amber-950 text-amber-200 border-amber-400 font-bold shadow-md ring-1 ring-amber-400'
                    : 'bg-zinc-950/80 border-purple-950 text-zinc-400 hover:text-amber-300'
                }`}
              >
                <Pin className="w-3.5 h-3.5 text-amber-400" />
                <span>Fixados</span>
                <span className="text-[10px] font-mono opacity-80">({counts.pinned})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                sound.playCoinClink('BRZ');
                setActiveFilter('sessao');
              }}
              className={`px-3 py-1.5 rounded-lg font-cinzel font-semibold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${
                activeFilter === 'sessao'
                  ? 'bg-amber-950 text-amber-200 border-amber-400 font-bold shadow-md ring-1 ring-amber-400'
                  : 'bg-zinc-950/80 border-purple-950 text-zinc-400 hover:text-amber-300'
              }`}
            >
              <span>📖 Sessões</span>
              <span className="text-[10px] font-mono opacity-80">({counts.sessao})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playCoinClink('BRZ');
                setActiveFilter('evento');
              }}
              className={`px-3 py-1.5 rounded-lg font-cinzel font-semibold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${
                activeFilter === 'evento'
                  ? 'bg-rose-950 text-rose-200 border-rose-500 font-bold shadow-md ring-1 ring-rose-400'
                  : 'bg-zinc-950/80 border-purple-950 text-zinc-400 hover:text-rose-300'
              }`}
            >
              <span>⚡ Eventos</span>
              <span className="text-[10px] font-mono opacity-80">({counts.evento})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playCoinClink('BRZ');
                setActiveFilter('lore');
              }}
              className={`px-3 py-1.5 rounded-lg font-cinzel font-semibold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${
                activeFilter === 'lore'
                  ? 'bg-purple-950 text-purple-200 border-purple-500 font-bold shadow-md ring-1 ring-purple-400'
                  : 'bg-zinc-950/80 border-purple-950 text-zinc-400 hover:text-purple-300'
              }`}
            >
              <span>📜 Lore</span>
              <span className="text-[10px] font-mono opacity-80">({counts.lore})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playCoinClink('BRZ');
                setActiveFilter('revelacao');
              }}
              className={`px-3 py-1.5 rounded-lg font-cinzel font-semibold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${
                activeFilter === 'revelacao'
                  ? 'bg-cyan-950 text-cyan-200 border-cyan-500 font-bold shadow-md ring-1 ring-cyan-400'
                  : 'bg-zinc-950/80 border-purple-950 text-zinc-400 hover:text-cyan-300'
              }`}
            >
              <span>🔮 Revelações</span>
              <span className="text-[10px] font-mono opacity-80">({counts.revelacao})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playCoinClink('BRZ');
                setActiveFilter('pacto');
              }}
              className={`px-3 py-1.5 rounded-lg font-cinzel font-semibold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${
                activeFilter === 'pacto'
                  ? 'bg-emerald-950 text-emerald-200 border-emerald-500 font-bold shadow-md ring-1 ring-emerald-400'
                  : 'bg-zinc-950/80 border-purple-950 text-zinc-400 hover:text-emerald-300'
              }`}
            >
              <span>🤝 Pactos</span>
              <span className="text-[10px] font-mono opacity-80">({counts.pacto})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Diary Entries */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-14 rounded-2xl border border-dashed border-purple-900/60 bg-[#0e091a]/60 p-6">
          <ScrollText className="w-12 h-12 text-purple-400/40 mx-auto mb-3" />
          <h4 className="text-sm font-cinzel font-bold text-zinc-200 mb-1">
            {searchQuery || activeFilter !== 'all'
              ? 'Nenhuma Crônica Encontrada'
              : 'O Diário de Campanha está Aguardando os Primeiros Registros'}
          </h4>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-5 leading-relaxed">
            {searchQuery || activeFilter !== 'all'
              ? 'Nenhum registro corresponde aos filtros aplicados. Tente limpar os filtros ou buscar por outro termo.'
              : 'O Mestre pode registrar cada sessão realizada, o avanço da trama, guerras entre reinos de Eldria, alianças juradas e a descoberta de artefatos esquecidos.'}
          </p>

          {isGm && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleOpenCreateModal('sessao')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-cinzel font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/50 transition"
              >
                <span>📖</span>
                <span>Registrar Primeira Sessão</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenCreateModal('evento')}
                className="px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-600/70 text-rose-200 font-cinzel font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <span>⚡</span>
                <span>Registrar Evento</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry) => {
            const cfg = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.sessao;

            return (
              <div
                key={entry.id}
                className={`rounded-2xl border-2 ${cfg.border} ${cfg.glow} bg-gradient-to-b from-[#140d24] via-[#0d0718] to-[#08050e] p-4 sm:p-5 flex flex-col justify-between shadow-xl transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden ${
                  entry.isPinned ? 'ring-2 ring-amber-400/50' : ''
                }`}
              >
                {/* Accent Top Bar */}
                <div className={`h-1.5 w-[calc(100%+2.5rem)] -mt-4 sm:-mt-5 -mx-4 sm:-mx-5 mb-3.5 ${cfg.accent}`} />

                <div>
                  {/* Card Header: Category badge, session, pin, GM controls */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold flex items-center gap-1 ${cfg.badgeBg} ${cfg.badgeText} ${cfg.border}`}
                      >
                        <span>{cfg.icon}</span>
                        <span>{cfg.singular}</span>
                      </span>

                      {entry.sessionNumber !== undefined && (
                        <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded-md border border-amber-500/50">
                          Sessão #{entry.sessionNumber}
                        </span>
                      )}

                      {entry.locationTag && (
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded-md border border-purple-950/80 flex items-center gap-1 truncate max-w-[140px]">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{entry.locationTag}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Pin button */}
                      {isGm && (
                        <button
                          type="button"
                          onClick={() => handleTogglePin(entry.id)}
                          className={`p-1 rounded-lg transition ${
                            entry.isPinned
                              ? 'text-amber-400 hover:text-amber-200 bg-amber-950/60'
                              : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                          }`}
                          title={entry.isPinned ? 'Desafixar nota' : 'Fixar no topo'}
                        >
                          {entry.isPinned ? (
                            <Pin className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ) : (
                            <Pin className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      {isGm && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(entry)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                            title="Editar Crônica"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition"
                            title="Excluir Registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-cinzel font-bold text-zinc-100 leading-snug mb-2">
                    {entry.title}
                  </h3>

                  {/* In-Game Date if present */}
                  {entry.inGameDate && (
                    <div className="flex items-center gap-1 text-[11px] font-cinzel text-amber-300/90 mb-2">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{entry.inGameDate}</span>
                    </div>
                  )}

                  {/* Body Content */}
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap line-clamp-8 mb-4">
                    {entry.content}
                  </p>
                </div>

                {/* Footer: Date & Author */}
                <div className="pt-2.5 border-t border-purple-950/70 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-600" />
                    <span>
                      {new Date(entry.timestamp).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </span>

                  <span className="text-zinc-400 truncate max-w-[150px]">
                    Narrador: <strong className="text-zinc-300">{entry.authorName || campaign.gmName}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Seção Expansível: Rascunho Rápido do Mestre (Bloco de Notas Contínuo) */}
      {isGm && (
        <div className="rounded-2xl border border-purple-900/50 bg-[#0c0817]/90 p-4 shadow-xl">
          <button
            type="button"
            onClick={() => setIsQuickNotesOpen(!isQuickNotesOpen)}
            className="w-full flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-purple-400" />
              <div>
                <h4 className="text-xs font-cinzel font-bold text-zinc-200 group-hover:text-amber-300 transition flex items-center gap-2">
                  <span>Rascunho Rápido do Mestre</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-950 border border-purple-800 text-purple-300 font-mono">
                    Salvo no estado da campanha
                  </span>
                </h4>
                <p className="text-[10px] text-zinc-400">
                  Anotações soltas da sessão ao vivo: iniciativas, pistas rápidas, termos secretos e lembretes.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <span>{isQuickNotesOpen ? 'Recolher' : 'Expandir'}</span>
              {isQuickNotesOpen ? (
                <ChevronUp className="w-4 h-4 text-zinc-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              )}
            </div>
          </button>

          {isQuickNotesOpen && (
            <div className="mt-3 pt-3 border-t border-purple-950/60">
              <textarea
                rows={6}
                value={campaign.masterDiaryNotes || ''}
                onChange={(e) =>
                  onUpdateCampaign({
                    ...campaign,
                    masterDiaryNotes: e.target.value,
                  })
                }
                placeholder="Escreva livremente qualquer detalhe provisório da sessão atual..."
                className="w-full bg-zinc-950 border border-purple-900/80 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 leading-relaxed font-sans shadow-inner"
              />
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono mt-1">
                <span>Salvo automaticamente no estado da mesa</span>
                <span>{(campaign.masterDiaryNotes || '').length} caracteres</span>
              </div>
            </div>
          )}
        </div>
      )}
      </>
      )}

      {/* Modal: Criar / Editar Crônica no Diário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border-2 border-purple-900/90 bg-gradient-to-b from-[#180f2c] via-[#100a1f] to-[#0a0714] p-5 sm:p-6 text-zinc-100 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between pb-3 border-b border-purple-900/60 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-950/90 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <ScrollText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-cinzel font-bold text-amber-300">
                    {editingEntry ? 'Editar Registro no Diário' : 'Novo Registro no Diário da Campanha'}
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-sans">
                    Documente acontecimentos, lore e decisões da aventura
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-3.5">
              {/* Category Selector */}
              <div>
                <label className="text-xs font-cinzel font-bold text-zinc-300 block mb-1.5">
                  Categoria da Nota:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {(['sessao', 'evento', 'lore', 'revelacao', 'pacto'] as DiaryCategory[]).map(
                    (cat) => {
                      const cfg = CATEGORY_CONFIG[cat];
                      const isSelected = formCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            sound.playCoinClink('BRZ');
                            setFormCategory(cat);
                          }}
                          className={`p-2 rounded-xl border text-xs font-cinzel font-semibold flex flex-col items-center gap-1 transition ${
                            isSelected
                              ? `${cfg.badgeBg} ${cfg.badgeText} ${cfg.border} border-2 shadow-md ring-1 ring-white/20`
                              : 'bg-zinc-950/80 border-purple-950 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <span className="text-base">{cfg.icon}</span>
                          <span className="text-[10px] text-center leading-tight truncate w-full">{cfg.label}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="text-xs font-cinzel font-bold text-zinc-300 block mb-1">
                  Título da Crônica / Evento *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={CATEGORY_CONFIG[formCategory].placeholderTitle}
                  className="w-full bg-zinc-950 border border-purple-900/80 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition shadow-inner"
                />
              </div>

              {/* Metadata row: Session number, in-game date, location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-cinzel text-zinc-400 block mb-1">
                    Número da Sessão:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formSessionNumber}
                    onChange={(e) =>
                      setFormSessionNumber(e.target.value ? parseInt(e.target.value) : '')
                    }
                    placeholder="Ex: 1, 2, 3..."
                    className="w-full bg-zinc-950 border border-purple-900/80 focus:border-amber-400 rounded-xl px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-cinzel text-zinc-400 block mb-1">
                    Data no Mundo (Era/Mês):
                  </label>
                  <input
                    type="text"
                    value={formInGameDate}
                    onChange={(e) => setFormInGameDate(e.target.value)}
                    placeholder="Ex: Ano 412 do Éter"
                    className="w-full bg-zinc-950 border border-purple-900/80 focus:border-amber-400 rounded-xl px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-cinzel text-zinc-400 block mb-1">
                    Localidade / Região:
                  </label>
                  <input
                    type="text"
                    value={formLocationTag}
                    onChange={(e) => setFormLocationTag(e.target.value)}
                    placeholder="Ex: Caeldrin, Vulkar..."
                    className="w-full bg-zinc-950 border border-purple-900/80 focus:border-amber-400 rounded-xl px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Pinned toggle */}
              <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 flex items-center justify-between">
                <label
                  htmlFor="pin-entry-checkbox"
                  className="text-xs font-cinzel font-semibold text-zinc-200 flex items-center gap-2 cursor-pointer"
                >
                  <Pin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fixar esta crônica no topo do diário</span>
                </label>
                <input
                  id="pin-entry-checkbox"
                  type="checkbox"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-400 text-amber-500 focus:ring-amber-400 bg-zinc-950 cursor-pointer"
                />
              </div>

              {/* Content Textarea */}
              <div>
                <label className="text-xs font-cinzel font-bold text-zinc-300 block mb-1">
                  Relato Textual da Aventura *
                </label>
                <textarea
                  rows={6}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={CATEGORY_CONFIG[formCategory].placeholderContent}
                  className="w-full bg-zinc-950 border border-purple-900/80 focus:border-amber-400 rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition shadow-inner font-sans leading-relaxed"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-900/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-cinzel font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 text-xs font-cinzel font-bold transition shadow-md shadow-amber-950/50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{editingEntry ? 'Salvar Alterações' : 'Gravar no Diário'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
