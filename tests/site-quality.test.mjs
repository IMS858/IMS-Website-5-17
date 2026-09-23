import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = fs.readdirSync(root).filter(name => name.endsWith(".html") && name !== "404.html");
const fileExists = (name) => fs.existsSync(path.join(root, name));
const links = (text) => [...text.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/g)].map(m => m[1]);
const localPath = (url) => {
  if (!url.startsWith("/") || url.startsWith("//")) return null;
  const clean = decodeURI(url.split(/[?#]/)[0]);
  if (clean === "/") return "index.html";
  if (!/\.(?:html|css|js|png|jpg|jpeg|svg|webp|xml|txt)$/.test(clean)) return null;
  return clean.slice(1);
};

test("all local HTML, stylesheet, script and image references exist", () => {
  const redirects = JSON.parse(read("vercel.json")).redirects || [];
  const remaps = new Set(redirects.map(x => x.source.replace(/^\//, "")));
  const broken = [];
  for (const page of html) {
    for (const link of links(read(page))) {
      const file = localPath(link);
      if (file && !fileExists(file) && !remaps.has(file)) broken.push(page + " → " + file);
    }
  }
  assert.deepEqual(broken, []);
});

test("every public page has its own canonical URL and descriptive title", () => {
  for (const page of html) {
    const source = read(page);
    assert.match(source, /<title>[^<]{12,}<\/title>/i, page);
    const expected = page === "index.html" ? "https://imsmethod.com/" : "https://imsmethod.com/" + page;
    assert.ok(source.includes('rel="canonical" href="' + expected + '"'), page + " canonical");
    assert.match(source, /<meta name="description" content="[^"]{35,}"/i, page);
  }
});

test("JSON-LD on every page remains parseable", () => {
  for (const page of html) {
    const source = read(page);
    for (const match of source.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      assert.doesNotThrow(() => JSON.parse(match[1]), page + " JSON-LD");
    }
  }
});

test("image alt attributes exist and no internal image URL is broken", () => {
  for (const page of html) {
    const source = read(page);
    for (const img of source.matchAll(/<img\b[^>]*>/gi)) {
      assert.match(img[0], /\balt\s*=\s*["'][^"']*["']/i, page + " img alt");
    }
  }
});

test("homepage, consultation and self-check are in sitemap and can be crawled", () => {
  const xml = read("sitemap.xml");
  for (const target of ["https://imsmethod.com/", "https://imsmethod.com/book.html", "https://imsmethod.com/self-check.html"]) {
    assert.ok(xml.includes("<loc>" + target + "</loc>"), "sitemap missing " + target);
  }
  assert.match(read("robots.txt"), /Sitemap:\s*https:\/\/imsmethod\.com\/sitemap\.xml/);
});

test("chat request budget, privacy and same-origin checks remain enabled", () => {
  const api = read("api/chat.js");
  const widget = read("assets/js/chatbot.js");
  assert.match(api, /MAX_BODY_CHARS/);
  assert.match(api, /req\.headers\.origin/);
  assert.match(api, /AbortSignal\.timeout/);
  assert.match(api, /Cache-Control.*no-store/);
  assert.doesNotMatch(api, /console\.error\(['"]Anthropic API error['"], upstream\.status, detail\)/);
  assert.match(widget, /history\.slice\(-8\)/);
  assert.match(widget, /function esc\(/);
});
