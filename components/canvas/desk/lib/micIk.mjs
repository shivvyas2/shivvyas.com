import { clamp } from "./deskMath.mjs";

// Planar rest geometry from scripts/model/build-desk.mjs, measured as
// (forward = -z, up = +y). The tip's small x offset rotates with the yaw.
const ELBOW = { d: 0.15, h: 1.09 };
const TIP_FROM_ELBOW = { d: 0.48, h: 0.96 };

export const MIC_ARM = Object.freeze({
  lower: Math.hypot(ELBOW.d, ELBOW.h),
  upper: Math.hypot(TIP_FROM_ELBOW.d, TIP_FROM_ELBOW.h),
  restLower: Math.atan2(ELBOW.d, ELBOW.h),
  restUpper: Math.atan2(TIP_FROM_ELBOW.d, TIP_FROM_ELBOW.h),
  restReach: ELBOW.d + TIP_FROM_ELBOW.d,
  restHeight: ELBOW.h + TIP_FROM_ELBOW.h,
  minYaw: -0.5,
  maxYaw: 1.1,
  minReach: 0.25,
  minHeight: 1.0,
});

export function solveMicArm({ x, z, height: fixedHeight }, arm = MIC_ARM) {
  let clamped = false;
  let yaw = Math.atan2(-x, -z);
  if (yaw < arm.minYaw || yaw > arm.maxYaw) {
    yaw = clamp(yaw, arm.minYaw, arm.maxYaw);
    clamped = true;
  }
  // Forward distance along the (possibly clamped) yaw direction.
  let reach = -x * Math.sin(yaw) - z * Math.cos(yaw);
  if (reach < arm.minReach) {
    reach = arm.minReach;
    clamped = true;
  }
  const maxDist = arm.lower + arm.upper - 1e-4;
  // Dragged by its head, the arm keeps its rest height while it can and
  // lowers (extends) to reach further, down to minHeight.
  let height = fixedHeight;
  if (height === undefined) {
    const fullReach = Math.sqrt(maxDist * maxDist - arm.minHeight * arm.minHeight);
    if (reach > fullReach) {
      reach = fullReach;
      clamped = true;
    }
    const level = Math.sqrt(Math.max(0, (maxDist * 0.999) ** 2 - reach * reach));
    height = Math.max(arm.minHeight, Math.min(arm.restHeight, level));
  }
  if (Math.hypot(reach, height) > maxDist) {
    reach = Math.max(arm.minReach, Math.sqrt(Math.max(0, maxDist * maxDist - height * height)));
    clamped = true;
  }
  const dist = Math.min(Math.hypot(reach, height), maxDist);
  const toTarget = Math.atan2(reach, height);
  const shoulder = Math.acos(
    clamp((arm.lower ** 2 + dist ** 2 - arm.upper ** 2) / (2 * arm.lower * dist), -1, 1),
  );
  const lowerAbs = toTarget - shoulder;
  const elbowD = arm.lower * Math.sin(lowerAbs);
  const elbowH = arm.lower * Math.cos(lowerAbs);
  const upperAbs = Math.atan2(reach - elbowD, height - elbowH);
  const lower = lowerAbs - arm.restLower;
  const upperTotal = upperAbs - arm.restUpper;
  return { yaw, lower, upper: upperTotal - lower, head: -upperTotal, reach, clamped };
}

export function micTip({ yaw, lower, upper }, arm = MIC_ARM) {
  const lowerAbs = arm.restLower + lower;
  const upperAbs = arm.restUpper + lower + upper;
  const d = arm.lower * Math.sin(lowerAbs) + arm.upper * Math.sin(upperAbs);
  const height = arm.lower * Math.cos(lowerAbs) + arm.upper * Math.cos(upperAbs);
  return { x: -d * Math.sin(yaw), z: -d * Math.cos(yaw), height };
}
