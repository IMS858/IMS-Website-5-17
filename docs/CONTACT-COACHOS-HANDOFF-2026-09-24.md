# Website → Coach OS checkpoint — 2026-09-24

## Actual inspected state
- Production website `imsmethod.com`: Vercel READY deployment `dpl_C8MZQXdsxb2wsMbwkf1RjaWyZ4PU`, SHA `345e1adae7f49c928f5829ede54456a750c59801`. Its contact form posts to Web3Forms; booking remains on Vagaro and client login points to Coach OS production.
- Website main is newer at `62556241640e723c1febb4107f3b010a11912944`. Main is not proof of production deployment.
- Direct contact integration is website PR #3, branch `feature/direct-contact-email-2026-09`, unmerged at inspection. Organic website work remains a separate branch/PR.
- The prior contact handler contained literal escaped newlines after a `//` comment, commenting out the entire Coach OS sync block. This patch executes and regression-tests the sync.

## Behavior
1. Validate input and exact origin; reject unapproved preview sends.
2. Resend accepts the studio notification with visitor Reply-To. A returned provider ID is required.
3. Await a bounded HTTPS POST to the configured Coach OS `/api/integrations/website-lead`, carrying the provider ID as `inquiry_id` and a server-only shared secret.
4. Separately attempt an acknowledgement with the studio Reply-To. An acknowledgement failure does not falsely mark the original form submission failed.
5. Keep acceptance, acknowledgement and CRM recording distinct. No claim of actual inbox delivery or a personal coach reply.

Both emails use stable provider idempotency keys. Resend retains keys for 24 hours, not indefinitely: https://resend.com/docs/dashboard/emails/idempotency-keys . Identical submissions can be coalesced within that provider window. After the window, a new provider ID represents a new inquiry. Coach OS must retain the reference for reconciliation.

## Required configuration — do not paste secrets into repo/chat
Website project: `RESEND_API_KEY`, verified `RESEND_FROM_EMAIL`, optional `CONTACT_INBOX`, explicit `IMS_COACH_OS_SYNC_URL`, `IMS_WEBSITE_SYNC_SECRET` matching Coach OS. Having Resend configured in Coach OS does not establish it is configured in this separate project.
Preview sends are OFF unless `IMS_CONTACT_PREVIEW_SEND_ENABLED=true` is explicitly configured for a controlled recipient test. This patch does not change environment values or authorize real test messages.

## Remaining launch gates
- Read/verify project-scoped env settings, sender-domain verification, exact paired deployment SHAs and server-to-server access. Preview SSO redirects are not success; do not weaken deployment protection.
- Sync is bounded best effort after provider acceptance. No durable automatic retry worker exists here yet. `coach_os_needs_reconciliation` / `needs_reconciliation` and the provider reference identify accepted emails requiring manual replay. Do not call this lossless CRM ingestion.
- Honeypot/origin checks are not sufficient public abuse prevention. Add and verify server-side rate limiting/bot controls before public promotion.
- Verify real delivery/reply and duplicate/timeout handling with explicitly approved test recipients, not real clients.
- This is not Gmail reply ingestion or two-way email sync. A studio inbox reply does not automatically appear in the private client chat. Rental inquiries/chatbot and Vagaro appointments require separate integration review.
- No website production promotion, booking-provider switch, production data write, client email, SMS or payment occurred during this patch. Tests are synthetic.
