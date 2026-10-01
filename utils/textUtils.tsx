// utils/textUtils.tsx
import React from "react";

// One masked span per word: `span span` selects the inner word span that
// animations slide up. Word-level keeps tween counts small on long headings.
// `label` replaces the screen-reader/crawler text when the visible word alone
// is too terse (e.g. "about" -> "About Shiv Vyas").
export const splitText = (text: string, label: string = text): JSX.Element[] => [
  <span key="accessible-text" className="sr-only">
    {label}
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
