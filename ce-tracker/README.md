# RenewReady: CE tracker

A simple tracker for nurses, therapists and other licensed professionals: every license, the continuing-education (CE) hours earned this cycle, the mandatory topics still owed, and the certificates, ready for an audit.

## What works today

- **Licenses**: profession, state, number, expiration date, renewal cycle, hours required, and mandatory topics (for example "Implicit bias, 1 hr").
- **Courses**: date, hours, provider, and which licenses a course counts toward (one course can count for several). Attach a PDF or a phone photo of the certificate.
- **Progress per license**: hours earned in the current cycle, topics met, days left, and a status (on track, falling behind, due soon, ready to renew, past renewal date).
- **"I renewed"** moves a license to its next cycle.
- **Calendar reminders**: an `.ics` file with reminders 90, 30 and 7 days before each expiration, plus the day itself.
- **Audit report**: a printable record per license, which can be saved as a PDF.
- **Back up and restore**: a JSON backup that includes the certificate files.

Everything is stored in the browser: records in localStorage, certificate files in IndexedDB. There is no server and no account.

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests (cycle math, status, reminders, data validation)
npm run build    # typecheck + production build into dist/
```

The build is a static site, so it can be deployed for free on Vercel, Netlify or Cloudflare Pages.

## Next steps toward a paid product

1. **Validate**: put it in front of 10–20 nurses and therapists and watch where they get stuck.
2. **Accounts and sync** (e.g. Supabase auth, Postgres and storage), so data survives a lost phone and works across devices.
3. **Email and text reminders** that are sent automatically, replacing the downloaded calendar file.
4. **Requirement templates** for the most common profession and state pairs, researched and dated, and always labeled "verify with your board".
5. **Stripe billing**: a free tier with one license, and a paid tier (about $5/month or $39/year) for unlimited licenses, cloud backup and reminders.
