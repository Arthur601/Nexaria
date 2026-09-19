import { CurrencyType } from '../types/rpg';
import { SHEET1_FOLKLORE_CREATURES } from './bestiary/sheet1_folklore';
import { SHEET2_ELEMENTAL_CREATURES } from './bestiary/sheet2_elementals';
import { SHEET3_DEPTHS_CYBER_CREATURES } from './bestiary/sheet3_depths_cyber';
import { SHEET4_ELDRIA_CREATURES } from './bestiary/sheet4_eldria_monsters';

export interface MonsterCreature {
  id: string;
  number: number;
  name: string;
  collection: 'folclore_mortos' | 'elementais_horrores' | 'profundezas_ciberneticas' | 'monstros_eldria';
  collectionTitle: string;
  category: string;
  categoryLabel: string;
  creatureType: string;
  size: 'Pequena (25mm)' | 'Humano (25mm)' | 'Média (40mm)' | 'Grande (60mm)' | 'Enorme (80mm)';
  threatLevel: 'Iniciante' | 'Intermediário' | 'Ameaça Maior' | 'Chefe Lendário';
  hp: number;
  ac: number;
  speed: string;
  attacks: {
    name: string;
    bonus: string;
    damage: string;
    damageType?: string;
    description: string;
  }[];
  specialTrait: string;
  lootAmount: number;
  lootCurrency: CurrencyType;
  lore: string;
  badgeColor: string;
}

export interface BestiaryCollection {
  id: 'all' | 'folclore_mortos' | 'elementais_horrores' | 'profundezas_ciberneticas' | 'monstros_eldria';
  name: string;
  subtitle: string;
  badge: string;
  count: number;
}

export const BESTIARY_COLLECTIONS: BestiaryCollection[] = [
  {
    id: 'all',
    name: 'Todo o Bestiário',
    subtitle: 'Todas as 4 coleções e 141 miniaturas oficiais de Nexaria',
    badge: '141 Miniaturas',
    count: 141,
  },
  {
    id: 'folclore_mortos',
    name: 'Folclore Europeu, Mortos-Vivos & Slimes',
    subtitle: 'Miniaturas 01 a 51 — Lendas, mortos-vivos, amorfos e bestas perigosas',
    badge: 'Imagem 1 • 51 Miniaturas',
    count: 51,
  },
  {
    id: 'elementais_horrores',
    name: 'Bestas Selvagens, Elementais & Horrores',
    subtitle: 'Miniaturas 31 a 66 — Feras selvagens, espíritos elementais e titãs maiores',
    badge: 'Imagem 2 • 36 Miniaturas',
    count: 36,
  },
  {
    id: 'profundezas_ciberneticas',
    name: 'Profundezas, Corrompidas & Cibernéticas',
    subtitle: 'Miniaturas 01 a 30 — Criaturas abissais, horrores carnosos e autômatos',
    badge: 'Imagem 3 • 30 Miniaturas',
    count: 30,
  },
  {
    id: 'monstros_eldria',
    name: 'Monstros Regionais & Titãs de Eldria',
    subtitle: 'Miniaturas 01 a 24 — Feras das 9 Regiões, Golens, Colossos e o Dragão do Abismo',
    badge: 'Coleção Eldria • 24 Miniaturas',
    count: 24,
  },
];

export const ALL_ABYSS_CREATURES: MonsterCreature[] = [
  ...SHEET1_FOLKLORE_CREATURES,
  ...SHEET2_ELEMENTAL_CREATURES,
  ...SHEET3_DEPTHS_CYBER_CREATURES,
  ...SHEET4_ELDRIA_CREATURES.map((c) => ({
    ...c,
    collection: 'monstros_eldria' as const,
  })),
];

// Alias para compatibilidade em todo o applet
export const ABYSS_CREATURES: MonsterCreature[] = ALL_ABYSS_CREATURES;

