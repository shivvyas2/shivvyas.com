// Three-free so the hero overlay can import it without pulling in three.js.
export const PHOTO_URL = "https://awannabephotographer.shivvyas.com";

// Rows on the camera's LCD, styled like the Sony menu. Copy is a first draft.
export const SCREEN_ROWS = [
  { label: "Name", value: "Shiv Vyas" },
  { label: "Based in", value: "New York" },
  { label: "Loves", value: "Photography" },
  { label: "Kit", value: "Sony α + 70-300mm" },
  { label: "Status", value: "a wannabe photographer" },
  { label: "Open Photos", value: "awannabephotographer.shivvyas.com", link: true },
];

// Rear-panel layout in Interactive_Camera local units (body 0.72 x 0.4, rear
// face at z -0.11, x +0.36 on the viewer's left). Mirrors the geometry in
// scripts/model/build-desk.mjs.
export const CAMERA_BACK = { width: 0.72, height: 0.4, labelZ: -0.1335 };
// Front badge (SONY + α6400) beside the mount, on the body face at z 0.11.
export const CAMERA_FRONT = { x: 0.29, y: 0.21, z: 0.1115, width: 0.16, height: 0.34 };
export const CAMERA_LCD = { x: 0.106, y: 0.162, z: -0.1315, width: 0.376, height: 0.235 };
// Printed legends: [text or icon, x, y, size (body units), kind]
export const CAMERA_LEGENDS = [
  ["AF/MF", -0.149, 0.356, 0.024, "print"],
  ["AEL", -0.153, 0.304, 0.022, "print"],
  ["zoom", -0.237, 0.282, 0.024, "icon"],
  ["flash", -0.018, 0.322, 0.024, "button"],
  ["MENU", -0.096, 0.322, 0.019, "button"],
  ["Fn", -0.218, 0.24, 0.024, "button"],
  ["send", -0.188, 0.205, 0.022, "icon"],
  ["DISP", -0.262, 0.212, 0.02, "print"],
  ["timer", -0.188, 0.156, 0.022, "icon"],
  ["ISO", -0.33, 0.15, 0.02, "print"],
  ["exposure", -0.25, 0.09, 0.02, "icon"],
  ["C2", -0.33, 0.085, 0.02, "print"],
  ["play", -0.218, 0.055, 0.022, "button"],
  ["trash", -0.295, 0.055, 0.022, "button"],
  ["SONY", 0.085, 0.024, 0.022, "brand"],
];

// Click targets on the rear panel (and the shutter on top), in body units.
export const CAMERA_BUTTONS = [
  { id: "flash", x: -0.018, y: 0.322, r: 0.03 },
  { id: "menu", x: -0.096, y: 0.322, r: 0.032 },
  { id: "ael", x: -0.205, y: 0.328, r: 0.032 },
  { id: "zoom", x: -0.237, y: 0.282, r: 0.022 },
  { id: "fn", x: -0.218, y: 0.24, r: 0.03 },
  { id: "wheel", x: -0.262, y: 0.15, r: 0.056 },
  { id: "play", x: -0.218, y: 0.055, r: 0.03 },
  { id: "trash", x: -0.295, y: 0.055, r: 0.03 },
  { id: "c2", x: -0.33, y: 0.085, r: 0.02 },
];
export const CAMERA_SHUTTER = { x: -0.27, y: 0.432, z: 0.2, r: 0.045 };
