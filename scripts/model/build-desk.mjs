import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import {
  mergeGeometries,
  mergeVertices,
} from "three/addons/utils/BufferGeometryUtils.js";
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
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
// Both displays share one runtime canvas (a Cursor editor, see
// components/canvas/desk/interactions/monitorScreens.js); dark until it loads.
mats.wallpaper = unlit("Monitor screens", "#181818");
// A shade off the monitors so dedup keeps the two materials (and names) apart.
mats.laptopScreen = unlit("Laptop screen", "#17191b");
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
  // No UVs survive export (the material is untextured); the runtime maps the
  // editor canvas onto these quads from their positions.
  mesh(
    "Monitor screen",
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
// The editor itself is a runtime canvas (Cursor with a live terminal, see
// components/canvas/desk/interactions/monitorScreens.js); this is its surface.
mesh(
  "Laptop editor surface",
  new THREE.PlaneGeometry(1.49, 0.844),
  mats.laptopScreen,
  [0, 0.529, 0.0385],
  lid,
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
// The boom arm pivots in the socket of a C-clamp gripping the desk's right
// edge (worktop ends at x 3.575, underside at y -0.2). The clamp is static;
// only the arm turns.
const MIC_X = 3.47;
const MIC_Z = 0.51;
const micBase = interactive(group("Interactive_Mic_Base", [MIC_X, 0.052, MIC_Z]));
const micLower = interactive(group("Interactive_Mic_Lower", [0, 0, 0], [0, 0, 0], micBase));
const micUpper = interactive(group("Interactive_Mic_Upper", ELBOW, [0, 0, 0], micLower));
const micHead = interactive(
  group("Interactive_Mic_Head", from(ELBOW, TIP), [0, 0, 0], micUpper),
);

box("Mic clamp top plate", [0.27, 0.034, 0.22], [MIC_X + 0.03, 0.017, MIC_Z], mats.black, scene, 0.012);
cylinder("Mic clamp socket", 0.052, 0.07, [MIC_X, 0.068, MIC_Z], mats.graphite);
box("Mic clamp spine", [0.05, 0.37, 0.2], [3.6, -0.15, MIC_Z], mats.black, scene, 0.012);
box("Mic clamp lower jaw", [0.24, 0.04, 0.2], [3.5, -0.315, MIC_Z], mats.black, scene, 0.012);
cylinder("Mic clamp pressure pad", 0.05, 0.016, [MIC_X, -0.21, MIC_Z], mats.rubber);
cylinder("Mic clamp screw", 0.013, 0.13, [MIC_X, -0.27, MIC_Z], mats.silver);
cylinder("Mic clamp knob", 0.048, 0.05, [MIC_X, -0.37, MIC_Z], mats.graphite);
for (let i = 0; i < 10; i++) {
  const a = (i / 10) * Math.PI * 2;
  box(
    "Mic clamp knob grip",
    [0.012, 0.05, 0.012],
    [MIC_X + Math.cos(a) * 0.049, -0.37, MIC_Z + Math.sin(a) * 0.049],
    mats.black,
    scene,
    0.002,
    [0, -a, 0],
  );
}

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
// The standing-desk keypad (raise/lower + height display) is built at
// runtime in components/canvas/desk/StandingDesk.jsx so its keys can work.

// An orange back-edge strip catches the scene lighting without RGB clutter.
box(
  "Warm rear light strip",
  [6.4, 0.008, 0.02],
  [0, -0.05, -1.518],
  mats.led,
  scene,
  0.003,
);

// Shiv's Sony a6400 with the Tamron 70-300 telephoto, resting on the
// back-left of the desk, modelled from a photo of the real body at the desk's
// ~6x scale (body 120 x 67 x 50 mm, lens 148 mm x 77 mm + hood). Local +Z is
// the lens axis, the LCD faces -Z and the grip is on -X (right-hand side seen
// from behind), so the runtime can pick it up and turn the screen to the viewer.
// Back-panel lettering (MENU, Fn, DISP, ISO...) and the LCD are runtime
// canvases in components/canvas/desk/interactions/cameraScreen.js; the
// coordinates below are shared with it through lib/cameraContent.mjs.
const cameraRig = interactive(
  group("Interactive_Camera", [-2.86, 0.055, -0.12], [0, Math.PI / 2 - 0.32, 0]),
);
// The hood (r 0.256) is deeper than the body is tall, so a flat body would
// sink it into the mat. Tip the nose up ~2.4 deg so the camera rests on the
// rear of the body and the hood rim, like the real kit on a table.
cameraRig.rotation.order = "YXZ";
cameraRig.rotation.x = -0.042;
const BACK = -0.11; // rear face of the body
const BUTTON_Z = BACK - 0.009; // buttons stand 18 mm proud (scaled)
const facing = [Math.PI / 2, 0, 0]; // cylinder axis along Z
// Knurled rim: thin ribs around a dial, on the Y axis (top dials) or Z (rear wheel).
function knurl(name, radius, height, center, count, axis, mat) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const [cx, cy, cz] = center;
    if (axis === "y")
      box(name, [0.007, height, 0.007], [cx + Math.cos(a) * radius, cy, cz + Math.sin(a) * radius], mat, cameraRig, 0.002, [0, -a, 0]);
    else
      box(name, [0.007, 0.007, height], [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, cz], mat, cameraRig, 0.002, [0, 0, a]);
  }
}

