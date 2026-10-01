import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import {
  mergeGeometries,
  mergeVertices,
} from "three/addons/utils/BufferGeometryUtils.js";
import { copyFile, mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO, getBounds } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, meshopt, mergeDocuments, prune, unpartition } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";

// Rebuild the ACTIVE desk asset from Shiv's reference setup. Units are metres
// scaled for the hero. Static geometry is merged by material; interactive groups keep their own nodes.
const destination = fileURLToPath(
  new URL("../../public/desktop_pc/", import.meta.url),
);
const scene = new THREE.Scene();
scene.name = "Shiv Vyas — coding and music studio";
const material = (name, color, roughness = 0.5, metalness = 0) => {
  const value = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  value.name = name;
  return value;
};
const mats = {
  walnut: material("Warm walnut desktop", "#694129", 0.48),
  edge: material("Walnut end grain", "#422b20", 0.56),
  grain: material("Fine wood grain", "#553622", 0.7),
  leather: material("Cognac desk mat", "#a77d4d", 0.92),
  graphite: material("Anodized graphite", "#24272b", 0.34, 0.65),
  black: material("Soft black polymer", "#111316", 0.57),
  silver: material("Brushed silver aluminum", "#aeb4b8", 0.28, 0.78),
  white: material("Warm white accessories", "#d9dad3", 0.32),
  key: material("Slate keycaps", "#50585a", 0.64),
  keyLight: material("Light gray keycaps", "#9caaa9", 0.62),
  legend: material("Key legends", "#c7d0ce", 0.75),
  orange: material("Signature orange accent", "#f44e00", 0.36, 0.18),
  red: material("Audio interface red aluminum", "#86291d", 0.36, 0.65),
  cream: material("Cream ceramic", "#d7c491", 0.25),
  coffee: material("Coffee", "#1b100b", 0.2),
  paper: material("Book pages", "#e5ddc5", 0.85),
  teal: material("Book jacket", "#215153", 0.78),
  rubber: material("Rubber cable and cushions", "#0b0d0e", 0.86),
  grille: material("Microphone steel grille", "#85898b", 0.43, 0.72),
  screen: material("Laptop display glass", "#0e161e", 0.24),
  lens: material("Lens matte black", "#151618", 0.62, 0.1),
  glass: material("Lens front glass", "#20314a", 0.08, 0.4),
};
const unlit = (name, color) => {
  const value = new THREE.MeshBasicMaterial({ color });
  value.name = name;
  return value;
};
mats.wallpaper = unlit("Manhattan wallpaper", "#ffffff");
mats.code = unlit("Editor text", "#a4bac7");
mats.syntax = unlit("Editor syntax orange", "#f29656");
mats.codeBlue = unlit("Editor syntax blue", "#6f9fb2");
mats.ui = unlit("Editor panels", "#1c2631");
mats.led = unlit("Warm status LEDs", "#ff8945");
mats.green = unlit("Audio meter green", "#a0c59a");

const geometryCache = new Map();
const rounded = (w, h, d, radius = 0.025) => {
  const key = [w, h, d, radius].join(",");
  if (!geometryCache.has(key))
    geometryCache.set(
      key,
      radius <= 0.003
        ? new THREE.BoxGeometry(w, h, d)
        : new RoundedBoxGeometry(
            w,
            h,
            d,
            w < 0.3 ? 1 : 2,
            Math.min(radius, w / 2, h / 2, d / 2),
          ),
    );
  return geometryCache.get(key);
};
function mesh(
  name,
  geometry,
  mat,
  position,
  parent = scene,
  rotation = [0, 0, 0],
) {
  const result = new THREE.Mesh(geometry, mat);
  result.name = name;
  result.position.set(...position);
  result.rotation.set(...rotation);
  parent.add(result);
  return result;
}
const box = (
  name,
  size,
  position,
  mat,
  parent = scene,
  radius = 0.02,
  rotation,
) => mesh(name, rounded(...size, radius), mat, position, parent, rotation);
const cylinder = (
  name,
  radius,
  height,
  position,
  mat,
  parent = scene,
  rotation,
) =>
  mesh(
    name,
    new THREE.CylinderGeometry(radius, radius, height, 24),
    mat,
    position,
    parent,
    rotation,
  );
