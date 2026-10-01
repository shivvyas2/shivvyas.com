import test from "node:test";
import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { NodeIO, getBounds } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";

const file = fileURLToPath(new URL("../../public/desktop_pc/scene.glb", import.meta.url));
const REQUIRED = [
  "Interactive_Mouse",
  "Interactive_Keyboard",
  "Interactive_Mic_Base",
  "Interactive_Mic_Lower",
  "Interactive_Mic_Upper",
  "Interactive_Mic_Head",
  "Interactive_Diary",
  "Interactive_Diary_Cover",
  "Interactive_Camera",
];

test("scene.glb is small and exposes the interactive hierarchy", async () => {
  const { size } = await stat(file);
  // 460 KB for the desk + ~90 KB for the camera and the sculpted cat bottle.
  assert.ok(size < 560_000, `scene.glb is ${size} bytes`);
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  const doc = await io.read(file);
  const nodes = Object.fromEntries(doc.getRoot().listNodes().map((n) => [n.getName(), n]));
  for (const name of REQUIRED) assert.ok(nodes[name], `missing ${name}`);
  const childOf = (parent, child) => nodes[parent].listChildren().includes(nodes[child]);
  assert.ok(childOf("Interactive_Mic_Base", "Interactive_Mic_Lower"));
  assert.ok(childOf("Interactive_Mic_Lower", "Interactive_Mic_Upper"));
  assert.ok(childOf("Interactive_Mic_Upper", "Interactive_Mic_Head"));
  assert.ok(childOf("Interactive_Diary", "Interactive_Diary_Cover"));
  // Audio interfaces sit clear of the laptop (base spans x -0.825..0.825).
  const audio = doc.getRoot().listNodes().find((n) => n.getName() === "Audio interface red aluminum");
  assert.ok(audio, "audio interface mesh");
  const minX = getBounds(audio).min[0];
  assert.ok(minX > 0.85, `audio interface starts at x=${minX}`);
  // The mint cat bottle comes from the archived alternative desk model.
  assert.ok(doc.getRoot().listMaterials().some((m) => m.getName() === "Bottle • mint silicone"), "cat bottle");
  const bottle = getBounds(nodes["Cat bottle"]);
  assert.ok(bottle.min[1] > -0.01 && bottle.min[1] < 0.1, `bottle stands on the desk (y=${bottle.min[1]})`);
  assert.ok(bottle.max[1] - bottle.min[1] > 0.9 && bottle.max[1] - bottle.min[1] < 1.1, "bottle height");
  assert.deepEqual(nodes.Interactive_Mic_Upper.getTranslation().map((v) => +v.toFixed(3)), [0, 1.09, -0.15]);
});
