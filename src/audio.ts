import {
  AudioContext,
  GainNode,
  AudioBufferSourceNode,
  AudioBuffer
} from "standardized-audio-context";

import { audiosprite, sounds } from "../asset-bundles";

export type Sound = keyof typeof sounds;

export class Audio {
  private ctx: AudioContext;
  private gain: GainNode<AudioContext>;
  private source: AudioBufferSourceNode<AudioContext> | null = null;
  private buffer: AudioBuffer | null = null;

  private background: [Sound, number] | null = null;
  private oneShot: [Sound, number] | null = null;
  private playing: Sound | null = null;

  constructor() {
    this.ctx = new AudioContext();
    this.gain = this.ctx.createGain();
    this.gain.connect(this.ctx.destination);
    this.loadAudioSprite();
  }

  unlock() {
    // work around autoplay policy

    const unlock = () => {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    };
    window.addEventListener("click", unlock);
    window.addEventListener("keydown", unlock);
  }

  async loadAudioSprite() {
    this.buffer = await fetch(audiosprite)
      .then(response => response.arrayBuffer())
      .then(buffer => this.ctx.decodeAudioData(buffer));
  }

  update() {
    const shouldPlay = this.oneShot || this.background;
    const isBackground = !this.oneShot;

    if (shouldPlay && this.playing !== null) {
      const [sound, volume] = shouldPlay;

      this.volume(volume);
      if (this.playing !== sound) {
        this.disconnectSource();
        this.play(sound, isBackground);
      }
    } else if (shouldPlay) {
      const [sound, volume] = shouldPlay;
      this.volume(volume);
      this.play(sound, isBackground);
    } else if (this.playing) {
      this.disconnectSource();
    }
  }

  playOneShot(sound: Sound, volume: number = 1) {
    this.oneShot = [sound, volume];
  }

  setBackground(sound: Sound | null, volume: number = 1) {
    this.background = sound === null ? null : [sound, volume];
  }

  private play(sound: Sound, loop = false) {
    if (!this.buffer) return;

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
      this.source.start(0, start, end - start);

      this.source.addEventListener("ended", () => {
        this.oneShot = null;
        this.disconnectSource();
      });
    }

    this.playing = sound;
  }

  private volume(volume: number) {
    this.gain.gain.setValueAtTime(volume, this.ctx.currentTime);
  }

  private disconnectSource() {
    if (this.source !== null) {
      this.source.disconnect();
      this.source = null;
      this.playing = null;
    }
  }
}

export default new Audio();