function group(name, position, rotation = [0, 0, 0], parent = scene) {
  const result = new THREE.Group();
  result.name = name;
  result.position.set(...position);
  result.rotation.set(...rotation);
  parent.add(result);
  return result;
}
// Interactive groups are exported as their own nodes (merged per material
// inside), so the runtime can move them. Everything else is batched statically.
function interactive(object) {
  object.userData.interactive = true;
  return object;
}
function rod(name, start, end, radius, mat, parent = scene) {
  const a = new THREE.Vector3(...start),
    b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const result = cylinder(
    name,
    radius,
    direction.length(),
    a.clone().add(b).multiplyScalar(0.5).toArray(),
    mat,
    parent,
  );
  result.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );
  return result;
}
function cable(name, points, radius = 0.013, parent = scene) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
  );
  return mesh(
    name,
    new THREE.TubeGeometry(curve, 32, radius, 6, false),
    mats.rubber,
    [0, 0, 0],
    parent,
  );
}

// A warm, bevelled wooden worktop and the large tan mat in the reference.
box(
  "Solid walnut worktop",
  [7.15, 0.16, 3.05],
  [0, -0.08, 0],
  mats.walnut,
  scene,
  0.065,
);
box(
  "Desktop lower edge",
  [7.02, 0.055, 2.94],
  [0, -0.175, 0],
  mats.edge,
  scene,
  0.025,
);
box(
  "Cognac desk mat",
  [5.87, 0.023, 2.24],
  [0.12, 0.017, 0.21],
  mats.leather,
  scene,
  0.07,
);
for (let i = 0; i < 17; i++) {
  const z = -1.46 + i * 0.175;
  box(
    "Wood grain inlay",
    [6.88, 0.0015, 0.006],
    [Math.sin(i) * 0.03, 0.001, z],
    mats.grain,
    scene,
    0.001,
  );
}
// Visible mounting rail and short lower frame give the floating worktop depth.
box("Underdesk frame", [5.9, 0.16, 0.13], [0, -0.29, -0.72], mats.black);
for (const x of [-2.77, 2.77]) {
  box(
    "Desk frame bracket",
    [0.19, 0.37, 1.7],
    [x, -0.31, 0],
    mats.graphite,
    scene,
    0.03,
  );
}

function monitor(name, x, y, z, width, height, silver, angle) {
  const root = group(name, [x, y, z], [0, angle, 0]);
  const finish = silver ? mats.silver : mats.black;
  box(
    "Slim monitor housing",
    [width, height, 0.1],
    [0, 0, 0],
    finish,
    root,
    0.035,
  );
  box(
    "Black screen bezel",
    [width - 0.035, height - 0.045, 0.023],
    [0, 0.009, 0.058],
    mats.black,
    root,
    0.018,
  );
  const screenGeometry = new THREE.PlaneGeometry(width - 0.14, height - 0.15);
  // glTF image coordinates start at the top-left; the Three.js plane starts
  // at the bottom-left. The external JPEG is intentionally left unmodified.
  const uv = screenGeometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
  mesh(
    "New York screen",
    screenGeometry,
    mats.wallpaper,
    [0, 0.024, 0.073],
    root,
  );
  box(
    "Lower chin",
    [width - 0.04, 0.047, 0.012],
    [0, -height / 2 + 0.029, 0.073],
    finish,
    root,
    0.006,
  );
  box(
    "Monitor status light",
    [0.022, 0.006, 0.006],
    [width / 2 - 0.16, -height / 2 + 0.035, 0.083],
    mats.led,
    root,
    0.002,
  );
  box(
    "Rear VESA bracket",
    [0.31, 0.33, 0.17],
    [0, -0.11, -0.105],
    mats.graphite,
    root,
    0.035,
  );
  cylinder(
    "Monitor support",
    0.061,
    y - height / 2 + 0.07,
    [0, -height / 2 - (y - height / 2) / 2, 0.015],
    finish,
    root,
  );
  box(
    "Weighted monitor foot",
    [0.63, 0.052, 0.49],
    [0, -y + 0.043, 0.16],
    finish,
    root,
    0.06,
  );
  cable(
    "Monitor power cable",
    [
      [0.12, -0.2, -0.13],
      [0.15, -0.65, -0.19],
      [0.21, -y + 0.045, -0.12],
      [0.5, -y + 0.04, 0.05],
    ],
    0.012,
    root,
  );
}
monitor("Left black monitor", -1.61, 1.68, -0.89, 2.76, 1.63, false, 0.08);
monitor("Right silver monitor", 1.37, 1.78, -0.98, 3.01, 1.75, true, -0.055);

