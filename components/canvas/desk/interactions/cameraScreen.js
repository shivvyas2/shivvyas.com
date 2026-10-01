import { CanvasTexture, SRGBColorSpace } from "three";
import { CAMERA_BACK, CAMERA_LEGENDS, SCREEN_ROWS } from "../lib/cameraProp.mjs";
import { CAMERA_PHOTOS, EV_STEPS, INITIAL_CAMERA_UI, ISO_STEPS } from "../lib/cameraUi.mjs";

const SONY_RED = "#d0102a";
const SONY_ORANGE = "#f39800";
const FONT = '-apple-system, "Helvetica Neue", Arial, sans-serif';
const CONDENSED = '"Helvetica Neue", "Arial Narrow", Arial, sans-serif';
// Tab strip colours of the a6400 menu: shooting 1 & 2, network, playback,
// setup, My Menu.
const TABS = ["#d0102a", "#8d2fc9", "#2f9e44", "#2563d9", "#f08c00", "#e8e8e8"];

function texture(canvas) {
  const result = new CanvasTexture(canvas);
  result.colorSpace = SRGBColorSpace;
  result.anisotropy = 4;
  return result;
}

function tabIcon(g, kind, x, y, color) {
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = 4;
  if (kind <= 1) {
    g.fillRect(x - 22, y - 12, 44, 28);
    g.fillRect(x - 8, y - 18, 16, 8);
    g.fillStyle = kind === 0 ? SONY_RED : "#2a2d33";
    g.beginPath();
    g.arc(x, y + 2, 9, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = color;
    g.font = `700 20px ${FONT}`;
    g.fillText(String(kind + 1), x + 30, y + 18);
  } else if (kind === 2) {
    g.beginPath();
    g.arc(x, y, 18, 0, Math.PI * 2);
    g.moveTo(x - 18, y);
    g.lineTo(x + 18, y);
    g.ellipse(x, y, 8, 18, 0, 0, Math.PI * 2);
    g.stroke();
  } else if (kind === 3) {
    g.strokeRect(x - 20, y - 15, 40, 30);
    g.beginPath();
    g.moveTo(x - 6, y - 8);
    g.lineTo(x + 9, y);
    g.lineTo(x - 6, y + 8);
    g.fill();
  } else if (kind === 4) {
    g.fillRect(x - 20, y - 8, 40, 24);
    g.strokeRect(x - 8, y - 16, 16, 9);
  } else {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 9 : 21;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    g.fill();
  }
}

const W = 1024;
const H = 640;
const QUICK = [
  ["Drive", "Single"], ["Focus", "AF-C"], ["Area", "Wide"], ["EV", null], ["ISO", null], ["Meter", "Multi"],
  ["WB", "AWB"], ["DRO", "Auto"], ["Style", "Std"], ["Profile", "Off"], ["Mode", "Photo"], ["Face/Eye", "On"],
];

function cover(g, image, x, y, w, h, fit = "cover") {
  const scale = (fit === "cover" ? Math.max : Math.min)(w / image.width, h / image.height);
  const iw = image.width * scale;
  const ih = image.height * scale;
  g.drawImage(image, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

function battery(g, x, y) {
  g.strokeStyle = "#fff";
  g.lineWidth = 3;
  g.strokeRect(x, y, 44, 22);
  g.fillStyle = "#fff";
  g.fillRect(x + 44, y + 6, 4, 10);
  g.fillRect(x + 4, y + 4, 28, 14);
}

function drawMenu(g, ui) {
  g.fillStyle = "#0b0c10";
  g.fillRect(0, 0, W, H);
  TABS.forEach((color, i) => {
    const x = 20 + i * 94;
    const active = i === 0;
    g.fillStyle = active ? SONY_RED : "#1d2026";
    g.fillRect(x, 14, 88, 62);
    g.fillStyle = color;
    g.fillRect(x, 72, 88, 6);
    tabIcon(g, i, x + 40, 44, active ? "#fff" : "#d7dbe0");
  });
  g.fillStyle = "#9aa0a8";
  g.fillRect(20, 80, 984, 3);
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.font = `600 38px ${FONT}`;
  g.fillText("About Shiv", 512, 128);
  g.textAlign = "right";
  g.font = `500 28px ${FONT}`;
  g.fillText("1/14 ▸", 1000, 126);
  g.fillStyle = "#cfd3d8";
  g.fillRect(20, 142, 984, 2);

  SCREEN_ROWS.forEach((row, i) => {
    const y = 148 + i * 66;
    const selected = i === ui.row;
    if (selected) {
      g.fillStyle = SONY_ORANGE;
      g.fillRect(20, y + 4, 984, 58);
    }
    g.fillStyle = selected ? "#000" : "#fff";
    g.font = `600 33px ${FONT}`;
    g.textAlign = "left";
    g.fillText(row.label, 40, y + 45);
    g.font = `500 28px ${FONT}`;
    g.textAlign = "right";
    g.fillText(row.link ? `${row.value}  ▸` : row.value, 988, y + 45);
    if (!selected) {
      g.fillStyle = "#4a4f57";
      g.fillRect(20, y + 64, 984, 2);
    }
  });

  g.fillStyle = "#cfd3d8";
  g.fillRect(20, 548, 984, 3);
  for (let i = 0; i < 14; i++) {
    g.fillStyle = i === 0 ? SONY_ORANGE : "#e9ecef";
    g.fillRect(250 + i * 30, 572, 22, 22);
  }
  g.fillStyle = "#e9ecef";
  g.fillRect(820, 568, 70, 30);
  g.fillStyle = "#0b0c10";
  g.font = `700 18px ${FONT}`;
  g.textAlign = "center";
  g.fillText("MENU", 855, 590);
  g.strokeStyle = "#e9ecef";
  g.lineWidth = 5;
  g.beginPath();
  g.arc(930, 583, 14, -Math.PI * 0.9, Math.PI * 0.5);
  g.stroke();
}

function shootingBar(g, ui) {
  const grad = g.createLinearGradient(0, H - 90, 0, H);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.75)");
  g.fillStyle = grad;
  g.fillRect(0, H - 90, W, 90);
  g.fillStyle = "#fff";
  g.font = `600 34px ${FONT}`;
  g.textAlign = "left";
  const parts = ["1/250", "F5.6", EV_STEPS[ui.ev], `ISO ${ISO_STEPS[ui.iso]}`];
  let x = 40;
  for (const part of parts) {
    g.fillText(part, x, H - 28);
    x += g.measureText(part).width + 46;
  }
}

function drawLive(g, ui, images) {
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);
  const scene = images[4] ?? images[0];
  if (scene) cover(g, scene, 0, 0, W, H);
  if (ui.info) {
    g.strokeStyle = "rgba(255,255,255,0.28)";
    g.lineWidth = 2;
    for (const f of [1 / 3, 2 / 3]) {
      g.beginPath();
      g.moveTo(W * f, 0);
      g.lineTo(W * f, H);
      g.moveTo(0, H * f);
      g.lineTo(W, H * f);
      g.stroke();
    }
    g.fillStyle = "rgba(0,0,0,0.45)";
    g.fillRect(0, 0, W, 64);
    g.fillStyle = "#fff";
    g.font = `800 34px ${FONT}`;
    g.textAlign = "left";
    g.fillRect(24, 12, 44, 40);
    g.fillStyle = "#000";
    g.fillText("P", 33, 45);
    g.fillStyle = "#fff";
    g.font = `600 26px ${FONT}`;
    g.fillText("RAW+J   24M   3:2", 90, 42);
    g.textAlign = "right";
    g.fillText("1234", 920, 42);
    battery(g, 950, 21);
    // Phase-detect focus frame.
    g.strokeStyle = "#7fe07f";
    g.lineWidth = 4;
    const [cx, cy, fw, fh] = [W / 2, H / 2, 120, 90];
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      g.beginPath();
      g.moveTo(cx + sx * fw, cy + sy * (fh - 26));
      g.lineTo(cx + sx * fw, cy + sy * fh);
      g.lineTo(cx + sx * (fw - 26), cy + sy * fh);
      g.stroke();
    }
  }
  shootingBar(g, ui);
}

