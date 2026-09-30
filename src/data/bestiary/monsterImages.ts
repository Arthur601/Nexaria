// Helper and catalog of dark fantasy tabletop RPG miniature artwork for Nexaria Bestiary
// Converted to authentic 3D painted tabletop RPG miniatures on wargaming bases, matching reference sheets.

import miniKrampus from '../../assets/images/mini_krampus_rpg_1789849946911.jpg';
import miniLichKing from '../../assets/images/mini_lich_king_1789849964854.jpg';
import miniSlimeOoze from '../../assets/images/mini_slime_ooze_1789849977169.jpg';
import miniBeholder from '../../assets/images/mini_beholder_orb_1789849986272.jpg';
import miniMimic from '../../assets/images/mini_mimic_chest_1789849997794.jpg';
import miniCyberMech from '../../assets/images/mini_cyber_mech_1789850007737.jpg';
import miniWerewolf from '../../assets/images/mini_werewolf_beast_1789850021836.jpg';
import miniHeadlessRider from '../../assets/images/mini_headless_rider_1789850030416.jpg';
import miniMagmaTitan from '../../assets/images/mini_magma_titan_1789850042041.jpg';
import miniAbyssHorror from '../../assets/images/mini_abyss_horror_1789850052058.jpg';
import miniSkeletonWarrior from '../../assets/images/mini_skeleton_warrior_1789850063678.jpg';
import miniDragonWyrm from '../../assets/images/mini_dragon_wyrm_1789850074129.jpg';
import miniSpectreBanshee from '../../assets/images/mini_spectre_banshee_1789850085809.jpg';
import miniStoneGolem from '../../assets/images/mini_stone_golem_1789850095892.jpg';
import miniCyberDrone from '../../assets/images/mini_cyber_drone_1789850115176.jpg';
import miniSpiderBeast from '../../assets/images/mini_spider_beast_1789850124979.jpg';
import miniBabaYaga from '../../assets/images/mini_baba_yaga_1790179688533.jpg';
import miniMinotaur from '../../assets/images/mini_minotaur_1790179700397.jpg';
import miniGriffin from '../../assets/images/mini_griffin_1790179712669.jpg';
import miniPhoenix from '../../assets/images/mini_phoenix_1790179727172.jpg';
import miniBasilisk from '../../assets/images/mini_basilisk_1790179738838.jpg';
import miniKelpie from '../../assets/images/mini_kelpie_1790179758343.jpg';
import miniLeshy from '../../assets/images/mini_leshy_1790179773569.jpg';

export interface CreatureImageMetadata {
  url: string;
  sourceLabel?: string;
}

// Tabletop RPG Miniatures Palette directly referencing the official painted miniature catalog
export const MINIATURE_PALETTE = {
  // Demons & Folklore
  krampus: miniKrampus,
  demon: miniKrampus,
  baba_yaga: miniBabaYaga,
  leshy: miniLeshy,
  kelpie: miniKelpie,
  werewolf: miniWerewolf,
  wolf: miniWerewolf,
  bear: miniWerewolf,
  beast: miniWerewolf,

  // Mythical & Hybrid Beasts
  minotaur: miniMinotaur,
  griffin: miniGriffin,
  phoenix: miniPhoenix,
  basilisk: miniBasilisk,

  // Undead & Skeletons
  skeleton: miniSkeletonWarrior,
  zombie: miniSkeletonWarrior,
  lich_king: miniLichKing,
  headless_horseman: miniHeadlessRider,
  spectre_banshee: miniSpectreBanshee,

  // Slimes & Oozes
  slime_ooze: miniSlimeOoze,

  // Aberrations & Horrors
  mimic: miniMimic,
  beholder: miniBeholder,
  abyss_horror: miniAbyssHorror,
  spider: miniSpiderBeast,

  // Golems & Elementals
  stone_golem: miniStoneGolem,
  magma_titan: miniMagmaTitan,

  // Draconic & Winged
  dragon: miniDragonWyrm,

  // Sci-Fi Cybernetics
  cyber_drone: miniCyberDrone,
  cyber_mech: miniCyberMech,
};

