import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { SAMPLE_MARKET_ITEMS } from './src/data/defaultCampaign';
import {
  CampaignRoom,
  CharacterSheet,
  CurrencyType,
  CURRENCY_CONFIGS,
  PaymentRequest,
  Transaction,
  Wallet,
  getExpForNextLevel,
  CampaignChronicleEvent,
  RoomColorScheme,
} from './src/types/rpg';
import { generateRandomRoomCode, normalizeRoomCode } from './src/utils/roomCode';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'campaigns.json');

app.use(express.json({ limit: '10mb' }));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Validate room code to prevent path traversal, prototype pollution, or invalid characters
function isValidRoomCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  return /^[A-Z0-9_-]{3,24}$/.test(code.trim().toUpperCase());
}

// In-memory campaign store
const campaigns = new Map<string, CampaignRoom>();

// Active SSE client connections per campaign code
const sseClients = new Map<string, Set<Response>>();
const globalSseClients = new Set<Response>();

// Ensure data directory exists
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not create data directory', err);
  }
}

// Load campaigns from disk
function loadCampaignsFromDisk() {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, CampaignRoom>;
      campaigns.clear();
      let purgedNexaria = false;
      for (const key of Object.keys(parsed)) {
        const item = parsed[key];
        if (key.toUpperCase() === 'NEXARIA-01' || item?.name?.toLowerCase().includes('o legado do abismo')) {
          purgedNexaria = true;
          continue;
        }
        campaigns.set(key.toUpperCase(), item);
      }
      if (purgedNexaria) {
        saveCampaignsToDisk();
      }
      console.log(`Loaded ${campaigns.size} campaigns from disk.`);
    }
  } catch (err) {
    console.error('Error loading campaigns from disk', err);
  }
}

// Save campaigns to disk
function saveCampaignsToDisk() {
  ensureDataDir();
  try {
    const obj: Record<string, CampaignRoom> = {};
    campaigns.forEach((camp, code) => {
      obj[code] = camp;
    });
    fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving campaigns to disk', err);
  }
}

// Broadcast campaign updates to SSE clients
function broadcastUpdate(code: string, campaign: CampaignRoom) {
  saveCampaignsToDisk();

  const upperCode = code.toUpperCase();
  const clients = sseClients.get(upperCode);
  if (clients && clients.size > 0) {
    const payload = `data: ${JSON.stringify({ type: 'CAMPAIGN_UPDATED', code: upperCode, campaign })}\n\n`;
    clients.forEach((client) => {
      try {
        client.write(payload);
      } catch {
        clients.delete(client);
      }
    });
  }

  // Notify global listeners
  const globalPayload = `data: ${JSON.stringify({ type: 'ROOMS_CHANGED', code: upperCode })}\n\n`;
  globalSseClients.forEach((client) => {
    try {
      client.write(globalPayload);
    } catch {
      globalSseClients.delete(client);
    }
  });
}

function broadcastDeletion(code: string) {
  saveCampaignsToDisk();
  const upperCode = code.toUpperCase();
  const clients = sseClients.get(upperCode);
  if (clients) {
    const payload = `data: ${JSON.stringify({ type: 'CAMPAIGN_DELETED', code: upperCode })}\n\n`;
    clients.forEach((client) => {
      try {
        client.write(payload);
      } catch {
        clients.delete(client);
      }
    });
  }

  const globalPayload = `data: ${JSON.stringify({ type: 'ROOMS_CHANGED', code: upperCode })}\n\n`;
  globalSseClients.forEach((client) => {
    try {
      client.write(globalPayload);
    } catch {
      globalSseClients.delete(client);
    }
  });
}

// ---------------- API ROUTES ----------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', online: true, timestamp: Date.now() });
});

// Generate guaranteed unique random room code
app.get('/api/generate-code', (req: Request, res: Response) => {
  let code = generateRandomRoomCode();
  let attempts = 0;
  while (campaigns.has(code) && attempts < 20) {
    code = generateRandomRoomCode();
    attempts++;
  }
  res.json({ code });
});

// List all campaigns
app.get('/api/campaigns', (req: Request, res: Response) => {
  const list = Array.from(campaigns.values()).map((c) => ({
    code: c.code,
    name: c.name,
    gmName: c.gmName,
    description: c.description,
    createdAt: c.createdAt,
    playerCount: c.players.length,
    transactionCount: c.transactions.length,
  }));
  res.json(list);
});

// Get a single campaign
app.get('/api/campaigns/:code', (req: Request, res: Response) => {
  if (!isValidRoomCode(req.params.code)) {
    res.status(400).json({ error: 'Código de sala inválido. Utilize de 3 a 24 caracteres alfanuméricos.' });
    return;
  }
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);
  if (!camp) {
    res.status(404).json({ error: `Sala "${code}" não encontrada no servidor.` });
    return;
  }
  res.json(camp);
});

// Create a new campaign with random room code (or custom code)
app.post('/api/campaigns', (req: Request, res: Response) => {
  const { name, gmName, description, customCode, startingWallet } = req.body || {};

  let code: string;
  if (customCode && typeof customCode === 'string' && customCode.trim()) {
    if (!isValidRoomCode(customCode)) {
      res.status(400).json({ error: 'Código personalizado inválido. Utilize de 3 a 24 caracteres alfanuméricos.' });
      return;
    }
    code = normalizeRoomCode(customCode);
  } else {
    // Generate completely random room code
    code = generateRandomRoomCode();
    while (campaigns.has(code)) {
      code = generateRandomRoomCode();
    }
  }

  if (campaigns.has(code)) {
    res.status(400).json({ error: `O código de sala "${code}" já está em uso. Por favor, gere outro código.` });
    return;
  }

  const defaultWallet: Wallet = startingWallet || {
    BRZ: 50,
    PRT: 10,
    ORO: 2,
    PLN: 0,
    CYB: 0,
  };

  const newCampaign: CampaignRoom = {
    code,
    name: (name && String(name).trim()) || 'Nexaria — O Legado do Abismo',
    gmName: (gmName && String(gmName).trim()) || 'Mestre do Jogo',
    description: (description && String(description).trim()) || 'Mesa de RPG criada em Nexaria — O Legado do Abismo.',
    createdAt: Date.now(),
    startingWallet: defaultWallet,
    gmWallet: {
      BRZ: 1000,
      PRT: 250,
      ORO: 50,
      PLN: 10,
      CYB: 5,
    },
    players: [],
    transactions: [],
    marketItems: [...SAMPLE_MARKET_ITEMS],
    paymentRequests: [],
  };

  campaigns.set(code, newCampaign);
  broadcastUpdate(code, newCampaign);
  res.status(201).json(newCampaign);
});

// Update campaign metadata
app.put('/api/campaigns/:code', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);
  if (!camp) {
    res.status(404).json({ error: 'Sala não encontrada.' });
    return;
  }

  const updated: CampaignRoom = {
    ...camp,
    ...req.body,
    code, // preserve code
  };

  campaigns.set(code, updated);
  broadcastUpdate(code, updated);
  res.json(updated);
});

// Delete campaign
app.delete('/api/campaigns/:code', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  if (!campaigns.has(code)) {
    res.status(404).json({ error: 'Sala não encontrada.' });
    return;
  }

  campaigns.delete(code);
  broadcastDeletion(code);
  res.json({ success: true, message: `Sala ${code} removida com sucesso.` });
});

// Add or update character in a campaign
app.post('/api/campaigns/:code/character', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);
  if (!camp) {
    res.status(404).json({ error: 'Sala não encontrada.' });
    return;
  }

  const char: CharacterSheet = req.body;
  if (!char || !char.name) {
    res.status(400).json({ error: 'Dados da ficha incompletos.' });
    return;
  }

  if (!char.id) {
    char.id = 'char-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }
  char.campaignCode = code;
  char.lastActive = Date.now();
  char.isOnline = true;

  // Garante que personagens de nível 1 comecem no nível 1 com 3 pontos de atributos livres
  if ((char.level === 1 || !char.level) && (char.unspentAttributePoints === undefined || char.unspentAttributePoints === null)) {
    char.level = 1;
    char.unspentAttributePoints = 3;
  }

  const idx = camp.players.findIndex((p) => p.id === char.id);
  if (idx >= 0) {
    camp.players[idx] = { ...char };
  } else {
    camp.players.push(char);
  }

  broadcastUpdate(code, camp);
  res.json({ success: true, character: char, campaign: camp });
});

// Delete character from campaign
app.delete('/api/campaigns/:code/character/:charId', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);
  if (!camp) {
    res.status(404).json({ error: 'Sala não encontrada.' });
    return;
  }

  const { charId } = req.params;
  camp.players = camp.players.filter((p) => p.id !== charId);
  broadcastUpdate(code, camp);
  res.json({ success: true, campaign: camp });
});