function drawPlayback(g, ui, images) {
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);
  const image = images[ui.photo];
  if (image) cover(g, image, 0, 0, W, H, "contain");
  g.fillStyle = "rgba(0,0,0,0.55)";
  g.fillRect(0, 0, W, 60);
  g.fillRect(0, H - 70, W, 70);
  g.fillStyle = "#fff";
  g.font = `600 28px ${FONT}`;
  g.textAlign = "left";
  g.fillText(`▶  ${ui.photo + 1}/${CAMERA_PHOTOS.length}`, 28, 40);
  g.textAlign = "right";
  g.fillText(`100-${String(ui.photo + 1).padStart(4, "0")}`, 996, 40);
  g.textAlign = "left";
  g.fillStyle = SONY_ORANGE;
  g.fillText("●  OK", 28, H - 25);
  g.fillStyle = "#fff";
  g.fillText("Open awannabephotographer.shivvyas.com", 120, H - 25);
  g.font = `600 54px ${FONT}`;
  g.fillStyle = "rgba(255,255,255,0.8)";
  g.fillText("‹", 16, H / 2 + 18);
  g.textAlign = "right";
  g.fillText("›", W - 16, H / 2 + 18);
}

function drawQuick(g, ui, images) {
  drawLive(g, { ...ui, info: false }, images);
  g.fillStyle = "rgba(0,0,0,0.55)";
  g.fillRect(0, 0, W, H);
  const cols = 6;
  const tw = 152;
  const th = 120;
  const x0 = (W - cols * tw - (cols - 1) * 8) / 2;
  QUICK.forEach(([label, value], i) => {
    const x = x0 + (i % cols) * (tw + 8);
    const y = 300 + Math.floor(i / cols) * (th + 8);
    const active = i === 4;
    g.fillStyle = active ? SONY_ORANGE : "rgba(20,22,26,0.92)";
    g.fillRect(x, y, tw, th);
    g.fillStyle = active ? "#000" : "#9aa0a8";
    g.font = `600 22px ${FONT}`;
    g.textAlign = "center";
    g.fillText(label, x + tw / 2, y + 40);
    g.fillStyle = active ? "#000" : "#fff";
    g.font = `700 30px ${FONT}`;
    const shown = value ?? (label === "EV" ? EV_STEPS[ui.ev] : ISO_STEPS[ui.iso]);
    g.fillText(shown, x + tw / 2, y + 88);
  });
  g.fillStyle = "#fff";
  g.font = `600 26px ${FONT}`;
  g.textAlign = "left";
  g.fillText("Fn", 40, 60);
}