// Body: a flat-topped rangefinder slab (no EVF hump on the a6400) with a deep
// leather grip on the right.
box("Camera body", [0.72, 0.4, 0.22], [0, 0.2, 0], mats.black, cameraRig, 0.03);
box("Camera grip", [0.19, 0.4, 0.17], [-0.265, 0.2, 0.18], mats.rubber, cameraRig, 0.07);
box("Camera thumb rest leather", [0.045, 0.22, 0.01], [-0.318, 0.215, BACK - 0.002], mats.rubber, cameraRig, 0.006);

// Top plate: Multi Interface shoe, pop-up flash seam, rear control dial and
// mode dial at the right edge, shutter with power collar and C1 on the grip.
box("Camera flash housing", [0.3, 0.012, 0.16], [0.06, 0.402, -0.01], mats.graphite, cameraRig, 0.004);
box("Camera multi interface shoe", [0.13, 0.008, 0.1], [0.105, 0.411, -0.01], mats.black, cameraRig, 0.003);
for (const side of [-1, 1])
  box("Camera shoe rail", [0.008, 0.014, 0.1], [0.105 + side * 0.062, 0.414, -0.01], mats.silver, cameraRig, 0.002);
cylinder("Camera rear control dial", 0.05, 0.04, [-0.196, 0.418, -0.075], mats.graphite, cameraRig);
knurl("Camera dial knurl", 0.05, 0.034, [-0.196, 0.418, -0.075], 28, "y", mats.black);
cylinder("Camera mode dial", 0.056, 0.05, [-0.308, 0.425, -0.045], mats.graphite, cameraRig);
knurl("Camera dial knurl", 0.056, 0.03, [-0.308, 0.43, -0.045], 30, "y", mats.black);
cylinder("Camera mode dial cap", 0.045, 0.006, [-0.308, 0.452, -0.045], mats.black, cameraRig);
cylinder("Camera power collar", 0.05, 0.014, [-0.27, 0.404, 0.2], mats.graphite, cameraRig);
cylinder("Camera shutter button", 0.033, 0.026, [-0.27, 0.418, 0.2], mats.silver, cameraRig);
cylinder("Camera C1 button", 0.02, 0.012, [-0.2, 0.406, 0.16], mats.graphite, cameraRig);

// Rear: EVF in the top-left corner with its eye sensor and diopter wheel,
// flash and MENU buttons, AF/MF-AEL lever, Fn, the control wheel, playback
// and trash/C2, and the tilting LCD on its own slab.
box("Camera EVF eyecup", [0.15, 0.09, 0.016], [0.278, 0.35, BACK - 0.008], mats.rubber, cameraRig, 0.02);
box("Camera EVF glass", [0.088, 0.055, 0.004], [0.29, 0.352, BACK - 0.017], mats.screen, cameraRig, 0.006);
box("Camera EVF eye sensor", [0.018, 0.04, 0.004], [0.226, 0.352, BACK - 0.017], mats.screen, cameraRig, 0.004);
cylinder("Camera diopter dial", 0.024, 0.014, [0.162, 0.33, BACK - 0.007], mats.graphite, cameraRig, facing);
knurl("Camera diopter knurl", 0.024, 0.012, [0.162, 0.33, BACK - 0.007], 16, "z", mats.black);
box("Camera flash button", [0.068, 0.036, 0.018], [-0.018, 0.322, BUTTON_Z], mats.graphite, cameraRig, 0.016);
box("Camera MENU button", [0.062, 0.034, 0.018], [-0.096, 0.322, BUTTON_Z], mats.graphite, cameraRig, 0.015);
cylinder("Camera AEL button", 0.03, 0.018, [-0.205, 0.328, BUTTON_Z], mats.graphite, cameraRig, facing);
box("Camera AF/MF lever", [0.05, 0.016, 0.012], [-0.172, 0.312, BUTTON_Z - 0.002], mats.graphite, cameraRig, 0.005, [0, 0, 0.45]);
cylinder("Camera Fn button", 0.027, 0.018, [-0.218, 0.24, BUTTON_Z], mats.graphite, cameraRig, facing);
cylinder("Camera control wheel", 0.052, 0.016, [-0.262, 0.15, BUTTON_Z + 0.001], mats.graphite, cameraRig, facing);
knurl("Camera wheel knurl", 0.05, 0.014, [-0.262, 0.15, BUTTON_Z], 36, "z", mats.black);
cylinder("Camera wheel center button", 0.026, 0.02, [-0.262, 0.15, BUTTON_Z - 0.002], mats.black, cameraRig, facing);
cylinder("Camera playback button", 0.027, 0.018, [-0.218, 0.055, BUTTON_Z], mats.graphite, cameraRig, facing);
cylinder("Camera trash button", 0.027, 0.018, [-0.295, 0.055, BUTTON_Z], mats.graphite, cameraRig, facing);
box("Camera LCD slab", [0.516, 0.279, 0.02], [0.081, 0.149, BACK - 0.01], mats.graphite, cameraRig, 0.012);
box("Camera LCD hinge", [0.46, 0.014, 0.014], [0.081, 0.292, BACK - 0.006], mats.black, cameraRig, 0.006);

