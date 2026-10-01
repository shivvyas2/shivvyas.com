import { BufferAttribute, CanvasTexture, SRGBColorSpace } from "three";
import { MONITOR_FILES, tokenize } from "../lib/monitorCode.mjs";

// Cursor's default dark theme.
const C = {
  chrome: "#141414",
  editor: "#181818",
  sidebar: "#141414",
  border: "#2a2a2a",
  text: "#d6d6dd",
  dim: "#7a7a80",
  gutter: "#505055",
  lineHighlight: "#232327",
  accent: "#228df2",
  keyword: "#82d2ce",
  string: "#e394dc",
  number: "#ebc88d",
  comment: "#6d6d6d",
  call: "#efb080",
  type: "#87c3ff",
  tag: "#87c3ff",
  plain: "#d6d6dd",
};
const MONO = '"SF Mono", Menlo, Monaco, Consolas, monospace';
const SANS = '-apple-system, "Helvetica Neue", Arial, sans-serif';
const PANE_W = 1600;
const PANE_H = 900;

const TREE = [
  ["components", 0, true],
  ["canvas", 1, true],
  ["desk", 2, true],
  ["interactions", 3, false],
  ["lib", 3, false],
  ["CameraDirector.jsx", 3],
  ["DeskCanvas.jsx", 3],
  ["DeskModel.jsx", 3],
  ["Keycaps.jsx", 3],
  ["useDesk.js", 3],
  ["scripts", 0, true],
  ["model", 1, true],
  ["build-desk.mjs", 2],
  ["scene.test.mjs", 2],
  ["public", 0, false],
  ["package.json", 0],
];

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}

