import React, { useState, useMemo } from 'react';
import { CharacterSheet, AdventureNote, AdventureNoteCategory } from '../types/rpg';
import { sound } from '../utils/audio';
import {
  MapPin,
  User,
  Target,
  Scroll,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Sparkles,
  Compass,
  X,
  FileText,
  Flag,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AdventureNotesViewProps {
  character: CharacterSheet;
  onUpdateCharacter: (updated: CharacterSheet) => void;
  isGmView?: boolean;
}

const CATEGORY_CONFIG: Record<
  AdventureNoteCategory,
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
  local: {
    label: 'Locais',
    singular: 'Local',
    icon: '🗺️',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-300',
    border: 'border-emerald-500/80',
    glow: 'shadow-emerald-950/50',
    accent: 'bg-emerald-500',
    placeholderTitle: 'Ex: Cidadela de Caeldrin, Taverna do Javali Furioso...',
    placeholderContent: 'Descreva a atmosfera, saídas, perigos, recursos disponíveis e segredos do local...',
  },
  npc: {
    label: 'NPCs',
    singular: 'NPC',
    icon: '👤',
    badgeBg: 'bg-sky-950/80',
    badgeText: 'text-sky-300',
    border: 'border-sky-500/80',
    glow: 'shadow-sky-950/50',
    accent: 'bg-sky-500',
    placeholderTitle: 'Ex: Grommash o Ferreiro, Alistair o Mago Arcano...',
    placeholderContent: 'Anotações sobre a personalidade do NPC, acordos feitos, itens à venda, lealdade e histórico...',
  },
  objetivo: {
    label: 'Objetivos',
    singular: 'Objetivo / Missão',
    icon: '🎯',
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-300',
    border: 'border-amber-400/90',
    glow: 'shadow-amber-950/60 ring-1 ring-amber-400/30',
    accent: 'bg-gradient-to-r from-amber-400 to-yellow-400',
    placeholderTitle: 'Ex: Encontrar a Chave de Éter nas Profundezas...',
    placeholderContent: 'Passos da missão, recompensa combinada, pistas encontradas e prazos do Mestre...',
  },
  geral: {
    label: 'Gerais',
    singular: 'Nota Geral',
    icon: '📜',
    badgeBg: 'bg-purple-950/80',
    badgeText: 'text-purple-300',
    border: 'border-purple-500/80',
    glow: 'shadow-purple-950/50',
    accent: 'bg-purple-500',
    placeholderTitle: 'Ex: Profecia do Abismo, Código dos Guardiões...',
    placeholderContent: 'Rumores de taverna, lendas antigas, senhas mágicas e avisos importantes do Narrador...',
  },
};

