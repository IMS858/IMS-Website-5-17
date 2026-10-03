# IMS Website Full Audit — October 3, 2026

## Scope and confidence

Reviewed the production site and current repository release, all public HTML routes, shared navigation/footer, sitemap/robots, booking and contact integrations, privacy disclosures, chatbot instructions, structured data, automated quality checks, and the current Vercel production deployment. Production is serving commit `a049e562` and Vercel reports the deployment READY.

The audit reviewed source and public page behavior. It did not establish live form delivery, completed bookings, analytics ingestion, accessibility conformance on assistive technology, field Core Web Vitals, or Search Console outcomes. Those require synthetic end-to-end checks, browser/device testing, and access to the relevant dashboards.

## Executive assessment

The visual system, real studio photography, clear niche, location details, free assessment offer, and strong client proof give IMS a useful foundation. The largest launch blocker for a multi-coach site was a site-wide promise that IMS had exactly one coach, plus a single-coach chatbot and a Vagaro calendar that only books Jason's consultation. Those statements and paths are being corrected in this branch.

The next improvements for an elite-level site are reliable coach-specific lead routing, clear terms for recurring plans, verified outcome and review evidence, measurable mobile performance/accessibility, and live operational acceptance of every conversion path. Keep hiring classification out of marketing labels until the actual arrangements have been reviewed.

## Findings by priority

### P1 — Conversion and operational correctness

- **Coach story conflicts with the planned lineup.** Home, coaching, memberships, about, FAQ, booking copy, and the chatbot asserted one coach or Jason-only delivery. Visitors could infer that Gabe and Tim are unavailable or that all services are Jason's. This branch adds a Coaches page, removes one-coach promises, makes Jason's memberships explicit, and updates the public assistant.
- **Calendar does not book every coach.** The Vagaro widget is explicitly for Jason's 30-minute Personal Training Consultation. Other coaches must not be routed into it. The booking page and team page now tell visitors to contact IMS for Gabe/Tim availability.
- **Recovery Room conversion action was misrouted.** Its “Book a Recovery Room visit” action pointed at the training assessment page. It now offers a direct phone action to arrange a visit.
- **Trainer preference needs an owner and follow-up path.** The existing message form can capture a named preference in free text, but it has no structured coach selection, distinct coach-specific schedule, or confirmed assignment workflow. Next: add a preferred-coach field, ensure both Web3Forms and any enabled direct-delivery/Coach OS route preserve it, assign an owner, and confirm receipt in a synthetic test.
- **Recurring-plan terms are incomplete at point of purchase.** The site explains a 12-hour cancellation rule, tier changes, pause by discussion, and no session rollover in existing copy; check the live terms for renewal cadence, minimum commitment, cancellation cutoff, missed-session handling, taxes/fees, and how a visitor actually starts or cancels. Put the complete terms next to the purchase/enquiry decision and mirror them in booking software.
- **Recovery Room claims and prices need regular owner review.** Equipment and benefit statements should remain descriptive rather than medical. Confirm $25 drop-in and $125 unlimited monthly rates, included access rules, and availability before each release.

### P1 — Privacy and classification

- **Provider disclosures must match the active contact configuration.** The main privacy policy named Web3Forms, while the live contact enhancement can use Resend and IMS Coach OS when direct delivery is enabled. This branch makes the disclosure conditional and links the separate consent-based analytics disclosure.
- **Do not imply worker status through website copy or schema.** California generally applies the ABC test for covered work, subject to statutory exceptions and other applicable tests; titles or website labels do not determine status. No coach is labeled employee, W-2, or independent contractor in the new marketing copy. Get California employment counsel to review the actual arrangements before making classification claims. Review the existing structured-data `employee` field for Jason for accuracy as well.
- **Privacy-sensitive intake should stay out of general messages.** Keep the site explicit that visitors should not submit diagnoses or health histories in chat or general forms. Use the dedicated booking provider only for fields it is configured to protect and disclose.

### P2 — Trust and content quality