// Award EXP by Master to a specific character or to the whole group
app.post('/api/campaigns/:code/award-exp', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);
  if (!camp) {
    res.status(404).json({ error: 'Sala não encontrada.' });
    return;
  }

  const { targetCharacterId, expAmount, reason } = req.body;
  const numExp = Number(expAmount);
  if (!numExp || numExp <= 0) {
    res.status(400).json({ error: 'Quantidade de EXP deve ser maior que zero.' });
    return;
  }

  const targetChars =
    targetCharacterId === 'all'
      ? camp.players
      : camp.players.filter((p) => p.id === targetCharacterId);

  if (targetChars.length === 0) {
    res.status(404).json({ error: 'Nenhum personagem encontrado para receber EXP.' });
    return;
  }

  const leveledUpNames: string[] = [];

  for (const char of targetChars) {
    char.experience = (char.experience || 0) + numExp;
    let needed = getExpForNextLevel(char.level, camp.levelProgressionConfig?.xpRequiredPerLevel);
    let leveled = false;
    while (char.experience >= needed) {
      char.experience -= needed;
      char.level += 1;
      // Concede 3 pontos de atributos livres por nível alcançado
      char.unspentAttributePoints = (char.unspentAttributePoints || 0) + 3;
      // Incrementa vida e mana máximos e restaura parcialmente
      char.hp.max += 5;
      char.hp.current = Math.min(char.hp.max, char.hp.current + 5);
      char.mana.max += 3;
      char.mana.current = Math.min(char.mana.max, char.mana.current + 3);
      leveled = true;
      needed = getExpForNextLevel(char.level, camp.levelProgressionConfig?.xpRequiredPerLevel);
    }
    if (leveled) {
      leveledUpNames.push(`${char.name} (Nível ${char.level})`);
      if (!camp.chronicles) camp.chronicles = [];
      camp.chronicles.unshift({
        id: `chronicle-lvl-${char.id}-${Date.now()}`,
        type: 'level_up',
        category: 'nivel',
        title: `Ascensão Heroica: ${char.name} alcançou o Nível ${char.level}!`,
        description: `${char.name} (${char.characterClass || 'Aventureiro'}, ${char.race || 'Humano'}) ascendeu para o Nível ${char.level} com ${char.hp.max} PV e ampliou suas capacidades de combate!`,
        characterName: char.name,
        characterId: char.id,
        levelReached: char.level,
        importance: char.level >= 5 ? 'lendario' : 'epico',
        iconEmoji: '🌟',
        timestamp: Date.now(),
      });
    }
    char.lastActive = Date.now();
  }

  broadcastUpdate(code, camp);
  res.json({
    success: true,
    message: `${numExp} EXP distribuídos com sucesso!${
      leveledUpNames.length > 0 ? ` Subiram de nível: ${leveledUpNames.join(', ')}` : ''
    }`,
    campaign: camp,
    leveledUp: leveledUpNames,
  });
});

// Distribute unspent status attribute point by player
app.post('/api/campaigns/:code/allocate-attribute', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);
  if (!camp) {
    res.status(404).json({ error: 'Sala não encontrada.' });
    return;
  }

  const { characterId, attributeKey } = req.body;
  const char = camp.players.find((p) => p.id === characterId);
  if (!char) {
    res.status(404).json({ error: 'Personagem não encontrado.' });
    return;
  }

  if (!char.unspentAttributePoints || char.unspentAttributePoints <= 0) {
    res.status(400).json({ error: 'Você não possui pontos de status disponíveis para distribuir.' });
    return;
  }

  const validKeys = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'];
  if (!validKeys.includes(attributeKey)) {
    res.status(400).json({ error: 'Atributo inválido.' });
    return;
  }

  const key = attributeKey as 'FOR' | 'DES' | 'CON' | 'INT' | 'SAB' | 'CAR';
  char.attributes[key] = (char.attributes[key] || 10) + 1;
  char.unspentAttributePoints -= 1;

  // Aumenta vida ou mana proporcionalmente aos pontos distribuídos pelo jogador (+5 por ponto)
  if (key === 'CON') {
    char.hp.max += 5;
    char.hp.current = Math.min(char.hp.max, char.hp.current + 5);
  } else if (key === 'INT') {
    char.mana.max += 5;
    char.mana.current = Math.min(char.mana.max, char.mana.current + 5);
  }

  char.lastActive = Date.now();
  broadcastUpdate(code, camp);
  res.json({ success: true, character: char, campaign: camp });
});

// Ações externas em jogo (Ataque de Monstro, Poções e Magias de Regeneração)
app.post('/api/campaigns/:code/external-action', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);
  if (!camp) {
    res.status(404).json({ error: 'Sala não encontrada.' });
    return;
  }

  const {
    characterId,
    actionType,
    sourceName,
    amount,
    details,
    targetVitals,
    damageType,
    multiplier,
    diceFormula,
  } = req.body;
  const char = camp.players.find((p) => p.id === characterId);
  if (!char) {
    res.status(404).json({ error: 'Personagem não encontrado.' });
    return;
  }

  const mult = typeof multiplier === 'number' && multiplier > 0 ? multiplier : 1;
  const baseAmount = Math.max(0, Number(amount) || 0);
  const numAmount = Math.max(1, Math.round(baseAmount * mult));
  let feedbackMessage = '';

  const diceNote = diceFormula ? ` [Dado: ${diceFormula}]` : '';
  const multNote = mult === 2 ? ' (ACERTO CRÍTICO x2!)' : mult === 0.5 ? ' (RESISTÊNCIA / Metade do Dano)' : '';

  if (actionType === 'monster_attack') {
    // Ataque de Monstro ou Dano Externo: perde HP
    char.hp.current = Math.max(0, char.hp.current - numAmount);
    feedbackMessage = `Ataque de ${sourceName || 'Criatura'}${diceNote}${multNote}: causou -${numAmount} de dano${damageType ? ` (${damageType})` : ''}! (${char.hp.current}/${char.hp.max} PV)`;
  } else if (actionType === 'poison_burn_dot') {
    // Veneno, Queimadura, Sangramento ou Dano Contínuo
    char.hp.current = Math.max(0, char.hp.current - numAmount);
    feedbackMessage = `Dano Contínuo (${sourceName || 'Veneno/Queimadura'}${damageType ? ` - ${damageType}` : ''}): -${numAmount} PV! (${char.hp.current}/${char.hp.max} PV)`;
  } else if (actionType === 'environmental_trap') {
    // Armadilha ou Dano Ambiental
    char.hp.current = Math.max(0, char.hp.current - numAmount);
    feedbackMessage = `Perigo Ambiental (${sourceName || 'Armadilha'}${diceNote}): -${numAmount} PV! (${char.hp.current}/${char.hp.max} PV)`;
  } else if (actionType === 'potion_hp') {
    // Poção de Vida: restaura HP
    const prevHp = char.hp.current;
    char.hp.current = Math.min(char.hp.max, char.hp.current + numAmount);
    const restored = char.hp.current - prevHp;
    feedbackMessage = `Bebeu ${sourceName || 'Poção de Vida'}: recuperou +${restored} PV! (${char.hp.current}/${char.hp.max} PV)`;
  } else if (actionType === 'potion_mana') {
    // Frasco de Mana: restaura Mana
    const prevMana = char.mana.current;
    char.mana.current = Math.min(char.mana.max, char.mana.current + numAmount);
    const restored = char.mana.current - prevMana;
    feedbackMessage = `Bebeu ${sourceName || 'Frasco de Mana'}: restaurou +${restored} PM! (${char.mana.current}/${char.mana.max} PM)`;
  } else if (actionType === 'heal_spell') {
    // Magia de Regeneração / Cura: restaura HP
    const prevHp = char.hp.current;
    char.hp.current = Math.min(char.hp.max, char.hp.current + numAmount);
    const restored = char.hp.current - prevHp;
    feedbackMessage = `Magia de Cura (${sourceName || 'Regeneração'}${diceNote}): restaurou +${restored} PV! (${char.hp.current}/${char.hp.max} PV)`;
  } else if (actionType === 'mana_spell') {
    // Magia de Restauração Arcana: restaura Mana
    const prevMana = char.mana.current;
    char.mana.current = Math.min(char.mana.max, char.mana.current + numAmount);
    const restored = char.mana.current - prevMana;
    feedbackMessage = `Magia Arcana (${sourceName || 'Harmonização'}${diceNote}): concedeu +${restored} PM! (${char.mana.current}/${char.mana.max} PM)`;
  } else if (actionType === 'short_rest') {
    // Descanso Curto: recupera PV e PM
    const prevHp = char.hp.current;
    const prevMana = char.mana.current;
    char.hp.current = Math.min(char.hp.max, char.hp.current + numAmount);
    char.mana.current = Math.min(char.mana.max, char.mana.current + Math.round(numAmount / 2));
    feedbackMessage = `Descanso Curto realizado: recuperou +${char.hp.current - prevHp} PV e +${char.mana.current - prevMana} PM! (${char.hp.current}/${char.hp.max} PV | ${char.mana.current}/${char.mana.max} PM)`;
  } else if (actionType === 'long_rest') {
    // Descanso Longo: restaura 100% de PV e PM
    char.hp.current = char.hp.max;
    char.mana.current = char.mana.max;
    feedbackMessage = `Descanso Longo concluído! PV e PM totalmente restaurados (${char.hp.max}/${char.hp.max} PV | ${char.mana.max}/${char.mana.max} PM).`;
  } else if (actionType === 'custom_damage') {
    if (targetVitals === 'mana') {
      char.mana.current = Math.max(0, char.mana.current - numAmount);
      feedbackMessage = `Dano de Mana (${sourceName || 'Dreno de Éter'}${multNote}): -${numAmount} PM! (${char.mana.current}/${char.mana.max} PM)`;
    } else {
      char.hp.current = Math.max(0, char.hp.current - numAmount);
      feedbackMessage = `Dano (${sourceName || 'Efeito'}${damageType ? ` - ${damageType}` : ''}${multNote}): -${numAmount} PV! (${char.hp.current}/${char.hp.max} PV)`;
    }
  } else if (actionType === 'custom_recovery') {
    if (targetVitals === 'mana') {
      const prevMana = char.mana.current;
      char.mana.current = Math.min(char.mana.max, char.mana.current + numAmount);
      feedbackMessage = `Restauração Arcana (${sourceName || 'Fonte Mística'}): +${char.mana.current - prevMana} PM! (${char.mana.current}/${char.mana.max} PM)`;
    } else if (targetVitals === 'both') {
      const prevHp = char.hp.current;
      const prevMana = char.mana.current;
      char.hp.current = Math.min(char.hp.max, char.hp.current + numAmount);
      char.mana.current = Math.min(char.mana.max, char.mana.current + numAmount);
      feedbackMessage = `Restauração Completa (${sourceName || 'Milagre'}): +${char.hp.current - prevHp} PV e +${char.mana.current - prevMana} PM!`;
    } else {
      const prevHp = char.hp.current;
      char.hp.current = Math.min(char.hp.max, char.hp.current + numAmount);
      feedbackMessage = `Restauração Vital (${sourceName || 'Bênção'}): +${char.hp.current - prevHp} PV! (${char.hp.current}/${char.hp.max} PV)`;
    }
  }

  char.lastActive = Date.now();
  broadcastUpdate(code, camp);
  res.json({
    success: true,
    message: feedbackMessage,
    character: char,
    campaign: camp,
  });
});

