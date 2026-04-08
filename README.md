# Kozphy.github.io

Static GitHub Pages portfolio for Zixsa with a three-layer structure:

- `index.html`: professional overview for business, consulting, and international audiences
- `projects.html`: technical project layer for implementation credibility
- `quant.html`: deeper quantitative trading and systems methodology layer

## File Structure

```text
Kozphy.github.io/
|- index.html
|- projects.html
|- quant.html
|- styles.css
|- script.js
`- README.md
```

## What This Site Is

This repository contains a deploy-ready portfolio site built with:

- HTML
- CSS
- Vanilla JavaScript

There is no framework, package manager, or build step. The site is suitable for GitHub Pages because every page is served directly as static files from the repository root.

## Features

- Three-layer portfolio navigation: Main, Projects, Quant
- Sticky navigation bar
- Dark and light mode toggle
- Smooth scrolling
- Section reveal transitions
- Responsive layout for desktop and mobile

## Deploying To GitHub Pages

If this repository is the user or organization site named `Kozphy.github.io`, deployment is straightforward:

1. Push the repository to GitHub.
2. Open the repository settings.
3. Go to `Pages`.
4. Set the source to `Deploy from a branch`.
5. Select the `main` branch and `/ (root)` folder.
6. Save the settings.

GitHub Pages will then publish the site from the root static files in this repository.

## Editing Content

Update the content directly in the HTML files:

- `index.html`: hero, about, experience, skills, contact
- `projects.html`: project case studies
- `quant.html`: strategy, backtesting, risk, execution, stack

Update the shared presentation and interaction files here:

- `styles.css`: colors, layout, spacing, typography, responsive behavior
- `script.js`: theme toggle, reveal animations, sticky header behavior

## Local Preview

You can preview the site by opening `index.html` in a browser, or by serving the folder with any lightweight static server.
