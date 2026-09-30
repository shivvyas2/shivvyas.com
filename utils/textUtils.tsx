// utils/textUtils.tsx
import React from "react";

export const splitText = (text: string): JSX.Element[] => {
  return [
    <span key="accessible-text" className="sr-only">
      {text}
    </span>,
    ...text.split(" ").map((word, wordIndex) => (
      <span
        aria-hidden="true"
        key={wordIndex}
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {word.split("").map((char, charIndex) => (
          <span
            key={`${wordIndex}-${charIndex}`}
            style={{ display: "inline-block", overflow: "hidden" }}
          >
            {char}
          </span>
        ))}
        <span>&nbsp;</span> {/* Added non-breaking space */}
      </span>
    )),
  ];
};
