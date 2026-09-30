const { createElement: h } = require("react");
const { ImageResponse } = require("next/og");
const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const brand = path.join(root, "public/brand");

async function pngSource(filename) {
  const data = await fs.readFile(path.join(brand, filename));
  return `data:image/png;base64,${data.toString("base64")}`;
}

async function render(source, size, background = "transparent", inset = 0) {
  const response = new ImageResponse(
    h(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background,
        },
      },
      h("img", {
        src: source,
        width: size - inset * 2,
        height: size - inset * 2,
      }),
    ),
    { width: size, height: size },
  );
  return Buffer.from(await response.arrayBuffer());
}

function iconFile(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, index) => {
    const entry = 6 + index * 16;
    header[entry] = size;
    header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map(({ data }) => data)]);
}

async function main() {
  const flat = await pngSource("precision-fold-mono-master.png");
  const dimensional = await pngSource("precision-fold-3d-master.png");
  await fs.writeFile(
    path.join(brand, "precision-fold-mono.png"),
    await render(flat, 128),
  );
  await fs.writeFile(
    path.join(brand, "precision-fold-3d.png"),
    await render(dimensional, 512),
  );

  const icons = [];
  for (const size of [16, 32, 48, 96, 180, 192, 512]) {
    const data = await render(flat, size, "#000000", Math.round(size * 0.04));
    const filename =
      size === 96
        ? "favicon-96x96.png"
        : size === 180
          ? "apple-touch-icon.png"
          : `brand/icon-${size}.png`;
    await fs.writeFile(path.join(root, "public", filename), data);
    if (size <= 48) icons.push({ size, data });
    if (size === 96)
      await fs.writeFile(path.join(root, "public/images/favicon.png"), data);
  }
  await fs.writeFile(path.join(root, "public/favicon.ico"), iconFile(icons));
  console.log(
    "Generated Precision Fold brand assets, favicon, and browser icons.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