function drawToast(g, text) {
  g.font = `600 30px ${FONT}`;
  const w = g.measureText(text).width + 60;
  g.fillStyle = "rgba(20,22,26,0.92)";
  g.beginPath();
  g.roundRect((W - w) / 2, H / 2 - 40, w, 80, 14);
  g.fill();
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.fillText(text, W / 2, H / 2 + 10);
}

// The camera's LCD: a canvas that redraws for whatever the buttons select —
// the a6400 menu (About Shiv), live view, playback of Shiv's photos and the
// Fn quick menu, plus toasts and a white shutter flash.
export function createCameraScreen() {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d");
  const map = texture(canvas);
  const images = [];
  let last = { ui: INITIAL_CAMERA_UI, flash: 0 };

  const render = (ui = last.ui, flash = 0) => {
    last = { ui, flash };
    g.save();
    if (ui.screen === "live") drawLive(g, ui, images);
    else if (ui.screen === "playback") drawPlayback(g, ui, images);
    else if (ui.screen === "quick") drawQuick(g, ui, images);
    else drawMenu(g, ui);
    if (ui.toast) drawToast(g, ui.toast);
    if (flash > 0) {
      g.fillStyle = `rgba(255,255,255,${flash})`;
      g.fillRect(0, 0, W, H);
    }
    g.restore();
    map.needsUpdate = true;
  };

  // Photos load on first use so the desk itself never waits for them.
  let loading = false;
  const loadPhotos = (onReady) => {
    if (loading) return;
    loading = true;
    CAMERA_PHOTOS.forEach((src, i) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        images[i] = image;
        render(last.ui, last.flash);
        onReady?.();
      };
      image.src = src;
    });
  };

  render();
  return { texture: map, render, loadPhotos, dispose: () => map.dispose() };
}

