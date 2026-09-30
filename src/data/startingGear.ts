import {
  CurrencyType,
  InventoryItem,
  ItemCategory,
} from '../types/rpg';

export interface FightingStyle {
  id: string;
  name: string;
  category: 'Corpo-a-Corpo' | 'À Distância' | 'Defesa & Tática' | 'Mágico & Místico' | 'Caótico & Proibido' | 'Especial';
  description: string;
  effectText: string;
  recommendedFor: string;
  icon: string;
}

export interface StartingWeapon {
  id: string;
  name: string;
  category: string;
  damage: string;
  damageType: 'Cortante' | 'Perfurante' | 'Contundente' | 'Mágico' | 'Fogo' | 'Energia' | 'Nenhum';
  properties: string;
  weightKg: number;
  valueAmount: number;
  valueCurrency: CurrencyType;
  icon: string;
  description: string;
  baseDurability: number;
  isNoneOption?: boolean;
}

/**
 * Calcula a durabilidade máxima escalada pela experiência e nível do jogador.
 * Jogadores novatos e inexperientes (Nível 1, 0 EXP, atributos baixos) sofrem com desgaste rápido e risco de quebra.
 * Conforme o jogador acumula Experiência (EXP), níveis e bom manejo físico (FOR/DES), ele aprende a
 * golpear no alinhamento correto, aparar com a guarda em vez do fio e fazer manutenção de campo,
 * fazendo com que armas físicas durem muito mais e aguentem impactos contínuos.
 */
export function calculateScaledDurability(
  baseDurability: number,
  level: number = 1,
  experience: number = 0,
  attrBonus: number = 0,
  fightingStyleId?: string
): {
  current: number;
  max: number;
  bonusText: string;
  bonusValue: number;
  tierLabel: string;
  preservationRate: number;
} {
  if (baseDurability <= 0) {
    return {
      current: 0,
      max: 0,
      bonusText: 'Sem durabilidade (Inquebrável / Desarmado)',
      bonusValue: 0,
      tierLabel: 'Inquebrável',
      preservationRate: 1.0,
    };
  }

  // Bônus por nível: veteranos aprendem técnicas de corte sem lascar o gume (+2 por nível acima do 1º)
  const levelBonus = Math.max(0, (level - 1) * 2);

  // Bônus por experiência acumulada (+1 a cada 250 pontos de EXP)
  const expBonus = Math.floor(Math.max(0, experience) / 250);

  // Modificador físico (FOR ou DES): personagens com boa coordenação/força evitam empenar o aço
  // Se o modificador for negativo (ex: -1), o personagem inábil desgasta mais a arma (-1 de durabilidade máxima inicial)
  const attrModifierBonus = attrBonus;

  // Bônus por estilo de luta especializado em conservação de lâmina
  const styleBonus = fightingStyleId === 'guarda_ferro_desgastado' ? 4 : 0;

  const totalBonus = levelBonus + expBonus + attrModifierBonus + styleBonus;
  // A durabilidade mínima nunca cai abaixo de 5
  const maxDurability = Math.max(5, baseDurability + totalBonus);

  let bonusText = 'Durabilidade Básica de Recruta';
  let tierLabel = 'Recruta Iniciante';
  let preservationRate = 1.0;

  if (totalBonus > 0) {
    const parts: string[] = [];
    if (levelBonus > 0) parts.push(`+${levelBonus} por Nvl ${level}`);
    if (expBonus > 0) parts.push(`+${expBonus} por ${experience} EXP`);
    if (attrModifierBonus > 0) parts.push(`+${attrModifierBonus} por Manejo`);
    if (styleBonus > 0) parts.push(`+${styleBonus} por Guarda Angular`);
    bonusText = `+${totalBonus} Durabilidade Máx (${parts.join(' • ')})`;
    tierLabel = 'Aventureiro Experiente';
    preservationRate = 1.25;
  } else if (totalBonus < 0) {
    bonusText = `${totalBonus} Durabilidade (Manejo Inexperiente / Penalidade)`;
    tierLabel = 'Inexperiente (Risco de Lascar)';
    preservationRate = 0.8;
  }

  if (level >= 5 || experience >= 2000) {
    tierLabel = 'Mestre Veterano (Fio Impecável)';
    preservationRate = 1.5;
  } else if (level >= 3 || experience >= 750 || totalBonus >= 4) {
    tierLabel = 'Combatente Prático (Boa Conservação)';
    preservationRate = 1.35;
  }

  return {
    current: maxDurability,
    max: maxDurability,
    bonusText,
    bonusValue: totalBonus,
    tierLabel,
    preservationRate,
  };
}

/**
 * Função de desgaste em combate: consome durabilidade considerando a taxa de conservação da experiência.
 */
export function degradeDurability(
  current: number,
  preservationRate: number = 1.0
): { newCurrent: number; degraded: boolean; message: string } {
  if (current <= 0) {
    return { newCurrent: 0, degraded: false, message: 'Arma já quebrada / sem fio!' };
  }
  // Se a taxa de preservação for alta (> 1.2), o jogador tem chance de aparar sem perder fio
  if (preservationRate > 1.2 && Math.random() < 0.25) {
    return {
      newCurrent: current,
      degraded: false,
      message: '✨ Golpe limpo! Sua experiência em combate evitou lascar a lâmina (0 de desgaste).',
    };
  }
  const next = Math.max(0, current - 1);
  return {
    newCurrent: next,
    degraded: true,
    message: next === 0 ? '⚠️ A arma perdeu todo o fio e quebrou!' : `Golpe desferido. Durabilidade: ${next} pts.`,
  };
}

/**
 * Afia ou faz manutenção de campo na lâmina com base na perícia do jogador.
 */
export function sharpenDurability(
  current: number,
  max: number,
  amount: number = 3
): { newCurrent: number; repairedAmount: number; message: string } {
  if (current >= max) {
    return { newCurrent: max, repairedAmount: 0, message: 'O fio da arma já está no limite máximo de conservação.' };
  }
  const next = Math.min(max, current + amount);
  const repaired = next - current;
  return {
    newCurrent: next,
    repairedAmount: repaired,
    message: `Lâmina afiada e ajustada com sucesso! Recuperou +${repaired} pontos de durabilidade (${next}/${max}).`,
  };
}

export function getDurabilityStatus(current: number, max: number): {
  label: string;
  colorClass: string;
  bgClass: string;
  barColor: string;
  percentage: number;
} {
  if (max <= 0) {
    return { label: 'Inquebrável', colorClass: 'text-zinc-400', bgClass: 'bg-zinc-800', barColor: 'bg-zinc-500', percentage: 100 };
  }
  const pct = Math.max(0, Math.min(100, Math.round((current / max) * 100)));
  if (current <= 0) {
    return { label: 'Quebrada (Sem Fio)', colorClass: 'text-red-500 font-bold', bgClass: 'bg-red-950/80', barColor: 'bg-red-600', percentage: 0 };
  }
  if (pct <= 25) {
    return { label: 'Quase Quebrando (Crítica)', colorClass: 'text-red-400 font-bold animate-pulse', bgClass: 'bg-red-950/50', barColor: 'bg-red-500', percentage: pct };
  }
  if (pct <= 55) {
    return { label: 'Desgastada / Gasta', colorClass: 'text-amber-400 font-medium', bgClass: 'bg-amber-950/40', barColor: 'bg-amber-500', percentage: pct };
  }
  if (pct <= 80) {
    return { label: 'Fio Bom', colorClass: 'text-yellow-300', bgClass: 'bg-yellow-950/30', barColor: 'bg-yellow-400', percentage: pct };
  }
  return { label: 'Impecável / Conservada', colorClass: 'text-emerald-400 font-semibold', bgClass: 'bg-emerald-950/30', barColor: 'bg-emerald-500', percentage: pct };
}

