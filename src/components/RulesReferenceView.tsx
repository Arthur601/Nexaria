import React, { useState } from 'react';
import { RULES_REFERENCE_DATA } from '../data/rulesReference';
import { sound } from '../utils/audio';
import {
  BookOpen,
  Shield,
  Sparkles,
  Swords,
  Flame,
  AlertTriangle,
  Compass,
  Coins,
  Search,
} from 'lucide-react';

interface RulesReferenceViewProps {
  onBack?: () => void;
}

export const RulesReferenceView: React.FC<RulesReferenceViewProps> = ({ onBack }) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(RULES_REFERENCE_DATA[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const iconMap: Record<string, React.ReactNode> = {
    Shield: <Shield className="w-4 h-4 text-amber-400" />,
    Sparkles: <Sparkles className="w-4 h-4 text-purple-400" />,
    Swords: <Swords className="w-4 h-4 text-red-400" />,
    Flame: <Flame className="w-4 h-4 text-orange-400" />,
    AlertTriangle: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    Compass: <Compass className="w-4 h-4 text-sky-400" />,
    Coins: <Coins className="w-4 h-4 text-yellow-400" />,
  };

  const activeSection = RULES_REFERENCE_DATA.find((s) => s.id === selectedSectionId) || RULES_REFERENCE_DATA[0];

  const filteredContent = activeSection.content.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Banner / Cabeçalho da Tabela de Referências */}
      <div className="relative rounded-2xl border border-amber-600/40 bg-gradient-to-r from-purple-950/70 via-zinc-950/90 to-purple-950/70 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Detalhes de cantos ornatos */}
        <div className="absolute top-2 left-2 text-amber-500/40 text-xs font-cinzel select-none">✦</div>
        <div className="absolute top-2 right-2 text-amber-500/40 text-xs font-cinzel select-none">✦</div>
        <div className="absolute bottom-2 left-2 text-amber-500/40 text-xs font-cinzel select-none">✦</div>
        <div className="absolute bottom-2 right-2 text-amber-500/40 text-xs font-cinzel select-none">✦</div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-950/40 text-[11px] font-cinzel font-semibold tracking-wider text-amber-300 uppercase mb-2">
              <span>✦</span> Tabela de Referências Oficial <span>✦</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-cinzel font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100">
              TABELA DE REFERÊNCIAS
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-xl font-sans">
              Resumo rápido de regras, mecânicas, testes e tabelas de consulta direta para Mestres e Jogadores de Nexaria — O Legado do Abismo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar regra ou termo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/80 border border-purple-900/60 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Navegação e Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navegação lateral de seções */}
        <div className="md:col-span-4 lg:col-span-3 space-y-2">
          <div className="text-[11px] font-cinzel font-bold tracking-widest text-amber-400/90 uppercase px-2 mb-2 flex items-center justify-between">
            <span>Seções do Livro</span>
            <BookOpen className="w-3.5 h-3.5 text-amber-400/60" />
          </div>

          {RULES_REFERENCE_DATA.map((section) => {
            const isActive = section.id === selectedSectionId;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  sound.playCoinClink('PRT');
                  setSelectedSectionId(section.id);
                  setSearchQuery('');
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                  isActive
                    ? 'border-amber-500/70 bg-gradient-to-r from-amber-950/60 to-purple-950/40 text-amber-200 shadow-lg shadow-amber-950/30 font-semibold'
                    : 'border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-800/60 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <div className={`p-2 rounded-lg border ${isActive ? 'border-amber-500/50 bg-amber-950/70' : 'border-zinc-800 bg-zinc-900'}`}>
                  {iconMap[section.iconName] || <BookOpen className="w-4 h-4 text-zinc-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-cinzel font-bold tracking-wide truncate">
                    {section.title}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    {section.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Painel Central com os Dados Detalhados */}
        <div className="md:col-span-8 lg:col-span-9">
          <div className="rounded-2xl border border-amber-600/30 bg-gradient-to-b from-zinc-900/90 via-[#0d0918]/90 to-zinc-950/95 p-6 shadow-xl relative overflow-hidden">
            {/* Topo do painel da seção ativa */}
            <div className="flex items-center gap-3 border-b border-purple-900/50 pb-4 mb-5">
              <div className="p-2.5 rounded-xl border border-amber-500/50 bg-amber-950/40 text-amber-300">
                {iconMap[activeSection.iconName]}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-cinzel font-bold text-amber-200 tracking-wide">
                  {activeSection.title}
                </h2>
                <p className="text-xs text-purple-300/80 font-sans">
                  {activeSection.subtitle}
                </p>
              </div>
            </div>

            {/* Lista de regras e referências */}
            <div className="space-y-3">
              {filteredContent.length > 0 ? (
                filteredContent.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-purple-900/30 bg-purple-950/15 hover:bg-purple-950/25 hover:border-amber-500/40 transition flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-cinzel text-xs font-bold tracking-wide">
                          ✦ {item.label}
                        </span>
                      </div>
                      <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed font-sans">
                        {item.details}
                      </p>
                      {item.example && (
                        <p className="text-[11px] text-purple-300/90 italic mt-1 font-mono">
                          Exemplo: {item.example}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  Nenhuma regra encontrada para o termo &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>

            {/* Rodapé da tabela */}
            <div className="mt-6 pt-4 border-t border-purple-900/40 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span>Livro de Regras Oficiais de Nexaria</span>
              <span className="text-amber-400/80 font-cinzel">&bull; O Legado do Abismo &bull;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
