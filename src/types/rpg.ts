export type CurrencyType = 'BRZ' | 'PRT' | 'ORO' | 'PLN' | 'CYB';

export interface CurrencyConfig {
  code: CurrencyType;
  name: string;
  unitValueInBRZ: number;
  material: string;
  description: string;
  usageTip: string;
  colorHex: string;
  borderColor: string;
  bgGradient: string;
  glowColor: string;
  textColor: string;
  badgeBg: string;
}

export const CURRENCY_CONFIGS: Record<CurrencyType, CurrencyConfig> = {
  BRZ: {
    code: 'BRZ',
    name: 'Bronze',
    unitValueInBRZ: 1,
    material: 'Bronze Envelhecido',
    description: 'Comum e abundante. A base de qualquer comércio.',
    usageTip: 'Uso comum entre povos, mercadores e cidades.',
    colorHex: '#cd7f32',
    borderColor: 'border-amber-700/80',
    bgGradient: 'from-amber-950 via-amber-900 to-yellow-950',
    glowColor: 'rgba(205, 127, 50, 0.4)',
    textColor: 'text-amber-400',
    badgeBg: 'bg-amber-950/60',
  },
  PRT: {
    code: 'PRT',
    name: 'Prata',
    unitValueInBRZ: 10,
    material: 'Prata Polida',
    description: 'Valiosa e confiável. Símbolo de conquista e trabalho.',
    usageTip: 'Aceita em quase todo o continente. Muito usada em trocas e contratos.',
    colorHex: '#e2e8f0',
    borderColor: 'border-slate-400/80',
    bgGradient: 'from-slate-900 via-slate-800 to-zinc-900',
    glowColor: 'rgba(226, 232, 240, 0.4)',
    textColor: 'text-slate-200',
    badgeBg: 'bg-slate-800/60',
  },
  ORO: {
    code: 'ORO',
    name: 'Ouro',
    unitValueInBRZ: 100,
    material: 'Ouro Puro',
    description: 'Rara e poderosa. Representa riqueza e influência.',
    usageTip: 'Reservada para grandes transações. Símbolo de status e poder.',
    colorHex: '#eab308',
    borderColor: 'border-yellow-500/80',
    bgGradient: 'from-amber-950 via-yellow-900 to-amber-900',
    glowColor: 'rgba(234, 179, 8, 0.5)',
    textColor: 'text-yellow-400',
    badgeBg: 'bg-yellow-950/60',
  },
  PLN: {
    code: 'PLN',
    name: 'Platina',
    unitValueInBRZ: 1000,
    material: 'Platina Pura',
    description: 'Extremamente rara. Usada por reis, impérios e lendas.',
    usageTip: 'Usada em alianças, guerras e relíquias. Aceita por todas as grandes casas.',
    colorHex: '#c7d2fe',
    borderColor: 'border-indigo-400/80',
    bgGradient: 'from-slate-900 via-indigo-950 to-slate-950',
    glowColor: 'rgba(199, 210, 254, 0.45)',
    textColor: 'text-indigo-200',
    badgeBg: 'bg-indigo-950/60',
  },
  CYB: {
    code: 'CYB',
    name: 'Cybermoedas',
    unitValueInBRZ: 5000,
    material: 'Núcleo Tecnomágico',
    description: 'Moeda digital do futuro. Tecnologia e magia em perfeita sintonia.',
    usageTip: 'Ideal para sistemas tecnológicos, portais, contratos digitais e missões cibernéticas.',
    colorHex: '#06b6d4',
    borderColor: 'border-cyan-400/90',
    bgGradient: 'from-cyan-950 via-slate-900 to-sky-950',
    glowColor: 'rgba(6, 182, 212, 0.6)',
    textColor: 'text-cyan-300',
    badgeBg: 'bg-cyan-950/60',
  },
};

export interface Wallet {
  BRZ: number;
  PRT: number;
  ORO: number;
  PLN: number;
  CYB: number;
}

export function calculateTotalNetWorthInBRZ(wallet: Wallet): number {
  return (
    (wallet.BRZ || 0) * CURRENCY_CONFIGS.BRZ.unitValueInBRZ +
    (wallet.PRT || 0) * CURRENCY_CONFIGS.PRT.unitValueInBRZ +
    (wallet.ORO || 0) * CURRENCY_CONFIGS.ORO.unitValueInBRZ +
    (wallet.PLN || 0) * CURRENCY_CONFIGS.PLN.unitValueInBRZ +
    (wallet.CYB || 0) * CURRENCY_CONFIGS.CYB.unitValueInBRZ
  );
}

