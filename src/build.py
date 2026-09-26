#!/usr/bin/env python3
"""Generate the site's HTML from src/content.json.

Usage (from the repo root):  python3 src/build.py
Edit content.json to add or change projects, then re-run and upload the output.
No dependencies beyond Python 3.
"""
import hashlib
import html
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = json.load(open(os.path.join(ROOT, 'src', 'content.json'), encoding='utf-8'))
DOMAIN = 'https://seangarciafilm.com'



def asset(path):
    """Append a content hash so browsers fetch the new file whenever it changes."""
    with open(os.path.join(ROOT, path.lstrip('/')), 'rb') as f:
        return f"{path}?v={hashlib.sha256(f.read()).hexdigest()[:10]}"


CATEGORIES = [('all', 'All'), ('trailer', 'Trailers'), ('tv', 'TV Spots'), ('digital', 'Digital & Social')]
CATEGORY_LABEL = dict(CATEGORIES)

e = lambda s: html.escape(s, quote=True)


def head(title, path, description=None):
    description = description or SITE['tagline']
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(description)}">
<meta name="color-scheme" content="light dark">
<link rel="canonical" href="{DOMAIN}{path}">
<meta property="og:site_name" content="{e(SITE['name'])}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:url" content="{DOMAIN}{path}">
<meta property="og:type" content="website">
<meta property="og:image" content="{DOMAIN}/assets/images/social-share.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/assets/fonts/manrope.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{asset('/assets/css/style.css')}">
<script>document.documentElement.classList.add('js')</script>
</head>
'''


def header(current):
    def link(href, label, key):
        cur = ' aria-current="page"' if key == current else ''
        return f'<a href="{href}"{cur}>{label}</a>'
    return f'''<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/"><span class="brand-name">{e(SITE['name'])}</span><span class="brand-role">{e(SITE['role'])}</span></a>
    <nav class="nav" aria-label="Main">
      {link('/', 'Work', 'work')}
      {link('/about/', 'About', 'about')}
      {link('/contact/', 'Contact', 'contact')}
    </nav>
  </div>
</header>
<main id="main">
'''


def footer():
    social = ''.join(f'<li><a href="{u}" target="_blank" rel="noopener">{e(n)}</a></li>' for n, u in SITE['social'])
    return f'''</main>
<footer class="site-footer">
  <div class="wrap">
    <p class="footer-kicker reveal">Let’s work together</p>
    <a class="footer-email reveal" href="/contact/">Get in touch<span class="arrow" aria-hidden="true">↗</span></a>
    <div class="footer-bottom">
      <ul class="footer-social">{social}</ul>
      <p>© <span class="year">2026</span> {e(SITE['name'])} · Los Angeles</p>
    </div>
  </div>
</footer>
<script src="{asset('/assets/js/site.js')}" defer></script>
</body>
</html>
'''


def write(path, content):
    dest = os.path.join(ROOT, path.strip('/'), 'index.html') if path != '/' else os.path.join(ROOT, 'index.html')
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, 'w', encoding='utf-8') as f:
        f.write(content)


def video(m, eager=False):
    ratio = m['ratio']
    shape = 'vertical' if ratio < 0.9 else 'square' if ratio < 1.2 else 'wide'
    loading = '' if eager else ' loading="lazy"'
    return (f'<div class="player player--{shape}" style="--ratio:{ratio}">'
            f'<iframe src="{e(m["video"])}" title="{e(m["title"] or "Video")}"{loading} '
            f'allow="autoplay; fullscreen; picture-in-picture; encrypted-media"></iframe></div>')


def card(p, i):
    return (f'<a class="card reveal" href="/selected-work/{p["slug"]}/" data-category="{p["category"]}" style="--i:{i % 3}">'
            f'<div class="card-media"><img src="{p["thumb"]}" alt="" loading="lazy" decoding="async" width="1000" height="563"></div>'
            f'<div class="card-meta"><h3 class="card-title">{e(p["name"])}</h3>'
            f'<span class="card-kind">{e(p["kind"])}</span></div></a>')


projects = SITE['projects']
reel = next((p for p in projects if p['category'] == 'reel'), None)
work = [p for p in projects if p['category'] != 'reel']

# ---------- Home ----------
counts = {c: (len(work) if c == 'all' else sum(p['category'] == c for p in work)) for c, _ in CATEGORIES}
chips = ''.join(
    f'<button class="chip" type="button" data-filter="{c}" aria-pressed="{str(c == "all").lower()}">{label}<span class="chip-count">{counts[c]}</span></button>'
    for c, label in CATEGORIES)
reel_html = ''
if reel:
    reel_html = f'''<section class="wrap reel reveal" aria-label="Editing reel">
  {video(reel['spots'][0]['media'][0], eager=True)}
  <p class="reel-caption"><span>Editing Reel</span><a href="/selected-work/{reel['slug']}/">Open ↗</a></p>
</section>
'''
home = head(f"{SITE['name']} | {SITE['role']}", '/') + header('work') + f'''<section class="wrap hero">
  <h1 class="hero-title reveal">{e(SITE['tagline'])}</h1>
  <p class="hero-sub reveal">{e(SITE['guild'])} · <a href="/contact/">Get in touch</a></p>
</section>
{reel_html}<section class="wrap work" aria-labelledby="work-heading">
  <div class="work-head">
    <h2 id="work-heading" class="section-label">Selected Work</h2>
    <div class="chips" role="group" aria-label="Filter projects">{chips}</div>
  </div>
  <div class="grid" id="grid">
    {''.join(card(p, i) for i, p in enumerate(work))}
  </div>