export const AdventureNotesView: React.FC<AdventureNotesViewProps> = ({
  character,
  onUpdateCharacter,
  isGmView = false,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<AdventureNote | null>(null);
  const [isQuickJournalOpen, setIsQuickJournalOpen] = useState(false);

  // Form state
  const [formCategory, setFormCategory] = useState<AdventureNoteCategory>('local');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formLocationTag, setFormLocationTag] = useState('');
  const [formCompleted, setFormCompleted] = useState(false);

  // Retrieve notes array safely
  const notesList = useMemo(() => character.adventureNotes || [], [character.adventureNotes]);

  // Counts
  const counts = useMemo(() => {
    const res: Record<string, number> = {
      all: notesList.length,
      local: 0,
      npc: 0,
      objetivo: 0,
      geral: 0,
      completedObjetivos: 0,
    };
    notesList.forEach((n) => {
      if (res[n.category] !== undefined) res[n.category]++;
      if (n.category === 'objetivo' && n.completed) res.completedObjetivos++;
    });
    return res;
  }, [notesList]);

  // Normalize text for search
  const normalize = (text: string) =>
    (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  // Filtered notes
  const filteredNotes = useMemo(() => {
    const q = normalize(searchQuery);
    return notesList.filter((note) => {
      const matchesCategory =
        activeFilter === 'all' ||
        (activeFilter === 'completed'
          ? note.category === 'objetivo' && note.completed
          : note.category === activeFilter);

      if (!matchesCategory) return false;
      if (!q) return true;

      const titleNorm = normalize(note.title);
      const contentNorm = normalize(note.content);
      const locationNorm = normalize(note.locationTag || '');
      const catLabelNorm = normalize(CATEGORY_CONFIG[note.category]?.label || '');

      return (
        titleNorm.includes(q) ||
        contentNorm.includes(q) ||
        locationNorm.includes(q) ||
        catLabelNorm.includes(q)
      );
    });
  }, [notesList, activeFilter, searchQuery]);

  // Open modal to create note with preset category
  const handleOpenCreateModal = (cat: AdventureNoteCategory = 'local') => {
    sound.playCoinClink('BRZ');
    setEditingNote(null);
    setFormCategory(cat);
    setFormTitle('');
    setFormContent('');
    setFormLocationTag(character.currentLocation || '');
    setFormCompleted(false);
    setIsModalOpen(true);
  };

  // Open modal to edit existing note
  const handleOpenEditModal = (note: AdventureNote) => {
    sound.playCoinClink('PRT');
    setEditingNote(note);
    setFormCategory(note.category);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormLocationTag(note.locationTag || '');
    setFormCompleted(note.completed || false);
    setIsModalOpen(true);
  };

  // Save note (create or update)
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    sound.playSuccessFanfare();

    let updatedNotes: AdventureNote[];
    if (editingNote) {
      updatedNotes = notesList.map((n) =>
        n.id === editingNote.id
          ? {
              ...n,
              category: formCategory,
              title: formTitle.trim(),
              content: formContent.trim(),
              locationTag: formLocationTag.trim() || undefined,
              completed: formCategory === 'objetivo' ? formCompleted : undefined,
            }
          : n
      );
    } else {
      const newNote: AdventureNote = {
        id: `adv-note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        category: formCategory,
        title: formTitle.trim(),
        content: formContent.trim(),
        locationTag: formLocationTag.trim() || undefined,
        completed: formCategory === 'objetivo' ? formCompleted : undefined,
        timestamp: Date.now(),
      };
      updatedNotes = [newNote, ...notesList];
    }

    onUpdateCharacter({
      ...character,
      adventureNotes: updatedNotes,
    });

    setIsModalOpen(false);
  };

  // Delete note
  const handleDeleteNote = (noteId: string) => {
    sound.playCoinClink('BRZ');
    const updatedNotes = notesList.filter((n) => n.id !== noteId);
    onUpdateCharacter({
      ...character,
      adventureNotes: updatedNotes,
    });
  };

  // Toggle objective completion
  const handleToggleObjective = (noteId: string) => {
    const updatedNotes = notesList.map((n) => {
      if (n.id === noteId && n.category === 'objetivo') {
        const nextCompleted = !n.completed;
        if (nextCompleted) {
          sound.playSuccessFanfare();
        } else {
          sound.playCoinClink('BRZ');
        }
        return { ...n, completed: nextCompleted };
      }
      return n;
    });

    onUpdateCharacter({
      ...character,
      adventureNotes: updatedNotes,
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Notas de Aventura & Quick Actions */}
      <div className="rounded-2xl border border-purple-900/60 bg-gradient-to-r from-purple-950/60 via-[#100b22] to-amber-950/40 p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-purple-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-950/90 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-cinzel font-bold text-amber-300">
                  Notas de Aventura de {character.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-200 text-[10px] font-mono">
                  {notesList.length} registro{notesList.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                Registre locais descobertos, NPCs encontrados, objetivos e missões de campanha.
              </p>
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleOpenCreateModal('local')}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-200 font-cinzel text-xs font-semibold flex items-center gap-1 transition shadow-sm"
              title="Anotar novo local de campanha"
            >
              <span>🗺️</span>
              <span>+ Local</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenCreateModal('npc')}
              className="px-2.5 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-600/70 text-sky-200 font-cinzel text-xs font-semibold flex items-center gap-1 transition shadow-sm"
              title="Anotar novo NPC ou contato"
            >
              <span>👤</span>
              <span>+ NPC</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenCreateModal('objetivo')}
              className="px-2.5 py-1.5 rounded-xl bg-amber-950/90 hover:bg-amber-900 border border-amber-500/70 text-amber-200 font-cinzel text-xs font-bold flex items-center gap-1 transition shadow-sm"
              title="Registrar novo objetivo ou missão"
            >
              <span>🎯</span>
              <span>+ Objetivo</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenCreateModal('geral')}
              className="px-2.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/70 text-purple-200 font-cinzel text-xs font-semibold flex items-center gap-1 transition shadow-sm"
              title="Anotação livre ou rumor geral"
            >
              <span>📜</span>
              <span>+ Geral</span>
            </button>
          </div>
        </div>

        {/* Barra de Busca e Filtros de Categoria */}
        <div className="mt-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-amber-400/80 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por título, conteúdo, localidade (ex: Caeldrin, Taverna, Missão, Ferreiro)..."
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
                Exibindo <strong>{filteredNotes.length}</strong> de <strong>{notesList.length}</strong> notas
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

          {/* Filtros de Categoria */}
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
              <span>Todos</span>
              <span className="text-[10px] font-mono opacity-80">({counts.all})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playCoinClink('BRZ');
                setActiveFilter('local');
              }}
              className={`px-3 py-1.5 rounded-lg font-cinzel font-semibold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${
                activeFilter === 'local'
                  ? 'bg-emerald-950 text-emerald-200 border-emerald-500 font-bold shadow-md shadow-emerald-950/50 ring-1 ring-emerald-400'
                  : 'bg-zinc-950/80 border-purple-950 text-zinc-400 hover:text-emerald-300 hover:border-emerald-800'
              }`}
            >
              <span>🗺️ Locais</span>
              <span className="text-[10px] font-mono opacity-80">({counts.local})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playCoinClink('BRZ');
                setActiveFilter('npc');
              }}
              className={`px-3 py-1.5 rounded-lg font-cinzel font-semibold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${
                activeFilter === 'npc'
                  ? 'bg-sky-950 text-sky-200 border-sky-500 font-bold shadow-md shadow-sky-950/50 ring-1 ring-sky-400'
                  : 'bg-zinc-950/80 border-purple-950 text-zinc-400 hover:text-sky-300 hover:border-sky-800'
              }`}
            >
              <span>👤 NPCs</span>
              <span className="text-[10px] font-mono opacity-80">({counts.npc})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playCoinClink('BRZ');
                setActiveFilter('objetivo');
              }}
              className={`px-3 py-1.5 rounded-lg font-cinzel font-semibold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${
                activeFilter === 'objetivo'
                  ? 'bg-amber-950 text-amber-200 border-amber-400 font-bold shadow-md shadow-amber-950/50 ring-1 ring-amber-400'
                  : 'bg-zinc-950/80 border-purple-950 text-zinc-400 hover:text-amber-300 hover:border-amber-800'
              }`}
            >
              <span>🎯 Objetivos</span>
              <span className="text-[10px] font-mono opacity-80">
                ({counts.objetivo}
                {counts.completedObjetivos > 0 ? ` • ${counts.completedObjetivos} concluídos` : ''})
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playCoinClink('BRZ');
                setActiveFilter('geral');
              }}
              className={`px-3 py-1.5 rounded-lg font-cinzel font-semibold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${
                activeFilter === 'geral'
                  ? 'bg-purple-950 text-purple-200 border-purple-500 font-bold shadow-md shadow-purple-950/50 ring-1 ring-purple-400'
                  : 'bg-zinc-950/80 border-purple-950 text-zinc-400 hover:text-purple-300 hover:border-purple-800'
              }`}
            >
              <span>📜 Gerais</span>
              <span className="text-[10px] font-mono opacity-80">({counts.geral})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grade de Notas de Aventura */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-purple-900/60 bg-[#0e091a]/60 p-6">
          <Scroll className="w-12 h-12 text-purple-400/40 mx-auto mb-3" />
          <h4 className="text-sm font-cinzel font-bold text-zinc-200 mb-1">
            {searchQuery || activeFilter !== 'all'
              ? 'Nenhuma Nota Encontrada'
              : 'O Diário de Aventura está Vazio'}
          </h4>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-5">
            {searchQuery || activeFilter !== 'all'
              ? 'Nenhuma anotação corresponde aos termos ou à categoria selecionada.'
              : 'Registre as descobertas da sua jornada por Eldria: vilas e masmorras exploradas, aliados e contatos feitos, e as missões que precisam ser concluídas.'}
          </p>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenCreateModal('local')}
              className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-200 text-xs font-cinzel font-semibold flex items-center gap-1.5 transition"
            >
              <span>🗺️</span>
              <span>Anotar Local</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenCreateModal('npc')}
              className="px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-600/70 text-sky-200 text-xs font-cinzel font-semibold flex items-center gap-1.5 transition"
            >
              <span>👤</span>
              <span>Anotar NPC</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenCreateModal('objetivo')}
              className="px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/70 text-amber-200 text-xs font-cinzel font-bold flex items-center gap-1.5 transition"
            >
              <span>🎯</span>
              <span>Criar Objetivo</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredNotes.map((note) => {
            const cfg = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.geral;
            const isObjective = note.category === 'objetivo';
            const isCompleted = isObjective && note.completed;

            return (
              <div
                key={note.id}
                className={`rounded-2xl border-2 ${cfg.border} ${cfg.glow} bg-gradient-to-b from-[#140d24] via-[#0d0718] to-[#08050e] p-4 flex flex-col justify-between shadow-lg transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden ${
                  isCompleted ? 'opacity-75' : ''
                }`}
              >
                {/* Barra superior de acento */}
                <div className={`h-1.5 w-[calc(100%+2rem)] -mt-4 -mx-4 mb-3.5 ${cfg.accent}`} />

                <div>
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold flex items-center gap-1 ${cfg.badgeBg} ${cfg.badgeText} ${cfg.border}`}
                      >
                        <span>{cfg.icon}</span>
                        <span>{cfg.singular}</span>
                      </span>

                      {note.locationTag && (
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded-md border border-purple-950/80 flex items-center gap-1 truncate max-w-[150px]">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{note.locationTag}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(note)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                        title="Editar Nota"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition"
                        title="Excluir Nota"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Título da Nota */}
                  <div className="flex items-start gap-2 mb-2">
                    {isObjective && (
                      <button
                        type="button"
                        onClick={() => handleToggleObjective(note.id)}
                        className="mt-0.5 text-amber-400 hover:text-amber-300 transition shrink-0"
                        title={isCompleted ? 'Marcar como pendente' : 'Marcar como concluído'}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-amber-400/80" />
                        )}
                      </button>
                    )}

                    <h4
                      className={`text-sm font-cinzel font-bold text-zinc-100 leading-snug ${
                        isCompleted ? 'line-through text-zinc-400' : ''
                      }`}
                    >
                      {note.title}
                    </h4>
                  </div>

                  {/* Conteúdo da Nota */}
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap line-clamp-6 mb-3">
                    {note.content}
                  </p>
                </div>

                {/* Rodapé: Data e Status */}
                <div className="pt-2.5 border-t border-purple-950/70 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-600" />
                    <span>
                      {new Date(note.timestamp).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </span>

                  {isObjective && (
                    <span
                      className={`font-bold ${
                        isCompleted ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isCompleted ? '✓ Concluído' : '⏳ Em Andamento'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Seção Expansível: Diário Rápido de Campanha (Texto Livre) */}
      <div className="rounded-2xl border border-purple-900/50 bg-[#0c0817]/90 p-4 shadow-xl">
        <button
          type="button"
          onClick={() => setIsQuickJournalOpen(!isQuickJournalOpen)}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-purple-400" />
            <div>
              <h4 className="text-xs font-cinzel font-bold text-zinc-200 group-hover:text-amber-300 transition">
                Diário Rápido & Anotações Livres
              </h4>
              <p className="text-[10px] text-zinc-400">
                Bloco de notas contínuo para rascunhos rápidos durante as sessões de jogo.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <span>{isQuickJournalOpen ? 'Recolher' : 'Expandir'}</span>
            {isQuickJournalOpen ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </div>
        </button>

        {isQuickJournalOpen && (
          <div className="mt-3 pt-3 border-t border-purple-950/60">
            <textarea
              rows={6}
              value={character.notes || ''}
              onChange={(e) => onUpdateCharacter({ ...character, notes: e.target.value })}
              placeholder="Escreva livremente qualquer anotação da sessão, nomes esquecidos, enigmas, frases do Narrador..."
              className="w-full bg-zinc-950 border border-purple-900/80 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 leading-relaxed font-sans shadow-inner"
            />
            <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono mt-1">
              <span>Salvo automaticamente na ficha</span>
              <span>{(character.notes || '').length} caracteres</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Criar / Editar Nota de Aventura */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border-2 border-purple-900/90 bg-gradient-to-b from-[#180f2c] via-[#100a1f] to-[#0a0714] p-5 sm:p-6 text-zinc-100 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between pb-3 border-b border-purple-900/60 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-950/90 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Scroll className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-cinzel font-bold text-amber-300">
                    {editingNote ? 'Editar Nota de Aventura' : 'Nova Nota de Aventura'}
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-sans">
                    Guarde informações de locais, NPCs e objetivos da campanha
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

            <form onSubmit={handleSaveNote} className="space-y-4">
              {/* Seleção de Categoria */}
              <div>
                <label className="text-xs font-cinzel font-bold text-zinc-300 block mb-1.5">
                  Categoria da Nota:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['local', 'npc', 'objetivo', 'geral'] as AdventureNoteCategory[]).map((cat) => {
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
                        <span className="text-lg">{cfg.icon}</span>
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Título da Nota */}
              <div>
                <label className="text-xs font-cinzel font-bold text-zinc-300 block mb-1">
                  Título / Nome:
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

              {/* Localização ou Tag Geográfica (Opcional) */}
              <div>
                <label className="text-xs font-cinzel font-semibold text-zinc-300 flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>Localidade / Ponto de Referência (opcional):</span>
                </label>
                <input
                  type="text"
                  value={formLocationTag}
                  onChange={(e) => setFormLocationTag(e.target.value)}
                  placeholder="Ex: Caeldrin, Floresta de Verdância, Fenda do Abismo..."
                  className="w-full bg-zinc-950 border border-purple-900/80 focus:border-amber-400 rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition shadow-inner"
                />
              </div>

              {/* Checkbox de Objetivo Concluído */}
              {formCategory === 'objetivo' && (
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between">
                  <label htmlFor="form-completed-checkbox" className="text-xs font-cinzel font-bold text-amber-200 flex items-center gap-2 cursor-pointer">
                    <Target className="w-4 h-4 text-amber-400" />
                    <span>Marcar Objetivo como Concluído</span>
                  </label>
                  <input
                    id="form-completed-checkbox"
                    type="checkbox"
                    checked={formCompleted}
                    onChange={(e) => setFormCompleted(e.target.checked)}
                    className="w-4 h-4 rounded border-amber-400 text-amber-500 focus:ring-amber-400 bg-zinc-950 cursor-pointer"
                  />
                </div>
              )}

              {/* Conteúdo / Detalhes */}
              <div>
                <label className="text-xs font-cinzel font-bold text-zinc-300 block mb-1">
                  Conteúdo / Descrição:
                </label>
                <textarea
                  rows={4}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={CATEGORY_CONFIG[formCategory].placeholderContent}
                  className="w-full bg-zinc-950 border border-purple-900/80 focus:border-amber-400 rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition shadow-inner font-sans leading-relaxed"
                />
              </div>

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-900/60">
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
                  <span>{editingNote ? 'Salvar Alterações' : 'Criar Nota'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
