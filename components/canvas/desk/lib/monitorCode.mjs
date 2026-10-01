// Real excerpts shown on the monitors: the desk's own React code in Cursor
// (left) and the Life OS donut chart in Xcode beside the simulator (right).
// Regenerate by copying the same ranges if the sources move a lot; they are
// decoration, so small drift is fine.
export const MONITOR_FILES = {
  "left": {
    "path": "components/canvas/desk/DeskModel.jsx",
    "firstLine": 14,
    "lines": [
      "export default function DeskModel({ isMobile, active, onHoverDesk, children }) {",
      "  const { scene, nodes } = useGLTF(MODEL_URL);",
      "  const drift = useRef(null);",
      "  const rim = useRef(null);",
      "  const hover = useRef({ on: false, spring: { value: 0, velocity: 0 } });",
      "  const mode = useDesk((s) => s.mode);",
      "  const drifting = active && mode === \"hero\";",
      "",
      "  useEffect(() => {",
      "    scene.traverse((part) => {",
      "      if (part.isMesh) {",
      "        part.castShadow = true;",
      "        part.receiveShadow = true;",
      "      }",
      "    });",
      "  }, [scene]);",
      "",
      "  const bounds = useMemo(() => {",
      "    scene.updateWorldMatrix(true, true);",
      "    return new Box3().setFromObject(scene);",
      "  }, [scene]);",
      "  const diaryAnchor = nodes.Interactive_Diary;",
      "",
      "  useFrame((state, delta) => {",
      "    let busy = false;",
      "    if (drift.current) {",
      "      const target = drifting",
      "        ? Math.sin((state.clock.elapsedTime / DRIFT_PERIOD) * Math.PI * 2) * DRIFT",
      "        : 0;",
      "      drift.current.rotation.y += (target - drift.current.rotation.y) * Math.min(1, delta * 4);",
      "      busy = drifting || Math.abs(drift.current.rotation.y) > 1e-4;",
      "    }",
      "    const h = hover.current;",
      "    h.spring = springStep(h.spring, h.on && mode === \"hero\" ? 1 : 0, delta, { stiffness: 60, damping: 15.5 });"
    ],
    "language": "js"
  },
  "xcode": {
    "path": "LIfeOS/Features/Money/View/MoneyCharts.swift",
    "firstLine": 60,
    "language": "swift",
    "lines": [
      "// MARK: - Where it went",
      "",
      "struct MoneyDonut: View {",
      "    let slices: [CategorySlice]",
      "    var size: CGFloat = 128",
      "    var onSelect: (CategorySlice) -> Void = { _ in }",
      "    @Environment(\\.colorScheme) private var scheme",
      "    @State private var selectedAmount: Double?",
      "",
      "    var body: some View {",
      "        Chart(slices) { slice in",
      "            SectorMark(",
      "                angle: .value(\"Share\", slice.amount),",
      "                innerRadius: .ratio(0.62),",
      "                // The paper gap between fills, so two adjacent steps of the",
      "                // same ink read as two slices and not a gradient.",
      "                angularInset: 1.5",
      "            )",
      "            .cornerRadius(3)",
      "            .foregroundStyle(MoneyPalette.ink.resolve(scheme).opacity(slice.opacity))",
      "        }",
      "        .chartLegend(.hidden)",
      "        .chartAngleSelection(value: $selectedAmount)",
      "        .onChange(of: selectedAmount) { _, amount in",
      "            guard let amount, let slice = slice(at: amount) else { return }",
      "            selectedAmount = nil",
      "            if !slice.isOther { onSelect(slice) }",
      "        }",
      "        .frame(width: size, height: size)",
      "        .accessibilityLabel(\"Spending by category\")",
      "        .accessibilityValue(slices.map { \"\\($0.name) \\(Int($0.share * 100)) percent\" }.joined(separator: \", \"))",
      "    }",
      "",
      "    /// `chartAngleSelection` reports a position along the cumulative angle",
      "    /// value, in the data's own units. Walk the slices until it is passed.",
      "    private func slice(at amount: Double) -> CategorySlice? {"
    ]
  }
};

const JS_KEYWORDS = new Set([
  "import", "from", "export", "default", "function", "const", "let", "return",
  "if", "else", "for", "of", "new", "await", "async", "true", "false", "null",
  "undefined", "this", "typeof", "while", "break", "continue",
]);
const SWIFT_KEYWORDS = new Set([
  "struct", "class", "enum", "extension", "protocol", "let", "var", "func",
  "return", "if", "else", "guard", "for", "in", "while", "private", "public",
  "static", "some", "nil", "self", "true", "false", "import", "init",
]);
const KEYWORDS = { js: JS_KEYWORDS, swift: SWIFT_KEYWORDS };
const TOKEN =
  /(\/\/.*$)|(@[A-Za-z_]\w*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|(<\/?[A-Za-z][\w.]*)|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)|(\s+)|([^\sA-Za-z_$\d"'`/<]+|.)/g;

// Split one line into coloured runs: comment, attribute (@State), string,
// number, tag, call, keyword, type (Capitalised), plain.
export function tokenize(line, language = "js") {
  const keywords = KEYWORDS[language] ?? JS_KEYWORDS;
  const runs = [];
  for (const m of line.matchAll(TOKEN)) {
    const [text, comment, attribute, string, number, tag, call, word] = m;
    let kind = "plain";
    if (comment) kind = "comment";
    else if (attribute) kind = "attribute";
    else if (string) kind = "string";
    else if (number) kind = "number";
    else if (tag) kind = language === "js" ? "tag" : "plain";
    else if (call) kind = keywords.has(call) ? "keyword" : "call";
    else if (word) kind = keywords.has(word) ? "keyword" : /^[A-Z]/.test(word) ? "type" : "plain";
    const last = runs[runs.length - 1];
    if (last && last.kind === kind) last.text += text;
    else runs.push({ text, kind });
  }
  return runs;
}
