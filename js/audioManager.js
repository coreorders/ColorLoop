/**
 * AudioManager 클래스
 * Web Audio API를 사용하여 효과음과 배경 음악을 실시간으로 합성합니다.
 */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.bgmInterval = null;
        this.bgmSequence = 0;

        // C Major Pentatonic Scale (C4, D4, E4, G4, A4)
        this.notes = [261.63, 293.66, 329.63, 392.00, 440.00];
        this.bgmMelody = [0, 2, 3, 4, 3, 2, 0, 1]; // Melody indices
    }

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.4; // 볼륨 상향 (0.2 -> 0.4)
        } catch (e) {
            console.error("AudioContext initialization failed:", e);
        }
    }

    async resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    // --- 효과음 (SFX) ---

    playMove() {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playPaint() {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.05); // A6

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playBreak() {
        if (!this.ctx || this.isMuted) return;
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
        noise.stop(this.ctx.currentTime + 0.1);
    }

    playTeleport() {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playClear() {
        if (!this.ctx || this.isMuted) return;
        const time = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time + i * 0.1);
            gain.gain.setValueAtTime(0.2, time + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.1 + 0.3);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(time + i * 0.1);
            osc.stop(time + i * 0.1 + 0.3);
        });
    }

    // --- 배경 음악 (BGM) ---

    startBGM() {
        if (this.bgmInterval) return;
        this.init();
        this.resume().then(() => {
            if (this.bgmInterval) return;
            this.bgmInterval = setInterval(() => {
                if (this.isMuted) return;
                this.playBGMNote();
            }, 250); // 약간 느리게 조정 (BPM 120 -> 120 수준 유지)
        });
    }

    playBGMNote() {
        if (!this.ctx || this.ctx.state !== 'running') return;

        const noteIdx = this.bgmMelody[this.bgmSequence % this.bgmMelody.length];
        const freq = this.notes[noteIdx];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Sine과 Triangle을 섞어 더 부드럽고 뚜렷하게
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime); // 볼륨 상향 (0.05 -> 0.12)
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);

        this.bgmSequence++;
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
}

// 전역 인스턴스 생성
window.audioManager = new AudioManager();
