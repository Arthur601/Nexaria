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
}

export const sound = new SoundController();
