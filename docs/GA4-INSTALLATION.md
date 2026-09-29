# IMS public website — consent-gated GA4 installation

Owner supplied and explicitly authorized Measurement ID: `G-9CYYFYT8ZY`.
A Measurement ID is public routing configuration, not an API key. The screenshot establishes
that this tag is displayed in the GA property labeled imsfitnesscenter.com, but does not
independently expose/verify its numeric property ID against Windsor account 496495621.

## Scope and release discipline

The analytics change starts from website main 62556241640e723c1febb4107f3b010a11912944.
It does not merge website PRs #1/#2/#3, change booking/email handlers, change marketing copy,
add a Google Ads campaign, or promote the standalone Python program-generator.
The pre-existing shared navigation and animation script is preserved byte-for-byte after a
small first-party optional-module loader. No Google code is statically included in page heads.

## Runtime

/assets/site.js loads /assets/analytics.js. It renders an optional nonmodal consent banner and
persistent footer controls; closing the banner is not consent. The tag is blocked until explicit
opt-in (Google basic consent mode). Existing valid consent is remembered per browser/host for
180 days. GPC or DNT keeps this installation off. Local storage failure is explained, not treated
as persistent consent. The UI doesn't block site navigation, forms or bookings when declined.

Production collection is allowed only for HTTPS imsmethod.com or www.imsmethod.com, and only
for the finite list of informational pages in PAGES. Unknown routes, queries outside the exact
campaign vocabulary, URL fragments, forms, embedded frames, booking/contact/practitioner
forms and movement self-checks do not load the tag. Individual blog article paths are excluded
in this first rollout. Preview/localhost collection is intentionally blocked even after consent.
No public marketing tag is installed anywhere in the separate Coach OS repository.

One gtag config sends one default page view with a predefined page title, query-free page URL,
and origin-only configured referrer. No custom form, chat, lead, consultation, sale or payment
events are sent. Advertising consent stays denied; Google signals/ad-personalization signals
are disabled. Cookie names are prefixed ims_ga4 and are host-scoped, with 180-day expiry.
User IDs, form answers, client identifiers and self-check results are never read by our module.
This is not a guarantee about all Google account-side settings or a legal compliance certification.

Allowlisting a campaign parameter only makes the page eligible; this release does not certify
campaign attribution and does not capture GCLID. Ads conversion measurement is a separate,
explicitly reviewed consent/identity rollout. Don't call a page view a qualified lead.

Withdrawal sets Google's ga-disable flag, removes only this installation's visible analytics
cookies and reloads to unload already-executed third-party code. Cross-tab changes/BFCache
restores recheck consent. It cannot erase Google data already collected. Duplicate installation
and tag failures fail closed and are not blindly retried. A loaded script is not proof of delivery.

## Acceptance before calling GA4 working

1. Deploy this exact tested website commit. Confirm the live /assets/site.js loads analytics.js
   and the live analytics.js contains G-9CYYFYT8ZY. A repository commit is not a production deploy.
2. In Google Analytics, review this web stream's Enhanced Measurement settings. Disable
   automatic form interactions, site search, outbound-click/file/video tracking and history-based
   page changes for this conservative rollout. The connector cannot inspect/change these settings.
   Our static whitelist excludes forms, but doesn't substitute for account-side review. Do not
   enable user-provided data, signals, advertising destinations or enhanced conversions as part
   of this installation. Review retention and redaction settings separately.
3. Verify numeric GA property ID against the intended Windsor connection. Renaming the
   property/stream alone never installs the tag and cannot backfill uncollected historical traffic.
4. In a normal browser on the real public domain: confirm no gtag/GA requests before consent
   or after decline. Allow analytics and verify exactly one tag config/page view. Verify a real
   page view in GA4 Realtime / Tag Assistant. Do not invent form submissions or purchase events.
5. Check mobile banner layout, keyboard controls, footer reopening and withdrawal, including
   after navigating to privacy/self-check. Preview and source-test traffic must not pollute GA4.
6. Standard processed reports may lag; keep the prior empty snapshots as historical evidence,
   not rewritten zeroes or backfilled invented activity. A browser blocker may prevent collection.

Tests run synthetic browser objects without contacting Google. They cover before/after consent,
privacy signals, URL/domain/path exclusions, duplicate initialization, expiry, storage failure,
withdrawal, cross-tab/BFCache revocation, loader failure, metadata minimization and source
preservation. They do not replace an actual browser/Realtime acceptance test.

Primary implementation references:
- https://developers.google.com/tag-platform/security/concepts/consent-mode
- https://developers.google.com/tag-platform/security/guides/consent-debugging
- https://developers.google.com/analytics/devguides/collection/ga4/views
- https://developers.google.com/analytics/devguides/collection/ga4/reference/config

No credentials, private client data or real visit/conversion fixtures belong in this repository.
