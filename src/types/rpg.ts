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
  damage?: string;
  tier?: string;
  category?: string;
}

export type ItemCategory = 'arma' | 'armadura' | 'pocao' | 'material' | 'reliquia' | 'cyber' | 'equipamento' | 'geral' | 'chave';

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
  durability?: {
    current: number;
    max: number;
  };
}

export type DiaryCategory = 'sessao' | 'evento' | 'lore' | 'revelacao' | 'pacto';

export interface CampaignDiaryEntry {
  id: string;
  title: string;
  content: string;
  category: DiaryCategory;
  sessionNumber?: number;
  inGameDate?: string;
  locationTag?: string;
  isPinned?: boolean;
  authorName?: string;
  timestamp: number;
}

export type ChronicleCategory = 'nivel' | 'item' | 'mapa' | 'forja' | 'mestre' | 'geral';

export interface CampaignChronicleEvent {
  id: string;
  type: 'level_up' | 'valuable_item' | 'map_change' | 'craft_forge' | 'master_note';
  category: ChronicleCategory;
  title: string;
  description: string;
  characterName?: string;
  characterId?: string;
  itemName?: string;
  itemRarity?: ItemRarity;
  locationName?: string;
  levelReached?: number;
  importance: 'normal' | 'notavel' | 'epico' | 'lendario';
  iconEmoji?: string;
  author?: string;
  timestamp: number;
}

export type RoomColorScheme = 'abismo_purpura' | 'forja_dourada' | 'ruinas_elficas';

export interface ColorSchemeConfig {
  id: RoomColorScheme;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  primaryColorHex: string;
  badgeBg: string;
  borderClass: string;
  glowClass: string;
  bgGradient: string;
}

export const ROOM_COLOR_SCHEMES: Record<RoomColorScheme, ColorSchemeConfig> = {
  abismo_purpura: {
    id: 'abismo_purpura',
    name: 'Abismo Púrpura',
    subtitle: 'Violeta Arcano & Éter Cósmico',
    description: 'Esquema clássico de Eldria: sombras púrpuras, glifos arcanos e detalhes em âmbar.',
    icon: '🔮',
    primaryColorHex: '#a855f7',
    badgeBg: 'bg-purple-950/80',
    borderClass: 'border-purple-600/60',
    glowClass: 'shadow-purple-950/70 ring-purple-500/30',
    bgGradient: 'from-[#120824] via-[#08050e] to-[#180a29]',
  },
  forja_dourada: {
    id: 'forja_dourada',
    name: 'Forja Dourada',
    subtitle: 'Chamas da Bigorna & Ouro Puro',
    description: 'Esquema de calor metálico: carvão incandescente, brasas douradas e ligas de bronze nobre.',
    icon: '⚒️',
    primaryColorHex: '#f59e0b',
    badgeBg: 'bg-amber-950/80',
    borderClass: 'border-amber-600/70',
    glowClass: 'shadow-amber-950/80 ring-amber-500/40',
    bgGradient: 'from-[#221004] via-[#0e0702] to-[#2a1406]',
  },
  ruinas_elficas: {
    id: 'ruinas_elficas',
    name: 'Ruínas Élficas',
    subtitle: 'Musgo Esmeralda & Luz Astral',
    description: 'Esquema dos bosques ancestrais de Verdância: pedras cobertas de hera, jade luminoso e névoa viva.',
    icon: '🍃',
    primaryColorHex: '#10b981',
    badgeBg: 'bg-emerald-950/80',
    borderClass: 'border-emerald-600/70',
    glowClass: 'shadow-emerald-950/80 ring-emerald-500/40',
    bgGradient: 'from-[#071d15] via-[#030d0a] to-[#0a261c]',
  },
};

export type AdventureNoteCategory = 'local' | 'npc' | 'objetivo' | 'geral';

export interface AdventureNote {
  id: string;
  category: AdventureNoteCategory; // 'local' (Locais de Campanha), 'npc' (NPCs / Aliados / Rivais), 'objetivo' (Missões e Metas), 'geral' (Anotações Gerais)
  title: string;
  content: string;
  locationTag?: string; // e.g. "Caeldrin", "Vila Serena", "Abismo Profundo"
  completed?: boolean; // Para objetivos/missões cumpridas
  timestamp: number;
}

export interface CharacterSheet {
  id: string;
  campaignCode: string;
  name: string;
  title: string; // e.g. "Guardião do Abismo", "Tecnomago Fugitivo"
  characterClass: string;
  race: string;
  gender?: string; // Sexo / Gênero do personagem (ex: 'Masculino', 'Feminino', 'Outro', etc.)
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
  fightingStyle?: string;
  fightingStyleDesc?: string;
  skillsList: string[];
  abilities: SpellCard[];
  inventory: InventoryItem[];
  maxCarryWeight?: number; // Limite de peso/capacidade de carga configurado (em kg)
  carryCapacity?: number; // Alias para capacidade de carga configurada
  wallet: Wallet;
  notes: string;
  adventureNotes?: AdventureNote[]; // Notas de Aventura (Locais, NPCs, Objetivos e Gerais)
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

export interface LevelProgressionConfig {
  xpRequiredPerLevel: Record<number, number>; // level -> XP needed to reach next level
  inventoryCapacityPerLevel: Record<number, number>; // level -> bonus inventory capacity in kg
}

export const DEFAULT_XP_PER_LEVEL: Record<number, number> = {
  1: 100,
  2: 200,
  3: 300,
  4: 400,
  5: 500,
  6: 600,
  7: 700,
  8: 800,
  9: 900,
  10: 1000,
  11: 1200,
  12: 1400,
  13: 1600,
  14: 1800,
  15: 2000,
  16: 2500,
  17: 3000,
  18: 3500,
  19: 4000,
  20: 5000,
};

export const DEFAULT_INVENTORY_BONUS_PER_LEVEL: Record<number, number> = {
  1: 0,
  2: 2,
  3: 4,
  4: 6,
  5: 8,
  6: 10,
  7: 12,
  8: 14,
  9: 16,
  10: 18,
  11: 20,
  12: 22,
  13: 24,
  14: 26,
  15: 28,
  16: 30,
  17: 32,
  18: 34,
  19: 36,
  20: 40,
};

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
  levelProgressionConfig?: LevelProgressionConfig;
  diaryEntries?: CampaignDiaryEntry[];
  masterDiaryNotes?: string;
  chronicles?: CampaignChronicleEvent[];
  colorScheme?: RoomColorScheme;
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
 * Se houver uma tabela customizada definida pelo Mestre, utiliza-a; caso contrário, recorre ao padrão.
 */
export function getExpForNextLevel(level: number, customTable?: Record<number, number>): number {
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)));
  if (customTable && typeof customTable[safeLevel] === 'number' && customTable[safeLevel] > 0) {
    return customTable[safeLevel];
  }
  return DEFAULT_XP_PER_LEVEL[safeLevel] || safeLevel * 100;
}