export const FIGHTING_STYLES: FightingStyle[] = [
  // ── Corpo-a-Corpo ──
  {
    id: 'duelo_precisao',
    name: 'Duelo Gracioso (Duelista)',
    category: 'Corpo-a-Corpo',
    description: 'Foco técnico na esgrima e manejo refinado de lâmina em mão única.',
    effectText: '+2 nas jogadas de dano com arma de uma mão e +1 na CA ao aparar ataques.',
    recommendedFor: 'Espadachins, Guerreiros, Ladinos, Paladinos',
    icon: '🤺',
  },
  {
    id: 'duas_armas_turbilhao',
    name: 'Combate com Duas Armas (Turbilhão Ambidestro)',
    category: 'Corpo-a-Corpo',
    description: 'Ataques contínuos fluídos alternando armas em ambas as mãos.',
    effectText: 'Soma o modificador de atributo no dano do segundo ataque da mão inábil e ganha +1 na CA.',
    recommendedFor: 'Dervixes, Ladinos, Bárbaros, Ninjas',
    icon: '⚔️',
  },
  {
    id: 'laminas_gemeas_lascadas',
    name: 'Lâminas Gêmeas de Sarjeta (Faca & Adaga)',
    category: 'Corpo-a-Corpo',
    description: 'Manejo desordenado e visceral de lâminas curtas ou cacos pontiagudos.',
    effectText: 'Ao desferir ataque com armas leves duplas, se o primeiro golpe errar, o segundo ganha +2 no acerto.',
    recommendedFor: 'Ladinos, Assassinos, Fanáticos, Dervixes',
    icon: '🗡️',
  },
  {
    id: 'armas_pesadas_demolidor',
    name: 'Armas Pesadas & Impacto Brutal (Demolidor)',
    category: 'Corpo-a-Corpo',
    description: 'Golpes com todo o peso do corpo usando machados e barras de ferro.',
    effectText: 'Ao rolar 1 ou 2 no dado de dano com armas de duas mãos, pode rerrolar e usar o novo resultado.',
    recommendedFor: 'Bárbaros, Guerreiros Pesados, Titãs',
    icon: '🪓',
  },
  {
    id: 'combate_desarmado_tita',
    name: 'Combate Desarmado (Punhos de Titã & Garras)',
    category: 'Corpo-a-Corpo',
    description: 'Transforma socos, cotoveladas, mandíbulas ou garras em armas letais.',
    effectText: 'Golpes desarmados causam 1d6 + FOR/DES (em vez de 1 de dano) e vantagem para Agarrar e Derrubar.',
    recommendedFor: 'Monges, Pugilistas, Lobisomens, Insetóides',
    icon: '🥊',
  },
  {
    id: 'pancada_taberna_quebra_ossos',
    name: 'Pancadaria de Taberna & Chave de Braço',
    category: 'Corpo-a-Corpo',
    description: 'Luta corporal rústica focada em derrubar, imobilizar e quebrar articulações.',
    effectText: 'Seus agarrões causam 1d4 de dano contundente automático por turno; oponentes imobilizados têm desvantagem em testes de FOR.',
    recommendedFor: 'Bárbaros, Pugilistas, Cozinheiros de Batalha, Ogros',
    icon: '🍺',
  },
  {
    id: 'guarda_meia_espada_mordhau',
    name: 'Meia-Espada & Pancada de Pomo (Mordhau)',
    category: 'Corpo-a-Corpo',
    description: 'Segura a lâmina com as mãos enfaixadas para golpear armaduras pesadas usando o pomo como malho.',
    effectText: 'Permite converter dano cortante em contundente com +2 no acerto contra inimigos de armadura pesada ou carapaça.',
    recommendedFor: 'Espadachins, Cavaleiros, Guerreiros, Paladinos',
    icon: '🗡️',
  },
  {
    id: 'escudo_investida',
    name: 'Mestre do Escudo & Investida (Tromba de Aço)',
    category: 'Corpo-a-Corpo',
    description: 'Usa a borda do escudo ativamente como ariete de contusão em combate.',
    effectText: 'Ataque com o escudo causa 1d4 + FOR contundente e pode derrubar ou empurrar alvos a até 3 metros.',
    recommendedFor: 'Guardiões, Paladinos, Legionários',
    icon: '🛡️',
  },
  {
    id: 'lamina_invertida',
    name: 'Lâmina Invertida & Retaliação (Gyakute)',
    category: 'Corpo-a-Corpo',
    description: 'Empunhadura reversa focada em interceptação rápida e contra-golpes secos.',
    effectText: '+2 em iniciativa; após uma esquiva bem-sucedida, pode desferir um contra-ataque de oportunidade.',
    recommendedFor: 'Shinobis, Assassinos, Kenseis',
    icon: '🥷',
  },
  {
    id: 'luta_suja_taberna',
    name: 'Luta Suja & Improviso de Taberna',
    category: 'Corpo-a-Corpo',
    description: 'Sem regras de honra: arremessa areia nos olhos, usa canecas, cadeiras e cabeçadas.',
    effectText: 'Armas improvisadas causam +1d4 de dano; 1x por combate ofusca um inimigo por 1 rodada com terra ou bebida.',
    recommendedFor: 'Pugilistas, Cozinheiros de Batalha, Fora-da-Lei',
    icon: '🍺',
  },
  {
    id: 'matilha_flanco',
    name: 'Ataque de Matilha & Flanco (Lobo Cinzento)',
    category: 'Corpo-a-Corpo',
    description: 'Táticas coordenadas de caça que exploram alvos cercados ou distraídos.',
    effectText: 'Ganha vantagem em jogadas de ataque corpo a corpo contra inimigos adjacentes a pelo menos um aliado.',
    recommendedFor: 'Lobisomens, Rangers, Guerreiros, Mirmecóides',
    icon: '🐺',
  },
  {
    id: 'garra_mordida_feral',
    name: 'Instinto Feral & Mordida Dilaceradora',
    category: 'Corpo-a-Corpo',
    description: 'Combate animalesco usando dentes, garras naturais e saltos predatórios.',
    effectText: 'Acertos críticos restauram 1d4 de Stamina/Vigor e causam sangramento contínuo de 2 de dano por rodada durante 2 rodadas.',
    recommendedFor: 'Lobisomens, Homens-Fera, Metamorfos, Druidas',
    icon: '🐾',
  },

  // ── À Distância ──
  {
    id: 'arqueria_precisao',
    name: 'Arqueria de Precisão (Mestre do Tiro)',
    category: 'À Distância',
    description: 'Olhos de águia e postura estática infalível para tiros letais.',
    effectText: '+2 em testes de ataque à distância; ignora meia cobertura de inimigos.',
    recommendedFor: 'Arqueiros, Rangers, Pistoleiros, Caçadores',
    icon: '🏹',
  },
  {
    id: 'franco_atirador_emboscada',
    name: 'Franco-Atirador Camuflado (Tiro Oculto)',
    category: 'À Distância',
    description: 'Respiração controlada e camuflagem para disparar tiros mortais a longa distância.',
    effectText: 'Se estiver escondido, o primeiro disparo ganha +1d8 de dano perfurante e errar o tiro não revela sua posição exata.',
    recommendedFor: 'Rangers, Caçadores de Feras, Franco-Atiradores, Elfos',
    icon: '🌲',
  },
  {
    id: 'tiro_queima_roupa',
    name: 'Tiro à Queima-Roupa (Gunslinger & Pederneira)',
    category: 'À Distância',
    description: 'Manejo ágil de pistolas, mosquetes e bestas mesmo prensado no mano-a-mano.',
    effectText: 'Atirar a até 1,5m de um inimigo não impõe desvantagem; +2 de dano contra alvos a menos de 4,5m.',
    recommendedFor: 'Pistoleiros, Mosqueteiros, Hackers, Caçadores',
    icon: '🔫',
  },
  {
    id: 'funda_seixos_pastor',
    name: 'Mestre da Funda & Seixos de Rio (Estilo Pastor)',
    category: 'À Distância',
    description: 'Técnica camponesa milenar de girar tiras de couro e lançar pedras com força de bala.',
    effectText: 'Fundas causam 1d6 (em vez de 1d4) e acertos críticos no crânio atordoam o alvo por 1 rodada.',
    recommendedFor: 'Monges, Bardos, Camponeses, Exploradores',
    icon: '🪨',
  },
  {
    id: 'arremesso_relampago',
    name: 'Arremesso Relâmpago de Lâminas (Mestre das Facas)',
    category: 'À Distância',
    description: 'Saque relâmpago de facas, machadinhas e estilhaços direto para arremesso.',
    effectText: 'Sacar armas leves de arremesso é ação livre; adiciona +2 de dano em ataques arremessados.',
    recommendedFor: 'Ladinos, Shinobis, Assassinos',
    icon: '🗡️',
  },
  {
    id: 'arremesso_lança_primal',
    name: 'Lança Arremessada de Caça (Dardo Pesado)',
    category: 'À Distância',
    description: 'Arremesso potente de lanças e forquilhas usando a envergadura e força do tronco.',
    effectText: 'Dobra o alcance normal de arremesso de lanças; acertos a mais de 6 metros somam o modificador de FOR em dobro.',
    recommendedFor: 'Lanceiros, Caçadores, Bárbaros, Mirmecóides',
    icon: '🔱',
  },
  {
    id: 'chuva_disparos',
    name: 'Chuva de Disparos & Recarga Ágil (Rajada de Corda)',
    category: 'À Distância',
    description: 'Ritmo acelerado para armar e disparar flechas e virotes sem interrupção.',
    effectText: 'Pode abrir mão de metade do bônus de dano para disparar contra um segundo inimigo no mesmo turno.',
    recommendedFor: 'Arqueiros, Caçadores de Feras',
    icon: '🎯',
  },

  // ── Defesa & Tática ──
  {
    id: 'defesa_inquebravel',
    name: 'Defesa Inquebrável (Guardião)',
    category: 'Defesa & Tática',
    description: 'Postura sólida como rocha, priorizando a sobrevivência e proteção mútua.',
    effectText: '+1 fixo na CA enquanto usar armadura ou carapaça natural; impõe desvantagem em ataques contra aliados a 1,5m.',
    recommendedFor: 'Tanques, Paladinos, Guerreiros, Construtos',
    icon: '🛡️',
  },
  {
    id: 'guarda_ferro_desgastado',
    name: 'Guarda Angular & Conservação de Lâmina',
    category: 'Defesa & Tática',
    description: 'Apara golpes desviando impactos pela guarda angular, preservando o gume de armas gastas.',
    effectText: '+1 na CA com armas corpo a corpo e concede +4 de durabilidade máxima a qualquer arma física empunhada, reduzindo desgaste.',
    recommendedFor: 'Guerreiros Rústicos, Espadachins Pobres, Veteranos de Infantaria',
    icon: '🛡️',
  },
  {
    id: 'postura_ourico_anti_carga',
    name: 'Postura de Ouriço (Muralha Anti-Carga)',
    category: 'Defesa & Tática',
    description: 'Trava a base da haste no solo com o calcanhar, recebendo cargas inimigas na ponta da lança.',
    effectText: 'Inimigos que investirem contra você disparam reação imediata que causa dano dobrado se atingir.',
    recommendedFor: 'Lanceiros, Guardiões de Muralha, Sentinelas',
    icon: '🔱',
  },
  {
    id: 'haste_sentinela',
    name: 'Armas de Haste & Alcance (Sentinela da Linha)',
    category: 'Defesa & Tática',
    description: 'Mantém inimigos a distância segura com lanças, forquilhas e piques.',
    effectText: 'Ataques de oportunidade são disparados quando um oponente entrar no seu alcance de ameaça.',
    recommendedFor: 'Guardas, Lanceiros, Sentinelas, Mirmecóides',
    icon: '🔱',
  },
  {
    id: 'lider_tatico',
    name: 'Guerra Tática & Comando (Líder Militar)',
    category: 'Defesa & Tática',
    description: 'Visão de batalha ampla e coordenação precisa das forças do grupo.',
    effectText: '1x por rodada (ação bônus), concede +1d4 de bônus no ataque ou teste de um aliado a até 9 metros.',
    recommendedFor: 'Comandantes, Clérigos, Paladinos, Nobres',
    icon: '🚩',
  },
  {
    id: 'baluarte_vivo',
    name: 'Baluarte Vivo & Interceptação Heroica',
    category: 'Defesa & Tática',
    description: 'Coloca o próprio corpo e escudo na frente do golpe direcionado ao companheiro.',
    effectText: 'Ao ver um aliado a até 2m sofrer dano, pode gastar reação para absorver metade desse dano.',
    recommendedFor: 'Paladinos, Guardiões de Muralha, Titãs',
    icon: '🧱',
  },
  {
    id: 'firmeza_inflexivel',
    name: 'Firmeza Inflexível (Raízes da Montanha)',
    category: 'Defesa & Tática',
    description: 'Centro de gravidade rebaixado e pernas travadas como raízes centenárias.',
    effectText: 'Imune a ser derrubado, empurrado ou desarmado involuntariamente se estiver tocando o chão sólido.',
    recommendedFor: 'Anões, Escaravelhos, Monges, Bárbaros',
    icon: '🏔️',
  },

  // ── Mágico & Místico ──
  {
    id: 'canalizador_arcano',
    name: 'Canalizador Arcano (Lâmina Mágica)',
    category: 'Mágico & Místico',
    description: 'Harmoniza a arma física como condutor e foco para canalizar feitiços.',
    effectText: 'Usa a arma como foco arcano; acertos críticos liberam +1d6 de dano mágico elemental.',
    recommendedFor: 'Espadachins Arcanos, Magos de Batalha, Bruxos',
    icon: '✨',
  },
  {
    id: 'lamina_runica_sangue',
    name: 'Runa de Sangue em Ferro Gasto',
    category: 'Mágico & Místico',
    description: 'Passa a mão pelo ferro oxidado, nutrindo as runas dormentes com essência vital.',
    effectText: 'Gasta 2 PV para imbuir a arma por 3 rodadas com +1d6 de dano necrótico e gume encantado afiado.',
    recommendedFor: 'Hemomantes, Bruxos de Sangue, Cavaleiros Rúnicos',
    icon: '🩸',
  },
  {
    id: 'cinco_elementos_monastico',
    name: 'Punhos dos Cinco Elementos Primal',
    category: 'Mágico & Místico',
    description: 'Canaliza terra, fogo, água, vento e éter na ponta dos punhos e pés descalços.',
    effectText: 'Permite alternar o dano desarmado livremente entre Fogo, Frio, Relâmpago ou Contundente.',
    recommendedFor: 'Monges, Psiônicos, Slimes, Construtos',
    icon: '⚡',
  },
  {
    id: 'golpe_elemental',
    name: 'Golpe Elemental Espiritual (Ki Cósmico)',
    category: 'Mágico & Místico',
    description: 'Concentra centelhas de energia elemental bruta na ponta dos punhos ou armas.',
    effectText: 'Gastando 1 PM por ataque, soma +1d6 de dano elemental (fogo, frio ou raio) ao impacto.',
    recommendedFor: 'Monges Elementais, Espadachins Arcanos, Druidas',
    icon: '⚡',
  },
  {
    id: 'danca_sombras',
    name: 'Dança das Sombras Etéreas (Passo Umbral)',
    category: 'Mágico & Místico',
    description: 'Desvanece na escuridão entre golpes, ressurgindo nas costas do inimigo.',
    effectText: 'Ao acertar um golpe em penumbra ou noite, pode saltar instantaneamente até 4,5m em outra sombra.',
    recommendedFor: 'Shinobis, Necromantes, Bruxos',
    icon: '🌑',
  },

  // ── Caótico & Proibido ──
  {
    id: 'lamina_suja_esgoto',
    name: 'Lâmina Suja & Toxina de Esgoto (Tétano & Pústula)',
    category: 'Caótico & Proibido',
    description: 'Esfrega ferrugem e lodo contaminado no gume para infectar cortes superficiais.',
    effectText: 'Golpes com armas enferrujadas forçam teste de CON inimigo (CD 11 + Nível) ou causam envenenamento por 2 rodadas.',
    recommendedFor: 'Ratos de Esgoto, Ladinos, Necromantes, Fora-da-Lei',
    icon: '☣️',
  },
  {
    id: 'mecanica_improvisada_artifice',
    name: 'Sobrecarga Balística & Gambiarra Mecânica',
    category: 'Caótico & Proibido',
    description: 'Aperta molas e estica cordas além da especificação para disparos super-potentes.',
    effectText: 'Pode declarar disparo sobrecarregado (+2d6 de dano); se rolar 1 natural no d20, a arma sofre 3 de perda de durabilidade.',
    recommendedFor: 'Artífices, Pistoleiros, Engenheiros, Tecnomagos',
    icon: '⚙️',
  },
  {
    id: 'caotico_risco_fatal',
    name: 'Estilo Proibido (Risco Fatal & Sangria)',
    category: 'Caótico & Proibido',
    description: 'Ignora a própria autopreservação para desferir danos avassaladores.',
    effectText: 'Pode aceitar -2 na sua CA até a próxima rodada para somar +1d8 de dano no seu próximo acerto.',
    recommendedFor: 'Hemomantes, Bruxos, Fanáticos, Trapaceiros',
    icon: '🩸',
  },
  {
    id: 'danca_macabra_foice',
    name: 'Dança Macabra da Foice (Ceifador de Almas)',
    category: 'Caótico & Proibido',
    description: 'Aproveita o embalo do abate mortal para ceifar o próximo pescoço.',
    effectText: 'Ao reduzir uma criatura a 0 PV, recebe imediatamente um ataque extra gratuito contra outro alvo próximo.',
    recommendedFor: 'Cavaleiros do Apocalipse, Necromantes, Ronins',
    icon: '💀',
  },

  // ── Especial & Primal ──
  {
    id: 'mandibula_esmagadora_inseto',
    name: 'Mandíbula de Quitina & Pressão de Colmeia',
    category: 'Especial',
    description: 'Pressão biomecânica esmagadora típica de insetos soldados que partem armaduras.',
    effectText: 'Críticos esmagam proteções: reduzem em 1 a CA de escudos/armaduras inimigas e desequilibram o alvo.',
    recommendedFor: 'Mirmecóides, Mantídeos, Escaravelhos, Homens-Inseto',
    icon: '🐜',
  },
  {
    id: 'danca_bebado_trapaceiro',
    name: 'Dança do Bêbado & Finta Caótica',
    category: 'Especial',
    description: 'Tropeços calculados, cambalhotas tortas e oscilações imprevisíveis.',
    effectText: '1x por rodada, quando um inimigo errar um ataque contra você, ele perde o equilíbrio e concede vantagem ao seu próximo golpe.',
    recommendedFor: 'Monges Bêbados, Trapaceiros, Bardos, Cozinheiros',
    icon: '🍶',
  },
  {
    id: 'acrobacia_finta',
    name: 'Acrobacia & Finta (Esgrimista Evasivo)',
    category: 'Especial',
    description: 'Movimentos dançantes, saltos e passos laterais que confundem o oponente.',
    effectText: 'Ao acertar um ataque corpo a corpo, você não provoca ataques de oportunidade desse alvo na rodada.',
    recommendedFor: 'Bardos, Dançarinos das Lâminas, Kenseis, Shinobis',
    icon: '🌀',
  },
  {
    id: 'emboscador_sombras',
    name: 'Predador das Sombras (Golpe Oculto)',
    category: 'Especial',
    description: 'Ataques cirúrgicos desferidos a partir de esconderijos e pontos cegos.',
    effectText: '+1d8 de dano extra em ataques desferidos contra alvos surpresos ou antes do primeiro turno deles.',
    recommendedFor: 'Ladinos, Assassinos, Rangers, Shinobis',
    icon: '🗡️',
  },
  {
    id: 'predador_colmeia',
    name: 'Ataque Predatório da Colmeia (Pinças & Mandíbulas)',
    category: 'Especial',
    description: 'Golpes que visam articulações e juntas de armaduras com ferocidade insetóide.',
    effectText: 'Acertos críticos lascam armaduras inimigas, reduzindo temporariamente a CA do alvo em 1.',
    recommendedFor: 'Mirmecóides, Mantis, Guardiões Mandibulares',
    icon: '🐜',
  },
  {
    id: 'adaptabilidade_primal',
    name: 'Adaptabilidade Instintiva (Improvisador Primal)',
    category: 'Especial',
    description: 'Capacidade de usar qualquer objeto, terreno ou postura de forma letal instantaneamente.',
    effectText: 'Qualquer item do ambiente é arma letal (1d6); ganha +2 em iniciativa e percepção passiva.',
    recommendedFor: 'Cozinheiros de Batalha, Alquimistas, Slimes, Aventureiros',
    icon: '🎲',
  },
];

