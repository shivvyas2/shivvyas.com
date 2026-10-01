// utils/textUtils.tsx
import React from "react";

// One masked span per word: `span span` selects the inner word span that
// animations slide up. Word-level keeps tween counts small on long headings.
export const splitText = (text: string): JSX.Element[] => [
  <span key="accessible-text" className="sr-only">
    {text}
  </span>,
  ...text.split(" ").map((word, index) => (
    <span
      aria-hidden="true"
      key={index}
      style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}
    >
      <span style={{ display: "inline-block" }}>{word}&nbsp;</span>
    </span>
  )),
];