// The open laptop sits between the two large displays, with a modeled editor.
const laptop = group("Center laptop", [0, 0.066, 0.26]);
box(
  "Laptop lower shell",
  [1.65, 0.057, 1.03],
  [0, 0.025, 0],
  mats.graphite,
  laptop,
  0.035,
);
box(
  "Laptop bevel",
  [1.63, 0.022, 1.01],
  [0, 0.063, 0],
  mats.silver,
  laptop,
  0.03,
);
box(
  "Laptop palm deck",
  [1.6, 0.011, 0.98],
  [0, 0.078, 0],
  mats.graphite,
  laptop,
  0.02,
);
box(
  "Glass trackpad",
  [0.52, 0.006, 0.3],
  [0, 0.087, 0.285],
  mats.silver,
  laptop,
  0.018,
);
cylinder("Laptop hinge", 0.036, 1.48, [0, 0.068, -0.46], mats.black, laptop, [
  0,
  0,
  Math.PI / 2,
]);
const lid = group("Laptop screen", [0, 0.07, -0.46], [-0.15, 0, 0], laptop);
box(
  "Display housing",
  [1.66, 1.03, 0.045],
  [0, 0.516, 0],
  mats.graphite,
  lid,
  0.035,
);
box(
  "Display black border",
  [1.6, 0.974, 0.012],
  [0, 0.526, 0.027],
  mats.black,
  lid,
  0.02,
);
box(
  "Code editor display",
  [1.51, 0.864, 0.006],
  [0, 0.529, 0.035],
  mats.screen,
  lid,
  0.007,
);
box(
  "Camera notch",
  [0.14, 0.028, 0.009],
  [0, 0.998, 0.03],
  mats.black,
  lid,
  0.008,
);
box(
  "Editor sidebar",
  [0.24, 0.78, 0.003],
  [-0.622, 0.523, 0.04],
  mats.ui,
  lid,
  0.002,
);
box(
  "Editor titlebar",
  [1.49, 0.054, 0.003],
  [0, 0.929, 0.041],
  mats.ui,
  lid,
  0.002,
);
for (let i = 0; i < 3; i++)
  mesh(
    "Window control",
    new THREE.CircleGeometry(0.012, 12),
    [mats.syntax, mats.cream, mats.green][i],
    [-0.698 + i * 0.038, 0.93, 0.044],
    lid,
  );
const lengths = [
  0.27, 0.41, 0.19, 0.36, 0.31, 0.22, 0.43, 0.32, 0.24, 0.39, 0.28, 0.36, 0.21,
  0.3, 0.41,
];
for (let row = 0; row < 15; row++) {
  const y = 0.855 - row * 0.045;
  box(
    "Editor file entry",
    [0.07 + (row % 3) * 0.021, 0.007, 0.002],
    [-0.636, y, 0.044],
    row === 2 ? mats.syntax : mats.codeBlue,
    lid,
    0.001,
  );
  const indent = row % 5 === 0 ? 0 : 0.055;
  box(
    "Code keyword",
    [0.09, 0.009, 0.002],
    [-0.422 + indent, y, 0.044],
    row % 3 === 0 ? mats.syntax : mats.codeBlue,
    lid,
    0.001,
  );
  box(
    "Code statement",
    [lengths[row], 0.009, 0.002],
    [-0.31 + indent + lengths[row] / 2, y, 0.044],
    mats.code,
    lid,
    0.001,
  );
  if (row % 3 !== 1)
    box(
      "Code argument",
      [0.1, 0.009, 0.002],
      [0.27, y, 0.044],
      mats.syntax,
      lid,
      0.001,
    );
}
box(
  "Editor statusbar",
  [1.48, 0.018, 0.002],
  [0, 0.105, 0.041],
  mats.syntax,
  lid,
  0.001,
);
for (let row = 0; row < 5; row++)
  for (let col = 0; col < 13; col++) {
    box(
      "Laptop key",
      [0.099, 0.013, 0.079],
      [-0.66 + col * 0.11, 0.094, -0.3 + row * 0.09],
      mats.black,
      laptop,
      0.005,
    );
  }
