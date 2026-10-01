import test from "node:test";
import assert from "node:assert/strict";
import { Object3D } from "three";
import { snapshotTransforms } from "./transformSnapshot.mjs";

test("restore puts mutated nodes back exactly (cached GLTF scene is shared across mounts)", () => {
  const cover = new Object3D();
  const mouse = new Object3D();
  mouse.position.set(1.38, 0.1, 1.02);
  mouse.rotation.set(0, -0.12, 0);
  const restore = snapshotTransforms([cover, mouse, undefined]);
  cover.rotation.z = Math.PI;
  mouse.position.set(-2, 0.13, 0.4);
  mouse.rotation.x = 0.1;
  restore();
  const near = (actual, expected) =>
    actual.forEach((v, i) => assert.ok(Math.abs(v - expected[i]) < 1e-9, `${actual} vs ${expected}`));
  near([cover.rotation.z], [0]);
  near(mouse.position.toArray(), [1.38, 0.1, 1.02]);
  near(mouse.rotation.toArray().slice(0, 3), [0, -0.12, 0]);
});
