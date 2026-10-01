// Shiv's diary. Copy is a first draft for Shiv to edit; coordinates are page
// units (1000 x 1500, origin top-left). Sketch items draw in array order.
export const PAGE_SIZE = Object.freeze({ width: 1000, height: 1500 });

const spokes = (cx, cy, r0, r1, n = 12) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return { path: [[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]] };
  });
const wave = (x0, x1, y, amp, step = 20) => {
  const points = [];
  for (let x = x0; x <= x1; x += step)
    points.push([x, y + Math.sin((x - x0) / 23) * amp * Math.sin(((x - x0) / (x1 - x0)) * Math.PI)]);
  return { path: points };
};

export const PAGES = [
  {
    heading: "hi, I'm Shiv",
    lines: [
      "engineer in New York.",
      "musician between builds.",
      "photographer when the light is good.",
      "",
      "I like the moment a rough idea",
      "starts feeling useful.",
    ],
    sketch: [
      { rect: [600, 1060, 260, 170] },
      { circle: [730, 1145, 55] },
      { path: [[640, 1060], [670, 1025], [740, 1025], [760, 1060]] },
      { label: [540, 1310, "always carrying one", 52] },
    ],
  },
  {
    heading: "things I keep coming back to",
    lines: ["- small, useful tools", "- making music", "- photographing the city", "- learning by building"],
    ring: true,
    sketch: [wave(130, 870, 1120, 70), { label: [150, 1300, "music between builds", 52] }],
  },
  {
    heading: "now",
    lines: ["Founding Engineer at", "Contextual Intelligence.", "", "building the product", "end to end."],
    sketch: [
      { rect: [140, 1000, 300, 200] },
      { arrow: [[460, 1100], [590, 1100]] },
      { circle: [710, 1100, 95] },
      { label: [210, 1280, "idea", 52] },
      { label: [610, 1280, "real thing", 52] },
    ],
  },
  {
    heading: "before + how I work",
    lines: ["FuteurAI, wrapped May 12.", "", "- ship small, ship often", "- write it down", "- make it feel good to use"],
    sketch: [
      { circle: [500, 1150, 170] },
      { arrow: [[640, 1050], [668, 1092]] },
      { arrow: [[360, 1250], [332, 1208]] },
      { label: [460, 955, "idea", 48] },
      { label: [700, 1165, "sketch", 48] },
      { label: [455, 1370, "ship", 48] },
      { label: [190, 1165, "learn", 48] },
    ],
  },
  {
    heading: "Life OS",
    lines: [
      "one OS, not 12 tabs.",
      "",
      "SwiftUI + LifeOSKit + Supabase",
      "Plaid -> OAuth -> universal link",
      "   (almanac.shivvyas.com)",
      "Coach reads across everything.",
    ],
    sketch: [
      { rect: [150, 1060, 40, 40] },
      { path: [[158, 1080], [172, 1094], [198, 1048]] },
      { label: [215, 1094, "handbook before code", 48] },
      { rect: [150, 1150, 40, 40] },
      { path: [[158, 1170], [172, 1184], [198, 1138]] },
      { label: [215, 1184, "TestFlight now", 48] },
    ],
  },
  {
    heading: "Life OS - rough sketch",
    lines: [],
    sketch: [
      { rect: [330, 200, 340, 620] },
      { label: [370, 280, "Today", 56] },
      { path: [[370, 330], [630, 330]] },
      { path: [[370, 400], [560, 400]] },
      { path: [[370, 460], [600, 460]] },
      { path: [[370, 520], [520, 520]] },
      { arrow: [[500, 830], [500, 930]] },
      { circle: [180, 1010, 70] },
      { label: [125, 1020, "Money", 40] },
      { circle: [400, 1050, 70] },
      { label: [345, 1060, "Health", 40] },
      { circle: [620, 1050, 70] },
      { label: [580, 1060, "Plan", 40] },
      { circle: [830, 1010, 65] },
      { label: [785, 1020, "Notes", 40] },
      { arrow: [[220, 1075], [430, 1290]] },
      { arrow: [[410, 1120], [470, 1260]] },
      { arrow: [[610, 1120], [540, 1260]] },
      { arrow: [[790, 1070], [580, 1290]] },
      { circle: [500, 1330, 85] },
      { label: [440, 1345, "Coach", 48] },
    ],
  },
  {
    heading: "Astra",
    lines: [
      "computed, never guessed.",
      "",
      "birth date + time + place",
      "   -> a real chart",
      "Swiss Ephemeris (wasm)",
      "Claude writes the reading",
      "   from verified positions only.",
      "web + iOS, one Supabase backend.",
    ],
    ring: true,
    sketch: [
      { path: [[700, 1180], [725, 1240], [790, 1245], [740, 1285], [760, 1350], [700, 1312], [640, 1350], [660, 1285], [610, 1245], [675, 1240], [700, 1180]] },
      { label: [430, 1430, "astra.shivvyas.com", 46] },
    ],
  },
  {
    heading: "Astra - rough sketch",
    lines: [],
    sketch: [
      { circle: [320, 520, 230] },
      { circle: [320, 520, 150] },
      ...spokes(320, 520, 150, 230),
      { circle: [250, 470, 14] },
      { circle: [390, 600, 14] },
      { circle: [360, 420, 14] },
      { arrow: [[570, 520], [690, 520]] },
      { rect: [700, 430, 230, 180] },
      { label: [725, 535, "Claude", 54] },
      { arrow: [[815, 620], [815, 790]] },
      { rect: [705, 800, 220, 380] },
      { path: [[735, 870], [895, 870]] },
      { path: [[735, 930], [870, 930]] },
      { path: [[735, 990], [890, 990]] },
      { label: [720, 1240, "your reading", 44] },
      { label: [140, 860, "chart first,", 50] },
      { label: [140, 920, "words second", 50] },
      { label: [560, 1400, "- Shiv", 72] },
    ],
  },
];

