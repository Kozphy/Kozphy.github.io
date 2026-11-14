# Checktrail

Company site: https://kozphy.github.io/

**Primary goal:** learn customer demand (interviews, design partners, WTP).  
**Secondary:** hiring archive at `/career/` (footer link only; `robots.txt` disallows indexing).

## Funnel

| Path | Job |
|------|-----|
| `/` | Outcome-led attention → discovery call |
| `/problem.html` | Affirm failure modes |
| `/demo.html` | Sign-off-ready export → unlock pilot intent |
| `/interview.html` | Slot request (learning call) |
| `/waitlist.html` | Soft demand only |
| `/pricing.html` | Anchor price; deposit/LOI = WTP |

`/recon.html` → `/demo.html`. `/resume.html` → `/career/resume.html`. `/quant.html` → `/career/quant.html`.

Waitlist / interview / pilot / problem forms → Formspree `https://formspree.io/f/xdegapgp` (email relay to founder).

## Demo evidence boundaries

- Educational / synthetic CSV recon only — **not** production evidence, audit opinion, or SOX work.
- Cardinality mismatches quarantine surplus rows.
- `Investigate` / `Escalate` **block** sign-off-ready export; resolving dispositions unlock it.
- Pack `sha256` hashes the JSON body **before** hash fields are attached — **not** CSV file bytes.
- Agent-answer grading is roadmap positioning, not in the public demo module.

## Conversion events (privacy-minimal)

Client `ctTrack` / `dataLayer` (console only unless you add a tag manager later). Payload is event name + path/`form_kind` — **no email or company**.

| Event | When |
|-------|------|
| `home_view` | Homepage load |
| `demo_view` | Demo page load |
| `demo_export` | Sign-off-ready pack exported (`sha256_prefix` only) |
| `problem_affirm` | Problem form success |
| `interview_book` | Interview form success |
| `waitlist_submit` | Waitlist form success |
| `pilot_request` | Pilot form success |

## Local checks

```powershell
node --check assets/js/recon-core.js
node --check assets/js/recon-demo.js
node --test tests/recon-demo.test.cjs
node --test tests/case-model.test.cjs
npx --yes html-validate@9 "*.html" "career/*.html" "checktrail/*.html"
python -m http.server 8080
```
