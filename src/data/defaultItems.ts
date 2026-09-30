import { InventoryItem, ItemCategory, ItemRarity, getInventoryLevelBonus } from '../types/rpg';

export const RARITY_CONFIG: Record<
  ItemRarity,
  {
    name: string;
    color: string;
    border: string;
    cardBorder: string;
    cardHoverBorder: string;
    bg: string;
    text: string;
    glowClass: string;
    stars: string;
    description: string;
    loreTip: string;
  }
> = {
  comum: {
    name: 'Comum',
    color: '#9ca3af',
    border: 'border-zinc-500',
    cardBorder: 'border-zinc-500',
    cardHoverBorder: 'hover:border-zinc-300',
    bg: 'bg-zinc-800/50',
    text: 'text-zinc-300',
    glowClass: 'shadow-zinc-900/40',
    stars: '★☆☆☆☆',
    description: 'Item comum, forjado com recursos mundanos e de fácil reposição nos mercados.',
    loreTip: 'Equipamento padrão de aventureiros novatos e habitantes de vilas.',
  },
  incomum: {
    name: 'Incomum',
    color: '#10b981',
    border: 'border-emerald-500',
    cardBorder: 'border-emerald-500',
    cardHoverBorder: 'hover:border-emerald-300',
    bg: 'bg-emerald-950/50',
    text: 'text-emerald-300',
    glowClass: 'shadow-emerald-950/50 shadow-md',
    stars: '★★☆☆☆',
    description: 'Item aprimorado por artífices habilidosos, com ligas metálicas superiores ou leve alquimia.',
    loreTip: 'Concede vantagens táteis e maior resistência contra o desgaste.',
  },
  raro: {
    name: 'Raro',
    color: '#3b82f6',
    border: 'border-blue-500',
    cardBorder: 'border-blue-500',
    cardHoverBorder: 'hover:border-blue-300',
    bg: 'bg-blue-950/50',
    text: 'text-blue-300',
    glowClass: 'shadow-blue-950/60 shadow-lg',
    stars: '★★★☆☆',
    description: 'Imbuído com essência de cristais e runas arcanas de grande pureza.',
    loreTip: 'Difícil de encontrar, normalmente fruto de masmorras ou encomendas nobres.',
  },
  epico: {
    name: 'Épico',
    color: '#a855f7',
    border: 'border-purple-500',
    cardBorder: 'border-purple-500',
    cardHoverBorder: 'hover:border-purple-300',
    bg: 'bg-purple-950/50',
    text: 'text-purple-300',
    glowClass: 'shadow-purple-950/70 shadow-lg',
    stars: '★★★★☆',
    description: 'Artefato extraordinário com história imortalizada nos anais das fendas de Nexaria.',
    loreTip: 'Ressoa com energias místicas antigas, alterando os rumos do combate.',
  },
  lendario: {
    name: 'Lendário',
    color: '#f59e0b',
    border: 'border-amber-400',
    cardBorder: 'border-amber-400',
    cardHoverBorder: 'hover:border-yellow-300',
    bg: 'bg-amber-950/60',
    text: 'text-amber-300',
    glowClass: 'shadow-amber-950/80 shadow-xl ring-1 ring-amber-500/40',
    stars: '★★★★★',
    description: 'Obra-prima singular forjada por divindades ou antigos mestres ferreiros de Eldria.',
    loreTip: 'Possui poder avassalador reverenciado por reinos e ordens arcanas.',
  },
  abissal: {
    name: 'Abissal',
    color: '#ef4444',
    border: 'border-red-500/90',
    cardBorder: 'border-red-600/90',
    cardHoverBorder: 'hover:border-red-400',
    bg: 'bg-red-950/60',
    text: 'text-red-400',
    glowClass: 'shadow-red-950/90 shadow-2xl ring-1 ring-red-500/40',
    stars: '☠ ABISSAL ☠',
    description: 'Relíquia tocada pelas trevas do abismo sombrio. Seu poder é incomensurável e perigoso.',
    loreTip: 'Pulsa com calor cáustico e murmúrios de feras ancestrais.',
  },
};

