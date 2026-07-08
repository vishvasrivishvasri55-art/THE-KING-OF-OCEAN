class SoundSynthManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.musicPlaying = false;
        this.musicInterval = null;
        this.ambientWavesNode = null;
        this.ambientWavesGain = null;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.ctx = new AudioContext();
        
        // Start ambient waves
        this.startAmbientWaves();
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.ctx) {
            if (this.muted) {
                this.ctx.suspend();
            } else {
                this.ctx.resume();
            }
        }
        return this.muted;
    }

    startAmbientWaves() {
        if (!this.ctx || this.muted) return;

        // Generate white noise for waves
        const bufferSize = this.ctx.sampleRate * 4; // 4 seconds buffer
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        // Filter for wave sound (low pass)
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 350;

        this.ambientWavesGain = this.ctx.createGain();
        this.ambientWavesGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

        noise.connect(filter);
        filter.connect(this.ambientWavesGain);
        this.ambientWavesGain.connect(this.ctx.destination);

        noise.start(0);
        this.ambientWavesNode = noise;

        // Automate volume to simulate tide waves (rising/falling volume every 5s)
        this.modulateWaves();
    }

    modulateWaves() {
        if (!this.ctx || !this.ambientWavesGain) return;
        const now = this.ctx.currentTime;
        const cycle = 6; // seconds per wave cycle
        
        // Schedule continuous wave modulation
        this.ambientWavesGain.gain.cancelScheduledValues(now);
        this.ambientWavesGain.gain.setValueAtTime(0.04, now);
        
        for (let i = 0; i < 100; i++) {
            const t = now + i * cycle;
            this.ambientWavesGain.gain.linearRampToValueAtTime(0.12, t + cycle / 2);
            this.ambientWavesGain.gain.linearRampToValueAtTime(0.04, t + cycle);
        }
    }

    playCast() {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playSplash() {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        
        // Splash sound using white noise
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.4);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        source.start(now);
        source.stop(now + 0.4);
    }

    playBite() {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        
        // Double alarm chime
        const playBeep = (time, freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(0.25, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time);
            osc.stop(time + 0.15);
        };

        playBeep(now, 880);
        playBeep(now + 0.15, 880);
        playBeep(now + 0.3, 1200);
    }

    playReel() {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        // Fast click sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.05);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    playSnap() {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        
        // Snap/Crack sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    playVictory() {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        
        // Arpeggio of notes: C4 -> E4 -> G4 -> C5
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, idx) => {
            const time = now + idx * 0.12;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);
            
            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(time);
            osc.stop(time + 0.4);
        });
    }

    playMusic() {
        if (!this.ctx || this.muted || this.musicPlaying) return;
        this.musicPlaying = true;
        
        // A simple synthesizer backing loop
        const chords = [
            [130.81, 164.81, 196.00], // C chord
            [146.83, 174.61, 220.00], // D minor chord
            [164.81, 196.00, 246.94], // E minor chord
            [130.81, 174.61, 220.00]  // F chord / inversion
        ];
        
        let chordIdx = 0;
        
        const playBackingChord = () => {
            if (!this.musicPlaying || this.muted) return;
            const now = this.ctx.currentTime;
            const chord = chords[chordIdx];
            chordIdx = (chordIdx + 1) % chords.length;
            
            chord.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                
                // Slow attack and release
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.03, now + 1.5);
                gain.gain.setValueAtTime(0.03, now + 3.5);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 5.0);
                
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                
                osc.start(now);
                osc.stop(now + 5.0);
            });
        };

        // Play first chord immediately, then every 5 seconds
        playBackingChord();
        this.musicInterval = setInterval(playBackingChord, 5000);
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

const Sounds = new SoundSynthManager();
