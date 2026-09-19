import { INITIAL_DEFAULT_CAMPAIGN } from '../data/defaultCampaign';
import {
  CampaignRoom,
  CharacterSheet,
  CurrencyType,
  CURRENCY_CONFIGS,
  ExternalActionType,
  ExternalActionPayload,
  PaymentRequest,
  Transaction,
  Wallet,
  getExpForNextLevel,
} from '../types/rpg';
import { generateRandomRoomCode, normalizeRoomCode } from '../utils/roomCode';

const STORAGE_KEY = 'nexaria_campaigns_v3';

type CampaignListener = (campaign: CampaignRoom) => void;

class CampaignService {
  private memoryCampaigns: Map<string, CampaignRoom> = new Map();
  private listeners: Map<string, Set<CampaignListener>> = new Map();
  private globalListeners: Set<() => void> = new Set();
  private activeEventSource: EventSource | null = null;
  private currentSubscribedCode: string | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private isServerOnline = true;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('nexaria_sync_channel_v3');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'CAMPAIGN_UPDATED' && event.data?.code) {
            const code = event.data.code.toUpperCase();
            this.fetchCampaignFromServer(code);
          } else if (event.data?.type === 'ROOMS_CHANGED') {
            this.fetchAllCampaignsFromServer();
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported in this environment', err);
      }

      // Load local cache for instant UI rendering
      this.loadFromLocalStorage();

      // Immediately fetch latest from server
      this.fetchAllCampaignsFromServer();

      // Start background sync poll every 3.5 seconds
      this.pollTimer = setInterval(() => {
        if (this.currentSubscribedCode) {
          this.fetchCampaignFromServer(this.currentSubscribedCode);
        }
      }, 3500);
    }

    // Ensure initial default campaign exists in memory
    if (!this.memoryCampaigns.has(INITIAL_DEFAULT_CAMPAIGN.code)) {
      this.memoryCampaigns.set(INITIAL_DEFAULT_CAMPAIGN.code, INITIAL_DEFAULT_CAMPAIGN);
      this.saveToLocalStorage();
    }
  }

  private loadFromLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, CampaignRoom>;
        for (const code in parsed) {
          this.memoryCampaigns.set(code.toUpperCase(), parsed[code]);
        }
      }
    } catch (e) {
      console.error('Error loading campaigns from cache', e);
    }
  }

  private saveToLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const obj: Record<string, CampaignRoom> = {};
      this.memoryCampaigns.forEach((camp, code) => {
        obj[code] = camp;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.error('Error saving campaigns to cache', e);
    }
  }

  private notifyListeners(code: string, campaign: CampaignRoom) {
    const upper = code.toUpperCase();
    const list = this.listeners.get(upper);
    if (list) {
      list.forEach((cb) => {
        try {
          cb(campaign);
        } catch (err) {
          console.error('Error in campaign listener', err);
        }
      });
    }
  }

  private notifyGlobalListeners() {
    this.globalListeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Error in global listener', err);
      }
    });
  }

  /**
   * Connect to real-time Server-Sent Events (SSE) for the active room
   */
  private setupEventSource(code: string) {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    const upper = code.toUpperCase();

    if (this.activeEventSource && this.currentSubscribedCode === upper) {
      return; // Already listening to this room
    }

    if (this.activeEventSource) {
      this.activeEventSource.close();
      this.activeEventSource = null;
    }

    this.currentSubscribedCode = upper;

    try {
      const es = new EventSource(`/api/campaigns/${encodeURIComponent(upper)}/events`);
      this.activeEventSource = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.campaign) {
            this.isServerOnline = true;
            this.memoryCampaigns.set(upper, data.campaign);
            this.saveToLocalStorage();
            this.notifyListeners(upper, data.campaign);
            this.notifyGlobalListeners();
          }
        } catch {
          // heartbeat or unparseable
        }
      };

      es.onerror = () => {
        // SSE disconnected, fallback to polling
        this.isServerOnline = false;
      };

      es.onopen = () => {
        this.isServerOnline = true;
      };
    } catch (err) {
      console.warn('Could not establish SSE connection', err);
    }
  }

  /**
   * Fetch active room data from backend
   */
  public async fetchCampaignFromServer(code: string): Promise<CampaignRoom | null> {
    const upper = normalizeRoomCode(code);
    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(upper)}`);
      if (res.ok) {
        const data: CampaignRoom = await res.json();
        this.isServerOnline = true;
        this.memoryCampaigns.set(upper, data);
        this.saveToLocalStorage();
        this.notifyListeners(upper, data);
        this.notifyGlobalListeners();
        return data;
      }
    } catch {
      this.isServerOnline = false;
    }
    return this.memoryCampaigns.get(upper) || null;
  }

  /**
   * Fetch list of all public campaigns from server
   */
  public async fetchAllCampaignsFromServer(): Promise<CampaignRoom[]> {
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const list: Array<{ code: string; name: string }> = await res.json();
        this.isServerOnline = true;
        for (const item of list) {
          if (!this.memoryCampaigns.has(item.code)) {
            await this.fetchCampaignFromServer(item.code);
          }
        }
        this.notifyGlobalListeners();
      }
    } catch {
      this.isServerOnline = false;
    }
    return this.getAllCampaigns();
  }

  /**
   * Check if a room exists on the server
   */
  public async checkRoomExists(code: string): Promise<{ exists: boolean; campaign?: CampaignRoom }> {
    const upper = normalizeRoomCode(code);
    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(upper)}`);
      if (res.ok) {
        const camp = (await res.json()) as CampaignRoom;
        this.memoryCampaigns.set(upper, camp);
        this.saveToLocalStorage();
        return { exists: true, campaign: camp };
      }
    } catch {
      // offline fallback
      if (this.memoryCampaigns.has(upper)) {
        return { exists: true, campaign: this.memoryCampaigns.get(upper)! };
      }
    }
    return { exists: false };
  }

  /**
   * Subscribe to real-time room updates
   */
  public subscribe(code: string, callback: CampaignListener): () => void {
    const upper = normalizeRoomCode(code);
    if (!this.listeners.has(upper)) {
      this.listeners.set(upper, new Set());
    }
    const set = this.listeners.get(upper)!;
    set.add(callback);

    // Initial trigger from memory
    const current = this.memoryCampaigns.get(upper);
    if (current) {
      callback(current);
    }

    // Connect SSE & fetch fresh copy
    this.setupEventSource(upper);
    this.fetchCampaignFromServer(upper);

    return () => {
      set.delete(callback);
    };
  }

  public subscribeGlobal(callback: () => void): () => void {
    this.globalListeners.add(callback);
    return () => {
      this.globalListeners.delete(callback);
    };
  }

  public getCampaign(code: string): CampaignRoom | null {
    const upper = normalizeRoomCode(code);
    return this.memoryCampaigns.get(upper) || null;
  }

  public getAllCampaigns(): CampaignRoom[] {
    return Array.from(this.memoryCampaigns.values());
  }

  /**
   * Generates a completely random, unique room code
   */
  public generateRoomCode(): string {
    return generateRandomRoomCode();
  }

  /**
   * Master creates a new online room with a completely random code
   */
  public async createCampaign(
    name: string,
    gmName: string,
    description: string,
    customCode?: string,
    initialPlayerWallet?: Wallet
  ): Promise<CampaignRoom> {
    const generatedCode = (customCode && customCode.trim())
      ? normalizeRoomCode(customCode)
      : this.generateRoomCode();

    const startingWallet: Wallet = initialPlayerWallet || {
      BRZ: 50,
      PRT: 10,
      ORO: 2,
      PLN: 0,
      CYB: 0,
    };

    const payload = {
      name: name || 'Nexaria — O Legado do Abismo',
      gmName: gmName || 'Mestre do Jogo',
      description: description || 'Mesa de RPG online criada em Nexaria.',
      customCode: generatedCode,
      startingWallet,
    };

    let newCampaign: CampaignRoom;

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        newCampaign = await res.json();
      } else {
        throw new Error('Falha ao criar sala no servidor.');
      }
    } catch {
      // Local fallback
      newCampaign = {
        code: generatedCode,
        name: payload.name,
        gmName: payload.gmName,
        description: payload.description,
        createdAt: Date.now(),
        startingWallet,
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
    }

    this.memoryCampaigns.set(newCampaign.code, newCampaign);
    this.saveToLocalStorage();
    this.notifyListeners(newCampaign.code, newCampaign);
    this.notifyGlobalListeners();

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'CAMPAIGN_UPDATED', code: newCampaign.code });
    }

    return newCampaign;
  }

  public async deleteCampaign(code: string): Promise<boolean> {
    const upper = normalizeRoomCode(code);
    try {
      await fetch(`/api/campaigns/${encodeURIComponent(upper)}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Delete on server failed', e);
    }

    this.memoryCampaigns.delete(upper);
    this.saveToLocalStorage();
    this.notifyGlobalListeners();

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'ROOMS_CHANGED' });
    }
    return true;
  }

  public resetAllData(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.warn('Error clearing cache', e);
      }
    }
    this.memoryCampaigns.clear();
    this.memoryCampaigns.set(INITIAL_DEFAULT_CAMPAIGN.code, { ...INITIAL_DEFAULT_CAMPAIGN });
    this.saveToLocalStorage();
    this.notifyGlobalListeners();
  }

  public saveCampaign(campaign: CampaignRoom): void {
    const upper = normalizeRoomCode(campaign.code);
    this.memoryCampaigns.set(upper, campaign);
    this.saveToLocalStorage();
    this.notifyListeners(upper, campaign);
    this.notifyGlobalListeners();

    fetch(`/api/campaigns/${encodeURIComponent(upper)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign),
    }).catch((e) => console.warn('Sync campaign PUT failed', e));
  }

  /**
   * Add or update a character sheet in the room online
   */
  public async saveOrUpdateCharacter(campaignCode: string, character: CharacterSheet): Promise<boolean> {
    const upper = normalizeRoomCode(campaignCode);
    const campaign = this.getCampaign(upper);

    if (campaign) {
      const existingIdx = campaign.players.findIndex((p) => p.id === character.id);
      if (existingIdx >= 0) {
        campaign.players[existingIdx] = { ...character, lastActive: Date.now() };
      } else {
        campaign.players.push({ ...character, lastActive: Date.now() });
      }
      this.saveToLocalStorage();
      this.notifyListeners(upper, campaign);
    }

    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(upper)}/character`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(character),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.campaign) {
          this.memoryCampaigns.set(upper, data.campaign);
          this.saveToLocalStorage();
          this.notifyListeners(upper, data.campaign);
        }
        return true;
      }
    } catch (e) {
      console.warn('Save character online failed, preserved locally', e);
    }
    return true;
  }

  public async removeCharacter(campaignCode: string, characterId: string): Promise<boolean> {
    const upper = normalizeRoomCode(campaignCode);
    const campaign = this.getCampaign(upper);
    if (campaign) {
      campaign.players = campaign.players.filter((p) => p.id !== characterId);
      this.saveToLocalStorage();
      this.notifyListeners(upper, campaign);
    }

    try {
      await fetch(`/api/campaigns/${encodeURIComponent(upper)}/character/${encodeURIComponent(characterId)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Delete character online failed', e);
    }
    return true;
  }

  /**
   * Distribute EXP by Master to a character or to all characters in the campaign
   */
  public async awardExp(
    campaignCode: string,
    targetCharacterId: string,
    expAmount: number,
    reason?: string
  ): Promise<{ success: boolean; message: string; leveledUp?: string[] }> {
    const upper = normalizeRoomCode(campaignCode);
    const campaign = this.getCampaign(upper);

    const leveledUpNames: string[] = [];

    if (campaign) {
      const targets =
        targetCharacterId === 'all'
          ? campaign.players
          : campaign.players.filter((p) => p.id === targetCharacterId);

      for (const char of targets) {
        char.experience = (char.experience || 0) + expAmount;
        let needed = getExpForNextLevel(char.level);
        let leveled = false;
        while (char.experience >= needed) {
          char.experience -= needed;
          char.level += 1;
          char.unspentAttributePoints = (char.unspentAttributePoints || 0) + 3;
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

      this.saveToLocalStorage();
      this.notifyListeners(upper, campaign);
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: 'CAMPAIGN_UPDATED', code: upper });
      }
    }

    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(upper)}/award-exp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCharacterId, expAmount, reason }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.campaign) {
          this.memoryCampaigns.set(upper, data.campaign);
          this.saveToLocalStorage();
          this.notifyListeners(upper, data.campaign);
        }
        return {
          success: true,
          message: data.message || `${expAmount} EXP entregues!`,
          leveledUp: data.leveledUp || leveledUpNames,
        };
      }
    } catch (e) {
      console.warn('Award EXP server call failed, preserved locally', e);
    }

    return {
      success: true,
      message: `${expAmount} EXP distribuídos localmente!`,
      leveledUp: leveledUpNames,
    };
  }

  /**
   * Spend 1 earned status point to increment an attribute
   */
  public async allocateAttributePoint(
    campaignCode: string,
    characterId: string,
    attributeKey: 'FOR' | 'DES' | 'CON' | 'INT' | 'SAB' | 'CAR'
  ): Promise<boolean> {
    const upper = normalizeRoomCode(campaignCode);
    const campaign = this.getCampaign(upper);

    if (campaign) {
      const char = campaign.players.find((p) => p.id === characterId);
      if (char && (char.unspentAttributePoints || 0) > 0) {
        char.attributes[attributeKey] = (char.attributes[attributeKey] || 10) + 1;
        char.unspentAttributePoints = (char.unspentAttributePoints || 0) - 1;
        if (attributeKey === 'CON') {
          char.hp.max += 5;
          char.hp.current = Math.min(char.hp.max, char.hp.current + 5);
        } else if (attributeKey === 'INT') {
          char.mana.max += 5;
          char.mana.current = Math.min(char.mana.max, char.mana.current + 5);
        }
        char.lastActive = Date.now();
        this.saveToLocalStorage();
        this.notifyListeners(upper, campaign);
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({ type: 'CAMPAIGN_UPDATED', code: upper });
        }
      }
    }

    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(upper)}/allocate-attribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, attributeKey }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.campaign) {
          this.memoryCampaigns.set(upper, data.campaign);
          this.saveToLocalStorage();
          this.notifyListeners(upper, data.campaign);
        }
        return true;
      }
    } catch (e) {
      console.warn('Allocate attribute server call failed, preserved locally', e);
    }

    return true;
  }

  /**
   * Apply external in-game action (monster attack, potion, healing/restoration spell, rest, environmental hazards)
   */
  public async applyExternalAction(
    campaignCode: string,
    characterId: string,
    action: ExternalActionPayload
  ): Promise<{ success: boolean; message: string; character?: CharacterSheet }> {
    const upper = normalizeRoomCode(campaignCode);
    const campaign = this.getCampaign(upper);

    let feedbackMsg = '';
    let updatedChar: CharacterSheet | undefined;

    if (campaign) {
      const char = campaign.players.find((p) => p.id === characterId);
      if (char) {
        const mult = action.multiplier && action.multiplier > 0 ? action.multiplier : 1;
        const baseAmount = Math.max(0, action.amount || 0);
        const numAmount = Math.max(1, Math.round(baseAmount * mult));

        if (action.actionType === 'monster_attack') {
          char.hp.current = Math.max(0, char.hp.current - numAmount);
          feedbackMsg = `Ataque de ${action.sourceName || 'Criatura'}: causou -${numAmount} de dano! (${char.hp.current}/${char.hp.max} PV)`;
        } else if (action.actionType === 'poison_burn_dot') {
          char.hp.current = Math.max(0, char.hp.current - numAmount);
          feedbackMsg = `Dano Contínuo (${action.sourceName || 'Veneno/Queimadura'}): -${numAmount} PV! (${char.hp.current}/${char.hp.max} PV)`;
        } else if (action.actionType === 'environmental_trap') {
          char.hp.current = Math.max(0, char.hp.current - numAmount);
          feedbackMsg = `Perigo Ambiental (${action.sourceName || 'Armadilha'}): -${numAmount} PV! (${char.hp.current}/${char.hp.max} PV)`;
        } else if (action.actionType === 'potion_hp') {
          const prev = char.hp.current;
          char.hp.current = Math.min(char.hp.max, char.hp.current + numAmount);
          feedbackMsg = `Bebeu ${action.sourceName || 'Poção'}: +${char.hp.current - prev} PV! (${char.hp.current}/${char.hp.max} PV)`;
        } else if (action.actionType === 'potion_mana') {
          const prev = char.mana.current;
          char.mana.current = Math.min(char.mana.max, char.mana.current + numAmount);
          feedbackMsg = `Bebeu ${action.sourceName || 'Frasco de Mana'}: +${char.mana.current - prev} PM! (${char.mana.current}/${char.mana.max} PM)`;
        } else if (action.actionType === 'heal_spell') {
          const prev = char.hp.current;
          char.hp.current = Math.min(char.hp.max, char.hp.current + numAmount);
          feedbackMsg = `Magia de Cura (${action.sourceName || 'Regeneração'}): +${char.hp.current - prev} PV! (${char.hp.current}/${char.hp.max} PV)`;
        } else if (action.actionType === 'mana_spell') {
          const prev = char.mana.current;
          char.mana.current = Math.min(char.mana.max, char.mana.current + numAmount);
          feedbackMsg = `Harmonização Arcana (${action.sourceName || 'Éter'}): +${char.mana.current - prev} PM! (${char.mana.current}/${char.mana.max} PM)`;
        } else if (action.actionType === 'short_rest') {
          const prevHp = char.hp.current;
          const prevMana = char.mana.current;
          char.hp.current = Math.min(char.hp.max, char.hp.current + numAmount);
          char.mana.current = Math.min(char.mana.max, char.mana.current + Math.round(numAmount / 2));
          feedbackMsg = `Descanso Curto: +${char.hp.current - prevHp} PV e +${char.mana.current - prevMana} PM! (${char.hp.current}/${char.hp.max} PV | ${char.mana.current}/${char.mana.max} PM)`;
        } else if (action.actionType === 'long_rest') {
          char.hp.current = char.hp.max;
          char.mana.current = char.mana.max;
          feedbackMsg = `Descanso Longo concluído! PV e PM totalmente restaurados (${char.hp.max}/${char.hp.max} PV | ${char.mana.max}/${char.mana.max} PM).`;
        } else if (action.actionType === 'custom_damage') {
          if (action.targetVitals === 'mana') {
            char.mana.current = Math.max(0, char.mana.current - numAmount);
            feedbackMsg = `Dano de Mana (${action.sourceName || 'Dreno'}): -${numAmount} PM! (${char.mana.current}/${char.mana.max} PM)`;
          } else {
            char.hp.current = Math.max(0, char.hp.current - numAmount);
            feedbackMsg = `Dano (${action.sourceName || 'Efeito'}): -${numAmount} PV! (${char.hp.current}/${char.hp.max} PV)`;
          }
        } else if (action.actionType === 'custom_recovery') {
          if (action.targetVitals === 'mana') {
            const prevMana = char.mana.current;
            char.mana.current = Math.min(char.mana.max, char.mana.current + numAmount);
            feedbackMsg = `Recuperação de Mana: +${char.mana.current - prevMana} PM! (${char.mana.current}/${char.mana.max} PM)`;
          } else if (action.targetVitals === 'both') {
            const prevHp = char.hp.current;
            const prevMana = char.mana.current;
            char.hp.current = Math.min(char.hp.max, char.hp.current + numAmount);
            char.mana.current = Math.min(char.mana.max, char.mana.current + numAmount);
            feedbackMsg = `Restauração Completa: +${char.hp.current - prevHp} PV e +${char.mana.current - prevMana} PM!`;
          } else {
            const prevHp = char.hp.current;
            char.hp.current = Math.min(char.hp.max, char.hp.current + numAmount);
            feedbackMsg = `Recuperação de Vida: +${char.hp.current - prevHp} PV! (${char.hp.current}/${char.hp.max} PV)`;
          }
        }

        char.lastActive = Date.now();
        updatedChar = char;
        this.saveToLocalStorage();
        this.notifyListeners(upper, campaign);
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({ type: 'CAMPAIGN_UPDATED', code: upper });
        }
      }
    }

    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(upper)}/external-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, ...action }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.campaign) {
          this.memoryCampaigns.set(upper, data.campaign);
          this.saveToLocalStorage();
          this.notifyListeners(upper, data.campaign);
        }
        return {
          success: true,
          message: data.message || feedbackMsg,
          character: data.character || updatedChar,
        };
      }
    } catch (e) {
      console.warn('External action server call failed, preserved locally', e);
    }

    return {
      success: true,
      message: feedbackMsg || 'Ação aplicada com sucesso!',
      character: updatedChar,
    };
  }

  /**
   * Master updates character parameters (CA, Speed, Initiative, Notes, Race, Class, Title).
   * Note: Attributes are solely managed by player allocation; HP/Mana are managed via External Actions.
   */
  public async updateCharacterVitalsByGm(
    campaignCode: string,
    characterId: string,
    vitals: Partial<CharacterSheet>
  ): Promise<boolean> {
    const upper = normalizeRoomCode(campaignCode);
    const campaign = this.getCampaign(upper);

    if (campaign) {
      const char = campaign.players.find((p) => p.id === characterId);
      if (char) {
        if (typeof vitals.armorClass === 'number') char.armorClass = vitals.armorClass;
        if (typeof vitals.speed === 'string') char.speed = vitals.speed;
        if (typeof vitals.initiative === 'number') char.initiative = vitals.initiative;
        if (typeof vitals.notes === 'string') char.notes = vitals.notes;
        if (typeof vitals.race === 'string' && vitals.race.trim()) char.race = vitals.race.trim();
        if (typeof vitals.characterClass === 'string' && vitals.characterClass.trim()) char.characterClass = vitals.characterClass.trim();
        if (typeof vitals.title === 'string') char.title = vitals.title;
        char.lastActive = Date.now();
        this.saveToLocalStorage();
        this.notifyListeners(upper, campaign);
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({ type: 'CAMPAIGN_UPDATED', code: upper });
        }
      }
    }

    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(upper)}/update-vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, ...vitals }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.campaign) {
          this.memoryCampaigns.set(upper, data.campaign);
          this.saveToLocalStorage();
          this.notifyListeners(upper, data.campaign);
        }
        return true;
      }
    } catch (e) {
      console.warn('Update vitals online failed, preserved locally', e);
    }
    return true;
  }

  /**
   * Execute real-time currency transaction
   */
  public async executeTransaction(
    campaignCode: string,
    params: {
      senderId: string;
      senderName: string;
      receiverId: string;
      receiverName: string;
      amount: number;
      currency: CurrencyType;
      reason: string;
      type: Transaction['type'];
    }
  ): Promise<{ success: boolean; message: string; transaction?: Transaction }> {
    const upper = normalizeRoomCode(campaignCode);

    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(upper)}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.campaign) {
          this.memoryCampaigns.set(upper, data.campaign);
          this.saveToLocalStorage();
          this.notifyListeners(upper, data.campaign);
        }
        return data;
      }
      return { success: false, message: data.message || 'Erro ao processar transação.' };
    } catch {
      // Local fallback in offline mode
      return this.executeTransactionLocally(upper, params);
    }
  }

  private executeTransactionLocally(
    upper: string,
    params: {
      senderId: string;
      senderName: string;
      receiverId: string;
      receiverName: string;
      amount: number;
      currency: CurrencyType;
      reason: string;
      type: Transaction['type'];
    }
  ): { success: boolean; message: string; transaction?: Transaction } {
    const campaign = this.getCampaign(upper);
    if (!campaign) return { success: false, message: 'Campanha não encontrada.' };

    const { senderId, receiverId, amount, currency, reason, type, senderName, receiverName } = params;
    if (amount <= 0) return { success: false, message: 'Quantidade deve ser maior que zero.' };

    if (senderId !== 'gm') {
      const sender = campaign.players.find((p) => p.id === senderId);
      if (!sender) return { success: false, message: 'Personagem não encontrado.' };
      const curBal = sender.wallet[currency] || 0;
      if (curBal < amount) {
        return { success: false, message: `Saldo insuficiente de ${currency}.` };
      }
      sender.wallet[currency] -= amount;
    } else {
      campaign.gmWallet[currency] = (campaign.gmWallet[currency] || 0) - amount;
    }

    if (receiverId === 'gm') {
      campaign.gmWallet[currency] = (campaign.gmWallet[currency] || 0) + amount;
    } else {
      const receiver = campaign.players.find((p) => p.id === receiverId);
      if (receiver) receiver.wallet[currency] = (receiver.wallet[currency] || 0) + amount;
    }

    const tx: Transaction = {
      id: 'tx-' + Date.now(),
      campaignCode: upper,
      senderId,
      senderName,
      receiverId,
      receiverName,
      amount,
      currency,
      reason,
      type,
      status: 'confirmed',
      timestamp: Date.now(),
    };

    campaign.transactions.unshift(tx);
    this.saveCampaign(campaign);
    return { success: true, message: 'Transação confirmada!', transaction: tx };
  }

  /**
   * Currency exchange conversion
   */
  public async convertCurrency(
    campaignCode: string,
    characterId: string,
    fromCurrency: CurrencyType,
    toCurrency: CurrencyType,
    amountToConvert: number
  ): Promise<{ success: boolean; message: string }> {
    const upper = normalizeRoomCode(campaignCode);

    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(upper)}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, fromCurrency, toCurrency, amount: amountToConvert }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.campaign) {
          this.memoryCampaigns.set(upper, data.campaign);
          this.saveToLocalStorage();
          this.notifyListeners(upper, data.campaign);
        }
        return data;
      }
      return { success: false, message: data.message || 'Erro ao realizar conversão.' };
    } catch {
      // Local fallback
      const campaign = this.getCampaign(upper);
      if (!campaign) return { success: false, message: 'Campanha não encontrada.' };
      const character = campaign.players.find((p) => p.id === characterId);
      if (!character) return { success: false, message: 'Personagem não encontrado.' };

      const fromRate = CURRENCY_CONFIGS[fromCurrency].unitValueInBRZ;
      const toRate = CURRENCY_CONFIGS[toCurrency].unitValueInBRZ;
      const totalInBRZ = amountToConvert * fromRate;
      if (totalInBRZ < toRate) {
        return { success: false, message: 'Valor insuficiente para conversão.' };
      }
      const obtained = Math.floor(totalInBRZ / toRate);
      const cost = (obtained * toRate) / fromRate;
      character.wallet[fromCurrency] -= cost;
      character.wallet[toCurrency] = (character.wallet[toCurrency] || 0) + obtained;

      this.saveCampaign(campaign);
      return { success: true, message: `Conversão realizada! ${obtained} ${toCurrency} obtidos.` };
    }
  }

  /**
   * GM creates payment request
   */
  public async createPaymentRequest(
    campaignCode: string,
    req: {
      targetCharacterId: string;
      amount: number;
      currency: CurrencyType;
      reason: string;
    }
  ): Promise<boolean> {
    const upper = normalizeRoomCode(campaignCode);
    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(upper)}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.campaign) {
          this.memoryCampaigns.set(upper, data.campaign);
          this.saveToLocalStorage();
          this.notifyListeners(upper, data.campaign);
        }
        return true;
      }
    } catch (e) {
      console.warn('Payment request error', e);
    }
    return false;
  }

  /**
   * Player pays a GM payment request
   */
  public async payPaymentRequest(
    campaignCode: string,
    requestId: string,
    characterId: string
  ): Promise<{ success: boolean; message: string }> {
    const upper = normalizeRoomCode(campaignCode);
    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(upper)}/pay-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, characterId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.campaign) {
          this.memoryCampaigns.set(upper, data.campaign);
          this.saveToLocalStorage();
          this.notifyListeners(upper, data.campaign);
        }
        return data;
      }
      return { success: false, message: data.message || 'Erro ao pagar cobrança.' };
    } catch {
      return { success: false, message: 'Erro de comunicação ao pagar cobrança.' };
    }
  }

  /**
   * Player buys an item from the GM market
   */
  public async buyShopItem(
    campaignCode: string,
    characterId: string,
    itemId: string
  ): Promise<{ success: boolean; message: string }> {
    const upper = normalizeRoomCode(campaignCode);
    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(upper)}/buy-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, itemId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.campaign) {
          this.memoryCampaigns.set(upper, data.campaign);
          this.saveToLocalStorage();
          this.notifyListeners(upper, data.campaign);
        }
        return data;
      }
      return { success: false, message: data.message || 'Erro ao comprar item.' };
    } catch {
      return { success: false, message: 'Erro ao conectar à loja do Mestre.' };
    }
  }
}

export const campaignService = new CampaignService();