// Master updates non-vital parameters (CA, Speed, Initiative, Notes, Race, Class).
// Vitals (HP/Mana) and Attributes are NOT directly editable here, complying with system rules.
app.post('/api/campaigns/:code/update-vitals', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);
  if (!camp) {
    res.status(404).json({ error: 'Sala não encontrada.' });
    return;
  }

  const {
    characterId,
    armorClass,
    speed,
    initiative,
    notes,
    race,
    characterClass,
    title,
  } = req.body;
  const char = camp.players.find((p) => p.id === characterId);
  if (!char) {
    res.status(404).json({ error: 'Personagem não encontrado.' });
    return;
  }

  if (typeof armorClass === 'number') char.armorClass = armorClass;
  if (typeof speed === 'string') char.speed = speed;
  if (typeof initiative === 'number') char.initiative = initiative;
  if (typeof notes === 'string') char.notes = notes;
  if (typeof race === 'string' && race.trim()) char.race = race.trim();
  if (typeof characterClass === 'string' && characterClass.trim()) char.characterClass = characterClass.trim();
  if (typeof title === 'string') char.title = title;

  char.lastActive = Date.now();
  broadcastUpdate(code, camp);
  res.json({ success: true, character: char, campaign: camp });
});

// Execute transaction between players or GM
app.post('/api/campaigns/:code/transaction', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);
  if (!camp) {
    res.status(404).json({ success: false, message: 'Sala não encontrada.' });
    return;
  }

  const { senderId, senderName, receiverId, receiverName, amount, currency, reason, type } = req.body;

  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    res.status(400).json({ success: false, message: 'A quantidade de moedas deve ser maior que zero.' });
    return;
  }

  const curr = currency as CurrencyType;
  if (!curr || !CURRENCY_CONFIGS[curr]) {
    res.status(400).json({ success: false, message: 'Moeda inválida.' });
    return;
  }

  // Deduct from sender
  if (senderId !== 'gm') {
    const sender = camp.players.find((p) => p.id === senderId);
    if (!sender) {
      res.status(404).json({ success: false, message: 'Personagem pagador não encontrado.' });
      return;
    }
    const currentBalance = sender.wallet[curr] || 0;
    if (currentBalance < numAmount) {
      res.status(400).json({
        success: false,
        message: `Saldo insuficiente! Você possui ${currentBalance} ${curr}, mas tentou transferir ${numAmount} ${curr}.`,
      });
      return;
    }
    sender.wallet[curr] -= numAmount;
    sender.lastActive = Date.now();
  } else {
    camp.gmWallet[curr] = (camp.gmWallet[curr] || 0) - numAmount;
  }

  // Add to receiver
  if (receiverId === 'gm') {
    camp.gmWallet[curr] = (camp.gmWallet[curr] || 0) + numAmount;
  } else {
    const receiver = camp.players.find((p) => p.id === receiverId);
    if (receiver) {
      receiver.wallet[curr] = (receiver.wallet[curr] || 0) + numAmount;
      receiver.lastActive = Date.now();
    }
  }

  const tx: Transaction = {
    id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    campaignCode: code,
    senderId,
    senderName: senderName || (senderId === 'gm' ? camp.gmName : 'Aventureiro'),
    receiverId,
    receiverName: receiverName || (receiverId === 'gm' ? camp.gmName : 'Aventureiro'),
    amount: numAmount,
    currency: curr,
    reason: reason || 'Transação de RPG',
    type: type || 'player_to_player',
    status: 'confirmed',
    timestamp: Date.now(),
  };

  camp.transactions.unshift(tx);
  broadcastUpdate(code, camp);

  res.json({ success: true, message: 'Transação confirmada!', transaction: tx, campaign: camp });
});

// Currency exchange
app.post('/api/campaigns/:code/convert', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);
  if (!camp) {
    res.status(404).json({ success: false, message: 'Sala não encontrada.' });
    return;
  }

  const { characterId, fromCurrency, toCurrency, amount } = req.body;
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    res.status(400).json({ success: false, message: 'Quantidade inválida.' });
    return;
  }

  const character = camp.players.find((p) => p.id === characterId);
  if (!character) {
    res.status(404).json({ success: false, message: 'Personagem não encontrado.' });
    return;
  }

  const fromCurr = fromCurrency as CurrencyType;
  const toCurr = toCurrency as CurrencyType;
  if (!CURRENCY_CONFIGS[fromCurr] || !CURRENCY_CONFIGS[toCurr]) {
    res.status(400).json({ success: false, message: 'Moedas inválidas para conversão.' });
    return;
  }

  if ((character.wallet[fromCurr] || 0) < numAmount) {
    res.status(400).json({ success: false, message: `Saldo insuficiente de ${fromCurr}.` });
    return;
  }

  const fromRate = CURRENCY_CONFIGS[fromCurr].unitValueInBRZ;
  const toRate = CURRENCY_CONFIGS[toCurr].unitValueInBRZ;
  const totalInBRZ = numAmount * fromRate;

  if (totalInBRZ < toRate) {
    res.status(400).json({
      success: false,
      message: `Valor insuficiente. Você precisa de pelo menos ${toRate / fromRate} ${fromCurr} para obter 1 ${toCurr}.`,
    });
    return;
  }

  const obtainedAmount = Math.floor(totalInBRZ / toRate);
  const costInFromCurrency = (obtainedAmount * toRate) / fromRate;

  character.wallet[fromCurr] -= costInFromCurrency;
  character.wallet[toCurr] = (character.wallet[toCurr] || 0) + obtainedAmount;
  character.lastActive = Date.now();

  const tx: Transaction = {
    id: 'ex-' + Date.now(),
    campaignCode: code,
    senderId: character.id,
    senderName: character.name,
    receiverId: 'banco',
    receiverName: 'Câmbio Real de Nexaria',
    amount: obtainedAmount,
    currency: toCurr,
    reason: `Conversão: ${costInFromCurrency} ${fromCurr} por ${obtainedAmount} ${toCurr}`,
    type: 'exchange',
    status: 'confirmed',
    timestamp: Date.now(),
  };

  camp.transactions.unshift(tx);
  broadcastUpdate(code, camp);

  res.json({
    success: true,
    message: `Câmbio realizado com sucesso! Você obteve ${obtainedAmount} ${toCurr} em troca de ${costInFromCurrency} ${fromCurr}.`,
    campaign: camp,
  });
});

// GM creates payment request
app.post('/api/campaigns/:code/request', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);
  if (!camp) {
    res.status(404).json({ success: false, message: 'Sala não encontrada.' });
    return;
  }

  const { targetCharacterId, amount, currency, reason } = req.body;
  let targetName = 'Todos os Jogadores';
  if (targetCharacterId !== 'all') {
    const char = camp.players.find((p) => p.id === targetCharacterId);
    targetName = char ? char.name : 'Jogador';
  }

  const newReq: PaymentRequest = {
    id: 'req-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    campaignCode: code,
    targetCharacterId: targetCharacterId || 'all',
    targetName,
    amount: Number(amount) || 1,
    currency: currency as CurrencyType,
    reason: reason || 'Taxa / Cobrança do Mestre',
    status: 'pending',
    createdAt: Date.now(),
  };

  camp.paymentRequests.unshift(newReq);
  broadcastUpdate(code, camp);
  res.json({ success: true, paymentRequest: newReq, campaign: camp });
});

