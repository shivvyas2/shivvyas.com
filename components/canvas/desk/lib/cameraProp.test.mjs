import test from "node:test";
import assert from "node:assert/strict";
import { PerspectiveCamera, Quaternion, Vector3 } from "three";
import { PHOTO_URL, SCREEN_ROWS, heldPose } from "./cameraProp.mjs";

test("screen links to the photography site and says Shiv loves photography", () => {
  assert.equal(PHOTO_URL, "https://awannabephotographer.shivvyas.com");
  const text = SCREEN_ROWS.map((r) => `${r.label} ${r.value}`).join(" ");
  assert.match(text, /Photography/);
  const link = SCREEN_ROWS.find((r) => r.link);
  assert.ok(link && /Open Photos/i.test(link.label));
});

test("held pose floats in front of the viewer with the LCD (-Z) facing it", () => {
  const viewer = new PerspectiveCamera(48, 16 / 10, 0.1, 80);
  viewer.position.set(0.5, 9, 1.5);
  viewer.lookAt(0, 0, 0);
  viewer.updateMatrixWorld();
  const { position, quaternion } = heldPose(viewer, { width: 0.72, screenShare: 0.45 });
  const toViewer = viewer.position.clone().sub(position).normalize();
  const lcdNormal = new Vector3(0, 0, -1).applyQuaternion(quaternion);
  assert.ok(lcdNormal.dot(toViewer) > 0.999, `lcd faces viewer (${lcdNormal.dot(toViewer)})`);
  const forward = new Vector3(0, 0, -1).applyQuaternion(viewer.quaternion);
  const offset = position.clone().sub(viewer.position);
  assert.ok(offset.normalize().dot(forward) > 0.999, "centered in view");
  const distance = position.distanceTo(viewer.position);
  const visibleWidth = 2 * distance * Math.tan((viewer.fov * Math.PI) / 360) * viewer.aspect;
  assert.ok(Math.abs(0.72 / visibleWidth - 0.45) < 1e-6, "body fills 45% of the width");
  assert.ok(quaternion instanceof Quaternion);
});

test("held pose centers the given pivot (body middle), not the node origin", () => {
  const viewer = new PerspectiveCamera(48, 16 / 10, 0.1, 80);
  viewer.position.set(0, 9, 1);
  viewer.lookAt(0, 0, 0);
  viewer.updateMatrixWorld();
  const pivot = new Vector3(0, 0.2, 0);
  const { position, quaternion } = heldPose(viewer, { width: 0.72, screenShare: 0.45, pivot });
  const center = pivot.clone().applyQuaternion(quaternion).add(position);
  const forward = new Vector3(0, 0, -1).applyQuaternion(viewer.quaternion);
  assert.ok(center.sub(viewer.position).normalize().dot(forward) > 0.99999, "pivot on the view axis");
});