export const BESTIARY_CATEGORIES = [
  { id: 'all', label: 'Todas as Subcategorias', count: ALL_ABYSS_CREATURES.length },
  // Da Imagem 1
  { id: 'folclore_europeu', label: 'Folclore Europeu (01-07)', collection: 'folclore_mortos' },
  { id: 'criaturas_miticas', label: 'Criaturas Míticas (08-12)', collection: 'folclore_mortos' },
  { id: 'mortos_vivos', label: 'Mortos-Vivos (13-19)', collection: 'folclore_mortos' },
  { id: 'senhores_espectros', label: 'Senhores e Espectros (20-25)', collection: 'folclore_mortos' },
  { id: 'slimes_oozes', label: 'Slimes e Oozes (26-32)', collection: 'folclore_mortos' },
  { id: 'aberracoes_sombrias', label: 'Aberrações Sombrias (33-38)', collection: 'folclore_mortos' },
  { id: 'outras_criaturas', label: 'Outras Criaturas (39-45)', collection: 'folclore_mortos' },
  { id: 'bestas_perigosas', label: 'Bestas e Animais Perigosos (46-51)', collection: 'folclore_mortos' },
  // Da Imagem 2
  { id: 'bestas_selvagens', label: 'Bestas Selvagens (31-40)', collection: 'elementais_horrores' },
  { id: 'elementais_espirituais', label: 'Entidades Elementais (41-50)', collection: 'elementais_horrores' },
  { id: 'ciberneticas_avancadas', label: 'Cibernéticas Avançadas (51-60)', collection: 'elementais_horrores' },
  { id: 'horrores_maiores', label: 'Horrores Maiores (61-66)', collection: 'elementais_horrores' },
  // Da Imagem 3
  { id: 'monstros_profundezas', label: 'Monstros das Profundezas (01-10)', collection: 'profundezas_ciberneticas' },
  { id: 'criaturas_corrompidas', label: 'Criaturas Corrompidas (11-20)', collection: 'profundezas_ciberneticas' },
  { id: 'criaturas_ciberneticas', label: 'Criaturas Cibernéticas (21-30)', collection: 'profundezas_ciberneticas' },
  // Da Coleção de Eldria
  { id: 'monstros_norte_gelo', label: 'Monstros do Norte Glacial & Fenda (01-02)', collection: 'monstros_eldria' },
  { id: 'feras_verdancia', label: 'Feras Ancestrais de Verdância (03-04)', collection: 'monstros_eldria' },
  { id: 'colossos_aridas', label: 'Colossos & Quimeras das Terras Áridas (05-06, 20)', collection: 'monstros_eldria' },
  { id: 'titas_igneas', label: 'Titãs Vulcânicos & Gárgulas de Ignis (07-08)', collection: 'monstros_eldria' },
  { id: 'sombras_abissais', label: 'Horrores do Vale das Sombras & Mar (09-10, 15-16)', collection: 'monstros_eldria' },
  { id: 'constructos_caeldrin', label: 'Constructos Estelares & Golens de Caeldrin (11-12, 17-18, 22-23)', collection: 'monstros_eldria' },
  { id: 'espiritos_planicie', label: 'Espíritos da Planície Dourada & Moinhos (13-14)', collection: 'monstros_eldria' },
  { id: 'chefes_supremos', label: 'Chefes Supremos do Abismo & Dragão Eterno (19, 21, 24)', collection: 'monstros_eldria' },
];

export const CREATURE_TYPES_FILTER = [
  'Todos os Tipos',
  'Abissal',
  'Besta',
  'Demoníaco',
  'Mágico',
  'Morto-Vivo',
  'Elemental',
  'Aberração',
  'Mecânico',
  'Corrompido',
  'Etéreo',
  'Aquático',
  'Aracnídeo',
];

export const CREATURE_SIZES_FILTER = [
  'Todos os Portes',
  'Pequena (25mm)',
  'Humano (25mm)',
  'Média (40mm)',
  'Grande (60mm)',
  'Enorme (80mm)',
];
