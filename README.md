# WrestleDesk

Clickable demo of a back office for independent wrestling clubs, youth programs, and small BJJ or MMA gyms. The sample club is **Lot 9 Wrestling** in Des Moines. People, dues, and waivers are fake. Nothing charges a card, and the app does not call a payment processor.

The three deep flows are household memberships, a monthly billing run with a preview, and waiver send / track (sent, opened, signed, expired, resend). Check-in, the week schedule, coach cards, and a phone-width parent page are on the same desk.

## Live demo

[https://starbuckdj.github.io/wrestledesk-demo/](https://starbuckdj.github.io/wrestledesk-demo/)

The site is static and uses relative links, so it works under the GitHub Pages project path `/wrestledesk-demo/` and from a local server at the repo root.

## Run locally

From the repo root:

```bash
python3 -m http.server 4173
```

Open [http://127.0.0.1:4173/](http://127.0.0.1:4173/).

No build step and no backend. Sample data starts in `js/data.js`. Clicks are stored in `localStorage` under `wrestledesk-demo-v1`. Use **Reset sample data** in the desk sidebar to put it back.

## Screens

- Marketing homepage
- Owner desk
- Front desk check-in
- Members and a family account (Alvarez: parent, three athletes, sibling discount)
- Billing, past-due queue, fake card form, November billing run
- Weekly schedule
- Waivers
- Coaches
- Parent page

## Screenshots

PNGs in `screenshots/` were taken with Playwright at 1440×900, except the parent page at 390×844. Recapture:

```bash
npm install
npx playwright install chromium
python3 -m http.server 4173
node scripts/capture.mjs
```

## Deploy

`.github/workflows/pages.yml` publishes the static site to GitHub Pages on every push to `main`, using the Actions build source.