export interface SpellCard {
  id: string;
  name: string;
  classification: string; // "Classificação" e.g. "Grau III - Arcano", "Runa Antiga", "Tecnomagia Nível 2"
  magicCost: string; // "Custo de Magia" e.g. "15 PM"
  type: string; // "Tipo" e.g. "Evocação Abissal", "Defesa Cinética"
  range: string; // "Alcance" e.g. "18 metros", "Toque", "Pessoal"
  useLimit: string; // "Limite de Uso" e.g. "2x por descanso curto", "À vontade"
  description: string; // "Descrição"
  effects: string; // "Efeitos"
  notes: string; // "Observações"
  iconEmoji?: string;
}

export type ItemCategory = 'arma' | 'armadura' | 'pocao' | 'reliquia' | 'cyber' | 'equipamento' | 'geral';

export type ItemRarity = 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario' | 'abissal';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  category: ItemCategory;
  rarity?: ItemRarity;
  weight?: string;
  weightKg?: number;
  equipped?: boolean;
  effectText?: string;
  description: string;
  valueAmount: number;
  valueCurrency: CurrencyType;
  iconEmoji?: string;
}

export interface CharacterSheet {
  id: string;
  campaignCode: string;
  name: string;
  title: string; // e.g. "Guardião do Abismo", "Tecnomago Fugitivo"
  characterClass: string;
  race: string;
  originRegion?: string; // Região de origem (ex: 'floresta_verdancia', 'montanhas_gelo', etc.)
  primaryLanguage?: string; // Idioma materno baseado na região de origem
  knownLanguages?: string[]; // Lista completa de idiomas falados e compreendidos
  currentLocation?: string; // Posição atual no mapa (ex: 'Vila Serena', 'Caeldrin', etc.)
  level: number;
  experience: number;
  unspentAttributePoints?: number; // Pontos de atributos ganhos ao subir de nível
  starsLevel: number; // 1 to 7 as seen in the bottom bar of Image 2
  avatarUrl?: string;
  hp: {
    current: number;
    max: number;
    temp?: number;
  };
  mana: {
    current: number;
    max: number;
  };
  stamina: {
    current: number;
    max: number;
  };
  armorClass: number; // Defesa / CA
  speed: string; // Deslocamento
  initiative: number;
  // Attributes (FOR, DES, CON, INT, SAB, CAR)
  attributes: {
    FOR: number; // Força
    DES: number; // Destreza
    CON: number; // Constituição
    INT: number; // Inteligência
    SAB: number; // Sabedoria / Percepção
    CAR: number; // Carisma / Sintonia Tecnomágica
  };
  // 6 Special Traits / Slots from the bar in Image 2
  traits: {
    label: string;
    value: string;
  }[];
  skillsList: string[];
  abilities: SpellCard[];
  inventory: InventoryItem[];
  wallet: Wallet;
  notes: string;
  isMaster: boolean;
  isOnline: boolean;
  lastActive: number;
}

export interface Transaction {
  id: string;
  campaignCode: string;
  senderId: string; // character id or 'gm'
  senderName: string;
  receiverId: string; // character id or 'gm'
  receiverName: string;
  amount: number;
  currency: CurrencyType;
  reason: string;
  type: 'player_to_gm' | 'gm_to_player' | 'player_to_player' | 'exchange' | 'shop_purchase' | 'toll_fee';
  status: 'confirmed' | 'pending' | 'rejected';
  timestamp: number;
}

export interface ShopItem {
  id: string;
  name: string;
  category: ItemCategory;
  rarity?: ItemRarity;
  weightKg?: number;
  effectText?: string;
  description: string;
  price: number;
  currency: CurrencyType;
  stock?: number;
  icon: string;
}

export interface CampaignRoom {
  code: string;
  name: string;
  gmName: string;
  description: string;
  createdAt: number;
  startingWallet: Wallet;
  gmWallet: Wallet;
  players: CharacterSheet[];
  transactions: Transaction[];
  marketItems: ShopItem[];
  paymentRequests: PaymentRequest[];
}

export interface PaymentRequest {
  id: string;
  campaignCode: string;
  targetCharacterId: string; // 'all' or specific character ID
  targetName: string;
  amount: number;
  currency: CurrencyType;
  reason: string;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: number;
}

