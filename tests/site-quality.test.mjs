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

test("self-check email request requires consent and discloses its data processor", () => {
  const source = read("self-check.html");
  assert.match(source, /name="self_check_share_consent"[^>]*required/);
  assert.match(source, /href="\/privacy\.html"/);
  assert.match(source, /third-party|form provider/i);
  assert.match(read("privacy.html"), /Web3Forms/);
  assert.match(read("privacy.html"), /Anthropic/);
});


test("the coaching team is visible sitewide without claiming one-coach capacity", () => {
  for (const page of html) {
    const source = read(page);
    if (source.includes('id="navLinks"')) assert.ok(source.includes('href="/coaches.html">Coaches</a>'), page + " coaches navigation");
    assert.doesNotMatch(source, /one-coach studio|founder and the only coach|sole coach/i, page);
  }
  const team = read("coaches.html");
  assert.match(team, /Jason Patterson/);
  assert.match(team, /Gabe/);
  assert.doesNotMatch(team, /Tim/);
  assert.match(team, /current openings, coach fit, and rates/);
  assert.ok(read("sitemap.xml").includes("https://imsmethod.com/coaches.html"));
});

test("the booking calendar and Recovery Room actions name the correct path", () => {
  assert.match(read("book.html"), /calendar currently books Jason/);
  assert.match(read("book.html"), /contact IMS about Gabe/);
  assert.ok(read("recovery-room.html").includes("tel:+16199371434"));
  assert.doesNotMatch(read("recovery-room.html"), /Book a Recovery Room visit/);
});

test("public assistant facts match the multi-coach website", () => {
  const api = read("api/chat.js");
  assert.match(api, /Jason Patterson and Gabe/);
  assert.match(api, /coach-specific rates/);
  assert.doesNotMatch(api, /founder and the only coach|exactly two things/i);
  assert.ok(api.includes("/coaches.html"));
});

test("published memberships are clearly identified as Jason's plans", () => {
  assert.match(read("memberships.html"), /published membership plans are coached by Jason/);
  assert.match(read("memberships.html"), /availability and rates with Gabe/);
});


test("privacy policy reflects the conditionally enabled contact and analytics processors", () => {
  const policy = read("privacy.html");
  assert.match(policy, /Resend/);
  assert.match(policy, /IMS Coach OS/);
  assert.match(policy, /Google Analytics/);
  assert.match(policy, /analytics-privacy\.html/);
});
