/**
 * Procedural Ambient Audio Synthesizer for Eldria's 9 Regions
 * Built with Web Audio API — 100% client-side, zero external files, no lag.
 */

export interface RegionAudioInfo {
  id: string;
  name: string;
  soundscapeTitle: string;
  description: string;
  icon: string;
  themeColor: string;
}

export const REGION_AUDIO_PROFILES: Record<string, RegionAudioInfo> = {
  montanhas_gelo: {
    id: 'montanhas_gelo',
    name: 'Montanhas de Gelo Eterno',
    soundscapeTitle: 'Uivo das Nevascas Glaciais',
    description: 'Ventos árticos cortantes, sibilos de nevasca e rajadas frias nos picos.',
    icon: '❄️',
    themeColor: '#38bdf8',
  },
  floresta_verdancia: {
    id: 'floresta_verdancia',
    name: 'Floresta de Verdância',
    soundscapeTitle: 'Sussurros da Copa & Pássaros Silvestres',
    description: 'Brisa através de folhagens ancestrais e cantos serenos de pássaros da floresta.',
    icon: '🍃',
    themeColor: '#4ade80',
  },
  terras_aridas: {
    id: 'terras_aridas',
    name: 'Terras Áridas',
    soundscapeTitle: 'Rajadas Desérticas & Poeira Estéril',
    description: 'Vento seco e contínuo soprando dunas arenosas e desfiladeiros rochosos.',
    icon: '🏜️',
    themeColor: '#fbbf24',
  },
  terras_igneas: {
    id: 'terras_igneas',
    name: 'Terras Ígneas',
    soundscapeTitle: 'Borbulhar de Magma & Crepitar de Chamas',
    description: 'Ressonância vulcânica profunda de magma fervente e estalos de brasas.',
    icon: '🌋',
    themeColor: '#f97316',
  },
  caeldrin: {
    id: 'caeldrin',
    name: 'Caeldrin (A Capital Dourada)',
    soundscapeTitle: 'Harmonia Arcana & Sinos Celestiais',
    description: 'Ressonâncias etéreas luminosas, acordes sacros e sinos pacíficos de santuário.',
    icon: '🏛️',
    themeColor: '#fde047',
  },
  dominio_cibernetico: {
    id: 'dominio_cibernetico',
    name: 'Domínio Cibernético',
    soundscapeTitle: 'Pulso Tecnomágico & Glitch Sci-Fi',
    description: 'Zumbido de servidores ancestrais, frequências sintéticas e pulsos digitais.',
    icon: '💠',
    themeColor: '#22d3ee',
  },
  campos_alarion: {
    id: 'campos_alarion',
    name: 'Campos de Alarion',
    soundscapeTitle: 'Brisa Pastoral & Planícies Verdes',
    description: 'Vento suave e temperado sobre pradarias abertas e campos dourados.',
    icon: '🌾',
    themeColor: '#a3e635',
  },
  ilhas_esquecidas: {
    id: 'ilhas_esquecidas',
    name: 'Ilhas Esquecidas',
    soundscapeTitle: 'Ondas Litorâneas & Portos Marítimos',
    description: 'Marolas e ondas quebrando ritmicamente na costa, mar aberto e maresia.',
    icon: '🌊',
    themeColor: '#60a5fa',
  },
  cidadela_sombras: {
    id: 'cidadela_sombras',
    name: 'Cidadela das Sombras',
    soundscapeTitle: 'Ressonância Abissal & Ecos Sinistros',
    description: 'Drones sub-graves da fenda abissal, ecos etéreos e murmúrios da corrupção.',
    icon: '🌑',
    themeColor: '#c084fc',
  },
};

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentRegionId: string | null = null;
  private isPlaying = false;
  private volume = 0.5; // 0.0 to 1.0
  private cleanupFns: Array<() => void> = [];
  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(playing: boolean, regionId: string | null, volume: number) => void> = new Set();

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public subscribe(cb: (playing: boolean, regionId: string | null, volume: number) => void): () => void {
    this.listeners.add(cb);
    cb(this.isPlaying, this.currentRegionId, this.volume);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.isPlaying, this.currentRegionId, this.volume);
      } catch (err) {
        console.error(err);
      }
    });
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentRegionId(): string | null {
    return this.currentRegionId;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.cleanupCurrentSound();
    this.notify();
  }

  public playRegion(regionId: string) {
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    if (this.isPlaying && this.currentRegionId === regionId) {
      return; // already playing this region
    }

    this.cleanupCurrentSound();
    this.currentRegionId = regionId;
    this.isPlaying = true;
    this.notify();

    try {
      this.synthesizeRegion(regionId, ctx, this.masterGain);
    } catch (err) {
      console.error('Error generating ambient sound for', regionId, err);
    }
  }

  public togglePlay(regionId?: string) {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.playRegion(regionId || this.currentRegionId || 'montanhas_gelo');
    }
  }

  private cleanupCurrentSound() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.cleanupFns.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.warn('Cleanup error', e);
      }
    });
    this.cleanupFns = [];
  }

  /**
   * Generates white noise buffer
   */
  private createNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Synthesize region-specific ambient audio
   */
  private synthesizeRegion(regionId: string, ctx: AudioContext, destination: GainNode) {
    const regionGain = ctx.createGain();
    regionGain.gain.setValueAtTime(0.001, ctx.currentTime);
    regionGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2); // Smooth fade in
    regionGain.connect(destination);

    this.cleanupFns.push(() => {
      try {
        regionGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        setTimeout(() => regionGain.disconnect(), 600);
      } catch {}
    });

    switch (regionId) {
      case 'montanhas_gelo':
        this.synthIcyBlizzard(ctx, regionGain);
        break;
      case 'floresta_verdancia':
        this.synthVerdantForest(ctx, regionGain);
        break;
      case 'terras_aridas':
        this.synthAridDesert(ctx, regionGain);
        break;
      case 'terras_igneas':
        this.synthVolcanicMagma(ctx, regionGain);
        break;
      case 'caeldrin':
        this.synthCelestialSanctuary(ctx, regionGain);
        break;
      case 'dominio_cibernetico':
        this.synthCyberPulse(ctx, regionGain);
        break;
      case 'campos_alarion':
        this.synthPeacefulPlains(ctx, regionGain);
        break;
      case 'ilhas_esquecidas':
        this.synthOceanWaves(ctx, regionGain);
        break;
      case 'cidadela_sombras':
        this.synthAbyssalShadows(ctx, regionGain);
        break;
      default:
        this.synthPeacefulPlains(ctx, regionGain);
    }
  }

  // 1. MONTANHAS DE GELO: Howling wind & blizzard whistles
  private synthIcyBlizzard(ctx: AudioContext, target: GainNode) {
    const noiseBuffer = this.createNoiseBuffer(ctx, 5);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Resonant bandpass for howling wind
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, ctx.currentTime);
    filter.Q.setValueAtTime(4, ctx.currentTime);

    // LFO for swirling wind gusts
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.18, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(250, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.28, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(windGain);
    windGain.connect(target);

    // High whistle tone
    const whistle = ctx.createOscillator();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(840, ctx.currentTime);
    const whistleGain = ctx.createGain();
    whistleGain.gain.setValueAtTime(0.025, ctx.currentTime);
    whistle.connect(whistleGain);
    whistleGain.connect(target);

    noiseSource.start();
    lfo.start();
    whistle.start();

    this.cleanupFns.push(() => {
      try {
        noiseSource.stop();
        lfo.stop();
        whistle.stop();
      } catch {}
    });
  }

  // 2. FLORESTA VERDÂNCIA: Rustling leaves and bird calls
  private synthVerdantForest(ctx: AudioContext, target: GainNode) {
    const noiseBuffer = this.createNoiseBuffer(ctx, 4);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);

    const leafGain = ctx.createGain();
    leafGain.gain.setValueAtTime(0.08, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(leafGain);
    leafGain.connect(target);
    noiseSource.start();

    // Occasional bird chirp interval
    const triggerBirdChirp = () => {
      if (!this.isPlaying || ctx.state === 'closed') return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const baseFreq = 2200 + Math.random() * 800;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(gain);
      gain.connect(target);
      osc.start(now);
      osc.stop(now + 0.2);
    };

    this.intervalTimer = setInterval(triggerBirdChirp, 3200);

    this.cleanupFns.push(() => {
      try {
        noiseSource.stop();
      } catch {}
    });
  }

  // 3. TERRAS ÁRIDAS: Dry desert winds and low sand sweep
  private synthAridDesert(ctx: AudioContext, target: GainNode) {
    const noiseBuffer = this.createNoiseBuffer(ctx, 5);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(280, ctx.currentTime);
    filter.Q.setValueAtTime(2.2, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(120, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.24, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(target);

    noiseSource.start();
    lfo.start();

    this.cleanupFns.push(() => {
      try {
        noiseSource.stop();
        lfo.stop();
      } catch {}
    });
  }

  // 4. TERRAS ÍGNEAS: Deep volcanic rumble & crackling embers
  private synthVolcanicMagma(ctx: AudioContext, target: GainNode) {
    // Deep magma bass drone
    const drone = ctx.createOscillator();
    drone.type = 'sawtooth';
    drone.frequency.setValueAtTime(65, ctx.currentTime);

    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(140, ctx.currentTime);

    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.2, ctx.currentTime);

    drone.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(target);
    drone.start();

    // Fire crackling sparks
    const triggerCrackle = () => {
      if (!this.isPlaying || ctx.state === 'closed') return;
      const now = ctx.currentTime;
      const crackle = ctx.createOscillator();
      const crackleGain = ctx.createGain();
      crackle.type = 'triangle';
      crackle.frequency.setValueAtTime(450 + Math.random() * 600, now);

      crackleGain.gain.setValueAtTime(0.06, now);
      crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      crackle.connect(crackleGain);
      crackleGain.connect(target);
      crackle.start(now);
      crackle.stop(now + 0.05);
    };

    this.intervalTimer = setInterval(triggerCrackle, 280);

    this.cleanupFns.push(() => {
      try {
        drone.stop();
      } catch {}
    });
  }

  // 5. CAELDRIN: Holy celestial chords & mystical sanctuary bells
  private synthCelestialSanctuary(ctx: AudioContext, target: GainNode) {
    // Harmonic frequencies: F4, A4, C5, E5
    const freqs = [349.23, 440.0, 523.25, 659.25];
    const oscs: OscillatorNode[] = [];

    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04 / (idx + 1), ctx.currentTime);

      // Subtle vibrato
      const vibrato = ctx.createOscillator();
      vibrato.frequency.setValueAtTime(0.25 + idx * 0.05, ctx.currentTime);
      const vibGain = ctx.createGain();
      vibGain.gain.setValueAtTime(1.5, ctx.currentTime);
      vibrato.connect(vibGain);
      vibGain.connect(osc.frequency);

      osc.connect(gain);
      gain.connect(target);

      osc.start();
      vibrato.start();
      oscs.push(osc, vibrato);
    });

    this.cleanupFns.push(() => {
      oscs.forEach((o) => {
        try {
          o.stop();
        } catch {}
      });
    });
  }

  // 6. DOMÍNIO CIBERNÉTICO: Cybernetic hum and technomagic data pings
  private synthCyberPulse(ctx: AudioContext, target: GainNode) {
    const hum = ctx.createOscillator();
    hum.type = 'sawtooth';
    hum.frequency.setValueAtTime(110, ctx.currentTime); // 110Hz techno hum

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(220, ctx.currentTime);
    filter.Q.setValueAtTime(5, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);

    hum.connect(filter);
    filter.connect(gain);
    gain.connect(target);
    hum.start();

    // Data beeps
    const triggerDataPing = () => {
      if (!this.isPlaying || ctx.state === 'closed') return;
      const now = ctx.currentTime;
      const ping = ctx.createOscillator();
      const pingGain = ctx.createGain();
      ping.type = 'square';
      const notes = [880, 1174, 1760, 1318];
      ping.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)], now);

      pingGain.gain.setValueAtTime(0.03, now);
      pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      ping.connect(pingGain);
      pingGain.connect(target);
      ping.start(now);
      ping.stop(now + 0.09);
    };

    this.intervalTimer = setInterval(triggerDataPing, 1200);

    this.cleanupFns.push(() => {
      try {
        hum.stop();
      } catch {}
    });
  }

  // 7. CAMPOS DE ALARION: Gentle open fields breeze
  private synthPeacefulPlains(ctx: AudioContext, target: GainNode) {
    const noiseBuffer = this.createNoiseBuffer(ctx, 4);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(150, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.16, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(target);

    noiseSource.start();
    lfo.start();

    this.cleanupFns.push(() => {
      try {
        noiseSource.stop();
        lfo.stop();
      } catch {}
    });
  }

  // 8. ILHAS ESQUECIDAS: Ocean waves rolling and receding
  private synthOceanWaves(ctx: AudioContext, target: GainNode) {
    const noiseBuffer = this.createNoiseBuffer(ctx, 6);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, ctx.currentTime);

    // Wave swell LFO (every ~5.5s a wave comes in and rolls back)
    const swellLfo = ctx.createOscillator();
    swellLfo.type = 'sine';
    swellLfo.frequency.setValueAtTime(0.18, ctx.currentTime);

    const swellGain = ctx.createGain();
    swellGain.gain.setValueAtTime(0.18, ctx.currentTime);

    const masterWaveGain = ctx.createGain();
    masterWaveGain.gain.setValueAtTime(0.14, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(masterWaveGain);
    masterWaveGain.connect(target);

    // Connect LFO to modulate volume and filter frequency
    swellLfo.connect(swellGain);
    swellGain.connect(masterWaveGain.gain);

    noiseSource.start();
    swellLfo.start();

    this.cleanupFns.push(() => {
      try {
        noiseSource.stop();
        swellLfo.stop();
      } catch {}
    });
  }

  // 9. CIDADELA DAS SOMBRAS: Sub-bass abyssal drone and eerie resonance
  private synthAbyssalShadows(ctx: AudioContext, target: GainNode) {
    const subBass = ctx.createOscillator();
    subBass.type = 'sine';
    subBass.frequency.setValueAtTime(48, ctx.currentTime); // 48Hz abyssal sub

    const overtone = ctx.createOscillator();
    overtone.type = 'sawtooth';
    overtone.frequency.setValueAtTime(96.5, ctx.currentTime); // detuned overtone

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.24, ctx.currentTime);

    subBass.connect(gain);
    overtone.connect(filter);
    filter.connect(gain);
    gain.connect(target);

    subBass.start();
    overtone.start();

    this.cleanupFns.push(() => {
      try {
        subBass.stop();
        overtone.stop();
      } catch {}
    });
  }
}

export const ambientAudio = new AmbientAudioEngine();
