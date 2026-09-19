import { CampaignRoom, CharacterSheet, ShopItem, SpellCard } from '../types/rpg';

export const SAMPLE_SPELLS: SpellCard[] = [
  {
    id: 'spell-1',
    name: 'Disparo de Éter Rúnico',
    classification: 'Grau I - Arcano',
    magicCost: '10 PM',
    type: 'Ofensivo / Cinético',
    range: '18 metros',
    useLimit: 'À vontade',
    description: 'Canaliza a energia mística de Nexaria liberando um feixe de força pura.',
    effects: 'Causa 2d6 de dano mágico.',
    notes: 'Requer linha de visão desobstruída.',
    iconEmoji: '⚡',
  },
  {
    id: 'spell-2',
    name: 'Barreira Protetora',
    classification: 'Grau I - Defensivo',
    magicCost: '10 PM',
    type: 'Defensivo',
    range: 'Pessoal',
    useLimit: '1x por combate',
    description: 'Ergue uma barreira cintilante ao redor do conjurador.',
    effects: '+4 na Classe de Armadura contra o próximo ataque.',
    notes: 'Dura 1 rodada.',
    iconEmoji: '🛡️',
  },
];

export const SAMPLE_MARKET_ITEMS: ShopItem[] = [
  {
    id: 'item-1',
    name: 'Poção de Cura',
    category: 'pocao',
    description: 'Restaura instantaneamente 15 Pontos de Vida.',
    price: 10,
    currency: 'BRZ',
    stock: 10,
    icon: '🧪',
  },
  {
    id: 'item-2',
    name: 'Frasco de Mana',
    category: 'pocao',
    description: 'Restaura 15 Pontos de Mana.',
    price: 2,
    currency: 'PRT',
    stock: 5,
    icon: '💧',
  },
  {
    id: 'item-3',
    name: 'Espada de Ferro Nobre',
    category: 'arma',
    description: 'Arma bem equilibrada forjada nos armazéns de Nexaria.',
    price: 5,
    currency: 'PRT',
    stock: 3,
    icon: '⚔️',
  },
];

export const INITIAL_CHARACTERS: CharacterSheet[] = [];

export const INITIAL_DEFAULT_CAMPAIGN: CampaignRoom = {
  code: 'NEXARIA-01',
  name: 'Nexaria — O Legado do Abismo',
  gmName: 'Mestre do Jogo',
  description: 'Mesa de RPG oficial de Nexaria — O Legado do Abismo. Gestão monetária de Bronze, Prata, Ouro, Platina e Cybermoedas.',
  createdAt: Date.now(),
  startingWallet: {
    BRZ: 50,
    PRT: 10,
    ORO: 2,
    PLN: 0,
    CYB: 0,
  },
  gmWallet: {
    BRZ: 1000,
    PRT: 250,
    ORO: 50,
    PLN: 10,
    CYB: 5,
  },
  players: [],
  transactions: [],
  marketItems: SAMPLE_MARKET_ITEMS,
  paymentRequests: [],
};
