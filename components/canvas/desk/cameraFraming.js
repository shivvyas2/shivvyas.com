import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { heroFrame } from "./lib/heroFrame.mjs";

const DESK_CENTER = new Vector3(0, 0.12, 0.3);
const DESK_MIN = new Vector3(-3.4, 0, -1.35);
const DESK_MAX = new Vector3(3.75, 0, 1.5);
const probe = new PerspectiveCamera();
const MIC_HEAD = [new Vector3(3.45, 2.2, -0.25), new Vector3(2.6, 2.2, -0.15)];

const boxCorners = (min, max) => {
  const out = [];
  for (const x of [min.x, max.x])
    for (const y of [min.y, max.y])
      for (const z of [min.z, max.z]) out.push(new Vector3(x, y, z));
  return out;
};

// Fits `corners` into the viewport. heightFraction/drop let the hero place the
// desk in the lower part of a full-bleed canvas, under the intro text.
const WORLD_UP = new Vector3(0, 1, 0);
// Top-down shots look almost straight down, where a +Y up vector leaves the
// roll undefined; they use -Z so the monitors sit at the top of the frame.
const DESK_UP = new Vector3(0, 0, -1);
const PORTRAIT_UP = new Vector3(1, 0, 0);

function fit({ center, direction, corners, fov, aspect, framing, heightFraction = 1, drop = 0, up: upVector = WORLD_UP }) {
  probe.up.copy(upVector);
  probe.fov = fov;
  probe.aspect = aspect;
  probe.position.copy(center).addScaledVector(direction, 10);
  probe.lookAt(center);
  probe.updateMatrixWorld();
  const right = new Vector3().setFromMatrixColumn(probe.matrixWorld, 0);
  const up = new Vector3().setFromMatrixColumn(probe.matrixWorld, 1);
  const tanHalf = Math.tan(MathUtils.degToRad(fov / 2));
  const tanY = tanHalf * heightFraction;
  const tanX = tanHalf * aspect;
  let distance = 0;
  for (const corner of corners) {
    const p = corner.clone().sub(center);
    distance = Math.max(
      distance,
      p.dot(direction) + Math.abs(p.dot(right)) / tanX,
      p.dot(direction) + Math.abs(p.dot(up)) / tanY,
    );
  }
  distance *= framing;
  const shift = up.multiplyScalar(2 * drop * distance * tanHalf);
  return {
    position: center.clone().addScaledVector(direction, distance).add(shift),
    center: center.clone().add(shift),
    fov,
    up: upVector.clone(),
  };
}

const aspectOf = (size) => Math.max(size.width, 1) / Math.max(size.height, 1);

export function getPose(mode, { bounds, size, isMobile, diaryAnchor, focus, heroTextBottom = null }) {
  const aspect = aspectOf(size);
  if (mode === "desk" || mode === "camera") {
    return fit({
      center: DESK_CENTER.clone(),
      direction: new Vector3(0.08, 1, 0.11).normalize(),
      corners: [
        ...boxCorners(
          new Vector3(DESK_MIN.x, -0.04, DESK_MIN.z),
          new Vector3(DESK_MAX.x, 0.48, DESK_MAX.z),
        ),
        // The mic head rises toward the camera; keep the drag handle in frame.
        ...MIC_HEAD,
      ],
      fov: isMobile ? 54 : 48,
      aspect,
      framing: isMobile ? 1.04 : 1.04,
      // Portrait phones turn the long desk vertical so it fills the screen.
      up: aspect < 0.8 ? PORTRAIT_UP : DESK_UP,
      drop: aspect < 0.8 ? 0 : 0.1,
    });
  }
  if (mode === "diary" && diaryAnchor) {
    diaryAnchor.updateWorldMatrix(true, false);
    // Open book in Interactive_Diary local space: spine at x=-0.31, spread
    // spans x -0.94..0.33, pages 0.88 deep. Phones frame one page.
    const single = isMobile;
    const localCenter = single
      ? new Vector3(focus === "left" ? -0.62 : 0.01, 0.09, 0)
      : new Vector3(-0.31, 0.09, 0);
    const half = single ? new Vector3(0.32, 0, 0.45) : new Vector3(0.66, 0, 0.47);
    const corners = boxCorners(
      localCenter.clone().sub(half),
      localCenter.clone().add(half),
    ).map((c) => diaryAnchor.localToWorld(c));
    return fit({
      center: diaryAnchor.localToWorld(localCenter.clone()),
      direction: new Vector3(0, 1, 0.28).normalize(),
      corners,
      fov: isMobile ? 50 : 40,
      aspect,
      framing: 1.1,
      // Roll with the book (it sits slightly askew on the desk) so lines read level.
      up: new Vector3(0, 0, -1).transformDirection(diaryAnchor.matrixWorld),
    });
  }
  return fit({
    center: bounds.getCenter(new Vector3()),
    direction: new Vector3(0.34, 0.3, 1).normalize(),
    corners: boxCorners(bounds.min, bounds.max),
    fov: 36,
    aspect,
    framing: isMobile ? 0.84 : 0.9,
    // Fit below the intro text, however many lines it wraps to.
    ...heroFrame({ textBottom: heroTextBottom, mobile: isMobile }),
  });
}
