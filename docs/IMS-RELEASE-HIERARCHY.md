# IMS release hierarchy — website, Coach OS, generator

## System ownership (avoid duplicate sources of truth)

| Layer | Repository / project | Owns | Must not own |
|---|---|---|---|
| Public website | IMS858/IMS-Website-5-17 / Vercel ims-website-5-17 | Marketing pages, local search, contact and assessment entry | Gym schedule, client health records, program generation |
| Scheduling | Vagaro | Appointment availability, booking confirmations, existing consultation waiver | Program prescriptions or Coach OS authentication |
| Coach OS | IMS858/coachos / Vercel coachos | Staff workflow, assessment records, draft review, program publication and client access | Vagaro availability or public website SEO |
| Generator | IMS858/program-generator / Vercel program-generator | Deterministic IMS prescription and protected PDF rendering | Client identity, authorization or publication decisions |
| Database | Supabase | RLS-protected records and private program PDFs | Public booking calendar |

**Canonical live website:** imsmethod.com. Other older website repositories (IMS-Website, IMS-Webpage, Website) and Vercel projects exist; do not change them as part of this release without confirming domain ownership.

## Release dependency order

1. **Generator:** 247 regression tests green; confirm preview's protected /api/render works with the shared server-side secret and a synthetic assessment. Do not expose the secret in the browser.
2. **Coach OS:** typecheck and Vercel preview green; verify its configured generator URL targets the tested deployment and the secret matches. Exercise generate → save draft → review/edit → render client PDF → publish → client download using synthetic coach and client accounts. Verify an unrelated client gets 403/404 and cannot access coach artifacts.
3. **Website:** verify /book.html's Vagaro embed and fallback, forms, real photos, mobile nav, sitemap and existing URLs on the preview. Keep consultation booking in Vagaro; link authenticated clients to Coach OS. Do not imply a calendar sync.
4. **Release:** merge generator first, then Coach OS integration PR #3 and UI PR #4 in their dependency order, then website PR #1. Recheck Vercel production builds and run the same synthetic end-to-end flow against production. Do not merge based solely on a green preview build.

## Current verification status (September 22, 2026)

- Generator feature-branch CI: 247 tests passed; generator preview READY.
- Coach OS feature-branch CI: passed at prior verified commit; latest preview READY. Database private PDF bucket and coach-only archive created with RLS.
- Website organic-growth PR #1: preview READY; live booking/form submission and Search Console verification not yet demonstrated.
- Shared production environment variables and authenticated end-to-end tests: **not verified**.
- Production main branches: feature changes **not merged**.

## Release gates

- [ ] Synthetic client end-to-end generate/edit/publish/download passes.
- [ ] Cross-client and anonymous private-PDF access denied.
- [ ] Coach-only assessment summary and request payload never appear in client-readable program data.
- [ ] Website Vagaro consultation actually books and includes the existing waiver.
- [ ] Contact and self-check forms deliver test submissions.
- [ ] Site's production domain and canonical URLs verified.
- [ ] Generator, Coach OS and website production deployments healthy after merge.
- [ ] Confirm no unexpected redirects, stale links or missing photos on mobile.

## Deployment map

Pushing a feature branch triggers a **Vercel preview**. Only merging into each project's configured production branch triggers a **production deployment**. A READY preview is not an authenticated end-to-end pass.