export const CATEGORY_LABELS: Record<ItemCategory, { label: string; icon: string }> = {
  arma: { label: 'Arma', icon: '⚔️' },
  armadura: { label: 'Armadura', icon: '🛡️' },
  pocao: { label: 'Poção / Consumível', icon: '🧪' },
  chave: { label: 'Item Chave / Missão', icon: '🗝️' },
  material: { label: 'Material / Componente', icon: '⛏️' },
  reliquia: { label: 'Relíquia Arcana', icon: '💍' },
  cyber: { label: 'Tecnomagia / Cyber', icon: '💠' },
  equipamento: { label: 'Equipamento', icon: '🎒' },
  geral: { label: 'Item Geral', icon: '📜' },
};

export const PRESET_NEXARIA_ITEMS: Omit<InventoryItem, 'id'>[] = [
  // Itens Chave & Missão
  {
    name: 'Chave Rúnica de Caeldrin',
    category: 'chave',
    rarity: 'raro',
    quantity: 1,
    weightKg: 0.1,
    effectText: 'Desbloqueia os portões ancestrais dos Arquivos Arcanos.',
    description: 'Chave forjada em prata estelar esculpida com glifos de proteção da alta ordem.',
    valueAmount: 0,
    valueCurrency: 'ORO',
    iconEmoji: '🗝️',
  },
  {
    name: 'Selo do Guardião Abissal',
    category: 'chave',
    rarity: 'epico',
    quantity: 1,
    weightKg: 0.2,
    effectText: 'Concede imunidade aos gases venenosos nos limites da Fenda Sombria.',
    description: 'Medalhão de obsidiana pulsando com uma brasa escura contida.',
    valueAmount: 0,
    valueCurrency: 'ORO',
    iconEmoji: '🛡️',
  },
  {
    name: 'Pergaminho de Édito Imperial',
    category: 'chave',
    rarity: 'incomum',
    quantity: 1,
    weightKg: 0.1,
    effectText: 'Livre passagem pelas pontes levadiças e postos de guarda da Cidadela.',
    description: 'Documento assinado com lacre de cera dourada do Conselho dos Mestres.',
    valueAmount: 0,
    valueCurrency: 'PRT',
    iconEmoji: '📜',
  },
  // Consumíveis
  {
    name: 'Poção de Vida Abissal',
    category: 'pocao',
    rarity: 'incomum',
    quantity: 1,
    weightKg: 0.5,
    effectText: 'Recupera 15 PV imediatamente.',
    description: 'Frasco contendo néctar rubro destilado de raízes abissais.',
    valueAmount: 36,
    valueCurrency: 'PRT',
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
    valueAmount: 34,
    valueCurrency: 'ORO',
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
    valueAmount: 29,
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
    valueAmount: 47,
    valueCurrency: 'ORO',
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
    valueAmount: 5,
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
    valueAmount: 34,
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
    valueAmount: 54,
    valueCurrency: 'ORO',
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
    valueAmount: 45,
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
    valueAmount: 292,
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
    valueAmount: 5,
    valueCurrency: 'CYB',
    iconEmoji: '👁️',
  },

  // Materiais e Componentes de Forja
  {
    name: 'Fragmento de Mithril Puro',
    category: 'material',
    rarity: 'raro',
    quantity: 2,
    weightKg: 0.8,
    effectText: 'Material de forja leve: reduz peso em 30% e adiciona +1 CA em armaduras.',
    description: 'Metal prateado extremamente reluzente e leve, extraído das profundezas das montanhas.',
    valueAmount: 31,
    valueCurrency: 'ORO',
    iconEmoji: '⛏️',
  },
  {
    name: 'Escama Dracônica Ancestral',
    category: 'material',
    rarity: 'lendario',
    quantity: 1,
    weightKg: 1.2,
    effectText: 'Material lendário: confere imunidade ou alta resistência elemental.',
    description: 'Escama iridescente impenetrável caída de um grande dragão milenar de Eldria.',
    valueAmount: 74,
    valueCurrency: 'PLN',
    iconEmoji: '🛡️',
  },
  {
    name: 'Garra Predadora Abissal',
    category: 'material',
    rarity: 'epico',
    quantity: 1,
    weightKg: 0.5,
    effectText: 'Componente de forja: adiciona sangramento e +3 de dano cortante.',
    description: 'Garra afiada como navalha impregnada com a essência cáustica do Abismo.',
    valueAmount: 163,
    valueCurrency: 'ORO',
    iconEmoji: '🐾',
  },
  {
    name: 'Cristal de Quartzo Arcano',
    category: 'material',
    rarity: 'incomum',
    quantity: 3,
    weightKg: 0.3,
    effectText: 'Catalisador mágico para recarga de cajados e focos.',
    description: 'Cristal translúcido com filamentos de luz azul que captam mana ambiental.',
    valueAmount: 33,
    valueCurrency: 'PRT',
    iconEmoji: '💎',
  },

  // Equipamento de Aventura
  {
    name: 'Mochila de Couro Reforçado',
    category: 'equipamento',
    rarity: 'comum',
    quantity: 1,
    weightKg: 1.5,
    description: 'Compartimentos estanques e alças acolchoadas para longas expedições.',
    valueAmount: 28,
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
    valueAmount: 28,
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
    valueAmount: 35,
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
    valueAmount: 28,
    valueCurrency: 'BRZ',
    iconEmoji: '🍞',
  },

  // Melhorias de Mochila e Carga da Loja do Mestre
  {
    name: 'Mochila Reforçada de Basilisco',
    category: 'equipamento',
    rarity: 'incomum',
    quantity: 1,
    weightKg: 1.0,
    effectText: '+15 kg de capacidade máxima de carga.',
    description: 'Mochila artesanal de couro curtido de basilisco com costuras reforçadas por fios metálicos. Aumenta a capacidade de carga do aventureiro em +15 kg.',
    valueAmount: 35,
    valueCurrency: 'PRT',
    iconEmoji: '🎒',
  },
  {
    name: 'Alforjes Arcanos de Éter',
    category: 'equipamento',
    rarity: 'raro',
    quantity: 1,
    weightKg: 0.8,
    effectText: '+25 kg de capacidade máxima de carga.',
    description: 'Bolsas utilitárias tecidas com seda de aranha espectral e runas de levitação etérea. Concede +25 kg de carga sem sobrepeso extra.',
    valueAmount: 33,
    valueCurrency: 'ORO',
    iconEmoji: '✨',
  },
  {
    name: 'Bolsa Dimensional do Abismo',
    category: 'reliquia',
    rarity: 'epico',
    quantity: 1,
    weightKg: 0.5,
    effectText: '+50 kg de capacidade máxima de carga.',
    description: 'Artefato lendário conectado a uma bolsa dimensional sem fundo (Bag of Holding). Concede impressionantes +50 kg de espaço extra no inventário.',
    valueAmount: 238,
    valueCurrency: 'ORO',
    iconEmoji: '🌌',
  },
  {
    name: 'Cinto Tático com Arreios de Carga',
    category: 'equipamento',
    rarity: 'incomum',
    quantity: 1,
    weightKg: 0.6,
    effectText: '+10 kg de capacidade máxima de carga.',
    description: 'Cinto utilitário reforçado com presilhas para frascos, coldres e ferramentas de campo. Concede +10 kg de capacidade de carga.',
    valueAmount: 35,
    valueCurrency: 'PRT',
    iconEmoji: '🥋',
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
  // Regra clássica de RPG: 5 kg por ponto de Força (mínimo 30 kg)
  return Math.max(30, (strength || 10) * 5);
}

/**
 * Bônus de capacidade concedido intrinsecamente pela Classe do personagem.
 */
export function getClassCarryBonus(characterClass?: string): { bonus: number; label: string } {
  if (!characterClass) return { bonus: 5, label: 'Classe Básica (+5 kg)' };
  const normalized = characterClass.toLowerCase().trim();

  if (normalized.includes('bárbaro') || normalized.includes('barbaro')) {
    return { bonus: 20, label: 'Bárbaro: Vigor Físico Extremo (+20 kg)' };
  }
  if (
    normalized.includes('guerreiro') ||
    normalized.includes('paladino') ||
    normalized.includes('cavaleiro') ||
    normalized.includes('guarda')
  ) {
    return { bonus: 15, label: `${characterClass}: Treinamento Marcial de Carga (+15 kg)` };
  }
  if (
    normalized.includes('artífice') ||
    normalized.includes('artifice') ||
    normalized.includes('tecnologista') ||
    normalized.includes('engenheiro')
  ) {
    return { bonus: 12, label: `${characterClass}: Bolsas e Cintos Táticos (+12 kg)` };
  }
  if (
    normalized.includes('ladino') ||
    normalized.includes('ranger') ||
    normalized.includes('caçador') ||
    normalized.includes('cacador') ||
    normalized.includes('batedor')
  ) {
    return { bonus: 10, label: `${characterClass}: Mochila Leve de Exploração (+10 kg)` };
  }
  if (normalized.includes('monge') || normalized.includes('clérigo') || normalized.includes('clerigo')) {
    return { bonus: 8, label: `${characterClass}: Condicionamento Físico (+8 kg)` };
  }
  if (
    normalized.includes('mago') ||
    normalized.includes('feiticeiro') ||
    normalized.includes('bruxo') ||
    normalized.includes('bardo')
  ) {
    return { bonus: 5, label: `${characterClass}: Carga Básica Arcana (+5 kg)` };
  }
  return { bonus: 5, label: `${characterClass}: Carga da Classe (+5 kg)` };
}

/**
 * Bônus de capacidade obtido por itens de melhoria comprados na Loja do Mestre ou encontrados no jogo.
 */
export function getInventoryCapacityBonus(items?: InventoryItem[]): {
  bonus: number;
  sources: { name: string; bonus: number; icon: string }[];
} {
  if (!items || !Array.isArray(items)) return { bonus: 0, sources: [] };
  let totalBonus = 0;
  const sources: { name: string; bonus: number; icon: string }[] = [];

  items.forEach((item) => {
    let itemBonus = 0;
    const nameLower = (item.name || '').toLowerCase();
    const effectLower = (item.effectText || '').toLowerCase();
    const descLower = (item.description || '').toLowerCase();
    const combined = `${effectLower} ${descLower}`;

    const match = combined.match(/\+(\d+(?:\.\d+)?)\s*kg\s*(?:de\s*)?(?:capacidade|carga|espaço|mochila)/);
    if (match && match[1]) {
      itemBonus = parseFloat(match[1]);
    } else if (
      nameLower.includes('bolsa dimensional') ||
      nameLower.includes('mochila sem fundo') ||
      nameLower.includes('bag of holding')
    ) {
      itemBonus = 50;
    } else if (nameLower.includes('alforje arcano') || nameLower.includes('alforjes arcanos')) {
      itemBonus = 25;
    } else if (nameLower.includes('mochila reforçada') || nameLower.includes('mochila reforçada de basilisco')) {
      itemBonus = 15;
    } else if (nameLower.includes('cinto tático') || nameLower.includes('arreios de carga')) {
      itemBonus = 10;
    }

    if (itemBonus > 0) {
      const qty = item.quantity || 1;
      const added = itemBonus * qty;
      totalBonus += added;
      sources.push({
        name: `${item.name}${qty > 1 ? ` (${qty}x)` : ''}`,
        bonus: added,
        icon: item.iconEmoji || '🎒',
      });
    }
  });

  return { bonus: totalBonus, sources };
}

export interface CarryCapacityBreakdown {
  baseCapacity: number;
  strengthValue: number;
  classBonus: number;
  classLabel: string;
  levelBonus: number;
  characterLevel: number;
  upgradeBonus: number;
  upgradeSources: { name: string; bonus: number; icon: string }[];
  maxCapacity: number;
}

export function getCharacterCarryBreakdown(
  character: {
    level?: number;
    attributes?: { FOR?: number };
    characterClass?: string;
    inventory?: InventoryItem[];
  },
  inventoryCapacityPerLevelTable?: Record<number, number>
): CarryCapacityBreakdown {
  const str = character.attributes?.FOR || 10;
  const charLevel = Math.max(1, Math.floor(character.level || 1));
  const baseCapacity = calculateMaxCarryCapacity(str);
  const classInfo = getClassCarryBonus(character.characterClass);
  const levelBonus = getInventoryLevelBonus(charLevel, inventoryCapacityPerLevelTable);
  const upgradeInfo = getInventoryCapacityBonus(character.inventory);
  const maxCapacity = baseCapacity + classInfo.bonus + levelBonus + upgradeInfo.bonus;

  return {
    baseCapacity,
    strengthValue: str,
    classBonus: classInfo.bonus,
    classLabel: classInfo.label,
    levelBonus,
    characterLevel: charLevel,
    upgradeBonus: upgradeInfo.bonus,
    upgradeSources: upgradeInfo.sources,
    maxCapacity,
  };
}

export function getCharacterMaxCarryWeight(
  character: {
    level?: number;
    attributes?: { FOR?: number };
    characterClass?: string;
    inventory?: InventoryItem[];
  },
  inventoryCapacityPerLevelTable?: Record<number, number>
): number {
  return getCharacterCarryBreakdown(character, inventoryCapacityPerLevelTable).maxCapacity;
}
