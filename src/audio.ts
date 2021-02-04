import { audiosprite, sounds } from "../asset-bundles";

export type Sound = keyof typeof sounds;

export default class Audio {
  private ctx: AudioContext;
  private gain: GainNode;
  private source: AudioBufferSourceNode | null = null;
  private playing: Sound | null = null;
  buffer: AudioBuffer | null = null;

  constructor() {
    this.ctx = new AudioContext();
    this.gain = this.ctx.createGain();
    this.gain.connect(this.ctx.destination);
    this.loadAudioSprite();
  }

  async loadAudioSprite() {
    this.buffer = await fetch(audiosprite)
      .then(response => response.arrayBuffer())
      .then(buffer => this.ctx.decodeAudioData(buffer));
  }

  isPlaying(sound: Sound) {
    return this.playing === sound;
  }

  play(sound: Sound, loop = false) {
    if (!this.buffer) return;

    if (this.source !== null) {
      this.stop();
    }

    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.connect(this.gain);

    const [start, end] = sounds[sound];

    if (loop) {
      this.source.loop = true;
      this.source.loopStart = start;
      this.source.loopEnd = end;
      this.source.start(0, start);
    } else {
      this.source.loop = false;
      this.source.start(0, start, end - start);
    }

    this.playing = sound;
    this.source.addEventListener("ended", () => {
      this.stop();
    });
  }

  volume(volume: number) {
    this.gain.gain.setValueAtTime(volume, this.ctx.currentTime);
  }

  stop() {
    if (this.source !== null) {
      this.source.disconnect();
      this.source = null;
      this.playing = null;
    }
  }
}
