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

// Little rough sketches for project blocks, drawn inside a box.
const sketches = {
  phone: (x, y) => [
    { rect: [x, y, 110, 190] },
    { path: [[x + 20, y + 40], [x + 90, y + 40]] },
    { path: [[x + 20, y + 75], [x + 75, y + 75]] },
    { path: [[x + 20, y + 110], [x + 85, y + 110]] },
    { circle: [x + 55, y + 165, 10] },
  ],
  browser: (x, y) => [
    { rect: [x, y, 300, 180] },
    { path: [[x, y + 34], [x + 300, y + 34]] },
    { circle: [x + 18, y + 17, 6] },
    { circle: [x + 38, y + 17, 6] },
    { path: [[x + 30, y + 150], [x + 90, y + 90], [x + 130, y + 120], [x + 200, y + 60], [x + 270, y + 150]] },
  ],
  wheel: (x, y) => [{ circle: [x + 95, y + 95, 90] }, { circle: [x + 95, y + 95, 55] }, ...spokes(x + 95, y + 95, 55, 90, 8)],
  pins: (x, y) => [
    { rect: [x, y + 10, 300, 170] },
    { path: [[x + 20, y + 120], [x + 120, y + 60], [x + 200, y + 140], [x + 290, y + 80]] },
    { circle: [x + 80, y + 70, 12] },
    { circle: [x + 210, y + 50, 12] },
    { circle: [x + 160, y + 130, 12] },
  ],
  chat: (x, y) => [
    { rect: [x, y, 220, 60] },
    { path: [[x + 30, y + 60], [x + 20, y + 85], [x + 55, y + 60]] },
    { rect: [x + 90, y + 100, 220, 60] },
    { path: [[x + 280, y + 160], [x + 295, y + 185], [x + 255, y + 160]] },
  ],
  loop: (x, y) => [
    { rect: [x + 20, y + 60, 90, 110] },
    { path: [[x + 10, y + 60], [x + 120, y + 60]] },
    { circle: [x + 230, y + 100, 75] },
    { arrow: [[x + 120, y + 110], [x + 155, y + 110]] },
    { arrow: [[x + 300, y + 80], [x + 296, y + 112]] },
  ],
  bars: (x, y) => [
    { path: [[x, y], [x, y + 180], [x + 300, y + 180]] },
    { rect: [x + 30, y + 110, 40, 70] },
    { rect: [x + 95, y + 70, 40, 110] },
    { rect: [x + 160, y + 90, 40, 90] },
    { rect: [x + 225, y + 30, 40, 150] },
  ],
  breath: (x, y) => [{ circle: [x + 95, y + 95, 90] }, { circle: [x + 95, y + 95, 60] }, { circle: [x + 95, y + 95, 30] }],
  up: (x, y) => [
    { path: [[x, y + 180], [x + 300, y + 180]] },
    { path: [[x + 10, y + 160], [x + 90, y + 120], [x + 150, y + 140], [x + 230, y + 60], [x + 290, y + 20]] },
    { arrow: [[x + 250, y + 40], [x + 292, y + 18]] },
  ],
  book: (x, y) => [
    { path: [[x + 150, y + 30], [x + 150, y + 180]] },
    { path: [[x, y + 40], [x + 150, y + 30], [x + 300, y + 40], [x + 300, y + 190], [x + 150, y + 180], [x, y + 190], [x, y + 40]] },
    { path: [[x + 30, y + 80], [x + 120, y + 74]] },
    { path: [[x + 180, y + 74], [x + 270, y + 80]] },
  ],
};

// Every project, newest first. Summaries are a first draft for Shiv to edit.
export const PROJECTS = [
  { title: "ELXR Creative", when: "Sep 2026", summary: ["agency site that feels like", "the work they sell"], stack: ["Next.js", "Three.js", "GSAP"], sketch: "browser", note: "pour into the city" },
  { title: "Life OS", when: "ongoing", summary: ["one iOS app for money,", "health and plans"], stack: ["Swift", "SwiftUI", "Supabase", "Plaid"], sketch: "phone", note: "the Today screen" },
  { title: "Astra", when: "Aug 2026", summary: ["real birth charts,", "Claude writes the reading"], stack: ["Next.js", "iOS", "Claude AI", "Supabase"], sketch: "wheel", note: "computed, never guessed" },
  { title: "WhyKnot", when: "Aug 2026", summary: ["where should a restaurant", "open next?"], stack: ["Next.js", "Supabase", "Data viz", "Fintech API"], sketch: "pins", note: "data, not instinct" },
  { title: "Contextual Intelligence", when: "Jul 2026", summary: ["an AI agent that lives", "in iMessage"], stack: ["Python", "LangGraph", "AI Agents", "iOS"], sketch: "chat", note: "just text it" },
  { title: "Trashee", when: "Jul 2026", summary: ["trash it, earn it:", "waste loop for India"], stack: ["React Native", "Next.js", "IoT", "Supabase"], sketch: "loop", note: "bin -> points" },
  { title: "SATistics", when: "Nov 2025", summary: ["SAT practice students", "actually want to open"], stack: ["Next.js", "Three.js", "FastAPI", "Claude AI"], sketch: "bars", note: "scores going up" },
  { title: "Inhale", when: "Feb 2025", summary: ["breathing + meditation,", "built on CalmPulse"], stack: ["React Native", "iOS", "Android", "Clerk"], sketch: "breath", note: "in... and out" },
  { title: "AuraMax", when: "Mar 2025", summary: ["micro-investing in local", "small businesses"], stack: ["React Native", "iOS", "Android", "Clerk"], sketch: "up", note: "community money" },
  { title: "Ghor Kalyug", when: "Dec 2024", summary: ["personal study tools", "for students"], stack: ["Node.js", "React", "Backend", "GCP"], sketch: "book", note: "study, your way" },
  { title: "Futeur AI", when: "Jan 2025", summary: ["business intelligence", "for small businesses"], stack: ["React", "UI/UX", "Branding"], sketch: "bars", note: "SME dashboards" },
  { title: "FuteurCred", when: "ongoing", summary: ["the Futeur AI experience", "on mobile"], stack: ["React Native", "Swift", "Android"], sketch: "phone", note: "credit, simplified" },
  { title: "CalmPulse", when: "Dec 2024", summary: ["guided breathing, inspired", "by the Apple Watch"], stack: ["Android", "UI/UX", "Firebase"], sketch: "breath", note: "breathe with it" },
  { title: "Finance Tracker", when: "Jul 2024", summary: ["simple personal money", "tracking"], stack: ["Swift", "iOS", "Firebase"], sketch: "phone", note: "where it all went" },
];

