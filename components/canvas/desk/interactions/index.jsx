import { useLayoutEffect } from "react";
import KeyboardInput from "./KeyboardInput";
import DeskMouse from "./DeskMouse";
import MicBoom from "./MicBoom";
import Diary3D from "./Diary3D";
import { snapshotTransforms } from "../lib/transformSnapshot.mjs";

// Loaded on first desk hover/entry so the hero's first paint stays light.
export default function DeskInteractions({ nodes, isMobile }) {
  // The GLTF scene is cached across navigations; put every moved part back
  // when the hero unmounts so it never returns with an open diary.
  useLayoutEffect(
    () =>
      snapshotTransforms(
        Object.entries(nodes)
          .filter(([name]) => name.startsWith("Interactive_"))
          .map(([, node]) => node),
      ),
    [nodes],
  );

  return (
    <>
      <KeyboardInput />
      {nodes.Interactive_Mouse && <DeskMouse node={nodes.Interactive_Mouse} />}
      {nodes.Interactive_Mic_Head && <MicBoom nodes={nodes} />}
      {nodes.Interactive_Diary && <Diary3D nodes={nodes} isMobile={isMobile} />}
    </>
  );
}
