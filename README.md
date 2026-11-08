# Zixsa — financial-data portfolio

Live site: https://kozphy.github.io/

Static HTML, CSS, and vanilla JavaScript. No runtime dependencies or build step.

## Visitor journey

- index.html — positioning, case preview, selected work, contact.
- case.html — scenario controls, calculation results, sensitivity table, CSV export, and Python reproduction steps.
- report.html — self-contained base-case report; downloadable for offline reading and printable from the browser.
- projects.html — selected financial-data and AI-evaluation evidence with limits.
- quant.html — secondary research-methodology notes.
- 404.html — fallback page.

## Calculation contract

The browser model mirrors the simplified Python case at source revision a35303cb179f2d30aa17780e368af55c3f8a476b of Kozphy/financial-analysis-tool. It uses a CFO-minus-capex proxy, not full unlevered FCFF. Base: $143.49/share; selected sensitivity corners: $114.84 and $193.47. These are illustrative model outputs.

assets/data/apple-fy2025.csv is the original repository case snapshot. The JavaScript model contains an explicit fixed snapshot derived from it. If inputs change, update both and the expected-output tests together.

## Maintain and verify

- assets/css/portfolio.css — shared design and responsive rules.
- assets/js/case-model.js — pure financial calculation and scenario CSV generation.
- assets/js/portfolio.js — accessible controls, chart, table, and download interaction.
- tests/case-model.test.cjs — expected outputs, input validation, and scenario-export checks.

Run: node --test tests/case-model.test.cjs

Preview from the repository root with: python -m http.server 8000

The existing GitHub Actions workflow validates HTML, JavaScript syntax, model checks, and links. GitHub Pages publishes main from the root. All local asset paths are relative.

## Evidence boundaries

Educational case data and synthetic evaluation evidence are labeled. No client delivery, independent assurance, production adoption, trading returns, or live-model performance is claimed. A passing calculation test is not validation of the model assumptions.