const rng = (seed) => {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296) * 2 - 1;
};
const clampPoint = ([x, y]) => [
  Math.min(PAGE_SIZE.width, Math.max(0, x)),
  Math.min(PAGE_SIZE.height, Math.max(0, y)),
];
const polygon = (cx, cy, r, n = 40) =>
  Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * r]);

function strokesOf(item) {
  if (item.path) return [item.path];
  if (item.rect) {
    const [x, y, w, h] = item.rect;
    return [[[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]];
  }
  if (item.circle) return [polygon(...item.circle)];
  if (item.arrow) {
    const [[x1, y1], [x2, y2]] = item.arrow;
    const a = Math.atan2(y2 - y1, x2 - x1);
    const head = (da) => [x2 - Math.cos(a + da) * 28, y2 - Math.sin(a + da) * 28];
    return [[[x1, y1], [x2, y2]], [head(0.5), [x2, y2], head(-0.5)]];
  }
  return [];
}

const lengthOf = (points) =>
  points.reduce((sum, p, i) => (i ? sum + Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) : 0), 0);

export function sketchItems(page, pageIndex) {
  const rand = rng(pageIndex + 1);
  const raw = [];
  for (const item of page.sketch) {
    if (item.label) {
      const [x, y, text, size] = item.label;
      raw.push({ kind: "label", x, y, text, size, cost: text.length * size * 0.6 });
      continue;
    }
    for (const stroke of strokesOf(item)) {
      // Hand wobble: subdivide long segments, nudge every point a little.
      const points = [];
      stroke.forEach((p, i) => {
        if (i > 0) {
          const prev = stroke[i - 1];
          const steps = Math.max(1, Math.round(Math.hypot(p[0] - prev[0], p[1] - prev[1]) / 40));
          for (let s = 1; s < steps; s++) {
            const t = s / steps;
            points.push([prev[0] + (p[0] - prev[0]) * t, prev[1] + (p[1] - prev[1]) * t]);
          }
        }
        points.push(p);
      });
      const jittered = points.map(([x, y]) => clampPoint([x + rand() * 3, y + rand() * 3]));
      raw.push({ kind: "stroke", points: jittered, cost: Math.max(1, lengthOf(jittered)) });
    }
  }
  const total = raw.reduce((sum, item) => sum + item.cost, 0);
  let at = 0;
  return raw.map(({ cost, ...item }, i) => {
    const order0 = at / total;
    at += cost;
    return { ...item, order0, order1: i === raw.length - 1 ? 1 : at / total };
  });
}

export function wrapLines(text, maxWidth, measure) {
  if (!text) return [""];
  const out = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > maxWidth) {
      out.push(line);
      line = word;
    } else line = next;
  }
  out.push(line);
  return out;
}

const pageText = (page) =>
  [page.heading, ...page.lines, ...page.sketch.filter((i) => i.label).map((i) => i.label[2])]
    .filter(Boolean)
    .join(". ");

export const spreadText = (spread) => `${pageText(PAGES[spread * 2])}. ${pageText(PAGES[spread * 2 + 1])}`;

// Page canvas size. Phones show one page across ~800 CSS px at dpr 1, so half
// resolution keeps text sharp while using a quarter of the memory.
export const pageResolution = (compact) =>
  compact ? { width: 683, height: 1024, maskScale: 0.5 } : { width: 1366, height: 2048, maskScale: 0.5 };
