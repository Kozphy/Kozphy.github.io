// Single source of truth for project cards on index.html, projects.html, and quant.html.
// `ci` is the workflow file name used for the live GitHub Actions status badge; omit it when a repo has no CI.
window.PORTFOLIO_PROJECTS = [
  {
    repo: "ci-failure-orchestrator",
    title: "CI Failure Orchestrator",
    pillar: "reliability",
    featured: true,
    ci: "ci.yml",
    summary: "Dependency-aware CI failure orchestration with fail-closed policy gates and bounded, auditable self-repair.",
    problem: "Auto-repairing CI is unsafe when a green test run silently becomes permission to change code, workflows, or credentials.",
    approach: "Each failure moves through classify, plan, sandboxed repair, fail-closed evaluation, a finite retry budget, and a policy gate (APPROVE / REJECT / ESCALATE) before an escalation package and durable audit record are written. Even an approved patch is never applied to the main workspace automatically.",
    stack: ["Python", "GitHub Actions", "CLI"],
    evidence: [
      "62 test files and 16 GitHub Actions workflows covering CI, security, benchmarks, and promotion",
      "7 architecture decision records, a threat model, and SLI/SLO definitions",
      "4 committed sample runs (approve, reject, escalate, human-approve) with verify commands"
    ]
  },
  {
    repo: "EvalForge",
    title: "EvalForge",
    pillar: "reliability",
    featured: true,
    ci: "ci.yml",
    summary: "Local-first evaluation engineering for AI used in finance workflows, with deterministic graders and deployment policy gates.",
    problem: "AI answers on finance tasks can sound right while being materially wrong: bad equity math, unbalanced journal entries, fabricated standards.",
    approach: "A 154-item golden set runs through deterministic graders, a simulated LLM judge, and seeded human review. Failures map to a FIN-* taxonomy, are compared against a baseline, and hit a PASS / WARN / FAIL / HUMAN_REVIEW_REQUIRED gate that writes hashed evidence files.",
    stack: ["Python", "FastAPI", "SQLite", "pytest", "Docker"],
    evidence: [
      "71 pytest tests with CI on every push",
      "Graders caught 31 of 31 planted errors with 0 false alarms on the synthetic benchmark",
      "A 5.2% critical error rate correctly triggers FAIL against a 5% threshold"
    ],
    note: "Public portfolio mirror under a proprietary license."
  },
  {
    repo: "financial-analysis-tool",
    title: "Underwriting Decision Workflow",
    pillar: "financial",
    featured: true,
    ci: "ci.yml",
    summary: "Public-company underwriting as a tested decision workflow: cash bridges, DCF, risk signals, and an auditable monitoring stance.",
    problem: "Spreadsheet underwriting mixes facts with assumptions and is hard to reproduce or review.",
    approach: "Accounting facts feed free-cash-flow and net-debt bridges, a DCF with WACC and terminal-growth sensitivity, and risk signals, ending in a deterministic HOLD / REVIEW / ENGAGE / REDUCE_EXPOSURE decision with a JSONL audit trail.",
    stack: ["Python", "FastAPI", "Streamlit", "Docker", "pytest"],
    evidence: [
      "Apple FY2025 investment-committee case: $143.49 base, $114.84 downside, $193.47 upside per share, locked by tests",
      "15 test files with CI and container release workflows",
      "Portfolio risk functions for Sharpe ratio, VaR, Expected Shortfall, and max drawdown"
    ]
  },
  {
    repo: "finops-cloud-cost-platform-public",
    title: "FinOps Decision & Control Platform",
    pillar: "financial",
    featured: false,
    summary: "Cloud cost governance from billing ingestion to a controlled financial close, built around segregation of duties and a hash-chained audit trail.",
    problem: "Cloud bills rarely turn into reliable chargeback, governed savings actions, and an auditable month-end close.",
    approach: "Billing data is normalized to a FOCUS-aligned subset, allocated, budgeted, and forecast. Savings recommendations pass an ALLOW / REQUIRE_APPROVAL / BLOCK policy gate, and accruals post to a Decimal-based ledger with close blockers and a SHA-256 hash-chained audit trail.",
    stack: ["Python", "FOCUS", "CLI", "HTML dashboard"],
    evidence: [
      "Demo run allocates about 1,448 source rows and verifies about 91.8% of estimated savings as realized",
      "Controls include segregation of duties, close blockers, and a rule that AI cannot post journals",
      "Explicit scope table: synthetic AWS/Azure data, no live cloud changes"
    ],
    note: "Docs-only public showcase; the source code is private."
  },
  {
    repo: "financial-data-automation",
    title: "Financial Data Automation",
    pillar: "financial",
    featured: false,
    summary: "A reproducible pipeline that validates, cleans, and reports financial datasets without silent data loss.",
    problem: "Manual Excel and CSV finance work accumulates missing values, schema drift, duplicates, and reporting that is hard to audit.",
    approach: "Ingest, validate, run data-quality checks, clean, analyze, report, and verify. Rejected rows are quarantined with a reject reason instead of being dropped, and every step is written to an append-only JSONL audit log.",
    stack: ["Python", "CSV / XLSX", "pytest"],
    evidence: [
      "Test suites for ingestion, validation, cleaning, analytics, and the full pipeline",
      "Quality score reported as clean rows divided by input rows",
      "Validation kept separate from cleaning so exceptions stay reviewable"
    ]
  },
  {
    repo: "ForexTraderWithBloombergAccess-public",
    title: "FX Quant Research Framework",
    pillar: "quant",
    featured: true,
    ci: "ci.yml",
    summary: "Reproducible FX research from point-in-time data to policy-gated paper deployment, built to reject leakage and overfitting.",
    problem: "Most backtests overstate edge through look-ahead leakage, ignored trading costs, and in-sample tuning.",
    approach: "Point-in-time data and schema checks feed a feature and signal registry, statistical validation, purged walk-forward cross-validation, and cost-aware backtests. Out-of-sample results then pass a PASS / FAIL policy gate before shadow deployment, drift monitoring, and a kill switch.",
    stack: ["Python", "YAML configs", "pytest", "GitHub Actions"],
    evidence: [
      "Tests for data contracts, leakage rejection, the research core, and institutional controls",
      "Baseline, pass-demo, and fail-demo configs show the gate rejecting weak strategies",
      "Backtests model spread, slippage, commission, execution delay, and liquidity caps"
    ],
    note: "Public MIT-licensed mirror; Bloomberg adapters stay private."
  }
];