// Aliases for compatibility
export const CREATURE_IMAGE_PALETTE = MINIATURE_PALETTE;

// Explicit miniature mappings for all creatures from the official Crônicas do Abismo sheets
export const SPECIFIC_MONSTER_IMAGES: Record<string, string> = {
  // FOLCLORE EUROPEU (Sheet 1)
  'folclore-01-krampus': miniKrampus,
  'folclore-02-baba-yaga': miniBabaYaga,
  'folclore-03-lobisomem': miniWerewolf,
  'folclore-04-nicorau': miniKrampus,
  'folclore-05-leshy': miniLeshy,
  'folclore-06-sereia-do-reno': miniSpectreBanshee,
  'folclore-07-kelpie': miniKelpie,

  // CRIATURAS MÍTICAS (Sheet 1)
  'mitica-08-grifo': miniGriffin,
  'mitica-09-dragao-europeu': miniDragonWyrm,
  'mitica-10-fenix': miniPhoenix,
  'mitica-11-basilisco': miniBasilisk,
  'mitica-12-minotauro': miniMinotaur,

  // MORTOS-VIVOS (Sheet 1)
  'morto-13-esqueleto-guerreiro': miniSkeletonWarrior,
  'morto-14-esqueleto-arqueiro': miniSkeletonWarrior,
  'morto-15-esqueleto-espada': miniSkeletonWarrior,
  'morto-16-capitao-esqueleto': miniSkeletonWarrior,
  'morto-17-zumbi': miniSkeletonWarrior,
  'morto-18-zumbi-podrido': miniSkeletonWarrior,
  'morto-19-zumbi-corrompido': miniSkeletonWarrior,

  // SENHORES E ESPECTROS (Sheet 1)
  'senhores-20-cavaleiro-sem-cabeca': miniHeadlessRider,
  'senhores-21-rei-lich': miniLichKing,
  'senhores-22-dama-branca': miniSpectreBanshee,
  'senhores-23-banshi': miniSpectreBanshee,
  'senhores-24-espectro': miniSpectreBanshee,
  'senhores-25-naufrago-amaldicoado': miniSpectreBanshee,

  // SLIMES E OOZES (Sheet 1)
  'slime-26-slime-verde': miniSlimeOoze,
  'slime-27-slime-azul': miniSlimeOoze,
  'slime-28-slime-vermelho': miniSlimeOoze,
  'slime-29-slime-amarelo': miniSlimeOoze,
  'slime-30-slime-roxo': miniSlimeOoze,
  'slime-31-slime-preto': miniSlimeOoze,
  'slime-32-ooze-acido': miniSlimeOoze,

  // ABERRAÇÕES SOMBRIAS (Sheet 1)
  'sombra-33-mimico': miniMimic,
  'sombra-34-gargula': miniStoneGolem,
  'sombra-35-caes-infernais': miniWerewolf,
  'sombra-36-aranha-gigante': miniSpiderBeast,
  'sombra-37-beholder': miniBeholder,
  'sombra-38-abissal-menor': miniAbyssHorror,

  // OUTRAS CRIATURAS (Sheet 1)
  'outras-39-golem-de-pedra': miniStoneGolem,
  'outras-40-golem-de-ferro': miniStoneGolem,
  'outras-41-troll-da-montanha': miniStoneGolem,
  'outras-42-ogro': miniStoneGolem,
  'outras-43-harpias': miniDragonWyrm,
  'outras-44-fada-sombria': miniSpectreBanshee,
  'outras-45-duende-trapaceiro': miniKrampus,

  // BESTAS PERIGOSAS (Sheet 1)
  'bestas-46-urso-peludo': miniWerewolf,
  'bestas-47-lobo-cinzento': miniWerewolf,
  'bestas-48-javali-gigante': miniWerewolf,
  'bestas-49-corvo-gigante': miniDragonWyrm,
  'bestas-50-serpente-gigante': miniDragonWyrm,
  'bestas-51-escorpiao-gigante': miniSpiderBeast,

  // BESTAS SELVAGENS & ELEMENTAIS (Sheet 2)
  'abissal-31-fera-do-abismo': miniWerewolf,
  'abissal-32-urso-corrompido': miniWerewolf,
  'abissal-33-lamina-rastejante': miniSpiderBeast,
  'abissal-34-escorpiao-osseo': miniSpiderBeast,
  'abissal-35-terror-alado': miniDragonWyrm,
  'abissal-36-carrapato-gigante': miniSpiderBeast,
  'abissal-37-serpente-abissal': miniDragonWyrm,
  'abissal-38-hidra-do-abismo': miniAbyssHorror,
  'abissal-39-grifo-corrompido': miniGriffin,
  'abissal-40-ursido-de-pedra': miniStoneGolem,

  // ENTIDADES ELEMENTAIS (Sheet 2)
  'entidade-41-elemental-de-fogo': miniMagmaTitan,
  'entidade-42-elemental-de-gelo': miniStoneGolem,
  'entidade-43-elemental-de-terra': miniStoneGolem,
  'entidade-44-elemental-de-vento': miniSpectreBanshee,
  'entidade-45-espirito-da-floresta': miniLeshy,
  'entidade-46-espectro-lamentoso': miniSpectreBanshee,
  'entidade-47-banshee-abissal': miniSpectreBanshee,
  'entidade-48-golem-runico': miniStoneGolem,
  'entidade-49-tita-de-magma': miniMagmaTitan,
  'entidade-50-senhor-das-almas': miniLichKing,

  // CIBERNÉTICAS AVANÇADAS (Sheet 2)
  'cyber-51-drone-cacador': miniCyberDrone,
  'cyber-52-sentinela-de-assalto': miniCyberMech,
  'cyber-53-tanque-escaravelho': miniCyberMech,
  'cyber-54-aranha-de-combate': miniSpiderBeast,
  'cyber-55-espectro-cibernetico': miniCyberDrone,
  'cyber-56-colosso-mecanico': miniCyberMech,
  'cyber-57-cerebro-coletivo': miniBeholder,
  'cyber-58-devorador-de-dados': miniCyberDrone,
  'cyber-59-invasor-dimensional': miniCyberMech,
  'cyber-60-nucleo-sentinela': miniCyberDrone,

  // HORRORES MAIORES (Sheet 2)
  'horror-61-abissal-supremo': miniAbyssHorror,
  'horror-62-devorador-de-mundos': miniAbyssHorror,
  'horror-63-o-corrompido': miniLichKing,
  'horror-64-mente-do-abismo': miniBeholder,
  'horror-65-porta-viva': miniMimic,
  'horror-66-arquiteto-do-caos': miniAbyssHorror,

  // MONSTROS DAS PROFUNDEZAS & CYBER (Sheet 3)
  'profundezas-01-abissal': miniAbyssHorror,
  'profundezas-02-devorador': miniAbyssHorror,
  'profundezas-03-sombra-voraz': miniSpectreBanshee,
  'profundezas-04-guardiao-do-abismo': miniLichKing,
  'profundezas-05-horror-tentacular': miniAbyssHorror,
  'profundezas-06-colosso-osseo': miniSkeletonWarrior,
  'profundezas-07-juggernaut-do-abismo': miniStoneGolem,
  'profundezas-08-sentinela-corrompida': miniLichKing,
  'profundezas-09-sucubo-abissal': miniSpectreBanshee,
  'profundezas-10-dragao-do-abismo': miniDragonWyrm,

  // CRIATURAS CORROMPIDAS (Sheet 3)
  'corrompidas-11-licantro-corrompido': miniWerewolf,
  'corrompidas-12-golem-carneficio': miniStoneGolem,
  'corrompidas-13-plaga-rastejante': miniSpiderBeast,
  'corrompidas-14-mae-dos-ovos': miniSpiderBeast,
  'corrompidas-15-espectro-retorcido': miniSpectreBanshee,
  'corrompidas-16-devastador-putrefato': miniSkeletonWarrior,
  'corrompidas-17-cavaleiro-da-praga': miniLichKing,
  'corrompidas-18-monstro-de-multiformas': miniAbyssHorror,
  'corrompidas-19-colera-abissal': miniMagmaTitan,
  'corrompidas-20-olho-que-tudo-ve': miniBeholder,

  // CIBERNÉTICAS (Sheet 3)
  'cibernetica-21-drone-vigia': miniCyberDrone,
  'cibernetica-22-sentinela-cibernetica': miniCyberMech,
  'cibernetica-23-assassino-mecanico': miniCyberMech,
  'cibernetica-24-cao-de-combate-mk-ii': miniWerewolf,
  'cibernetica-25-tita-de-combate': miniCyberMech,
  'cibernetica-26-nucleo-viral': miniCyberDrone,
  'cibernetica-27-aracnideo-cibernetico': miniSpiderBeast,
  'cibernetica-28-mente-coletiva': miniBeholder,
  'cibernetica-29-invasor-dimensional': miniCyberMech,
  'cibernetica-30-matriarca-sintetica': miniCyberMech,

  // MONSTROS DE ELDRIA (Sheet 4)
  'eldria-01-lobo-glacial': miniWerewolf,
  'eldria-02-gigante-yrmikr': miniStoneGolem,
  'eldria-03-driade-raizes': miniLeshy,
  'eldria-04-espreitador-musgoso': miniWerewolf,
  'eldria-05-basilisco-sol': miniBasilisk,
  'eldria-06-escorpiao-runico': miniSpiderBeast,
  'eldria-07-golem-magma': miniMagmaTitan,
  'eldria-08-salamandra-vulcanica': miniDragonWyrm,
  'eldria-09-gargula-obsidiana': miniStoneGolem,
  'eldria-10-assombracao-veu': miniSpectreBanshee,
  'eldria-11-sentinela-cristal': miniCyberDrone,
  'eldria-12-grifo-agulhas': miniGriffin,
  'eldria-13-espantalho-alaron': miniHeadlessRider,
  'eldria-14-lobo-trigo': miniWerewolf,
  'eldria-15-hidra-thalor': miniAbyssHorror,
  'eldria-16-sereia-canto': miniSpectreBanshee,
  'eldria-17-autômato-sobrecarga': miniCyberMech,
  'eldria-18-aranha-rede-neural': miniSpiderBeast,
  'eldria-19-cao-infernal-portais': miniWerewolf,
  'eldria-20-centauro-corsario': miniWerewolf,
  'eldria-21-verme-devorador-fenda': miniAbyssHorror,
  'eldria-22-necro-tecnomago': miniLichKing,
  'eldria-23-colosso-platina': miniCyberMech,
  'eldria-24-dragao-abismo-eterno': miniDragonWyrm,
};

