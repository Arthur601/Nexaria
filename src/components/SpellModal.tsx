import React, { useState } from 'react';
import { SpellCard } from '../types/rpg';
import { X, Sparkles, Save } from 'lucide-react';

interface SpellModalProps {
  initialCard?: SpellCard | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: SpellCard) => void;
}

export const SpellModal: React.FC<SpellModalProps> = ({
  initialCard,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initialCard?.name || '');
  const [classification, setClassification] = useState(initialCard?.classification || 'Grau I - Arcano');
  const [magicCost, setMagicCost] = useState(initialCard?.magicCost || '10 PM');
  const [type, setType] = useState(initialCard?.type || 'Ofensivo / Evocação');
  const [range, setRange] = useState(initialCard?.range || '18 metros');
  const [useLimit, setUseLimit] = useState(initialCard?.useLimit || '2x por combate');
  const [description, setDescription] = useState(
    initialCard?.description || 'Descreva como o personagem canaliza esta magia ou poder.'
  );
  const [effects, setEffects] = useState(initialCard?.effects || 'Dano, bônus, condição ou efeito no alvo.');
  const [notes, setNotes] = useState(initialCard?.notes || 'Requisitos de foco ou recarga.');
  const [iconEmoji, setIconEmoji] = useState(initialCard?.iconEmoji || '🔮');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const card: SpellCard = {
      id: initialCard?.id || 'spell-' + Date.now(),
      name: name.trim(),
      classification: classification.trim(),
      magicCost: magicCost.trim(),
      type: type.trim(),
      range: range.trim(),
      useLimit: useLimit.trim(),
      description: description.trim(),
      effects: effects.trim(),
      notes: notes.trim(),
      iconEmoji,
    };

    onSave(card);
    onClose();
  };

  const emojiPresets = ['🔮', '⚡', '🔥', '🛡️', '🗡️', '❄️', '👁️', '🌀', '💠', '🩸', '💀', '✨'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-zinc-100 shadow-xl my-8">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-100">
              {initialCard ? 'Editar Carta de Habilidade' : 'Nova Carta de Habilidade'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Row 1: Name and Emoji */}
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-9">
              <label className="block text-zinc-400 font-medium mb-1">
                Nome da Habilidade *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Disparo de Éter"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-zinc-400 font-medium mb-1">
                Ícone
              </label>
              <div className="flex items-center justify-center bg-zinc-950 border border-zinc-800 rounded-md h-[30px] text-lg">
                {iconEmoji}
              </div>
            </div>
          </div>

          {/* Quick Emoji selection bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {emojiPresets.map((em) => (
              <button
                type="button"
                key={em}
                onClick={() => setIconEmoji(em)}
                className={`text-sm p-1 rounded hover:bg-zinc-800 border transition ${
                  iconEmoji === em ? 'border-zinc-500 bg-zinc-800' : 'border-transparent'
                }`}
              >
                {em}
              </button>
            ))}
          </div>

          {/* Row 2: Classificação and Custo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Classificação
              </label>
              <input
                type="text"
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                placeholder="Grau I / Runa"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Custo
              </label>
              <input
                type="text"
                value={magicCost}
                onChange={(e) => setMagicCost(e.target.value)}
                placeholder="Ex: 10 PM"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          {/* Row 3: Tipo, Alcance, Limite de Uso */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Tipo
              </label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Ofensivo"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Alcance
              </label>
              <input
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="18m"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Limite
              </label>
              <input
                type="text"
                value={useLimit}
                onChange={(e) => setUseLimit(e.target.value)}
                placeholder="À vontade"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Descrição
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-600 leading-relaxed"
            />
          </div>

          {/* Efeitos & Observações */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Efeitos
              </label>
              <textarea
                rows={2}
                value={effects}
                onChange={(e) => setEffects(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Observações
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs rounded-md border border-zinc-800 text-zinc-400 hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-md shadow-sm flex items-center gap-1.5 transition"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Carta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
