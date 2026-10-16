// Sistema de Efectos de Sonido Web Audio API para VasoChain AI
// 100% offline, cero dependencias, ideal para demostraciones en vivo y ferias de ciencias.

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = typeof window !== 'undefined'
      ? localStorage.getItem('vasochain_sound_enabled') !== 'false'
      : true;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('vasochain_sound_enabled', this.enabled ? 'true' : 'false');
    }
    if (this.enabled) {
      this.playClick();
    }
    return this.enabled;
  }

  isSoundEnabled() {
    return this.enabled;
  }

  // Beep de escáner QR (1400Hz rápido y limpio)
  playScan() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch (e) {
      // Ignorar si el navegador bloquea audio antes de interacción
    }
  }

  // Acorde futurista de confirmación Blockchain (E5 -> G#5 -> B5 -> E6)
  playSuccess() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const notas = [659.25, 830.61, 987.77, 1318.51]; // Acorde Mi Mayor brillante
      const ahora = this.ctx.currentTime;

      notas.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ahora + idx * 0.06);

        gain.gain.setValueAtTime(0, ahora + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.12, ahora + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ahora + idx * 0.06 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(ahora + idx * 0.06);
        osc.stop(ahora + idx * 0.06 + 0.65);
      });
    } catch (e) {
      // Silencioso
    }
  }

  // Tono de advertencia / observación en validación
  playWarning() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const ahora = this.ctx.currentTime;
      [340, 280].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ahora + idx * 0.12);

        gain.gain.setValueAtTime(0.08, ahora + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ahora + idx * 0.12 + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(ahora + idx * 0.12);
        osc.stop(ahora + idx * 0.12 + 0.16);
      });
    } catch (e) {
      // Silencioso
    }
  }

  // Clic suave para botones e interruptores
  playClick() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
    } catch (e) {
      // Silencioso
    }
  }
}

export const sound = new SoundManager();
