import React, { useState } from 'react';
import {
  CharacterSheet,
  PLAYABLE_RACES,
  PLAYABLE_CLASSES,
  CLASS_CATEGORIES,
  RACE_CATEGORIES,
  DEFAULT_AVATAR_PRESETS,
  InventoryItem,
} from '../types/rpg';
import { ORIGIN_REGIONS, getRegionById } from '../data/eldriaWorldMap';
import {
  FIGHTING_STYLES,
  STARTING_WEAPONS,
  getClassStartingItems,
  calculateScaledDurability,
  getDurabilityStatus,
  FightingStyle,
  StartingWeapon,
} from '../data/startingGear';
import { campaignService } from '../services/campaignService';
import { sound } from '../utils/audio';
import {
  X,
  UserPlus,
  Sparkles,
  Dice5,
  Globe2,
  Languages,
  User,
  Swords,
  Shield,
  Heart,
  Droplets,
  Coins,
  Loader2,
  Check,
  Plus,
  Minus,
  Info,
  Crosshair,
  Package,
  Ban,
  Award,
  Wand2,
  BookOpen,
  FileText,
  CheckCircle,
} from 'lucide-react';

interface CharacterCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignCode: string;
  onCreateCharacter: (char: CharacterSheet) => void;
}

export const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({
  isOpen,
  onClose,
  campaignCode,
  onCreateCharacter,
}) => {
  const [charName, setCharName] = useState('');
  const [charTitle, setCharTitle] = useState('Aventureiro');
  const [charClass, setCharClass] = useState('Guerreiro Rúnico');
  const [charRace, setCharRace] = useState('Humano');
  const [selectedFightingStyle, setSelectedFightingStyle] = useState<string>('duelo_precisao');
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>('espada_ferro_enferrujada');
  const [charGender, setCharGender] = useState('Masculino');
  const [originRegion, setOriginRegion] = useState<string>('caeldrin');
  const [primaryLanguage, setPrimaryLanguage] = useState<string>('Caeldrico');
  const [knownLanguages, setKnownLanguages] = useState<string[]>(['Caeldrico', 'Comum']);

  // Attributes: base standard array with 3 free points to distribute
  const [freePoints, setFreePoints] = useState<number>(3);
  const [attributes, setAttributes] = useState<{
    FOR: number;
    DES: number;
    CON: number;
    INT: number;
    SAB: number;
    CAR: number;
  }>({
    FOR: 12,
    DES: 11,
    CON: 12,
    INT: 10,
    SAB: 10,
    CAR: 10,
  });

  // Avatar state & AI Studio
  const [selectedAvatar, setSelectedAvatar] = useState<string>(DEFAULT_AVATAR_PRESETS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isCustomUrlActive, setIsCustomUrlActive] = useState(false);
  const [isGeneratingAiAvatar, setIsGeneratingAiAvatar] = useState(false);
  const [aiAvatarFeedback, setAiAvatarFeedback] = useState<string | null>(null);
  const [aiStudioTab, setAiStudioTab] = useState<'create' | 'edit' | 'presets'>('create');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiEditPrompt, setAiEditPrompt] = useState('');
  const [aiStylePreset, setAiStylePreset] = useState('Dark Fantasy Nexaria');
  const [recentGeneratedAvatars, setRecentGeneratedAvatars] = useState<string[]>([]);

  // Smart AI Character Creation state (Gemini)
  const [conceptInput, setConceptInput] = useState('');
  const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);
  const [conceptFeedback, setConceptFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: string;
  } | null>(null);
  const [aiGeneratedBackstory, setAiGeneratedBackstory] = useState<string>('');
  const [aiPersonalityTraits, setAiPersonalityTraits] = useState<string>('');
  const [aiGeneratedGear, setAiGeneratedGear] = useState<InventoryItem[]>([]);
  const [aiGeneratedAbilities, setAiGeneratedAbilities] = useState<any[]>([]);

  if (!isOpen) return null;

  // Handle Region Change
  const handleRegionChange = (newRegionId: string) => {
    setOriginRegion(newRegionId);
    const reg = getRegionById(newRegionId);
    if (reg) {
      setPrimaryLanguage(reg.language);
      setKnownLanguages((prev) => {
        const set = new Set([reg.language, 'Comum', ...prev]);
        return Array.from(set);
      });
    }
  };

  // Smart Concept Generator with Gemini
  const handleGenerateSmartConcept = async (customConcept?: string) => {
    const textToUse = (customConcept || conceptInput).trim();
    if (!textToUse) return;

    setIsGeneratingConcept(true);
    setConceptFeedback(null);
    sound.playDiceRoll();

    try {
      const res = await campaignService.generateCharacterConcept({
        concept: textToUse,
        gender: charGender,
        preferredClass: charClass,
        preferredRace: charRace,
        preferredRegion: originRegion,
      });

      if (res.success && res.data) {
        sound.playLevelUp();
        const d = res.data;

        if (d.name) setCharName(d.name);
        if (d.title) setCharTitle(d.title);
        if (d.gender) setCharGender(d.gender);

        // Match or set race
        if (d.race) {
          const matchedRace = PLAYABLE_RACES.find((r) => r.name.toLowerCase() === d.race.toLowerCase());
          setCharRace(matchedRace ? matchedRace.name : d.race);
        }

        // Match or set class
        if (d.characterClass) {
          const matchedClass = PLAYABLE_CLASSES.find((c) => c.name.toLowerCase() === d.characterClass.toLowerCase());
          setCharClass(matchedClass ? matchedClass.name : d.characterClass);
        }

        // Region & languages
        if (d.originRegion) {
          handleRegionChange(d.originRegion);
        }
        if (d.primaryLanguage) {
          setPrimaryLanguage(d.primaryLanguage);
        }

        // Attributes
        if (d.attributes) {
          setAttributes({
            FOR: Math.max(8, Math.min(18, d.attributes.FOR || 10)),
            DES: Math.max(8, Math.min(18, d.attributes.DES || 10)),
            CON: Math.max(8, Math.min(18, d.attributes.CON || 10)),
            INT: Math.max(8, Math.min(18, d.attributes.INT || 10)),
            SAB: Math.max(8, Math.min(18, d.attributes.SAB || 10)),
            CAR: Math.max(8, Math.min(18, d.attributes.CAR || 10)),
          });
          setFreePoints(0);
        }

        // Backstory & personality
        setAiGeneratedBackstory(d.backgroundStory || '');
        setAiPersonalityTraits(d.personalityTraits || '');

        // Starting gear
        if (Array.isArray(d.startingGearSuggestions) && d.startingGearSuggestions.length > 0) {
          const gearItems: InventoryItem[] = d.startingGearSuggestions.map((g, idx) => ({
            id: `ai-item-${Date.now()}-${idx}`,
            name: g.name,
            category: (g.category as any) || 'equipamento',
            description: g.description || 'Equipamento temático de origem.',
            effectText: g.effectText,
            quantity: g.quantity || 1,
            valueAmount: 3,
            valueCurrency: 'BRZ',
            iconEmoji: g.iconEmoji || '🎒',
            equipped: g.category === 'arma' || g.category === 'armadura',
          }));
          setAiGeneratedGear(gearItems);
        }

        // Abilities
        if (Array.isArray(d.suggestedAbilities) && d.suggestedAbilities.length > 0) {
          const abils = d.suggestedAbilities.map((a, idx) => ({
            id: `ai-ability-${Date.now()}-${idx}`,
            name: a.name,
            classification: a.classification || 'Habilidade Temática',
            magicCost: a.magicCost || '3 PM',
            type: a.type || 'Ação Especial',
            range: a.range || 'Pessoal',
            description: a.description || 'Habilidade concebida sob medida.',
            effects: a.effects || 'Efeito temático',
            notes: 'Criado pela IA (Gemini)',
            useLimit: 'Conforme PM',
            damage: a.effects || '',
            tier: 'Nv 1',
            category: a.type || 'Ação',
          }));
          setAiGeneratedAbilities(abils);
        }

        // Pre-fill avatar prompt suggestion
        if (d.avatarPromptSuggestion) {
          setAiPrompt(d.avatarPromptSuggestion);
        } else {
          setAiPrompt(`${d.gender} ${d.race} ${d.characterClass}, ${d.title}, heroic dark fantasy RPG artwork`);
        }

        setConceptFeedback({
          type: 'success',
          message: `Ficha de "${d.name}" criada com sucesso pela IA!`,
          details: `Classe: ${d.characterClass} • Raça: ${d.race} • Atributos e equipamentos calibrados.`,
        });
      } else {
        setConceptFeedback({
          type: 'error',
          message: res.error || 'Não foi possível gerar a ficha inteligente no momento.',
        });
      }
    } catch (err: any) {
      setConceptFeedback({
        type: 'error',
        message: err?.message || 'Erro ao gerar ficha com IA.',
      });
    } finally {
      setIsGeneratingConcept(false);
    }
  };

  // Attribute Point Allocator
  const handleModifyAttribute = (attr: keyof typeof attributes, delta: number) => {
    if (delta > 0 && freePoints > 0) {
      setAttributes((prev) => ({ ...prev, [attr]: prev[attr] + 1 }));
      setFreePoints((prev) => prev - 1);
      sound.playCoinClink('PRT');
    } else if (delta < 0 && freePoints < 3 && attributes[attr] > 8) {
      setAttributes((prev) => ({ ...prev, [attr]: prev[attr] - 1 }));
      setFreePoints((prev) => prev + 1);
      sound.playCoinClink('BRZ');
    }
  };

  // AI Avatar Generator via Text Prompt
  const handleGenerateAiAvatar = async () => {
    if (isGeneratingAiAvatar) return;
    setIsGeneratingAiAvatar(true);
    setAiAvatarFeedback(null);
    sound.playDiceRoll();

    try {
      const res = await campaignService.generateCharacterPortrait({
        race: charRace,
        characterClass: charClass,
        gender: charGender,
        name: charName || 'Herói de Nexaria',
        title: charTitle || 'Aventureiro',
        originRegion: originRegion,
        prompt: aiPrompt,
        mode: 'create',
        stylePreset: aiStylePreset,
      });

      if (res.success && res.imageUrl) {
        sound.playCoinClink('ORO');
        setSelectedAvatar(res.imageUrl);
        setIsCustomUrlActive(false);
        setRecentGeneratedAvatars((prev) => [res.imageUrl!, ...prev.filter((u) => u !== res.imageUrl).slice(0, 7)]);
        setAiAvatarFeedback(`✓ Retrato gerado com sucesso para ${charRace} ${charClass}!`);
        setTimeout(() => setAiAvatarFeedback(null), 5000);
      } else {
        setAiAvatarFeedback(res.error || 'Não foi possível gerar o retrato agora.');
      }
    } catch (err: any) {
      setAiAvatarFeedback(err?.message || 'Erro ao gerar retrato de IA.');
    } finally {
      setIsGeneratingAiAvatar(false);
    }
  };

  // AI Avatar Editor via Text Prompt (Modify existing avatar)
  const handleEditAiAvatar = async () => {
    if (isGeneratingAiAvatar) return;
    if (!aiEditPrompt.trim()) {
      setAiAvatarFeedback('Digite o que deseja alterar ou adicionar na imagem.');
      return;
    }

    setIsGeneratingAiAvatar(true);
    setAiAvatarFeedback(null);
    sound.playRuneChime();

    try {
      const currentImg = isCustomUrlActive && customAvatarUrl ? customAvatarUrl : selectedAvatar;
      const res = await campaignService.generateCharacterPortrait({
        race: charRace,
        characterClass: charClass,
        gender: charGender,
        name: charName || 'Herói de Nexaria',
        title: charTitle || 'Aventureiro',
        prompt: aiEditPrompt,
        mode: 'edit',
        sourceImage: currentImg,
        stylePreset: aiStylePreset,
      });

      if (res.success && res.imageUrl) {
        sound.playSuccessFanfare();
        setSelectedAvatar(res.imageUrl);
        setIsCustomUrlActive(false);
        setRecentGeneratedAvatars((prev) => [res.imageUrl!, ...prev.filter((u) => u !== res.imageUrl).slice(0, 7)]);
        setAiAvatarFeedback(`✓ Imagem modificada com sucesso pela IA!`);
        setAiEditPrompt('');
        setTimeout(() => setAiAvatarFeedback(null), 5000);
      } else {
        setAiAvatarFeedback(res.error || 'Não foi possível editar o retrato agora.');
      }
    } catch (err: any) {
      setAiAvatarFeedback(err?.message || 'Erro ao modificar retrato com IA.');
    } finally {
      setIsGeneratingAiAvatar(false);
    }
  };

  const handleMeteOLouco = () => {
    sound.playDiceRoll();
    const crazyNames = [
      'Bartholomew o Gosmento',
      'Zero-X o Fraturado',
      'Gorgonzola o Padeiro de Guerra',
      'Valquíria das Chamas',
      'Barão Von Osso',
      'Kaelen da Fenda',
      'Lyra Chave-de-Fenda',
      'Lord Zargon Voador',
      'Margarida Martelo-Pesado',
      'Ignis o Piromaníaco',
      'Sombra-99 o Invasor',
      'Doutor Necrópole',
      'Pippin o Beberrão',
      'Capitão Mandíbula-de-Aço',
      'Madame Nebulosa',
      'Tromba-de-Aço o Demolidor',
      'Zape o Curto-Circuito',
      'Mirmidon X o Guerreiro-Formiga',
      'Kensei Musashi das Sombras',
      'Zzzt o Agulhão Alado',
      'Sylvain o Duelista de Florete',
      'Mantis o Degolador Silencioso',
      'Escaravelho Dourado de Eldria',
      'Don Quixote das Lâminas Rúnicas',
      'Katsuro o Ronin Sem Mestre',
    ];

    const crazyTitles = [
      'O Terror dos Bufês',
      'O Quebrador de Matrizes',
      'O Filho da Tempestade',
      'O Degustador de Venenos',
      'A Praga Ambulante',
      'O Algoz do Apocalipse',
      'O Pesadelo da Forja',
      'O Incontrolável',
      'O Rei dos Dados Viciados',
      'O Colecionador de Ossos',
      'O Mestre dos Glitches',
      'A Fúria Culinária de Eldria',
      'O Mestre Supremo do Iaidô',
      'O Retalhador de Mil Lâminas',
      'O Soberano da Colmeia Imperial',
      'O Agulhão Pirofórico',
      'O Duelista Imbatível de Rapier',
      'O Guardião da Carapaça Impenetrável',
      'O Dançarino do Turbilhão de Cimitarras',
      'O Ronin da Lâmina Amaldiçoada',
    ];

    const randomRace = PLAYABLE_RACES[Math.floor(Math.random() * PLAYABLE_RACES.length)];
    const randomClass = PLAYABLE_CLASSES[Math.floor(Math.random() * PLAYABLE_CLASSES.length)];
    const randomRegion = ORIGIN_REGIONS[Math.floor(Math.random() * ORIGIN_REGIONS.length)];
    const randomName = crazyNames[Math.floor(Math.random() * crazyNames.length)];
    const randomTitle = crazyTitles[Math.floor(Math.random() * crazyTitles.length)];
    const genders = ['Masculino', 'Feminino', 'Não-Binário', 'Agênero / Construto', 'Andrógino'];
    const randomGender = genders[Math.floor(Math.random() * genders.length)];

    setCharRace(randomRace.name);
    setCharClass(randomClass.name);
    setCharName(randomName);
    setCharTitle(randomTitle);
    setCharGender(randomGender);
    handleRegionChange(randomRegion.id);

    const randStyle = FIGHTING_STYLES[Math.floor(Math.random() * FIGHTING_STYLES.length)];
    setSelectedFightingStyle(randStyle.id);

    if (Math.random() < 0.15) {
      setSelectedWeaponId('weapon_none');
    } else {
      const weaponsOnly = STARTING_WEAPONS.filter((w) => !w.isNoneOption);
      const randWp = weaponsOnly[Math.floor(Math.random() * weaponsOnly.length)];
      setSelectedWeaponId(randWp.id);
    }

    const randAvatar = DEFAULT_AVATAR_PRESETS[Math.floor(Math.random() * DEFAULT_AVATAR_PRESETS.length)];
    setSelectedAvatar(randAvatar);
    setIsCustomUrlActive(false);

    let p = 3;
    const newAttrs = { FOR: 12, DES: 11, CON: 12, INT: 10, SAB: 10, CAR: 10 };
    const attrKeys: Array<keyof typeof newAttrs> = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'];
    while (p > 0) {
      const k = attrKeys[Math.floor(Math.random() * attrKeys.length)];
      newAttrs[k] += 1;
      p -= 1;
    }
    setAttributes(newAttrs);
    setFreePoints(0);
  };

  const getAttrMod = (val: number) => Math.floor((val - 10) / 2);

  // Selected Class details
  const selectedClassData = PLAYABLE_CLASSES.find(
    (c) => c.name.toLowerCase() === charClass.toLowerCase()
  ) || PLAYABLE_CLASSES[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!charName.trim()) return;

    const conMod = getAttrMod(attributes.CON);
    const intMod = getAttrMod(attributes.INT);
    const sabMod = getAttrMod(attributes.SAB);

    // Initial Hit points and Mana
    const baseHp = (selectedClassData?.hitDie ? parseInt(selectedClassData.hitDie.replace('d', '')) : 10) + Math.max(0, conMod);
    const baseMana = Math.max(5, 10 + Math.max(intMod, sabMod) * 2);
    const desMod = getAttrMod(attributes.DES);
    const baseAc = 10 + desMod;

    const finalAvatar = isCustomUrlActive && customAvatarUrl.trim()
      ? customAvatarUrl.trim()
      : selectedAvatar;

    const regData = getRegionById(originRegion);
    const chosenStyle = FIGHTING_STYLES.find((s) => s.id === selectedFightingStyle) || FIGHTING_STYLES[0];
    const chosenWeapon = STARTING_WEAPONS.find((w) => w.id === selectedWeaponId);

    // Class specific starter kit items
    const classSpecificGear = getClassStartingItems(charClass, selectedClassData?.category);

    // Starting weapon item with durability scaled by adventurer's physical ability and experience
    const physicalMod = Math.max(getAttrMod(attributes.FOR), getAttrMod(attributes.DES));
    const weaponDurability = chosenWeapon && chosenWeapon.baseDurability > 0
      ? calculateScaledDurability(chosenWeapon.baseDurability, 1, 0, physicalMod, selectedFightingStyle)
      : null;

    const weaponItems: InventoryItem[] = (chosenWeapon && !chosenWeapon.isNoneOption) ? [
      {
        id: `weapon-init-${Date.now()}`,
        name: chosenWeapon.name,
        quantity: 1,
        category: 'arma',
        equipped: true,
        description: `${chosenWeapon.description} [Dano: ${chosenWeapon.damage} ${chosenWeapon.damageType} | Propriedades: ${chosenWeapon.properties}]`,
        effectText: `Dano: ${chosenWeapon.damage} ${chosenWeapon.damageType} (${chosenWeapon.properties})${weaponDurability ? ` • Durabilidade: ${weaponDurability.current}/${weaponDurability.max}` : ''}`,
        weight: `${chosenWeapon.weightKg} kg`,
        weightKg: chosenWeapon.weightKg,
        valueAmount: chosenWeapon.valueAmount,
        valueCurrency: chosenWeapon.valueCurrency,
        iconEmoji: chosenWeapon.icon,
        durability: weaponDurability ? {
          current: weaponDurability.current,
          max: weaponDurability.max,
        } : undefined,
      },
    ] : [];

    // Standard adventure backpack & provisions
    const standardKit: InventoryItem[] = [
      {
        id: 'item-init-backpack',
        name: 'Mochila de Viagem Rúnica',
        quantity: 1,
        category: 'equipamento',
        description: 'Mochila resistente reforçada com couro e selos mágicos de Eldria.',
        weight: '1.0 kg',
        weightKg: 1,
        valueAmount: 5,
        valueCurrency: 'BRZ',
        iconEmoji: '🎒',
      },
      {
        id: 'item-init-rations',
        name: 'Rações de Viagem (3 dias)',
        quantity: 3,
        category: 'geral',
        description: 'Provisões para jornadas pelas estradas antigas.',
        weight: '1.0 kg',
        weightKg: 1,
        valueAmount: 3,
        valueCurrency: 'BRZ',
        iconEmoji: '🍞',
      },
      {
        id: 'item-init-potion',
        name: 'Poção Menor de Cura',
        quantity: 1,
        category: 'pocao',
        description: 'Restaura 1d8+2 Pontos de Vida instantaneamente.',
        weight: '0.5 kg',
        weightKg: 0.5,
        valueAmount: 1,
        valueCurrency: 'PRT',
        iconEmoji: '🧪',
      },
    ];

    const initialInventory: InventoryItem[] = [
      ...weaponItems,
      ...classSpecificGear,
      ...standardKit,
      ...aiGeneratedGear,
    ];

    const newChar: CharacterSheet = {
      id: 'char-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      campaignCode: campaignCode,
      name: charName.trim(),
      title: charTitle.trim() || 'Aventureiro de Eldria',
      characterClass: charClass.trim(),
      race: charRace.trim(),
      gender: charGender.trim(),
      originRegion: originRegion,
      primaryLanguage: primaryLanguage,
      knownLanguages: knownLanguages.length > 0 ? knownLanguages : [primaryLanguage, 'Comum'],
      currentLocation: regData ? `${regData.name} — ${regData.pointsOfInterest[0]?.name || 'Capital'}` : 'Caeldrin — Cidadela Estelar',
      level: 1,
      experience: 0,
      unspentAttributePoints: freePoints,
      starsLevel: 1,
      avatarUrl: finalAvatar,
      isOnline: true,
      lastActive: Date.now(),
      hp: {
        current: Math.max(12, baseHp),
        max: Math.max(12, baseHp),
      },
      mana: {
        current: baseMana,
        max: baseMana,
      },
      stamina: {
        current: 10,
        max: 10,
      },
      armorClass: baseAc,
      speed: '9m',
      initiative: desMod,
      attributes: {
        FOR: attributes.FOR,
        DES: attributes.DES,
        CON: attributes.CON,
        INT: attributes.INT,
        SAB: attributes.SAB,
        CAR: attributes.CAR,
      },
      traits: [
        { label: 'Especialização', value: selectedClassData.keyFeature || 'Técnica Inicial' },
        { label: 'Estilo de Luta', value: chosenStyle.name },
        { label: 'Arma Inicial', value: chosenWeapon?.isNoneOption ? 'Nenhuma (Desarmado)' : chosenWeapon?.name || 'Nenhuma' },
        { label: 'Região Natal', value: regData?.name || 'Caeldrin' },
        { label: 'Tradição', value: selectedClassData.category || 'Aventureiro' },
      ],
      fightingStyle: chosenStyle.name,
      fightingStyleDesc: chosenStyle.effectText,
      skillsList: selectedClassData.startingSkills || ['Atletismo', 'Percepção'],
      isMaster: false,
      wallet: {
        BRZ: 50,
        PRT: 10,
        ORO: 2,
        PLN: 0,
        CYB: 0,
      },
      abilities: [
        {
          id: 'spell-init-' + Date.now(),
          name: `${selectedClassData.keyFeature || 'Técnica Inicial'}`,
          classification: '1º Grau - Inato',
          magicCost: '2 PM',
          type: 'Habilidade de Classe',
          range: 'Pessoal / Curto',
          useLimit: 'À vontade',
          description: `Habilidade inata concedida pela classe ${charClass}.`,
          effects: selectedClassData.keyFeature || 'Técnica Inicial',
          notes: 'Habilidade de classe',
          iconEmoji: selectedClassData.icon || '⚔️',
        },
        ...aiGeneratedAbilities,
      ],
      inventory: initialInventory,
      notes: [
        aiGeneratedBackstory ? `## ANTECEDENTES & HISTÓRIA:\n${aiGeneratedBackstory}` : '',
        aiPersonalityTraits ? `## TRAÇOS DE PERSONALIDADE:\n${aiPersonalityTraits}` : '',
        `Ficha criada na sala ${campaignCode}. Estilo de luta: ${chosenStyle.name}. Arma: ${chosenWeapon?.isNoneOption ? 'Nenhuma' : chosenWeapon?.name || 'Nenhuma'}. Região de origem: ${regData?.name || originRegion}.`,
      ].filter(Boolean).join('\n\n'),
      adventureNotes: [
        ...(aiGeneratedBackstory
          ? [
              {
                id: `adv-note-backstory-${Date.now()}`,
                category: 'geral' as const,
                title: 'Antecedentes & Origem (IA)',
                content: aiGeneratedBackstory,
                locationTag: regData?.name || 'Nexaria',
                timestamp: Date.now(),
              },
            ]
          : []),
        {
          id: `adv-note-init-${Date.now()}`,
          category: 'local' as const,
          title: regData?.name || 'Região de Origem',
          content: `Terra natal do personagem. Povo conhecido pela língua ${regData?.language || 'ancestral'} e tradições de Eldria.`,
          locationTag: regData?.name || 'Eldria',
          timestamp: Date.now(),
        },
      ],
    };

    onCreateCharacter(newChar);
    sound.playSuccessFanfare();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-gradient-to-b from-[#160d2e] via-[#0e081c] to-[#080410] border border-amber-500/50 rounded-2xl shadow-2xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto my-auto text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-900/80 border border-zinc-700/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 flex items-center justify-center transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-purple-900/50 pr-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-900/40 border border-amber-500/60 flex items-center justify-center text-amber-300 shadow-md shrink-0">
              <UserPlus className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100">
                Forjar Nova Ficha de Personagem
              </h2>
              <p className="text-xs text-zinc-400 font-sans">
                Sala <strong className="text-amber-300 font-mono">{campaignCode}</strong> • {PLAYABLE_RACES.length} Raças & {PLAYABLE_CLASSES.length} Classes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMeteOLouco}
            className="self-start sm:self-center px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-purple-900/40 flex items-center gap-2 transition active:scale-95 border border-fuchsia-400/40 cursor-pointer"
            title="Gera uma combinação insana e aleatória de raça, classe, atributos e história!"
          >
            <Dice5 className="w-4 h-4 text-amber-200" />
            <span>Mete o Louco (Aleatório)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ============================================================ */}
          {/* CRIAÇÃO INTELIGENTE COM IA (GEMINI) - CONCEITO & AUTO-PREENCHIMENTO */}
          {/* ============================================================ */}
          <div className="p-4 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-purple-950/40 to-zinc-950/80 shadow-lg shadow-purple-950/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-purple-900/50 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 shadow-sm">
                  <Sparkles className="w-4 h-4 fill-zinc-950" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-cinzel font-bold text-amber-300 flex items-center gap-1.5">
                    <span>Criação Inteligente com IA (Gemini)</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-[9px] font-mono text-amber-300">
                      Auto-Preenchimento
                    </span>
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    Descreva qualquer ideia ou conceito e a IA calibrará atributos, antecedentes, perícias e equipamentos temáticos.
                  </p>
                </div>
              </div>
            </div>

            {/* Input field for character concept */}
            <div className="space-y-1.5">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={conceptInput}
                    onChange={(e) => setConceptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerateSmartConcept();
                      }
                    }}
                    placeholder="Ex: Um ladino desertor que encontrou uma adaga rúnica falante no Abismo e agora busca redenção..."
                    className="w-full bg-zinc-950/90 border border-amber-500/40 hover:border-amber-400 rounded-lg pl-3 pr-8 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  {conceptInput && (
                    <button
                      type="button"
                      onClick={() => setConceptInput('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateSmartConcept()}
                  disabled={isGeneratingConcept || !conceptInput.trim()}
                  className={`px-4 py-2 rounded-lg text-xs font-cinzel font-bold flex items-center justify-center gap-1.5 transition shadow-md whitespace-nowrap active:scale-95 ${
                    isGeneratingConcept
                      ? 'bg-purple-900/80 text-purple-300 border border-purple-700/60 cursor-wait'
                      : !conceptInput.trim()
                      ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-amber-950/50 cursor-pointer'
                  }`}
                  title="Conceber ficha completa automaticamente com a IA do Gemini"
                >
                  {isGeneratingConcept ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>Conjurando Ficha...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5 text-zinc-950" />
                      <span>Gerar com IA</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Inspiration chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                  💡 Ideias Rápidas:
                </span>
                {[
                  'Ladino com adaga falante',
                  'Paladino do escudo titânico',
                  'Alquimista pirotécnico de éter',
                  'Maga botânica necromante',
                  'Bárbaro lupino dos picos de gelo',
                  'Cyborg tecnomago de fendas',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setConceptInput(tag);
                      handleGenerateSmartConcept(tag);
                    }}
                    className="px-2 py-0.5 rounded-full bg-purple-950/70 hover:bg-purple-900 border border-purple-800/60 hover:border-amber-400/50 text-[10px] text-purple-200 hover:text-amber-200 transition cursor-pointer"
                  >
                    ✦ {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Feedback notification & summary card */}
            {conceptFeedback && (
              <div
                className={`p-3 rounded-lg text-xs border flex items-start justify-between gap-2.5 animate-fade-in ${
                  conceptFeedback.type === 'success'
                    ? 'bg-emerald-950/70 border-emerald-700 text-emerald-200 shadow-md shadow-emerald-950/40'
                    : 'bg-red-950/70 border-red-700 text-red-200 shadow-md shadow-red-950/40'
                }`}
              >
                <div className="flex items-start gap-2">
                  {conceptFeedback.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">{conceptFeedback.message}</span>
                    {conceptFeedback.details && (
                      <span className="text-[11px] text-zinc-300 block mt-0.5 font-sans">
                        {conceptFeedback.details}
                      </span>
                    )}
                    {aiGeneratedBackstory && (
                      <div className="mt-2 p-2 rounded bg-zinc-950/70 border border-emerald-800/40 text-[10.5px] text-zinc-300 leading-relaxed font-sans max-h-24 overflow-y-auto">
                        <strong className="text-amber-300 block mb-0.5">📜 Antecedente Gerado:</strong>
                        <span className="italic">"{aiGeneratedBackstory.slice(0, 220)}..."</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConceptFeedback(null)}
                  className="text-zinc-400 hover:text-white transition p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Identity: Name, Title, Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nome do Personagem *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Kaelen, Lyra, Theron..."
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
                className="w-full bg-zinc-950/90 border border-zinc-700/80 rounded-lg px-3.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Título / Epíteto
              </label>
              <input
                type="text"
                placeholder="Ex: A Espada do Abismo"
                value={charTitle}
                onChange={(e) => setCharTitle(e.target.value)}
                className="w-full bg-zinc-950/90 border border-zinc-700/80 rounded-lg px-3.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Sexo / Gênero</span>
              </label>
              <select
                value={charGender}
                onChange={(e) => setCharGender(e.target.value)}
                className="w-full bg-zinc-950/90 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Não-Binário">Não-Binário</option>
                <option value="Andrógino">Andrógino</option>
                <option value="Agênero / Construto">Agênero / Construto</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Class & Race */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Classe */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-amber-400" />
                  <span>Classe ({PLAYABLE_CLASSES.length} disponíveis)</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono">Nexaria RPG</span>
              </label>
              <select
                value={charClass}
                onChange={(e) => setCharClass(e.target.value)}
                className="w-full bg-zinc-950/90 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {CLASS_CATEGORIES.map((cat) => (
                  <optgroup key={cat} label={`── ${cat} ──`} className="bg-zinc-900 text-amber-300 font-semibold">
                    {PLAYABLE_CLASSES.filter((c) => c.category === cat).map((cls) => (
                      <option key={cls.id} value={cls.name} className="bg-zinc-950 text-zinc-100 font-normal">
                        {cls.icon} {cls.name} ({cls.primaryAttribute})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* Class Info Box */}
              {selectedClassData && (
                <div className="mt-2 p-2.5 rounded-lg bg-purple-950/30 border border-purple-900/50 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-amber-300 font-semibold">
                    <span>{selectedClassData.icon} {selectedClassData.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
                      Dado de Vida: {selectedClassData.hitDie} • Principal: {selectedClassData.primaryAttribute}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-[10px] leading-relaxed">{selectedClassData.description}</p>
                  <div className="text-[9px] text-zinc-400">
                    <strong className="text-zinc-300">Habilidade Chave:</strong> {selectedClassData.keyFeature}
                  </div>
                </div>
              )}
            </div>

            {/* Raça */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Raça Ancestral ({PLAYABLE_RACES.length} disponíveis)</span>
                </span>
                <span className="text-[10px] text-purple-300 font-mono">Eldria</span>
              </label>
              <select
                value={charRace}
                onChange={(e) => setCharRace(e.target.value)}
                className="w-full bg-zinc-950/90 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {RACE_CATEGORIES.map((grp) => (
                  <optgroup key={grp} label={`── ${grp} ──`} className="bg-zinc-900 text-purple-300 font-semibold">
                    {PLAYABLE_RACES.filter((r) => r.category === grp).map((race) => (
                      <option key={race.id} value={race.name} className="bg-zinc-950 text-zinc-100 font-normal">
                        {race.name} ({race.traits.slice(0, 24)}...)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* Race Info Box */}
              {(() => {
                const selRace = PLAYABLE_RACES.find((r) => r.name.toLowerCase() === charRace.toLowerCase());
                if (!selRace) return null;
                return (
                  <div className="mt-2 p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-amber-300 font-semibold">
                      <span>{selRace.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-400 font-mono">
                        {selRace.category}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-[10px] leading-relaxed">{selRace.description}</p>
                    <div className="text-[9px] text-zinc-400">
                      <strong className="text-zinc-300">Traço Racial:</strong> {selRace.traits}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ============================================================ */}
          {/* ESTILO DE LUTA & POSTURA MARCIAL */}
          {/* ============================================================ */}
          <div className="p-4 rounded-xl border border-purple-900/60 bg-zinc-950/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <label className="text-xs font-cinzel font-bold text-amber-200 flex items-center gap-2">
                <Swords className="w-4 h-4 text-amber-400" />
                <span>Estilo de Luta & Postura de Combate ({FIGHTING_STYLES.length} opções)</span>
              </label>
              <span className="text-[10px] text-amber-400/90 font-mono">Bônus Passivo</span>
            </div>

            <div>
              <select
                value={selectedFightingStyle}
                onChange={(e) => setSelectedFightingStyle(e.target.value)}
                className="w-full bg-zinc-950/90 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {Array.from(new Set(FIGHTING_STYLES.map((s) => s.category))).map((cat) => (
                  <optgroup key={cat} label={`── ${cat} ──`} className="bg-zinc-900 text-amber-300 font-semibold">
                    {FIGHTING_STYLES.filter((s) => s.category === cat).map((style) => (
                      <option key={style.id} value={style.id} className="bg-zinc-950 text-zinc-100 font-normal">
                        {style.icon} {style.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* Selected Fighting Style Card */}
              {(() => {
                const currentStyle = FIGHTING_STYLES.find((s) => s.id === selectedFightingStyle) || FIGHTING_STYLES[0];
                if (!currentStyle) return null;
                return (
                  <div className="mt-2.5 p-3 rounded-lg bg-gradient-to-br from-amber-950/30 to-purple-950/30 border border-amber-500/40 text-[11px] space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between text-amber-300 font-semibold">
                      <span className="flex items-center gap-1.5 text-xs">
                        <span>{currentStyle.icon}</span>
                        <span>{currentStyle.name}</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-amber-600/40 text-amber-300 font-mono">
                        {currentStyle.category}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-[10px]">{currentStyle.description}</p>
                    <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800 text-[11px] text-amber-200 font-medium">
                      <strong className="text-amber-400">Efeito em Jogo:</strong> {currentStyle.effectText}
                    </div>
                    <div className="text-[9px] text-zinc-400">
                      <strong className="text-zinc-300">Recomendado para:</strong> {currentStyle.recommendedFor}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ============================================================ */}
          {/* TABELA DE ARMAS INICIAIS */}
          {/* ============================================================ */}
          <div className="p-4 rounded-xl border border-purple-900/60 bg-zinc-950/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-cinzel font-bold text-amber-200">
                  Tabela de Armas Iniciais & Equipamento de Combate
                </h4>
              </div>
              <span className="text-[10px] text-zinc-400">
                Selecione uma arma ou opte por começar sem armas
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60 max-h-60 overflow-y-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-zinc-950/90 text-zinc-400 sticky top-0 border-b border-zinc-800 text-[10px] uppercase font-mono tracking-wider z-10">
                  <tr>
                    <th className="py-2 px-3 w-10 text-center">Sel.</th>
                    <th className="py-2 px-3">Arma Inicial Rústica</th>
                    <th className="py-2 px-2 hidden sm:table-cell">Categoria</th>
                    <th className="py-2 px-3">Dano</th>
                    <th className="py-2 px-2 text-center">Durabilidade</th>
                    <th className="py-2 px-3 hidden md:table-cell">Propriedades</th>
                    <th className="py-2 px-2 text-right">Peso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                  {STARTING_WEAPONS.map((weapon) => {
                    const isSelected = selectedWeaponId === weapon.id;
                    const isNone = weapon.isNoneOption;
                    const physicalMod = Math.max(getAttrMod(attributes.FOR), getAttrMod(attributes.DES));
                    const scaledDur = weapon.baseDurability > 0
                      ? calculateScaledDurability(weapon.baseDurability, 1, 0, physicalMod, selectedFightingStyle)
                      : null;

                    return (
                      <tr
                        key={weapon.id}
                        onClick={() => {
                          setSelectedWeaponId(weapon.id);
                          sound.playCoinClink(isNone ? 'BRZ' : 'PRT');
                        }}
                        className={`cursor-pointer transition ${
                          isSelected
                            ? isNone
                              ? 'bg-emerald-950/40 text-emerald-200 border-l-4 border-emerald-400'
                              : 'bg-amber-950/40 text-amber-200 border-l-4 border-amber-400'
                            : 'hover:bg-zinc-850/60'
                        }`}
                      >
                        <td className="py-2 px-3 text-center">
                          <input
                            type="radio"
                            name="starting_weapon"
                            checked={isSelected}
                            onChange={() => setSelectedWeaponId(weapon.id)}
                            className="cursor-pointer accent-amber-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2 font-medium">
                            <span className="text-base">{weapon.icon}</span>
                            <span className={isNone ? 'text-emerald-300 font-semibold' : 'text-zinc-100'}>
                              {weapon.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 hidden sm:table-cell text-zinc-400 text-[10px] font-mono">
                          {weapon.category}
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold text-amber-300">
                          {weapon.damage} <span className="text-[9px] text-zinc-400 font-sans">({weapon.damageType})</span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          {scaledDur ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-1.5 py-0.5 rounded bg-zinc-800/90 text-amber-300 font-mono text-[10px] border border-zinc-700/60">
                                {scaledDur.max} pts
                              </span>
                              {scaledDur.bonusValue !== 0 && (
                                <span className={`text-[8px] font-mono font-bold ${scaledDur.bonusValue > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {scaledDur.bonusValue > 0 ? `+${scaledDur.bonusValue}` : scaledDur.bonusValue} exp/manejo
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-600 font-mono text-[10px]">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 hidden md:table-cell text-zinc-400 text-[10px]">
                          {weapon.properties}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-zinc-400 text-[10px]">
                          {weapon.weightKg > 0 ? `${weapon.weightKg} kg` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Selected Weapon Detail Banner */}
            {(() => {
              const curWp = STARTING_WEAPONS.find((w) => w.id === selectedWeaponId);
              if (!curWp) return null;

              if (curWp.isNoneOption) {
                return (
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-700/50 flex items-start gap-2.5 text-xs text-emerald-200">
                    <Ban className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-300">Opção Escolhida: Nenhuma Arma Inicial</strong>
                      <p className="text-[10px] text-emerald-100/80 mt-0.5 leading-relaxed">
                        Seu aventureiro começará de mãos vazias. Suas mãos estão livres para desferir socos e artes marciais, utilizar garras raciais, conjurar magias inatas ou comprar novas armas durante as sessões com as moedas da carteira inicial!
                      </p>
                    </div>
                  </div>
                );
              }

              const physicalMod = Math.max(getAttrMod(attributes.FOR), getAttrMod(attributes.DES));
              const durData = calculateScaledDurability(curWp.baseDurability, 1, 0, physicalMod, selectedFightingStyle);
              const durStatus = getDurabilityStatus(durData.current, durData.max);

              return (
                <div className="p-3 rounded-lg bg-zinc-900/80 border border-amber-600/40 space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{curWp.icon}</span>
                      <div>
                        <div className="font-bold text-amber-200 flex items-center gap-2">
                          <span>{curWp.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400">
                            {curWp.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 line-clamp-1">{curWp.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
                      <span className="text-amber-300 font-bold">{curWp.damage} {curWp.damageType}</span>
                      <span className="text-zinc-400">Peso: {curWp.weightKg} kg</span>
                    </div>
                  </div>

                  {/* Durabilidade Escalada com Experiência */}
                  <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[10px] space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="flex items-center gap-1.5 font-bold text-zinc-200">
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        <span>Durabilidade Física da Arma:</span>
                        <span className={`font-mono ${durStatus.colorClass}`}>
                          {durData.current} / {durData.max} pts ({durStatus.label})
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-700/60 text-purple-300 font-mono text-[9px]">
                          {durData.tierLabel}
                        </span>
                      </span>
                      <span className="text-[9px] text-amber-300 font-mono">
                        {durData.bonusText}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${durStatus.barColor} transition-all duration-300`}
                        style={{ width: `${durStatus.percentage}%` }}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[9px] text-zinc-400 pt-0.5 gap-1">
                      <span>Base da arma: <strong>{curWp.baseDurability} pts</strong></span>
                      <span>Manejo Físico: <strong>{physicalMod >= 0 ? `+${physicalMod}` : physicalMod} (FOR/DES)</strong></span>
                      <span>Taxa de Preservação: <strong>{(durData.preservationRate * 100).toFixed(0)}%</strong></span>
                    </div>
                    <p className="text-[9px] text-zinc-500 italic border-t border-zinc-900 pt-1">
                      💡 A experiência e nível do jogador afetam diretamente a preservação da arma: veteranos cuidam melhor do gume e gastam menos durabilidade por golpe, enquanto armas rústicas novatas desgastam mais rapidamente.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ============================================================ */}
          {/* ITENS INICIAIS ESPECÍFICOS DA CLASSE */}
          {/* ============================================================ */}
          <div className="p-4 rounded-xl border border-purple-900/60 bg-zinc-950/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-cinzel font-bold text-amber-200">
                  Equipamento Inicial da Classe ({selectedClassData.icon} {selectedClassData.name})
                </h4>
              </div>
              <span className="text-[10px] text-purple-300 font-mono">Kit Temático de Classe</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {getClassStartingItems(charClass, selectedClassData?.category).map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-purple-900/40 bg-zinc-900/70 flex flex-col justify-between space-y-1.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-100">
                      <span>{item.iconEmoji || '📦'}</span>
                      <span className="text-[11px] leading-tight">{item.name}</span>
                    </div>
                    {item.quantity > 1 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono shrink-0">
                        x{item.quantity}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 pt-1 border-t border-zinc-800/60">
                    <span className="capitalize">{item.category}</span>
                    <span>{item.weightKg ? `${item.weightKg} kg` : ''}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Standard Survival Kit Notice */}
            <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800 text-[10px] text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">+ Kit Padrão de Expedição:</span>
                <span>Mochila Rúnica (1kg), 3x Rações de Viagem (3 dias) e 1x Poção Menor de Cura (1d8+2 PV).</span>
              </span>
              <span className="text-zinc-500 font-mono shrink-0">Carteira: 50 BRZ, 10 PRT, 2 ORO</span>
            </div>
          </div>

          {/* Origin Region & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Região de Origem em Eldria</span>
              </label>
              <select
                value={originRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="w-full bg-zinc-950/90 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {ORIGIN_REGIONS.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    {reg.symbol} {reg.name} — {reg.subtitle}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-amber-400" />
                <span>Idioma Materno</span>
              </label>
              <input
                type="text"
                value={primaryLanguage}
                onChange={(e) => setPrimaryLanguage(e.target.value)}
                className="w-full bg-zinc-950/90 border border-zinc-700/80 rounded-lg px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Attribute Distribution with 3 Free Points */}
          <div className="p-4 rounded-xl border border-purple-900/60 bg-zinc-950/60 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Dice5 className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-cinzel font-bold text-amber-200">
                  Distribuição de Atributos (3 Pontos Livres)
                </h4>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-mono ${
                freePoints > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {freePoints} pontos livres restantes
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
              {(['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'] as const).map((attr) => {
                const val = attributes[attr];
                const mod = getAttrMod(val);
                const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

                return (
                  <div key={attr} className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/80 flex flex-col items-center">
                    <span className="text-[11px] font-bold text-zinc-300 font-cinzel">{attr}</span>
                    <span className="text-lg font-bold font-mono text-zinc-100 my-0.5">{val}</span>
                    <span className="text-[10px] text-amber-400 font-mono mb-2">Mod {modStr}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleModifyAttribute(attr, -1)}
                        disabled={val <= 8 || freePoints >= 3}
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs disabled:opacity-40 transition"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModifyAttribute(attr, 1)}
                        disabled={freePoints <= 0}
                        className="w-6 h-6 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold flex items-center justify-center text-xs disabled:opacity-40 transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* ATELIÊ DE RETRATOS & IA STUDIO (CRIAR & EDITAR COM GEMINI 3.1 FLASH) */}
          {/* ============================================================ */}
          <div className="p-4 rounded-xl border border-purple-900/60 bg-gradient-to-b from-[#140a24]/90 via-zinc-950/90 to-[#0e0719]/90 space-y-4 shadow-xl">
            {/* Header & Mode Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-purple-900/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/30 to-purple-600/30 border border-amber-500/50 flex items-center justify-center text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-xs font-cinzel font-bold text-amber-200 flex items-center gap-1.5">
                    <span>Ateliê de Retratos com Inteligência Artificial</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 border border-purple-700 text-purple-300 font-mono">
                      Gemini 3.1 Flash
                    </span>
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    Crie ilustrações inéditas por texto ou edite imagens existentes com magia visual.
                  </p>
                </div>
              </div>

              {/* Subtabs for Avatar Section */}
              <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800 text-xs self-stretch sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAiStudioTab('create')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                    aiStudioTab === 'create'
                      ? 'bg-amber-500 text-zinc-950 shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Criar com IA</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAiStudioTab('edit')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                    aiStudioTab === 'edit'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>🪄 Editar Imagem</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAiStudioTab('presets')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                    aiStudioTab === 'presets'
                      ? 'bg-zinc-800 text-amber-300 shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>🖼️ Galeria</span>
                </button>
              </div>
            </div>

            {/* Main Avatar Preview + Controls Row */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Avatar Big Preview */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-500/70 shadow-xl shadow-amber-950/40 bg-zinc-900">
                  <img
                    src={isCustomUrlActive && customAvatarUrl ? customAvatarUrl : selectedAvatar}
                    alt="Retrato Selecionado"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {isGeneratingAiAvatar && (
                    <div className="absolute inset-0 bg-purple-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-2">
                      <Loader2 className="w-6 h-6 text-amber-400 animate-spin mb-1" />
                      <span className="text-[10px] font-cinzel font-bold text-amber-200">
                        {aiStudioTab === 'edit' ? 'Modificando...' : 'Conjurando...'}
                      </span>
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2 py-0.5 rounded-full bg-zinc-950 border border-amber-500/40 text-[9px] font-mono text-amber-300 text-center shadow">
                  Retrato Ativo
                </span>
              </div>

              {/* Dynamic Tab Body */}
              <div className="flex-1 w-full space-y-3">
                {/* 1. TAB: CRIAR DO ZERO COM IA */}
                {aiStudioTab === 'create' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-zinc-300">
                        Prompt de Texto para Criação
                      </span>
                      <select
                        value={aiStylePreset}
                        onChange={(e) => setAiStylePreset(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-[11px] text-amber-300 focus:outline-none focus:border-amber-400 cursor-pointer"
                        title="Estilo Artístico de Nexaria"
                      >
                        <option value="Dark Fantasy Nexaria">Estilo: Dark Fantasy Nexaria</option>
                        <option value="Cyber-Arcano & Éter">Estilo: Cyber-Arcano &amp; Éter</option>
                        <option value="Pintura Épica a Óleo">Estilo: Pintura Épica a Óleo</option>
                        <option value="Anime Sombrio de RPG">Estilo: Anime Sombrio de RPG</option>
                        <option value="Arte Conceitual Hiper-detalhada">Estilo: Concept Art Realista</option>
                      </select>
                    </div>

                    <div className="relative">
                      <textarea
                        rows={2}
                        placeholder={`Descreva a aparência desejada (ex: ${charRace} ${charClass} com olhos incandescentes, manto rúnico, elmo com chifres e cicatriz de batalha)...`}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="w-full bg-zinc-950/90 border border-zinc-700/80 rounded-lg p-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 resize-none font-sans"
                      />
                    </div>

                    {/* Quick Inspiration Tag Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-zinc-500 font-mono">Adicionar:</span>
                      {[
                        'Elmo Rúnico',
                        'Olhos de Éter Azul',
                        'Cicatriz de Guerra',
                        'Capa com Capuz',
                        'Armadura Dourada',
                        'Tatuagens Místicas',
                        'Aura Arcana',
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setAiPrompt((prev) => (prev ? `${prev}, ${tag}` : tag));
                          }}
                          className="px-2 py-0.5 rounded-full bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/60 text-purple-200 text-[10px] font-sans transition hover:scale-105 active:scale-95"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-zinc-500">
                        Usa classe ({charClass}) e raça ({charRace}) automaticamente
                      </span>
                      <button
                        type="button"
                        onClick={handleGenerateAiAvatar}
                        disabled={isGeneratingAiAvatar}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 text-zinc-950 text-xs font-cinzel font-bold flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition disabled:opacity-50"
                      >
                        {isGeneratingAiAvatar ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Gerando Imagem...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                            <span>Gerar Retrato com IA</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. TAB: EDITAR IMAGEM ATUAL COM IA */}
                {aiStudioTab === 'edit' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-purple-300 flex items-center gap-1">
                        <span>🪄 Edição de Imagem Guiada por Prompt</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        gemini-3.1-flash-image-preview
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Descreva o que deseja transformar, acrescentar ou alterar no retrato atual (ex: trocar a cor dos olhos, acrescentar um elmo, mudar o fundo ou adicionar uma capa).
                    </p>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: Adicionar capuz místico negro e olhos violáceos brilhantes..."
                        value={aiEditPrompt}
                        onChange={(e) => setAiEditPrompt(e.target.value)}
                        className="w-full bg-zinc-950/90 border border-purple-800/80 rounded-lg p-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-400 font-sans"
                      />
                    </div>

                    {/* Quick Edit Suggestions */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-zinc-500 font-mono">Exemplos:</span>
                      {[
                        'Adicionar capuz e olhos dourados',
                        'Colocar armadura reluzente de prata',
                        'Adicionar cicatriz dramática no olho',
                        'Mudar fundo para caverna escura',
                      ].map((sugg) => (
                        <button
                          key={sugg}
                          type="button"
                          onClick={() => setAiEditPrompt(sugg)}
                          className="px-2 py-0.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-sans transition"
                        >
                          "{sugg}"
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleEditAiAvatar}
                        disabled={isGeneratingAiAvatar || !aiEditPrompt.trim()}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-cinzel font-bold flex items-center gap-1.5 shadow-md shadow-purple-950/50 transition disabled:opacity-50"
                      >
                        {isGeneratingAiAvatar ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Aplicando Edição...</span>
                          </>
                        ) : (
                          <>
                            <span>🪄 Aplicar Edição de IA</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. TAB: PRESETS & URL DIRETA */}
                {aiStudioTab === 'presets' && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-zinc-300 block">
                      Galeria de Retratos Predefinidos
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {DEFAULT_AVATAR_PRESETS.map((avatarUrl, idx) => (
                        <img
                          key={idx}
                          src={avatarUrl}
                          alt={`Opção ${idx + 1}`}
                          onClick={() => {
                            setSelectedAvatar(avatarUrl);
                            setIsCustomUrlActive(false);
                            sound.playCoinClink('PRT');
                          }}
                          referrerPolicy="no-referrer"
                          className={`w-12 h-12 rounded-xl object-cover cursor-pointer shrink-0 border-2 transition ${
                            !isCustomUrlActive && selectedAvatar === avatarUrl
                              ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/30'
                              : 'border-zinc-800 opacity-70 hover:opacity-100 hover:border-zinc-600'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="pt-1">
                      <label className="text-[11px] text-zinc-400 block mb-1">
                        Ou cole uma URL direta de imagem:
                      </label>
                      <input
                        type="url"
                        placeholder="https://exemplo.com/minha-imagem.jpg"
                        value={customAvatarUrl}
                        onChange={(e) => {
                          setCustomAvatarUrl(e.target.value);
                          setIsCustomUrlActive(Boolean(e.target.value.trim()));
                        }}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Session Generation History (Quick switch between generated images) */}
            {recentGeneratedAvatars.length > 0 && (
              <div className="pt-2 border-t border-purple-900/40">
                <span className="text-[10px] text-zinc-400 block mb-1.5 font-mono">
                  ✦ Histórico de Gerações desta Sessão (clique para escolher):
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {recentGeneratedAvatars.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Geração ${i + 1}`}
                      onClick={() => {
                        setSelectedAvatar(url);
                        setIsCustomUrlActive(false);
                        sound.playCoinClink('PRT');
                      }}
                      referrerPolicy="no-referrer"
                      className={`w-11 h-11 rounded-xl object-cover cursor-pointer border-2 transition ${
                        selectedAvatar === url
                          ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/30'
                          : 'border-zinc-800 opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Message */}
            {aiAvatarFeedback && (
              <div className="p-2.5 rounded-lg bg-purple-950/70 border border-purple-700/80 text-xs text-purple-200 flex items-center gap-2 shadow">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{aiAvatarFeedback}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-900/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-zinc-950 font-bold text-xs font-cinzel uppercase tracking-wider rounded-xl shadow-lg shadow-amber-950/40 flex items-center gap-2 transition"
            >
              <UserPlus className="w-4 h-4 text-zinc-950" />
              Forjar Ficha e Jogar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
