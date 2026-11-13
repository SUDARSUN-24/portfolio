# Sudasun · Portfolio

One-page portfolio: **https://sudarsun-24.github.io/**

Plain HTML, CSS and JavaScript. No framework, no build step, no trackers, no external requests.

```
portfolio/
├── index.html        the whole site (Hero, Projects, About, Skills, Contact)
├── 404.html          "page not found"
├── css/styles.css    mobile-first styles; light/dark follows the system
├── js/main.js        optional extras (the email "Copy" button)
├── fonts/            Instrument Sans + IBM Plex Mono (SIL Open Font License)
├── assets/           project screenshots (WebP, 800 and 1600 wide), og-image.png
├── favicon.svg
├── robots.txt, sitemap.xml
└── .nojekyll         tells GitHub Pages to serve files as they are
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

GitHub Pages from the `main` branch, root folder. Pushing to `main` updates the live site in about a minute.
