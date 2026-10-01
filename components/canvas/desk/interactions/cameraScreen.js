import { CanvasTexture, SRGBColorSpace } from "three";
import { CAMERA_BACK, CAMERA_LEGENDS, SCREEN_ROWS } from "../lib/cameraProp.mjs";

const SONY_RED = "#d0102a";
const SONY_ORANGE = "#f39800";
const FONT = '-apple-system, "Helvetica Neue", Arial, sans-serif';
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

// The camera's LCD as the a6400 menu page: coloured tab strip, centred title,
// ruled rows, page dots and the MENU-back hint along the bottom.
export function drawCameraScreen() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const g = canvas.getContext("2d");
  g.fillStyle = "#0b0c10";
  g.fillRect(0, 0, 1024, 640);

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
    if (row.link) {
      g.fillStyle = SONY_ORANGE;
      g.fillRect(20, y + 4, 984, 58);
    }
    g.fillStyle = row.link ? "#000" : "#fff";
    g.font = `600 33px ${FONT}`;
    g.textAlign = "left";
    g.fillText(row.label, 40, y + 45);
    g.font = `500 28px ${FONT}`;
    g.textAlign = "right";
    g.fillText(row.link ? `${row.value}  ▸` : row.value, 988, y + 45);
    if (!row.link) {
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

  return texture(canvas);
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
    const color = kind === "brand" ? "#8d9096" : "#ece6da";
    if (/^[a-z]+$/.test(label)) {
      legendIcon(g, label, cx, cy, s, color);
      continue;
    }
    g.fillStyle = color;
    g.font =
      kind === "brand"
        ? `700 ${s}px "Times New Roman", Georgia, serif`
        : `600 ${s}px ${FONT}`;
    if (kind === "brand") g.letterSpacing = `${s * 0.18}px`;
    g.fillText(label, cx, cy);
    g.letterSpacing = "0px";
  }
  return texture(canvas);
}
