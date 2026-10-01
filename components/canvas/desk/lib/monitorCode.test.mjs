import test from "node:test";
import assert from "node:assert/strict";
import { MONITOR_FILES, tokenize } from "./monitorCode.mjs";

test("tokenize keeps every character and colours the basics", () => {
  const line = 'const { scene } = useGLTF(MODEL_URL, "x"); // load 2';
  const runs = tokenize(line);
  assert.equal(runs.map((r) => r.text).join(""), line);
  const kindOf = (text) => runs.find((r) => r.text.includes(text))?.kind;
  assert.equal(kindOf("const"), "keyword");
  assert.equal(kindOf("useGLTF"), "call");
  assert.equal(kindOf('"x"'), "string");
  assert.equal(kindOf("// load 2"), "comment");
  assert.equal(kindOf("MODEL_URL"), "type");
});

test("swift keywords and attributes", () => {
  const runs = tokenize("    @State private var selectedAmount: Double?", "swift");
  const kindOf = (text) => runs.find((r) => r.text.includes(text))?.kind;
  assert.equal(kindOf("@State"), "attribute");
  assert.equal(kindOf("private"), "keyword");
  assert.equal(kindOf("Double"), "type");
});

test("each monitor shows a real file excerpt", () => {
  for (const file of Object.values(MONITOR_FILES)) {
    assert.ok(file.lines.length >= 30, file.path);
    assert.ok(file.firstLine >= 1);
    for (const line of file.lines)
      assert.equal(tokenize(line, file.language).map((r) => r.text).join(""), line);
  }
});
