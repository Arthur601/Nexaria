/**
 * Web Audio API procedural sound synthesizer for RPG coins and spells
 * Zero external audio files required, fast and responsive.
 */

class SoundController {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Sound of authentic RPG metal coins clinking
   */
  playCoinClink(type: 'BRZ' | 'PRT' | 'ORO' | 'PLN' | 'CYB' = 'ORO') {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'CYB') {
      // Tech-magic futuristic coin ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(4, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
      return;
    }

    // Metal frequencies based on material
    const baseFreqs = {
      BRZ: [740, 1120, 1580],
      PRT: [1100, 1750, 2400],
      ORO: [980, 1470, 2200],
      PLN: [1350, 2100, 3100],
    }[type] || [980, 1470, 2200];

    baseFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + (Math.random() * 40 - 20), now);

      const duration = 0.25 + i * 0.05;
      gain.gain.setValueAtTime(0.12 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    });

    // Secondary bounce
    setTimeout(() => {
      const nextCtx = this.getContext();
      if (!nextCtx) return;
      const t = nextCtx.currentTime;
      const osc2 = nextCtx.createOscillator();
      const gain2 = nextCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreqs[1] * 1.05, t);
      gain2.gain.setValueAtTime(0.08, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc2.connect(gain2);
      gain2.connect(nextCtx.destination);
      osc2.start(t);
      osc2.stop(t + 0.18);
    }, 70);
  }

  /**
   * Sound when a transaction is confirmed / treasure reward received
   */
  playSuccessFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    });
  }

  /**
   * Arcane spell cast sound effect
   */
  playSpellCast() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  /**
   * Subtle alert sound (e.g. bill from GM received)
   */
  playNotice() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(554.37, now + 0.1);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Sound of insufficient balance (empty coin pouch rattle & dull dissonant buzz)
   */
  playInsufficientBalance() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Dissonant low frequencies
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(150, now);
    osc1.frequency.exponentialRampToValueAtTime(80, now + 0.35);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(185, now);
    osc2.frequency.exponentialRampToValueAtTime(95, now + 0.35);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.38);
    osc2.stop(now + 0.38);

    // Empty pouch dry click rattle
    setTimeout(() => {
      const c = this.getContext();
      if (!c) return;
      const t = c.currentTime;
      const rattle = c.createOscillator();
      const rattleGain = c.createGain();
      rattle.type = 'triangle';
      rattle.frequency.setValueAtTime(120, t);
      rattleGain.gain.setValueAtTime(0.12, t);
      rattleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      rattle.connect(rattleGain);
      rattleGain.connect(c.destination);
      rattle.start(t);
      rattle.stop(t + 0.15);
    }, 120);
  }

  /**
   * Sound of coins received (magical treasure chime and sparkling arpeggio)
   */
  playCoinReceived(type: 'BRZ' | 'PRT' | 'ORO' | 'PLN' | 'CYB' = 'ORO') {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, i) => {
      const now = ctx.currentTime + i * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type === 'CYB' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    });

    // Cascade coin clinks after chime
    setTimeout(() => {
      this.playCoinClink(type);
    }, 180);
    setTimeout(() => {
      this.playCoinClink(type);
    }, 320);
  }

  /**
   * Sound of victory level-up fanfare and triumphant RPG chord progression
   */
  playLevelUp() {
    const ctx = this.getContext();
    if (!ctx) return;

    // Major triumphant arpeggio: C5 -> E5 -> G5 -> C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (idx === notes.length - 1 ? 0.8 : 0.4));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + (idx === notes.length - 1 ? 0.8 : 0.4));
    });
  }

  /**
   * Sound of monster attack hit / combat damage taken
   */
  playMonsterHit() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  /**
   * Sound of drinking a potion (bubbles + gulp + restorative shine)
   */
  playPotionDrink() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [330, 440, 554.37, 659.25];
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    });
  }

  /**
   * Sound of healing / regeneration spell casting
   */
  playHealingSpell() {
    const ctx = this.getContext();
    if (!ctx) return;

    // Harmonic arpeggio E4 -> G#4 -> B4 -> E5
    const notes = [329.63, 415.30, 493.88, 659.25];
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    });
  }

  /**
   * Sound of rolling polyhedral RPG dice on a felt wooden tray
   */
  playDiceRoll() {
    const ctx = this.getContext();
    if (!ctx) return;

    // Series of tactile clicks and tumbling impacts
    const now = ctx.currentTime;
    const numTumbles = 4;
    for (let i = 0; i < numTumbles; i++) {
      const start = now + i * 0.065 + Math.random() * 0.02;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i % 2 === 0 ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(220 + Math.random() * 200, start);
      osc.frequency.exponentialRampToValueAtTime(100, start + 0.04);

      gain.gain.setValueAtTime(0.12 - i * 0.02, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.05);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, start);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.05);
    }
  }

  /**
   * Sound of vitals change (damage or heal)
   */
  playVitalsChange(type: 'damage' | 'heal' = 'damage') {
    if (type === 'damage') {
      this.playMonsterHit();
    } else {
      this.playHealingSpell();
    }
  }

  /**
   * Sound of runic inscription or mystic deciphering
   */
  playRuneChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12); // E6
    osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.28); // B5

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(400, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  /**
   * Sound of traveling on the map / moving party token
   */
  playMapTravel() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [329.63, 440.0, 554.37, 659.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.22);
    });
  }

  // ============================================================
  // AMBIENT SOUNDTRACK & ATMOSPHERE SYNTHESIZER
  // ============================================================
  private ambientGainNode: GainNode | null = null;
  private ambientTrackId: string | null = null;
  private ambientIntervals: any[] = [];
  private ambientNodes: AudioNode[] = [];
  private ambientVolume: number = 0.65;
  private ambientListeners: Array<(state: { isPlaying: boolean; trackId: string | null; volume: number }) => void> = [];

  subscribeAmbientState(cb: (state: { isPlaying: boolean; trackId: string | null; volume: number }) => void) {
    this.ambientListeners.push(cb);
    cb({
      isPlaying: this.ambientTrackId !== null,
      trackId: this.ambientTrackId,
      volume: this.ambientVolume,
    });
    return () => {
      this.ambientListeners = this.ambientListeners.filter((l) => l !== cb);
    };
  }

  private notifyAmbientState() {
    const state = {
      isPlaying: this.ambientTrackId !== null,
      trackId: this.ambientTrackId,
      volume: this.ambientVolume,
    };
    this.ambientListeners.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.warn('Error in ambient listener', err);
      }
    });
  }

  getCurrentAmbientTrack(): string | null {
    return this.ambientTrackId;
  }

  isAmbientPlaying(): boolean {
    return this.ambientTrackId !== null;
  }

  getAmbientVolume(): number {
    return this.ambientVolume;
  }

  setAmbientVolume(vol: number) {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    if (this.ambientGainNode && this.ctx) {
      this.ambientGainNode.gain.setTargetAtTime(this.ambientVolume, this.ctx.currentTime, 0.08);
    }
    this.notifyAmbientState();
  }

  stopAmbientTrack() {
    if (!this.ambientTrackId) return;

    // Clear active loops
    this.ambientIntervals.forEach((timer) => clearInterval(timer));
    this.ambientIntervals = [];

    // Fade out gain smoothly
    if (this.ambientGainNode && this.ctx) {
      try {
        this.ambientGainNode.gain.setValueAtTime(this.ambientGainNode.gain.value, this.ctx.currentTime);
        this.ambientGainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
      } catch {}
    }

    setTimeout(() => {
      this.ambientNodes.forEach((node) => {
        try {
          if ('stop' in node && typeof (node as any).stop === 'function') {
            (node as any).stop();
          }
          node.disconnect();
        } catch {}
      });
      this.ambientNodes = [];
      this.ambientTrackId = null;
      this.notifyAmbientState();
    }, 650);
  }

  playAmbientTrack(trackId: string) {
    const ctx = this.getContext();
    if (!ctx) return;

    if (this.ambientTrackId) {
      this.stopAmbientTrack();
    }

    setTimeout(() => {
      this.startSynthesizedAmbientTrack(trackId);
    }, this.ambientTrackId ? 680 : 50);
  }

  private startSynthesizedAmbientTrack(trackId: string) {
    const ctx = this.getContext();
    if (!ctx) return;

    this.ambientTrackId = trackId;
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(this.ambientVolume, now + 0.8);
    masterGain.connect(ctx.destination);
    this.ambientGainNode = masterGain;

    if (trackId === 'caverna') {
      this.synthesizeDarkCaveAtmosphere(ctx, masterGain);
    } else if (trackId === 'taverna') {
      this.synthesizeVibrantTavernAtmosphere(ctx, masterGain);
    } else if (trackId === 'batalha') {
      this.synthesizeEpicBattleAtmosphere(ctx, masterGain);
    } else if (trackId === 'abismo') {
      this.synthesizeArcaneAbyssAtmosphere(ctx, masterGain);
    } else if (trackId === 'floresta') {
      this.synthesizeMysticForestAtmosphere(ctx, masterGain);
    } else if (trackId === 'acampamento') {
      this.synthesizeCampfireAtmosphere(ctx, masterGain);
    } else {
      // Default fallback
      this.synthesizeDarkCaveAtmosphere(ctx, masterGain);
    }

    this.notifyAmbientState();
  }

  /**
   * 1. CAVERNA ESCURA (Dark Cave)
   * Deep sub drone + filtered subterranean wind + cavernous echo water drops
   */
  private synthesizeDarkCaveAtmosphere(ctx: AudioContext, master: GainNode) {
    const now = ctx.currentTime;

    // Sub-bass drone 48Hz & 55Hz
    [48, 55].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);

      gain.gain.setValueAtTime(0.22, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      osc.start(now);
      this.ambientNodes.push(osc, gain, filter);
    });

    // Subterranean howling cold wind (bandpass noise)
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(320, now);
    windFilter.Q.setValueAtTime(3.5, now);

    // LFO for breathing wind swells
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, now);
    lfoGain.gain.setValueAtTime(180, now);
    lfo.connect(windFilter.frequency);

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.12, now);

    whiteNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(master);

    whiteNoise.start(now);
    lfo.start(now);
    this.ambientNodes.push(whiteNoise, windFilter, lfo, lfoGain, windGain);

    // Procedural water droplets ping loop
    const dripTimer = setInterval(() => {
      if (this.ambientTrackId !== 'caverna') return;
      const c = this.getContext();
      if (!c) return;
      const t = c.currentTime;

      const dripOsc = c.createOscillator();
      const dripGain = c.createGain();

      const dripFreq = 1400 + Math.random() * 800;
      dripOsc.type = 'sine';
      dripOsc.frequency.setValueAtTime(dripFreq, t);
      dripOsc.frequency.exponentialRampToValueAtTime(dripFreq * 1.5, t + 0.04);
      dripOsc.frequency.exponentialRampToValueAtTime(dripFreq * 0.9, t + 0.12);

      dripGain.gain.setValueAtTime(0.001, t);
      dripGain.gain.linearRampToValueAtTime(0.08 + Math.random() * 0.05, t + 0.02);
      dripGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

      dripOsc.connect(dripGain);
      dripGain.connect(master);

      dripOsc.start(t);
      dripOsc.stop(t + 0.36);

      // Reverb echo bounce
      setTimeout(() => {
        const c2 = this.getContext();
        if (!c2 || this.ambientTrackId !== 'caverna') return;
        const t2 = c2.currentTime;
        const echoOsc = c2.createOscillator();
        const echoGain = c2.createGain();
        echoOsc.type = 'sine';
        echoOsc.frequency.setValueAtTime(dripFreq * 1.05, t2);
        echoGain.gain.setValueAtTime(0.025, t2);
        echoGain.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.28);
        echoOsc.connect(echoGain);
        echoGain.connect(master);
        echoOsc.start(t2);
        echoOsc.stop(t2 + 0.29);
      }, 160);
    }, 1800);

    this.ambientIntervals.push(dripTimer);
  }

  /**
   * 2. TAVERNA VIBRANTE (Vibrant Tavern)
   * Warm lively plucked lute chords + rhythmic tavern stomps & wood percussion
   */
  private synthesizeVibrantTavernAtmosphere(ctx: AudioContext, master: GainNode) {
    // Hearth fireplace crackle background
    const bufSize = ctx.sampleRate * 2;
    const crackleBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = crackleBuf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      // Stochastic crackle spikes
      data[i] = Math.random() > 0.97 ? (Math.random() * 2 - 1) * 0.8 : (Math.random() * 0.05 - 0.025);
    }
    const crackle = ctx.createBufferSource();
    crackle.buffer = crackleBuf;
    crackle.loop = true;

    const crackleFilter = ctx.createBiquadFilter();
    crackleFilter.type = 'bandpass';
    crackleFilter.frequency.setValueAtTime(900, ctx.currentTime);

    const crackleGain = ctx.createGain();
    crackleGain.gain.setValueAtTime(0.045, ctx.currentTime);

    crackle.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(master);
    crackle.start(ctx.currentTime);
    this.ambientNodes.push(crackle, crackleFilter, crackleGain);

    // Warm Folk Arpeggios (D major / Dorian folk scale: D4, F#4, A4, B4, D5, E5, A4)
    const folkChords = [
      [293.66, 369.99, 440.0], // D - F# - A
      [246.94, 293.66, 369.99], // B - D - F# (Bm)
      [196.0, 246.94, 293.66], // G - B - D
      [220.0, 277.18, 329.63], // A - C# - E
    ];

    let chordIdx = 0;
    let step = 0;

    const luteTimer = setInterval(() => {
      if (this.ambientTrackId !== 'taverna') return;
      const c = this.getContext();
      if (!c) return;
      const t = c.currentTime;

      const currentChord = folkChords[chordIdx % folkChords.length];
      const noteFreq = currentChord[step % currentChord.length] * (step % 2 === 0 ? 1 : 1.5);

      // Plucked string harmonic synthesis (triangle + lowpass filter envelope)
      const osc = c.createOscillator();
      const gain = c.createGain();
      const filter = c.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(noteFreq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, t);
      filter.frequency.exponentialRampToValueAtTime(400, t + 0.35);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      osc.start(t);
      osc.stop(t + 0.42);

      // Foot stomp / tavern table tap on beat 0 and 2
      if (step === 0 || step === 2) {
        const stompOsc = c.createOscillator();
        const stompGain = c.createGain();
        stompOsc.type = 'triangle';
        stompOsc.frequency.setValueAtTime(95, t);
        stompOsc.frequency.exponentialRampToValueAtTime(45, t + 0.1);
        stompGain.gain.setValueAtTime(0.13, t);
        stompGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        stompOsc.connect(stompGain);
        stompGain.connect(master);
        stompOsc.start(t);
        stompOsc.stop(t + 0.13);
      }

      step++;
      if (step >= 4) {
        step = 0;
        chordIdx++;
      }
    }, 280); // ~107 BPM

    this.ambientIntervals.push(luteTimer);
  }

  /**
   * 3. BATALHA ÉPICA (Epic Battle)
   * Driving rhythmic war drums (Taiko impact) + ominous brass chords + battle tension
   */
  private synthesizeEpicBattleAtmosphere(ctx: AudioContext, master: GainNode) {
    const brassChords = [
      [146.83, 220.0, 293.66], // D3, A3, D4 (D power chord)
      [130.81, 196.0, 261.63], // C3, G3, C4 (C power chord)
      [116.54, 174.61, 233.08], // Bb2, F3, Bb3 (Bb power chord)
      [110.0, 164.81, 220.0], // A2, E3, A3 (A power chord)
    ];

    let beat = 0;
    let chordStep = 0;

    // Fast driving combat rhythm: 138 BPM -> ~217ms sixteenth notes
    const battleTimer = setInterval(() => {
      if (this.ambientTrackId !== 'batalha') return;
      const c = this.getContext();
      if (!c) return;
      const t = c.currentTime;

      // Heavy War Drum (Beat 0, 4, 8, 12 in 16-step bar)
      const isDownbeat = beat % 4 === 0;
      const isSyncopated = beat === 3 || beat === 7 || beat === 11 || beat === 14;

      if (isDownbeat || isSyncopated) {
        const drumOsc = c.createOscillator();
        const drumGain = c.createGain();
        drumOsc.type = 'sine';
        drumOsc.frequency.setValueAtTime(isDownbeat ? 85 : 120, t);
        drumOsc.frequency.exponentialRampToValueAtTime(32, t + 0.18);

        drumGain.gain.setValueAtTime(isDownbeat ? 0.28 : 0.16, t);
        drumGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        drumOsc.connect(drumGain);
        drumGain.connect(master);
        drumOsc.start(t);
        drumOsc.stop(t + 0.23);
      }

      // Snare / metal shield bash rattle on beats 2 and 6
      if (beat % 4 === 2) {
        const bashOsc = c.createOscillator();
        const bashGain = c.createGain();
        const filter = c.createBiquadFilter();
        bashOsc.type = 'sawtooth';
        bashOsc.frequency.setValueAtTime(280, t);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, t);
        bashGain.gain.setValueAtTime(0.14, t);
        bashGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        bashOsc.connect(filter);
        filter.connect(bashGain);
        bashGain.connect(master);
        bashOsc.start(t);
        bashOsc.stop(t + 0.09);
      }

      // Heroic / Ominous Brass Stab every 8 beats
      if (beat % 8 === 0) {
        const chord = brassChords[chordStep % brassChords.length];
        chord.forEach((freq) => {
          const brassOsc = c.createOscillator();
          const brassGain = c.createGain();
          const brassFilter = c.createBiquadFilter();

          brassOsc.type = 'sawtooth';
          brassOsc.frequency.setValueAtTime(freq, t);

          brassFilter.type = 'lowpass';
          brassFilter.frequency.setValueAtTime(350, t);
          brassFilter.frequency.linearRampToValueAtTime(1200, t + 0.1);
          brassFilter.frequency.exponentialRampToValueAtTime(450, t + 0.6);

          brassGain.gain.setValueAtTime(0.001, t);
          brassGain.gain.linearRampToValueAtTime(0.11, t + 0.05);
          brassGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);

          brassOsc.connect(brassFilter);
          brassFilter.connect(brassGain);
          brassGain.connect(master);

          brassOsc.start(t);
          brassOsc.stop(t + 0.66);
        });

        chordStep++;
      }

      beat = (beat + 1) % 16;
    }, 220); // ~136 BPM

    this.ambientIntervals.push(battleTimer);
  }

  /**
   * 4. ABISMO ARCANO (Arcane Abyss)
   * Deep space ether pad, floating celestial harmonics, runic chimes
   */
  private synthesizeArcaneAbyssAtmosphere(ctx: AudioContext, master: GainNode) {
    const padFreqs = [174.61, 261.63, 329.63, 392.0]; // F3, C4, E4, G4 (Fmaj9 cosmic chord)

    padFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, ctx.currentTime);

      // Subtle detune chorus
      osc.detune.setValueAtTime((idx % 2 === 0 ? 5 : -5), ctx.currentTime);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      osc.start(ctx.currentTime);
      this.ambientNodes.push(osc, gain, filter);
    });

    // Runic bell chimes floating in interval
    const chimeNotes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    const chimeTimer = setInterval(() => {
      if (this.ambientTrackId !== 'abismo') return;
      const c = this.getContext();
      if (!c) return;
      const t = c.currentTime;

      const freq = chimeNotes[Math.floor(Math.random() * chimeNotes.length)];
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

      osc.connect(gain);
      gain.connect(master);

      osc.start(t);
      osc.stop(t + 1.25);
    }, 2400);

    this.ambientIntervals.push(chimeTimer);
  }

  /**
   * 5. FLORESTA MÍSTICA (Mystic Forest)
   * Canopy wind rustle + peaceful woodwind melody
   */
  private synthesizeMysticForestAtmosphere(ctx: AudioContext, master: GainNode) {
    const pentatonic = [329.63, 392.0, 440.0, 493.88, 587.33, 659.25];
    let noteIdx = 0;

    const fluteTimer = setInterval(() => {
      if (this.ambientTrackId !== 'floresta') return;
      const c = this.getContext();
      if (!c) return;
      const t = c.currentTime;

      const freq = pentatonic[noteIdx % pentatonic.length];
      const osc = c.createOscillator();
      const gain = c.createGain();
      const filter = c.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.09, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      osc.start(t);
      osc.stop(t + 0.88);

      noteIdx = (noteIdx + Math.floor(Math.random() * 3) + 1) % pentatonic.length;
    }, 1100);

    this.ambientIntervals.push(fluteTimer);
  }

  /**
   * 6. ACAMPAMENTO NOTURNO (Campfire Rest)
   * Crackling fire embers + nocturnal cricket chirps + warm resting hum
   */
  private synthesizeCampfireAtmosphere(ctx: AudioContext, master: GainNode) {
    // Warm low drone
    const droneOsc = ctx.createOscillator();
    const droneGain = ctx.createGain();
    droneOsc.type = 'triangle';
    droneOsc.frequency.setValueAtTime(110, ctx.currentTime);
    droneGain.gain.setValueAtTime(0.08, ctx.currentTime);
    droneOsc.connect(droneGain);
    droneGain.connect(master);
    droneOsc.start(ctx.currentTime);
    this.ambientNodes.push(droneOsc, droneGain);

    // Pop & crackle loop
    const crackleTimer = setInterval(() => {
      if (this.ambientTrackId !== 'acampamento') return;
      const c = this.getContext();
      if (!c) return;
      const t = c.currentTime;

      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(300 + Math.random() * 800, t);
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.04);
    }, 180);

    this.ambientIntervals.push(crackleTimer);
  }

  // ============================================================
  // DRAMATIC MASTER SOUND EFFECTS TRIGGERABLE ON DEMAND
  // ============================================================

  /**
   * Thunderclap & rolling lightning boom
   */
  playThunder() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.45);
  }

  /**
   * Deep guttural monster roar
   */
  playMonsterRoar() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(80, now);
    osc1.frequency.linearRampToValueAtTime(140, now + 0.2);
    osc1.frequency.exponentialRampToValueAtTime(35, now + 0.85);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(65, now);
    osc2.frequency.linearRampToValueAtTime(115, now + 0.2);
    osc2.frequency.exponentialRampToValueAtTime(30, now + 0.85);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.95);
    osc2.stop(now + 0.95);
  }

  /**
   * Heavy iron dungeon gate creaking shut
   */
  playIronGate() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(380, now + 0.3);
    osc.frequency.linearRampToValueAtTime(110, now + 0.7);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.76);
  }

  /**
   * Resonant war horn call
   */
  playWarHorn() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [146.83, 220.0]; // D3, A3
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      const start = now + idx * 0.15;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.22, start + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.95);
    });
  }
}

