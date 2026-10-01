// Timing for opening the diary, relative to the camera's flight down to it:
// the cover lifts while the camera is descending, lands as the camera
// settles, then the open spread's sketches ink in.
export function openChoreography(flight) {
  const coverStart = flight * 0.45;
  const coverDuration = flight * 0.72;
  return { coverStart, coverDuration, inkStart: coverStart + coverDuration + 0.15 };
}