- **Coach profile information is thin.** Gabe and Tim are named, but the site needs owner-approved biographies, actual credentials, coaching focus, authentic portraits, schedule/availability expectations, and pricing rules before the profiles can sell their fit. This branch avoids inventing those details.
- **Reviews and outcomes need traceable proof.** Verify review counts, rating date, quote text, permission, and attribution against the live source. Describe outcomes as individual experiences rather than expected results; avoid health-treatment claims.
- **Separate studio services from independent practitioners.** Existing disclaimers explain that renters operate separate businesses. Keep their booking, service, pricing, and staff claims distinct from the coaching team.
- **Pricing presentation is generally coherent but should be reconciled centrally.** Current Jason session/package rates appear in both coaching and membership pages and in JSON-LD. Maintain a single owner-approved rate sheet or release checklist so HTML, chatbot answers, schema, FAQs, and booking software never diverge.

### P2 — Search, accessibility, and mobile performance

- **Search foundations are present.** Pages have titles/descriptions, canonicals, Open Graph metadata, structured data, robots.txt, and a sitemap. This branch adds the coach page to the sitemap and provides page-specific metadata. Preserve existing URLs and monitor indexing after release.
- **Structured data needs ongoing accuracy checks.** Parseable JSON-LD is tested. Reconcile the advertised $90 session offer with current public pricing and verify opening hours, address, offers, founder/employee relationships, and certifications against owner-approved facts. Avoid adding unverified employment semantics for other coaches.
- **Accessibility coverage is partial.** Source includes skip links, labeled main navigation, button expanded state, image alt attributes, and reduced-motion handling. Automated source checks do not validate contrast, focus visibility, keyboard order, heading hierarchy in rendered pages, error announcements, iframe labeling/usability, touch targets, or screen-reader output. Run axe or equivalent plus keyboard and VoiceOver/NVDA checks at narrow and wide viewports.
- **Mobile acceptance must include third-party elements.** Test nav open/close, Vagaro iframe/fallback, pricing tables/cards, forms, cookie/analytics preferences, chatbot overlays, tel links, and embedded media at real phone widths. Check landscape and zoom/reflow.
- **Performance needs measured evidence.** Real images and explicit image dimensions are positives; Google Fonts and multiple third-party services add request cost. Measure LCP, INP, and CLS on mobile with Lighthouse and field data. Prioritize the hero image and fonts, remove unused script work, and lazy-load noncritical media if measurements show benefit.

### P2 — Security, reliability, and measurement

- **Chat endpoint bounds requests and restricts browser origins, but has no visible application rate limit.** Confirm Vercel Firewall/rate controls protect paid model calls. Test request bursts, error handling, upstream timeout behavior, and cost ceilings without real user messages.
- **Forms need end-to-end synthetic tests.** Verify both default Web3Forms and any configured direct-delivery path, consent, validation, duplicate-submit behavior, notification arrival, Coach OS receipt, and failure messaging. Never send test data to a real client or treat provider acceptance as proof of inbox delivery.
- **Analytics is consent-gated, but reporting is not conversion attribution by itself.** Measure assessment request, booked, attended, purchased, and coach assigned as separate operational outcomes, using an appropriately reviewed privacy model. Do not treat clicks/chat counts as leads or bookings.
- **Set ownership for changes.** Maintain an owner for page copy/prices, coach schedules, Vagaro services, privacy processors, chatbot facts, and release approvals. Add a quarterly site check and a pre-release checklist covering all conversion paths.

## Release acceptance checklist

- Review the Coaches page and approve names, descriptions, headshots, credential claims, rates, and availability language.
- Test Jason's Vagaro booking and the Recovery Room phone booking action on desktop and mobile.
- Submit a synthetic coach inquiry through each active contact route and verify the selected coach reaches the intended inbox/workflow.
- Review membership and Recovery Room terms against the actual billing and booking configuration.
- Run the existing GitHub Actions suite; confirm no skipped tests. Review the Vercel preview on phone and desktop before merge.
- Check SEO canonicals, sitemap, schema, navigation, privacy links, and no broken local references.
- Obtain employment counsel review of actual trainer arrangements and the existing Jason `employee` schema value before making classification claims.
- Merge and release only after owner review; production is not changed by this audit branch.