export const STARTING_WEAPONS: StartingWeapon[] = [
  {
    id: 'weapon_none',
    name: '🚫 Nenhuma Arma Inicial (Lutador Desarmado / Foco Puro)',
    category: 'Sem Arma',
    damage: '1 + FOR (ou 1d6 desarmado)',
    damageType: 'Contundente',
    properties: 'Mãos Livres, Foco Espiritual, Sem Peso, Inquebrável',
    weightKg: 0,
    valueAmount: 0,
    valueCurrency: 'BRZ',
    icon: '✋',
    baseDurability: 0,
    description: 'O personagem entra em combate de mãos vazias, confiando em punhos, garras ancestrais, artes marciais, mandíbulas, magias inatas ou juntará moedas para comprar no mercado da campanha.',
    isNoneOption: true,
  },
  {
    id: 'espada_ferro_enferrujada',
    name: 'Espada de Ferro Enferrujada',
    category: 'Lâmina Rústica',
    damage: '1d6 (1 mão) / 1d8 (2 mãos)',
    damageType: 'Cortante',
    properties: 'Versátil, Oxidada, Gume Lascado',
    weightKg: 1.6,
    valueAmount: 3,
    valueCurrency: 'BRZ',
    icon: '🗡️',
    baseDurability: 20,
    description: 'Lâmina de ferro com manchas avermelhadas de óxido e lascas no gume. Fio irregular que perde corte se mal manejada.',
  },
  {
    id: 'espada_curta_ferro_velho',
    name: 'Espada Curta de Ferro Velho e Desgastado',
    category: 'Lâmina Curta',
    damage: '1d6',
    damageType: 'Perfurante',
    properties: 'Leve, Acuidade, Cabo com Trapos, Sem Bainha',
    weightKg: 1.1,
    valueAmount: 2,
    valueCurrency: 'BRZ',
    icon: '🗡️',
    baseDurability: 18,
    description: 'Espada curta resgatada de um campo de batalha esquecido. O ferro está escurecido e o cabo foi enrolado com trapos velhos.',
  },
  {
    id: 'adaga_velha_desgastada',
    name: 'Adaga Velha Lascada com Ponta Torta',
    category: 'Lâmina Curta',
    damage: '1d4',
    damageType: 'Perfurante',
    properties: 'Acuidade, Leve, Ponta Empenada, Arremesso (4m)',
    weightKg: 0.5,
    valueAmount: 1,
    valueCurrency: 'BRZ',
    icon: '🗡️',
    baseDurability: 16,
    description: 'Faca curta com ponta ligeiramente torta e manchas de gordura antiga. Serve para estocar e cortar cordas.',
  },
  {
    id: 'faca_cozinha_envelhecida',
    name: 'Faca de Cozinha Envelhecida com Manchas',
    category: 'Lâmina Doméstica',
    damage: '1d4',
    damageType: 'Cortante',
    properties: 'Leve, Acuidade, Fio Gasto de Cortar Carnes',
    weightKg: 0.4,
    valueAmount: 1,
    valueCurrency: 'BRZ',
    icon: '🔪',
    baseDurability: 14,
    description: 'Faca pesada de cortar carnes e ossos de animais de criação. Apresenta manchas escuras e cabo de madeira rachado.',
  },
  {
    id: 'machadinha_rustica_lenhador',
    name: 'Machadinha Rústica de Lenhador Usada',
    category: 'Machado Rústico',
    damage: '1d6 (1 mão) / 1d8 (2 mãos)',
    damageType: 'Cortante',
    properties: 'Versátil, Cabeça com Farpas, Áspera',
    weightKg: 2.0,
    valueAmount: 2,
    valueCurrency: 'BRZ',
    icon: '🪓',
    baseDurability: 22,
    description: 'Ferramenta de podar lenha com cabeça de ferro fundido gasta pelo uso rural. O cabo de madeira tem nós e farpas.',
  },
  {
    id: 'porrete_madeira_lascada',
    name: 'Porrete de Madeira Lascada com Pregos',
    category: 'Arma Bruta',
    damage: '1d6',
    damageType: 'Contundente',
    properties: 'Pesada, Farpas de Madeira, Pregos Tortos',
    weightKg: 1.8,
    valueAmount: 1,
    valueCurrency: 'BRZ',
    icon: '🪵',
    baseDurability: 20,
    description: 'Galho grosso com pregos enferrujados cravados na ponta. Arma tosca de quem não possuía moedas para lâminas de ferreiro.',
  },
  {
    id: 'clava_galho_pesado',
    name: 'Clava Rústica de Nó de Carvalho',
    category: 'Contusão Pesada',
    damage: '1d8',
    damageType: 'Contundente',
    properties: 'Pesada, Duas Mãos, Desbalanceada',
    weightKg: 3.2,
    valueAmount: 1,
    valueCurrency: 'BRZ',
    icon: '🪵',
    baseDurability: 24,
    description: 'Tronco curto arrancado de uma raiz densa. Pesa bastante e esmaga pela massa bruta sem necessitar de fio afiado.',
  },
  {
    id: 'florete_amassado_treino',
    name: 'Florete Amassado de Sala de Treino',
    category: 'Lâmina Fina',
    damage: '1d6',
    damageType: 'Perfurante',
    properties: 'Acuidade (Finesse), Empenado, Sem Guarda Nobre',
    weightKg: 1.0,
    valueAmount: 3,
    valueCurrency: 'BRZ',
    icon: '🤺',
    baseDurability: 16,
    description: 'Lâmina de ferro fosca e ligeiramente torta, sem cesto de proteção decorado. Consegue estocar, mas estala sob choques fortes.',
  },
  {
    id: 'katana_lascada_segunda_mao',
    name: 'Katana Lascada de Segunda Mão',
    category: 'Lâmina Oriental',
    damage: '1d6 (1 mão) / 1d8 (2 mãos)',
    damageType: 'Cortante',
    properties: 'Acuidade (Finesse), Dentes no Fio, Têmpera Gasta',
    weightKg: 1.3,
    valueAmount: 4,
    valueCurrency: 'BRZ',
    icon: '🗡️',
    baseDurability: 18,
    description: 'Lâmina oriental antiga com dentes no gume e cabo sem trançado de seda nobre. O aço perdeu a têmpera lendária de outrora.',
  },
  {
    id: 'cimitarra_curva_ferrugem',
    name: 'Cimitarra Curva com Pontos de Ferrugem',
    category: 'Lâmina Curva',
    damage: '1d6',
    damageType: 'Cortante',
    properties: 'Leve, Acuidade, Curva Desbalanceada',
    weightKg: 1.2,
    valueAmount: 3,
    valueCurrency: 'BRZ',
    icon: '🗡️',
    baseDurability: 18,
    description: 'Sabre curvo das caravanas do deserto abandonado nas areias. O aço tem picadas de ferrugem marrom ao longo do dorso.',
  },
  {
    id: 'facas_acougueiro_gastas',
    name: 'Par de Facas de Açougueiro Gastas',
    category: 'Facas Duplas',
    damage: '1d4 + 1d4 (par)',
    damageType: 'Cortante',
    properties: 'Leve, Acuidade, Fio Irregular, Dupla',
    weightKg: 1.4,
    valueAmount: 2,
    valueCurrency: 'BRZ',
    icon: '🔪',
    baseDurability: 16,
    description: 'Facas pesadas descartadas de um açougue de vila. Lâminas encardidas com cabo de osso amarrado com barbante de cânhamo.',
  },
  {
    id: 'barra_ferro_bruto',
    name: 'Barra de Ferro Bruto com Empunhadura de Couro',
    category: 'Lâmina Pesada Tosca',
    damage: '1d10',
    damageType: 'Contundente',
    properties: 'Pesada, Duas Mãos, Mal Balanceada',
    weightKg: 3.8,
    valueAmount: 3,
    valueCurrency: 'BRZ',
    icon: '🗡️',
    baseDurability: 26,
    description: 'Barra maciça de ferro fundido forjada sem refino. Esmaga ossos mais pelo peso imposto do que por corte cortante.',
  },
  {
    id: 'arco_curto_rustico',
    name: 'Arco Curto Rústico com Corda Desfiada',
    category: 'À Distância',
    damage: '1d6',
    damageType: 'Perfurante',
    properties: 'Distância (18m/60m), Duas Mãos (+15 flechas tortas)',
    weightKg: 0.9,
    valueAmount: 3,
    valueCurrency: 'BRZ',
    icon: '🏹',
    baseDurability: 16,
    description: 'Arco de freixo ressecado com corda de cânhamo desfiando. Acompanha uma aljava de lona com 15 flechas de haste torta.',
  },
  {
    id: 'besta_sucata_descalibrada',
    name: 'Besta de Sucata Descalibrada',
    category: 'À Distância',
    damage: '1d6',
    damageType: 'Perfurante',
    properties: 'Distância (15m/45m), Gatilho Duro, Recarga (+15 virotes)',
    weightKg: 2.6,
    valueAmount: 4,
    valueCurrency: 'BRZ',
    icon: '🎯',
    baseDurability: 16,
    description: 'Montada com peças de ferro e madeira recuperadas de carcaças. O gatilho é duro e o arco pode ranger sob pressão contínua.',
  },
  {
    id: 'funda_couro_seixos',
    name: 'Funda de Couro Gasto com Seixos do Chão',
    category: 'À Distância Simples',
    damage: '1d4',
    damageType: 'Contundente',
    properties: 'Distância (12m/36m), Leve, Munição Grátis no Solo',
    weightKg: 0.2,
    valueAmount: 1,
    valueCurrency: 'BRZ',
    icon: '🪨',
    baseDurability: 16,
    description: 'Tira de couro de cabra com cordas de sisal. Permite lançar pedras do chão com aceleração centrífuga veloz.',
  },
  {
    id: 'lanca_madeira_amarrada',
    name: 'Lança de Madeira com Lasca de Ferro Amarrada',
    category: 'Haste Rústica',
    damage: '1d6 (1 mão) / 1d8 (2 mãos)',
    damageType: 'Perfurante',
    properties: 'Versátil, Haste, Ponta de Chapa Fina Amarrada',
    weightKg: 1.6,
    valueAmount: 2,
    valueCurrency: 'BRZ',
    icon: '🔱',
    baseDurability: 18,
    description: 'Vara de freixo com uma lâmina curta de metal amarrada com tiras de couro e resina. Excelente alcance, mas a ponta afrouxa.',
  },
  {
    id: 'forquilha_agricola',
    name: 'Forquilha Agrícola de Três Pontas Tortas',
    category: 'Haste Rural',
    damage: '1d6',
    damageType: 'Perfurante',
    properties: 'Haste (2m), Três Pontas Oxidadas',
    weightKg: 2.2,
    valueAmount: 2,
    valueCurrency: 'BRZ',
    icon: '🌾',
    baseDurability: 20,
    description: 'Instrumento de erguer feno e palha na colheita. Os três dentes curvos de ferro retorcido têm manchas escuras de ferrugem.',
  },
  {
    id: 'foice_agricola_desdentada',
    name: 'Foice Agrícola Desdentada de Colheita',
    category: 'Lâmina Agrícola',
    damage: '1d6',
    damageType: 'Cortante',
    properties: 'Acuidade, Gancho de Puxar, Gume Cego',
    weightKg: 1.3,
    valueAmount: 2,
    valueCurrency: 'BRZ',
    icon: '🌾',
    baseDurability: 18,
    description: 'Antiga ferramenta de ceifar trigo e cana. A ponta curva perdeu o gume brilhante e apresenta pequenas mossas no ferro batido.',
  },
  {
    id: 'picareta_mineracao_cega',
    name: 'Picareta de Mineração Cega pelo Carvão',
    category: 'Ferramenta Pesada',
    damage: '1d6',
    damageType: 'Perfurante',
    properties: 'Perfurante, Ponta Arredondada, Cabo Gasto',
    weightKg: 2.4,
    valueAmount: 2,
    valueCurrency: 'BRZ',
    icon: '⛏️',
    baseDurability: 22,
    description: 'Picareta de escavar túneis de carvão. O bico perfurante ficou rombudo após milhares de golpes contra a rocha fria.',
  },
  {
    id: 'malho_pedreiro_trincado',
    name: 'Malho de Pedreiro Trincado com Fissuras',
    category: 'Contusão Rústica',
    damage: '1d6',
    damageType: 'Contundente',
    properties: 'Quebra-Placas, Cabeça Trincada, 1 Mão',
    weightKg: 2.2,
    valueAmount: 2,
    valueCurrency: 'BRZ',
    icon: '🔨',
    baseDurability: 20,
    description: 'Martelo pesado de quebrar blocos de pedra. A cabeça de ferro fundido apresenta pequenas fissuras causadas pelo esforço contínuo.',
  },
  {
    id: 'bastoes_bambu_rachados',
    name: 'Par de Bastões de Bambu Rachados',
    category: 'Arma Dupla Leve',
    damage: '1d4 + 1d4',
    damageType: 'Contundente',
    properties: 'Acuidade, Leve, Flexível, Amarrado com Linha',
    weightKg: 0.8,
    valueAmount: 1,
    valueCurrency: 'BRZ',
    icon: '🥢',
    baseDurability: 15,
    description: 'Dois segmentos de bambu envelhecido com nós reforçados por cordões encerados. Emitem um assobio ao cortar o ar.',
  },
  {
    id: 'escudo_tabua_barril',
    name: 'Escudo de Tábua de Barril com Faixa de Couro',
    category: 'Escudo / Defesa',
    damage: '1d4',
    damageType: 'Contundente',
    properties: '+1 na CA, Tábua Curva, Farpas de Carvalho',
    weightKg: 2.5,
    valueAmount: 2,
    valueCurrency: 'BRZ',
    icon: '🛡️',
    baseDurability: 22,
    description: 'Tampa de um tonel de vinho desmontado com uma alça de couro de porco presa por cravos de cobre. Protege contra golpes diretos.',
  },
  {
    id: 'galho_torto_foco',
    name: 'Galho Torto Seco com Fragmento de Quartzo',
    category: 'Foco Improvisado',
    damage: '1d4 (Físico) / 1d4 (Mágico)',
    damageType: 'Contundente',
    properties: 'Foco Mágico Instável, Galho Frágil',
    weightKg: 0.9,
    valueAmount: 2,
    valueCurrency: 'BRZ',
    icon: '🪄',
    baseDurability: 14,
    description: 'Galho retorcido de árvore morta com uma pedra de quartzo fosca presa na ponta por linha encerada. Conduz estática mística com oscilação.',
  },
  {
    id: 'pistola_pederneira_travando',
    name: 'Pistola de Pederneira Travando com Fuligem',
    category: 'Fogo Rústico',
    damage: '1d8',
    damageType: 'Perfurante',
    properties: 'Distância (12m), Falha na Faísca, Recarga (+15 tiros)',
    weightKg: 1.5,
    valueAmount: 5,
    valueCurrency: 'BRZ',
    icon: '🔫',
    baseDurability: 15,
    description: 'Arma de fogo antiga cujo cão costuma soltar faísca fraca. O cano expele fumaça preta espessa e acumula fuligem após cada disparo.',
  },
  {
    id: 'tiras_pano_punhos',
    name: 'Tiras de Pano Gasto para Punhos de Rua',
    category: 'Desarmado / Proteção',
    damage: '1d4',
    damageType: 'Contundente',
    properties: 'Acoplada, Proteção Básica de Nós de Dedos',
    weightKg: 0.3,
    valueAmount: 1,
    valueCurrency: 'BRZ',
    icon: '🥊',
    baseDurability: 15,
    description: 'Trapos velhos e tiras de lona amarrados firmemente nas mãos para amortecer o choque nos nós dos dedos em brigas de rua.',
  },
  {
    id: 'serra_carpintaria_gasta',
    name: 'Serra de Carpintaria Desdentada',
    category: 'Lâmina Rústica',
    damage: '1d4',
    damageType: 'Cortante',
    properties: 'Dentes Irregulares, Chapa Flexível, Sem Bainha',
    weightKg: 1.1,
    valueAmount: 1,
    valueCurrency: 'BRZ',
    icon: '🪚',
    baseDurability: 14,
    description: 'Lâmina de serrote com pontas oxidadas e dentes tortos. Corta rasgando a carne em vez de corte cirúrgico.',
  },
  {
    id: 'gancho_arpeu_enferrujado',
    name: 'Gancho de Arpéu com Corda Puída',
    category: 'Arma & Gancho',
    damage: '1d4',
    damageType: 'Perfurante',
    properties: 'Arremesso (6m), Gancho de Puxar, Corda Desfiando',
    weightKg: 1.5,
    valueAmount: 2,
    valueCurrency: 'BRZ',
    icon: '🪝',
    baseDurability: 18,
    description: 'Quatro garras de ferro forjado unidas em um olhal com uma corda de cânhamo de 6 metros. Serve para escalar e puxar inimigos.',
  },
];

