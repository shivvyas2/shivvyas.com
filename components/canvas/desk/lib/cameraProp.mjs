import { Matrix4, Quaternion, Vector3 } from "three";

export { CAMERA_BACK, CAMERA_LCD, CAMERA_LEGENDS, PHOTO_URL, SCREEN_ROWS } from "./cameraContent.mjs";

const flip = new Matrix4();
const eye = new Vector3();
const target = new Vector3();

// World pose that holds the camera in front of the viewer, centered, its
// body filling `screenShare` of the view width and its LCD facing the viewer.
export function heldPose(viewer, { width, screenShare, pivot }) {
  const tanHalf = Math.tan((viewer.fov * Math.PI) / 360);
  const distance = width / screenShare / (2 * tanHalf * viewer.aspect);
  const forward = new Vector3(0, 0, -1).applyQuaternion(viewer.quaternion);
  const up = new Vector3(0, 1, 0).applyQuaternion(viewer.quaternion);
  const position = viewer.getWorldPosition(eye).clone().addScaledVector(forward, distance);
  // Object +Z (lens) points away from the viewer, so -Z (LCD) faces it.
  target.copy(position).add(forward);
  flip.lookAt(target, position, up);
  const quaternion = new Quaternion().setFromRotationMatrix(flip);
  // Shift so `pivot` (node-local, e.g. the body's middle) sits on the view axis.
  if (pivot) position.sub(pivot.clone().applyQuaternion(quaternion));
  return { position, quaternion };
}
