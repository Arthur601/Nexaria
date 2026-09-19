import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { INITIAL_DEFAULT_CAMPAIGN } from './src/data/defaultCampaign';
import {
  CampaignRoom,
  CharacterSheet,
  CurrencyType,
  CURRENCY_CONFIGS,
  PaymentRequest,
  Transaction,
  Wallet,
  getExpForNextLevel,
} from './src/types/rpg';
import { generateRandomRoomCode, normalizeRoomCode } from './src/utils/roomCode';

dotenv.config();

const app = express();
const PORT = 3000;
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
      for (const key of Object.keys(parsed)) {
        campaigns.set(key.toUpperCase(), parsed[key]);
      }
      console.log(`Loaded ${campaigns.size} campaigns from disk.`);
    }
  } catch (err) {
    console.error('Error loading campaigns from disk', err);
  }

  // Ensure default campaign exists if empty
  if (campaigns.size === 0) {
    campaigns.set(INITIAL_DEFAULT_CAMPAIGN.code, { ...INITIAL_DEFAULT_CAMPAIGN });
    saveCampaignsToDisk();
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
    marketItems: [...INITIAL_DEFAULT_CAMPAIGN.marketItems],
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
    let needed = getExpForNextLevel(char.level);
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
      needed = getExpForNextLevel(char.level);
    }
    if (leveled) {
      leveledUpNames.push(`${char.name} (Nível ${char.level})`);
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
  const existingInv = character.inventory.find((i) => i.name === item.name);
  if (existingInv) {
    existingInv.quantity += 1;
  } else {
    character.inventory.push({
      id: 'inv-' + Date.now(),
      name: item.name,
      quantity: 1,
      category: item.category,
      description: item.description,
      valueAmount: item.price,
      valueCurrency: item.currency,
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
    reason: `Compra de item: ${item.name}`,
    type: 'shop_purchase',
    status: 'confirmed',
    timestamp: Date.now(),
  };

  camp.transactions.unshift(tx);
  broadcastUpdate(code, camp);

  res.json({
    success: true,
    message: `Você comprou "${item.name}" por ${item.price} ${item.currency}!`,
    campaign: camp,
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
