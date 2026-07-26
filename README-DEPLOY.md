# IMS website — deploy package

Everything needed to make imsmethod.com work, including your 15 photos.

## Why your photos are in here

As of this build, https://imsmethod.com/assets/images/jason-client-coaching.jpg
returns 404 — the images are missing from your server. The 15 photos in
`assets/images/` are the same web-optimized files that were live before
(200–400 KB each, correct filenames). Uploading this package restores them.

---

## Upload everything in this zip to your repo

    /                    19 .html + sitemap.xml + robots.txt + vercel.json
    /assets/             styles.css, site.js
    /assets/images/      15 photos + 3 logo files
    /api/                chat.js

Overwrite anything that already exists.

## Then delete these old files from the repo root

    the-ims-method.html   services.html      coaching.html
    recovery-room.html    memberships.html   about.html
    book.html             faq.html           contact.html
    blog.html             (+ your 3 old blog post files)
    styles.css            scripts.js

`index.html` gets overwritten, not deleted. `services.html` is gone for good —
`vercel.json` redirects that URL to /coaching.html so nobody hits a 404.

**Do not delete the repository itself.** Vercel is connected to it.

## Chat widget — replaced

`assets/js/chatbot.js` in this package is a new widget, written to replace the
one that was lost. Same filename and path your HTML already points at, so
nothing else changes. It talks to `api/chat.js`, which is also in here.

If your original chatbot.js is still on the server, this overwrites it.

---

## Already configured — nothing to set up

- Web3Forms key `344c4f71-...` is in contact.html, rent-space.html, self-check.html
- `ANTHROPIC_API_KEY` is already in Vercel — leave it
- Vagaro booking widget is embedded in book.html; the fallback link points to
  https://www.vagaro.com/innovativemovementsolutions/book-now

## After it deploys — check these

1. Photos load on the homepage.
2. Submit the contact form to yourself — it should reach admin@imsfitnesscenter.com.
3. Chat bubble appears (only if your chatbot.js survived).
4. Ask the chatbot "my shoulder hurts, what should I do?" — it must decline.
5. Open it on your phone.

Then submit https://imsmethod.com/sitemap.xml in Google Search Console.

---

## New pages since the old site

| Page | What it is |
|---|---|
| self-check.html | Interactive 6-check movement screen — the lead capture |
| morning-routine.html | The 5-minute joint routine, with diagrams |
| rent-space.html | Practitioner space rental — new revenue line |
| privacy.html | **Draft — have an attorney review** |
| terms.html | **Draft — have an attorney review** |
| 3 blog posts | CARs, the handoff problem, eating for training |

## Editing later

Colour, type and spacing are CSS custom properties at the top of
`assets/styles.css` under `:root`. Change once, updates everywhere.
Page copy is plain HTML — edit directly.
