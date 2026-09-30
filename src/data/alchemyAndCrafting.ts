import { CurrencyType, InventoryItem, ItemRarity } from '../types/rpg';

export interface CraftingIngredient {
  name: string;
  quantity: number;
  iconEmoji: string;
  category: 'erva' | 'mineral' | 'essencia' | 'reagente' | 'metal' | 'catalisador';
}

export interface AlchemyRecipe {
  id: string;
  name: string;
  category: 'pocao' | 'bomba' | 'oleo' | 'transmutacao' | 'elixir';
  rarity: ItemRarity;
  description: string;
  effect: string;
  ingredients: CraftingIngredient[];
  coinCost?: {
    amount: number;
    currency: CurrencyType;
  };
  craftDurationMinutes: number;
  minMasteryLevel: number;
  isUnlockedDefault: boolean;
  resultItem: Omit<InventoryItem, 'id'>;
  specialistBonusTip: string;
}

export interface BlacksmithRecipe {
  id: string;
  name: string;
  category: 'arma' | 'armadura' | 'reforco' | 'ferramenta';
  rarity: ItemRarity;
  description: string;
  effect: string;
  materials: CraftingIngredient[];
  coinCost?: {
    amount: number;
    currency: CurrencyType;
  };
  craftDurationMinutes: number;
  minMasteryLevel: number;
  resultItem: Omit<InventoryItem, 'id'>;
  durabilityMax: number;
  blacksmithBonusTip: string;
}

