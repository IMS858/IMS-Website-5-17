# IMS Vagaro intake and two-option booking setup

Status: Website booking options added on draft PR. Phone online booking and Vagaro forms require owner configuration in Vagaro. Do not claim they are live.

## Booking services
1. Existing: Free in-person movement assessment, 30 minutes. Keep existing Vagaro booking widget/service and availability.
2. New: Introductory phone consultation. Proposed 15 minutes (owner to confirm). Create a separate Vagaro service with phone appointment delivery, distinct availability/buffer and phone number instructions. Once confirmed, use its exact service-specific booking URL on book.html. Until then, website offers click-to-call or contact message for phone scheduling. Do not send phone leads to the in-person assessment booking without clarifying the service.

## Short intake (Vagaro)
- What is your main goal for coaching? (short text, required)
- What prompted you to reach out now? (short text, optional)
- What does your current training/activity look like? (optional)
- What would you like to discuss during the call or assessment? (optional)
- Any access needs or relevant concerns you want the coach to know before the appointment? (optional, private Vagaro intake only)
- Best callback number (required for phone consultations)
Keep intake short; do not ask for detailed diagnoses in an unprotected web form.

## Consent and waiver
- Obtain an attorney-reviewed exercise participation waiver appropriate to in-person screening/training, including informed consent, risk acknowledgment and emergency contact as appropriate.
- Attach the correct waiver to the in-person assessment in Vagaro and require completion before the visit.
- For a phone-only introductory conversation, use a separate applicable privacy/contact consent if needed; do not impose an exercise participation waiver on a non-exercise call.
- Do not publish a homegrown legal waiver or claim e-signatures are configured until confirmed.
- Check applicable California privacy requirements and retention settings with appropriate counsel; restrict staff access.

## Automations and QA
- Send confirmation and reminder messages for each service with correct location or phone-call instructions.
- Test as a new client on mobile: book each service, receive forms, complete intake, sign waiver, confirm records visible to coach and reminders delivered.
- Check that phone and in-person calendars do not double-book Jason.
- Track service type, inquiry source, booked, attended and paid conversions; avoid exposing sensitive intake in analytics.
- Update website's phone booking CTA to exact Vagaro service link after owner supplies or confirms it.

## Owner confirmations needed
- Preferred phone consult length (suggest 15 minutes) and who initiates call.
- Exact Vagaro phone-consult booking link after service creation.
- Whether Vagaro already contains an approved waiver and intake; whether existing assessments currently require it.
- Whether existing assessment booking should remain free and 30 minutes.

## Confirmed from owner's actual Vagaro notification example (2026-09-22)
- Existing service is called `Personal Training Consultation`, 30 minutes, assigned to Jason Patterson.
- Booking email already includes client name, email, phone, appointment date/time and a free-text appointment note.
- The example note includes age, a general training goal and first-time coaching experience; this shows the current notes field can capture useful context without a separate duplicate website form.
- Do not store real client identifiers or reproduce actual notification details in repository documentation.
- Prefer a brief prompt within Vagaro's existing booking notes plus a short secure intake only for information not already captured.
- Confirm whether the existing approved waiver is already attached and mandatory before adding or changing it.
- Phone consultation: proposed 15 minutes, pending owner confirmation and creation in Vagaro; no live online phone booking link yet.
- ChatGPT has no Vagaro connector currently available; owner must configure inside Vagaro or use an authorized browser workflow. Do not claim Vagaro settings were modified.
- IMS app migration is a separate future workstream; do not switch the booking flow to the app until the app's scheduling, forms, consent and notifications are verified end-to-end.
