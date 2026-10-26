import { readFile } from "node:fs/promises";
import sharp from "sharp";

// Keep every platform's icon in sync with the editable SVG source.
const source = await readFile(new URL("../src/app/icon.svg", import.meta.url), "utf8");
// Full-bleed background lets the OS apply its own mask. The cup stays
// inside Android's central maskable safe area.
const installedIcon = Buffer.from(source.replace('rx="112"', 'rx="0"'));
for (const [path, size] of [
  ["../public/icons/icon-192.png", 192],
  ["../public/icons/icon-512.png", 512],
  ["../public/icons/maskable-512.png", 512],
  ["../src/app/apple-icon.png", 180],
]) {
  await sharp(installedIcon).resize(size, size).png().toFile(new URL(path, import.meta.url).pathname);
}