function legendIcon(g, kind, x, y, s, color) {
  g.strokeStyle = color;
  g.fillStyle = color;
  g.lineWidth = Math.max(2, s * 0.12);
  switch (kind) {
    case "zoom":
      g.beginPath();
      g.arc(x - s * 0.1, y - s * 0.1, s * 0.38, 0, Math.PI * 2);
      g.moveTo(x + s * 0.17, y + s * 0.17);
      g.lineTo(x + s * 0.45, y + s * 0.45);
      g.moveTo(x - s * 0.3, y - s * 0.1);
      g.lineTo(x + s * 0.1, y - s * 0.1);
      g.moveTo(x - s * 0.1, y - s * 0.3);
      g.lineTo(x - s * 0.1, y + s * 0.1);
      g.stroke();
      break;
    case "flash":
      g.beginPath();
      g.moveTo(x + s * 0.12, y - s * 0.5);
      g.lineTo(x - s * 0.22, y + s * 0.05);
      g.lineTo(x + s * 0.02, y + s * 0.05);
      g.lineTo(x - s * 0.12, y + s * 0.5);
      g.lineTo(x + s * 0.24, y - s * 0.08);
      g.lineTo(x, y - s * 0.08);
      g.closePath();
      g.fill();
      break;
    case "send":
      g.strokeRect(x - s * 0.1, y - s * 0.45, s * 0.5, s * 0.9);
      g.beginPath();
      g.moveTo(x - s * 0.5, y);
      g.lineTo(x + s * 0.15, y);
      g.moveTo(x - s * 0.05, y - s * 0.18);
      g.lineTo(x + s * 0.15, y);
      g.lineTo(x - s * 0.05, y + s * 0.18);
      g.stroke();
      break;
    case "timer":
      g.beginPath();
      g.arc(x, y, s * 0.42, -Math.PI * 0.3, Math.PI * 1.5);
      g.moveTo(x, y);
      g.lineTo(x + s * 0.25, y - s * 0.25);
      g.stroke();
      g.strokeRect(x - s * 0.2, y + s * 0.65, s * 0.5, s * 0.35);
      g.strokeRect(x - s * 0.1, y + s * 0.55, s * 0.5, s * 0.35);
      break;
    case "exposure":
      g.strokeRect(x - s * 0.5, y - s * 0.5, s, s);
      g.beginPath();
      g.moveTo(x - s * 0.5, y + s * 0.5);
      g.lineTo(x + s * 0.5, y - s * 0.5);
      g.stroke();
      g.font = `700 ${s * 0.5}px ${FONT}`;
      g.fillText("+", x - s * 0.22, y - s * 0.08);
      g.fillText("−", x + s * 0.22, y + s * 0.3);
      for (let i = 0; i < 4; i++)
        g[i % 3 ? "strokeRect" : "fillRect"](x + s * 0.8 + (i % 2) * s * 0.3, y - s * 0.4 + Math.floor(i / 2) * s * 0.4, s * 0.3, s * 0.4);
      break;
    case "play":
      g.strokeRect(x - s * 0.5, y - s * 0.38, s, s * 0.76);
      g.beginPath();
      g.moveTo(x - s * 0.15, y - s * 0.22);
      g.lineTo(x + s * 0.25, y);
      g.lineTo(x - s * 0.15, y + s * 0.22);
      g.closePath();
      g.fill();
      break;
    case "trash":
      g.strokeRect(x - s * 0.3, y - s * 0.3, s * 0.6, s * 0.75);
      g.beginPath();
      g.moveTo(x - s * 0.45, y - s * 0.32);
      g.lineTo(x + s * 0.45, y - s * 0.32);
      g.moveTo(x - s * 0.12, y - s * 0.45);
      g.lineTo(x + s * 0.12, y - s * 0.45);
      for (const dx of [-0.12, 0, 0.12]) {
        g.moveTo(x + dx * s, y - s * 0.15);
        g.lineTo(x + dx * s, y + s * 0.32);
      }
      g.stroke();
      break;
    default:
      break;
  }
}

// Transparent overlay with the rear-panel lettering and icons, laid just in
// front of the camera's back so it reads like printed legends.
export function drawCameraLegends() {
  const W = 2048;
  const H = Math.round((W * CAMERA_BACK.height) / CAMERA_BACK.width);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d");
  const px = W / CAMERA_BACK.width;
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (const [label, x, y, size, kind] of CAMERA_LEGENDS) {
    const cx = (CAMERA_BACK.width / 2 - x) * px;
    const cy = (CAMERA_BACK.height - y) * px;
    const s = size * px;
    const color = kind === "brand" ? "#b9bcc2" : "#ece6da";
    if (/^[a-z]+$/.test(label)) {
      legendIcon(g, label, cx, cy, s, color);
      continue;
    }
    if (kind === "brand") {
      sonyLogo(g, cx, cy, s * 1.15, color);
      continue;
    }
    // Sony's legends are a tight, bold grotesque: condense a bold sans.
    g.save();
    g.translate(cx, cy);
    g.scale(0.86, 1);
    g.fillStyle = color;
    g.font = `700 ${s}px ${CONDENSED}`;
    g.fillText(label, 0, 0);
    g.restore();
  }
  return texture(canvas);
}

// The SONY wordmark: a heavy, wide slab serif. Rockwell (macOS/Windows) is
// the closest system face; the stroke adds the logo's weight and the x-scale
// its extended proportions.
function sonyLogo(g, cx, cy, height, color) {
  g.save();
  g.translate(cx, cy);
  g.scale(1.32, 1);
  g.fillStyle = color;
  g.strokeStyle = color;
  g.lineJoin = "miter";
  g.lineWidth = height * 0.07;
  g.font = `700 ${height}px Rockwell, "Rockwell Extra Bold", "Clarendon", "Century Schoolbook", Georgia, serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.letterSpacing = `${height * 0.06}px`;
  g.fillText("SONY", 0, 0);
  g.strokeText("SONY", 0, 0);
  g.letterSpacing = "0px";
  g.restore();
}

// Front badge, left of the mount as seen from the front: the SONY wordmark up
// top and the α6400 model name at the bottom. Plane size is CAMERA_FRONT.
export function drawCameraFront() {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 680;
  const g = canvas.getContext("2d");
  sonyLogo(g, 160, 52, 44, "#f2f2f2");
  g.save();
  g.translate(160, 618);
  g.scale(0.9, 1);
  g.fillStyle = "#d9d9d9";
  g.font = `600 34px ${CONDENSED}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("α6400", 0, 0);
  g.restore();
  return texture(canvas);
}
