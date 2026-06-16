// 传奇世界 - Sound Manager
// Programmatic sound effects and BGM using Web Audio API (no external audio files needed)

type SoundName =
  | 'attack'
  | 'hit'
  | 'crit'
  | 'death'
  | 'levelup'
  | 'pickup'
  | 'coin'
  | 'heal'
  | 'fireball'
  | 'lightning'
  | 'poison'
  | 'click'
  | 'error'
  | 'achievement';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;
  private initialized: boolean = false;

  // BGM state
  private bgmGain: GainNode | null = null;
  private bgmPlaying: boolean = false;
  private currentBgm: string = '';
  private bgmInterval: ReturnType<typeof setInterval> | null = null;
  private bgmVolume: number = 0.15;

  /** Initialize audio context - MUST be called from a user gesture (click/tap) */
  init() {
    if (this.initialized) return;
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.initialized = true;
    } catch {
      console.warn('Web Audio API not supported');
    }
  }

  /** Ensure context is running (resumes suspended context) */
  private ensureContext(): AudioContext | null {
    if (!this.audioContext) return null;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /** Play a named sound effect */
  play(soundName: SoundName) {
    if (!this.enabled || !this.initialized) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      switch (soundName) {
        case 'attack':
          this.playAttack(ctx);
          break;
        case 'hit':
          this.playHit(ctx);
          break;
        case 'crit':
          this.playCrit(ctx);
          break;
        case 'death':
          this.playDeath(ctx);
          break;
        case 'levelup':
          this.playLevelUp(ctx);
          break;
        case 'pickup':
          this.playPickup(ctx);
          break;
        case 'coin':
          this.playCoin(ctx);
          break;
        case 'heal':
          this.playHeal(ctx);
          break;
        case 'fireball':
          this.playFireball(ctx);
          break;
        case 'lightning':
          this.playLightning(ctx);
          break;
        case 'poison':
          this.playPoison(ctx);
          break;
        case 'click':
          this.playClick(ctx);
          break;
        case 'error':
          this.playError(ctx);
          break;
        case 'achievement':
          this.playAchievement(ctx);
          break;
      }
    } catch {
      // Silently fail - sound is non-critical
    }
  }

  /** Toggle sound on/off */
  toggle(): boolean {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopBGM();
    }
    return this.enabled;
  }

  /** Set volume (0-1) */
  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
  }

  /** Get current volume */
  getVolume(): number {
    return this.volume;
  }

  /** Is sound enabled? */
  isEnabled(): boolean {
    return this.enabled;
  }

  /** Is sound initialized? */
  isInitialized(): boolean {
    return this.initialized;
  }

  // ---- BGM System ----

  /** Play background music based on map ID */
  playBGM(mapId: string) {
    if (!this.initialized || !this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    // If same BGM is already playing, do nothing
    if (this.bgmPlaying && this.currentBgm === mapId) return;

    // Stop current BGM with crossfade
    if (this.bgmPlaying) {
      this.crossfadeBGM(mapId);
      return;
    }

    this.currentBgm = mapId;
    this.bgmPlaying = true;

    // Create master gain node for BGM
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0, ctx.currentTime);
    this.bgmGain.gain.linearRampToValueAtTime(this.bgmVolume, ctx.currentTime + 1.0);
    this.bgmGain.connect(ctx.destination);

    // Start the BGM loop
    this.startBgmLoop(ctx, mapId);
  }

  /** Start the BGM note loop */
  private startBgmLoop(ctx: AudioContext, mapId: string) {
    // Play first set of notes immediately
    this.playBgmNotes(ctx, mapId);

    // Set up interval to play notes every ~4 seconds
    this.bgmInterval = setInterval(() => {
      if (!this.bgmPlaying || !this.bgmGain) {
        this.stopBGM();
        return;
      }
      this.playBgmNotes(ctx, mapId);
    }, 4000);
  }

  /** Play a set of BGM notes based on map */
  private playBgmNotes(ctx: AudioContext, mapId: string) {
    if (!this.bgmGain) return;

    switch (mapId) {
      case 'village':
      case 'yinxingValley':
        this.playVillageBGM(ctx);
        break;
      case 'forest':
      case 'biqiForest':
        this.playForestBGM(ctx);
        break;
      case 'desert':
      case 'mengzhongWild':
        this.playDesertBGM(ctx);
        break;
      case 'dungeon':
      case 'mineCorpseKing':
        this.playDungeonBGM(ctx);
        break;
      case 'pigcave':
      case 'pigCave':
      case 'womaTemple':
        this.playPigcaveBGM(ctx);
        break;
      case 'zuma':
      case 'zumaTemple':
        this.playZumaBGM(ctx);
        break;
      case 'viperValley':
        this.playForestBGM(ctx); // Reuse forest BGM for valley
        break;
      case 'cangyueCoast':
        this.playDesertBGM(ctx); // Reuse desert BGM for coast
        break;
      default:
        this.playVillageBGM(ctx);
        break;
    }
  }

  /** Village BGM: Calm pentatonic melody (C D E G A), gentle sine waves */
  private playVillageBGM(ctx: AudioContext) {
    if (!this.bgmGain) return;
    const now = ctx.currentTime;
    const vol = 1; // bgmGain already controls volume

    // Pentatonic scale: C4, D4, E4, G4, A4, C5, D5, E5
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

    // Generate a gentle melody pattern
    const melody = [0, 2, 4, 5, 4, 2, 3, 1]; // indices into scale
    const noteLength = 0.45;
    const gap = 0.05;

    melody.forEach((noteIdx, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = scale[noteIdx];

      const noteGain = ctx.createGain();
      const startTime = now + i * (noteLength + gap);
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(vol * 0.3, startTime + 0.05);
      noteGain.gain.setValueAtTime(vol * 0.3, startTime + noteLength * 0.6);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteLength);

      osc.connect(noteGain).connect(this.bgmGain!);
      osc.start(startTime);
      osc.stop(startTime + noteLength);
    });

    // Add a gentle bass drone
    const bassOsc = ctx.createOscillator();
    bassOsc.type = 'sine';
    bassOsc.frequency.value = 130.81; // C3

    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(vol * 0.1, now);
    bassGain.gain.setValueAtTime(vol * 0.1, now + 3.5);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

    bassOsc.connect(bassGain).connect(this.bgmGain!);
    bassOsc.start(now);
    bassOsc.stop(now + 4.0);
  }

  /** Forest BGM: Nature ambient with mysterious bird calls */
  private playForestBGM(ctx: AudioContext) {
    if (!this.bgmGain) return;
    const now = ctx.currentTime;
    const vol = 1;

    // Mysterious minor scale: D4, F4, G4, A4, C5, D5
    const scale = [293.66, 349.23, 392.00, 440.00, 523.25, 587.33];

    // Slow, contemplative melody
    const melody = [0, 2, 3, 5, 4, 3, 1, 2];
    const noteLength = 0.4;
    const gap = 0.1;

    melody.forEach((noteIdx, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = scale[noteIdx];

      // Slight vibrato
      const vibrato = ctx.createOscillator();
      vibrato.type = 'sine';
      vibrato.frequency.value = 5;
      const vibratoGain = ctx.createGain();
      vibratoGain.gain.value = 3;
      vibrato.connect(vibratoGain).connect(osc.frequency);

      const noteGain = ctx.createGain();
      const startTime = now + i * (noteLength + gap);
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(vol * 0.25, startTime + 0.06);
      noteGain.gain.setValueAtTime(vol * 0.25, startTime + noteLength * 0.5);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteLength);

      osc.connect(noteGain).connect(this.bgmGain!);
      vibrato.start(startTime);
      vibrato.stop(startTime + noteLength);
      osc.start(startTime);
      osc.stop(startTime + noteLength);
    });

    // Bird call effect
    for (let i = 0; i < 2; i++) {
      const birdOsc = ctx.createOscillator();
      birdOsc.type = 'sine';
      const birdStart = now + 1.5 + i * 1.8;
      birdOsc.frequency.setValueAtTime(1200 + Math.random() * 400, birdStart);
      birdOsc.frequency.exponentialRampToValueAtTime(800 + Math.random() * 200, birdStart + 0.15);
      birdOsc.frequency.exponentialRampToValueAtTime(1400 + Math.random() * 300, birdStart + 0.3);

      const birdGain = ctx.createGain();
      birdGain.gain.setValueAtTime(0, birdStart);
      birdGain.gain.linearRampToValueAtTime(vol * 0.08, birdStart + 0.02);
      birdGain.gain.exponentialRampToValueAtTime(0.001, birdStart + 0.35);

      birdOsc.connect(birdGain).connect(this.bgmGain!);
      birdOsc.start(birdStart);
      birdOsc.stop(birdStart + 0.35);
    }

    // Low drone
    const drone = ctx.createOscillator();
    drone.type = 'triangle';
    drone.frequency.value = 110;
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(vol * 0.06, now);
    droneGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);
    drone.connect(droneGain).connect(this.bgmGain!);
    drone.start(now);
    drone.stop(now + 4.0);
  }

  /** Desert BGM: Middle-eastern scale, slow droning bass */
  private playDesertBGM(ctx: AudioContext) {
    if (!this.bgmGain) return;
    const now = ctx.currentTime;
    const vol = 1;

    // Middle-eastern scale (Phrygian dominant): E4, F4, G#4, A4, B4, C5, D5, E5
    const scale = [329.63, 349.23, 415.30, 440.00, 493.88, 523.25, 587.33, 659.25];

    const melody = [0, 2, 3, 5, 4, 2, 1, 0];
    const noteLength = 0.4;
    const gap = 0.1;

    melody.forEach((noteIdx, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = scale[noteIdx];

      const noteGain = ctx.createGain();
      const startTime = now + i * (noteLength + gap);
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(vol * 0.2, startTime + 0.04);
      noteGain.gain.setValueAtTime(vol * 0.2, startTime + noteLength * 0.5);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteLength);

      osc.connect(noteGain).connect(this.bgmGain!);
      osc.start(startTime);
      osc.stop(startTime + noteLength);
    });

    // Slow droning bass - E2
    const bassDrone = ctx.createOscillator();
    bassDrone.type = 'sawtooth';
    bassDrone.frequency.value = 82.41;

    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 200;

    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(vol * 0.08, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

    bassDrone.connect(bassFilter).connect(bassGain).connect(this.bgmGain!);
    bassDrone.start(now);
    bassDrone.stop(now + 4.0);

    // Occasional high shimmer
    const shimmer = ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(1318.51, now + 2.0);
    shimmer.frequency.exponentialRampToValueAtTime(880, now + 2.5);

    const shimmerGain = ctx.createGain();
    shimmerGain.gain.setValueAtTime(0, now + 2.0);
    shimmerGain.gain.linearRampToValueAtTime(vol * 0.06, now + 2.1);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);

    shimmer.connect(shimmerGain).connect(this.bgmGain!);
    shimmer.start(now + 2.0);
    shimmer.stop(now + 2.6);
  }

  /** Dungeon BGM: Dark minor key, low drones, eerie atmosphere */
  private playDungeonBGM(ctx: AudioContext) {
    if (!this.bgmGain) return;
    const now = ctx.currentTime;
    const vol = 1;

    // Dark minor: C3, Eb3, F3, G3, Bb3, C4
    const scale = [130.81, 155.56, 174.61, 196.00, 233.08, 261.63];

    const melody = [0, 2, 4, 3, 1, 3, 2, 0];
    const noteLength = 0.45;
    const gap = 0.05;

    melody.forEach((noteIdx, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = scale[noteIdx];

      const noteGain = ctx.createGain();
      const startTime = now + i * (noteLength + gap);
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(vol * 0.2, startTime + 0.05);
      noteGain.gain.setValueAtTime(vol * 0.2, startTime + noteLength * 0.4);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteLength);

      // Add reverb-like filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      filter.Q.value = 2;

      osc.connect(filter).connect(noteGain).connect(this.bgmGain!);
      osc.start(startTime);
      osc.stop(startTime + noteLength);
    });

    // Low rumbling drone
    const drone1 = ctx.createOscillator();
    drone1.type = 'sawtooth';
    drone1.frequency.value = 55; // A1

    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 120;

    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(vol * 0.06, now);
    droneGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

    drone1.connect(droneFilter).connect(droneGain).connect(this.bgmGain!);
    drone1.start(now);
    drone1.stop(now + 4.0);

    // Eerie high tone
    const eerie = ctx.createOscillator();
    eerie.type = 'sine';
    eerie.frequency.setValueAtTime(880, now + 2.5);
    eerie.frequency.exponentialRampToValueAtTime(660, now + 3.5);

    const eerieGain = ctx.createGain();
    eerieGain.gain.setValueAtTime(0, now + 2.5);
    eerieGain.gain.linearRampToValueAtTime(vol * 0.04, now + 2.7);
    eerieGain.gain.exponentialRampToValueAtTime(0.001, now + 3.6);

    eerie.connect(eerieGain).connect(this.bgmGain!);
    eerie.start(now + 2.5);
    eerie.stop(now + 3.6);
  }

  /** Pig Cave BGM: Ominous, deep rumbles with occasional squeals */
  private playPigcaveBGM(ctx: AudioContext) {
    if (!this.bgmGain) return;
    const now = ctx.currentTime;
    const vol = 1;

    // Ominous minor scale: C3, D3, Eb3, G3, Ab3, Bb3
    const scale = [130.81, 146.83, 155.56, 196.00, 207.65, 233.08];

    const melody = [0, 3, 4, 2, 5, 3, 1, 0];
    const noteLength = 0.4;
    const gap = 0.1;

    melody.forEach((noteIdx, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = scale[noteIdx];

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;

      const noteGain = ctx.createGain();
      const startTime = now + i * (noteLength + gap);
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(vol * 0.15, startTime + 0.04);
      noteGain.gain.setValueAtTime(vol * 0.15, startTime + noteLength * 0.5);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteLength);

      osc.connect(filter).connect(noteGain).connect(this.bgmGain!);
      osc.start(startTime);
      osc.stop(startTime + noteLength);
    });

    // Deep rumble
    const rumble = ctx.createOscillator();
    rumble.type = 'sawtooth';
    rumble.frequency.value = 40;

    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 80;

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(vol * 0.1, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

    rumble.connect(rumbleFilter).connect(rumbleGain).connect(this.bgmGain!);
    rumble.start(now);
    rumble.stop(now + 4.0);

    // Occasional squeal
    const squeal = ctx.createOscillator();
    squeal.type = 'sawtooth';
    squeal.frequency.setValueAtTime(300, now + 3.0);
    squeal.frequency.exponentialRampToValueAtTime(800, now + 3.15);
    squeal.frequency.exponentialRampToValueAtTime(200, now + 3.4);

    const squealFilter = ctx.createBiquadFilter();
    squealFilter.type = 'bandpass';
    squealFilter.frequency.value = 600;
    squealFilter.Q.value = 5;

    const squealGain = ctx.createGain();
    squealGain.gain.setValueAtTime(0, now + 3.0);
    squealGain.gain.linearRampToValueAtTime(vol * 0.08, now + 3.1);
    squealGain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    squeal.connect(squealFilter).connect(squealGain).connect(this.bgmGain!);
    squeal.start(now + 3.0);
    squeal.stop(now + 3.5);
  }

  /** Zuma Temple BGM: Epic boss music, powerful, intense */
  private playZumaBGM(ctx: AudioContext) {
    if (!this.bgmGain) return;
    const now = ctx.currentTime;
    const vol = 1;

    // Intense minor scale: E3, G3, A3, B3, D4, E4, G4
    const scale = [164.81, 196.00, 220.00, 246.94, 293.66, 329.63, 392.00];

    // Faster, more intense melody
    const melody = [0, 4, 3, 6, 5, 4, 2, 3, 5, 6, 4, 1];
    const noteLength = 0.28;
    const gap = 0.04;

    melody.forEach((noteIdx, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = scale[noteIdx];

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1500;

      const noteGain = ctx.createGain();
      const startTime = now + i * (noteLength + gap);
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(vol * 0.18, startTime + 0.02);
      noteGain.gain.setValueAtTime(vol * 0.18, startTime + noteLength * 0.5);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + noteLength);

      osc.connect(filter).connect(noteGain).connect(this.bgmGain!);
      osc.start(startTime);
      osc.stop(startTime + noteLength);
    });

    // Powerful bass hits (drums)
    for (let i = 0; i < 4; i++) {
      const drumOsc = ctx.createOscillator();
      drumOsc.type = 'sine';
      const drumTime = now + i * 1.0;
      drumOsc.frequency.setValueAtTime(150, drumTime);
      drumOsc.frequency.exponentialRampToValueAtTime(30, drumTime + 0.2);

      const drumGain = ctx.createGain();
      drumGain.gain.setValueAtTime(vol * 0.2, drumTime);
      drumGain.gain.exponentialRampToValueAtTime(0.001, drumTime + 0.3);

      drumOsc.connect(drumGain).connect(this.bgmGain!);
      drumOsc.start(drumTime);
      drumOsc.stop(drumTime + 0.3);
    }

    // Intense bass drone
    const bassDrone = ctx.createOscillator();
    bassDrone.type = 'sawtooth';
    bassDrone.frequency.value = 82.41; // E2

    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 150;

    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(vol * 0.1, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

    bassDrone.connect(bassFilter).connect(bassGain).connect(this.bgmGain!);
    bassDrone.start(now);
    bassDrone.stop(now + 4.0);
  }

  /** Crossfade from current BGM to new BGM */
  private crossfadeBGM(newMapId: string) {
    const ctx = this.audioContext;
    if (!ctx || !this.bgmGain) return;

    const oldGain = this.bgmGain;

    // Fade out old BGM over 1 second
    oldGain.gain.setValueAtTime(this.bgmVolume, ctx.currentTime);
    oldGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);

    // Disconnect old gain after fade
    setTimeout(() => {
      try { oldGain.disconnect(); } catch { /* already disconnected */ }
    }, 1200);

    // Stop old interval
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }

    // Set up new BGM
    this.currentBgm = newMapId;
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0, ctx.currentTime);
    this.bgmGain.gain.linearRampToValueAtTime(this.bgmVolume, ctx.currentTime + 1.0);
    this.bgmGain.connect(ctx.destination);

    // Start new BGM loop
    this.startBgmLoop(ctx, newMapId);
  }

  /** Stop BGM */
  stopBGM() {
    const ctx = this.audioContext;

    if (this.bgmGain && ctx) {
      // Fade out over 1 second
      try {
        this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, ctx.currentTime);
        this.bgmGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
      } catch { /* gain may already be disconnected */ }

      const oldGain = this.bgmGain;
      setTimeout(() => {
        try { oldGain.disconnect(); } catch { /* already disconnected */ }
      }, 1200);
    }

    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }

    this.bgmPlaying = false;
    this.currentBgm = '';
    this.bgmGain = null;
  }

  /** Is BGM currently playing? */
  isBGMPlaying(): boolean {
    return this.bgmPlaying;
  }

  /** Set BGM volume separately (0-1) */
  setBGMVolume(v: number) {
    this.bgmVolume = Math.max(0, Math.min(1, v));
    if (this.bgmGain && this.audioContext) {
      try {
        this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, this.audioContext.currentTime);
        this.bgmGain.gain.linearRampToValueAtTime(this.bgmVolume, this.audioContext.currentTime + 0.1);
      } catch { /* gain may be disconnected */ }
    }
  }

  // ---- Sound Generators ----

  /** attack: short noise burst */
  private playAttack(ctx: AudioContext) {
    const now = ctx.currentTime;

    // White noise burst
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(now);
    source.stop(now + 0.08);
  }

  /** hit: low thud */
  private playHit(ctx: AudioContext) {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /** crit: sharp high-pitched sound */
  private playCrit(ctx: AudioContext) {
    const now = ctx.currentTime;

    // Sharp high ping
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    // Add a noise burst for impact
    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.volume * 0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain).connect(ctx.destination);
    noiseSource.connect(noiseGain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
    noiseSource.start(now);
    noiseSource.stop(now + 0.06);
  }

  /** death: descending tone */
  private playDeath(ctx: AudioContext) {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  /** levelup: ascending major chord */
  private playLevelUp(ctx: AudioContext) {
    const now = ctx.currentTime;
    const vol = this.volume * 0.3;

    // C major chord ascending: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const startTime = now + i * 0.1;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain).connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  /** pickup: short high ding */
  private playPickup(ctx: AudioContext) {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.08);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /** coin: metallic clink */
  private playCoin(ctx: AudioContext) {
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 2500;

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 3500;

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(this.volume * 0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(this.volume * 0.2, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc1.connect(gain1).connect(ctx.destination);
    osc2.connect(gain2).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);
    osc2.start(now + 0.02);
    osc2.stop(now + 0.1);
  }

  /** heal: soft ascending tone */
  private playHeal(ctx: AudioContext) {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.3);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.25, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.15, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  /** fireball: whoosh noise */
  private playFireball(ctx: AudioContext) {
    const now = ctx.currentTime;

    // Noise whoosh
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
    filter.Q.value = 2;

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(now);
    source.stop(now + 0.3);
  }

  /** lightning: crackle */
  private playLightning(ctx: AudioContext) {
    const now = ctx.currentTime;

    // Sharp crack
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    // Noise crackle
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (i < bufferSize * 0.3 ? 1 : 0.3);
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.volume * 0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    const highOsc = ctx.createOscillator();
    highOsc.type = 'sine';
    highOsc.frequency.value = 3000;
    const highGain = ctx.createGain();
    highGain.gain.setValueAtTime(this.volume * 0.15, now);
    highGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain).connect(ctx.destination);
    noiseSource.connect(noiseGain).connect(ctx.destination);
    highOsc.connect(highGain).connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
    noiseSource.start(now);
    noiseSource.stop(now + 0.12);
    highOsc.start(now);
    highOsc.stop(now + 0.08);
  }

  /** poison: bubbly sound */
  private playPoison(ctx: AudioContext) {
    const now = ctx.currentTime;
    const vol = this.volume * 0.2;

    // Series of short bubbles
    for (let i = 0; i < 5; i++) {
      const t = now + i * 0.06;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200 + Math.random() * 400, t);
      osc.frequency.exponentialRampToValueAtTime(100 + Math.random() * 200, t + 0.08);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    }
  }

  /** click: UI click */
  private playClick(ctx: AudioContext) {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  /** error: low buzz */
  private playError(ctx: AudioContext) {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 120;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.2, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.15, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /** Achievement unlock "ding" sound - a bright, celebratory chime */
  private playAchievement(ctx: AudioContext) {
    const now = ctx.currentTime;

    // First chime (higher pitch)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.setValueAtTime(1320, now + 0.1);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(this.volume * 0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second chime (harmony)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(660, now + 0.08);
    osc2.frequency.setValueAtTime(990, now + 0.18);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(this.volume * 0.25, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.6);

    // Sparkle (high frequency shimmer)
    const osc3 = ctx.createOscillator();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1760, now + 0.15);
    osc3.frequency.exponentialRampToValueAtTime(2640, now + 0.35);

    const gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.setValueAtTime(this.volume * 0.15, now + 0.15);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc3.connect(gain3).connect(ctx.destination);
    osc3.start(now + 0.15);
    osc3.stop(now + 0.5);
  }
}

// Singleton instance
export const soundManager = new SoundManager();
export type { SoundName };
