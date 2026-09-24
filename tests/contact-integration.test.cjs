// Synthetic requests only. fetch is mocked; no real emails or hosted writes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../api/contact.js'), 'utf8')
  .replace("import { createHash } from 'node:crypto';", "const { createHash } = require('node:crypto');")
  .replace('export default async function handler', 'async function handler');
const normal = { name: 'Synthetic Visitor', email: 'visitor@example.invalid', phone: '', message: 'Synthetic inquiry only.' };
async function run({ body = normal, env = {}, method = 'POST', headers = {}, responses = [], repeat = 1 } = {}) {
  const calls = [], logs = [], results = [];
  const settings = { RESEND_API_KEY: 'synthetic-only', RESEND_FROM_EMAIL: 'IMS <studio@example.invalid>', CONTACT_INBOX: 'owner@example.invalid', IMS_COACH_OS_SYNC_URL: 'https://coach.example.invalid/api/integrations/website-lead', IMS_WEBSITE_SYNC_SECRET: 'synthetic-sync', ...env };
  const context = { require, URL, Buffer, AbortSignal, process: { env: settings }, console: Object.fromEntries(['info','warn','error'].map(level => [level, (...args) => logs.push(args.join(' '))])), fetch: async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    const result = responses.length ? responses.shift() : { ok: true, id: 'synthetic-email-id' };
    if (result instanceof Error) throw result;
    return { ok: result.ok !== false, json: async () => result };
  }};
  vm.createContext(context); vm.runInContext(source + '\nthis.handler = handler;', context);
  for (let i = 0; i < repeat; i++) {
    const result = {};
    const res = { status(code) { result.status = code; return this; }, setHeader() { return this; }, json(data) { result.body = data; return this; } };
    await context.handler({ method, headers, body }, res); results.push(result);
  }
  return { calls, logs, results };
}
test('accepted studio email is actually forwarded to Coach OS with stable provider reference', async () => {
  const r = await run(); assert.equal(r.results[0].status, 200); assert.equal(r.calls.length, 3);
  assert.equal(r.calls[1].url, 'https://coach.example.invalid/api/integrations/website-lead');
  assert.equal(r.calls[1].body.inquiry_id, 'synthetic-email-id'); assert.equal(r.calls[1].options.redirect, 'error');
  assert.equal(r.calls[0].body.reply_to, normal.email); assert.equal(r.calls[2].body.reply_to, 'owner@example.invalid');
});
test('owner acceptance failure never triggers sync or visitor acknowledgement', async () => {
  const r = await run({ responses: [{ ok: false }] }); assert.equal(r.results[0].status, 502); assert.equal(r.calls.length, 1);
});
test('unconfirmed provider ID is not treated as accepted', async () => {
  const r = await run({ responses: [{ ok: true }] }); assert.equal(r.results[0].status, 502); assert.equal(r.calls.length, 1);
});
for (const failure of [{ ok: false }, new Error('synthetic timeout')]) test('sync failure keeps accepted studio email and logs reconciliation reference', async () => {
  const r = await run({ responses: [{ id: 'accepted-id' }, failure, { id: 'ack-id' }] });
  assert.equal(r.results[0].status, 200); assert.equal(r.calls.length, 3); assert.match(r.logs.join('\n'), /needs_reconciliation/);
});
test('acknowledgement timeout does not falsely report the original form failed', async () => {
  const r = await run({ responses: [{ id: 'accepted-id' }, { ok: true }, new Error('synthetic timeout')] });
  assert.equal(r.results[0].status, 200); assert.match(r.logs.join('\n'), /acknowledgement_unconfirmed/);
});
test('both email sends carry stable distinct idempotency keys on retry', async () => {
  const r = await run({ repeat: 2 });
  assert.equal(r.calls[0].options.headers['Idempotency-Key'], r.calls[3].options.headers['Idempotency-Key']);
  assert.equal(r.calls[2].options.headers['Idempotency-Key'], r.calls[5].options.headers['Idempotency-Key']);
  assert.notEqual(r.calls[0].options.headers['Idempotency-Key'], r.calls[2].options.headers['Idempotency-Key']);
});
for (const body of [null, [], { ...normal, name: {} }, { ...normal, email: 123 }, { ...normal, message: 'x'.repeat(4001) }]) test('invalid field types/lengths fail before provider calls', async () => {
  const r = await run({ body }); assert.equal(r.results[0].status, 400); assert.equal(r.calls.length, 0);
});
test('actual bytes are bounded without trusting Content-Length', async () => {
  const r = await run({ body: { ...normal, unexpected: 'x'.repeat(12001) } }); assert.equal(r.results[0].status, 413); assert.equal(r.calls.length, 0);
});
test('foreign preview hosts cannot submit; configured exact preview works only with explicit sending approval', async () => {
  const denied = await run({ headers: { origin: 'https://unrelated.vercel.app' } }); assert.equal(denied.results[0].status, 403);
  const blocked = await run({ env: { VERCEL_ENV: 'preview' } }); assert.equal(blocked.results[0].status, 503); assert.equal(blocked.calls.length, 0);
  const enabled = await run({ headers: { origin: 'https://ims-test.vercel.app' }, env: { VERCEL_ENV: 'preview', VERCEL_URL: 'ims-test.vercel.app', IMS_CONTACT_PREVIEW_SEND_ENABLED: 'true' } }); assert.equal(enabled.results[0].status, 200);
});
for (const url of ['http://unsafe.invalid/api/integrations/website-lead', 'https://coach.example.invalid/login', 'https://user:pass@coach.example.invalid/api/integrations/website-lead']) test('unsafe sync destinations do not receive contact payload or secret', async () => {
  const r = await run({ env: { IMS_COACH_OS_SYNC_URL: url } }); assert.equal(r.calls.length, 2); assert.match(r.logs.join('\n'), /not_configured/);
});
test('honeypot produces no outbound traffic', async () => { const r = await run({ body: { ...normal, botcheck: true } }); assert.equal(r.calls.length, 0); });
test('HTML is escaped and logs omit personal fields and secrets', async () => {
  const r = await run({ body: { ...normal, message: '<script>synthetic</script>' } });
  assert.match(r.calls[0].body.html, /&lt;script&gt;/); assert.doesNotMatch(r.logs.join('\n'), /visitor@example|synthetic-sync|script/);
});
