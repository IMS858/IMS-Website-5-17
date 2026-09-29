# IMS organic growth and capacity plan — September 2026

## Confirmed owner-reported baseline
- 29 clients acquired over approximately 38 weeks.
- Approximately one organic inquiry per week; owner books inquiries personally.
- Four prospects chose elsewhere; reasons unknown.
- No additional unbooked or unresponsive inquiries reported.
- 14 of 29 acquired clients are currently active.
- Two additional ongoing clients can be accepted before more trainers are needed.
- If 29 acquisitions plus four competitor losses are the complete decided cohort, decided-prospect acquisition = 29/33 = 87.9%; this is not website visitor conversion.
- Current active share of acquired cohort = 14/29 = 48.3%; this is not a formal retention measure because enrollment dates and program completions are unknown.

## Verified repository
Static HTML website on Vercel; existing booking page with Vagaro integration, self-check, local business schema, robots.txt, sitemap.xml and existing navigation/hero booking CTAs. Preserve current rankings and booking functionality.

## Business objective and sequencing
1. Fill two remaining client spots without disrupting the organic acquisition channel.
2. Understand outcomes of 15 acquired clients no longer active: program completion, scheduling, price, relocation, dissatisfaction or other; do not assume churn causes.
3. Create trainer onboarding and capacity plan before accelerating acquisition.
4. Once additional trainer capacity exists, expand qualified local search demand.

## Immediate engineering tasks on this branch
- Baseline organic queries, landing pages, indexed pages and clicks using Search Console if access granted.
- Verify live booking widget/fallback, contact/self-check forms, imagery, mobile navigation, accessibility and Core Web Vitals.
- Add only evidence-backed SEO improvements to existing coaching and assessment content and relevant blog internal links.
- Instrument consent-respecting events: inquiry, assessment booking completed, assessment attended, paid client.
- Keep existing URLs, canonicals, sitemap and conversion path; no speculative full redesign.
- Do not expose or alter API keys or claim legal/medical compliance.

## Capacity and retention operations
- Track inquiry date, source, booked/attended, purchased, training frequency, active status and reason for departure where voluntarily provided.
- Identify repeatable trainer processes: assessment protocol, programming templates, progress review, client communication, escalation/referral boundaries.
- Determine trainer hiring trigger, schedule coverage and quality standards before increasing lead volume.

## Remaining owner inputs
- Whether all 29 acquired clients were paying (implied, not explicitly confirmed).
- Approximate join dates and voluntary departure reasons for 15 no longer active, if available.
- Search Console/GA4 read-only access or exports.
- Current membership prices and billing policies; verify Vagaro booking works.
- Trainer economics, timetable and hiring preferences.

## Safeguards
All code changes on a separate branch and draft PR. No merge/deploy without owner review. Preserve current production functionality and authentic brand assets.