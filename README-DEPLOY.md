# IMS website — deploy

Unzip this and upload the contents into your repo (`IMS858/IMS-Website-5-17`)
via github.dev. The folder structure here matches your repo exactly — drop each
file where it sits in this zip.

---

## 1. Delete these old files from the repo first

At the repo root:

    index.html            the-ims-method.html    services.html
    coaching.html         recovery-room.html     memberships.html
    about.html            book.html              faq.html
    contact.html          blog.html              (+ your 3 old blog post files)
    styles.css            scripts.js

`services.html` is gone for good — its content now lives across Coaching,
Recovery Room, and the practitioner page. `vercel.json` redirects the old URL
so nobody hits a 404.

## 2. DO NOT delete or touch

    assets/images/          your 15 photos + logo-color.svg/png — still in use
    assets/js/chatbot.js    the chat widget UI — every new page loads it
    api/                    (chat.js gets replaced, see below)

**Do not delete the repository itself.** Your photos live in it, and Vercel is
connected to it. Deleting files is reversible; deleting the repo is not.

## 3. Upload from this zip

    /                    19 .html files + sitemap.xml + robots.txt + vercel.json
    /assets/             styles.css, site.js
    /assets/images/      logo-blue.png, logo-white.png, logo-white-solid.png
    /api/                chat.js   (replaces the existing one)

## 4. Nothing to configure

- Web3Forms key is already in `contact.html`, `rent-space.html`, `self-check.html`
- `ANTHROPIC_API_KEY` is already set in Vercel — leave it alone
- Vagaro booking widget is already embedded in `book.html`

## 5. After it deploys — check these four

1. Submit the contact form to yourself. It should arrive at admin@imsfitnesscenter.com.
2. Open `/book.html` and confirm the Vagaro calendar loads. (Untested — my
   sandbox couldn't reach vagaro.com.)
3. Ask the chatbot "my shoulder hurts, what should I do?" — it must decline and
   refer you to a licensed provider.
4. Open it on your phone.

Then submit `https://imsmethod.com/sitemap.xml` in Google Search Console so the
new pages get indexed.

---

## What's new since the old site

| Page | Note |
|---|---|
| `self-check.html` | Interactive 6-check movement screen — the lead capture |
| `morning-routine.html` | The 5-minute joint routine, with diagrams |
| `rent-space.html` | Practitioner space rental — new revenue line |
| `privacy.html` | **Draft — have an attorney review** |
| `terms.html` | **Draft — have an attorney review** |
| 3 blog posts | CARs, the handoff problem, eating for training |

## Still worth doing

- Optimize your outpainted images: squoosh.app at 1920px wide, 80% quality,
  under 400 KB. Keep the original filenames so nothing else changes.
- Have a California business attorney review `privacy.html` and `terms.html`,
  and make sure your in-person client waiver is drafted by one too. That
  document protects you more than anything on this site.
- Point imsfitnesscenter.com at this site or take it down — it still advertises
  Pilates as an IMS service.

## Editing later

All colour, type, and spacing values are CSS custom properties at the top of
`assets/styles.css` under `:root`. Change a value there and it updates
everywhere. Page copy is plain HTML — edit it directly.
