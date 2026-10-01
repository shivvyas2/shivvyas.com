// useGLTF caches the scene, so anything the interactions move would still be
// moved when the hero mounts again after client-side navigation. Snapshot on
// mount, restore on unmount.
export function snapshotTransforms(objects) {
  const saved = objects
    .filter(Boolean)
    .map((object) => [object, object.position.clone(), object.quaternion.clone(), object.scale.clone()]);
  return () => {
    for (const [object, position, quaternion, scale] of saved) {
      object.position.copy(position);
      object.quaternion.copy(quaternion);
      object.scale.copy(scale);
    }
  };
}