/**
 * Retorna o bônus de espaço de mochila em kg correspondente ao nível do personagem.
 */
export function getInventoryLevelBonus(level: number, customTable?: Record<number, number>): number {
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)));
  if (customTable && typeof customTable[safeLevel] === 'number') {
    return customTable[safeLevel];
  }
  return DEFAULT_INVENTORY_BONUS_PER_LEVEL[safeLevel] ?? (safeLevel - 1) * 2;
}

export type RaceCategory =
  | 'Comum'
  | 'Élfica'
  | 'Anã & Pequena'
  | 'Insetóide & Artrópode'
  | 'Planar & Abissal'
  | 'Tecnológica & Fera'
  | 'Eldritch & Vazio'
  | 'Mítico & Draconiano'
  | 'Mutante & Quântico'
  | 'Elemental & Primal';

export const RACE_CATEGORIES: RaceCategory[] = [
  'Comum',
  'Élfica',
  'Anã & Pequena',
  'Insetóide & Artrópode',
  'Planar & Abissal',
  'Tecnológica & Fera',
  'Eldritch & Vazio',
  'Mítico & Draconiano',
  'Mutante & Quântico',
  'Elemental & Primal',
];

export interface PlayableRace {
  id: string;
  name: string;
  category: RaceCategory;
  description: string;
  traits: string;
}