box(
  "Laptop spacebar",
  [0.52, 0.013, 0.064],
  [0, 0.094, 0.106],
  mats.black,
  laptop,
  0.005,
);

// Mechanical keyboard case; keycaps are instanced at runtime (keyboardLayout.mjs).
const keyboard = interactive(
  group("Interactive_Keyboard", [0.04, 0.073, 1.0], [-0.035, 0, 0]),
);
box(
  "Keyboard aluminum case",
  [1.87, 0.105, 0.69],
  [0, 0.035, 0],
  mats.black,
  keyboard,
  0.035,
);
box(
  "Keyboard mounting plate",
  [1.81, 0.024, 0.64],
  [0, 0.102, 0],
  mats.graphite,
  keyboard,
  0.018,
);
cable("Keyboard cable", [
  [-0.69, 0.1, 0.68],
  [-0.83, 0.07, 0.49],
  [-1.07, 0.052, 0.39],
  [-0.84, 0.05, 0.08],
  [-0.75, 0.12, 0.02],
]);

// White trackpad and sculpted ergonomic mouse.
box(
  "Trackpad aluminum",
  [0.83, 0.041, 0.59],
  [-1.53, 0.061, 1.0],
  mats.silver,
  scene,
  0.045,
);
box(
  "Trackpad glass",
  [0.8, 0.013, 0.56],
  [-1.53, 0.088, 1.0],
  mats.white,
  scene,
  0.038,
);
const mouse = interactive(
  group("Interactive_Mouse", [1.38, 0.1, 1.02], [0, -0.12, 0]),
);
const mouseBody = mesh(
  "Mouse curved shell",
  new THREE.SphereGeometry(1, 24, 16),
  mats.white,
  [0, 0.042, 0],
  mouse,
);
mouseBody.scale.set(0.17, 0.137, 0.25);
box("Mouse base", [0.32, 0.04, 0.46], [0, -0.005, 0], mats.silver, mouse, 0.07);
box(
  "Mouse button seam",
  [0.008, 0.055, 0.16],
  [0, 0.157, -0.055],
  mats.silver,
  mouse,
  0.003,
);
cylinder(
  "Mouse scroll wheel",
  0.027,
  0.031,
  [0, 0.17, -0.015],
  mats.graphite,
  mouse,
  [0, 0, Math.PI / 2],
);

// Cream mug, modeled hollow rim and handle.
const mug = group("Coffee mug", [2.12, 0.035, 0.72]);
const profile = [
  [0, 0],
  [0.18, 0],
  [0.2, 0.035],
  [0.208, 0.43],
  [0.2, 0.46],
  [0.169, 0.46],
  [0.166, 0.055],
  [0, 0.055],
].map(([x, y]) => new THREE.Vector2(x, y));
mesh(
  "Ceramic cup",
  new THREE.LatheGeometry(profile, 32),
  mats.cream,
  [0, 0, 0],
  mug,
);
mesh(
  "Coffee surface",
  new THREE.CircleGeometry(0.167, 32),
  mats.coffee,
  [0, 0.402, 0],
  mug,
  [-Math.PI / 2, 0, 0],
);
mesh(
  "Ceramic handle",
  new THREE.TorusGeometry(0.122, 0.036, 10, 24, Math.PI * 1.68),
  mats.cream,
  [0.202, 0.237, 0],
  mug,
  [0, 0, -Math.PI * 0.84],
);

// Red and black audio interfaces beside the laptop.
// Starts at x=0.915, clear of the laptop base (x <= 0.825) and its lid.
const audio = group("Audio interfaces", [1.32, 0.09, -0.34]);
box(
  "Black audio interface",
  [0.81, 0.16, 0.45],
  [0, 0, 0],
  mats.black,
  audio,
  0.02,
);
box(
  "Red audio interface",
  [0.77, 0.13, 0.43],
  [0, 0.16, -0.02],
  mats.red,
  audio,
  0.02,
);
for (const y of [-0.01, 0.15]) {
  box(
    "Audio faceplate",
    [0.76, 0.104, 0.014],
    [0, y, 0.231],
    mats.graphite,
    audio,
    0.004,
  );
  for (const x of [-0.25, -0.03, 0.24]) {
    cylinder(
      "Audio gain knob",
      x === 0.24 ? 0.052 : 0.031,
      0.038,
      [x, y, 0.256],
      mats.black,
      audio,
      [Math.PI / 2, 0, 0],
    );
    box(
      "Audio level marker",
      [0.006, 0.027, 0.003],
      [x, y + 0.008, 0.278],
      mats.legend,
      audio,
      0.001,
    );
  }
  box(
    "Audio signal LED",
    [0.016, 0.015, 0.004],
    [0.1, y, 0.244],
    mats.green,
    audio,
    0.002,
  );
}
// Compact round white speaker to the left of the laptop.
cylinder("Speaker stand", 0.16, 0.025, [-0.99, 0.035, -0.43], mats.silver);
cylinder(
  "Speaker round body",
  0.18,
  0.055,
  [-0.99, 0.236, -0.42],
  mats.silver,
  scene,
  [Math.PI / 2, 0, 0],
);
cylinder(
  "Speaker fabric face",
  0.168,
  0.009,
  [-0.99, 0.236, -0.384],
  mats.white,
  scene,
  [Math.PI / 2, 0, 0],
);

