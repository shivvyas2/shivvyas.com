import test from "node:test";
import assert from "node:assert/strict";
import { MIC_ARM, micTip, solveMicArm } from "./micIk.mjs";

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("rest target solves to the rest pose", () => {
  const s = solveMicArm({ x: 0, z: -MIC_ARM.restReach, height: MIC_ARM.restHeight });
  for (const k of ["yaw", "lower", "upper", "head"]) close(s[k], 0);
  assert.equal(s.clamped, false);
});

test("reachable targets round-trip through forward kinematics", () => {
  for (const target of [
    { x: -0.3, z: -0.9, height: 1.8 },
    { x: -0.6, z: -0.4, height: 1.95 },
    { x: 0.1, z: -1.2, height: 1.6 },
  ]) {
    const s = solveMicArm(target);
    assert.equal(s.clamped, false);
    const tip = micTip(s);
    close(tip.x, target.x);
    close(tip.z, target.z);
    close(tip.height, target.height);
  }
});

test("head stays level: head delta cancels the upper bone's absolute change", () => {
  const s = solveMicArm({ x: -0.3, z: -0.9, height: 1.8 });
  close(s.head, -(s.lower + s.upper));
});

test("out-of-reach targets clamp to the arm length", () => {
  const s = solveMicArm({ x: 0, z: -5, height: 2.05 });
  assert.equal(s.clamped, true);
  assert.ok(Math.hypot(s.reach, 2.05) <= MIC_ARM.lower + MIC_ARM.upper);
  assert.ok([s.lower, s.upper].every(Number.isFinite));
});

test("yaw is clamped so the arm never swings into the monitors or off the desk", () => {
  assert.equal(solveMicArm({ x: 2, z: 0.1 }).yaw, MIC_ARM.minYaw);
  assert.equal(solveMicArm({ x: -3, z: 0.5 }).yaw, MIC_ARM.maxYaw);
});

test("targets at the base fold to the minimum reach", () => {
  const s = solveMicArm({ x: 0, z: 0 });
  assert.equal(s.reach, MIC_ARM.minReach);
  assert.equal(s.clamped, true);
});

test("far targets without an explicit height lower the head to reach them", () => {
  const s = solveMicArm({ x: 0, z: -1.6 });
  assert.equal(s.clamped, false);
  close(s.reach, 1.6);
  const tip = micTip(s);
  close(tip.z, -1.6);
  assert.ok(tip.height < MIC_ARM.restHeight && tip.height >= MIC_ARM.minHeight);
});

test("reach is capped where the head would drop below the minimum height", () => {
  const s = solveMicArm({ x: 0, z: -9 });
  assert.equal(s.clamped, true);
  close(micTip(s).height, MIC_ARM.minHeight, 1e-6);
});
