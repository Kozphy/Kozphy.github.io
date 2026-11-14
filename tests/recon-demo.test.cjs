const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const core = require('../assets/js/recon-core.js');

const root = path.join(__dirname, '..');
const sampleSource = fs.readFileSync(path.join(root, 'assets/data/recon-source.csv'), 'utf8');
const sampleBank = fs.readFileSync(path.join(root, 'assets/data/recon-bank.csv'), 'utf8');
const pinned = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/recon-result.json'), 'utf8'));

function csv(header, rows) {
  return [header].concat(rows).join('\n') + '\n';
}

test('sample CSVs match pinned educational metrics (unique keys)', () => {
  const result = core.reconcileCsvTexts(sampleSource, sampleBank);
  assert.equal(result.source_rows, pinned.after.source_rows);
  assert.equal(result.bank_rows, pinned.after.bank_rows);
  assert.equal(result.matched_keys, pinned.after.matched_keys);
  assert.equal(result.unmatched_source, pinned.after.unmatched_source);
  assert.equal(result.unmatched_bank, pinned.after.unmatched_bank);
  assert.equal(result.match_rate_pct, pinned.after.match_rate_pct);
  assert.equal(result.quarantine_rows, pinned.after.quarantine_rows);
});

test('duplicate cardinality quarantines surplus rows', () => {
  const source = csv('value_date,amount_usd', [
    '2025-09-01,100.00',
    '2025-09-01,100.00'
  ]);
  const bank = csv('value_date,amount_usd', ['2025-09-01,100.00']);
  const result = core.reconcileCsvTexts(source, bank);
  assert.equal(result.matched_keys, 0);
  assert.equal(result.matched_units, 1);
  assert.equal(result.quarantine_rows, 1);
  assert.equal(result.exceptions[0].side, 'cardinality_source');
  assert.equal(result.exceptions[0].surplus_count, 1);
});

test('exact unique matches produce a clean pack', () => {
  const source = csv('value_date,amount_usd', ['2025-09-01,50.00', '2025-09-02,75.50']);
  const bank = csv('value_date,amount_usd', ['2025-09-01,50.00', '2025-09-02,75.50']);
  const result = core.reconcileCsvTexts(source, bank);
  assert.equal(result.matched_keys, 2);
  assert.equal(result.quarantine_rows, 0);
  assert.equal(result.match_rate_pct, 100);
  const status = core.signoffStatus(result.exceptions);
  assert.equal(status.signoff_ready, true);
});

test('amount mismatch quarantines both sides', () => {
  const source = csv('value_date,amount_usd', ['2025-09-01,100.00']);
  const bank = csv('value_date,amount_usd', ['2025-09-01,99.99']);
  const result = core.reconcileCsvTexts(source, bank);
  assert.equal(result.matched_keys, 0);
  assert.equal(result.quarantine_rows, 2);
  const sides = result.exceptions.map((e) => e.side).sort();
  assert.deepEqual(sides, ['bank_only', 'source_only']);
});

test('missing date or invalid amount become invalid_* exceptions', () => {
  const source = csv('value_date,amount_usd', [',100.00', '2025-09-01,not-a-number']);
  const bank = csv('value_date,amount_usd', ['2025-09-01,100.00']);
  const result = core.reconcileCsvTexts(source, bank);
  assert.equal(result.invalid_count, 2);
  assert.ok(result.exceptions.some((e) => e.side === 'invalid_source'));
});

test('empty or header-only CSV throws', () => {
  assert.throws(() => core.parseCsv(''), /empty|header/i);
  assert.throws(() => core.parseCsv('value_date,amount_usd\n'), /header and at least one row/i);
  assert.throws(
    () => core.reconcileCsvTexts('txn_id,x\n1,2\n', sampleBank),
    /value_date and amount_usd/
  );
});

test('investigate and escalate block sign-off readiness', () => {
  const result = core.reconcileCsvTexts(sampleSource, sampleBank);
  result.exceptions.forEach((ex) => {
    ex.disposition = 'investigate';
  });
  let status = core.signoffStatus(result.exceptions);
  assert.equal(status.signoff_ready, false);
  assert.equal(status.blocking_exceptions, result.exceptions.length);

  result.exceptions.forEach((ex) => {
    ex.disposition = 'escalate';
  });
  status = core.signoffStatus(result.exceptions);
  assert.equal(status.signoff_ready, false);

  result.exceptions.forEach((ex) => {
    ex.disposition = 'timing_difference';
  });
  status = core.signoffStatus(result.exceptions);
  assert.equal(status.signoff_ready, true);
  assert.equal(status.blocking_exceptions, 0);
});

test('resolving dispositions unlock sign-off pack metadata', () => {
  const result = core.reconcileCsvTexts(sampleSource, sampleBank);
  result.exceptions.forEach((ex, i) => {
    ex.disposition = i % 2 === 0 ? 'matched_manual' : 'write_off';
  });
  const pack = core.buildPackSkeleton({
    exceptions: result.exceptions,
    metrics: result,
    processLog: [{ at: 't', event: 'reconcile', detail: null }],
    sourceName: 'recon-source.csv',
    bankName: 'recon-bank.csv',
    startedAt: '2025-01-01T00:00:00.000Z',
    exportedAt: '2025-01-01T00:00:01.000Z'
  });
  assert.equal(pack.signoff_ready, true);
  assert.equal(pack.blocking_exceptions, 0);
  assert.equal(pack.label.includes('not an assurance'), true);
  assert.ok(pack.exceptions.every((ex) => ex.blocks_signoff === false));
});

test('SHA-256 of pack body excludes sha256 fields', () => {
  const result = core.reconcileCsvTexts(
    csv('value_date,amount_usd', ['2025-09-01,10.00']),
    csv('value_date,amount_usd', ['2025-09-01,10.00'])
  );
  const pack = core.buildPackSkeleton({
    exceptions: result.exceptions,
    metrics: result,
    processLog: [],
    exportedAt: '2025-01-01T00:00:00.000Z',
    startedAt: '2025-01-01T00:00:00.000Z'
  });
  const body = JSON.stringify(pack, null, 2);
  const hash = crypto.createHash('sha256').update(body, 'utf8').digest('hex');
  pack.sha256 = hash;
  pack.sha256_of = 'JSON body excluding sha256 and sha256_of fields';
  const stripped = { ...pack };
  delete stripped.sha256;
  delete stripped.sha256_of;
  const recomputed = crypto
    .createHash('sha256')
    .update(JSON.stringify(stripped, null, 2), 'utf8')
    .digest('hex');
  assert.equal(recomputed, hash);
});

test('comma thousands and amount formatting still key', () => {
  const source = csv('value_date,amount_usd', ['2025-09-01,"1,250.00"']);
  const bank = csv('value_date,amount_usd', ['2025-09-01,1250.00']);
  const result = core.reconcileCsvTexts(source, bank);
  assert.equal(result.matched_keys, 1);
  assert.equal(result.quarantine_rows, 0);
});
