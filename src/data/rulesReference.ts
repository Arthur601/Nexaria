export interface RuleSection {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  content: {
    label: string;
    details: string;
    example?: string;
  }[];
}

export const RULES_REFERENCE_DATA: RuleSection[] = [
  {
    id: 'atributos',
    title: 'TABELA DE ATRIBUTOS',
    subtitle: 'Os pilares físicos, mentais e arcanos de cada aventureiro',
    iconName: 'Shield',
    content: [
      { label: 'FORÇA (FOR)', details: 'Potência muscular, dano corpo a corpo, capacidade de carga e provas de atletismo.' },
      { label: 'DESTREZA (DES)', details: 'Reflexos, agilidade, esquiva, combate à distância e manuseio de armadilhas.' },
      { label: 'CONSTITUIÇÃO (CON)', details: 'Vigor, resistência física contra venenos, frio do Abismo e cálculo de Pontos de Vida (PV).' },
      { label: 'INTELIGÊNCIA (INT)', details: 'Raciocínio lógico, conhecimento arcano, decifração de runas antigas e tecnomagia.' },
      { label: 'SABEDORIA (SAB)', details: 'Percepção do ambiente, intuição, força de vontade contra corrupção e conjuração primal.' },
      { label: 'CARISMA (CAR)', details: 'Presença, liderança, intimidação, negociação comercial e barganha de moedas com mercadores.' },
    ],
  },
  {
    id: 'testes',
    title: 'TESTES E PERÍCIAS',
    subtitle: 'Como resolver ações perigosas e desafios em Nexaria',
    iconName: 'Sparkles',
    content: [
      { label: 'FÓRMULA BÁSICA', details: 'Role 1d20 + Modificador de Atributo + Bônus de Treinamento contra a Dificuldade (CD).' },
      { label: 'GRAUS DE DIFICULDADE (CD)', details: 'Fácil: CD 10 | Médio: CD 15 | Difícil: CD 20 | Heroico: CD 25 | Quase Impossível: CD 30.' },
      { label: 'SUCESSO DECISIVO (20 NATURAL)', details: 'Sucesso automático com efeito crítico espetacular ou redução de custo de recursos.' },
      { label: 'FALHA CRÍTICA (1 NATURAL)', details: 'Complicação imediata, arma emperrada ou atração temporária de aberrações abissais.' },
      { label: 'VANTAGEM E DESVANTAGEM', details: 'Role 2d20 e fique com o maior (Vantagem) ou menor resultado (Desvantagem).' },
    ],
  },
  {
    id: 'combate',
    title: 'MECÂNICAS DE COMBATE',
    subtitle: 'Ação rápida, posicionamento tático e sobrevivência no Abismo',
    iconName: 'Swords',
    content: [
      { label: 'TURNO DE COMBATE', details: 'Cada rodada dura 6 segundos fictícios. Cada combatente possui 1 Ação, 1 Ação Bônus, 1 Reação e Movimento.' },
      { label: 'ATAQUE E DANO', details: 'Role 1d20 + Modificador de Ataque vs Defesa (CA) do alvo. Se acertar, role o dado da arma/feitiço.' },
      { label: 'COMBATE CORPO A CORPO & DISTÂNCIA', details: 'Ataques desarmados ou com armas brancas usam FOR/DES; ataques à distância usam DES e têm alcance máximo.' },
      { label: 'FERIMENTOS & INCONSCIÊNCIA', details: 'Ao atingir 0 PV, o personagem cai inconsciente e faz Testes de Morte até ser estabilizado ou curado.' },
    ],
  },
  {
    id: 'magia',
    title: 'MAGIA & TECNOMAGIA',
    subtitle: 'Canalização das energias cósmicas do vórtice de Nexaria',
    iconName: 'Flame',
    content: [
      { label: 'PONTOS DE MANA / RECURSO (PM)', details: 'Cada feitiço drena energia cósmica medida em PM, que se regenera com descansos ou cristais de mana.' },
      { label: 'CLASSIFICAÇÃO DE FEITIÇOS', details: 'Grau I (Iniciante), Grau II (Combatente), Grau III (Arcano Maior) e Relíquia Abissal Suprema.' },
      { label: 'ALCANCE E CONCENTRAÇÃO', details: 'Toque, 9m, 18m, 36m ou Vórtice Global. Certos feitiços exigem manter a concentração sem sofrer dano.' },
      { label: 'SOBRECARGA TECNOMÁGICA', details: 'Dispositivos e cyber-implantes podem consumir Cybermoedas para disparar pulsos de choque eletromagnético.' },
    ],
  },
  {
    id: 'condicoes',
    title: 'TABELA DE CONDIÇÕES',
    subtitle: 'Estados prejudiciais infligidos por feras e venenos abissais',
    iconName: 'AlertTriangle',
    content: [
      { label: 'CORROMPIDO PELO ABISMO', details: 'A criatura perde 1d6 PV ao início do seu turno e sofre desvantagem em testes de Vontade.' },
      { label: 'ATORDOADO', details: 'Incapaz de agir, solta o que estiver segurando e ataques contra ele têm vantagem.' },
      { label: 'ENVENENADO', details: 'Desvantagem em jogadas de ataque e testes de atributos enquanto o veneno circular no sangue.' },
      { label: 'ATORMENTADO / COM MEDO', details: 'Desvantagem em testes enquanto a fonte do medo estiver visível; não pode se mover voluntariamente na direção dela.' },
      { label: 'PARALISADO', details: 'Incapacitado e não pode se mover ou falar. Falha automática em testes de FOR e DES; ataques adjacentes são críticos.' },
    ],
  },
  {
    id: 'iniciativa',
    title: 'TABELA DE INICIATIVA & MOVIMENTO',
    subtitle: 'Ordem de ação nos combates e deslocamento pelo tabuleiro',
    iconName: 'Compass',
    content: [
      { label: 'ROLAGEM DE INICIATIVA', details: 'Todos rolam 1d20 + Modificador de Destreza no início do confronto. Ações ocorrem do maior para o menor.' },
      { label: 'DESLOCAMENTO BASE', details: 'Humanos e Elfos: 9m (6 quadrados no grid) | Anões e seres pesados: 7,5m (5 quadrados).' },
      { label: 'TERRENO DIFÍCIL', details: 'Lamaçal abissal, ossadas e ruínas custam o dobro do movimento para cada metro percorrido.' },
      { label: 'AÇÃO DE CORRER (DASH)', details: 'Gaste sua Ação principal para dobrar seu movimento total na rodada.' },
    ],
  },
  {
    id: 'equipamentos',
    title: 'EQUIPAMENTOS & SISTEMA MONETÁRIO',
    subtitle: 'Câmbio oficial de moedas de Nexaria — O Legado do Abismo',
    iconName: 'Coins',
    content: [
      { label: 'BRONZE (BRZ) = 1 BRZ', details: 'A moeda comum de troca diária de taverneiros, ferramentas e suprimentos básicos.' },
      { label: 'PRATA (PRT) = 10 BRZ', details: 'Moeda de contratos mercenários, pergaminhos e armas forjadas de qualidade comum.' },
      { label: 'OURO (ORO) = 100 BRZ', details: 'Moeda da nobreza e grandes guildas; compra armas mágicas, armaduras de aço e gemas.' },
      { label: 'PLATINA (PLN) = 1.000 BRZ', details: 'Moeda imperial lendária, usada para comprar relíquias, fortalezas e tratados bélicos.' },
      { label: 'CYBERMOEDAS (CYB) = 5.000 BRZ', details: 'Moeda tecnomágica digital do núcleo de Nexaria; ativa tecnologias proibidas e portais.' },
    ],
  },
];