/**
 * Returns a high-res themed tabletop RPG miniature image URL for any creature in Nexaria.
 */
export function getMonsterImageUrl(creature: {
  id?: string;
  name?: string;
  category?: string;
  creatureType?: string;
  imageUrl?: string;
}): string {
  if (creature.imageUrl && creature.imageUrl.trim().length > 0) {
    return creature.imageUrl;
  }

  if (creature.id && SPECIFIC_MONSTER_IMAGES[creature.id]) {
    return SPECIFIC_MONSTER_IMAGES[creature.id];
  }

  // Keyword-based fallback matching using authentic miniatures
  const nameLower = (creature.name || '').toLowerCase();
  const typeLower = (creature.creatureType || '').toLowerCase();
  const catLower = (creature.category || '').toLowerCase();

  // Specialized distinct creatures
  if (nameLower.includes('baba-yaga') || nameLower.includes('baba yaga') || nameLower.includes('bruxa')) {
    return miniBabaYaga;
  }
  if (nameLower.includes('minotauro')) {
    return miniMinotaur;
  }
  if (nameLower.includes('grifo')) {
    return miniGriffin;
  }
  if (nameLower.includes('fênix') || nameLower.includes('fenix')) {
    return miniPhoenix;
  }
  if (nameLower.includes('basilisco')) {
    return miniBasilisk;
  }
  if (nameLower.includes('kelpie')) {
    return miniKelpie;
  }
  if (nameLower.includes('leshy') || nameLower.includes('dríade') || nameLower.includes('driade') || nameLower.includes('espírito da floresta')) {
    return miniLeshy;
  }

  if (nameLower.includes('drag') || nameLower.includes('wyrm')) {
    return miniDragonWyrm;
  }
  if (nameLower.includes('lobo') || nameLower.includes('canino') || nameLower.includes('urso') || nameLower.includes('cão')) {
    return miniWerewolf;
  }
  if (nameLower.includes('aranha') || nameLower.includes('aracn') || nameLower.includes('escorp') || nameLower.includes('carrapato')) {
    return miniSpiderBeast;
  }
  if (nameLower.includes('serpente') || nameLower.includes('cobra') || nameLower.includes('verme')) {
    return miniDragonWyrm;
  }
  if (nameLower.includes('esqueleto') || nameLower.includes('crânio')) {
    return miniSkeletonWarrior;
  }
  if (nameLower.includes('zumbi') || nameLower.includes('cadáver') || nameLower.includes('podr')) {
    return miniSkeletonWarrior;
  }
  if (nameLower.includes('lich') || nameLower.includes('cavaleiro da morte') || nameLower.includes('senhor das almas')) {
    return miniLichKing;
  }
  if (nameLower.includes('cavaleiro sem cabeça') || nameLower.includes('espantalho')) {
    return miniHeadlessRider;
  }
  if (nameLower.includes('espectro') || nameLower.includes('fantasma') || nameLower.includes('dama') || nameLower.includes('banshee')) {
    return miniSpectreBanshee;
  }
  if (nameLower.includes('golem') || nameLower.includes('colosso') || nameLower.includes('troll') || nameLower.includes('ogro')) {
    return miniStoneGolem;
  }
  if (nameLower.includes('drone') || nameLower.includes('núcleo') || nameLower.includes('vírus') || nameLower.includes('dados')) {
    return miniCyberDrone;
  }
  if (nameLower.includes('sentinela') || nameLower.includes('cyber') || nameLower.includes('mecânic') || nameLower.includes('tanque') || nameLower.includes('robô') || nameLower.includes('autômato')) {
    return miniCyberMech;
  }
  if (nameLower.includes('slime') || nameLower.includes('ooze') || nameLower.includes('ácido')) {
    return miniSlimeOoze;
  }
  if (nameLower.includes('fogo') || nameLower.includes('chama') || nameLower.includes('magma') || nameLower.includes('vulcan') || nameLower.includes('titã')) {
    return miniMagmaTitan;
  }
  if (nameLower.includes('beholder') || nameLower.includes('olho') || nameLower.includes('cérebro')) {
    return miniBeholder;
  }
  if (nameLower.includes('mímico') || nameLower.includes('porta viva')) {
    return miniMimic;
  }
  if (nameLower.includes('krampus') || nameLower.includes('duende') || nameLower.includes('demônio')) {
    return miniKrampus;
  }
  if (typeLower.includes('aquático') || nameLower.includes('sereia') || nameLower.includes('kraken') || nameLower.includes('abissal') || nameLower.includes('devorador') || nameLower.includes('hidra')) {
    return miniAbyssHorror;
  }
  if (typeLower.includes('morto-vivo')) {
    return miniSkeletonWarrior;
  }
  if (typeLower.includes('elemental')) {
    return miniMagmaTitan;
  }
  if (typeLower.includes('mecânico') || catLower.includes('cibernet')) {
    return miniCyberMech;
  }
  if (typeLower.includes('besta')) {
    return miniWerewolf;
  }
  if (typeLower.includes('aberração')) {
    return miniAbyssHorror;
  }

  // Default atmospheric tabletop RPG miniature
  return miniAbyssHorror;
}