// Front: mount plate, lens release and the AF illuminator.
box("Camera mount plate", [0.34, 0.34, 0.01], [0.06, 0.2, 0.113], mats.graphite, cameraRig, 0.02);
cylinder("Camera lens release", 0.022, 0.012, [-0.135, 0.12, 0.115], mats.silver, cameraRig, facing);
cylinder("Camera AF illuminator", 0.016, 0.006, [-0.12, 0.33, 0.112], mats.led, cameraRig, facing);

// Lens, from the mount forward: a straight Tamron-style barrel with a silver
// mount and accent rings, a ribbed zoom ring, an index mark, a focus ring and
// a solid round hood with real wall thickness (an open tube read as "cut").
const LENS_X = 0.06;
const LENS_Y = 0.2;
const lensPart = (name, radius, length, z, mat) =>
  cylinder(name, radius, length, [LENS_X, LENS_Y, z], mat, cameraRig, facing);
lensPart("Lens mount ring", 0.185, 0.04, 0.135, mats.silver);
lensPart("Lens rear barrel", 0.19, 0.2, 0.255, mats.lens);
lensPart("Lens brand ring", 0.192, 0.014, 0.33, mats.silver);
lensPart("Lens zoom ring", 0.205, 0.28, 0.495, mats.rubber);
for (let i = 0; i < 40; i++) {
  const a = (i / 40) * Math.PI * 2;
  box(
    "Lens zoom grip rib",
    [0.012, 0.012, 0.25],
    [LENS_X + Math.cos(a) * 0.206, LENS_Y + Math.sin(a) * 0.206, 0.495],
    mats.graphite,
    cameraRig,
    0.002,
    [0, 0, a],
  );
}
lensPart("Lens mid barrel", 0.2, 0.14, 0.705, mats.lens);
box("Lens index mark", [0.012, 0.006, 0.05], [LENS_X, LENS_Y + 0.2, 0.68], mats.legend, cameraRig, 0.002);
lensPart("Lens focus ring", 0.208, 0.1, 0.825, mats.rubber);
lensPart("Lens front barrel", 0.215, 0.12, 0.935, mats.lens);
lensPart("Lens front accent", 0.217, 0.012, 0.99, mats.silver);
lensPart("Lens front element", 0.19, 0.01, 0.985, mats.glass);
lensPart("Lens hood bayonet", 0.232, 0.03, 1.005, mats.graphite);
// Hood profile (radius, distance along the axis), closed so both the outer
// shell and the inside wall render.
const hoodProfile = [
  [0.224, 0], [0.238, 0], [0.256, 0.2], [0.256, 0.212], [0.244, 0.212], [0.224, 0.02], [0.224, 0],
].map(([r, z]) => new THREE.Vector2(r, z));
mesh(
  "Lens hood",
  new THREE.LatheGeometry(hoodProfile, 48),
  mats.lens,
  [LENS_X, LENS_Y, 1.0],
  cameraRig,
  facing,
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

// Write a plain glTF to a scratch folder, then compress it into one GLB.
const work = await mkdtemp(join(tmpdir(), "shiv-desk-"));
await writeFile(join(work, "scene.gltf"), JSON.stringify(gltf));
await writeFile(join(work, "studio.bin"), buffer);

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(join(work, "scene.gltf"));

// Shiv's mint cat bottle, sculpted for the archived alternative desk
// (ideas/shiv-desk-hero). Keep only its meshes and stand it by the right monitor.
// Turned to face the viewer (its sculpt faces -Z) and sized to a real ~25 cm bottle.
const BOTTLE = { position: [2.08, 0.035, -0.32], height: 1.0, yaw: Math.PI };
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
  .setRotation([0, Math.sin(BOTTLE.yaw / 2), 0, Math.cos(BOTTLE.yaw / 2)])
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
