# Sudasun · Portfolio

One-page portfolio of Sudasun, front-end developer in Bangkok: **https://sudasun.vercel.app/**

Plain HTML, CSS and JavaScript. No framework, no build step, no trackers. The only outside request is the GitHub test-status badge.

```
portfolio/
├── index.html        the whole site (hero, work index, projects, about, contact)
├── 404.html          "page not found"
├── css/styles.css    mobile-first styles; light/dark follows the system
├── js/main.js        optional extras (Bangkok clock, index preview, gallery viewer, copy email)
├── fonts/            Instrument Serif, Geist, Geist Mono (SIL Open Font License)
├── assets/           screenshots (WebP), resume.pdf, og-image.png
├── favicon.svg, robots.txt, sitemap.xml
└── vercel.json       security headers and caching
```

## Run it locally

Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8080
```

then go to http://localhost:8080.

## Update a screenshot

Save a 1920×1200 capture (16:10) and make the two WebP sizes:

```
python -c "from PIL import Image; im=Image.open('shot.png').convert('RGB'); [im.resize((w,w*10//16),Image.LANCZOS).save(f'assets/NAME-{w}.webp',quality=80,method=6) for w in (800,1600)]"
```

## Deploy

Hosted on Vercel (project `sudasun`). From this folder:

```
npx vercel@latest deploy --prod --yes
```