/**
 * Retorna o montante de EXP necessário para avançar do nível atual para o próximo.
 * Ex: Nível 1 precisa de 100 EXP; Nível 2 precisa de 200 EXP; etc.
 */
export function getExpForNextLevel(level: number): number {
  return Math.max(100, (level || 1) * 100);
}

export interface PlayableRace {
  id: string;
  name: string;
  category: 'Comum' | 'Élfica' | 'Anã & Pequena' | 'Planar & Abissal' | 'Tecnológica & Fera';
  description: string;
  traits: string;
}

export const PLAYABLE_RACES: PlayableRace[] = [
  { id: 'humano', name: 'Humano', category: 'Comum', description: 'Versátil, determinado e adaptável a qualquer ambiente.', traits: '+1 em todos atributos ou perícia extra' },
  { id: 'alto_elfo', name: 'Alto Elfo', category: 'Élfica', description: 'Nobre, gracioso e naturalmente sintonizado com o éter arcano.', traits: 'Visão no Escuro, Truque Mágico inicial' },
  { id: 'elfo_silvestre', name: 'Elfo Silvestre', category: 'Élfica', description: 'Ágil caçador dos ermos, veloz e furtivo na vegetação.', traits: 'Deslocamento aprimorado (10.5m), Furtividade' },
  { id: 'elfo_negro', name: 'Elfo Negro (Drow)', category: 'Élfica', description: 'Habitante do subterrâneo com maestria em feitiços sombrios.', traits: 'Visão no Escuro Superior (36m), Magia Drow' },
  { id: 'meio_elfo', name: 'Meio-Elfo', category: 'Élfica', description: 'Combina a diplomacia humana com a elegância élfica.', traits: 'Carisma magnético, Versatilidade em Perícias' },
  { id: 'anao_colina', name: 'Anão Forjador da Colina', category: 'Anã & Pequena', description: 'Resiliente, artesão de runas e com vitalidade sem igual.', traits: 'Vigor Anão (+1 PV extra por nível), Res. Veneno' },
  { id: 'anao_montanha', name: 'Anão da Montanha', category: 'Anã & Pequena', description: 'Robusto e acostumado a carregar armaduras pesadas e martelos.', traits: 'Treinamento em Armaduras Pesadas, Força Bruta' },
  { id: 'halfling', name: 'Pequenino (Halfling)', category: 'Anã & Pequena', description: 'Pequeno de estatura, grande de espírito e abençoado com sorte.', traits: 'Sorte (rerrola 1 natural em d20), Bravura' },
  { id: 'gnomo_profundo', name: 'Gnomo das Profundezas (Svirfneblin)', category: 'Anã & Pequena', description: 'Engenhoso minerador de gemas arcanas e pedras rúnicas.', traits: 'Camuflagem Rochosa, Astúcia Gnômica' },
  { id: 'draconato', name: 'Draconato (Dragonborn)', category: 'Planar & Abissal', description: 'Herdeiro de dragões antigos com escamas duras e sopro elemental.', traits: 'Ataque de Sopro Elemental, Resistência a Dano' },
  { id: 'tiefling', name: 'Tiefling', category: 'Planar & Abissal', description: 'Traz o sangue dos planos infernais, chifres e fogo interior.', traits: 'Resistência a Fogo, Taumaturgia / Magia Infernal' },
  { id: 'aasimar', name: 'Aasimar', category: 'Planar & Abissal', description: 'Tocado pelos planos celestiais, emissário de luz e virtude.', traits: 'Mãos Curativas, Asas Astrais ou Olhar Radiante' },
  { id: 'meio_orc', name: 'Meio-Orc', category: 'Comum', description: 'Guerreiro de vigor indomável e fúria primal temida em batalha.', traits: 'Resistência Implacável (cair a 1 PV), Crítico Selvagem' },
  { id: 'golias', name: 'Golias (Meio-Gigante)', category: 'Comum', description: 'Nascido nos picos gelados, suporta os maiores impactos.', traits: 'Resistência de Pedra (-1d12 dano), Porte Robusto' },
  { id: 'tabaxi', name: 'Tabaxi (Felino Ágil)', category: 'Tecnológica & Fera', description: 'Ágil predador felino, curioso e veloz como um raio.', traits: 'Arrancada Felina (dobra velocidade), Garras Retráteis' },
  { id: 'kenku', name: 'Kenku (Pássaro Soturno)', category: 'Tecnológica & Fera', description: 'Mestre da mímica sonora, falsificação e astúcia urbana.', traits: 'Mímica Perfeita, Falsificação Hábil' },
  { id: 'warforged', name: 'Warforged (Autômato Forjado)', category: 'Tecnológica & Fera', description: 'Criado de metal e madeira viva, imune a cansaço comum.', traits: 'Proteção Integrada (+1 CA), Sem necessidade de dormir' },
  { id: 'cyborg', name: 'Cyborg Tecnomágico', category: 'Tecnológica & Fera', description: 'Fusão cibernética com tecnologia arcana do Abismo.', traits: 'Interface Neural (+Iniciativa), Blindagem de Liga' },
  { id: 'mutante_abismo', name: 'Mutante da Fenda Abissal', category: 'Planar & Abissal', description: 'Marcado pelas radiações da fenda, instável e letal.', traits: 'Adaptação ao Vazio, Resistência a Necrótico' },
  { id: 'changeling', name: 'Changeling (Metamorfo)', category: 'Planar & Abissal', description: 'Capaz de alterar sua fisionomia e voz num piscar de olhos.', traits: 'Metamorfose Física Instantânea, Instintos Sociais' },
];