// Right-hand articulated recording arm. Pivot groups let the runtime bend it:
// Base (yaw) > Lower (shoulder pitch) > Upper (elbow pitch) > Head (kept level).
const ELBOW = [0, 1.09, -0.15];
const TIP = [-0.11, 2.05, -0.63];
const from = (origin, point) => point.map((v, i) => v - origin[i]);
const micBase = interactive(group("Interactive_Mic_Base", [3.24, 0.018, 0.51]));
const micLower = interactive(group("Interactive_Mic_Lower", [0, 0, 0], [0, 0, 0], micBase));
const micUpper = interactive(group("Interactive_Mic_Upper", ELBOW, [0, 0, 0], micLower));
const micHead = interactive(
  group("Interactive_Mic_Head", from(ELBOW, TIP), [0, 0, 0], micUpper),
);

box("Desk microphone clamp", [0.2, 0.11, 0.32], [0, -0.032, 0], mats.black, micBase, 0.015);

rod("Mic upright", [0, 0, 0], ELBOW, 0.037, mats.black, micLower);
rod("Mic arm parallel", [0.105, 0.34, -0.044], [0.105, 1.09, -0.15], 0.018, mats.black, micLower);
cylinder("Microphone arm pivot", 0.063, 0.125, [0, 0.15, -0.02], mats.graphite, micLower, [0, 0, Math.PI / 2]);
for (let i = 0; i < 17; i++)
  mesh(
    "Arm tension spring",
    new THREE.TorusGeometry(0.033, 0.006, 5, 10),
    mats.silver,
    [0.084, 0.27 + i * 0.026, -0.04 - i * 0.0036],
    micLower,
    [Math.PI / 2, 0, 0],
  );
cable("Microphone cable lower", [[0, 1.15, -0.17], [0, 0.3, -0.01], [-0.26, 0.1, -0.04]], 0.015, micLower);

rod("Mic arm upper", [0, 0, 0], from(ELBOW, TIP), 0.037, mats.graphite, micUpper);
rod("Mic upper parallel", [0.105, 0, 0], from(ELBOW, [-0.005, 2.05, -0.63]), 0.018, mats.black, micUpper);
for (const p of [[0, 0, 0], from(ELBOW, TIP)])
  cylinder("Microphone arm pivot", 0.063, 0.125, p, mats.graphite, micUpper, [0, 0, Math.PI / 2]);
cable(
  "Microphone cable upper",
  [[-0.29, 0.86, -0.5], [-0.39, 0.54, -0.46], [-0.18, 0.3, -0.27], [0, 0.06, -0.02]],
  0.015,
  micUpper,
);

const capsule = group("Microphone capsule", from(TIP, [-0.29, 2.08, -0.65]), [0, 0, -0.24], micHead);
cylinder("Microphone barrel", 0.075, 0.22, [0, 0, 0], mats.graphite, capsule);
cylinder("Microphone mesh grille", 0.079, 0.23, [0, 0.217, 0], mats.grille, capsule);
for (let i = 0; i < 12; i++)
  mesh(
    "Grille horizontal wire",
    new THREE.TorusGeometry(0.08, 0.003, 4, 16),
    mats.graphite,
    [0, 0.118 + i * 0.018, 0],
    capsule,
    [Math.PI / 2, 0, 0],
  );
