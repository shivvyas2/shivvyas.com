// MacBook Pro (2021+) keyboard layout, in key units; every row is ROW_UNITS
// wide. `sub` is the small upper legend (number-row symbols), `corner` puts a
// word legend in the bottom corner like Apple's modifier keys.
export const ROW_UNITS = 15;

const keys = (labels, extra = {}) => labels.split(" ").map((label) => ({ label, ...extra }));

export const MACBOOK_ROWS = [
  [
    { label: "esc", w: 1.5, corner: "left", small: true },
    ...Array.from({ length: 12 }, (_, i) => ({ label: `F${i + 1}`, small: true })),
    { label: "touchid", w: 1.5 },
  ],
  [
    { label: "~", sub: "`" },
    ...[["!", "1"], ["@", "2"], ["#", "3"], ["$", "4"], ["%", "5"], ["^", "6"], ["&", "7"], ["*", "8"], ["(", "9"], [")", "0"], ["_", "-"], ["+", "="]].map(
      ([sub, label]) => ({ label, sub }),
    ),
    { label: "delete", w: 2, corner: "right", small: true },
  ],
  [
    { label: "tab", w: 1.5, corner: "left", small: true },
    ...keys("Q W E R T Y U I O P"),
    { label: "[", sub: "{" },
    { label: "]", sub: "}" },
    { label: "\\", sub: "|", w: 1.5 },
  ],
  [
    { label: "caps lock", w: 1.75, corner: "left", small: true },
    ...keys("A S D F G H J K L"),
    { label: ";", sub: ":" },
    { label: "'", sub: '"' },
    { label: "return", w: 2.25, corner: "right", small: true },
  ],
  [
    { label: "shift", w: 2.25, corner: "left", small: true },
    ...keys("Z X C V B N M"),
    { label: ",", sub: "<" },
    { label: ".", sub: ">" },
    { label: "/", sub: "?" },
    { label: "shift", w: 2.75, corner: "right", small: true },
  ],
  [
    { label: "fn", small: true, corner: "left" },
    { label: "control", small: true, corner: "left", glyph: "⌃" },
    { label: "option", small: true, corner: "left", glyph: "⌥" },
    { label: "command", w: 1.25, small: true, corner: "left", glyph: "⌘" },
    { label: "", w: 5.5 },
    { label: "command", w: 1.25, small: true, corner: "right", glyph: "⌘" },
    { label: "option", small: true, corner: "right", glyph: "⌥" },
    { label: "arrows", w: 3, arrows: true },
  ],
];
