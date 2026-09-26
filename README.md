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

Any static host will work. Your domain's DNS stays at DreamHost, so **Netlify** is the simplest option: it accepts a plain `A` record for the bare domain. (Cloudflare Pages only supports the bare domain if you move DNS to Cloudflare.)

**Netlify**

1. Sign up at netlify.com, then choose **Add new site → Import an existing project** and pick this GitHub repo and the `main` branch.
2. Leave the build command empty and set the publish directory to `.`. Deploy.
3. Check the site at the `<name>.netlify.app` address before touching the domain.
4. Every push to `main` redeploys the site automatically.

**GitHub Pages** (alternative)

- In the repo, go to **Settings → Pages → Deploy from branch** and choose `main` and `/ (root)`.
- On a free GitHub plan, the repo must be public for this to work.

**DreamHost hosting** (if you already pay for a hosting plan there)

- Upload everything in this folder, except `.git` and `README.md`, to the site's web directory over SFTP.

## Moving the domain off Squarespace (domain registered at DreamHost)

Squarespace only hosts the website. The domain is yours at DreamHost, so moving means changing where DreamHost points it. Your email is Gmail, so there are no mail records to worry about.

1. **Connect the domain in Netlify:** in your Netlify site, go to **Domain management → Add a domain** and enter `seangarciafilm.com`. Choose to keep DNS at your current provider. Netlify shows you the records to create.
2. **Change the records at DreamHost:** log in to panel.dreamhost.com and open the DNS settings for `seangarciafilm.com` (under Websites/Domains).
   - Delete the records that point to Squarespace:
     - `A` records for the bare domain pointing at `198.185.159.x` / `198.49.23.x`
     - the `www` CNAME pointing at `ext-sq.squarespace.com`
     - any Squarespace verification CNAME, e.g. `xxxx → verify.squarespace.com`
   - Add the Netlify records:

     | Type  | Name            | Value                       |
     |-------|-----------------|-----------------------------|
     | A     | (blank / `@`)   | `75.2.60.5`                 |
     | CNAME | `www`           | `<your-site>.netlify.app.`  |

   - Keep any other records, e.g. Google verification TXT records.
   - If the domain is set up in DreamHost as a *redirect* rather than *DNS only*, switch it to DNS only (no hosting) first, so the custom records take effect.
   - If you're hosting on GitHub Pages instead, the bare domain needs four `A` records (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) and `www` is a CNAME to `<username>.github.io.`.
3. **Wait:** DNS changes usually show up within an hour, but can take up to 24–48 hours. Netlify issues the HTTPS certificate automatically once the records resolve. You can press **Verify DNS configuration** in Netlify to check.
4. **Finish up on Squarespace:**
   - Once `https://seangarciafilm.com` and `https://www.seangarciafilm.com` both load the new site, go to **Squarespace → Settings → Domains** and disconnect `seangarciafilm.com`.
   - Then cancel the website subscription in **Settings → Billing**.
   - Doing it in this order means the site never goes offline.