mesh(
  "Microphone shock mount",
  new THREE.TorusGeometry(0.113, 0.012, 8, 20),
  mats.black,
  [0, -0.04, 0],
  capsule,
  [Math.PI / 2, 0, 0],
);
rod("Pop filter stem", from(TIP, [-0.22, 1.76, -0.59]), from(TIP, [-0.51, 2.01, -0.49]), 0.012, mats.black, micHead);
cylinder("Round pop filter", 0.148, 0.023, from(TIP, [-0.51, 2.18, -0.47]), mats.rubber, micHead, [Math.PI / 2, 0, -0.15]);
mesh(
  "Pop filter rim",
  new THREE.TorusGeometry(0.148, 0.011, 8, 24),
  mats.graphite,
  from(TIP, [-0.51, 2.18, -0.455]),
  micHead,
);

// Shiv's diary: page block and back cover stay put; the front cover hinges on
// the spine so the runtime can open it. The phone and desk controller follow.
const diary = interactive(group("Interactive_Diary", [-2.75, 0.05, 0.89], [0, -0.16, 0]));
box("Book paper", [0.6, 0.067, 0.9], [0, 0.033, 0], mats.paper, diary, 0.008);
box("Teal book cover", [0.64, 0.013, 0.93], [0, -0.006, 0], mats.teal, diary, 0.008);
box("Book spine band", [0.023, 0.085, 0.93], [-0.31, 0.035, 0], mats.orange, diary, 0.003);
const diaryCover = interactive(group("Interactive_Diary_Cover", [-0.31, 0.075, 0], [0, 0, 0], diary));
box("Teal book cover", [0.64, 0.013, 0.93], [0.31, 0, 0], mats.teal, diaryCover, 0.008);
for (let i = 0; i < 4; i++)
  box(
    "Book cover lettering",
    [0.27 - i * 0.04, 0.002, 0.012],
    [0.35, 0.008, -0.22 + i * 0.06],
    mats.paper,
    diaryCover,
    0.001,
  );
const phone = group("Phone", [2.72, 0.058, 0.09], [0, -0.25, 0]);
box(
  "Phone metal frame",
  [0.31, 0.045, 0.64],
  [0, 0, 0],
  mats.graphite,
  phone,
  0.04,
);
box(
  "Phone dark glass",
  [0.29, 0.008, 0.615],
  [0, 0.027, 0],
  mats.black,
  phone,
  0.03,
);
box(
  "Standing desk control",
  [0.66, 0.1, 0.19],
  [2.29, -0.2, 1.34],
  mats.black,
  scene,
  0.02,
);
for (let i = 0; i < 4; i++)
  box(
    "Desk controller button",
    [0.062, 0.036, 0.008],
    [2.1 + i * 0.11, -0.2, 1.441],
    mats.legend,
    scene,
    0.005,
  );

// An orange back-edge strip catches the scene lighting without RGB clutter.
box(
  "Warm rear light strip",
  [6.4, 0.008, 0.02],
  [0, -0.05, -1.518],
  mats.led,
  scene,
  0.003,
);

// Shiv's Sony a6400-style body with the Tamron 70-300 telephoto, resting on
// the back-left of the desk. Proportions follow the real kit at the desk's
// ~6x scale (body 120 x 67 x 50 mm, lens 148 mm x 77 mm + hood). Local +Z is
// the lens axis, the LCD faces -Z and the grip is on -X (right-hand side seen
// from behind), so the runtime can pick it up and turn the screen to the viewer.
const cameraRig = interactive(
  group("Interactive_Camera", [-2.86, 0.05, -0.12], [0, Math.PI / 2 - 0.32, 0]),
);
// Body: a slim slab with a flat top; the grip bulges forward on the right.
box("Camera body", [0.72, 0.4, 0.22], [0, 0.2, 0], mats.black, cameraRig, 0.03);
box("Camera grip", [0.19, 0.4, 0.17], [-0.265, 0.2, 0.18], mats.rubber, cameraRig, 0.07);
box("Camera EVF hump", [0.2, 0.06, 0.2], [0.24, 0.42, -0.01], mats.black, cameraRig, 0.02);
box("Camera viewfinder eyecup", [0.16, 0.1, 0.05], [0.24, 0.355, -0.125], mats.rubber, cameraRig, 0.02);
box("Camera hot shoe", [0.13, 0.015, 0.11], [0.02, 0.405, 0], mats.silver, cameraRig, 0.004);
cylinder("Camera mode dial", 0.06, 0.05, [-0.17, 0.425, -0.03], mats.graphite, cameraRig);
cylinder("Camera control dial", 0.05, 0.035, [-0.06, 0.415, -0.07], mats.graphite, cameraRig);
cylinder("Camera shutter button", 0.035, 0.03, [-0.28, 0.41, 0.2], mats.silver, cameraRig);
box("Camera LCD bezel", [0.5, 0.31, 0.012], [0.05, 0.19, -0.114], mats.graphite, cameraRig, 0.008);
box("Camera mount plate", [0.34, 0.34, 0.01], [0.06, 0.2, 0.113], mats.graphite, cameraRig, 0.02);
// Lens, from the mount forward: silver mount ring, rear barrel, ribbed zoom
// ring, mid barrel, focus ring, flared front barrel, front glass, round hood.
const LENS_X = 0.06;
const LENS_Y = 0.2;
const lensPart = (name, radius, length, z, mat) =>
  cylinder(name, radius, length, [LENS_X, LENS_Y, z], mat, cameraRig, [Math.PI / 2, 0, 0]);
