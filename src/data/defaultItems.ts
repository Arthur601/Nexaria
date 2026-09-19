import { InventoryItem, ItemCategory, ItemRarity } from '../types/rpg';

export const RARITY_CONFIG: Record<
  ItemRarity,
  { name: string; color: string; border: string; bg: string; text: string }
> = {
  comum: {
    name: 'Comum',
    color: '#a1a1aa',
    border: 'border-zinc-700',
    bg: 'bg-zinc-800/40',
    text: 'text-zinc-300',
  },
  incomum: {
    name: 'Incomum',
    color: '#10b981',
    border: 'border-emerald-700/80',
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-300',
  },
  raro: {
    name: 'Raro',
    color: '#0ea5e9',
    border: 'border-sky-600/80',
    bg: 'bg-sky-950/40',
    text: 'text-sky-300',
  },
  epico: {
    name: 'Épico',
    color: '#a855f7',
    border: 'border-purple-600/80',
    bg: 'bg-purple-950/40',
    text: 'text-purple-300',
  },
  lendario: {
    name: 'Lendário',
    color: '#f59e0b',
    border: 'border-amber-500/90',
    bg: 'bg-amber-950/40',
    text: 'text-amber-300',
  },
  abissal: {
    name: 'Abissal',
    color: '#ef4444',
    border: 'border-red-600/90',
    bg: 'bg-red-950/50',
    text: 'text-red-400',
  },
};

export const CATEGORY_LABELS: Record<ItemCategory, { label: string; icon: string }> = {
  arma: { label: 'Arma', icon: '⚔️' },
  armadura: { label: 'Armadura', icon: '🛡️' },
  pocao: { label: 'Poção / Consumível', icon: '🧪' },
  reliquia: { label: 'Relíquia Arcana', icon: '💍' },
  cyber: { label: 'Tecnomagia / Cyber', icon: '💠' },
  equipamento: { label: 'Equipamento', icon: '🎒' },
  geral: { label: 'Item Geral', icon: '📜' },
};