export const ALCHEMY_RECIPES: AlchemyRecipe[] = [
  {
    id: 'rec_pocao_cura_menor',
    name: 'Poção de Cura de Raiz Vermelha',
    category: 'pocao',
    rarity: 'comum',
    description: 'Destilado tradicional feito a partir de raízes medicinais e água de nascente pura.',
    effect: 'Recupera 20 Pontos de Vida (PV) imediatamente ao ser consumida.',
    ingredients: [
      { name: 'Raiz Vermelha Medicinal', quantity: 2, iconEmoji: '🌱', category: 'erva' },
      { name: 'Água Termal Purificada', quantity: 1, iconEmoji: '💧', category: 'catalisador' },
    ],
    coinCost: { amount: 5, currency: 'BRZ' },
    craftDurationMinutes: 10,
    minMasteryLevel: 1,
    isUnlockedDefault: true,
    resultItem: {
      name: 'Poção de Cura de Raiz Vermelha',
      category: 'pocao',
      rarity: 'comum',
      quantity: 1,
      weightKg: 0.3,
      effectText: 'Recupera +20 PV imediatamente.',
      description: 'Líquido rubro brilhante com aroma de ervas silvestres.',
      valueAmount: 12,
      valueCurrency: 'BRZ',
      iconEmoji: '🧪',
    },
    specialistBonusTip: 'Alquimistas recebem 2 frascos pelo preço e ingredientes de 1.',
  },
  {
    id: 'rec_oleo_manutencao_lamina',
    name: 'Óleo Alquímico de Manutenção de Lâminas',
    category: 'oleo',
    rarity: 'incomum',
    description: 'Composto oleoso hidrofóbico infundido com pó de pirita e essência vegetal. Penetra nas microfissuras de armas de metal e madeira.',
    effect: 'Restaura +15 de Durabilidade na arma escolhida e concede imunidade a desgaste nos próximos 3 ataques!',
    ingredients: [
      { name: 'Seiva de Pinheiro Rúnico', quantity: 2, iconEmoji: '🌲', category: 'erva' },
      { name: 'Pó de Pirita Dourada', quantity: 1, iconEmoji: '✨', category: 'mineral' },
      { name: 'Óleo Mineral Refinado', quantity: 1, iconEmoji: '🛢️', category: 'reagente' },
    ],
    coinCost: { amount: 8, currency: 'BRZ' },
    craftDurationMinutes: 15,
    minMasteryLevel: 1,
    isUnlockedDefault: true,
    resultItem: {
      name: 'Óleo Alquímico de Manutenção de Lâminas',
      category: 'pocao',
      rarity: 'incomum',
      quantity: 1,
      weightKg: 0.2,
      effectText: 'Aplica na arma: +15 durabilidade e proteção contra desgaste.',
      description: 'Frasco âmbar viscoso que lustra e repara os fios das lâminas.',
      valueAmount: 2,
      valueCurrency: 'PRT',
      iconEmoji: '🧴',
    },
    specialistBonusTip: 'Ferreiros e Alquimistas aplicam com dobro de restauração de durabilidade (+30).',
  },
  {
    id: 'rec_frasco_fogo_grego',
    name: 'Frasco Incendiário de Fogo Grego',
    category: 'bomba',
    rarity: 'incomum',
    description: 'Arma química ancestral instável. Queima vigorosamente mesmo em contato com água e adere à carapaça e armadura dos inimigos.',
    effect: 'Arremesso (15m): Explode em área de 4m causando 3d6 de Dano de Fogo e desgasta -3 de durabilidade de armaduras inimigas.',
    ingredients: [
      { name: 'Enxofre Abissal Vulcânico', quantity: 2, iconEmoji: '🌋', category: 'mineral' },
      { name: 'Piche Negro Destilado', quantity: 1, iconEmoji: '🛢️', category: 'reagente' },
      { name: 'Frasco de Vidro Espesso', quantity: 1, iconEmoji: '🧪', category: 'catalisador' },
    ],
    coinCost: { amount: 15, currency: 'BRZ' },
    craftDurationMinutes: 20,
    minMasteryLevel: 2,
    isUnlockedDefault: true,
    resultItem: {
      name: 'Frasco Incendiário de Fogo Grego',
      category: 'pocao',
      rarity: 'incomum',
      quantity: 1,
      weightKg: 0.5,
      effectText: '3d6 Dano de Fogo em área (4m) + quebra de armadura.',
      description: 'Líquido verde-esmeralda incandescente pronto para ser arremessado.',
      valueAmount: 3,
      valueCurrency: 'PRT',
      iconEmoji: '💣',
    },
    specialistBonusTip: 'Alquimistas Pirotécnicos aumentam o dano em +1d6 e raio em +2m.',
  },
  {
    id: 'rec_elixir_eter_concentrado',
    name: 'Elixir de Éter Concentrado',
    category: 'pocao',
    rarity: 'raro',
    description: 'Destilação pura de pó de cristais azuis das fendas arcanas de Nexaria.',
    effect: 'Restaura 30 Pontos de Magia (PM) e clareia a mente para conjurações rápidas.',
    ingredients: [
      { name: 'Cristal de Éter Rúnico', quantity: 2, iconEmoji: '💎', category: 'mineral' },
      { name: 'Flor de Lótus Noturna', quantity: 1, iconEmoji: '🪷', category: 'erva' },
      { name: 'Água Lunar Destilada', quantity: 1, iconEmoji: '🌙', category: 'catalisador' },
    ],
    coinCost: { amount: 3, currency: 'PRT' },
    craftDurationMinutes: 30,
    minMasteryLevel: 2,
    isUnlockedDefault: true,
    resultItem: {
      name: 'Elixir de Éter Concentrado',
      category: 'pocao',
      rarity: 'raro',
      quantity: 1,
      weightKg: 0.3,
      effectText: 'Restaura +30 PM instantaneamente.',
      description: 'Frasco de cristal azul luminescente que irradia mana pura.',
      valueAmount: 6,
      valueCurrency: 'PRT',
      iconEmoji: '🧪',
    },
    specialistBonusTip: 'Conjuradores arcanos ganham +5 PM temporários ao beber.',
  },
  {
    id: 'rec_tonico_estamina_titã',
    name: 'Tônico de Estamina do Titã',
    category: 'pocao',
    rarity: 'comum',
    description: 'Extrato energizante de casca de carvalho de ferro e noz de cola silvestre.',
    effect: 'Restaura 25 Pontos de Estamina e remove qualquer nível de exaustão leve.',
    ingredients: [
      { name: 'Casca de Carvalho de Ferro', quantity: 2, iconEmoji: '🪵', category: 'erva' },
      { name: 'Mel Silvestre Cristalizado', quantity: 1, iconEmoji: '🍯', category: 'reagente' },
    ],
    coinCost: { amount: 6, currency: 'BRZ' },
    craftDurationMinutes: 10,
    minMasteryLevel: 1,
    isUnlockedDefault: true,
    resultItem: {
      name: 'Tônico de Estamina do Titã',
      category: 'pocao',
      rarity: 'comum',
      quantity: 1,
      weightKg: 0.4,
      effectText: 'Restaura +25 Estamina e alivia exaustão.',
      description: 'Líquido dourado efervescente com gosto encorpado de mel e canela.',
      valueAmount: 10,
      valueCurrency: 'BRZ',
      iconEmoji: '⚡',
    },
    specialistBonusTip: 'Taverneiros e Bárbaros aumentam o efeito em +10 estamina.',
  },
  {
    id: 'rec_antidoto_panaceia',
    name: 'Antídoto Panaceia Universal',
    category: 'pocao',
    rarity: 'incomum',
    description: 'Neutralizador de toxinas formulado por apotecários com esporos purificadores.',
    effect: 'Cura qualquer veneno, paralisia biológica, sangramento ou doença imediatamente.',
    ingredients: [
      { name: 'Esporo de Cogumelo Alvacento', quantity: 2, iconEmoji: '🍄', category: 'erva' },
      { name: 'Carvão Ativado Vegetal', quantity: 2, iconEmoji: '🪨', category: 'reagente' },
    ],
    coinCost: { amount: 10, currency: 'BRZ' },
    craftDurationMinutes: 15,
    minMasteryLevel: 1,
    isUnlockedDefault: true,
    resultItem: {
      name: 'Antídoto Panaceia Universal',
      category: 'pocao',
      rarity: 'incomum',
      quantity: 1,
      weightKg: 0.2,
      effectText: 'Neutraliza venenos, pragas e sangramentos.',
      description: 'Líquido translúcido acinzentado de absorção rápida.',
      valueAmount: 2,
      valueCurrency: 'PRT',
      iconEmoji: '🌿',
    },
    specialistBonusTip: 'Apotecários produzem com 1 dose extra e tempo pela metade.',
  },
  {
    id: 'rec_elixir_mutagenico_forca',
    name: 'Elixir Quimérico de Força de Ogro',
    category: 'elixir',
    rarity: 'epico',
    description: 'Extrato mutagênico instável que engrossa fibras musculares e densifica os ossos.',
    effect: 'Concede +4 em Força (FOR) e vantagem em testes de impacto e quebra de portas por 1 hora.',
    ingredients: [
      { name: 'Coração de Fera Abissal', quantity: 1, iconEmoji: '🫀', category: 'essencia' },
      { name: 'Mercúrio Alquímico Purificado', quantity: 2, iconEmoji: '⚗️', category: 'reagente' },
      { name: 'Extrato de Pimenta-Dragão', quantity: 2, iconEmoji: '🌶️', category: 'erva' },
    ],
    coinCost: { amount: 1, currency: 'ORO' },
    craftDurationMinutes: 45,
    minMasteryLevel: 3,
    isUnlockedDefault: true,
    resultItem: {
      name: 'Elixir Quimérico de Força de Ogro',
      category: 'pocao',
      rarity: 'epico',
      quantity: 1,
      weightKg: 0.4,
      effectText: '+4 FOR e vantagem física por 1 hora.',
      description: 'Elixir pulsante violeta e escarlate de alta volatilidade.',
      valueAmount: 2,
      valueCurrency: 'ORO',
      iconEmoji: '🧪',
    },
    specialistBonusTip: 'Alquimistas Quiméricos não sofrem efeitos colaterais de cansaço após o efeito.',
  },
  {
    id: 'rec_transmutacao_prata',
    name: 'Transmutação Alquímica: Chumbo em Prata',
    category: 'transmutacao',
    rarity: 'raro',
    description: 'O milagre hermético de reorganizar elétrons e éter para transmutar bronze e escória mineral em moedas puras de prata.',
    effect: 'Converte 150 Moedas de Bronze (BRZ) + Catalisador em 20 Moedas de Prata (PRT) líquidas (lucro de +50 BRZ em valor!).',
    ingredients: [
      { name: 'Pó Catalisador da Pedra Filosofal', quantity: 1, iconEmoji: '🔴', category: 'catalisador' },
      { name: 'Minério de Chumbo Puro', quantity: 2, iconEmoji: '🪙', category: 'metal' },
    ],
    coinCost: { amount: 150, currency: 'BRZ' },
    craftDurationMinutes: 60,
    minMasteryLevel: 3,
    isUnlockedDefault: true,
    resultItem: {
      name: 'Lingote de Prata Alquímica Transmutada (20 PRT)',
      category: 'material',
      rarity: 'raro',
      quantity: 1,
      weightKg: 1.0,
      effectText: 'Pode ser trocado por 20 Moedas de Prata (PRT) no banco ou forjado.',
      description: 'Prata com selo alquímico perfeitamente polida e aceita em qualquer reino.',
      valueAmount: 20,
      valueCurrency: 'PRT',
      iconEmoji: '🪙',
    },
    specialistBonusTip: 'Alquimistas Transmutadores geram +5 Moedas de Prata extras no processo.',
  },
];

