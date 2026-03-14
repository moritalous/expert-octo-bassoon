import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const docsDir = path.join(root, "docs");

async function main() {
  await rm(path.join(docsDir, "assets"), { recursive: true, force: true });
  await rm(path.join(docsDir, "content"), { recursive: true, force: true });
  await rm(path.join(docsDir, "public"), { recursive: true, force: true });

  await mkdir(docsDir, { recursive: true });
  await cp(path.join(root, "index.html"), path.join(docsDir, "index.html"));
  await cp(path.join(root, "assets"), path.join(docsDir, "assets"), { recursive: true });
  await cp(path.join(root, "content"), path.join(docsDir, "content"), { recursive: true });
  await mkdir(path.join(docsDir, "public"), { recursive: true });
  await cp(path.join(root, "public", "index.json"), path.join(docsDir, "public", "index.json"));

  console.log("[OK] Prepared docs/ for GitHub Pages.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