function drawCursorPane(g, ox, file) {
  const name = file.path.split("/").pop();
  g.save();
  g.translate(ox, 0);
  g.beginPath();
  g.rect(0, 0, PANE_W, PANE_H);
  g.clip();

  g.fillStyle = C.editor;
  g.fillRect(0, 0, PANE_W, PANE_H);

  // Title bar with traffic lights.
  g.fillStyle = C.chrome;
  g.fillRect(0, 0, PANE_W, 40);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((color, i) => {
    g.fillStyle = color;
    g.beginPath();
    g.arc(22 + i * 22, 20, 7, 0, Math.PI * 2);
    g.fill();
  });
  g.fillStyle = C.dim;
  g.font = `500 17px ${SANS}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("shivvyas.com", PANE_W / 2, 20);
  g.textAlign = "left";

  // Activity bar.
  g.fillStyle = C.chrome;
  g.fillRect(0, 40, 52, PANE_H - 66);
  for (let i = 0; i < 5; i++) {
    g.strokeStyle = i === 0 ? C.text : C.gutter;
    g.lineWidth = 2.5;
    g.strokeRect(16, 62 + i * 52, 20, 20);
  }
  g.fillStyle = C.text;
  g.fillRect(0, 56, 3, 30);

  // Explorer.
  const sideW = 290;
  g.fillStyle = C.sidebar;
  g.fillRect(52, 40, sideW, PANE_H - 66);
  g.fillStyle = C.dim;
  g.font = `600 14px ${SANS}`;
  g.fillText("EXPLORER", 72, 64);
  g.font = `700 15px ${SANS}`;
  g.fillStyle = C.text;
  g.fillText("⌄ SHIVVYAS.COM", 64, 94);
  g.font = `400 16px ${SANS}`;
  TREE.forEach(([label, depth, open], i) => {
    const y = 122 + i * 28;
    const active = label === name;
    if (active) {
      g.fillStyle = "#2a2d2e";
      g.fillRect(52, y - 14, sideW, 28);
    }
    const x = 70 + depth * 16;
    const folder = open !== undefined;
    g.fillStyle = folder ? C.dim : C.gutter;
    if (folder) g.fillText(open ? "⌄" : "›", x, y + 1);
    g.fillStyle = folder ? C.text : /\.jsx?$/.test(label) ? C.number : C.type;
    if (!folder) g.fillRect(x + 2, y - 5, 10, 10);
    g.fillStyle = active ? "#ffffff" : C.text;
    g.fillText(label, x + 20, y + 1);
  });

  // Editor area.
  const ex = 52 + sideW;
  const ew = PANE_W - ex;
  g.fillStyle = C.chrome;
  g.fillRect(ex, 40, ew, 40);
  g.fillStyle = C.editor;
  g.fillRect(ex, 40, 230, 40);
  g.fillStyle = C.accent;
  g.fillRect(ex, 40, 230, 2);
  g.fillStyle = C.text;
  g.font = `500 16px ${SANS}`;
  g.fillText(name, ex + 40, 61);
  g.fillStyle = C.number;
  g.fillRect(ex + 18, 55, 12, 12);
  g.fillStyle = C.dim;
  g.font = `400 15px ${SANS}`;
  g.fillText(file.path.split("/").join("  ›  "), ex + 18, 100);

  const lineH = 22.5;
  const top = 128;
  const cursorLine = 7;
  g.save();
  g.beginPath();
  g.rect(ex, 80, ew, PANE_H - 106);
  g.clip();
  g.font = `400 17px ${MONO}`;
  file.lines.forEach((line, i) => {
    const y = top + i * lineH;
    if (y > PANE_H - 40) return;
    if (i === cursorLine) {
      g.fillStyle = C.lineHighlight;
      g.fillRect(ex, y - lineH / 2, ew, lineH);
    }
    g.fillStyle = i === cursorLine ? C.text : C.gutter;
    g.textAlign = "right";
    g.fillText(String(file.firstLine + i), ex + 58, y);
    g.textAlign = "left";
    let x = ex + 80;
    for (const run of tokenize(line, file.language)) {
      g.fillStyle = C[run.kind] ?? C.plain;
      g.fillText(run.text, x, y);
      x += g.measureText(run.text).width;
    }
    if (i === cursorLine) {
      g.fillStyle = C.text;
      g.fillRect(x + 2, y - 10, 2, 20);
    }
  });
  g.restore();

  // Status bar.
  g.fillStyle = C.chrome;
  g.fillRect(0, PANE_H - 26, PANE_W, 26);
  g.fillStyle = C.dim;
  g.font = `400 14px ${SANS}`;
  g.fillText("⎇ main", 14, PANE_H - 12);
  g.textAlign = "right";
  g.fillText(`Ln ${file.firstLine + cursorLine}, Col 12    Spaces: 2    UTF-8    ${/\.jsx$/.test(name) ? "JavaScript JSX" : "JavaScript"}    Cursor Tab`, PANE_W - 14, PANE_H - 12);
  g.restore();
}

// Xcode's default dark theme.
const X = {
  window: "#1e1e22",
  toolbar: "#2b2b30",
  navigator: "#26262b",
  editor: "#1f1f24",
  gutter: "#5f6068",
  text: "#dfdfe0",
  dim: "#8e8e93",
  keyword: "#fc5fa3",
  attribute: "#fd8f3f",
  string: "#fc6a5d",
  number: "#d0bf69",
  comment: "#6c7986",
  call: "#67b7a4",
  type: "#d0a8ff",
  tag: "#d0a8ff",
  plain: "#dfdfe0",
};
const XCODE_TREE = [
  ["LIfeOS", 0, true],
  ["LIfeOS", 1, true],
  ["Features", 2, true],
  ["Money", 3, true],
  ["View", 4, true],
  ["MoneyCharts.swift", 5],
  ["MoneySections.swift", 5],
  ["MoneyView.swift", 5],
  ["Health", 3, false],
  ["Today", 3, false],
  ["Coach", 3, false],
  ["LifeOSKit", 1, false],
];
const SIM_W = 560; // the Simulator's half of the split screen

// Right monitor: Xcode on the left of a split screen running Life OS, the
// iPhone Simulator on the right showing the same Money screen.
function drawXcodeSplit(g, ox, file, phoneImage) {
  const name = file.path.split("/").pop();
  const xw = PANE_W - SIM_W;
  g.save();
  g.translate(ox, 0);
  g.beginPath();
  g.rect(0, 0, PANE_W, PANE_H);
  g.clip();

  // Desktop behind the Simulator.
  const wall = g.createLinearGradient(xw, 0, PANE_W, PANE_H);
  wall.addColorStop(0, "#1b2a4a");
  wall.addColorStop(1, "#0c1222");
  g.fillStyle = wall;
  g.fillRect(xw, 0, SIM_W, PANE_H);

  // Xcode window.
  g.fillStyle = X.window;
  g.fillRect(0, 0, xw, PANE_H);
  g.fillStyle = X.toolbar;
  g.fillRect(0, 0, xw, 52);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((color, i) => {
    g.fillStyle = color;
    g.beginPath();
    g.arc(22 + i * 22, 26, 7, 0, Math.PI * 2);
    g.fill();
  });
  g.fillStyle = X.text;
  g.beginPath();
  g.moveTo(118, 16);
  g.lineTo(134, 26);
  g.lineTo(118, 36);
  g.fill();
  g.fillRect(150, 18, 16, 16);
  g.font = `600 16px ${SANS}`;
  g.textBaseline = "middle";
  g.fillText("LIfeOS", 186, 20);
  g.fillStyle = X.dim;
  g.font = `400 13px ${SANS}`;
  g.fillText("main", 186, 38);
  g.fillStyle = "#3a3a40";
  roundRect(g, 300, 12, 470, 28, 7);
  g.fillStyle = X.text;
  g.font = `400 14px ${SANS}`;
  g.fillText("LIfeOS  ›  iPhone 16 Pro", 316, 27);
  g.fillStyle = X.dim;
  g.fillText("Running LIfeOS on iPhone 16 Pro", 530, 27);

  // Navigator.
  const navW = 250;
  g.fillStyle = X.navigator;
  g.fillRect(0, 52, navW, PANE_H - 52);
  g.font = `400 15px ${SANS}`;
  XCODE_TREE.forEach(([label, depth, open], i) => {
    const y = 80 + i * 26;
    const active = label === name;
    if (active) {
      g.fillStyle = "#3d5a9b";
      g.fillRect(6, y - 12, navW - 12, 24);
    }
    const x = 14 + depth * 14;
    const folder = open !== undefined;
    g.fillStyle = X.dim;
    if (folder) g.fillText(open ? "⌄" : "›", x, y);
    g.fillStyle = folder ? "#5ea1f7" : "#f0883e";
    g.fillRect(x + 14, y - 6, 12, 12);
    g.fillStyle = active ? "#fff" : X.text;
    g.fillText(label, x + 32, y);
  });

  // Editor with the jump bar.
  const ex = navW;
  const ew = xw - navW;
  g.fillStyle = X.editor;
  g.fillRect(ex, 52, ew, PANE_H - 52);
  g.fillStyle = X.toolbar;
  g.fillRect(ex, 52, ew, 34);
  g.fillStyle = X.dim;
  g.font = `400 14px ${SANS}`;
  g.fillText(`LIfeOS  ›  Money  ›  View  ›  ${name}  ›  MoneyDonut`, ex + 16, 69);

  g.save();
  g.beginPath();
  g.rect(ex, 90, ew, PANE_H - 90);
  g.clip();
  const lineH = 22;
  g.font = `400 16px ${MONO}`;
  file.lines.forEach((line, i) => {
    const y = 108 + i * lineH;
    g.fillStyle = X.gutter;
    g.textAlign = "right";
    g.fillText(String(file.firstLine + i), ex + 50, y);
    g.textAlign = "left";
    let x = ex + 68;
    for (const run of tokenize(line, file.language)) {
      g.fillStyle = X[run.kind] ?? X.plain;
      g.fillText(run.text, x, y);
      x += g.measureText(run.text).width;
    }
  });
  g.restore();
  g.fillStyle = "#000";
  g.fillRect(xw - 2, 0, 4, PANE_H);

  // Simulator: an iPhone 16 Pro frame with the Life OS screenshot.
  g.fillStyle = "#c9cad0";
  g.font = `600 14px ${SANS}`;
  g.textAlign = "center";
  g.fillText("iPhone 16 Pro", xw + SIM_W / 2, 24);
  g.font = `400 12px ${SANS}`;
  g.fillStyle = "#8e8e93";
  g.fillText("iOS 26.0", xw + SIM_W / 2, 42);
  g.textAlign = "left";
  const ph = PANE_H - 90;
  const pw = Math.round(ph / 2.173);
  const px = xw + (SIM_W - pw) / 2;
  const py = 62;
  g.fillStyle = "#0a0a0c";
  roundRect(g, px - 12, py - 12, pw + 24, ph + 24, 62);
  g.fillStyle = "#3a3b40";
  roundRect(g, px - 14, py - 14, 4, ph + 28, 2);
  g.save();
  g.beginPath();
  g.roundRect(px, py, pw, ph, 50);
  g.clip();
  if (phoneImage) g.drawImage(phoneImage, px, py, pw, ph);
  else {
    g.fillStyle = "#e8e6df";
    g.fillRect(px, py, pw, ph);
  }
  g.restore();
  g.fillStyle = "#000";
  roundRect(g, px + pw / 2 - 52, py + 12, 104, 30, 15);
  g.restore();
}

const PHONE_SCREEN = "/images/desk/lifeos-simulator.jpg";

// One canvas, two panes: the left half textures the left monitor and the
// right half the right one. `onUpdate` fires when the Simulator screenshot
// arrives and the right pane is redrawn with it.
export function drawMonitorScreens(onUpdate) {
  const canvas = document.createElement("canvas");
  canvas.width = PANE_W * 2;
  canvas.height = PANE_H;
  const g = canvas.getContext("2d");
  drawCursorPane(g, 0, MONITOR_FILES.left);
  drawXcodeSplit(g, PANE_W, MONITOR_FILES.xcode, null);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.flipY = false; // glTF UVs start at the top-left
  texture.anisotropy = 8;
  const phone = new Image();
  phone.decoding = "async";
  phone.onload = () => {
    drawXcodeSplit(g, PANE_W, MONITOR_FILES.xcode, phone);
    texture.needsUpdate = true;
    onUpdate?.();
  };
  phone.src = PHONE_SCREEN;
  return texture;
}

// Both screens are one merged mesh of two quads with no UVs (export drops
// them from untextured materials). Map each quad from its own bounds onto its
// half of the canvas: left monitor -> u 0..0.5, right -> 0.5..1.
function screenUvs(geometry) {
  const pos = geometry.attributes.position;
  // The left quad's vertices are the leftmost half (the right quad can start
  // just left of the origin, so a sign test is not enough).
  const order = Array.from({ length: pos.count }, (_, i) => i).sort((a, b) => pos.getX(a) - pos.getX(b));
  const halves = [order.slice(0, pos.count / 2), order.slice(pos.count / 2)];
  const uv = new Float32Array(pos.count * 2);
  halves.forEach((indices, half) => {
    const xs = indices.map((i) => pos.getX(i));
    const ys = indices.map((i) => pos.getY(i));
    const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
    const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
    for (const i of indices) {
      uv[i * 2] = half * 0.5 + ((pos.getX(i) - x0) / (x1 - x0 || 1)) * 0.5;
      uv[i * 2 + 1] = (y1 - pos.getY(i)) / (y1 - y0 || 1);
    }
  });
  geometry.setAttribute("uv", new BufferAttribute(uv, 2));
}

// Swap the model's dark placeholder for the editor canvas; returns an undo.
export function applyMonitorScreens(scene, onUpdate) {
  let screen = null;
  scene.traverse((part) => {
    if (part.isMesh && part.material?.name === "Monitor screens") screen = part;
  });
  if (!screen) return () => {};
  const { material } = screen;
  if (!screen.geometry.attributes.uv) screenUvs(screen.geometry);
  const previous = { map: material.map, color: material.color.clone() };
  const texture = drawMonitorScreens(onUpdate);
  material.map = texture;
  material.color.set("#ffffff");
  material.needsUpdate = true;
  return () => {
    material.map = previous.map;
    material.color.copy(previous.color);
    material.needsUpdate = true;
    texture.dispose();
  };
}
