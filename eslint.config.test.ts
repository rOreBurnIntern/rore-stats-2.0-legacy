import assert from "node:assert/strict";
import test from "node:test";

test("ignores generated Vercel build output", async () => {
  const { ESLint } = await import("eslint");
  const eslint = new ESLint({ cwd: process.cwd() });

  assert.equal(
    await eslint.isPathIgnored(".vercel/output/functions/api/explore.func/___next_launcher.cjs"),
    true
  );
});