export type ExternalActionType =
  | 'monster_attack'
  | 'potion_hp'
  | 'potion_mana'
  | 'heal_spell'
  | 'mana_spell'
  | 'poison_burn_dot'
  | 'environmental_trap'
  | 'short_rest'
  | 'long_rest'
  | 'custom_damage'
  | 'custom_recovery';

export interface ExternalActionPayload {
  actionType: ExternalActionType;
  sourceName: string;
  amount: number;
  details?: string;
  targetVitals?: 'hp' | 'mana' | 'both';
  damageType?: string;
  multiplier?: number; // 1 = normal, 2 = crítico, 0.5 = resistência / metade
  diceFormula?: string;
}

export interface ExternalActionRecord {
  id: string;
  campaignCode: string;
  characterId: string;
  characterName: string;
  actionType: ExternalActionType;
  sourceName: string;
  amount: number;
  details?: string;
  targetVitals?: 'hp' | 'mana' | 'both';
  damageType?: string;
  multiplier?: number;
  timestamp: number;
}

export type ClassCategory =
  | 'Marcial & Tanque'
  | 'Conjurador Arcano'
  | 'Divino & Espiritual'
  | 'Especialista & Furtivo'
  | 'Cibernético & Tecnomágico';

export interface PlayableClass {
  id: string;
  name: string;
  category: ClassCategory;
  description: string;
  primaryAttribute: 'FOR' | 'DES' | 'CON' | 'INT' | 'SAB' | 'CAR';
  hitDie: string;
  baseHpBonus: number;
  keyFeature: string;
  startingSkills: string[];
  icon: string;
}