export interface AmbientTrackInfo {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  tempo: string;
  mood: string;
}

export const AMBIENT_TRACKS: AmbientTrackInfo[] = [
  {
    id: 'caverna',
    name: 'Caverna Escura',
    subtitle: 'Masmorras & Fendas Subterrâneas',
    description: 'Bordão de sub-graves profundos, ventos frios subterrâneos e goteiras distantes reverberantes no basalto.',
    icon: '🕳️',
    color: 'from-blue-950 to-indigo-950 border-blue-800/60 text-blue-200',
    tempo: '60 BPM • Drone Lento',
    mood: 'Tensão & Mistério',
  },
  {
    id: 'taverna',
    name: 'Taverna Vibrante',
    subtitle: 'Canecas, Risos & Alaúde Folclórico',
    description: 'Arpeggios animados em modo dórico, palmas ritmadas, baques na madeira de carvalho e calor da lareira.',
    icon: '🍺',
    color: 'from-amber-950 to-yellow-950 border-amber-800/60 text-amber-200',
    tempo: '108 BPM • Festivo',
    mood: 'Celebração & Descanso',
  },
  {
    id: 'batalha',
    name: 'Batalha Épica',
    subtitle: 'Tambores de Guerra & Trompas Marciais',
    description: 'Percussão de guerra com impacto pesado de bumbo taiko, batidas sincopadas e stabs de metais épicos.',
    icon: '⚔️',
    color: 'from-red-950 to-rose-950 border-red-800/60 text-red-200',
    tempo: '136 BPM • Pulso Acelerado',
    mood: 'Combate Decisivo',
  },
  {
    id: 'abismo',
    name: 'Abismo Arcano',
    subtitle: 'Pads Cósmicos & Ressonância de Éter',
    description: 'Acordes espaciais etéreos com modulação de chorus, sino de cristal e harmônicos arcanos de Nexaria.',
    icon: '🔮',
    color: 'from-purple-950 to-violet-950 border-purple-800/60 text-purple-200',
    tempo: '72 BPM • Místico',
    mood: 'Ocultismo & Magia',
  },
  {
    id: 'floresta',
    name: 'Floresta Mística',
    subtitle: 'Sussurros Élficos & Vento nas Copas',
    description: 'Brisa suave nas folhas ancestrais e melodias pentatônicas calmas de flauta rúnica na mata.',
    icon: '🌲',
    color: 'from-emerald-950 to-teal-950 border-emerald-800/60 text-emerald-200',
    tempo: '80 BPM • Suave',
    mood: 'Exploração Serena',
  },
  {
    id: 'acampamento',
    name: 'Acampamento Noturno',
    subtitle: 'Fogueira Crepitante & Calmaria Sob as Estrelas',
    description: 'Brasas de fogueira estalando, grilos na escuridão e zumbido quente para repouso do grupo.',
    icon: '🔥',
    color: 'from-orange-950 to-amber-950 border-orange-800/60 text-orange-200',
    tempo: '55 BPM • Íntimo',
    mood: 'Recuperação de Vitis',
  },
];

export const sound = new SoundController();