/**
 * Returns tailored, flavorful starting kit items based on class name and class category.
 */
export function getClassStartingItems(className: string, category?: string): InventoryItem[] {
  const norm = (className || '').toLowerCase();
  const idPrefix = 'kit-' + Math.floor(Math.random() * 10000);

  // 1. Specific matches for popular & core classes
  if (norm.includes('guerreiro') || norm.includes('guardião da muralha')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Pedra de Afiar Rúnica & Óleo Protetor',
        quantity: 1,
        category: 'equipamento',
        description: 'Pedra de cera rúnica para manter a lâmina com fio impecável e remover ferrugem.',
        weightKg: 0.5,
        valueAmount: 4,
        valueCurrency: 'BRZ',
        iconEmoji: '🪨',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Cota de Malha Leve de Batalha',
        quantity: 1,
        category: 'armadura',
        equipped: true,
        description: 'Camisa de anéis de aço entrelaçados que protege o tronco contra cortes e flechadas.',
        effectText: '+2 na Classe de Armadura (CA Leve)',
        weightKg: 4.0,
        valueAmount: 25,
        valueCurrency: 'BRZ',
        iconEmoji: '🛡️',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Cantil Militar de Bronze',
        quantity: 1,
        category: 'geral',
        description: 'Cantil com fecho estanque contendo 1 litro de água fresca de nascente.',
        weightKg: 1.0,
        valueAmount: 2,
        valueCurrency: 'BRZ',
        iconEmoji: '🍶',
      },
    ];
  }

  if (norm.includes('paladino')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Símbolo Sagrado de Platina Radiante',
        quantity: 1,
        category: 'reliquia',
        description: 'Amuleto gravado com o sol da justiça de Eldria, canaliza a graça divina.',
        weightKg: 0.3,
        valueAmount: 15,
        valueCurrency: 'PRT',
        iconEmoji: '✨',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Tabardo Cerimonial com Brasão Dourado',
        quantity: 1,
        category: 'equipamento',
        equipped: true,
        description: 'Tecido fino azul e dourado usado sobre a armadura, identificando sua ordem sagrada.',
        weightKg: 0.5,
        valueAmount: 8,
        valueCurrency: 'BRZ',
        iconEmoji: '⚜️',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Óleo de Unção e Purificação',
        quantity: 2,
        category: 'pocao',
        description: 'Óleo perfumado com mirra e lótus para rituais de bênção e tratamento de feridas.',
        weightKg: 0.4,
        valueAmount: 5,
        valueCurrency: 'BRZ',
        iconEmoji: '💧',
      },
    ];
  }

  if (norm.includes('bárbaro') || norm.includes('barbaro')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Pinturas de Guerra de Carvão Abissal',
        quantity: 3,
        category: 'geral',
        description: 'Carvão vegetal místico misturado com gordura animal para rituais de fúria intimidante.',
        weightKg: 0.3,
        valueAmount: 3,
        valueCurrency: 'BRZ',
        iconEmoji: '🎨',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Colar de Garras e Dentes de Fera',
        quantity: 1,
        category: 'reliquia',
        equipped: true,
        description: 'Troféus de presas abatidas na juventude que protegem contra espíritos fracos.',
        weightKg: 0.2,
        valueAmount: 6,
        valueCurrency: 'BRZ',
        iconEmoji: '🦷',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Odre Rústico de Hidromel Feroz',
        quantity: 1,
        category: 'geral',
        description: 'Bebida alcoólica destilada das montanhas, aquece o sangue antes do combate.',
        weightKg: 1.2,
        valueAmount: 4,
        valueCurrency: 'BRZ',
        iconEmoji: '🍺',
      },
    ];
  }

  if (norm.includes('espadachim') || norm.includes('kensei') || norm.includes('samurai') || norm.includes('dançarina') || norm.includes('dervixe')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Kit Tradicional de Manutenção Uchiko',
        quantity: 1,
        category: 'equipamento',
        description: 'Estojo de madeira com pó de pedra fina de polimento, papel de arroz e óleo de camélia.',
        weightKg: 0.4,
        valueAmount: 12,
        valueCurrency: 'BRZ',
        iconEmoji: '🗡️',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Bainha de Madeira Laqueada com Seda',
        quantity: 1,
        category: 'equipamento',
        equipped: true,
        description: 'Bainha artesanal personalizada que permite saques em fração de segundo sem atrito.',
        weightKg: 0.6,
        valueAmount: 10,
        valueCurrency: 'BRZ',
        iconEmoji: '🎀',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Luvas de Couro Macio de Esgrima',
        quantity: 1,
        category: 'equipamento',
        equipped: true,
        description: 'Proporcionam pegada cirúrgica firme e impedem calos no punho da arma.',
        weightKg: 0.2,
        valueAmount: 5,
        valueCurrency: 'BRZ',
        iconEmoji: '🧤',
      },
    ];
  }

  if (norm.includes('mosqueteiro')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Cartucheira de Couro com 15 Cargas de Pólvora',
        quantity: 1,
        category: 'equipamento',
        equipped: true,
        description: 'Bolsa impermeável com doses medidas de pólvora negra e projéteis de chumbo.',
        weightKg: 1.2,
        valueAmount: 15,
        valueCurrency: 'BRZ',
        iconEmoji: '💼',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Capa Elegante com Pena de Pavão Real',
        quantity: 1,
        category: 'equipamento',
        equipped: true,
        description: 'Capa de veludo escarlate com ombreira para fintas visuais e presença marcante.',
        weightKg: 0.8,
        valueAmount: 12,
        valueCurrency: 'BRZ',
        iconEmoji: '🦚',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Óleo Antiferrugem para Mecanismo de Pederneira',
        quantity: 1,
        category: 'geral',
        description: 'Garante que o cão e a roda de faísca disparem mesmo sob neblina densa.',
        weightKg: 0.3,
        valueAmount: 4,
        valueCurrency: 'BRZ',
        iconEmoji: '💧',
      },
    ];
  }

  if (norm.includes('shinobi') || norm.includes('ninja')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Kit de 5x Abrolhos de Metal (Caltrops)',
        quantity: 5,
        category: 'equipamento',
        description: 'Espigões de quatro pontas jogados no chão para furar solas e atrasar perseguidores.',
        weightKg: 0.5,
        valueAmount: 8,
        valueCurrency: 'BRZ',
        iconEmoji: '⭐',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Bomba de Fumaça Ilusória de Bambu',
        quantity: 2,
        category: 'geral',
        description: 'Libera cortina densa de fumaça preta e cinza em raio de 4 metros por 1 rodada.',
        weightKg: 0.4,
        valueAmount: 10,
        valueCurrency: 'BRZ',
        iconEmoji: '💨',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Máscara Tática de Tecido Antirruído',
        quantity: 1,
        category: 'equipamento',
        equipped: true,
        description: 'Cobre a face permitindo respiração silenciosa e visão adaptada a penumbra.',
        weightKg: 0.1,
        valueAmount: 5,
        valueCurrency: 'BRZ',
        iconEmoji: '🥷',
      },
    ];
  }

  if (norm.includes('mago') || norm.includes('arcano') || norm.includes('feiticeiro')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Grimório Rúnico em Couro de Basilisco',
        quantity: 1,
        category: 'reliquia',
        description: 'Tomo com páginas de pergaminho vegetal onde estão gravados seus diagramas arcanos.',
        weightKg: 1.5,
        valueAmount: 20,
        valueCurrency: 'BRZ',
        iconEmoji: '📖',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Bolsa de Componentes e Pó de Éter',
        quantity: 1,
        category: 'material',
        description: 'Enxofre, cristais triturados, penas de corvo e pós condutores de mana.',
        weightKg: 0.8,
        valueAmount: 10,
        valueCurrency: 'BRZ',
        iconEmoji: '✨',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Pena Espectral com Tinta Fluorescente',
        quantity: 1,
        category: 'geral',
        description: 'Pena mágica que escreve sem borrar e brilha suavemente no escuro.',
        weightKg: 0.1,
        valueAmount: 5,
        valueCurrency: 'BRZ',
        iconEmoji: '🪶',
      },
    ];
  }

  if (norm.includes('ladino') || norm.includes('assassino')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Kit Profissional de Gazuas e Michas',
        quantity: 1,
        category: 'equipamento',
        description: 'Ferramentas de aço temperado fino para desarmar fechaduras, trincos e armadilhas mecânicas.',
        weightKg: 0.5,
        valueAmount: 18,
        valueCurrency: 'BRZ',
        iconEmoji: '🗝️',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Frasco de Graxa Silenciosa para Dobradiças',
        quantity: 1,
        category: 'geral',
        description: 'Graxa à base de óleo mineral para silenciar portas e janelas emperradas sem ruído.',
        weightKg: 0.3,
        valueAmount: 3,
        valueCurrency: 'BRZ',
        iconEmoji: '🧪',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Capa com Capuz Aveludado das Sombras',
        quantity: 1,
        category: 'equipamento',
        equipped: true,
        description: 'Tecido escuro que amortece silhuetas e movimentos na escuridão.',
        weightKg: 0.8,
        valueAmount: 10,
        valueCurrency: 'BRZ',
        iconEmoji: '🧥',
      },
    ];
  }

  if (norm.includes('clérigo') || norm.includes('clerigo') || norm.includes('sacerdote')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Símbolo Sagrado de Prata em Corrente',
        quantity: 1,
        category: 'reliquia',
        description: 'Insígnia dos deuses de Eldria, canaliza luz divina contra aberrações.',
        weightKg: 0.4,
        valueAmount: 12,
        valueCurrency: 'PRT',
        iconEmoji: '⛪',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Frasco de Água Benta Abençoada',
        quantity: 2,
        category: 'pocao',
        description: 'Água pura consagrada sob a luz do meio-dia. Causa dano radiante em mortos-vivos.',
        weightKg: 0.6,
        valueAmount: 8,
        valueCurrency: 'BRZ',
        iconEmoji: '💧',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Incensário Portátil com Resina Sagrada',
        quantity: 1,
        category: 'geral',
        description: 'Purifica ambientes fétidos e afasta miasmas venenosos.',
        weightKg: 0.5,
        valueAmount: 5,
        valueCurrency: 'BRZ',
        iconEmoji: '🕯️',
      },
    ];
  }

  if (norm.includes('druida') || norm.includes('xamã') || norm.includes('xama')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Talismã de Visgo e Madeira Viva',
        quantity: 1,
        category: 'reliquia',
        description: 'Foco druídico natural talhado em galho que nunca seca nem apodrece.',
        weightKg: 0.3,
        valueAmount: 8,
        valueCurrency: 'BRZ',
        iconEmoji: '🌿',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Bolsa de Sementes Luminescentes',
        quantity: 1,
        category: 'material',
        description: 'Sementes que brotam sob comando mágico ou iluminam fendas escuras.',
        weightKg: 0.4,
        valueAmount: 5,
        valueCurrency: 'BRZ',
        iconEmoji: '🌱',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Pomada de Ervas Medicinais da Floresta',
        quantity: 2,
        category: 'pocao',
        description: 'Unguento cicatrizante rápido que estanca sangramentos e neutraliza picadas.',
        weightKg: 0.4,
        valueAmount: 6,
        valueCurrency: 'BRZ',
        iconEmoji: '🍃',
      },
    ];
  }

  if (norm.includes('bardo')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Alaúde de Éter com Cordas de Seda',
        quantity: 1,
        category: 'equipamento',
        description: 'Instrumento musical fino de madeira nobre capaz de encantar plateias e conjurar melodias.',
        weightKg: 1.5,
        valueAmount: 25,
        valueCurrency: 'BRZ',
        iconEmoji: '🪕',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Diário de Poemas & Crônicas de Viagem',
        quantity: 1,
        category: 'geral',
        description: 'Contém baladas famosas, fofocas de cortes reais e anotações para improviso.',
        weightKg: 0.5,
        valueAmount: 6,
        valueCurrency: 'BRZ',
        iconEmoji: '📜',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Perfume Nobre de Lótus de Caeldrin',
        quantity: 1,
        category: 'geral',
        description: 'Frasco de cristal com essência aromática que impressiona diplomatas e nobres.',
        weightKg: 0.2,
        valueAmount: 10,
        valueCurrency: 'BRZ',
        iconEmoji: '🌸',
      },
    ];
  }

  if (norm.includes('cozinheiro')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Frigideira de Ferro Fundido Pesada (5kg)',
        quantity: 1,
        category: 'equipamento',
        equipped: true,
        description: 'Utensílio indestrutível usado para cozinhar banquetes de campo e esmagar crânios inimigos.',
        effectText: 'Pode ser usada como escudo improvisado (+1 CA) ou clava pesada (1d8 contundente).',
        weightKg: 5.0,
        valueAmount: 15,
        valueCurrency: 'BRZ',
        iconEmoji: '🍳',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Estojo de Especiarias Raras de Eldria',
        quantity: 1,
        category: 'material',
        description: 'Pimenta do abismo, sal vulcânico, folhas de louro místicas e açafrão estelar.',
        weightKg: 0.8,
        valueAmount: 12,
        valueCurrency: 'BRZ',
        iconEmoji: '🧂',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Faca de Desossar e Cutelo de Açougueiro',
        quantity: 1,
        category: 'equipamento',
        description: 'Cutelaria afiada de chef que corta juntas de monstros e carnes duras com facilidade.',
        weightKg: 0.9,
        valueAmount: 8,
        valueCurrency: 'BRZ',
        iconEmoji: '🔪',
      },
    ];
  }

  if (norm.includes('alquimista')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Alambique Portátil e Suporte de Vidro',
        quantity: 1,
        category: 'equipamento',
        description: 'Permite destilar extratos, venenos e solventes durante descansos curtos.',
        weightKg: 2.0,
        valueAmount: 20,
        valueCurrency: 'BRZ',
        iconEmoji: '🧪',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Estojo de 3x Reagentes Voláteis Prontos',
        quantity: 3,
        category: 'material',
        description: 'Frascos prontos de fósforo branco, ácido fluorídrico e sal de magnésio explosivo.',
        weightKg: 0.9,
        valueAmount: 15,
        valueCurrency: 'BRZ',
        iconEmoji: '💥',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Óculos de Couro com Lentes Antirrespingo',
        quantity: 1,
        category: 'equipamento',
        equipped: true,
        description: 'Protege os olhos contra fumaças corrosivas e faíscas químicas inesperadas.',
        weightKg: 0.3,
        valueAmount: 6,
        valueCurrency: 'BRZ',
        iconEmoji: '🥽',
      },
    ];
  }

  if (norm.includes('ciborgue') || norm.includes('hacker') || norm.includes('mecha') || norm.includes('tecnomago')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Deck Neural com Interface Holográfica',
        quantity: 1,
        category: 'cyber',
        description: 'Computador de pulso compacto conectado ao sistema nervoso para diagnósticos e hacks.',
        weightKg: 1.0,
        valueAmount: 50,
        valueCurrency: 'BRZ',
        iconEmoji: '💻',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Bateria de Lítio-Cristal Recarregável',
        quantity: 2,
        category: 'cyber',
        description: 'Células de alta densidade que energizam implantes, lasers e exoesqueletos.',
        weightKg: 0.6,
        valueAmount: 20,
        valueCurrency: 'BRZ',
        iconEmoji: '🔋',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Multiferramenta com Pontas Magnéticas',
        quantity: 1,
        category: 'equipamento',
        description: 'Soldador de éter, chaves de precisão e cortador de fios integrados.',
        weightKg: 0.5,
        valueAmount: 12,
        valueCurrency: 'BRZ',
        iconEmoji: '🔧',
      },
    ];
  }

  if (norm.includes('pistoleiro') || norm.includes('gunslinger') || norm.includes('mercenário')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Coldre Duplo de Saque Rápido',
        quantity: 1,
        category: 'equipamento',
        equipped: true,
        description: 'Couro encerado com presilhas magnéticas para empunhar armas de fogo instantaneamente.',
        weightKg: 1.0,
        valueAmount: 15,
        valueCurrency: 'BRZ',
        iconEmoji: '🤠',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Bolsa com 20 Projéteis de Chumbo e Pólvora',
        quantity: 1,
        category: 'material',
        description: 'Munições bem lubrificadas prontas para carregar no tambor ou câmara.',
        weightKg: 1.0,
        valueAmount: 10,
        valueCurrency: 'BRZ',
        iconEmoji: '🪙',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Vareta e Escova de Limpeza de Cano',
        quantity: 1,
        category: 'geral',
        description: 'Remove resíduos de pólvora e fuligem para evitar travamento de tiros.',
        weightKg: 0.3,
        valueAmount: 4,
        valueCurrency: 'BRZ',
        iconEmoji: '🧹',
      },
    ];
  }

  if (norm.includes('monge') || norm.includes('pugilista')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Faixas de Linho Cru Sagrado para Punhos',
        quantity: 2,
        category: 'equipamento',
        equipped: true,
        description: 'Protegem os tendões e ossos das mãos, permitindo socos em rocha sem lesão.',
        weightKg: 0.2,
        valueAmount: 4,
        valueCurrency: 'BRZ',
        iconEmoji: '🥊',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Contas de Oração em Madeira de Sândalo',
        quantity: 1,
        category: 'reliquia',
        description: 'Corda com 108 contas que auxiliam na contagem de ciclos respiratórios e foco mental.',
        weightKg: 0.2,
        valueAmount: 6,
        valueCurrency: 'BRZ',
        iconEmoji: '📿',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Bálsamo Revigorante de Ervas Amargas',
        quantity: 2,
        category: 'pocao',
        description: 'Pomada aplicada nas têmporas para recuperar o fôlego e dissipar tonturas.',
        weightKg: 0.3,
        valueAmount: 5,
        valueCurrency: 'BRZ',
        iconEmoji: '🌿',
      },
    ];
  }

  if (norm.includes('bruxo') || norm.includes('sangue') || norm.includes('apocalipse') || norm.includes('necromante') || norm.includes('vazio')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Adaga Cerimonial com Sulco de Coleta',
        quantity: 1,
        category: 'equipamento',
        description: 'Lâmina de obsidiana fria talhada especialmente para rituais e incisões precisas.',
        weightKg: 0.4,
        valueAmount: 15,
        valueCurrency: 'BRZ',
        iconEmoji: '🩸',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Frascos de Vidro Escuro com Selo de Cera',
        quantity: 3,
        category: 'geral',
        description: 'Recipientes herméticos para armazenar sangue, ectoplasma ou cinzas rituais.',
        weightKg: 0.5,
        valueAmount: 6,
        valueCurrency: 'BRZ',
        iconEmoji: '🧪',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Papiro com Selo de Pacto Primordial',
        quantity: 1,
        category: 'reliquia',
        description: 'Contrato antigo gravado em tinta carmesim que sintoniza sua alma ao abismo.',
        weightKg: 0.2,
        valueAmount: 12,
        valueCurrency: 'BRZ',
        iconEmoji: '📜',
      },
    ];
  }

  if (norm.includes('psiônico') || norm.includes('psionico') || norm.includes('gravidade') || norm.includes('glitcher')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Diapasão de Ressonância Mental de Quartzo',
        quantity: 1,
        category: 'reliquia',
        description: 'Ao vibrar, estabiliza a frequência cerebral e impede sobrecarga psíquica.',
        weightKg: 0.3,
        valueAmount: 18,
        valueCurrency: 'BRZ',
        iconEmoji: '🔮',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Venda de Seda Pura para Isolamento Sensorial',
        quantity: 1,
        category: 'equipamento',
        description: 'Bloqueia estímulos luminosos para expandir a percepção extrassensorial.',
        weightKg: 0.1,
        valueAmount: 5,
        valueCurrency: 'BRZ',
        iconEmoji: '👁️',
      },
      {
        id: `${idPrefix}-3`,
        name: 'Pequena Esfera de Massa Superdensa',
        quantity: 1,
        category: 'material',
        description: 'Objeto gravitacionalmente anômalo usado como âncora para telecinese.',
        weightKg: 1.0,
        valueAmount: 12,
        valueCurrency: 'BRZ',
        iconEmoji: '🌌',
      },
    ];
  }

  // 2. Category-based fallback
  const cat = category || '';
  if (cat.includes('Marcial')) {
    return [
      {
        id: `${idPrefix}-1`,
        name: 'Kit de Manutenção de Armas & Couro',
        quantity: 1,
        category: 'equipamento',
        description: 'Graxa, correias de couro extra e pedra de afiar para viagens.',
        weightKg: 0.8,
        valueAmount: 6,
        valueCurrency: 'BRZ',
        iconEmoji: '⚔️',
      },
      {
        id: `${idPrefix}-2`,
        name: 'Broquel Leve de Guarda',
        quantity: 1,
        category: 'armadura',
        equipped: true,
        description: 'Escudo circular pequeno que protege o antebraço contra golpes diretos.',
        effectText: '+1 na CA',
        weightKg: 2.0,
        valueAmount: 15,
        valueCurrency: 'BRZ',
        iconEmoji: '🛡️',
      },
    ];
  }

  // Default explorer adventurer kit
  return [
    {
      id: `${idPrefix}-1`,
      name: 'Kit de Ferramentas de Exploração',
      quantity: 1,
      category: 'equipamento',
      description: 'Pederneira, corda de cânhamo de 15m, gancho de escalada e picos de ferro.',
      weightKg: 2.0,
      valueAmount: 10,
      valueCurrency: 'BRZ',
      iconEmoji: '🧗',
    },
    {
      id: `${idPrefix}-2`,
      name: 'Lanterna a Óleo com Vidro Reforçado',
      quantity: 1,
      category: 'geral',
      description: 'Ilumina um cone de 9 metros e protege a chama contra ventanias e chuva.',
      weightKg: 1.0,
      valueAmount: 7,
      valueCurrency: 'BRZ',
      iconEmoji: '🏮',
    },
    {
      id: `${idPrefix}-3`,
      name: 'Amuleto da Boa Viagem',
      quantity: 1,
      category: 'reliquia',
      description: 'Moeda perfurada com laço azul, presente tradicional para quem parte em expedição.',
      weightKg: 0.1,
      valueAmount: 3,
      valueCurrency: 'BRZ',
      iconEmoji: '🧿',
    },
  ];
}