// One project in half a page (top = 200 for the upper block, 830 for the lower).
function projectBlock(project, top) {
  const items = [
    // Long titles shrink so they stay clear of the date column.
    { label: [80, top + 60, project.title, project.title.length > 16 ? 44 : 66] },
    { label: [700, top + 60, project.when, 36] },
    { label: [90, top + 120, project.summary[0], 44] },
    { label: [90, top + 165, project.summary[1], 44] },
    { label: [80, top + 235, "stack:", 38] },
  ];
  // Tech stack as boxed chips, wrapping across up to two rows.
  let x = 190;
  let row = 0;
  for (const tech of project.stack) {
    const width = tech.length * 17 + 36;
    if (x + width > 930) {
      row += 1;
      x = 190;
    }
    const y = top + 200 + row * 66;
    items.push({ rect: [x, y, width, 52] }, { label: [x + 18, y + 38, tech, 34] });
    x += width + 16;
  }
  items.push(...sketches[project.sketch](560, top + 360));
  items.push({ label: [110, top + 470, project.note, 40] });
  items.push({ arrow: [[400, top + 460], [530, top + 430]] });
  return items;
}

const projectPages = [];
for (let i = 0; i < PROJECTS.length; i += 2)
  projectPages.push({
    heading: `projects, ${i / 2 + 1}`,
    lines: [],
    sketch: [
      ...projectBlock(PROJECTS[i], 170),
      ...(PROJECTS[i + 1]
        ? [{ path: [[80, 805], [920, 805]] }, ...projectBlock(PROJECTS[i + 1], 820)]
        : []),
    ],
  });

export const PAGES = [
  {
    heading: "hi, I'm Shiv",
    lines: [
      "engineer in New York.",
      "Founding Engineer at",
      "   Contextual Intelligence.",
      "before: FuteurAI (wrapped May 12).",
      "",
      "music between builds,",
      "photos when the light is good.",
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
    heading: "my toolbox",
    lines: ["how I build:", "- ship small, ship often", "- write it down", "- make it feel good to use", "", "what I reach for:"],
    ring: true,
    sketch: [
      ...[
        ["Swift", "SwiftUI", "iOS"],
        ["Next.js", "React", "React Native"],
        ["Three.js", "GSAP", "Node.js"],
        ["Python", "FastAPI", "LangGraph"],
        ["Supabase", "Firebase", "GCP"],
        ["Claude AI", "Plaid", "Clerk"],
      ].flatMap((row, r) => {
        let x = 90;
        return row.flatMap((tech) => {
          const width = tech.length * 19 + 40;
          const chip = [{ rect: [x, 650 + r * 92, width, 62] }, { label: [x + 20, 650 + r * 92 + 44, tech, 38] }];
          x += width + 22;
          return chip;
        });
      }),
      { label: [560, 1290, "projects ->", 60] },
      { arrow: [[820, 1280], [920, 1280]] },
    ],
  },
  ...projectPages,
  {
    heading: "the rest",
    lines: [
      "every project, in detail:",
      "   shivvyas.com/projects",
      "",
      "photos:",
      "   awannabephotographer.shivvyas.com",
      "",
      "say hi: the contact page.",
    ],
    sketch: [
      { path: [[700, 1000], [725, 1060], [790, 1065], [740, 1105], [760, 1170], [700, 1132], [640, 1170], [660, 1105], [610, 1065], [675, 1060], [700, 1000]] },
      { label: [560, 1350, "- Shiv", 76] },
    ],
  },
];

export const SPREAD_COUNT = PAGES.length / 2;

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
