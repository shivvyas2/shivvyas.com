import { renderFriction, renderSwitch } from "../lib/switchSound.mjs";

let ctx = null;
let master = null;
let buffers = null;
let friction = null;

// Created on the first key press/drag (a user gesture), so autoplay rules pass.
function ready() {
  try {
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
      const sr = ctx.sampleRate;
      const make = (data) => {
        const buffer = ctx.createBuffer(1, data.length, sr);
        buffer.copyToChannel(data, 0);
        return buffer;
      };
      buffers = {
        down: [1, 2, 3, 4, 5].map((seed) => make(renderSwitch(sr, { seed }))),
        up: [11, 12].map((seed) => make(renderSwitch(sr, { seed, up: true }))),
        deep: make(renderSwitch(sr, { seed: 21, deep: true })),
        friction: make(renderFriction(sr, 1, 7)),
      };
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return Boolean(buffers);
  } catch {
    ctx = null;
    buffers = null;
    return false;
  }
}

function play(buffer, { gain = 1, rate = 1, delay = 0 } = {}) {
  try {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const level = ctx.createGain();
    level.gain.value = gain;
    source.connect(level).connect(master);
    source.start(ctx.currentTime + delay);
  } catch {
    // Audio is decoration; never let it break interaction.
  }
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const jitter = () => 1 + (Math.random() * 0.08 - 0.04);

export const deskAudio = {
  key({ deep = false } = {}) {
    if (!ready()) return;
    play(deep ? buffers.deep : pick(buffers.down), { rate: jitter() });
    play(pick(buffers.up), { gain: 0.45, rate: jitter(), delay: 0.09 });
  },
  friction(level) {
    if (!ready()) return;
    try {
      if (!friction) {
        const source = ctx.createBufferSource();
        source.buffer = buffers.friction;
        source.loop = true;
        const gain = ctx.createGain();
        gain.gain.value = 0;
        source.connect(gain).connect(master);
        source.start();
        friction = { source, gain };
      }
      friction.gain.gain.setTargetAtTime(Math.min(1, level) * 0.18, ctx.currentTime, 0.03);
    } catch {
      friction = null;
    }
  },
  stopFriction() {
    if (!friction) return;
    const { source, gain } = friction;
    friction = null;
    try {
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
      source.stop(ctx.currentTime + 0.25);
    } catch {
      // already stopped
    }
  },
};
