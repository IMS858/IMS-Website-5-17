import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "api/chat.js"), "utf8");
const { default: handler } = await import(
  "data:text/javascript;base64," + Buffer.from(source).toString("base64")
);
function response() {
  return {
    statusCode: 200, body: null, headers: {},
    setHeader(key, value) { this.headers[key] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
}
function request(messages, origin = "https://imsmethod.com") {
  return {
    method: "POST",
    headers: { host: "imsmethod.com", origin },
    body: { messages },
  };
}

test("cross-site browser requests cannot trigger paid AI calls", async () => {
  const result = response();
  await handler(request([{ role: "user", content: "Hello" }], "https://unrelated.example"), result);
  assert.equal(result.statusCode, 403);
  assert.equal(result.headers["Cache-Control"], "private, no-store");
});

test("oversized chat histories are rejected before contacting the model", async () => {
  const result = response();
  await handler(request([{role: "user", content: "x".repeat(20000)}]), result);
  assert.equal(result.statusCode, 413);
});

test("valid same-origin chat strips oversized history and returns only answer text", async () => {
  const previousKey = process.env.ANTHROPIC_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.ANTHROPIC_API_KEY = "synthetic-test-key";
  let upstream = null;
  globalThis.fetch = async (_url, init) => {
    upstream = JSON.parse(init.body);
    return { ok: true, json: async () => ({content: [{type: "text", text: "You can book at /book.html."}]}) };
  };
  try {
    const result = response();
    await handler(request(Array.from({ length: 12 }, (_, i) => ({
      role: i % 2 ? "assistant" : "user", content: "x".repeat(1200),
    })).concat([{role: "user", content: "How do I book?"}])), result);
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.reply, "You can book at /book.html.");
    assert.equal(upstream.messages.length, 8);
    assert.ok(upstream.messages.every(m => m.content.length <= 900));
    assert.ok(upstream.messages.at(-1).content.includes("book?"));
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previousKey;
  }
});
