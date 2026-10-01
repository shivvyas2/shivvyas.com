import { CanvasTexture, NearestFilter, SRGBColorSpace } from "three";
import { PAGE_SIZE, pageResolution, sketchItems, wrapLines } from "../lib/diaryPages.mjs";

export const PAPER = "#efe6cf";
const INK = "#1f2c4c";

export async function loadDiaryFont(fontFamily) {
  try {
    await Promise.all([
      document.fonts.load(`400 60px ${fontFamily}`),
      document.fonts.load(`700 92px ${fontFamily}`),
    ]);
  } catch {
    // Falls back to the next family in the stack.
  }
}

function canvas(resolution, scale) {
  const { width, height } = resolution;
  const element = document.createElement("canvas");
  element.width = Math.round(width * scale);
  element.height = Math.round(height * scale);
  const g = element.getContext("2d");
  const pageScale = (width / PAGE_SIZE.width) * scale;
  g.scale(pageScale, pageScale);
  return { element, g };
}

function paper(g, seed) {
  g.fillStyle = PAPER;
  g.fillRect(0, 0, PAGE_SIZE.width, PAGE_SIZE.height);
  let s = seed * 9301 + 49297;
  const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  g.fillStyle = "rgba(90, 70, 40, 0.05)";
  for (let i = 0; i < 3500; i++) g.fillRect(rand() * PAGE_SIZE.width, rand() * PAGE_SIZE.height, 1.2, 1.2);
  g.strokeStyle = "rgba(70, 100, 150, 0.16)";
  g.lineWidth = 1.5;
  for (let y = 210; y < PAGE_SIZE.height - 60; y += 60) {
    g.beginPath();
    g.moveTo(40, y);
    g.lineTo(PAGE_SIZE.width - 40, y);
    g.stroke();
  }
}

function texture(element, srgb) {
  const result = new CanvasTexture(element);
  if (srgb) result.colorSpace = SRGBColorSpace;
  else {
    // The mask's red channel is a draw-order value, not a colour: filtering
    // or mipmapping would blend it with empty neighbours.
    result.minFilter = NearestFilter;
    result.magFilter = NearestFilter;
    result.generateMipmaps = false;
  }
  result.anisotropy = 4;
  return result;
}

export function drawBlankPage(compact = false, seed = 99) {
  const resolution = pageResolution(compact);
  const color = canvas(resolution, 1);
  paper(color.g, seed);
  const mask = canvas(resolution, resolution.maskScale);
  return { color: texture(color.element, true), mask: texture(mask.element, false) };
}

export function drawPage(page, index, fontFamily, compact = false) {
  const resolution = pageResolution(compact);
  const { element, g } = canvas(resolution, 1);
  paper(g, index + 1);
  g.fillStyle = INK;
  g.strokeStyle = INK;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.textBaseline = "alphabetic";

  // Long headings shrink to fit the page instead of running off the edge.
  let headingSize = 92;
  g.font = `700 ${headingSize}px ${fontFamily}`;
  while (headingSize > 56 && g.measureText(page.heading).width > 840) {
    headingSize -= 4;
    g.font = `700 ${headingSize}px ${fontFamily}`;
  }
  g.fillText(page.heading, 80, 150);
  g.font = `400 60px ${fontFamily}`;
  let y = 260;
  for (const line of page.lines)
    for (const wrapped of wrapLines(line, 840, (t) => g.measureText(t).width)) {
      g.fillText(wrapped, 90, y);
      y += 60;
    }

  if (page.ring) {
    g.strokeStyle = "rgba(120, 80, 40, 0.14)";
    g.lineWidth = 9;
    g.beginPath();
    g.arc(820, 230, 95, 0.3, Math.PI * 2 - 0.2);
    g.stroke();
    g.strokeStyle = INK;
  }

  const items = sketchItems(page, index);
  const mask = canvas(resolution, resolution.maskScale);
  const m = mask.g;
  m.lineCap = "round";
  m.lineJoin = "round";
  for (const item of items) {
    if (item.kind === "label") {
      g.font = `400 ${item.size}px ${fontFamily}`;
      g.fillText(item.text, item.x, item.y);
      m.font = `700 ${item.size}px ${fontFamily}`;
      m.fillStyle = `rgb(${Math.round(item.order1 * 255)}, 0, 0)`;
      m.strokeStyle = m.fillStyle;
      m.lineWidth = 6;
      m.strokeText(item.text, item.x, item.y);
      m.fillText(item.text, item.x, item.y);
      continue;
    }
    g.lineWidth = 4.5;
    g.beginPath();
    item.points.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
    g.stroke();
    // Mask: each segment carries the moment it is drawn, so the shader can
    // reveal strokes in order without re-uploading textures every frame.
    m.lineWidth = 16;
    const n = item.points.length - 1;
    for (let i = 0; i < n; i++) {
      const order = item.order0 + ((item.order1 - item.order0) * (i + 1)) / n;
      m.strokeStyle = `rgb(${Math.round(order * 255)}, 0, 0)`;
      m.beginPath();
      m.moveTo(...item.points[i]);
      m.lineTo(...item.points[i + 1]);
      m.stroke();
    }
  }

  g.font = `400 40px ${fontFamily}`;
  g.fillStyle = "rgba(31, 44, 76, 0.55)";
  g.textAlign = "center";
  g.fillText(String(index + 1), PAGE_SIZE.width / 2, PAGE_SIZE.height - 50);

  return { color: texture(element, true), mask: texture(mask.element, false) };
}
