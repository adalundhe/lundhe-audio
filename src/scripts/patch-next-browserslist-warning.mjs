import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const warningPattern =
  /\d+<\(new Date\)\.setMonth\(\(new Date\)\.getMonth\(\)-2\)&&console\.warn\("\[baseline-browser-mapping\] The data in this module is over two months old\.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`"\);/;

function main() {
  let nextPackageJsonPath;

  try {
    nextPackageJsonPath = require.resolve("next/package.json");
  } catch {
    console.warn("[patch-next-browserslist-warning] Skipping patch because `next` is not installed.");
    return;
  }

  const browserslistBundlePath = path.join(
    path.dirname(nextPackageJsonPath),
    "dist/compiled/browserslist/index.js",
  );

  if (!fs.existsSync(browserslistBundlePath)) {
    console.warn(
      `[patch-next-browserslist-warning] Skipping patch because the compiled browserslist bundle was not found at ${browserslistBundlePath}.`,
    );
    return;
  }

  const source = fs.readFileSync(browserslistBundlePath, "utf8");

  if (!source.includes("[baseline-browser-mapping] The data in this module is over two months old.")) {
    return;
  }

  const patched = source.replace(warningPattern, "0;");

  if (patched === source) {
    console.warn(
      `[patch-next-browserslist-warning] Found the warning text but could not patch the expected expression in ${browserslistBundlePath}.`,
    );
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(browserslistBundlePath, patched);
  console.log("[patch-next-browserslist-warning] Patched Next's stale baseline-browser-mapping warning.");
}

main();
