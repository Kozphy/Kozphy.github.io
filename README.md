# Zixsa — portfolio site

Live site: https://kozphy.github.io/

Static HTML, CSS, and vanilla JavaScript. No runtime dependencies or build step.

Positioning: **candidate portfolio first** (Technology Risk · Risk & Controls · Financial Data). Product waitlist for **Checktrail** lives at `/checktrail/`.

## Visitor journey

- `index.html` — hiring homepage (hero, proof strip, 10-minute path, evidence, skills, experience, recruiter contact)
- `checktrail/` — Checktrail product wedge + waitlist
- `career/` — redirect to homepage (legacy URL)
- `workpaper.html` — sample Risk Advisory control workpaper
- `recon.html` — educational CSV reconciliation with before/after metrics
- `case.html` — interactive Apple FY2025 case (secondary FA evidence)
- `resume.html` — one-page résumé (print / save PDF)
- `report.html` — downloadable / printable base-case report
- `projects.html` — evidence pack
- `quant.html` — secondary markets-control review notes
- `404.html` — fallback page

Waitlist (product only): `assets/js/waitlist.js`. Set `FORMSPREE_ENDPOINT` there for server-side email capture.

## Calculation contract

The browser model mirrors the simplified Python case at source revision `a35303cb179f2d30aa17780e368af55c3f8a476b` of `Kozphy/financial-analysis-tool`. It uses a CFO-minus-capex proxy, not full unlevered FCFF. Base: $143.49/share; selected sensitivity corners: $114.84 and $193.47. These are illustrative model outputs.

`assets/data/apple-fy2025.csv` is the original repository case snapshot. The JavaScript model contains an explicit fixed snapshot derived from it. If inputs change, update both and the expected-output tests together.

## Reconciliation sample

`scripts/recon_validate.py` compares `assets/data/recon-source.csv` vs `recon-bank.csv` and writes `recon-result.json` + `recon-exceptions.csv`. Educational only.

## Maintain and verify

- `assets/css/portfolio.css` — shared design and responsive rules
- `assets/js/case-model.js` — pure financial calculation and scenario CSV generation
- `assets/js/portfolio.js` — accessible controls, chart, table, and download interaction
- `tests/case-model.test.cjs` — expected outputs, input validation, and scenario-export checks

Run: `node --test tests/case-model.test.cjs`

Preview from the repository root with: `python -m http.server 8000`

The GitHub Actions workflow validates HTML, JavaScript syntax, model checks, and links. GitHub Pages publishes `main` from the root.

## Evidence boundaries

Educational case data and synthetic evaluation evidence are labeled. No client delivery, independent assurance, production adoption, trading returns, or live-model performance is claimed. A passing calculation test is not validation of the model assumptions.
