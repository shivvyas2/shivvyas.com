import { CanvasTexture, SRGBColorSpace } from "three";
import { MACBOOK_ROWS, ROW_UNITS } from "../lib/macbookKeyboard.mjs";

const FONT = '-apple-system, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
const WELL = "#0b0c0d";
const CAP = "#1b1c1f";
const EDGE = "#2b2d31";
const INK = "#e8e9eb";

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function cap(g, x, y, w, h) {
  roundRect(g, x, y, w, h, Math.min(w, h) * 0.12);
  g.fillStyle = CAP;
  g.fill();
  g.strokeStyle = EDGE;
  g.lineWidth = 2;
  g.stroke();
}

function text(g, value, x, y, size, align = "center", weight = 500) {
  g.font = `${weight} ${size}px ${FONT}`;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillStyle = INK;
  g.fillText(value, x, y);
}

// The MacBook Pro keyboard seen from above: black keys with white legends
// in the black keyboard well, drawn onto the model's flat keyboard surface.
export function drawMacbookKeyboard() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 813;
  const g = canvas.getContext("2d");
  roundRect(g, 0, 0, canvas.width, canvas.height, 28);
  g.fillStyle = WELL;
  g.fill();

  const pad = 26;
  const unit = (canvas.width - pad * 2) / ROW_UNITS;
  const rowH = (canvas.height - pad * 2) / MACBOOK_ROWS.length;
  const gap = unit * 0.1;
  const big = rowH * 0.34;
  const small = rowH * 0.17;

  MACBOOK_ROWS.forEach((row, r) => {
    let x = pad;
    const y = pad + r * rowH;
    for (const key of row) {
      const w = (key.w ?? 1) * unit;
      const kx = x + gap / 2;
      const ky = y + gap / 2;
      const kw = w - gap;
      const kh = rowH - gap;
      if (key.arrows) {
        const u = kw / 3;
        const half = (kh - gap) / 2;
        const lowY = ky + half + gap;
        cap(g, kx, lowY, u - gap / 2, half);
        cap(g, kx + u, ky, u - gap / 2, half);
        cap(g, kx + u, lowY, u - gap / 2, half);
        cap(g, kx + u * 2, lowY, u - gap / 2, half);
        text(g, "◀", kx + u / 2, lowY + half / 2, small);
        text(g, "▲", kx + u * 1.5, ky + half / 2, small);
        text(g, "▼", kx + u * 1.5, lowY + half / 2, small);
        text(g, "▶", kx + u * 2.5, lowY + half / 2, small);
      } else {
        cap(g, kx, ky, kw, kh);
        const inset = kw * 0.12;
        if (key.label === "touchid") {
          g.strokeStyle = "#3a3c40";
          g.lineWidth = 3;
          g.beginPath();
          g.arc(kx + kw / 2, ky + kh / 2, Math.min(kw, kh) * 0.3, 0, Math.PI * 2);
          g.stroke();
        } else if (key.corner) {
          const left = key.corner === "left";
          text(g, key.label, left ? kx + inset : kx + kw - inset, ky + kh * 0.74, small, left ? "left" : "right");
          if (key.glyph)
            text(g, key.glyph, left ? kx + kw - inset : kx + inset, ky + kh * 0.28, small * 1.25, left ? "right" : "left");
        } else if (key.sub) {
          text(g, key.sub, kx + kw / 2, ky + kh * 0.3, small * 1.3);
          text(g, key.label, kx + kw / 2, ky + kh * 0.7, small * 1.3);
        } else if (key.label) {
          text(g, key.label, kx + kw / 2, ky + kh / 2, key.small ? small : big, "center", key.small ? 500 : 400);
        }
      }
      x += w;
    }
  });

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
