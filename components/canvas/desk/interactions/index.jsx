import KeyboardInput from "./KeyboardInput";
import DeskMouse from "./DeskMouse";

// Loaded on first desk hover/entry so the hero's first paint stays light.
export default function DeskInteractions({ nodes }) {
  return (
    <>
      <KeyboardInput />
      {nodes.Interactive_Mouse && <DeskMouse node={nodes.Interactive_Mouse} />}
    </>
  );
}
