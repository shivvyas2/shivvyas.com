const { createElement: h } = require("react");
const { ImageResponse } = require("next/og");
const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

async function main() {
  const logo = await fs.readFile(
    path.join(root, "public/brand/precision-fold-3d.png"),
  );
  const image = new ImageResponse(
    h(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 80px",
          background: "#080808",
          color: "#f8f8f8",
          fontFamily: "sans-serif",
          borderBottom: "12px solid #f44e00",
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: "#b3b3b3",
          },
        },
        h("span", null, "SOFTWARE ENGINEER · NEW YORK"),
        h("span", null, "shivvyas.com"),
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          },
        },
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 20 } },
          h(
            "div",
            { style: { fontSize: 120, letterSpacing: -7 } },
            "Shiv Vyas",
          ),
          h(
            "div",
            { style: { fontSize: 34, color: "#ff854d" } },
            "Code. Sound. Perspective.",
          ),
        ),
        h("img", {
          src: `data:image/png;base64,${logo.toString("base64")}`,
          width: 260,
          height: 260,
        }),
      ),
      h(
        "div",
        { style: { fontSize: 26, color: "#b3b3b3" } },
        "Web, mobile & AI applications. Built with a creative eye.",
      ),
    ),
    { width: 1200, height: 630 },
  );
  await fs.writeFile(
    path.join(root, "public/images/shiv-vyas-social.png"),
    Buffer.from(await image.arrayBuffer()),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
