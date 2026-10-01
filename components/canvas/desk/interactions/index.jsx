import KeyboardInput from "./KeyboardInput";
import DeskMouse from "./DeskMouse";
import MicBoom from "./MicBoom";
import Diary3D from "./Diary3D";

// Loaded on first desk hover/entry so the hero's first paint stays light.
export default function DeskInteractions({ nodes }) {
  return (
    <>
      <KeyboardInput />
      {nodes.Interactive_Mouse && <DeskMouse node={nodes.Interactive_Mouse} />}
      {nodes.Interactive_Mic_Head && <MicBoom nodes={nodes} />}
      {nodes.Interactive_Diary && <Diary3D nodes={nodes} />}
    </>
  );
}
