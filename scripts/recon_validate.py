"""Educational CSV reconciliation: book vs bank with before/after metrics.

Not client work. Synthetic data only. Demonstrates quarantine + exception log.
"""

from __future__ import annotations

import csv
import json
from collections import defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "data" / "recon-source.csv"
BANK = ROOT / "assets" / "data" / "recon-bank.csv"
OUT_DIR = ROOT / "assets" / "data"
OUT_JSON = OUT_DIR / "recon-result.json"
OUT_EXCEPTIONS = OUT_DIR / "recon-exceptions.csv"


@dataclass
class Metrics:
    source_rows: int
    bank_rows: int
    matched_keys: int
    unmatched_source: int
    unmatched_bank: int
    amount_delta_usd: float
    match_rate_pct: float
    quarantine_rows: int


def load_amounts(path: Path, amount_col: str) -> dict[tuple[str, str], float]:
    """Key = (value_date, amount rounded to 2dp as string) for simple tie-out demo."""
    buckets: dict[tuple[str, str], float] = defaultdict(float)
    with path.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            key = (row["value_date"], f"{float(row[amount_col]):.2f}")
            buckets[key] += float(row[amount_col])
    return dict(buckets)


def main() -> None:
    source = load_amounts(SOURCE, "amount_usd")
    bank = load_amounts(BANK, "amount_usd")

    source_keys = set(source)
    bank_keys = set(bank)
    matched = source_keys & bank_keys
    only_source = sorted(source_keys - bank_keys)
    only_bank = sorted(bank_keys - source_keys)

    before_open = len(source_keys | bank_keys)
    before_match_rate = 0.0

    after_open = len(only_source) + len(only_bank)
    denom = max(len(source_keys | bank_keys), 1)
    after_match_rate = round(100.0 * len(matched) / denom, 1)

    amount_delta = round(
        sum(source[k] for k in only_source) - sum(bank[k] for k in only_bank),
        2,
    )

    exceptions: list[dict[str, str]] = []
    for date, amt in only_source:
        exceptions.append(
            {
                "side": "source_only",
                "value_date": date,
                "amount_usd": amt,
                "disposition": "quarantine",
                "note": "Book entry with no bank key match",
            }
        )
    for date, amt in only_bank:
        exceptions.append(
            {
                "side": "bank_only",
                "value_date": date,
                "amount_usd": amt,
                "disposition": "quarantine",
                "note": "Bank entry with no book key match",
            }
        )

    with SOURCE.open(encoding="utf-8") as f:
        source_rows = sum(1 for _ in f) - 1
    with BANK.open(encoding="utf-8") as f:
        bank_rows = sum(1 for _ in f) - 1

    metrics_before = Metrics(
        source_rows=source_rows,
        bank_rows=bank_rows,
        matched_keys=0,
        unmatched_source=len(source_keys),
        unmatched_bank=len(bank_keys),
        amount_delta_usd=round(sum(source.values()) - sum(bank.values()), 2),
        match_rate_pct=before_match_rate,
        quarantine_rows=before_open,
    )
    metrics_after = Metrics(
        source_rows=metrics_before.source_rows,
        bank_rows=metrics_before.bank_rows,
        matched_keys=len(matched),
        unmatched_source=len(only_source),
        unmatched_bank=len(only_bank),
        amount_delta_usd=amount_delta,
        match_rate_pct=after_match_rate,
        quarantine_rows=after_open,
    )

    result = {
        "label": "Educational CSV reconciliation — not client work",
        "method": "Exact match on (value_date, amount_usd); remainder quarantined",
        "before": asdict(metrics_before),
        "after": asdict(metrics_after),
        "improvement": {
            "open_items_reduced": before_open - after_open,
            "match_rate_pct_points": after_match_rate - before_match_rate,
            "quarantine_vs_silent_fail": "Unmatched rows written to exception log instead of dropped",
        },
    }

    OUT_JSON.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    with OUT_EXCEPTIONS.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["side", "value_date", "amount_usd", "disposition", "note"]
        )
        writer.writeheader()
        writer.writerows(exceptions)

    print(json.dumps(result, indent=2))
    print(f"Wrote {OUT_JSON}")
    print(f"Wrote {OUT_EXCEPTIONS} ({len(exceptions)} exceptions)")


if __name__ == "__main__":
    main()
