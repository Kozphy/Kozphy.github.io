/* Shared CSV recon logic for browser demo + Node regression tests. Educational / synthetic. */
(function (root) {
  'use strict';

  var DISPOSITIONS = Object.freeze([
    { value: '', label: 'Select disposition…', kind: 'empty' },
    { value: 'investigate', label: 'Investigate', kind: 'blocking' },
    { value: 'timing_difference', label: 'Timing difference', kind: 'resolving' },
    { value: 'matched_manual', label: 'Matched manually (off-key)', kind: 'resolving' },
    { value: 'write_off', label: 'Write-off / immaterial', kind: 'resolving' },
    { value: 'escalate', label: 'Escalate', kind: 'blocking' }
  ]);

  var RESOLVING = Object.freeze({
    timing_difference: true,
    matched_manual: true,
    write_off: true
  });

  var BLOCKING = Object.freeze({
    investigate: true,
    escalate: true
  });

  function splitCsvLine(line) {
    var out = [];
    var cur = '';
    var inQ = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === ',' && !inQ) {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  }

  function parseCsv(text) {
    if (text == null || !String(text).trim()) {
      throw new Error('CSV is empty.');
    }
    var lines = String(text).replace(/^\uFEFF/, '').trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error('CSV needs a header and at least one row.');
    var headers = splitCsvLine(lines[0]).map(function (h) {
      return h.trim();
    });
    var rows = [];
    for (var i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      var cols = splitCsvLine(lines[i]);
      var row = {};
      headers.forEach(function (h, idx) {
        row[h] = (cols[idx] || '').trim();
      });
      rows.push(row);
    }
    return { headers: headers, rows: rows };
  }

  function amountKey(row, amountCol) {
    var raw = row[amountCol];
    if (raw == null || String(raw).trim() === '') return null;
    var amt = Number(String(raw).replace(/,/g, ''));
    if (!Number.isFinite(amt)) return null;
    var date = row.value_date || row.Value_Date || '';
    if (!date) return null;
    return date + '|' + amt.toFixed(2);
  }

  function bucket(rows, amountCol) {
    var map = Object.create(null);
    var invalid = [];
    rows.forEach(function (row, idx) {
      var key = amountKey(row, amountCol);
      if (!key) {
        invalid.push({
          rowIndex: idx + 2,
          row: row,
          reason: 'Missing value_date or invalid amount'
        });
        return;
      }
      if (!map[key]) map[key] = { count: 0, amount: 0, rows: [] };
      var amt = Number(String(row[amountCol]).replace(/,/g, ''));
      map[key].count += 1;
      map[key].amount += amt;
      map[key].rows.push(row);
    });
    return { map: map, invalid: invalid };
  }

  function pushException(exceptions, item) {
    exceptions.push({
      id: item.id,
      side: item.side,
      value_date: item.value_date,
      amount_usd: item.amount_usd,
      surplus_count: item.surplus_count || 1,
      disposition: '',
      note: item.note || '',
      blocks_signoff: true
    });
  }

  function reconcile(sourceRows, bankRows) {
    var source = bucket(sourceRows, 'amount_usd');
    var bank = bucket(bankRows, 'amount_usd');
    var sourceKeys = Object.keys(source.map);
    var bankKeys = Object.keys(bank.map);
    var allKeySet = Object.create(null);
    sourceKeys.concat(bankKeys).forEach(function (k) {
      allKeySet[k] = true;
    });
    var allKeys = Object.keys(allKeySet).sort();

    var matchedKeys = [];
    var matchedUnits = 0;
    var exceptions = [];

    allKeys.forEach(function (k) {
      var sc = source.map[k] ? source.map[k].count : 0;
      var bc = bank.map[k] ? bank.map[k].count : 0;
      var parts = k.split('|');
      var valueDate = parts[0];
      var amount = parts[1];
      var paired = Math.min(sc, bc);
      matchedUnits += paired;

      if (sc > 0 && bc > 0 && sc === bc) {
        matchedKeys.push(k);
        return;
      }

      if (sc > bc) {
        pushException(exceptions, {
          id: 'src-' + k,
          side: bc > 0 ? 'cardinality_source' : 'source_only',
          value_date: valueDate,
          amount_usd: amount,
          surplus_count: sc - bc,
          note: bc > 0 ? 'Surplus book rows for this key (' + (sc - bc) + ')' : ''
        });
      }
      if (bc > sc) {
        pushException(exceptions, {
          id: 'bnk-' + k,
          side: sc > 0 ? 'cardinality_bank' : 'bank_only',
          value_date: valueDate,
          amount_usd: amount,
          surplus_count: bc - sc,
          note: sc > 0 ? 'Surplus bank rows for this key (' + (bc - sc) + ')' : ''
        });
      }
    });

    source.invalid.forEach(function (inv, i) {
      pushException(exceptions, {
        id: 'inv-src-' + i,
        side: 'invalid_source',
        value_date: inv.row.value_date || '',
        amount_usd: inv.row.amount_usd || '',
        note: inv.reason
      });
    });
    bank.invalid.forEach(function (inv, i) {
      pushException(exceptions, {
        id: 'inv-bnk-' + i,
        side: 'invalid_bank',
        value_date: inv.row.value_date || '',
        amount_usd: inv.row.amount_usd || '',
        note: inv.reason
      });
    });

    var denom = Math.max(allKeys.length, 1);
    var matchRate = Math.round((1000 * matchedKeys.length) / denom) / 10;

    return {
      source_rows: sourceRows.length,
      bank_rows: bankRows.length,
      matched_keys: matchedKeys.length,
      matched_units: matchedUnits,
      unmatched_source: exceptions.filter(function (e) {
        return e.side === 'source_only' || e.side === 'cardinality_source';
      }).length,
      unmatched_bank: exceptions.filter(function (e) {
        return e.side === 'bank_only' || e.side === 'cardinality_bank';
      }).length,
      match_rate_pct: matchRate,
      quarantine_rows: exceptions.length,
      before_open: allKeys.length,
      exceptions: exceptions,
      invalid_count: source.invalid.length + bank.invalid.length
    };
  }

  function dispositionKind(value) {
    if (!value) return 'empty';
    if (RESOLVING[value]) return 'resolving';
    if (BLOCKING[value]) return 'blocking';
    return 'blocking';
  }

  function isResolvingDisposition(value) {
    return dispositionKind(value) === 'resolving';
  }

  function isBlockingDisposition(value) {
    return dispositionKind(value) !== 'resolving';
  }

  function signoffStatus(exceptions) {
    var list = exceptions || [];
    var blocking = list.filter(function (ex) {
      return isBlockingDisposition(ex.disposition);
    });
    return {
      signoff_ready: blocking.length === 0,
      blocking_exceptions: blocking.length,
      open_dispositions: list.filter(function (ex) {
        return !ex.disposition;
      }).length
    };
  }

  function requireColumns(parsed, label) {
    if (parsed.headers.indexOf('amount_usd') === -1 || parsed.headers.indexOf('value_date') === -1) {
      throw new Error(label + ' CSV needs value_date and amount_usd columns.');
    }
  }

  function reconcileCsvTexts(sourceText, bankText) {
    var sourceParsed = parseCsv(sourceText);
    var bankParsed = parseCsv(bankText);
    requireColumns(sourceParsed, 'Book');
    requireColumns(bankParsed, 'Bank');
    return reconcile(sourceParsed.rows, bankParsed.rows);
  }

  function buildPackSkeleton(opts) {
    var exceptions = (opts.exceptions || []).map(function (ex) {
      return {
        side: ex.side,
        value_date: ex.value_date,
        amount_usd: ex.amount_usd,
        surplus_count: ex.surplus_count || 1,
        disposition: ex.disposition || '',
        note: ex.note || '',
        blocks_signoff: isBlockingDisposition(ex.disposition)
      };
    });
    var status = signoffStatus(opts.exceptions || []);
    return {
      product: 'Checktrail',
      module: 'csv_reconciliation',
      label: 'Educational / synthetic demo — not an assurance service',
      method:
        'Exact match on (value_date, amount_usd) with cardinality checks; unequal counts quarantine surplus; remainder quarantined',
      inputs: {
        source_file: opts.sourceName || 'book.csv',
        bank_file: opts.bankName || 'bank.csv'
      },
      metrics: opts.metrics || null,
      exceptions: exceptions,
      signoff_ready: status.signoff_ready,
      blocking_exceptions: status.blocking_exceptions,
      process_log: (opts.processLog || []).slice(),
      exported_at: opts.exportedAt || new Date().toISOString(),
      demo_started_at: opts.startedAt || null,
      sha256_note:
        'sha256 covers this JSON body before sha256 / sha256_of fields are attached; it does not hash CSV file bytes'
    };
  }

  var api = Object.freeze({
    DISPOSITIONS: DISPOSITIONS,
    parseCsv: parseCsv,
    splitCsvLine: splitCsvLine,
    amountKey: amountKey,
    bucket: bucket,
    reconcile: reconcile,
    reconcileCsvTexts: reconcileCsvTexts,
    dispositionKind: dispositionKind,
    isResolvingDisposition: isResolvingDisposition,
    isBlockingDisposition: isBlockingDisposition,
    signoffStatus: signoffStatus,
    buildPackSkeleton: buildPackSkeleton
  });

  root.ChecktrailRecon = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