// Player pays a payment request
app.post('/api/campaigns/:code/pay-request', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);
  if (!camp) {
    res.status(404).json({ success: false, message: 'Sala não encontrada.' });
    return;
  }

  const { requestId, characterId } = req.body;
  const pReq = camp.paymentRequests.find((r) => r.id === requestId);
  if (!pReq) {
    res.status(404).json({ success: false, message: 'Cobrança não encontrada.' });
    return;
  }

  const character = camp.players.find((p) => p.id === characterId);
  if (!character) {
    res.status(404).json({ success: false, message: 'Personagem não encontrado.' });
    return;
  }

  const curr = pReq.currency;
  if ((character.wallet[curr] || 0) < pReq.amount) {
    res.status(400).json({
      success: false,
      message: `Saldo insuficiente! Você possui ${character.wallet[curr] || 0} ${curr}, mas a taxa é de ${pReq.amount} ${curr}.`,
    });
    return;
  }

  // Deduct from character, add to GM
  character.wallet[curr] -= pReq.amount;
  camp.gmWallet[curr] = (camp.gmWallet[curr] || 0) + pReq.amount;
  pReq.status = 'paid';

  const tx: Transaction = {
    id: 'tx-' + Date.now(),
    campaignCode: code,
    senderId: character.id,
    senderName: character.name,
    receiverId: 'gm',
    receiverName: camp.gmName,
    amount: pReq.amount,
    currency: curr,
    reason: `Pagamento de Cobrança do Mestre: ${pReq.reason}`,
    type: 'toll_fee',
    status: 'confirmed',
    timestamp: Date.now(),
  };

  camp.transactions.unshift(tx);
  broadcastUpdate(code, camp);

  res.json({ success: true, message: 'Cobrança paga com sucesso!', transaction: tx, campaign: camp });
});

