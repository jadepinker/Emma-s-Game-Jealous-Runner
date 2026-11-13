/**
 * Web Audio API Sound Generator & Music Synthesizer
 * Procedural low-latency sound effects and adaptive background rhythm.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmVolume: number = 0.7; // 0 to 1
  private sfxVolume: number = 0.8; // 0 to 1
  private voiceVolume: number = 0.9; // 0 to 1
  private voiceEnabled: boolean = true;
  private musicInterval: number | null = null;
  private musicStep: number = 0;
  private isMusicPlaying: boolean = false;

  private safeGetStorage(key: string): string | null {
    try {
      return typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem(key)
        : null;
    } catch {
      return null;
    }
  }

  private safeSetStorage(key: string, value: string) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // ignore storage restrictions
    }
  }

  constructor() {
    // Check initial mute and volume state from localStorage safely
    const savedMute = this.safeGetStorage('emma_runner_muted');
    if (savedMute !== null) {
      this.isMuted = savedMute === 'true';
    }
    const savedBgm = this.safeGetStorage('emma_runner_bgm');
    if (savedBgm !== null) {
      const parsed = parseFloat(savedBgm);
      if (Number.isFinite(parsed)) this.bgmVolume = Math.max(0, Math.min(1, parsed));
    }
    const savedSfx = this.safeGetStorage('emma_runner_sfx');
    if (savedSfx !== null) {
      const parsed = parseFloat(savedSfx);
      if (Number.isFinite(parsed)) this.sfxVolume = Math.max(0, Math.min(1, parsed));
    }
    const savedVoice = this.safeGetStorage('emma_runner_voice');
    if (savedVoice !== null) {
      const parsed = parseFloat(savedVoice);
      if (Number.isFinite(parsed)) this.voiceVolume = Math.max(0, Math.min(1, parsed));
    }
    const savedVoiceEn = this.safeGetStorage('emma_runner_voice_enabled');
    if (savedVoiceEn !== null) {
      this.voiceEnabled = savedVoiceEn === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean): boolean {
    this.isMuted = muted;
    this.safeSetStorage('emma_runner_muted', String(this.isMuted));
    if (this.isMuted) {
      if (this.isMusicPlaying) this.stopMusic();
      this.stopVoice();
    }
    return this.isMuted;
  }

  public toggleMute(): boolean {
    return this.setMuted(!this.isMuted);
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setBgmVolume(val: number) {
    this.bgmVolume = Math.max(0, Math.min(1, val));
    this.safeSetStorage('emma_runner_bgm', String(this.bgmVolume));
  }

  public getBgmVolume(): number {
    return this.bgmVolume;
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    this.safeSetStorage('emma_runner_sfx', String(this.sfxVolume));
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setVoiceVolume(val: number) {
    this.voiceVolume = Math.max(0, Math.min(1, val));
    this.safeSetStorage('emma_runner_voice', String(this.voiceVolume));
  }

  public getVoiceVolume(): number {
    return this.voiceVolume;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
    this.safeSetStorage('emma_runner_voice_enabled', String(this.voiceEnabled));
    if (!enabled) this.stopVoice();
  }

  public getVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  /**
   * Speak Dialogue in-game using SpeechSynthesis with custom character pitch and tone
   */
  public speakVoice(
    text: string,
    character: 'EMMA' | 'AYLA' | 'CHLOE' | 'ROWAN' | 'LEO' | 'STRANGER' | 'WHITE_LILY' | 'NARRATOR' = 'NARRATOR',
    options?: { isEvil?: boolean; emotion?: string }
  ) {
    if (this.isMuted || !this.voiceEnabled || this.voiceVolume <= 0) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();

      // Clean speech text and strip "in mind:" prefix if present
      const clean = text
        .replace(/^\s*in\s+mind\s*:\s*/i, '')
        .replace(/[*#_~`]/g, '')
        .replace(/[“”"']/g, '')
        .replace(/[^\w\s.,?!;:…-]/gi, '')
        .trim();

      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.volume = Math.max(0, Math.min(1, this.voiceVolume));

      const emo = (options?.emotion || '').toLowerCase();
      const isEmmaEvil =
        options?.isEvil ||
        emo === 'angry' ||
        emo === 'evil' ||
        emo === 'jealous' ||
        emo === 'laughing' ||
        (emo === 'screaming' && character === 'EMMA');

      switch (character) {
        case 'EMMA':
          if (isEmmaEvil) {
            // Cold & deep evil shift
            utterance.pitch = 0.78;
            utterance.rate = 0.9;
          } else {
            // Sweet & high normal Emma
            utterance.pitch = 1.42;
            utterance.rate = 1.02;
          }
          break;
        case 'AYLA':
        case 'WHITE_LILY':
          // Gentle & calm
          utterance.pitch = 1.18;
          utterance.rate = 0.92;
          break;
        case 'CHLOE':
          // Warm & energetic
          utterance.pitch = 1.3;
          utterance.rate = 1.08;
          break;
        case 'ROWAN':
        case 'STRANGER':
          // Curious & neutral
          utterance.pitch = 1.12;
          utterance.rate = 1.02;
          break;
        case 'LEO':
          // Brave & youthful
          utterance.pitch = 1.0;
          utterance.rate = 1.1;
          break;
        default:
          utterance.pitch = 1.0;
          utterance.rate = 0.98;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech fallback
    }
  }

  public stopVoice() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Jump SFX: quick upward slide
  public playJump() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.18);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Audio fallback
    }
  }

  // Slide SFX: low swoosh with filtered noise-like timbre
  public playSlide() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.22);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Audio fallback
    }
  }

  // Lane switch: quick soft whoosh
  public playLaneSwitch() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Audio fallback
    }
  }

  // Crystal pickup: rising musical chime scaling with combo
  public playCrystal(combo: number = 1) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Pentatonic scale base frequencies
      const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
      const noteIdx = Math.min(scale.length - 1, Math.max(0, (combo - 1) % scale.length));
      const freq = scale[noteIdx];

      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Audio fallback
    }
  }

  // Powerup Fanfare: bright triad
  public playPowerup() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const startTime = now + idx * 0.06;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch {
      // Audio fallback
    }
  }

  // Evil Awakening / Rage activation: deep bass pulse + evil resonance
  public playEvilAwakening() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Sub-bass growl
      const bass = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bass.type = 'sawtooth';
      bass.frequency.setValueAtTime(110, now);
      bass.frequency.exponentialRampToValueAtTime(45, now + 0.8);
      bassGain.gain.setValueAtTime(0.35, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      bass.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bass.start(now);
      bass.stop(now + 0.9);

      // Evil harmonic chime
      const highOsc = this.ctx.createOscillator();
      const highGain = this.ctx.createGain();
      highOsc.type = 'sine';
      highOsc.frequency.setValueAtTime(660, now + 0.1);
      highOsc.frequency.linearRampToValueAtTime(880, now + 0.3);
      highOsc.frequency.exponentialRampToValueAtTime(330, now + 0.7);

      highGain.gain.setValueAtTime(0.01, now);
      highGain.gain.setValueAtTime(0.25, now + 0.1);
      highGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      highOsc.connect(highGain);
      highGain.connect(this.ctx.destination);
      highOsc.start(now + 0.1);
      highOsc.stop(now + 0.8);
    } catch {
      // Audio fallback
    }
  }

  // Crash / Collision SFX
  public playCrash() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Audio fallback
    }
  }

  // Rock Hit SFX
  public playRockHit() {
    this.playCrash();
  }

  // Chest hit chime: ascending celebratory tone on each click (1..5)
  public playChestHit(hit: number = 1) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Ascending chord frequencies
      const freqs = [440, 554.37, 659.25, 880, 1108.73];
      const freq = freqs[Math.min(hit - 1, freqs.length - 1)];

      osc.type = hit >= 5 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.2);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (hit >= 5 ? 0.6 : 0.25));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + (hit >= 5 ? 0.65 : 0.3));

      // Extra sparkle on 5th hit
      if (hit >= 5) {
        this.playPowerup();
      }
    } catch {
      // Audio fallback
    }
  }

  // Shield Break SFX
  public playShieldBreak() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.25);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio fallback
    }
  }

  // Ambient Dark Arcade Synth Beat
  public startMusic(speedFactor: number = 1.0) {
    if (this.isMuted || this.isMusicPlaying) return;
    this.initCtx();
    this.isMusicPlaying = true;
    this.musicStep = 0;

    // Tempo: ~130 BPM adjusted by speedFactor
    const bpm = Math.min(180, 130 * speedFactor);
    const intervalMs = (60 / bpm / 2) * 1000; // 8th notes

    const bassLine = [73.42, 73.42, 87.31, 73.42, 98.00, 87.31, 73.42, 65.41]; // D minor groove

    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const note = bassLine[this.musicStep % bassLine.length];
        const volumeFactor = Math.max(0, this.bgmVolume);

        // Bass synth
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(note, now);
        bassGain.gain.setValueAtTime(0.12 * volumeFactor, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.2);

        // Hi-hat tick every other step
        if (this.musicStep % 2 === 1) {
          const hatOsc = this.ctx.createOscillator();
          const hatGain = this.ctx.createGain();
          hatOsc.type = 'triangle';
          hatOsc.frequency.setValueAtTime(6000, now);
          hatGain.gain.setValueAtTime(0.03 * volumeFactor, now);
          hatGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
          hatOsc.connect(hatGain);
          hatGain.connect(this.ctx.destination);
          hatOsc.start(now);
          hatOsc.stop(now + 0.05);
        }

        this.musicStep++;
      } catch {
        // Fallback
      }
    }, intervalMs);
  }

  // Horror Glitch Screech & Static
  public playGlitchStatic() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Harsh noise burst
      const bufferSize = this.ctx.sampleRate * 0.45;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);

      // Pitch-shifting screech tone
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.4);

      oscGain.gain.setValueAtTime(0.3, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // Audio fallback
    }
  }

  // Horror Drone / Atmosphere
  public playHorrorDrone() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.linearRampToValueAtTime(45, now + 3.0);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 3.5);
    } catch {
      // Audio fallback
    }
  }

  // Test SFX chime for settings slider
  public playTestSFX() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.25 * Math.max(0, this.sfxVolume), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Audio fallback
    }
  }

  // Retro character dialogue pitch blip sound
  public playDialogueBlip(freq: number = 600) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.035);

      gain.gain.setValueAtTime(0.06 * Math.max(0, this.sfxVolume), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // Audio fallback
    }
  }

  // Celebratory victory fanfare sound
  public playVictoryFanfare() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.2 * Math.max(0, this.sfxVolume), now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.38);
      });
    } catch {
      // Audio fallback
    }
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const soundManager = new SoundManager();
