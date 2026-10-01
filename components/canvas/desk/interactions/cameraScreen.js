import { CanvasTexture, SRGBColorSpace } from "three";
import { SCREEN_ROWS } from "../lib/cameraProp.mjs";

const SONY_RED = "#c8102e";
const SONY_ORANGE = "#f39800";
const FONT = '-apple-system, "Helvetica Neue", Arial, sans-serif';

// The camera's LCD as a Sony-style menu page (tabs, rows, orange selection).
export function drawCameraScreen() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const g = canvas.getContext("2d");
  g.fillStyle = "#000";
  g.fillRect(0, 0, 1024, 640);

  for (let i = 0; i < 7; i++) {
    const x = 24 + i * 76;
    g.fillStyle = i === 0 ? SONY_RED : "#1b1d20";
    g.fillRect(x, 20, 64, 56);
    g.strokeStyle = "#3a3d42";
    g.lineWidth = 2;
    g.strokeRect(x, 20, 64, 56);
    g.strokeStyle = i === 0 ? "#fff" : "#8a8f96";
    g.lineWidth = 3;
    if (i === 0) {
      g.strokeRect(x + 14, 36, 36, 26);
      g.beginPath();
      g.arc(x + 32, 49, 8, 0, Math.PI * 2);
      g.stroke();
    } else {
      g.beginPath();
      g.arc(x + 32, 48, 12, 0, Math.PI * 2);
      g.stroke();
    }
  }
  g.fillStyle = "#fff";
  g.font = `500 28px ${FONT}`;
  g.textAlign = "right";
  g.fillText("1/1", 996, 58);

  g.textAlign = "left";
  g.font = `600 36px ${FONT}`;
  g.fillText("About Shiv", 28, 126);
  g.fillStyle = "#4a4d52";
  g.fillRect(28, 142, 960, 2);

  SCREEN_ROWS.forEach((row, i) => {
    const y = 152 + i * 72;
    if (row.link) {
      g.fillStyle = SONY_ORANGE;
      g.fillRect(20, y + 6, 968, 62);
    }
    g.fillStyle = row.link ? "#000" : "#fff";
    g.font = `600 34px ${FONT}`;
    g.textAlign = "left";
    g.fillText(row.label, 40, y + 48);
    g.font = `400 30px ${FONT}`;
    g.textAlign = "right";
    g.fillText(row.link ? `${row.value}  ▸` : row.value, 972, y + 48);
    if (!row.link) {
      g.fillStyle = "#2c2f33";
      g.fillRect(28, y + 70, 960, 2);
    }
  });
  g.fillStyle = "#6b7077";
  g.fillRect(1000, 152, 8, 432);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