export const PLAYABLE_CLASSES: PlayableClass[] = [
  // Marciais & Tanques
  {
    id: 'guerreiro_runico',
    name: 'Guerreiro Rúnico',
    category: 'Marcial & Tanque',
    description: 'Mestre da forja rúnica e armas pesadas. Grava símbolos místicos em sua lâmina para desferir golpes devastadores.',
    primaryAttribute: 'FOR',
    hitDie: '1d10',
    baseHpBonus: 5,
    keyFeature: 'Golpe Entalhado Rúnico & Segundo Fôlego',
    startingSkills: ['Atletismo', 'Intimidação', 'Forja Arcana'],
    icon: '⚔️',
  },
  {
    id: 'paladino_platina',
    name: 'Paladino de Platina',
    category: 'Marcial & Tanque',
    description: 'Jurado à ordem da luz sagrada de Eldria. Empunha escudo impenetrável e canaliza punições divinas purificadoras.',
    primaryAttribute: 'CAR',
    hitDie: '1d10',
    baseHpBonus: 6,
    keyFeature: 'Destruição Sagrada & Imposição das Mãos',
    startingSkills: ['Religião', 'Persuasão', 'Atletismo'],
    icon: '🛡️',
  },
  {
    id: 'barbaro_fenda',
    name: 'Bárbaro da Fenda',
    category: 'Marcial & Tanque',
    description: 'Nascido nos limites das terras hostis. Canaliza fúria selvagem primordial que ignora ferimentos mortais.',
    primaryAttribute: 'CON',
    hitDie: '1d12',
    baseHpBonus: 8,
    keyFeature: 'Fúria Abissal & Defesa sem Armadura',
    startingSkills: ['Sobrevivência', 'Intimidação', 'Atletismo'],
    icon: '🪓',
  },
  {
    id: 'cavaleiro_sombrio',
    name: 'Cavaleiro das Sombras',
    category: 'Marcial & Tanque',
    description: 'Guerreiro de armadura negra forjada nas profundezas da Cidadela. Converte a dor recebida em ondas de energia necrótica.',
    primaryAttribute: 'CON',
    hitDie: '1d10',
    baseHpBonus: 5,
    keyFeature: 'Aura da Agonia & Dreno Vital',
    startingSkills: ['Intimidação', 'Percepção', 'Enganação'],
    icon: '🖤',
  },
  {
    id: 'gladiador_sangue',
    name: 'Gladiador de Sangue',
    category: 'Marcial & Tanque',
    description: 'Veterano das arenas das Terras Áridas. Especialista em quebra de guarda, contra-ataques precisos e intimidação brutal.',
    primaryAttribute: 'FOR',
    hitDie: '1d10',
    baseHpBonus: 4,
    keyFeature: 'Golpe Crítico Sangrento & Postura Ofensiva',
    startingSkills: ['Acrobacia', 'Atletismo', 'Performance'],
    icon: '🗡️',
  },
  {
    id: 'sentinela_guardiao',
    name: 'Sentinela Guardião',
    category: 'Marcial & Tanque',
    description: 'Especialista em defesa cooperativa e baluartes impenetráveis. Intercepta ataques dirigidos aos aliados mais vulneráveis.',
    primaryAttribute: 'CON',
    hitDie: '1d10',
    baseHpBonus: 7,
    keyFeature: 'Intervenção Protetora & Reduto Inquebrável',
    startingSkills: ['Percepção', 'Atletismo', 'Intuição'],
    icon: '🔰',
  },

  // Conjuradores Arcanos
  {
    id: 'tecnomago_abismo',
    name: 'Tecnomago do Abismo',
    category: 'Conjurador Arcano',
    description: 'Pioneiro na fusão de fórmulas mágicas antigas com matrizes quânticas do Domínio Cibernético.',
    primaryAttribute: 'INT',
    hitDie: '1d6',
    baseHpBonus: 2,
    keyFeature: 'Sobrecarga de Éter & Sintonia com Matriz',
    startingSkills: ['Arcanismo', 'História', 'Investigação'],
    icon: '⚡',
  },
  {
    id: 'mago_arcano',
    name: 'Mago Arcano da Academia',
    category: 'Conjurador Arcano',
    description: 'Erudito graduado em Caeldrin. Decodifica pergaminhos ancestrais e molda a realidade com encantamentos elementais complexos.',
    primaryAttribute: 'INT',
    hitDie: '1d6',
    baseHpBonus: 2,
    keyFeature: 'Recuperação Arcana & Livro de Rituais',
    startingSkills: ['Arcanismo', 'História', 'Percepção'],
    icon: '📜',
  },
  {
    id: 'feiticeiro_igneo',
    name: 'Feiticeiro das Chamas Eternas',
    category: 'Conjurador Arcano',
    description: 'Carrega em seu sangue a centelha primordial das Terras Ígneas. Dispara jatos de fogo sem necessidade de grimórios.',
    primaryAttribute: 'CAR',
    hitDie: '1d6',
    baseHpBonus: 3,
    keyFeature: 'Metamagia Incandescente & Alma Calcinada',
    startingSkills: ['Arcanismo', 'Enganação', 'Intimidação'],
    icon: '🔥',
  },
  {
    id: 'bruxo_pacto',
    name: 'Bruxo do Pacto do Abismo',
    category: 'Conjurador Arcano',
    description: 'Firmou um contrato místico com entidades das profundezas. Canaliza rajadas místicas arrojadas e patronos arcanos.',
    primaryAttribute: 'CAR',
    hitDie: '1d8',
    baseHpBonus: 3,
    keyFeature: 'Rajada Mística & Magia de Pacto Rápida',
    startingSkills: ['Arcanismo', 'Enganação', 'Religião'],
    icon: '👁️',
  },
  {
    id: 'magmante_vulkar',
    name: 'Magmante de Vulkar',
    category: 'Conjurador Arcano',
    description: 'Forjado nos arredores da Cidade de Vulkar. Manipula rocha derretida e escudos de obsidiana para defesa e destruição.',
    primaryAttribute: 'INT',
    hitDie: '1d8',
    baseHpBonus: 4,
    keyFeature: 'Fissura de Magma & Casca de Obsidiana',
    startingSkills: ['Arcanismo', 'Natureza', 'Sobrevivência'],
    icon: '🌋',
  },
  {
    id: 'cronomante_ilusionista',
    name: 'Cronomante & Ilusionista',
    category: 'Conjurador Arcano',
    description: 'Distorce os fluxos temporais e projeta miragens desconcertantes que confundem os sentidos dos oponentes.',
    primaryAttribute: 'INT',
    hitDie: '1d6',
    baseHpBonus: 2,
    keyFeature: 'Aceleração Temporal & Miragem Hipnótica',
    startingSkills: ['Arcanismo', 'Enganação', 'Furtividade'],
    icon: '⏳',
  },

  // Divinos & Espirituais
  {
    id: 'clerigo_astral',
    name: 'Clérigo Astral',
    category: 'Divino & Espiritual',
    description: 'Canalizador da luz das constelações de Eldria. Emissário da cura milagrosa, ressurreição e proteção celestial.',
    primaryAttribute: 'SAB',
    hitDie: '1d8',
    baseHpBonus: 4,
    keyFeature: 'Canalizar Divindade & Bênção do Alvorecer',
    startingSkills: ['Medicina', 'Religião', 'Persuasão'],
    icon: '✨',
  },
  {
    id: 'druida_floresta',
    name: 'Druida de Verdância',
    category: 'Divino & Espiritual',
    description: 'Guardião dos bosques antigos e da Árvore Ancestral. Metamorfoseia-se em feras temíveis e comanda as vinhas e tempestades.',
    primaryAttribute: 'SAB',
    hitDie: '1d8',
    baseHpBonus: 4,
    keyFeature: 'Forma Selvagem & Comunhão com a Vida',
    startingSkills: ['Natureza', 'Sobrevivência', 'Medicina'],
    icon: '🍃',
  },
  {
    id: 'xama_ventos_gelo',
    name: 'Xamã dos Ventos Glaciais',
    category: 'Divino & Espiritual',
    description: 'Sacerdote tribal das Montanhas de Gelo. Evoca os espíritos ancestrais das neves e rajadas de granizo cortantes.',
    primaryAttribute: 'SAB',
    hitDie: '1d8',
    baseHpBonus: 4,
    keyFeature: 'Tótem dos Ancestrais & Nevasca Espiritual',
    startingSkills: ['Sobrevivência', 'Percepção', 'Medicina'],
    icon: '❄️',
  },
  {
    id: 'monge_harmonia',
    name: 'Monge da Harmonia Interior',
    category: 'Divino & Espiritual',
    description: 'Adepto dos mosteiros silenciosos. Domina a energia vital (Ki), desferindo rajadas de golpes desarmados ultra-velozes.',
    primaryAttribute: 'DES',
    hitDie: '1d8',
    baseHpBonus: 3,
    keyFeature: 'Golpes Desarmados Velozes & Passo do Vento',
    startingSkills: ['Acrobacia', 'Atletismo', 'Furtividade'],
    icon: '🥋',
  },

  // Especialistas & Furtivos
  {
    id: 'ladino_sombras',
    name: 'Ladino das Sombras',
    category: 'Especialista & Furtivo',
    description: 'Mestre da infiltração, venenos e arrombamento de cofres arcanos. Ataca nos pontos vitais quando o inimigo menos espera.',
    primaryAttribute: 'DES',
    hitDie: '1d8',
    baseHpBonus: 3,
    keyFeature: 'Ataque Furtivo Mortal & Esquiva Sobrenatural',
    startingSkills: ['Furtividade', 'Prestidigitação', 'Investigação'],
    icon: '🗝️',
  },
  {
    id: 'ranger_cacador',
    name: 'Ranger Caçador dos Ermos',
    category: 'Especialista & Furtivo',
    description: 'Rastreador experiente que vigia as fronteiras selvagens. Arqueiro letal e companheiro leal de animais selvagens.',
    primaryAttribute: 'DES',
    hitDie: '1d10',
    baseHpBonus: 4,
    keyFeature: 'Marca da Presa & Disparo Certeiro à Distância',
    startingSkills: ['Sobrevivência', 'Percepção', 'Furtividade'],
    icon: '🏹',
  },
  {
    id: 'bardo_encantador',
    name: 'Bardo Encantador',
    category: 'Especialista & Furtivo',
    description: 'Cronista errante, músico e diplomata. Inspira companheiros em combate com canções míticas e desarma conflitos com carisma.',
    primaryAttribute: 'CAR',
    hitDie: '1d8',
    baseHpBonus: 3,
    keyFeature: 'Inspiração Bárdica & Faz-Tudo em Perícias',
    startingSkills: ['Performance', 'Persuasão', 'Enganação'],
    icon: '🪕',
  },
  {
    id: 'atirador_elite',
    name: 'Atirador de Elite / Pistoleiro',
    category: 'Especialista & Furtivo',
    description: 'Armado com armas de fogo rúnicas e mosquetes de precisão. Neutraliza ameaças antes mesmo que possam se aproximar.',
    primaryAttribute: 'DES',
    hitDie: '1d8',
    baseHpBonus: 3,
    keyFeature: 'Munição Rúnica Especial & Tiro Teleguiado',
    startingSkills: ['Percepção', 'Furtividade', 'Investigação'],
    icon: '🎯',
  },
  {
    id: 'assassino_noturno',
    name: 'Assassino Noturno',
    category: 'Especialista & Furtivo',
    description: 'Treinado em guildas clandestinas da Cidadela e Caeldrin. Especialista em eliminação rápida, lâminas envenenadas e disfarces.',
    primaryAttribute: 'DES',
    hitDie: '1d8',
    baseHpBonus: 3,
    keyFeature: 'Emboscada Fatal & Venenos Concentrados',
    startingSkills: ['Furtividade', 'Enganação', 'Prestidigitação'],
    icon: '🌑',
  },

  // Cibernéticos & Tecnomágicos
  {
    id: 'ciborgue_guerreiro',
    name: 'Ciborgue Guerreiro Aumentado',
    category: 'Cibernético & Tecnomágico',
    description: 'Corpo reforçado por ligas de titânio e servomotores hidráulicos. Força física ampliada e resistência a danos balísticos.',
    primaryAttribute: 'CON',
    hitDie: '1d10',
    baseHpBonus: 6,
    keyFeature: 'Chassi Reforçado & Pulso Cibernético',
    startingSkills: ['Atletismo', 'Tecnologia', 'Intimidação'],
    icon: '🦾',
  },
  {
    id: 'hacker_neural',
    name: 'Hacker Neural / Netrunner',
    category: 'Cibernético & Tecnomágico',
    description: 'Opera a Sub-Rede Ômega do Domínio Cibernético. Invade sistemas arcanos e dispositivos inimigos com sobrecargas de código.',
    primaryAttribute: 'INT',
    hitDie: '1d6',
    baseHpBonus: 2,
    keyFeature: 'Invasão Remota de Frequência & Pane em Drones',
    startingSkills: ['Tecnologia', 'Investigação', 'Arcanismo'],
    icon: '💻',
  },
  {
    id: 'artifice_mecatronico',
    name: 'Artífice Mecatrônico',
    category: 'Cibernético & Tecnomágico',
    description: 'Inventor genial das Fábricas Hexa. Constrói torretas automatizadas, autômatos de apoio e armaduras tecnomágicas portáteis.',
    primaryAttribute: 'INT',
    hitDie: '1d8',
    baseHpBonus: 4,
    keyFeature: 'Autômato de Apoio & Forja Nanotecnológica',
    startingSkills: ['Tecnologia', 'Arcanismo', 'Investigação'],
    icon: '⚙️',
  },
];

export interface PointOfInterest {
  id: string;
  name: string;
  type: 'capital' | 'fortress' | 'dungeon' | 'ruins' | 'tower' | 'port' | 'sanctuary' | 'nature';
  coords: string;
  title: string;
  description: string;
  dangerLevel?: string;
}

export interface OriginRegionInfo {
  id: string;
  number: number;
  name: string;
  subtitle: string;
  language: string;
  alphabet: string;
  symbol: string;
  colorHex: string;
  badgeBg: string;
  lore: string;
  culturalTrait: string;
  bonusAttribute: 'FOR' | 'DES' | 'CON' | 'INT' | 'SAB' | 'CAR';
  mapGrid: string;
  pointsOfInterest: PointOfInterest[];
  runicAlphabetName: string;
  imageUrl?: string;
}