export const PLAYABLE_RACES: PlayableRace[] = [
  // Comuns
  { id: 'humano', name: 'Humano', category: 'Comum', description: 'Versátil, determinado e adaptável a qualquer ambiente.', traits: '+1 em todos atributos ou perícia extra' },
  { id: 'meio_orc', name: 'Meio-Orc', category: 'Comum', description: 'Guerreiro de vigor indomável e fúria primal temida em batalha.', traits: 'Resistência Implacável (cair a 1 PV), Crítico Selvagem' },
  { id: 'golias', name: 'Golias (Meio-Gigante)', category: 'Comum', description: 'Nascido nos picos gelados, suporta os maiores impactos.', traits: 'Resistência de Pedra (-1d12 dano), Porte Robusto' },

  // Élficas
  { id: 'alto_elfo', name: 'Alto Elfo', category: 'Élfica', description: 'Nobre, gracioso e naturalmente sintonizado com o éter arcano.', traits: 'Visão no Escuro, Truque Mágico inicial' },
  { id: 'elfo_silvestre', name: 'Elfo Silvestre', category: 'Élfica', description: 'Ágil caçador dos ermos, veloz e furtivo na vegetação.', traits: 'Deslocamento aprimorado (10.5m), Furtividade' },
  { id: 'elfo_negro', name: 'Elfo Negro (Drow)', category: 'Élfica', description: 'Habitante do subterrâneo com maestria em feitiços sombrios.', traits: 'Visão no Escuro Superior (36m), Magia Drow' },
  { id: 'meio_elfo', name: 'Meio-Elfo', category: 'Élfica', description: 'Combina a diplomacia humana com a elegância élfica.', traits: 'Carisma magnético, Versatilidade em Perícias' },

  // Anãs & Pequenas
  { id: 'anao_colina', name: 'Anão Forjador da Colina', category: 'Anã & Pequena', description: 'Resiliente, artesão de runas e com vitalidade sem igual.', traits: 'Vigor Anão (+1 PV extra por nível), Res. Veneno' },
  { id: 'anao_montanha', name: 'Anão da Montanha', category: 'Anã & Pequena', description: 'Robusto e acostumado a carregar armaduras pesadas e martelos.', traits: 'Treinamento em Armaduras Pesadas, Força Bruta' },
  { id: 'halfling', name: 'Pequenino (Halfling)', category: 'Anã & Pequena', description: 'Pequeno de estatura, grande de espírito e abençoado com sorte.', traits: 'Sorte (rerrola 1 natural em d20), Bravura' },
  { id: 'gnomo_profundo', name: 'Gnomo das Profundezas (Svirfneblin)', category: 'Anã & Pequena', description: 'Engenhoso minerador de gemas arcanas e pedras rúnicas.', traits: 'Camuflagem Rochosa, Astúcia Gnômica' },
  { id: 'fada_psicotropica', name: 'Pixie do Caos (Fada Alucinógena)', category: 'Anã & Pequena', description: 'Minúscula criatura hiperativa com asas de libélula translúcidas e pó psicotrópico.', traits: 'Voo Natural Ágil (12m), Pó do Delírio, Furtividade Pequena (+2)' },
  { id: 'goblin_piromanico', name: 'Goblin Engenheiro Piromaníaco', category: 'Anã & Pequena', description: 'Artífice diminuto caótico que resolve qualquer enigma acendendo pavios de pólvora.', traits: 'Resistência a Fogo & Explosão, Sucateiro Rápido, Fuga Desesperada' },

  // Insetóides & Artrópodes
  { id: 'formian_soldado', name: 'Mirmecóide (Povo-Formiga Soldado)', category: 'Insetóide & Artrópode', description: 'Guerreiro insetoide disciplinado com carapaça de quitina hiper-reforçada, força colossal e mente de colmeia inquebrável.', traits: 'Força de Colmeia (+40kg de capacidade de carga na mochila), Carapaça Quitinosa (+1 CA), Mandíbulas Esmagadoras (1d6), Vontade da Colmeia (Vantagem contra Medo/Charme)' },
  { id: 'mantis_lacerador', name: 'Mantis Imperial (Povo Louva-a-Deus)', category: 'Insetóide & Artrópode', description: 'Predador bípede refinado com antebraços em foices serrilhadas naturais, bote acrobático de 6m e camuflagem reflexiva de emboscada.', traits: 'Foices Naturais Serrilhadas (1d8 cortante / Crítico em 19-20), Bote Predatório (salto ofensivo de 6m), Camuflagem Críptica (+2 Furtividade)' },
  { id: 'escaravelho_titanico', name: 'Escaravelho Titânico (Povo-Besouro Blindado)', category: 'Insetóide & Artrópode', description: 'Colosso blindado com élitros dorsais de chapa dupla e chifre córneo frontal de rinoceronte para investidas de impacto sísmico.', traits: 'Placa Dorsal Impenetrável (+2 CA natural, -2 dano sofrido de projéteis), Investida de Chifre Córneo (1d10), Voo de Emergência em Élitro' },
  { id: 'aracnideo_tecelao', name: 'Aracnídeo Tecelão das Sombras (Povo-Aranha)', category: 'Insetóide & Artrópode', description: 'Ser aracnídeo com 4 braços adicionais articulados, capacidade de andar livremente por tetos e paredes, e tecelagem de fios de éter pegajosos.', traits: 'Pata Aderente (Escalada em tetos/paredes sem teste), Glândula de Teia Adesiva (prende alvos a 9m), Ferroada com Toxina Paralisante' },
  { id: 'vespoide_ferrao', name: 'Vespóide Ferrão-de-Fogo (Povo-Vespa Bombardeiro)', category: 'Insetóide & Artrópode', description: 'Insetoide alado hiperativo de zumbido supersônico com ferrão abdominal retrátil banhado em toxina pirofórica incandescente.', traits: 'Voo Zumbidor Veloz (10.5m), Ferrão Ígneo Perfurante (1d6 perfurante + 1d4 fogo), Visão Panorâmica Composta de 360° (não pode ser surpreendido)' },
  { id: 'lepidoptero_astral', name: 'Lepidóptero Onírico (Povo-Mariposa do Éter)', category: 'Insetóide & Artrópode', description: 'Ser místico com asas aveludadas imensas cobertas de pó lunar bioluminescente, capaz de hipnotizar mentes e planar no vácuo.', traits: 'Asas Emplumadas Lunares (voo 9m), Pó do Transe Hipnótico (atordoa inimigos em raio de 3m), Antenas Místicas (detecta fluxo de mana)' },
  { id: 'centopeia_abissal', name: 'Escolopendra Abissal (Povo-Centopeia Blindada)', category: 'Insetóide & Artrópode', description: 'Guerreiro serpentino articulado de dezenas de pernas blindadas, adaptado a escavações rápidas e presas venenosas de corrosão ácida.', traits: 'Deslocamento em Terrenos Difíceis (ignora lodo e escombros), Garras Venenosas Corrosivas (-1 CA temporária do alvo), Escavação Rápida (4.5m)' },

  // Planares & Abissais
  { id: 'draconato', name: 'Draconato (Dragonborn)', category: 'Planar & Abissal', description: 'Herdeiro de dragões antigos com escamas duras e sopro elemental.', traits: 'Ataque de Sopro Elemental, Resistência a Dano' },
  { id: 'tiefling', name: 'Tiefling', category: 'Planar & Abissal', description: 'Traz o sangue dos planos infernais, chifres e fogo interior.', traits: 'Resistência a Fogo, Taumaturgia / Magia Infernal' },
  { id: 'aasimar', name: 'Aasimar', category: 'Planar & Abissal', description: 'Tocado pelos planos celestiais, emissário de luz e virtude.', traits: 'Mãos Curativas, Asas Astrais ou Olhar Radiante' },
  { id: 'mutante_abismo', name: 'Mutante da Fenda Abissal', category: 'Planar & Abissal', description: 'Marcado pelas radiações da fenda, instável e letal.', traits: 'Adaptação ao Vazio, Resistência a Necrótico' },
  { id: 'changeling', name: 'Changeling (Metamorfo)', category: 'Planar & Abissal', description: 'Capaz de alterar sua fisionomia e voz num piscar de olhos.', traits: 'Metamorfose Física Instantânea, Instintos Sociais' },
  { id: 'vampiro_nobre', name: 'Vampiro Nobre da Cripta', category: 'Planar & Abissal', description: 'Aristocrata imortal pálido com elegância hipnótica e presas afiadas.', traits: 'Dreno Vampírico (PV ao morder), Visão no Escuro (24m), Presença Hipnótica' },

  // Tecnológicas & Feras
  { id: 'tabaxi', name: 'Tabaxi (Felino Ágil)', category: 'Tecnológica & Fera', description: 'Ágil predador felino, curioso e veloz como um raio.', traits: 'Arrancada Felina (dobra velocidade), Garras Retráteis' },
  { id: 'kenku', name: 'Kenku (Pássaro Soturno)', category: 'Tecnológica & Fera', description: 'Mestre da mímica sonora, falsificação e astúcia urbana.', traits: 'Mímica Perfeita, Falsificação Hábil' },
  { id: 'warforged', name: 'Warforged (Autômato Forjado)', category: 'Tecnológica & Fera', description: 'Criado de metal e madeira viva, imune a cansaço comum.', traits: 'Proteção Integrada (+1 CA), Sem necessidade de dormir' },
  { id: 'cyborg', name: 'Cyborg Tecnomágico', category: 'Tecnológica & Fera', description: 'Fusão cibernética com tecnologia arcana do Abismo.', traits: 'Interface Neural (+Iniciativa), Blindagem de Liga' },
  { id: 'centauro_ciber', name: 'Centauro Cibernético (Cybertaur)', category: 'Tecnológica & Fera', description: 'Corpo superior reforçado sobre chassi quadrúpede de titânio a alta octanagem.', traits: 'Galope Turbinado (13.5m), Mochila Ampliada (+40kg), Investida Devastadora' },
  { id: 'homem_tubarao', name: 'Homem-Tubarão Abissal (Sahuagin)', category: 'Tecnológica & Fera', description: 'Predador com mandíbulas capazes de partir ferro e faro biológico de sangue.', traits: 'Mordida Voraz (1d8), Faro de Sangue (Vantagem contra feridos), Pele de Lixa' },
  { id: 'lupino_primal', name: 'Lupino Primal (Homem-Lobo Noturno)', category: 'Tecnológica & Fera', description: 'Descendente de antigas linhagens licantrópicas que dominaram sua maldição.', traits: 'Sentidos Aguçados, Salto Sobrenatural, Garras Dilacerantes (1d6)' },
  { id: 'golem_cristal', name: 'Golem de Cristal Psiônico', category: 'Tecnológica & Fera', description: 'Esculpido em geodos de quartzo prismático vibrando em harmônicos mentais.', traits: 'Refração de Feixes (-3 dano mágico elemental), Telepatia Silenciosa, Corpo Mineral' },
  { id: 'homem_camaleao', name: 'Homem-Camaleão Críptico', category: 'Tecnológica & Fera', description: 'Réptil inteligente com pele cromática que muda de cor em milissegundos, língua pegajosa retrátil de 4.5m e olhos telescópicos.', traits: 'Camuflagem Cromática (+3 Furtividade parado), Língua Elástica Pegajosa (puxa armas e objetos a 4.5m), Olhos Independentes (imune a ser flanqueado)' },

  // Eldritch & Vazio
  { id: 'lich_pequeno', name: 'Lich Esquelético Diminuto', category: 'Eldritch & Vazio', description: 'Esqueleto milenar ranzinza de 80cm com chamas esmeraldas nas órbitas oculares.', traits: 'Morte Não-Natural (imune a veneno/doença/asfixia), Aura Pútrida, Intelecto Profano' },
  { id: 'espectro_vazio', name: 'Espectro Semissólido do Véu', category: 'Eldritch & Vazio', description: 'Alma errante que reteve forma translúcida parcial ao cruzar o Véu do Vazio.', traits: 'Flutuação Imaterial (ignora armadilhas de solo), Resistência a Sangramento' },
  { id: 'simbionte_abissal', name: 'Simbionte Bio-Abissal', category: 'Eldritch & Vazio', description: 'Matéria viva negra que envolve o hospedeiro em carapaça retrátil com tentáculos.', traits: 'Carapaça Reativa (+2 CA temporário), Tentáculos de Escalada, Regeneração Celular' },

  // Míticos & Draconianos
  { id: 'dragao_sombra', name: 'Draconiano das Sombras Cósmicas', category: 'Mítico & Draconiano', description: 'Linhagem direta de dragões do vácuo cósmico com escamas de obsidiana fosca.', traits: 'Sopro de Entropia Negra (cone de vácuo), Asas Astrais Planadoras, Imune a Medo' },
  { id: 'kitsune_nove_caudas', name: 'Kitsune Mística das Nove Caudas', category: 'Mítico & Draconiano', description: 'Nobre espírito raposa com caudas flamejantes e poder de ilusão hipnótica.', traits: 'Metamorfose em Raposa Mística, Fogo Espiritual, Charme da Raposa (+2 Sociais)' },
  { id: 'gargula_obsidiana', name: 'Gárgula de Obsidiana Viva', category: 'Mítico & Draconiano', description: 'Monólito esculpido em basalto e gárgulas de catedral, animado por runas eternas.', traits: 'Casca Rochosa (+2 CA se sem armadura pesada), Forma Estátua, Asas de Pedra' },

  // Mutantes & Quânticos
  { id: 'slime_consciente', name: 'Slime Consciente (Polimorfo Gel)', category: 'Mutante & Quântico', description: 'Massa gelatinosa inteligente capaz de passar por frestas de 2cm e engolir armas.', traits: 'Corpo Maleável (frestas de 2cm), Absorção Gelatinosa (-2 Dano Contundente), Núcleo Coletor' },
  { id: 'homem_cogumelo', name: 'Myconid (Povo-Cogumelo de Esporos)', category: 'Mutante & Quântico', description: 'Ser fúngico senciente brotado de redes de micélio das profundezas.', traits: 'Rede de Esporos Psíquica (18m), Esporos Soporíferos Paralisantes, Regeneração Úmida' },
  { id: 'anomalia_quantica', name: 'Glitch Espacial (Anomalia Quântica)', category: 'Mutante & Quântico', description: 'Fratura ambulante no tecido do espaço-tempo que oscila entre dimensões.', traits: 'Micro-Salto Dimensional (Teleporte de 4.5m como bônus), Distorção Probabilística' },

  // Elementais & Primais
  { id: 'elemental_magma', name: 'Elemental de Magma Vulcânico', category: 'Elemental & Primal', description: 'Entidade viva de rocha ígnea e lava borbulhante que irradia calor abrasador por onde pisa.', traits: 'Toque Calcinante (+1d4 de Fogo em ataques corpo-a-corpo), Imunidade a Fogo, Radiação Térmica (ilumina 6m)' },
  { id: 'genasi_tempestade', name: 'Gênasi do Trovão (Nascido da Tempestade)', category: 'Elemental & Primal', description: 'Ser energizado por relâmpagos com cabelo de faíscas elétricas e olhos como nuvens de tempestade.', traits: 'Resistência a Eletricidade & Trovão, Choque Estático Defensivo (1d6 dano ao receber golpe), Passo do Relâmpago' },
  { id: 'axolote_regenerativo', name: 'Axolote Místico das Profundezas', category: 'Elemental & Primal', description: 'Criatura anfíbia doce e resiliente com guelras emplumadas luminescentes e poder supremo de regeneração biológica.', traits: 'Regeneração Anfíbia (cura 1d4 PV a cada descanso curto, regenera membros perdidos), Natação Ágil (12m), Visão Subaquática Clara' },
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
  | 'Mestre das Lâminas & Espadachim'
  | 'Conjurador Arcano'
  | 'Divino & Espiritual'
  | 'Especialista & Furtivo'
  | 'Cibernético & Tecnomágico'
  | 'Psíquico & Cósmico'
  | 'Caótico & Proibido'
  | 'Ofício & Profissões da Época';

export const CLASS_CATEGORIES: ClassCategory[] = [
  'Marcial & Tanque',
  'Mestre das Lâminas & Espadachim',
  'Conjurador Arcano',
  'Divino & Espiritual',
  'Especialista & Furtivo',
  'Cibernético & Tecnomágico',
  'Psíquico & Cósmico',
  'Caótico & Proibido',
  'Ofício & Profissões da Época',
];

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
  {
    id: 'lobisomem_frenetico',
    name: 'Lobisomem Sangrento (Frenético)',
    category: 'Marcial & Tanque',
    description: 'Abandona a civilidade e libera a besta interior em combate. Cresce em tamanho monstruoso, dilacera armaduras pesadas e se regenera.',
    primaryAttribute: 'FOR',
    hitDie: '1d12',
    baseHpBonus: 9,
    keyFeature: 'Metamorfose Feroz & Frenesi Carnívoro',
    startingSkills: ['Atletismo', 'Sobrevivência', 'Intimidação'],
    icon: '🐺',
  },
  {
    id: 'pugilista_colossal',
    name: 'Pugilista Colossal (Titã de Rua)',
    category: 'Marcial & Tanque',
    description: 'Bárbaro urbano que usa socos com soqueiras pesadas para estilhaçar ossos, arremessar inimigos contra pedras e suportar marretadas.',
    primaryAttribute: 'FOR',
    hitDie: '1d10',
    baseHpBonus: 6,
    keyFeature: 'Gancho Demolidor & Agarrão de Titã',
    startingSkills: ['Atletismo', 'Intimidação', 'Acrobacia'],
    icon: '🥊',
  },
  {
    id: 'monge_bebum',
    name: 'Monge Bêbado (Mestre Embriagado)',
    category: 'Marcial & Tanque',
    description: 'Luta cambaleando de forma hilária e imprevisível. Desvia de ataques com piruetas acrobáticas, usa o barril como escudo e cospe chamas etílicas.',
    primaryAttribute: 'DES',
    hitDie: '1d10',
    baseHpBonus: 5,
    keyFeature: 'Esquiva Tropeçante & Bafo de Dragão Alcoólico',
    startingSkills: ['Acrobacia', 'Performance', 'Enganação'],
    icon: '🍶',
  },
  {
    id: 'guardiao_mandibular',
    name: 'Guardião Mandibular (Guerreiro Insetóide)',
    category: 'Marcial & Tanque',
    description: 'Tanque disciplinado com carapaça de quitina rígida. Bloqueia passagens com o próprio corpo, quebra escudos com pinças colossais e expele ácido gástrico defensivo.',
    primaryAttribute: 'CON',
    hitDie: '1d12',
    baseHpBonus: 8,
    keyFeature: 'Bloqueio de Carapaça Rígida & Garras Esmagadoras de Ferro',
    startingSkills: ['Atletismo', 'Intimidação', 'Sobrevivência'],
    icon: '🐜',
  },

  // Mestres das Lâminas & Espadachins
  {
    id: 'espadachim_gracioso',
    name: 'Espadachim Gracioso (Duelista Elegante)',
    category: 'Mestre das Lâminas & Espadachim',
    description: 'Virtuoso da esgrima com florete ou rapier. Neutraliza investidas inimigas com contra-ataques aparados no milésimo de segundo (Parry & Riposte) e estocadas cirúrgicas que ignoram armadura.',
    primaryAttribute: 'DES',
    hitDie: '1d10',
    baseHpBonus: 4,
    keyFeature: 'Aparo Relâmpago (Parry) & Estocada Perfurante Cirúrgica',
    startingSkills: ['Acrobacia', 'Atuação', 'Intuição'],
    icon: '🤺',
  },
  {
    id: 'kensei_iaido',
    name: 'Kensei do Iaidô (Samurai da Lâmina Única)',
    category: 'Mestre das Lâminas & Espadachim',
    description: 'Mestre zen da katana com concentração inabalável. Mantém a espada na bainha até o instante exato, desferindo um corte letal no saque rápido (Battōjutsu) que corta até o vento.',
    primaryAttribute: 'DES',
    hitDie: '1d10',
    baseHpBonus: 5,
    keyFeature: 'Saque Rápido Mortal (Battōjutsu) & Corte de Vácuo à Distância',
    startingSkills: ['Percepção', 'Atletismo', 'Intuição'],
    icon: '🗡️',
  },
  {
    id: 'lamina_dancarina',
    name: 'Lâmina Dançarina dos Ventos (Dervixe)',
    category: 'Mestre das Lâminas & Espadachim',
    description: 'Empunha cimitarras gêmeas em uma dança acrobática hipnótica contínua. Gira como um turbilhão no meio dos inimigos, golpeando múltiplos alvos ao mesmo tempo sem perder embalo.',
    primaryAttribute: 'DES',
    hitDie: '1d10',
    baseHpBonus: 4,
    keyFeature: 'Turbilhão de Cimitarras 360° & Passo Acrobático Fluido',
    startingSkills: ['Acrobacia', 'Performance', 'Furtividade'],
    icon: '🌀',
  },
  {
    id: 'espadachim_arcano',
    name: 'Espadachim Arcano (Spellblade Elemental)',
    category: 'Mestre das Lâminas & Espadachim',
    description: 'Entrelaça técnicas afiadas de esgrima com energias arcanas primordiais. Reveste sua lâmina com fogo consumidor, gelo cortante ou trovões faiscantes a cada golpe físico.',
    primaryAttribute: 'INT',
    hitDie: '1d8',
    baseHpBonus: 4,
    keyFeature: 'Infusão Elemental na Lâmina & Disparo Mágico em Contra-Golpe',
    startingSkills: ['Arcanismo', 'Acrobacia', 'Atletismo'],
    icon: '⚡',
  },
  {
    id: 'mosqueteiro_audacioso',
    name: 'Mosqueteiro Audacioso (Duelista de Pederneira)',
    category: 'Mestre das Lâminas & Espadachim',
    description: 'Aventureiro espalhafatoso com espada fina em uma mão e pistola rúnica na outra. Desconcerta oponentes com fintas ousadas de capa e finaliza com disparos à queima-roupa.',
    primaryAttribute: 'DES',
    hitDie: '1d10',
    baseHpBonus: 4,
    keyFeature: 'Tiro à Queima-Roupa & Finta Deslumbrante de Capa',
    startingSkills: ['Acrobacia', 'Persuasão', 'Percepção'],
    icon: '🪶',
  },
  {
    id: 'samurai_ronin',
    name: 'Samurai Ronin Maldito (Lâmina Muramasa)',
    category: 'Mestre das Lâminas & Espadachim',
    description: 'Espadachim renegado que empunha uma lâmina lendária forjada em sangue e maldição. Desfere cortes cortantes com ondas de vácuo escarlate e recusa-se a tombar perante a dor.',
    primaryAttribute: 'FOR',
    hitDie: '1d10',
    baseHpBonus: 6,
    keyFeature: 'Onda Carmesim de Sangue & Postura Inabalável do Ronin',
    startingSkills: ['Intimidação', 'Sobrevivência', 'Atletismo'],
    icon: '🩸',
  },
  {
    id: 'shinobi_sombras',
    name: 'Shinobi das Sombras (Ninja das Técnicas Ocultas)',
    category: 'Mestre das Lâminas & Espadachim',
    description: 'Infiltrador lendário mestre em espadas ninjatō curtas, estrelas ninja e técnicas de ilusão. Substitui seu corpo por um tronco ao receber ataques mortais e some na fumaça.',
    primaryAttribute: 'DES',
    hitDie: '1d8',
    baseHpBonus: 3,
    keyFeature: 'Substituição Kawarimi & Lâmina Oculta Envenenada',
    startingSkills: ['Furtividade', 'Acrobacia', 'Prestidigitação'],
    icon: '🥷',
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
  {
    id: 'mago_canhao',
    name: 'Artilheiro Arcano (Mago de Canhão)',
    category: 'Conjurador Arcano',
    description: 'Conjurador bélico que empunha um canhão de ombro movido a núcleos de éter, disparando magias balísticas como ogivas.',
    primaryAttribute: 'INT',
    hitDie: '1d8',
    baseHpBonus: 4,
    keyFeature: 'Disparo de Canhão Etéreo & Balística de Demolição',
    startingSkills: ['Arcanismo', 'Investigação', 'Atletismo'],
    icon: '💣',
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
  {
    id: 'inquisidor_herege',
    name: 'Inquisidor Herege (Caçador de Bruxas)',
    category: 'Divino & Espiritual',
    description: 'Sacerdote implacável com chicote de correntes sagradas incandescentes, selos de silêncio arcano e punições austeras.',
    primaryAttribute: 'SAB',
    hitDie: '1d10',
    baseHpBonus: 5,
    keyFeature: 'Chicote de Correntes Sagradas & Veredito Inquisitorial',
    startingSkills: ['Religião', 'Intimidação', 'Investigação'],
    icon: '⛓️',
  },
  {
    id: 'entomante_enxame',
    name: 'Entomante (Senhor dos Enxames)',
    category: 'Divino & Espiritual',
    description: 'Seu corpo serve de ninho simbiótico para besouros blindados, vespas elétricas e gafanhotos vorazes que devoram defesas.',
    primaryAttribute: 'SAB',
    hitDie: '1d8',
    baseHpBonus: 4,
    keyFeature: 'Enxame Devorador & Carapaça Viva de Besouros',
    startingSkills: ['Natureza', 'Sobrevivência', 'Percepção'],
    icon: '🦗',
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
  {
    id: 'cozinheiro_batalha',
    name: 'Cozinheiro de Batalha (Chef de Guerra)',
    category: 'Especialista & Furtivo',
    description: 'Prepara ensopados fortificantes no calor da luta. Empunha uma frigideira de ferro fundido de 15kg como escudo e clava demolidora.',
    primaryAttribute: 'CON',
    hitDie: '1d8',
    baseHpBonus: 5,
    keyFeature: 'Banquete de Combate & Pancada de Frigideira',
    startingSkills: ['Sobrevivência', 'Medicina', 'Prestidigitação'],
    icon: '🍳',
  },
  {
    id: 'pistoleiro_espacial',
    name: 'Pistoleiro Cósmico (Mercenário)',
    category: 'Especialista & Furtivo',
    description: 'Andarilho estelar armado com pistolas duplas de fótons e coldres magnéticos de saque relâmpago.',
    primaryAttribute: 'DES',
    hitDie: '1d8',
    baseHpBonus: 3,
    keyFeature: 'Saque Rápido Quântico & Ricochete de Plasma',
    startingSkills: ['Percepção', 'Acrobacia', 'Furtividade'],
    icon: '🔫',
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
  {
    id: 'cavaleiro_mecha',
    name: 'Cavaleiro Mecha (Exoesqueleto)',
    category: 'Cibernético & Tecnomágico',
    description: 'Opera uma armadura mecatrônica gigante com servomotores hidráulicos, canhões de antebraço e propulsores a jato.',
    primaryAttribute: 'FOR',
    hitDie: '1d10',
    baseHpBonus: 8,
    keyFeature: 'Sobrecarga de Servomotores & Propulsão a Jato',
    startingSkills: ['Tecnologia', 'Atletismo', 'Investigação'],
    icon: '🤖',
  },
  {
    id: 'necro_engenheiro',
    name: 'Necro-Engenheiro (Cibermortos)',
    category: 'Cibernético & Tecnomágico',
    description: 'Funde necromancia e cibernética. Reanima cadáveres e esqueletos instalando implantes mecânicos, serras elétricas e fuzis.',
    primaryAttribute: 'INT',
    hitDie: '1d6',
    baseHpBonus: 3,
    keyFeature: 'Reanimação Cibernética & Enxame Cadavérico',
    startingSkills: ['Tecnologia', 'Arcanismo', 'Medicina'],
    icon: '🧟',
  },

  // Psíquicos & Cósmicos
  {
    id: 'psionico_gravitacional',
    name: 'Psiônico Cósmico (Dobrador de Gravidade)',
    category: 'Psíquico & Cósmico',
    description: 'Mentalista supremo que manipula vetores gravitacionais. Arremessa inimigos no teto, esmaga armaduras e cria poços de atração.',
    primaryAttribute: 'INT',
    hitDie: '1d6',
    baseHpBonus: 3,
    keyFeature: 'Inversão Gravitacional & Telecinese Esmagadora',
    startingSkills: ['Arcanismo', 'Investigação', 'Intuição'],
    icon: '🌀',
  },
  {
    id: 'glitcher_vazio',
    name: 'Glitcher do Vazio (Rompedor de Matriz)',
    category: 'Psíquico & Cósmico',
    description: 'Hackeia a renderização da física e da realidade. Teletransporta-se em bugs visuais, atravessa paredes e congela frames de ataques inimigos.',
    primaryAttribute: 'INT',
    hitDie: '1d8',
    baseHpBonus: 4,
    keyFeature: 'Desfasamento com Glitch (Teleporte) & Congelamento de Frame',
    startingSkills: ['Tecnologia', 'Furtividade', 'Acrobacia'],
    icon: '👾',
  },

  // Caóticos & Proibidos
  {
    id: 'mestre_dados',
    name: 'Trapaceiro do Destino (Mestre dos Dados)',
    category: 'Caótico & Proibido',
    description: 'Apostador cósmico que manipula o RNG do universo jogando dados de marfim, convertendo falhas de aliados em acertos perfeitos.',
    primaryAttribute: 'CAR',
    hitDie: '1d8',
    baseHpBonus: 3,
    keyFeature: 'Manipulação de Probabilidade (Rerrola d20) & Carta na Manga',
    startingSkills: ['Enganação', 'Prestidigitação', 'Intuição'],
    icon: '🎲',
  },
  {
    id: 'bruxo_sangue',
    name: 'Bruxo de Sangue (Hemomante Sombrio)',
    category: 'Caótico & Proibido',
    description: 'Mestre da hemomancia que corta os próprios pulsos para moldar lanças rubras, chicotes escarlates ferventes e drenos vitais.',
    primaryAttribute: 'CON',
    hitDie: '1d8',
    baseHpBonus: 5,
    keyFeature: 'Lança de Hemoglobina Cristalizada & Transfusão Necrótica',
    startingSkills: ['Arcanismo', 'Medicina', 'Intimidação'],
    icon: '🩸',
  },
  {
    id: 'cavaleiro_apocalipse',
    name: 'Cavaleiro do Apocalipse (Algoz da Peste)',
    category: 'Caótico & Proibido',
    description: 'Sentinela do fim dos tempos que cavalga um corcel espectral macabro e propaga miasmas pestilentos corrosivos.',
    primaryAttribute: 'CON',
    hitDie: '1d10',
    baseHpBonus: 7,
    keyFeature: 'Miasma da Peste & Foice da Condenação Final',
    startingSkills: ['Intimidação', 'Religião', 'Sobrevivência'],
    icon: '☠️',
  },

  // Ofício & Profissões da Época (Artífices Medievais & Mestres de Ofício)
  {
    id: 'ferreiro_mestre',
    name: 'Ferreiro Mestre-Armeiro (Forjador de Lendas)',
    category: 'Ofício & Profissões da Época',
    description: 'Especialista supremo no fogo, bigorna e martelo. Sua vocação exclusiva é concertar e criar armamentos, reforçar têmperas metálicas e restaurar a durabilidade de equipamentos quebrados gastando metade dos recursos.',
    primaryAttribute: 'FOR',
    hitDie: '1d10',
    baseHpBonus: 6,
    keyFeature: 'Forja Magistral & Bigorna Implacável (Repara equipamentos com metade do custo, reforça durabilidade máxima em +20% e forja armas resistentes ao desgaste)',
    startingSkills: ['Forja Arcana', 'Atletismo', 'Investigação'],
    icon: '⚒️',
  },
  {
    id: 'alquimista_transmutador',
    name: 'Alquimista Transmutador (Mestre da Matéria)',
    category: 'Ofício & Profissões da Época',
    description: 'Filósofo hermético que decodifica as leis fundamentais dos elementos. Destila elixires luminosos no caldeirão e transmuta minérios comuns em ligas nobres e ouro líquido.',
    primaryAttribute: 'INT',
    hitDie: '1d8',
    baseHpBonus: 3,
    keyFeature: 'Transmutação da Matéria & Destilação Dourada (Produz elixires com o dobro de potência, transmuta moedas de menor valor com margem de lucro e extrai essências puras)',
    startingSkills: ['Arcanismo', 'Natureza', 'Investigação'],
    icon: '⚗️',
  },
  {
    id: 'alquimista_pirotecnico',
    name: 'Alquimista Pirotécnico (Bombardeiro Cáustico)',
    category: 'Ofício & Profissões da Época',
    description: 'Químico bélico que manipula enxofre, óleo negro e éter volátil. Constrói frascos de Fogo Grego, bombas de impacto cáustico que corroem armaduras e fumaças alucinógenas.',
    primaryAttribute: 'INT',
    hitDie: '1d8',
    baseHpBonus: 4,
    keyFeature: 'Frasco Incendiário Fogo-Grego & Salitre Ácido (Causa 3d6 dano de fogo em área, destrói durabilidade de armaduras inimigas e arremessa granadas táticas)',
    startingSkills: ['Arcanismo', 'Acrobacia', 'Sobrevivência'],
    icon: '💣',
  },
  {
    id: 'alquimista_apotecario',
    name: 'Alquimista Apotecário & Herbalista Clínico',
    category: 'Ofício & Profissões da Época',
    description: 'Mestre da botânica medicinal e fungos restauradores. Prepara pomadas milagrosas, antídotos universais para venenos abissais e cataplasmas que regeneram ossos fraturados.',
    primaryAttribute: 'SAB',
    hitDie: '1d8',
    baseHpBonus: 4,
    keyFeature: 'Panaceia Universal & Bálsamo Regenerador (Purifica qualquer envenenamento ou status negativo e cura PV de aliados sem necessidade de descanso)',
    startingSkills: ['Medicina', 'Natureza', 'Percepção'],
    icon: '🌿',
  },
  {
    id: 'alquimista_quimerico',
    name: 'Alquimista Quimérico (Mutacionista de Éter)',
    category: 'Ofício & Profissões da Época',
    description: 'Cientista ousado que ingere seus próprios compostos experimentais. Altera temporariamente sua fisionomia para ganhar força de urso, garras endurecidas e imunidade a toxinas.',
    primaryAttribute: 'CON',
    hitDie: '1d10',
    baseHpBonus: 5,
    keyFeature: 'Hipermutação Biológica & Sangue Cáustico (Bebe elixires mutagênicos para dobrar atributos físicos e contra-atacar atacantes com sangue ácido)',
    startingSkills: ['Medicina', 'Arcanismo', 'Intimidação'],
    icon: '🧪',
  },
  {
    id: 'carpinteiro_cerco',
    name: 'Carpinteiro Naval & Engenheiro de Cerco',
    category: 'Ofício & Profissões da Época',
    description: 'Construtor de fortificações, baluartes e engenhos bélicos. Ergue barricadas no calor da batalha, repara escudos de madeira e projeta catapultas de campanha desmontáveis.',
    primaryAttribute: 'FOR',
    hitDie: '1d10',
    baseHpBonus: 6,
    keyFeature: 'Reforço de Baluarte & Aríete Móvel (Cria cobertura total instantânea de madeira para aliados e concede +3 de CA a escudos equipados)',
    startingSkills: ['Atletismo', 'Investigação', 'Sobrevivência'],
    icon: '🪵',
  },
  {
    id: 'taverneiro_cervejeiro',
    name: 'Taverneiro & Mestre Cervejeiro',
    category: 'Ofício & Profissões da Época',
    description: 'Pilar da comunidade e guardião dos segredos locais. Prepara cervejas encorpadas e hidromel revigorante que espantam o medo e concedem vigor aos combatentes mais exaustos.',
    primaryAttribute: 'CAR',
    hitDie: '1d8',
    baseHpBonus: 5,
    keyFeature: 'Hidromel da Bravura & Boato Estratégico (Concede +10 PV temporários a todo o grupo durante descansos e revela fraquezas de inimigos locais)',
    startingSkills: ['Persuasão', 'Enganação', 'Intuição'],
    icon: '🍺',
  },
  {
    id: 'alfaiate_runico',
    name: 'Alfaiate & Tecelão Rúnico',
    category: 'Ofício & Profissões da Época',
    description: 'Artesão que fia tecidos reforçados com filamentos arcanos de seda da aranha-da-fenda. Costura vestimentas leves tão resistentes quanto aço e mochilas dimensionais.',
    primaryAttribute: 'DES',
    hitDie: '1d8',
    baseHpBonus: 3,
    keyFeature: 'Trama Defensiva Rúnica & Bolsos Espaciais (Aumenta a capacidade de carga da mochila em +10kg e concede resistência a dano elemental a armaduras leves)',
    startingSkills: ['Prestidigitação', 'Arcanismo', 'Investigação'],
    icon: '🧵',
  },
  {
    id: 'mineiro_lapidador',
    name: 'Mineiro dos Abismos & Lapidador de Gemas',
    category: 'Ofício & Profissões da Época',
    description: 'Veterano das galerias subterrâneas mais escuras. Empunha picaretas pesadas de ponta dupla capazes de rachar blocos de granito e cascas blindadas de golens e monstros.',
    primaryAttribute: 'CON',
    hitDie: '1d10',
    baseHpBonus: 6,
    keyFeature: 'Golpe Sísmico de Picareta & Sentido de Minério (Ignora resistências de monstros rochosos/metálicos e extrai gemas preciosas ao derrotar construtos)',
    startingSkills: ['Atletismo', 'Sobrevivência', 'Percepção'],
    icon: '⛏️',
  },
  {
    id: 'cartografo_navegador',
    name: 'Cartógrafo Real & Navegador Estelar',
    category: 'Ofício & Profissões da Época',
    description: 'Explorador meticuloso armado com sextante, bússola solar e pergaminhos milimétricos. Conhece todas as rotas seguras dos reinos e antecipa emboscadas inimigas.',
    primaryAttribute: 'SAB',
    hitDie: '1d8',
    baseHpBonus: 4,
    keyFeature: 'Traçado de Rotas Seguras & Bússola Astral (Evita emboscadas em viagens, revela atalhos nos mapas e concede vantagem permanente em rolagens de Iniciativa)',
    startingSkills: ['Percepção', 'Sobrevivência', 'História'],
    icon: '🧭',
  },
  {
    id: 'escrivao_notario',
    name: 'Escrivão Rúnico & Escriba das Leis',
    category: 'Ofício & Profissões da Época',
    description: 'Guardião dos manuscritos e contratos sagrados. Imprime tintas arcanas luminosas para fabricar pergaminhos mágicos descartáveis que podem ser lidos e ativados por qualquer membro do grupo.',
    primaryAttribute: 'INT',
    hitDie: '1d6',
    baseHpBonus: 2,
    keyFeature: 'Pergaminho de Selo Protetor & Cifra Imperial (Cria pergaminhos mágicos de uso único para guerreiros usarem magias sem gastar mana)',
    startingSkills: ['História', 'Investigação', 'Arcanismo'],
    icon: '📜',
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
  threatLevel?: string;
  weather?: string;
  dominantFaction?: string;
  travelDaysFromCapital?: number;
}

export const DEFAULT_AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80', // Rogue / Assassin
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80', // Paladin / Warrior
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80', // Mage / Arcanist
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=80', // Cyber-mage / Technomancer
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80', // Dark Knight / Abyss Guardian
];

export interface QuestHookReward {
  coinsAmount: number;
  currency: CurrencyType;
  exp: number;
  suggestedItemDrop?: string;
}

export interface QuestHook {
  id: string;
  title: string;
  category: 'Combate' | 'Investigação' | 'Sobrevivência' | 'Resgate' | 'Arcano' | 'Infiltração';
  synopsis: string;
  recommendedLevel: string;
  threat: string;
  location: string;
  climaxOrTwist: string;
  rewards: QuestHookReward;
  targetAvgLevel: number;
}