export const PRESET_NEXARIA_ITEMS: Omit<InventoryItem, 'id'>[] = [
  // Consumíveis
  {
    name: 'Poção de Vida Abissal',
    category: 'pocao',
    rarity: 'incomum',
    quantity: 1,
    weightKg: 0.5,
    effectText: 'Recupera 15 PV imediatamente.',
    description: 'Frasco contendo néctar rubro destilado de raízes abissais.',
    valueAmount: 15,
    valueCurrency: 'BRZ',
    iconEmoji: '🧪',
  },
  {
    name: 'Elixir de Éter Arcano',
    category: 'pocao',
    rarity: 'raro',
    quantity: 1,
    weightKg: 0.4,
    effectText: 'Restaura 20 PM e clareia a mente.',
    description: 'Essência brilhante de mana concentrada das fendas de Nexaria.',
    valueAmount: 3,
    valueCurrency: 'PRT',
    iconEmoji: '💧',
  },
  {
    name: 'Tônico de Estamina do Titã',
    category: 'pocao',
    rarity: 'comum',
    quantity: 1,
    weightKg: 0.5,
    effectText: 'Restaura 15 Estamina para ações de combate.',
    description: 'Líquido amarelado que elimina a fadiga muscular.',
    valueAmount: 8,
    valueCurrency: 'BRZ',
    iconEmoji: '⚡',
  },

  // Armas
  {
    name: 'Lâmina Rúnica de Prata',
    category: 'arma',
    rarity: 'raro',
    quantity: 1,
    weightKg: 2.0,
    equipped: false,
    effectText: '1d8+2 Dano Cortante (+1d4 contra aberrações)',
    description: 'Espada de folha única gravada com glifos de Nexaria que ressoam contra o mal.',
    valueAmount: 8,
    valueCurrency: 'PRT',
    iconEmoji: '⚔️',
  },
  {
    name: 'Canhão de Pulso Cibernético',
    category: 'cyber',
    rarity: 'epico',
    quantity: 1,
    weightKg: 3.5,
    equipped: false,
    effectText: '2d8 Dano de Força Cibernética (Alcance 20m)',
    description: 'Arma pesada tecnomágica acoplável ao antebraço alimentada por cybercélula.',
    valueAmount: 1,
    valueCurrency: 'CYB',
    iconEmoji: '🔫',
  },
  {
    name: 'Adaga Oculta de Bronze Forjado',
    category: 'arma',
    rarity: 'comum',
    quantity: 1,
    weightKg: 0.8,
    equipped: false,
    effectText: '1d4 Dano Perfurante (Ágil / Arremesso)',
    description: 'Adaga clássica e equilibrada, fácil de esconder nas botas.',
    valueAmount: 12,
    valueCurrency: 'BRZ',
    iconEmoji: '🗡️',
  },

  // Armaduras e Proteções
  {
    name: 'Cota de Malha do Guardião',
    category: 'armadura',
    rarity: 'raro',
    quantity: 1,
    weightKg: 14.0,
    equipped: false,
    effectText: '+4 na Classe de Armadura (CA)',
    description: 'Armadura pesada forjada com anéis entrelaçados de ferro e bronze encantado.',
    valueAmount: 12,
    valueCurrency: 'PRT',
    iconEmoji: '🛡️',
  },
  {
    name: 'Broquel Rúnico de Nexaria',
    category: 'armadura',
    rarity: 'incomum',
    quantity: 1,
    weightKg: 2.5,
    equipped: false,
    effectText: '+2 na Classe de Armadura (CA)',
    description: 'Escudo leve de mão secundária com runa de repulsão cinética gravada.',
    valueAmount: 5,
    valueCurrency: 'PRT',
    iconEmoji: '🛡️',
  },

  // Relíquias e Cyber
  {
    name: 'Amuleto do Coração Abissal',
    category: 'reliquia',
    rarity: 'abissal',
    quantity: 1,
    weightKg: 0.2,
    equipped: false,
    effectText: '+15 Vida Máxima e Resistência a Dano de Trevas',
    description: 'Gema pulsante retirada do epicentro da Fenda Abissal.',
    valueAmount: 2,
    valueCurrency: 'PLN',
    iconEmoji: '💍',
  },
  {
    name: 'Implante Óptico Rúnico v2',
    category: 'cyber',
    rarity: 'epico',
    quantity: 1,
    weightKg: 0.1,
    equipped: false,
    effectText: 'Visão no Escuro 24m e +2 em Percepção Rúnica',
    description: 'Dispositivo cibernético sintonizado na íris do usuário.',
    valueAmount: 2,
    valueCurrency: 'CYB',
    iconEmoji: '👁️',
  },

  // Equipamento de Aventura
  {
    name: 'Mochila de Couro Reforçado',
    category: 'equipamento',
    rarity: 'comum',
    quantity: 1,
    weightKg: 1.5,
    description: 'Compartimentos estanques e alças acolchoadas para longas expedições.',
    valueAmount: 10,
    valueCurrency: 'BRZ',
    iconEmoji: '🎒',
  },
  {
    name: 'Kit de Primeiros Socorros do Abismo',
    category: 'equipamento',
    rarity: 'comum',
    quantity: 3,
    weightKg: 1.0,
    effectText: 'Estabiliza aventureiros caídos e trata ferimentos.',
    description: 'Bandagens estéreis, unguentos cicatrizantes e talas de madeira.',
    valueAmount: 25,
    valueCurrency: 'BRZ',
    iconEmoji: '🩹',
  },
  {
    name: 'Tocha Rúnica Eterna',
    category: 'geral',
    rarity: 'incomum',
    quantity: 1,
    weightKg: 0.6,
    effectText: 'Ilumina 12m sem consumir combustível.',
    description: 'Chama fria azulada mantida por uma runa de calor residual.',
    valueAmount: 3,
    valueCurrency: 'PRT',
    iconEmoji: '🔥',
  },
  {
    name: 'Rações de Viagem (7 dias)',
    category: 'geral',
    rarity: 'comum',
    quantity: 1,
    weightKg: 3.5,
    effectText: 'Sustento diário para expedições prolongadas.',
    description: 'Carne seca, pão de centeio e frutas preservadas.',
    valueAmount: 5,
    valueCurrency: 'BRZ',
    iconEmoji: '🍞',
  },
];

export function calculateInventoryWeight(items: InventoryItem[]): number {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const weight = item.weightKg ?? (parseFloat(item.weight || '0') || 0.5);
    return sum + weight * (item.quantity || 1);
  }, 0);
}

export function calculateMaxCarryCapacity(strength: number): number {
  // Regra clássica de RPG: 5 a 7 kg por ponto de Força
  return Math.max(30, (strength || 10) * 5);
}
