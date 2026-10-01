import test from "node:test";
import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
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
];

test("scene.glb is small and exposes the interactive hierarchy", async () => {
  const { size } = await stat(file);
  assert.ok(size < 460_000, `scene.glb is ${size} bytes`);
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
  assert.deepEqual(nodes.Interactive_Mic_Upper.getTranslation().map((v) => +v.toFixed(3)), [0, 1.09, -0.15]);
});