export const BLACKSMITH_RECIPES: BlacksmithRecipe[] = [
  {
    id: 'rec_reparo_forja_campo',
    name: 'Manutenção Pesada na Bigorna (Restaurar 100% Durabilidade)',
    category: 'reforco',
    rarity: 'comum',
    description: 'Aquecimento no fole de campo, martelamento de fissuras, têmpera em óleo e afiação precisa na pedra pomes.',
    effect: 'Restaura a durabilidade de qualquer arma ou armadura para 100% de sua integridade máxima.',
    materials: [
      { name: 'Pedaço de Ferro Forjado', quantity: 2, iconEmoji: '🔩', category: 'metal' },
      { name: 'Carvão Mineral de Forja', quantity: 2, iconEmoji: '⬛', category: 'mineral' },
    ],
    coinCost: { amount: 10, currency: 'BRZ' },
    craftDurationMinutes: 15,
    minMasteryLevel: 1,
    durabilityMax: 25,
    resultItem: {
      name: 'Kit de Afiação e Manutenção de Aço',
      category: 'equipamento',
      rarity: 'comum',
      quantity: 1,
      weightKg: 1.0,
      effectText: 'Restaura durabilidade completa de uma arma no inventário.',
      description: 'Piedras de esmeril, óleos minerais e pequenos cravos de aço.',
      valueAmount: 15,
      valueCurrency: 'BRZ',
      iconEmoji: '⚒️',
    },
    blacksmithBonusTip: 'Ferreiros realizam o serviço com 0 moedas gastas usando apenas o carvão e ferro.',
  },
  {
    id: 'rec_reforco_durabilidade_maxima',
    name: 'Têmpera Reforçada (+10 Durabilidade Máxima)',
    category: 'reforco',
    rarity: 'incomum',
    description: 'Dobra e martela o metal em múltiplas camadas, aumentando a resistência estrutural permanente do equipamento.',
    effect: 'Aumenta permanentemente a Durabilidade Máxima da arma em +10 pontos e restaura toda a integridade!',
    materials: [
      { name: 'Lingote de Aço Reforçado', quantity: 2, iconEmoji: '🧱', category: 'metal' },
      { name: 'Pó de Diamante Industrial', quantity: 1, iconEmoji: '💎', category: 'mineral' },
    ],
    coinCost: { amount: 25, currency: 'BRZ' },
    craftDurationMinutes: 30,
    minMasteryLevel: 2,
    durabilityMax: 35,
    resultItem: {
      name: 'Selo de Têmpera Mestra do Ferreiro',
      category: 'material',
      rarity: 'incomum',
      quantity: 1,
      weightKg: 0.5,
      effectText: 'Concede +10 de durabilidade máxima permanente à arma.',
      description: 'Fórmula de liga metálica que protege contra quebra e corrosão.',
      valueAmount: 3,
      valueCurrency: 'PRT',
      iconEmoji: '🛡️',
    },
    blacksmithBonusTip: 'Ferreiro concede +15 de durabilidade máxima em vez de +10.',
  },
  {
    id: 'rec_espada_aco_runico',
    name: 'Forjar: Espada Larga de Aço Rúnico',
    category: 'arma',
    rarity: 'raro',
    description: 'Espada balanceada de dois gumes com canaletas de ressonância e empunhadura em couro curtido.',
    effect: '1d10+3 Dano Cortante. Durabilidade 35/35. Imune a oxidação por ácidos de monstros.',
    materials: [
      { name: 'Lingote de Aço Reforçado', quantity: 3, iconEmoji: '🧱', category: 'metal' },
      { name: 'Cristal de Éter Rúnico', quantity: 1, iconEmoji: '💎', category: 'mineral' },
      { name: 'Tiras de Couro Curtido', quantity: 2, iconEmoji: '🧵', category: 'catalisador' },
    ],
    coinCost: { amount: 5, currency: 'PRT' },
    craftDurationMinutes: 60,
    minMasteryLevel: 2,
    durabilityMax: 35,
    resultItem: {
      name: 'Espada Larga de Aço Rúnico',
      category: 'arma',
      rarity: 'raro',
      quantity: 1,
      weightKg: 3.0,
      equipped: false,
      effectText: '1d10+3 Dano Cortante. Durabilidade 35/35. Imune a oxidação.',
      description: 'Lâmina nobre forjada nas bigornas da Cidadela com têmpera perfeita.',
      valueAmount: 12,
      valueCurrency: 'PRT',
      iconEmoji: '⚔️',
      durability: { current: 35, max: 35 },
    },
    blacksmithBonusTip: 'Ferreiro pode gravar uma runa personalizada que concede +1 no bônus de ataque.',
  },
  {
    id: 'rec_escudo_torre_ferro',
    name: 'Forjar: Escudo Torre Reforçado',
    category: 'armadura',
    rarity: 'incomum',
    description: 'Pavês de ferro e carvalho com suporte de braço acolchoado. Bloqueia flechas e projéteis arcanos.',
    effect: '+3 na Classe de Armadura (CA). Durabilidade 40/40.',
    materials: [
      { name: 'Pedaço de Ferro Forjado', quantity: 4, iconEmoji: '🔩', category: 'metal' },
      { name: 'Casca de Carvalho de Ferro', quantity: 2, iconEmoji: '🪵', category: 'erva' },
    ],
    coinCost: { amount: 2, currency: 'PRT' },
    craftDurationMinutes: 45,
    minMasteryLevel: 1,
    durabilityMax: 40,
    resultItem: {
      name: 'Escudo Torre de Ferro & Carvalho',
      category: 'armadura',
      rarity: 'incomum',
      quantity: 1,
      weightKg: 6.0,
      equipped: false,
      effectText: '+3 na Classe de Armadura (CA). Durabilidade 40/40.',
      description: 'Baluarte sólido capaz de resistir a investidas de bestas enfurecidas.',
      valueAmount: 4,
      valueCurrency: 'PRT',
      iconEmoji: '🛡️',
      durability: { current: 40, max: 40 },
    },
    blacksmithBonusTip: 'Ferreiro e Carpinteiro aumentam a CA para +4.',
  },
];