// Player buys an item from GM market
app.post('/api/campaigns/:code/buy-item', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);
  if (!camp) {
    res.status(404).json({ success: false, message: 'Sala não encontrada.' });
    return;
  }

  const { characterId, itemId } = req.body;
  const item = camp.marketItems.find((i) => i.id === itemId);
  if (!item) {
    res.status(404).json({ success: false, message: 'Item não encontrado na loja.' });
    return;
  }

  const character = camp.players.find((p) => p.id === characterId);
  if (!character) {
    res.status(404).json({ success: false, message: 'Personagem não encontrado.' });
    return;
  }

  if (item.stock !== undefined && item.stock <= 0) {
    res.status(400).json({ success: false, message: 'Item esgotado no estoque do Mestre.' });
    return;
  }

  if ((character.wallet[item.currency] || 0) < item.price) {
    res.status(400).json({
      success: false,
      message: `Saldo insuficiente! O item custa ${item.price} ${item.currency}, mas você tem ${character.wallet[item.currency] || 0} ${item.currency}.`,
    });
    return;
  }

  // Deduct coins from character, credit to GM
  character.wallet[item.currency] -= item.price;
  camp.gmWallet[item.currency] = (camp.gmWallet[item.currency] || 0) + item.price;

  // Inventory addition
  const existingInv = character.inventory.find((i) => i.name.toLowerCase() === item.name.toLowerCase());
  if (existingInv) {
    existingInv.quantity += 1;
  } else {
    character.inventory.push({
      id: 'inv-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: item.name,
      quantity: 1,
      category: item.category,
      rarity: item.rarity || 'comum',
      description: item.description,
      effectText: item.effectText || '',
      weightKg: item.weightKg || 1.0,
      iconEmoji: item.icon,
      valueAmount: item.price,
      valueCurrency: item.currency,
      equipped: false,
    });
  }

  if (item.stock !== undefined) {
    item.stock -= 1;
  }

  const tx: Transaction = {
    id: 'tx-' + Date.now(),
    campaignCode: code,
    senderId: character.id,
    senderName: character.name,
    receiverId: 'gm',
    receiverName: camp.gmName,
    amount: item.price,
    currency: item.currency,
    reason: `Compra de item na Loja: ${item.name}`,
    type: 'shop_purchase',
    status: 'confirmed',
    timestamp: Date.now(),
  };

  const isValuable =
    ['raro', 'epico', 'lendario', 'abissal'].includes(item.rarity || '') ||
    item.price >= 50 ||
    ['PLN', 'CYB'].includes(item.currency);

  if (isValuable) {
    if (!camp.chronicles) camp.chronicles = [];
    camp.chronicles.unshift({
      id: `chronicle-buy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'valuable_item',
      category: 'item',
      title: `Aquisição de Tesouro: ${item.name}`,
      description: `${character.name} adquiriu ${item.name} (${(item.rarity || 'raro').toUpperCase()}) no Bazar da Campanha por ${item.price} ${item.currency}. ${item.effectText || item.description || ''}`,
      characterName: character.name,
      characterId: character.id,
      itemName: item.name,
      itemRarity: item.rarity,
      importance: item.rarity === 'lendario' || item.rarity === 'abissal' ? 'lendario' : 'notavel',
      iconEmoji: item.icon || '💎',
      timestamp: Date.now(),
    });
  }

  camp.transactions.unshift(tx);
  broadcastUpdate(code, camp);

  res.json({
    success: true,
    message: `Você comprou "${item.name}" por ${item.price} ${item.currency}!`,
    campaign: camp,
  });
});

// Player-to-Player Item Trade / Transfer
app.post('/api/campaigns/:code/trade-item', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);
  if (!camp) {
    res.status(404).json({ success: false, message: 'Sala não encontrada.' });
    return;
  }

  const {
    senderCharacterId,
    receiverCharacterId,
    itemId,
    quantity,
    chargePrice,
    chargeCurrency,
    isFreeTransfer,
  } = req.body;

  const numQty = Math.max(1, Math.floor(Number(quantity) || 1));
  const isFree = isFreeTransfer !== false && (!chargePrice || Number(chargePrice) <= 0);
  const price = isFree ? 0 : Math.max(0, Math.floor(Number(chargePrice) || 0));
  const curr = (chargeCurrency as CurrencyType) || 'PRT';

  // Sender verification
  let senderName = 'Aventureiro';
  let senderItem: any = null;

  if (senderCharacterId === 'gm') {
    senderName = camp.gmName || 'Mestre do Jogo';
    const shopItem = camp.marketItems.find((i) => i.id === itemId);
    if (shopItem) {
      senderItem = {
        id: 'item-' + Date.now(),
        name: shopItem.name,
        quantity: numQty,
        category: shopItem.category,
        rarity: shopItem.rarity || 'comum',
        description: shopItem.description,
        effectText: shopItem.effectText || '',
        weightKg: shopItem.weightKg || 1.0,
        iconEmoji: shopItem.icon,
        valueAmount: shopItem.price,
        valueCurrency: shopItem.currency,
      };
    }
  } else {
    const sender = camp.players.find((p) => p.id === senderCharacterId);
    if (!sender) {
      res.status(404).json({ success: false, message: 'Personagem remetente não encontrado.' });
      return;
    }
    senderName = sender.name;
    const invIdx = sender.inventory.findIndex((i) => i.id === itemId);
    if (invIdx < 0) {
      res.status(404).json({ success: false, message: 'Item não encontrado na mochila do remetente.' });
      return;
    }
    const item = sender.inventory[invIdx];
    if (item.quantity < numQty) {
      res.status(400).json({
        success: false,
        message: `Quantidade insuficiente. Você possui ${item.quantity} unidades deste item.`,
      });
      return;
    }

    senderItem = { ...item };

    // Deduct quantity or remove item
    if (item.quantity === numQty) {
      sender.inventory.splice(invIdx, 1);
    } else {
      item.quantity -= numQty;
    }

    // If coins were charged to receiver, credit to sender
    if (!isFree && price > 0) {
      sender.wallet[curr] = (sender.wallet[curr] || 0) + price;
    }
    sender.lastActive = Date.now();
  }

  if (!senderItem) {
    res.status(400).json({ success: false, message: 'Item inválido para troca.' });
    return;
  }

  // Receiver verification
  let receiverName = 'Aventureiro';
  if (receiverCharacterId === 'gm') {
    receiverName = camp.gmName || 'Mestre do Jogo';
    // If coins charged, credit/debit GM
    if (!isFree && price > 0) {
      camp.gmWallet[curr] = (camp.gmWallet[curr] || 0) - price;
    }
  } else {
    const receiver = camp.players.find((p) => p.id === receiverCharacterId);
    if (!receiver) {
      res.status(404).json({ success: false, message: 'Personagem destinatário não encontrado na mesa.' });
      return;
    }
    receiverName = receiver.name;

    // Check receiver coin balance if paid
    if (!isFree && price > 0) {
      const currentBalance = receiver.wallet[curr] || 0;
      if (currentBalance < price) {
        // Rollback sender change if needed
        if (senderCharacterId !== 'gm') {
          const sender = camp.players.find((p) => p.id === senderCharacterId);
          if (sender) {
            const existing = sender.inventory.find((i) => i.id === itemId);
            if (existing) existing.quantity += numQty;
            else sender.inventory.push(senderItem);
          }
        }
        res.status(400).json({
          success: false,
          message: `${receiver.name} não possui saldo suficiente (${currentBalance} ${curr}) para pagar ${price} ${curr}.`,
        });
        return;
      }
      receiver.wallet[curr] -= price;
    }

    // Add to receiver inventory
    const existingInReceiver = receiver.inventory.find(
      (i) => i.name.toLowerCase() === senderItem.name.toLowerCase()
    );
    if (existingInReceiver) {
      existingInReceiver.quantity += numQty;
    } else {
      receiver.inventory.push({
        ...senderItem,
        id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        quantity: numQty,
        equipped: false,
      });
    }
    receiver.lastActive = Date.now();
  }

  const tx: Transaction = {
    id: 'tx-trade-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    campaignCode: code,
    senderId: senderCharacterId,
    senderName,
    receiverId: receiverCharacterId,
    receiverName,
    amount: price,
    currency: curr,
    reason: isFree
      ? `Troca de Item: ${numQty}x "${senderItem.name}" entregue a ${receiverName}`
      : `Comércio de Item: ${numQty}x "${senderItem.name}" vendido a ${receiverName} por ${price} ${curr}`,
    type: 'player_to_player',
    status: 'confirmed',
    timestamp: Date.now(),
  };

  camp.transactions.unshift(tx);
  broadcastUpdate(code, camp);

  res.json({
    success: true,
    message: isFree
      ? `${numQty}x "${senderItem.name}" enviado(a) para ${receiverName} com sucesso!`
      : `${numQty}x "${senderItem.name}" vendido(a) para ${receiverName} por ${price} ${curr}!`,
    transaction: tx,
    campaign: camp,
  });
});

// Grant monster defeat loot (coins + item drop) to player or party
app.post('/api/campaigns/:code/grant-monster-loot', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);
  if (!camp) {
    res.status(404).json({ success: false, message: 'Sala não encontrada.' });
    return;
  }

  const {
    targetCharacterId,
    monsterName,
    monsterNumber,
    lootAmount,
    lootCurrency,
    itemDrop,
  } = req.body;

  const numCoins = Math.max(0, Math.floor(Number(lootAmount) || 0));
  const curr = (lootCurrency as CurrencyType) || 'PRT';

  const targets =
    targetCharacterId === 'all'
      ? camp.players
      : camp.players.filter((p) => p.id === targetCharacterId);

  if (targets.length === 0) {
    res.status(404).json({ success: false, message: 'Nenhum aventureiro encontrado para receber o espólio.' });
    return;
  }

  const mName = monsterName || 'Criatura do Abismo';
  const mNum = monsterNumber ? ` (#${monsterNumber})` : '';

  for (const char of targets) {
    // 1. Credit coins
    if (numCoins > 0) {
      char.wallet[curr] = (char.wallet[curr] || 0) + numCoins;
    }

    // 2. Add monster item drop to inventory
    if (itemDrop && itemDrop.name) {
      const existing = char.inventory.find(
        (i) => i.name.toLowerCase() === itemDrop.name.toLowerCase()
      );
      if (existing) {
        existing.quantity += itemDrop.quantity || 1;
      } else {
        char.inventory.push({
          id: 'drop-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          name: itemDrop.name,
          quantity: itemDrop.quantity || 1,
          category: itemDrop.category || 'reliquia',
          rarity: itemDrop.rarity || 'incomum',
          description: itemDrop.description || `Espólio obtido ao derrotar ${mName}.`,
          effectText: itemDrop.effectText || '',
          weightKg: itemDrop.weightKg || 0.5,
          iconEmoji: itemDrop.iconEmoji || '💀',
          valueAmount: itemDrop.valueAmount || Math.max(5, numCoins),
          valueCurrency: itemDrop.valueCurrency || curr,
          equipped: false,
        });
      }
    }

    char.lastActive = Date.now();

    // Log transaction
    const tx: Transaction = {
      id: 'tx-loot-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      campaignCode: code,
      senderId: 'bestiary',
      senderName: `Bestiário de Nexaria: ${mName}${mNum}`,
      receiverId: char.id,
      receiverName: char.name,
      amount: numCoins,
      currency: curr,
      reason: `Espólio de Derrota de ${mName}${mNum}${
        itemDrop?.name ? ` (+1x ${itemDrop.name})` : ''
      }`,
      type: 'gm_to_player',
      status: 'confirmed',
      timestamp: Date.now(),
    };
    camp.transactions.unshift(tx);
  }

  if (itemDrop && itemDrop.name) {
    const isValuable =
      ['raro', 'epico', 'lendario', 'abissal'].includes(itemDrop.rarity || '') ||
      (itemDrop.valueAmount && itemDrop.valueAmount >= 50);
    if (isValuable) {
      if (!camp.chronicles) camp.chronicles = [];
      for (const char of targets) {
        camp.chronicles.unshift({
          id: `chronicle-drop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'valuable_item',
          category: 'item',
          title: `Relíquia Conquistada: ${itemDrop.name}`,
          description: `${char.name} obteve ${itemDrop.name} (${(itemDrop.rarity || 'raro').toUpperCase()}) ao derrotar ${mName}${mNum}!`,
          characterName: char.name,
          characterId: char.id,
          itemName: itemDrop.name,
          itemRarity: itemDrop.rarity,
          importance: itemDrop.rarity === 'lendario' || itemDrop.rarity === 'abissal' ? 'lendario' : 'notavel',
          iconEmoji: itemDrop.iconEmoji || '💀',
          timestamp: Date.now(),
        });
      }
    }
  }

  broadcastUpdate(code, camp);

  const dropNote = itemDrop?.name ? ` e 1x "${itemDrop.name}"` : '';
  const targetNote = targetCharacterId === 'all' ? 'todos os aventureiros' : targets[0].name;

  res.json({
    success: true,
    message: `Espólio de +${numCoins} ${curr}${dropNote} concedido a ${targetNote}!`,
    campaign: camp,
  });
});

// Update room color scheme (Master only)
app.post('/api/campaigns/:code/color-scheme', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);
  if (!camp) {
    res.status(404).json({ success: false, message: 'Sala não encontrada.' });
    return;
  }
  const { colorScheme } = req.body;
  if (!['abismo_purpura', 'forja_dourada', 'ruinas_elficas'].includes(colorScheme)) {
    res.status(400).json({ success: false, message: 'Esquema de cores inválido.' });
    return;
  }
  camp.colorScheme = colorScheme as RoomColorScheme;
  broadcastUpdate(code, camp);
  res.json({ success: true, colorScheme: camp.colorScheme, campaign: camp });
});

// Record a manual or automatic chronicle event
app.post('/api/campaigns/:code/chronicles', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);
  if (!camp) {
    res.status(404).json({ success: false, message: 'Sala não encontrada.' });
    return;
  }
  const { chronicle } = req.body;
  if (!chronicle || !chronicle.title) {
    res.status(400).json({ success: false, message: 'Dados da crônica incompletos.' });
    return;
  }
  if (!camp.chronicles) camp.chronicles = [];
  const newChronicle: CampaignChronicleEvent = {
    ...chronicle,
    id: chronicle.id || `chronicle-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: chronicle.timestamp || Date.now(),
  };
  camp.chronicles.unshift(newChronicle);
  broadcastUpdate(code, camp);
  res.json({ success: true, chronicle: newChronicle, campaign: camp });
});

// Gemini AI client lazy initialization
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// AI Image Generation & Editing Endpoint for Character Portraits
app.post('/api/characters/generate-portrait', async (req: Request, res: Response) => {
  try {
    const {
      race,
      characterClass,
      gender,
      name,
      title,
      originRegion,
      customDetails,
      prompt: customPrompt,
      mode = 'create',
      sourceImage,
      stylePreset = 'Dark Fantasy Nexaria',
    } = req.body || {};

    const genderDesc = gender ? String(gender).trim() : '';
    const raceDesc = race ? String(race).trim() : 'Humano';
    const classDesc = characterClass ? String(characterClass).trim() : 'Guerreiro';
    const nameDesc = name ? `named "${String(name).trim()}"` : '';
    const titleDesc = title ? `(${String(title).trim()})` : '';
    const regionDesc = originRegion ? `from the realm of ${String(originRegion).trim()}` : '';
    const extra = customDetails ? `, ${String(customDetails).trim()}` : '';

    const subject = [genderDesc, raceDesc, classDesc].filter(Boolean).join(' ');
    
    // Build descriptive prompt based on mode and user input
    let finalPrompt = '';
    if (customPrompt && customPrompt.trim().length > 0) {
      if (mode === 'edit') {
        finalPrompt = `Modify and enhance this RPG character portrait: ${customPrompt.trim()}. Style: ${stylePreset}. Maintain high fantasy aesthetic of Nexaria, sharp expressive facial features, seamless composition, square 1:1 avatar.`;
      } else {
        finalPrompt = `A breathtaking fantasy RPG character avatar portrait: ${customPrompt.trim()}. Character context: ${subject} ${titleDesc} ${nameDesc} ${regionDesc}${extra}. Visual aesthetic: ${stylePreset}, intricate armor and cloth details, glowing runes and magical luminescence, dramatic cinematic lighting, masterpiece digital painting, square avatar composition, heroic profile.`;
      }
    } else {
      finalPrompt = `A breathtaking fantasy RPG character avatar portrait of a ${subject} ${titleDesc} ${nameDesc} ${regionDesc}${extra}. Dark fantasy technomagic aesthetic of Nexaria, intricate armor and cloth details, glowing runes and magical luminescence, sharp expressive eyes, dramatic cinematic lighting, masterpiece digital painting, square avatar composition, heroic profile. Style: ${stylePreset}.`;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let geminiErrorReason: string | null = null;

    if (apiKey) {
      const modelsToTry = [
        'gemini-3.1-flash-image-preview',
        'gemini-3.1-flash-image',
        'gemini-3.1-flash-lite-image',
      ];

      for (const modelName of modelsToTry) {
        try {
          const ai = getGeminiClient();

          // Prepare parts: if editing and source image provided, include inline image data
          const parts: any[] = [];

          if (mode === 'edit' && sourceImage && typeof sourceImage === 'string') {
            let base64Data: string | null = null;
            let mimeType = 'image/png';

            if (sourceImage.startsWith('data:image/')) {
              const match = sourceImage.match(/^data:([^;]+);base64,(.+)$/);
              if (match) {
                mimeType = match[1];
                base64Data = match[2];
              }
            } else if (sourceImage.startsWith('http://') || sourceImage.startsWith('https://')) {
              try {
                const imgRes = await fetch(sourceImage);
                if (imgRes.ok) {
                  const arrayBuf = await imgRes.arrayBuffer();
                  base64Data = Buffer.from(arrayBuf).toString('base64');
                  const fetchedMime = imgRes.headers.get('content-type');
                  if (fetchedMime && fetchedMime.startsWith('image/')) {
                    mimeType = fetchedMime;
                  }
                }
              } catch (fetchErr) {
                console.warn('Could not fetch sourceImage for edit, proceeding with prompt only', fetchErr);
              }
            }

            if (base64Data) {
              parts.push({
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              });
            }
          }

          parts.push({
            text: finalPrompt,
          });

          const geminiRes = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts,
            },
            config: {
              imageConfig: {
                aspectRatio: '1:1',
              },
            },
          });

          if (geminiRes.candidates?.[0]?.content?.parts) {
            for (const part of geminiRes.candidates[0].content.parts) {
              if (part.inlineData && part.inlineData.data) {
                const mime = part.inlineData.mimeType || 'image/png';
                const imageUrl = `data:${mime};base64,${part.inlineData.data}`;
                res.json({
                  success: true,
                  imageUrl,
                  source: 'gemini',
                  model: modelName,
                  mode,
                  promptUsed: finalPrompt,
                });
                return;
              }
            }
          }
        } catch (geminiError: any) {
          geminiErrorReason = geminiError?.status || geminiError?.code || 'error';
          console.warn(`Model ${modelName} notice:`, geminiError?.message || geminiError);
          // Continue to next model in list
        }
      }
    }

    // High quality procedural AI image fallback based on exact prompt & unique seed
    const seed = Math.floor(Math.random() * 1000000);
    const cleanPrompt = encodeURIComponent(finalPrompt.slice(0, 320));
    const fallbackUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=512&height=512&nologo=true&seed=${seed}`;

    res.json({
      success: true,
      imageUrl: fallbackUrl,
      source: 'ai_fallback',
      mode,
      promptUsed: finalPrompt,
      notice: geminiErrorReason ? 'Imagem gerada com sucesso via motor de renderização de IA' : undefined,
    });
  } catch (err: any) {
    console.error('Error in /api/characters/generate-portrait:', err);
    const defaultFallback = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80';
    res.json({
      success: true,
      imageUrl: defaultFallback,
      source: 'preset_fallback',
      error: 'Retrato predefinido selecionado temporariamente.',
    });
  }
});

// AI Character Concept & Auto-Fill Endpoint using Gemini
app.post('/api/characters/generate-concept', async (req: Request, res: Response) => {
  try {
    const {
      concept,
      gender,
      preferredClass,
      preferredRace,
      preferredRegion,
    } = req.body || {};

    const rawConcept = String(concept || '').trim();
    if (!rawConcept) {
      res.status(400).json({ success: false, error: 'O conceito do personagem não pode ser vazio.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let geminiSuccess = false;
    let resultData: any = null;

    if (apiKey) {
      try {
        const ai = getGeminiClient();

        const systemPrompt = `Você é um renomado Mestre Narrador e Designer de Regras do universo de RPG "Nexaria — O Legado do Abismo".
Neste cenário de fantasia sombria, as energias ancestrais de Eldria, fendas do Abismo cósmico e tecnologia arcana (tecnomagia, éter cristalizado, cybercélulas e ligas rúnicas) coexistem.
Sua missão é receber um conceito livre descrito pelo jogador e criar uma ficha de personagem completa de Nível 1, altamente temática, equilibrada e instigante.

Responda SEMPRE em JSON válido com exatamente esta estrutura:
{
  "name": "Nome temático marcante do personagem",
  "title": "Epíteto ou título épico (ex: 'O Desertor da Lâmina Sussurrante')",
  "gender": "Masculino" ou "Feminino" ou "Não-Binário" ou "Agênero / Construto",
  "race": "Uma raça do universo (ex: Humano, Elfo Silvestre, Alto Elfo, Elfo Negro (Drow), Meio-Orc, Golias, Anão Forjador da Colina, Anão da Montanha, Pequenino (Halfling), Pixie do Caos, Goblin Engenheiro Piromaníaco, Mirmecóide, Mantis Imperial, Escaravelho Titânico, Aracnídeo Tecelão, Draconato, Tiefling, Aasimar, Mutante da Fenda, Vampiro Nobre, Tabaxi, Warforged, Cyborg Tecnomágico, Lupino Primal, Golem de Cristal, Lich Esquelético Diminuto, Slime Consciente, Elemental de Magma, Gênasi do Trovão)",
  "characterClass": "Uma classe do universo (ex: Guerreiro Rúnico, Paladino Sagrado, Bárbaro Primal, Guardião de Escudo, Mestre das Lâminas, Espadachim Duelista, Ronin das Sombras, Mago Arcanista, Feiticeiro Abissal, Bruxo do Pacto, Clérigo da Luz, Druida Espiritual, Bardo Encantador, Ladino & Assassino, Caçador Rastreador, Cyborg Tecnomágico, Artífice Rúnico, Psion Protetor, Cavaleiro da Morte, Ferreiro Mestre-Armeiro, Alquimista Transmutador, Alquimista Pirotécnico, Alquimista Apotecário)",
  "originRegion": "ID de uma das 9 regiões: 'caeldrin' (Cidadela Estelar), 'floresta_verdancia' (Bosques Ancestrais), 'montanhas_gelo' (Picos Glaciais de Frosten), 'pantano_sombrio' (Pântano das Brumas), 'deserto_solar' (Areias de Sol-Amon), 'profundezas_abismo' (Fenda Abissal), 'costa_cristal' (Porto dos Recifes), 'estratosfera_aether' (Ilhas Flutuantes), 'labirinto_engrenagens' (Subsolo Tecnomágico)",
  "primaryLanguage": "Idioma nativo condizente (ex: 'Caeldrico', 'Silvestre', 'Frosten', 'Zarikh', 'Abissal', 'Sollari', 'Aetheriano', 'Comum')",
  "attributes": {
    "FOR": número entre 8 e 16,
    "DES": número entre 8 e 16,
    "CON": número entre 8 e 16,
    "INT": número entre 8 e 16,
    "SAB": número entre 8 e 16,
    "CAR": número entre 8 e 16
  },
  "backgroundStory": "Narrativa rica de 2 a 3 parágrafos descrevendo a origem, momento determinante do passado, a motivação atual e um segredo ou dilema moral",
  "personalityTraits": "2 a 3 traços marcantes de personalidade, um vício ou fraqueza e uma frase marcante do personagem",
  "suggestedWeapon": {
    "name": "Nome da arma inicial temática",
    "damage": "Fórmula e tipo de dano (ex: '1d8+2 Cortante' ou '1d6 Perfurante')",
    "description": "Breve histórico ou detalhe forjado na lâmina/cabo"
  },
  "suggestedFightingStyle": "Nome de um estilo de combate coerente",
  "startingGearSuggestions": [
    {
      "name": "Nome do item",
      "category": "arma" ou "armadura" ou "pocao" ou "equipamento" ou "geral",
      "description": "Detalhe prático ou lore do item",
      "effectText": "Efeito no jogo",
      "quantity": 1,
      "iconEmoji": "Emoji condizente"
    }
  ],
  "suggestedAbilities": [
    {
      "name": "Nome da habilidade ou magia",
      "classification": "Classificação mágica ou marcial",
      "magicCost": "Custo em PM (ex: '3 PM', '4 PM' ou 'Livre')",
      "type": "Ataque", "Defesa", "Cura", "Suporte" ou "Utilitário",
      "range": "Alcance (ex: 'Corpo a Corpo', '18 metros', 'Pessoal')",
      "description": "Descrição narrativa da execução",
      "effects": "Fórmula ou regra (ex: '2d6+3 Dano Perfurante')"
    }
  ],
  "avatarPromptSuggestion": "Descrição visual concisa em inglês focando em características físicas, armadura e cores para alimentar o gerador de retrato de IA"
};

Equilibre os 6 atributos com coerência para um personagem de Nível 1 (a soma total dos atributos deve ficar entre 70 e 76 pontos, com o atributo primário da classe entre 14 e 16).`;

        const userPrompt = `Conceito desejado pelo jogador: "${rawConcept}".
${gender ? `Gênero preferido: ${gender}.` : ''}
${preferredClass ? `Classe preferida: ${preferredClass}.` : ''}
${preferredRace ? `Raça preferida: ${preferredRace}.` : ''}
${preferredRegion ? `Região natal preferida: ${preferredRegion}.` : ''}

Gere o perfil completo em JSON preenchendo todos os atributos, antecedentes detalhados, equipamento e habilidades.`;

        const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.8-flash'];
        for (const modelName of candidateModels) {
          try {
            const geminiRes = await ai.models.generateContent({
              model: modelName,
              contents: userPrompt,
              config: {
                systemInstruction: systemPrompt,
                responseMimeType: 'application/json',
              },
            });

            const textOutput = geminiRes.text;
            if (textOutput) {
              const parsed = JSON.parse(textOutput);
              if (parsed && parsed.name && parsed.attributes) {
                resultData = parsed;
                geminiSuccess = true;
                break;
              }
            }
          } catch (modelErr: any) {
            console.warn(`Gemini model ${modelName} notice (trying next candidate):`, modelErr?.message || modelErr);
          }
        }
      } catch (geminiError: any) {
        console.warn('Gemini generate-concept notice:', geminiError?.message || geminiError);
      }
    }

    // High quality thematic procedural fallback in case API key is absent or limits hit
    if (!resultData) {
      const lower = rawConcept.toLowerCase();
      const isMage = lower.includes('mago') || lower.includes('arcano') || lower.includes('feiticeir') || lower.includes('bruxo') || lower.includes('magia');
      const isRogue = lower.includes('ladino') || lower.includes('assassin') || lower.includes('adaga') || lower.includes('sombra') || lower.includes('furtiv');
      const isPaladin = lower.includes('paladino') || lower.includes('sagrado') || lower.includes('luz') || lower.includes('prote');
      const isBarbarian = lower.includes('bárbaro') || lower.includes('barbaro') || lower.includes('fúria') || lower.includes('primal');
      const isCleric = lower.includes('clérigo') || lower.includes('clerigo') || lower.includes('cura') || lower.includes('reza');
      const isCyber = lower.includes('cyber') || lower.includes('cibernét') || lower.includes('tecnomago') || lower.includes('androide');

      let fallbackClass = 'Guerreiro Rúnico';
      let fallbackAttrs = { FOR: 15, DES: 12, CON: 14, INT: 10, SAB: 12, CAR: 8 };
      let fallbackRegion = 'caeldrin';
      let fallbackWeapon = { name: 'Espada Rúnica Forjada', damage: '1d8+2 Cortante', description: 'Lâmina de aço fosco gravada com glifos arcanos.' };

      if (isMage) {
        fallbackClass = 'Mago Arcanista';
        fallbackAttrs = { FOR: 8, DES: 13, CON: 12, INT: 16, SAB: 14, CAR: 10 };
        fallbackRegion = 'estratosfera_aether';
        fallbackWeapon = { name: 'Cajado de Cristal de Éter', damage: '1d6+1 Contundente', description: 'Cajado de freixo encimado por geodo prismático pulsante.' };
      } else if (isRogue) {
        fallbackClass = 'Ladino & Assassino';
        fallbackAttrs = { FOR: 10, DES: 16, CON: 12, INT: 14, SAB: 12, CAR: 10 };
        fallbackRegion = 'profundezas_abismo';
        fallbackWeapon = { name: 'Adaga Rúnica das Sombras', damage: '1d4+3 Perfurante', description: 'Lâmina de obsidiana tratada que absorve os reflexos de luz.' };
      } else if (isPaladin) {
        fallbackClass = 'Paladino Sagrado';
        fallbackAttrs = { FOR: 15, DES: 10, CON: 14, INT: 10, SAB: 12, CAR: 14 };
        fallbackRegion = 'caeldrin';
        fallbackWeapon = { name: 'Martelo de Guerra Abençoado', damage: '1d8+2 Contundente', description: 'Bigorna de bronze dourada imbuída com o juramento celestial.' };
      } else if (isBarbarian) {
        fallbackClass = 'Bárbaro Primal';
        fallbackAttrs = { FOR: 16, DES: 13, CON: 15, INT: 8, SAB: 12, CAR: 8 };
        fallbackRegion = 'montanhas_gelo';
        fallbackWeapon = { name: 'Machado Colossal dos Ermos', damage: '1d12+3 Cortante', description: 'Machado pesado de ferro temperado no gelo eterno.' };
      } else if (isCleric) {
        fallbackClass = 'Clérigo da Luz';
        fallbackAttrs = { FOR: 12, DES: 10, CON: 14, INT: 10, SAB: 16, CAR: 12 };
        fallbackRegion = 'floresta_verdancia';
        fallbackWeapon = { name: 'Maça de Prata Sagrada', damage: '1d6+1 Contundente', description: 'Símbolo sagrado gravado que repele sombras e mortos-vivos.' };
      } else if (isCyber) {
        fallbackClass = 'Cyborg Tecnomágico';
        fallbackAttrs = { FOR: 14, DES: 14, CON: 14, INT: 14, SAB: 10, CAR: 8 };
        fallbackRegion = 'labirinto_engrenagens';
        fallbackWeapon = { name: 'Lâmina Cinética de Pulso', damage: '1d8+2 Energia', description: 'Filamento vibratório energizado por bateria de éter.' };
      }

      resultData = {
        name: preferredClass || 'Kaelen Vane',
        title: 'O Renegado do Abismo',
        gender: gender || 'Masculino',
        race: preferredRace || (isMage ? 'Alto Elfo' : isRogue ? 'Humano' : isBarbarian ? 'Golias' : 'Humano'),
        characterClass: preferredClass || fallbackClass,
        originRegion: preferredRegion || fallbackRegion,
        primaryLanguage: 'Caeldrico',
        attributes: fallbackAttrs,
        backgroundStory: `Nascido sob a penumbra das fendas arcanas de Nexaria, este aventureiro construiu seu próprio código de honra em meio ao caos das guildas e conspirações imperiais. Durante uma jornada crucial nos confins da região de ${fallbackRegion}, um evento trágico o afastou de seus antigos juramentos, forçando-o a confiar apenas em seus instintos e em sua arma companheira.\n\nAgora, busca nas expedições e nas câmaras esquecidas não apenas ouro e relíquias, mas respostas sobre os mistérios que o cercam e uma chance definitiva de redenção.`,
        personalityTraits: 'Meticuloso ao calcular riscos, leal aos aliados de confiança, porém desconfiado com autoridades e contratos que parecem generosos demais.',
        suggestedWeapon: fallbackWeapon,
        suggestedFightingStyle: isRogue ? 'Duelo de Precisão' : isBarbarian ? 'Golpes Devastadores' : 'Equilíbrio Rúnico',
        startingGearSuggestions: [
          {
            name: fallbackWeapon.name,
            category: 'arma',
            description: fallbackWeapon.description,
            effectText: fallbackWeapon.damage,
            quantity: 1,
            iconEmoji: '🗡️',
          },
          {
            name: 'Manto do Explorador de Fendas',
            category: 'armadura',
            description: 'Tecido tratado contra umidade, poeira mágica e temperaturas extremas.',
            effectText: '+1 Defesa contra intempéries',
            quantity: 1,
            iconEmoji: '🧥',
          },
          {
            name: 'Frasco de Éter Revigorante',
            category: 'pocao',
            description: 'Substância pura destilada que restaura o ânimo mental.',
            effectText: '+10 PM restaurados',
            quantity: 2,
            iconEmoji: '🧪',
          },
        ],
        suggestedAbilities: [
          {
            name: isMage ? 'Feixe de Éter Concentrado' : isRogue ? 'Passo das Sombras' : 'Golpe Rúnico Focalizado',
            classification: isMage ? 'Evocação Arcana' : isRogue ? 'Técnica Furtiva' : 'Habilidade Marcial',
            magicCost: '3 PM',
            type: 'Ataque',
            range: isMage ? '18 metros' : 'Corpo a Corpo',
            description: 'Concentra o fluxo vital para liberar um impacto preciso no ponto fraco do adversário.',
            effects: isMage ? '2d8 Dano Arcano' : '2d6+2 Dano Perfurante',
          },
          {
            name: 'Instinto de Sobrevivência',
            classification: 'Tática Reativa',
            magicCost: '2 PM',
            type: 'Defesa',
            range: 'Pessoal',
            description: 'Esquiva no último segundo ou bloqueio firme antecipando a investida inimiga.',
            effects: '+3 CA por 1 rodada',
          },
        ],
        avatarPromptSuggestion: `A cinematic dark fantasy character portrait of a ${gender || 'hero'} ${resultData?.race || 'adventurer'} ${fallbackClass}, wearing travel cloaks, glowing runic accessories, dramatic volumetric lighting, highly detailed digital painting.`,
      };
    }

    res.json({
      success: true,
      source: geminiSuccess ? 'gemini' : 'procedural_ai',
      data: resultData,
    });
  } catch (err: any) {
    console.error('Error in /api/characters/generate-concept:', err);
    res.status(500).json({ success: false, error: err?.message || 'Erro ao gerar conceito de personagem.' });
  }
});

// AI Adventure Hook Generator for the Game Master using Gemini
app.post('/api/campaigns/:code/generate-quest-hooks', async (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);
  const camp = campaigns.get(code);

  const {
    customPrompt,
    environment,
    tone,
    partyLevelOverride,
  } = req.body || {};

  const players = camp ? camp.players : [];
  const calculatedAvgLevel =
    players.length > 0
      ? Math.max(1, Math.round(players.reduce((sum, p) => sum + (p.level || 1), 0) / players.length))
      : 1;

  const targetLevel =
    typeof partyLevelOverride === 'number' && partyLevelOverride > 0
      ? Math.floor(partyLevelOverride)
      : calculatedAvgLevel;

  const partyListDesc =
    players.length > 0
      ? players
          .map((p) => `${p.name} (Nível ${p.level || 1} ${p.race || 'Humano'} ${p.characterClass || 'Guerreiro'})`)
          .join(', ')
      : 'Grupo de aventureiros iniciantes de Nexaria';

  const apiKey = process.env.GEMINI_API_KEY;
  let geminiFailed = false;

  if (apiKey) {
    try {
      const ai = getGeminiClient();

      const systemPrompt = `Você é um renomado Mestre de RPG e Designer de Aventuras do universo "Nexaria — O Legado do Abismo".
No mundo de Nexaria, a magia ancestral e as fendas do Abismo se entrelaçam com tecnologia avançada (tecnomagia, cristais arcanos de éter, cybercélulas e engenhocas cibernéticas).
Sua missão é gerar ganchos de aventura (side-quests) instigantes, práticos e desafiadores para o Mestre de Jogo guiar sua mesa.
Responda SEMPRE com JSON válido contendo a chave "questHooks". Cada gancho deve conter:
- id: string única (ex: "hook-1")
- title: título misterioso e atrativo
- category: uma de ["Combate", "Investigação", "Sobrevivência", "Resgate", "Arcano", "Infiltração"]
- synopsis: 2 a 3 frases apresentando o gancho inicial e a urgência do problema
- recommendedLevel: faixa recomendada (ex: "Nível ${targetLevel}" ou "Nível ${targetLevel}-${targetLevel + 1}")
- threat: perigo ou inimigo temático
- location: localidade sugestiva de Nexaria
- climaxOrTwist: reviravolta narrativa ou confronto climático
- rewards: objeto com:
    - coinsAmount: número de moedas balanceado
    - currency: "BRZ" (Bronze), "PRT" (Prata), "ORO" (Ouro) ou "CYB" (Cybermoeda)
    - exp: quantidade de EXP (balanceado para nível ${targetLevel}, ex: ${targetLevel * 120} a ${targetLevel * 250} EXP)
    - suggestedItemDrop: nome de item ou relíquia de espólio temático`;

      const userContent = `Gere 3 ganchos de side-quest balanceados para um grupo com Nível Médio ${targetLevel}.
Composição da Mesa: ${partyListDesc}.
${environment ? `Ambiente/Local sugerido: ${environment}.` : ''}
${tone ? `Tom pretendido: ${tone}.` : ''}
${customPrompt ? `Desejo adicional do Mestre: ${customPrompt}.` : ''}

Lembre-se de calibrar o perigo, a dificuldade das ameaças e as recompensas para personagens de Nível ${targetLevel}.`;

      const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.8-flash'];
      let responseText: string | undefined;

      for (const modelName of candidateModels) {
        try {
          const geminiRes = await ai.models.generateContent({
            model: modelName,
            contents: userContent,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: 'application/json',
            },
          });
          if (geminiRes.text) {
            responseText = geminiRes.text;
            break;
          }
        } catch (mErr: any) {
          console.warn(`Model ${modelName} failed for quest hooks:`, mErr?.message || mErr);
        }
      }
      if (responseText) {
        try {
          const parsed = JSON.parse(responseText);
          if (parsed && Array.isArray(parsed.questHooks) && parsed.questHooks.length > 0) {
            res.json({
              success: true,
              source: 'gemini',
              targetAvgLevel: targetLevel,
              questHooks: parsed.questHooks.map((q: any, idx: number) => ({
                id: q.id || `hook-${Date.now()}-${idx}`,
                title: q.title || `O Mistério da Fenda #${idx + 1}`,
                category: q.category || 'Combate',
                synopsis: q.synopsis || 'Um chamado urgente alcança o grupo de aventureiros.',
                recommendedLevel: q.recommendedLevel || `Nível ${targetLevel}`,
                threat: q.threat || 'Criaturas do Abismo',
                location: q.location || 'Fendas Periféricas de Nexaria',
                climaxOrTwist: q.climaxOrTwist || 'Um segredo oculto é revelado no coração da fenda.',
                rewards: {
                  coinsAmount: Number(q.rewards?.coinsAmount) || Math.max(15, targetLevel * 20),
                  currency: q.rewards?.currency || (targetLevel >= 4 ? 'ORO' : 'PRT'),
                  exp: Number(q.rewards?.exp) || Math.max(100, targetLevel * 150),
                  suggestedItemDrop: q.rewards?.suggestedItemDrop || 'Fragmento de Éter Abissal',
                },
                targetAvgLevel: targetLevel,
              })),
            });
            return;
          }
        } catch (parseErr) {
          console.warn('Could not parse Gemini JSON response, engaging procedural generator:', parseErr);
        }
      }
    } catch (apiErr: any) {
      console.warn('Gemini quest hook generation error (engaging fallback):', apiErr?.message || apiErr);
      geminiFailed = true;
    }
  }

  // Procedural thematic backup generator scaled to group average level
  const baseCoins = Math.max(25, targetLevel * 30);
  const baseCurrency: CurrencyType = targetLevel >= 5 ? 'ORO' : targetLevel >= 2 ? 'PRT' : 'BRZ';
  const baseExp = Math.max(120, targetLevel * 180);

  const proceduralHooks = [
    {
      id: `proc-hook-${Date.now()}-1`,
      title: `A Cripta Eletromântica de Eldria`,
      category: 'Investigação',
      synopsis: `Artesãos da Cidadela Baixa relatam que condutores de éter estão vazando energia pura no subsolo. Luzes espectrais azuladas iluminam bueiros antigos, e carcaças mecânicas parecem se mover sozinhas durante a noite.`,
      recommendedLevel: `Nível ${targetLevel} a ${targetLevel + 1}`,
      threat: `Núcleo Arcano Sobrecarregado guardado por Autômatos de Sucata (Nível ${targetLevel})`,
      location: `Subsolos de Eldria — Setor das Tubulações de Éter`,
      climaxOrTwist: `Os autômatos não são hostis por defeito: foram programados para proteger uma criança tecnomante refugiada.`,
      rewards: {
        coinsAmount: baseCoins,
        currency: baseCurrency,
        exp: baseExp,
        suggestedItemDrop: `Bateria Arcana de Éter Puro (+15 PM)`,
      },
      targetAvgLevel: targetLevel,
    },
    {
      id: `proc-hook-${Date.now()}-2`,
      title: `O Rastro do Devorador da Fenda`,
      category: 'Combate',
      synopsis: `Uma patrulha de guardas da muralha desapareceu nos desfiladeiros externos. Marcas de garras cáusticas e armaduras corroídas por veneno abissal foram encontradas próximas à fenda de basalto.`,
      recommendedLevel: `Nível ${targetLevel}`,
      threat: `Verme Devorador Menor com carapaça de quitina reforçada`,
      location: `Garganta do Abismo Profundo — Posto Avançado #4`,
      climaxOrTwist: `A fera foi atraída pelo sino ressonante de uma ordem herética que planeja libertar o ninho inteiro.`,
      rewards: {
        coinsAmount: Math.round(baseCoins * 1.3),
        currency: baseCurrency,
        exp: Math.round(baseExp * 1.2),
        suggestedItemDrop: `Presa Corrosiva do Verme (+2 Dano Químico)`,
      },
      targetAvgLevel: targetLevel,
    },
    {
      id: `proc-hook-${Date.now()}-3`,
      title: `O Contrabando da Cybercélula Proibida`,
      category: 'Infiltração',
      synopsis: `Um mercador do Bazar Subterrâneo oferece uma recompensa polpuda para recuperar uma carga apreendida pelos Guardiões da Cidadela. O contêiner pulsa com tecnomagia instável que pode colapsar quarteirões inteiros se aberto sem a chave rúnica.`,
      recommendedLevel: `Nível ${targetLevel}`,
      threat: `Guardiões Sentinelas e Mercenários do Sindicato das Sombras`,
      location: `Docas Subterrâneas do Bazar de Nexaria`,
      climaxOrTwist: `O contêiner não carrega armas, mas a memória digitalizada da última matriarca élfica de Eldria.`,
      rewards: {
        coinsAmount: Math.round(baseCoins * 1.5),
        currency: targetLevel >= 3 ? 'CYB' : baseCurrency,
        exp: baseExp,
        suggestedItemDrop: `Célula Cybercrômica Desestabilizadora`,
      },
      targetAvgLevel: targetLevel,
    },
  ];

  res.json({
    success: true,
    source: geminiFailed ? 'procedural_fallback' : 'procedural',
    targetAvgLevel: targetLevel,
    questHooks: proceduralHooks,
    notice: geminiFailed ? 'Ganchos criados via matriz procedural balanceada.' : undefined,
  });
});

// SSE: Stream real-time room events to connected players & master
app.get('/api/campaigns/:code/events', (req: Request, res: Response) => {
  const code = normalizeRoomCode(req.params.code);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  if (!sseClients.has(code)) {
    sseClients.set(code, new Set());
  }
  const clients = sseClients.get(code)!;
  clients.add(res);

  // Send current state immediately on connection
  const current = campaigns.get(code);
  if (current) {
    res.write(`data: ${JSON.stringify({ type: 'INIT', code, campaign: current })}\n\n`);
  }

  // Heartbeat ping every 15s
  const interval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(interval);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(interval);
    clients.delete(res);
  });
});

// SSE: Stream global room list changes
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  globalSseClients.add(res);

  const interval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(interval);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(interval);
    globalSseClients.delete(res);
  });
});

// ---------------- VITE & SPA FALLBACK ----------------
async function start() {
  loadCampaignsFromDisk();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req: Request, res: Response, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexaria RPG Server running at http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
});
