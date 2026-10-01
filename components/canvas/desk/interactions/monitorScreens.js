import { BufferAttribute, CanvasTexture, SRGBColorSpace } from "three";
import { BUILD_LOG, MONITOR_FILES, tokenize } from "../lib/monitorCode.mjs";

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

const LAPTOP_W = 1536;
const LAPTOP_H = 872;
const PROMPT = "shiv@MacBook-Pro shivvyas.com % ";
const COMMAND = "npm run build";
// Ticks are ~110 ms: type the command, stream the build, hold, start over.
const TYPE_TICKS = COMMAND.length;
const LINE_TICKS = 2;
const HOLD_TICKS = 40;
const CYCLE = TYPE_TICKS + 4 + BUILD_LOG.length * LINE_TICKS + HOLD_TICKS;

function terminalColor(line) {
  if (/✓/.test(line)) return "#3fb950";
  if (/▲/.test(line)) return "#ffffff";
  if (/^(Route|\+ First)/.test(line)) return "#d6d6dd";
  if (/^[┌├└ ]/.test(line) && /kB|B\s/.test(line)) return "#a9b1ba";
  return "#8b949e";
}

// The laptop: Cursor with pages/index.tsx open and the integrated terminal
// running this site's real `npm run build`, replayed on a loop.
function createLaptopScreen() {
  const canvas = document.createElement("canvas");
  canvas.width = LAPTOP_W;
  canvas.height = LAPTOP_H;
  const g = canvas.getContext("2d");
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.flipY = false;
  texture.anisotropy = 8;
  const file = MONITOR_FILES.laptop;
  let frame = 0;

  const draw = () => {
    const step = frame % CYCLE;
    g.fillStyle = C.editor;
    g.fillRect(0, 0, LAPTOP_W, LAPTOP_H);
    // Title bar and activity bar.
    g.fillStyle = C.chrome;
    g.fillRect(0, 0, LAPTOP_W, 36);
    ["#ff5f57", "#febc2e", "#28c840"].forEach((color, i) => {
      g.fillStyle = color;
      g.beginPath();
      g.arc(20 + i * 20, 18, 6, 0, Math.PI * 2);
      g.fill();
    });
    g.fillStyle = C.dim;
    g.font = `500 15px ${SANS}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("shivvyas.com — Cursor", LAPTOP_W / 2, 18);
    g.textAlign = "left";
    g.fillStyle = C.chrome;
    g.fillRect(0, 36, 46, LAPTOP_H - 60);
    // Sidebar.
    g.fillStyle = C.sidebar;
    g.fillRect(46, 36, 220, LAPTOP_H - 60);
    g.fillStyle = C.dim;
    g.font = `600 13px ${SANS}`;
    g.fillText("EXPLORER", 62, 58);
    g.font = `400 15px ${SANS}`;
    ["components", "data", "pages", "  _app.tsx", "  about.tsx", "  index.tsx", "  projects", "public", "scripts", "package.json", "next.config.js"].forEach((label, i) => {
      const y = 88 + i * 26;
      if (label.trim() === "index.tsx") {
        g.fillStyle = "#2a2d2e";
        g.fillRect(46, y - 13, 220, 26);
      }
      g.fillStyle = label.trim() === "index.tsx" ? "#fff" : C.text;
      g.fillText(label, 62, y);
    });

    // Editor (top) and terminal panel (bottom).
    const ex = 266;
    const split = 430;
    g.fillStyle = C.chrome;
    g.fillRect(ex, 36, LAPTOP_W - ex, 36);
    g.fillStyle = C.editor;
    g.fillRect(ex, 36, 170, 36);
    g.fillStyle = C.accent;
    g.fillRect(ex, 36, 170, 2);
    g.fillStyle = C.text;
    g.font = `500 15px ${SANS}`;
    g.fillText("index.tsx", ex + 36, 55);
    g.fillStyle = C.type;
    g.fillRect(ex + 14, 49, 12, 12);
    g.save();
    g.beginPath();
    g.rect(ex, 72, LAPTOP_W - ex, split - 72);
    g.clip();
    g.font = `400 16px ${MONO}`;
    file.lines.forEach((line, i) => {
      const y = 92 + i * 21;
      g.fillStyle = C.gutter;
      g.textAlign = "right";
      g.fillText(String(file.firstLine + i), ex + 44, y);
      g.textAlign = "left";
      let x = ex + 62;
      for (const run of tokenize(line, file.language)) {
        g.fillStyle = C[run.kind] ?? C.plain;
        g.fillText(run.text, x, y);
        x += g.measureText(run.text).width;
      }
    });
    g.restore();

    g.fillStyle = C.border;
    g.fillRect(ex, split, LAPTOP_W - ex, 1);
    g.fillStyle = C.editor;
    g.fillRect(ex, split + 1, LAPTOP_W - ex, LAPTOP_H - split - 25);
    g.font = `600 13px ${SANS}`;
    ["PROBLEMS", "OUTPUT", "DEBUG CONSOLE", "TERMINAL", "PORTS"].forEach((tab, i) => {
      const x = ex + 18 + i * 120;
      g.fillStyle = tab === "TERMINAL" ? C.text : C.dim;
      g.fillText(tab, x, split + 22);
      if (tab === "TERMINAL") {
        g.fillStyle = C.accent;
        g.fillRect(x, split + 36, g.measureText(tab).width, 2);
      }
    });
    g.fillStyle = C.dim;
    g.font = `400 13px ${SANS}`;
    g.textAlign = "right";
    g.fillText("zsh  +  ⌄  ⋯", LAPTOP_W - 20, split + 22);
    g.textAlign = "left";

    // Terminal content: the prompt, the command being typed, then the log.
    const typed = COMMAND.slice(0, Math.min(step, TYPE_TICKS));
    const shown = Math.max(0, Math.floor((step - TYPE_TICKS - 4) / LINE_TICKS));
    const lines = [{ text: PROMPT + typed, color: C.text, prompt: true }];
    BUILD_LOG.slice(0, Math.min(shown, BUILD_LOG.length)).forEach((text) => lines.push({ text, color: terminalColor(text) }));
    const done = shown >= BUILD_LOG.length;
    if (done) lines.push({ text: PROMPT, color: C.text, prompt: true });
    const lineH = 19;
    const top = split + 54;
    const fit = Math.floor((LAPTOP_H - 30 - top) / lineH);
    const visible = lines.slice(Math.max(0, lines.length - fit));
    g.font = `400 15px ${MONO}`;
    visible.forEach((line, i) => {
      const y = top + i * lineH;
      if (line.prompt) {
        g.fillStyle = "#3fb950";
        g.fillText(PROMPT, ex + 18, y);
        g.fillStyle = C.text;
        g.fillText(line.text.slice(PROMPT.length), ex + 18 + g.measureText(PROMPT).width, y);
      } else {
        g.fillStyle = line.color;
        g.fillText(line.text, ex + 18, y);
      }
    });
    // Block cursor on the last prompt line, blinking while idle.
    const last = visible[visible.length - 1];
    if (last?.prompt && (step < TYPE_TICKS || Math.floor(frame / 4) % 2 === 0)) {
      const y = top + (visible.length - 1) * lineH;
      g.fillStyle = C.text;
      g.fillRect(ex + 18 + g.measureText(last.text).width + 2, y - 9, 9, 18);
    }

    // Status bar.
    g.fillStyle = C.chrome;
    g.fillRect(0, LAPTOP_H - 24, LAPTOP_W, 24);
    g.fillStyle = C.dim;
    g.font = `400 13px ${SANS}`;
    g.fillText("⎇ main", 12, LAPTOP_H - 12);
    g.textAlign = "right";
    g.fillText("Ln 13, Col 8    TypeScript JSX    Cursor Tab", LAPTOP_W - 12, LAPTOP_H - 12);
    g.textAlign = "left";
    texture.needsUpdate = true;
  };

  draw();
  return {
    texture,
    tick: () => {
      frame += 1;
      draw();
      return true;
    },
  };
}

// Screens come out of the model as quads with no UVs (export drops them from
// untextured materials). Map each quad from its own bounds onto its share of
// the canvas, left to right: the two monitors split it in halves.
function quadUvs(geometry, quads) {
  const pos = geometry.attributes.position;
  // Quads are ordered by x; the right monitor can start just left of the
  // origin, so sort instead of testing signs.
  const order = Array.from({ length: pos.count }, (_, i) => i).sort((a, b) => pos.getX(a) - pos.getX(b));
  const per = pos.count / quads;
  const uv = new Float32Array(pos.count * 2);
  for (let q = 0; q < quads; q++) {
    const indices = order.slice(q * per, (q + 1) * per);
    const xs = indices.map((i) => pos.getX(i));
    const ys = indices.map((i) => pos.getY(i));
    const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
    const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
    for (const i of indices) {
      uv[i * 2] = (q + (pos.getX(i) - x0) / (x1 - x0 || 1)) / quads;
      uv[i * 2 + 1] = (y1 - pos.getY(i)) / (y1 - y0 || 1);
    }
  }
  geometry.setAttribute("uv", new BufferAttribute(uv, 2));
}

function findByMaterial(scene, name) {
  let found = null;
  scene.traverse((part) => {
    if (part.isMesh && part.material?.name === name) found = part;
  });
  return found;
}

function swapMap(mesh, texture) {
  const { material } = mesh;
  const previous = { map: material.map, color: material.color.clone() };
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

// Swap the model's dark placeholders for the canvases; returns an undo.
// The laptop's terminal replays the build, so `start`/`stop` drive it.
export function applyMonitorScreens(scene, onUpdate) {
  const undo = [];
  const monitors = findByMaterial(scene, "Monitor screens");
  if (monitors) {
    if (!monitors.geometry.attributes.uv) quadUvs(monitors.geometry, 2);
    undo.push(swapMap(monitors, drawMonitorScreens(onUpdate)));
  }
  const laptop = findByMaterial(scene, "Laptop screen");
  let screen = null;
  if (laptop) {
    if (!laptop.geometry.attributes.uv) quadUvs(laptop.geometry, 1);
    screen = createLaptopScreen();
    undo.push(swapMap(laptop, screen.texture));
  }
  return {
    tick: () => screen?.tick() ?? false,
    dispose: () => undo.forEach((fn) => fn()),
  };
}