</section>
''' + footer()
write('/', home)

# ---------- Project pages ----------
for idx, p in enumerate(projects):
    nxt = projects[(idx + 1) % len(projects)]
    roles = sorted({s['role'] for s in p['spots'] if s['role']})
    meta = [p['kind']] + roles
    if len(p['spots']) > 1:
        meta.append(f"{len(p['spots'])} spots")
    body = []
    for s in p['spots']:
        vids = [m for m in s['media'] if 'video' in m]
        imgs = [m for m in s['media'] if 'image' in m]
        vertical = all(m['ratio'] < 0.9 for m in vids) and len(vids) > 0
        media = ''.join(video(m) for m in vids) + ''.join(
            f'<img class="still" src="{m["image"]}" alt="{e(p["name"])}" loading="lazy">' for m in imgs)
        cls = 'spot-media spot-media--vertical' if vertical else 'spot-media'
        caption = ''
        if s['title'] and len(p['spots']) > 1 or (s['title'] and s['title'] != p['kind']):
            caption = f'<figcaption class="spot-caption"><span>{e(s["title"])}</span><span class="muted">{e(s["role"])}</span></figcaption>'
        body.append(f'<figure class="spot reveal"><div class="{cls}">{media}</div>{caption}</figure>')
    intro = f'<p class="project-intro">{e(p["intro"])}</p>' if p.get('intro') else ''
    page = head(f"{p['name']} | {SITE['name']}", f"/selected-work/{p['slug']}/",
                f"{p['name']} ({p['kind']}), edited by {SITE['name']}.") + header('work') + f'''<article class="wrap project">
  <a class="back" href="/#work-heading">← All work</a>
  <header class="project-head reveal">
    <h1 class="project-title">{e(p['name'])}</h1>
    <p class="project-meta">{' · '.join(e(m) for m in meta)}</p>
    {intro}
  </header>
  {''.join(body)}
</article>
<nav class="wrap next reveal" aria-label="Next project">
  <a class="next-link" href="/selected-work/{nxt['slug']}/">
    <span class="section-label">Next project</span>
    <span class="next-title">{e(nxt['name'])} <span class="arrow" aria-hidden="true">→</span></span>
    <span class="next-media"><img src="{nxt['thumb']}" alt="" loading="lazy"></span>
  </a>
</nav>
''' + footer()
    write(f"/selected-work/{p['slug']}/", page)

# ---------- About ----------
a = SITE['about']
work_rows = ''.join(
    f'<li class="row"><span>{e(w["role"].split(" @ ")[-1].strip())}<span class="muted"> · {e(w["role"].split(" @ ")[0].strip())}</span></span>'
    f'<span class="muted">{e(w["dates"])}</span></li>' for w in a['work'])
award_rows = ''.join(f'<li class="row row--award"><span class="muted">{x["year"]}</span><span>{x["html"]}</span></li>' for x in a['accolades'])
about = head(f"About | {SITE['name']}", '/about/') + header('about') + f'''<section class="wrap about">
  <div class="about-photo reveal"><img src="/assets/images/sean-garcia-headshot.jpg" alt="Portrait of {e(SITE['name'])}" width="1500" height="2249"></div>
  <div class="about-body">
    <h1 class="about-title reveal">{e(a['intro'][0])}</h1>
    <p class="about-sub reveal">{e(SITE['guild'])}</p>
    <p class="reveal"><a class="button" href="/contact/">Get in touch</a></p>
    <h2 class="section-label reveal">Experience</h2>
    <ul class="rows reveal">{work_rows}</ul>
    <h2 class="section-label reveal">Recognition</h2>
    <ul class="rows reveal">{award_rows}</ul>
  </div>
</section>
''' + footer()
write('/about/', about)

# ---------- Contact ----------
contact = head(f"Contact | {SITE['name']}", '/contact/', f"Get in touch with {SITE['name']}, an editor based in Los Angeles.") + header('contact') + '''<section class="wrap contact">
  <div class="contact-intro">
    <h1 class="about-title reveal">Let’s work together.</h1>
    <p class="about-sub reveal">Tell me about your project, timeline and what you need. I’ll get back to you as soon as I can.</p>
    <ul class="contact-links reveal">''' + ''.join(f'<li><a href="{u}" target="_blank" rel="noopener">{e(n)} ↗</a></li>' for n, u in SITE['social']) + '''</ul>
  </div>
  <form class="contact-form reveal" action="/contact/send.php" method="post" novalidate>
    <div class="field">
      <label for="name">Name</label>
      <input id="name" name="name" type="text" autocomplete="name" required maxlength="120">
    </div>
    <div class="field">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" autocomplete="email" required maxlength="200">
    </div>
    <div class="field">
      <label for="company">Company <span class="muted">(optional)</span></label>
      <input id="company" name="company" type="text" autocomplete="organization" maxlength="160">
    </div>
    <div class="field">
      <label for="message">Message</label>
      <textarea id="message" name="message" rows="6" required maxlength="5000"></textarea>
    </div>
    <div class="field field--trap" aria-hidden="true">
      <label for="website">Leave this empty</label>
      <input id="website" name="website" type="text" tabindex="-1" autocomplete="off">
    </div>
    <input type="hidden" name="t" value="">
    <button class="button button--solid" type="submit">Send message</button>
    <p class="form-status" role="status" aria-live="polite"></p>
  </form>
</section>
''' + footer()
write('/contact/', contact)

# ---------- 404 ----------
nf = head(f"Page not found | {SITE['name']}", '/') + header('') + '''<section class="wrap hero hero--center">
  <h1 class="hero-title">This page doesn’t exist.</h1>
  <p class="hero-sub"><a href="/">Back to the work →</a></p>
</section>
''' + footer()
with open(os.path.join(ROOT, '404.html'), 'w', encoding='utf-8') as f:
    f.write(nf)

print(f'Built {len(projects) + 4} pages.')