lensPart("Lens mount ring", 0.185, 0.04, 0.135, mats.silver);
lensPart("Lens rear barrel", 0.19, 0.18, 0.245, mats.lens);
lensPart("Lens zoom ring", 0.212, 0.3, 0.485, mats.rubber);
for (let i = 0; i < 8; i++)
  mesh(
    "Lens zoom rib",
    new THREE.TorusGeometry(0.214, 0.005, 3, 24),
    mats.lens,
    [LENS_X, LENS_Y, 0.36 + i * 0.035],
    cameraRig,
  );
lensPart("Lens mid barrel", 0.205, 0.16, 0.715, mats.lens);
lensPart("Lens focus ring", 0.22, 0.12, 0.855, mats.rubber);
mesh(
  "Lens front barrel",
  new THREE.CylinderGeometry(0.235, 0.22, 0.14, 32),
  mats.lens,
  [LENS_X, LENS_Y, 0.985],
  cameraRig,
  [Math.PI / 2, 0, 0],
);
lensPart("Lens front element", 0.2, 0.01, 1.04, mats.glass);
lensPart("Lens brand ring", 0.193, 0.012, 0.33, mats.silver);
mesh(
  "Lens hood",
  new THREE.CylinderGeometry(0.29, 0.245, 0.33, 40, 1, true),
  mats.lens,
  [LENS_X, LENS_Y, 1.22],
  cameraRig,
  [Math.PI / 2, 0, 0],
);

scene.updateMatrixWorld(true);
const ownerOf = (object) => {
  for (let p = object.parent; p; p = p.parent) if (p.userData.interactive) return p;
  return scene;
};
const inverse = new Map();
const batches = new Map(); // owner -> Map(material -> geometries)
scene.traverse((object) => {
  if (!object.isMesh) return;
  const owner = ownerOf(object);
  if (!inverse.has(owner))
    inverse.set(owner, owner === scene ? new THREE.Matrix4() : owner.matrixWorld.clone().invert());
  let geometry = object.geometry
    .clone()
    .applyMatrix4(inverse.get(owner).clone().multiply(object.matrixWorld));
  // A uniform attribute set lets parts share a draw call.
  if (geometry.index) {
    const expanded = geometry.toNonIndexed();
    geometry.dispose();
    geometry = expanded;
  }
  if (!batches.has(owner)) batches.set(owner, new Map());
  const byMaterial = batches.get(owner);
  if (!byMaterial.has(object.material)) byMaterial.set(object.material, []);
  byMaterial.get(object.material).push(geometry);
});

const optimized = new THREE.Scene();
optimized.name = scene.name;
const exported = new Map([[scene, optimized]]);
const exportNode = (owner) => {
  if (exported.has(owner)) return exported.get(owner);
  const parentOwner = ownerOf(owner);
  const node = new THREE.Group();
  node.name = owner.name;
  const local =
    parentOwner === scene
      ? owner.matrixWorld.clone()
      : parentOwner.matrixWorld.clone().invert().multiply(owner.matrixWorld);
  local.decompose(node.position, node.quaternion, node.scale);
  exportNode(parentOwner).add(node);
  exported.set(owner, node);
  return node;
};
scene.traverse((object) => {
  if (object.userData.interactive) exportNode(object);
});
let triangles = 0;
for (const [owner, byMaterial] of batches) {
  for (const [mat, geometries] of byMaterial) {
    const combined = mergeVertices(mergeGeometries(geometries, false), 1e-5);
    triangles += combined.index.count / 3;
    const part = new THREE.Mesh(combined, mat);
    part.name = owner === scene ? mat.name : `${owner.name} ${mat.name}`;
    exportNode(owner).add(part);
  }
}

