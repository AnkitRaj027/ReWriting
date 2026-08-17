// Web Audio API Synthesizer for ReWriting HUD SFX
class HudAudioService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private volume: number = 0.5; // Master volume coefficient (0.0 to 1.0)
  private activeNoiseNode: AudioScheduledSourceNode | null = null;
  private activeNoiseGain: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('nexus_hud_muted');
      this.muted = storedMute === 'true';
      const storedVol = localStorage.getItem('nexus_hud_volume');
      if (storedVol) {
        this.volume = parseFloat(storedVol);
      }
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMute(muted: boolean) {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_hud_muted', muted ? 'true' : 'false');
    }
    if (muted) {
      this.stopNoise();
    }
  }

  public isMuted() {
    return this.muted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_hud_volume', this.volume.toString());
    }
    // Update active noise gain dynamically if playing
    if (this.activeNoiseGain && this.ctx) {
      this.activeNoiseGain.gain.setValueAtTime(this.volume * 0.1, this.ctx.currentTime);
    }
  }

  public getVolume() {
    return this.volume;
  }

  public playClick() {
    if (this.muted || this.volume <= 0.01) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08 * this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Failed to play HUD click sound:", e);
    }
  }

  public playHover() {
    if (this.muted || this.volume <= 0.01) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime);

      gain.gain.setValueAtTime(0.03 * this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      // Ignore overlay warnings
    }
  }

  public playTick() {
    if (this.muted || this.volume <= 0.01) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);

      gain.gain.setValueAtTime(0.015 * this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.02);
    } catch (e) {
      // Ignore errors during fast clicks
    }
  }

  public playSuccess() {
    if (this.muted || this.volume <= 0.01) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.06 * this.volume, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.15);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.16);
      });
    } catch (e) {
      console.warn("Failed to play Success SFX:", e);
    }
  }

  public playAlert() {
    if (this.muted || this.volume <= 0.01) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.15);
      osc.frequency.linearRampToValueAtTime(220, now + 0.3);

      gain.gain.setValueAtTime(0.04 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn("Failed to play Alert SFX:", e);
    }
  }

  public playLevelUp() {
    if (this.muted || this.volume <= 0.01) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const root = 130.81; // C3
      const chord = [root, root * 1.5, root * 2.0, root * 2.5, root * 3.0];
      
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 2, now + 0.8);

        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.05 * this.volume, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

        osc.start(now);
        osc.stop(now + 0.9);
      });

      // Chime ringing
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime.type = 'sine';
      chime.frequency.setValueAtTime(1046.50, now + 0.4);
      chime.frequency.exponentialRampToValueAtTime(2093.00, now + 1.0);

      chimeGain.gain.setValueAtTime(0, now + 0.4);
      chimeGain.gain.linearRampToValueAtTime(0.08 * this.volume, now + 0.45);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      chime.start(now + 0.4);
      chime.stop(now + 1.25);
    } catch (e) {
      console.warn("Failed to play Level Up SFX:", e);
    }
  }

  // Synthesize Cyber Ambient Noise
  public startNoise(type: 'rain' | 'synthwave' | 'white' | 'binaural') {
    if (this.muted || this.volume <= 0.01) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    this.stopNoise();

    try {
      this.activeNoiseGain = ctx.createGain();
      this.activeNoiseGain.connect(ctx.destination);

      if (type === 'white' || type === 'rain') {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const bufferSource = ctx.createBufferSource();
        bufferSource.buffer = buffer;
        bufferSource.loop = true;

        if (type === 'rain') {
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 1000;
          filter.Q.value = 0.5;

          const hpFilter = ctx.createBiquadFilter();
          hpFilter.type = 'highpass';
          hpFilter.frequency.value = 300;

          bufferSource.connect(hpFilter);
          hpFilter.connect(filter);
          filter.connect(this.activeNoiseGain);

          this.activeNoiseGain.gain.setValueAtTime(0.12 * this.volume, ctx.currentTime);
        } else {
          bufferSource.connect(this.activeNoiseGain);
          this.activeNoiseGain.gain.setValueAtTime(0.04 * this.volume, ctx.currentTime);
        }

        bufferSource.start(0);
        this.activeNoiseNode = bufferSource;
      } else if (type === 'binaural') {
        const oscL = ctx.createOscillator();
        const oscR = ctx.createOscillator();
        const panL = ctx.createStereoPanner();
        const panR = ctx.createStereoPanner();

        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(140, ctx.currentTime); // 140Hz left

        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(146, ctx.currentTime); // 146Hz right (6Hz binaural delta/theta wave)

        panL.pan.setValueAtTime(-1, ctx.currentTime);
        panR.pan.setValueAtTime(1, ctx.currentTime);

        oscL.connect(panL).connect(this.activeNoiseGain);
        oscR.connect(panR).connect(this.activeNoiseGain);

        this.activeNoiseGain.gain.setValueAtTime(0.15 * this.volume, ctx.currentTime);

        oscL.start(0);
        oscR.start(0);

        this.activeNoiseNode = oscL;
        const oldStop = this.stopNoise.bind(this);
        this.stopNoise = () => {
          try { oscL.stop(); } catch (e) {}
          try { oscR.stop(); } catch (e) {}
          oldStop();
        };
      } else if (type === 'synthwave') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();

        filter.type = 'lowpass';
        filter.frequency.value = 250;
        filter.Q.value = 2;

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(55, ctx.currentTime);

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(55.3, ctx.currentTime);

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
        lfoGain.gain.setValueAtTime(80, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(this.activeNoiseGain);

        this.activeNoiseGain.gain.setValueAtTime(0.08 * this.volume, ctx.currentTime);

        osc1.start(0);
        osc2.start(0);
        lfo.start(0);

        this.activeNoiseNode = osc1;
        const oldStop = this.stopNoise.bind(this);
        this.stopNoise = () => {
          try {
            osc1.stop();
          } catch (e) {}
          try {
            osc2.stop();
          } catch (e) {}
          try {
            lfo.stop();
          } catch (e) {}
          oldStop();
        };
      }
    } catch (e) {
      console.warn("Failed to generate HUD ambient noise:", e);
    }
  }

  public stopNoise() {
    try {
      if (this.activeNoiseNode) {
        this.activeNoiseNode.stop();
        this.activeNoiseNode.disconnect();
        this.activeNoiseNode = null;
      }
      if (this.activeNoiseGain) {
        this.activeNoiseGain.disconnect();
        this.activeNoiseGain = null;
      }
    } catch (e) {
      // Ignore
    }
  }
}

export const HudAudio = new HudAudioService();
