# seangarciafilm.com

A plain HTML and CSS copy of the Squarespace portfolio at <https://seangarciafilm.com>. It has no build step, no framework and no dependency on Squarespace. The fonts and images are all stored in this repo. Videos are embedded from Vimeo and YouTube, just as they were on Squarespace.

## What's here

```
index.html                         Selected Work grid (home page, 36 projects)
about/index.html                   About page
selected-work/<project>/index.html One page per project (same URLs as Squarespace)
404.html                           Not-found page
assets/css/style.css               All styling (Poppins + Manrope, the site's greys, grid layout)
assets/js/site.js                  Mobile menu toggle
assets/fonts/                      Poppins and Manrope (both under the SIL Open Font License)
assets/images/                     Thumbnails, headshot and social-share image
```

Every page keeps its Squarespace URL (for example `/about` and `/selected-work/tenet`), so existing links and search results keep working.

## Editing

- **Change text:** open the page's `index.html` and edit the text between the tags.
- **Add a project:**
  1. Copy one of the `selected-work/<project>/` folders and rename it.
  2. Change the title, the credit and the Vimeo or YouTube `iframe src`.
  3. Put a 16:9 thumbnail in `assets/images/`.
  4. In `index.html`, copy one `<a class="grid-item">…</a>` block and point it at the new folder and thumbnail.
  5. Update the Previous and Next links on the neighbouring project pages.
- **Preview locally:** run `python3 -m http.server` in this folder, then open <http://localhost:8000>. Links start with `/`, so opening the files by double-clicking won't work.

## Hosting (free)

Any static host will work. **Cloudflare Pages** is the easiest route if you also want to move the domain to Cloudflare (see below). Netlify and GitHub Pages work the same way.

**Cloudflare Pages**

1. Sign up at dash.cloudflare.com, then go to **Workers & Pages → Create → Pages → Connect to Git** and pick this repo.
2. Set the framework preset to **None**. Leave the build command empty and set the output directory to `/`.
3. Deploy. The site goes live at `<name>.pages.dev`. Check it there before touching the domain.
4. Every push to the branch redeploys the site automatically.

**Netlify**

- Choose **Add new site → Import from Git**, pick this repo, leave the build command empty and set the publish directory to `.`.

**GitHub Pages**

- In the repo, go to **Settings → Pages → Deploy from branch** and choose `main` and `/ (root)`.
- On a free GitHub plan, the repo must be public for this to work.

## Moving the domain off Squarespace

Don't cancel anything on Squarespace until the new site is live on your domain. Your email is Gmail, so there are no mail records to move. Before you change anything, check **Squarespace → Domains → seangarciafilm.com → DNS** for any extra records you added yourself, such as Google site verification TXT records, and copy those over too.

**Option A: transfer the domain to Cloudflare (recommended)**

1. In Cloudflare, go to **Add a site**, enter `seangarciafilm.com` and choose the Free plan. Cloudflare imports your current DNS records.
2. Remove the imported Squarespace records for `@` and `www`. Then, in your Pages project, go to **Custom domains** and add `seangarciafilm.com` and `www.seangarciafilm.com`. Cloudflare creates the correct records.
3. In Squarespace, go to **Domains → seangarciafilm.com**:
   - Change the nameservers to the two Cloudflare gives you.
   - Wait until Cloudflare shows the site as **Active**. This usually takes minutes to hours.
4. Still in Squarespace:
   - Turn off the **Transfer lock**. Also turn off privacy/WHOIS protection if Squarespace asks you to.
   - Copy the **auth (EPP) code**.
5. In Cloudflare, go to **Domain Registration → Transfer Domains**, choose the domain, paste the code and pay for one year. Cloudflare charges the renewal price at cost, and your expiry date is extended by a year.
6. Approve the confirmation email if one arrives. Transfers finish in up to 5 days, and the site stays up throughout.

A domain can't be transferred within 60 days of being registered or last transferred.

**Option B: point the domain elsewhere and leave it registered at Squarespace**

In **Squarespace → Domains → DNS**, delete the Squarespace defaults and add the records your host asks for. For Netlify, that's an `A` record for `@` pointing to `75.2.60.5` and a `CNAME` for `www`. You keep paying Squarespace for the domain only, not for the website plan.

**Finish up**

1. Once `https://seangarciafilm.com` loads from the new host and HTTPS works, cancel the Squarespace **website** subscription in **Settings → Billing**.
2. If you did a transfer, make sure the domain shows as transferred first, so you don't cancel the domain by mistake.
