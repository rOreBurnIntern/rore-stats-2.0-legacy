import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

test("ignores generated Vercel build output", async () => {
  const configSource = readFileSync(path.join(process.cwd(), "eslint.config.mjs"), "utf8");

  assert.match(configSource, /"\.vercel\/\*\*"/);
  assert.match(configSource, /"\.test-dist\/\*\*"/);
});
