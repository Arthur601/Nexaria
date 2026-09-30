import React from 'react';
import { SpellCard } from '../types/rpg';
import { Sparkles, Droplets, Target, ShieldAlert, Zap } from 'lucide-react';
import { sound } from '../utils/audio';

interface SpellCardViewProps {
  card: SpellCard;
  onCast?: (card: SpellCard) => void;
  onEdit?: (card: SpellCard) => void;
  onDelete?: (cardId: string) => void;
  canCast?: boolean;
}

export const SpellCardView: React.FC<SpellCardViewProps> = ({
  card,
  onCast,
  onEdit,
  onDelete,
  canCast = true,
}) => {
  const handleCast = () => {
    sound.playSpellCast();
    if (onCast) onCast(card);
  };

  return (
    <div
      id={`spell-card-${card.id}`}
      className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5 text-zinc-200 flex flex-col gap-3 transition hover:border-zinc-700"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg shrink-0">
            {card.iconEmoji || '🔮'}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-zinc-100 text-sm truncate">
              {card.name}
            </h4>
            <div className="text-[11px] text-zinc-400">
              {card.type || 'Geral'}
            </div>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">
          {card.classification || 'Grau I'}
        </span>
      </div>

      {/* 4 Clean Parameters */}
      <div className="grid grid-cols-3 gap-1.5 text-xs">
        <div className="rounded border border-zinc-800 bg-zinc-950/60 p-1.5 flex flex-col">
          <span className="text-[10px] text-zinc-500 uppercase">Custo</span>
          <span className="font-mono text-blue-400 font-semibold text-xs mt-0.5">
            {card.magicCost || '0 PM'}
          </span>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950/60 p-1.5 flex flex-col">
          <span className="text-[10px] text-zinc-500 uppercase">Alcance</span>
          <span className="text-zinc-300 text-xs mt-0.5 truncate">
            {card.range || 'Pessoal'}
          </span>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950/60 p-1.5 flex flex-col">
          <span className="text-[10px] text-zinc-500 uppercase">Limite</span>
          <span className="text-zinc-300 text-xs mt-0.5 truncate">
            {card.useLimit || 'À vontade'}
          </span>
        </div>
      </div>

      {/* Description & Effects */}
      <div className="space-y-1.5 text-xs">
        <p className="text-zinc-400 leading-relaxed text-[11px]">
          {card.description}
        </p>

        {card.effects && (
          <div className="text-[11px] bg-zinc-950/40 p-1.5 rounded border border-zinc-800/80">
            <span className="text-zinc-500 font-medium mr-1">Efeitos:</span>
            <span className="text-zinc-300">{card.effects}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 mt-auto text-xs">
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(card)}
              className="text-zinc-400 hover:text-zinc-200 transition text-[11px]"
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(card.id)}
              className="text-red-400 hover:text-red-300 transition text-[11px]"
            >
              Excluir
            </button>
          )}
        </div>

        {onCast && (
          <button
            type="button"
            disabled={!canCast}
            onClick={handleCast}
            className="px-2.5 py-1 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <Zap className="w-3 h-3 text-amber-500" />
            Lançar
          </button>
        )}
      </div>
    </div>
  );
};