// GLTFExporter uses browser FileReader only to serialize its geometry Blob.
// Node's native Blob provides the same bytes without a DOM or extra packages.
globalThis.FileReader = class {
  async readAsDataURL(blob) {
    this.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`;
    this.onloadend?.();
  }
};
const gltf = await new GLTFExporter().parseAsync(optimized, { binary: false });
const buffer = Buffer.from(gltf.buffers[0].uri.split(",")[1], "base64");
gltf.buffers[0].uri = "studio.bin";
gltf.asset.extras = {
  title: scene.name,
  author: "Shiv Vyas",
  description:
    "Original geometric reconstruction of Shiv Vyas’s desk reference: dual displays, laptop, mechanical keyboard and music equipment.",
  source: "scripts/model/build-desk.mjs",
};
gltf.images = [{ uri: "textures/manhattan-dusk.jpg", name: "Generated Manhattan dusk wallpaper" }];
gltf.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }];
gltf.textures = [{ source: 0, sampler: 0 }];
gltf.materials.find((m) => m.name === "Manhattan wallpaper").pbrMetallicRoughness.baseColorTexture = {
  index: 0,
};

// Write a plain glTF to a scratch folder, then compress it into one GLB.
const work = await mkdtemp(join(tmpdir(), "shiv-desk-"));
await mkdir(join(work, "textures"));
await copyFile(
  fileURLToPath(new URL("./assets/manhattan-dusk.jpg", import.meta.url)),
  join(work, "textures/manhattan-dusk.jpg"),
);
await writeFile(join(work, "scene.gltf"), JSON.stringify(gltf));
await writeFile(join(work, "studio.bin"), buffer);

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(join(work, "scene.gltf"));

// Shiv's mint cat bottle, sculpted for the archived alternative desk
// (ideas/shiv-desk-hero). Keep only its meshes and stand it by the right monitor.
const BOTTLE = { position: [2.08, 0.035, -0.32], height: 1.45 };
const alternative = await io.read(
  fileURLToPath(new URL("../../ideas/shiv-desk-hero/models/shiv-desk.glb", import.meta.url)),
);
for (const animation of alternative.getRoot().listAnimations()) animation.dispose();
for (const node of alternative.getRoot().listNodes())
  if (!/Bottle •/.test(node.getName())) node.dispose();
await alternative.transform(prune());
const bottleScene = alternative.getRoot().listScenes()[0];
const bottleBounds = getBounds(bottleScene);
const bottleScale = BOTTLE.height / (bottleBounds.max[1] - bottleBounds.min[1]);
const merged = mergeDocuments(doc, alternative);
const bottleRoot = doc
  .createNode("Cat bottle")
  .setTranslation(BOTTLE.position)
  .setScale([bottleScale, bottleScale, bottleScale]);
const bottleOffset = doc.createNode("Cat bottle origin").setTranslation([
  -(bottleBounds.min[0] + bottleBounds.max[0]) / 2,
  -bottleBounds.min[1],
  -(bottleBounds.min[2] + bottleBounds.max[2]) / 2,
]);
bottleRoot.addChild(bottleOffset);
for (const node of merged.get(bottleScene).listChildren()) bottleOffset.addChild(node);
merged.get(bottleScene).dispose();
doc.getRoot().listScenes()[0].addChild(bottleRoot);
await doc.transform(unpartition());
await doc.transform(
  dedup(),
  prune({ keepLeaves: true }),
  meshopt({ encoder: MeshoptEncoder, level: "medium" }),
);
await mkdir(destination, { recursive: true });
await io.write(`${destination}scene.glb`, doc);
await rm(work, { recursive: true, force: true });

console.log(
  JSON.stringify(
    {
      nodes: [...exported.values()].length - 1,
      materials: gltf.materials.length,
      triangles,
      rawGeometryBytes: buffer.length,
      glbBytes: (await stat(`${destination}scene.glb`)).size,
    },
    null,
    2,
  ),
);
