# Kozphy.github.io

Portfolio site for **Zixsa**: CI & agent reliability for financial systems, with quant trading infrastructure as a core specialty and a technology-risk mindset throughout.

Live site: [kozphy.github.io](https://kozphy.github.io)

## Pages

- `index.html`: positioning, technology-risk lens, three pillars, featured work, experience, skills
- `projects.html`: every public flagship system with problem, approach, evidence, and a pillar filter
- `quant.html`: quant research methodology (data integrity, validation, costs, risk, execution)
- `404.html`: served by GitHub Pages for missing paths

## Structure

```text
Kozphy.github.io/
|- index.html
|- projects.html
|- quant.html
|- 404.html
|- sitemap.xml
|- robots.txt
|- _config.yml              # excludes notes and docs from the published site
|- assets/
|  |- css/styles.css
|  |- js/projects-data.js   # single source of truth for project cards
|  |- js/main.js            # theme toggle, project rendering, filters, reveal animations
|  `- img/                  # favicon.svg, og-card.png (social preview)
`- .github/workflows/site-checks.yml
```

Plain HTML, CSS, and vanilla JavaScript. No framework, package manager, or build step.

## Adding or editing a project

Edit `assets/js/projects-data.js`. Each entry needs `repo`, `title`, `pillar` (`reliability`, `financial`, or `quant`), `summary`, `problem`, `approach`, `stack`, and `evidence`. Optional fields:

- `featured: true` shows the project on the home page
- `ci: "ci.yml"` adds a live GitHub Actions status badge (only add it for repos whose CI is green)
- `note` shows a short scope or licensing note

Update the metric cards in `index.html` and `projects.html` if the project count changes.

## Quality checks

`.github/workflows/site-checks.yml` runs on every push and pull request:

- `html-validate` on all pages (config in `.htmlvalidate.json`)
- `node --check` on the JavaScript files
- `lychee` link checking (LinkedIn and shields.io are excluded because they block bots)

Run the HTML check locally with:

```bash
npx html-validate@9 "*.html"
```

## Local preview

Serve the folder so paths behave like GitHub Pages:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deployment

GitHub Pages deploys from the `main` branch, root folder. Pushing to `main` publishes the site.
