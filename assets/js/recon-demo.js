(function () {
  'use strict';

  var SAMPLE_SOURCE = 'assets/data/recon-source.csv';
  var SAMPLE_BANK = 'assets/data/recon-bank.csv';
  var DISPOSITIONS = [
    { value: '', label: 'Select disposition…' },
    { value: 'investigate', label: 'Investigate' },
    { value: 'timing_difference', label: 'Timing difference' },
    { value: 'matched_manual', label: 'Matched manually (off-key)' },
    { value: 'write_off', label: 'Write-off / immaterial' },
    { value: 'escalate', label: 'Escalate' }
  ];

  var state = {
    sourceText: '',
    bankText: '',
    sourceName: '',
    bankName: '',
    exceptions: [],
    log: [],
    startedAt: null
  };

  function $(sel) {
    return document.querySelector(sel);
  }

  function log(event, detail) {
    state.log.push({
      at: new Date().toISOString(),
      event: event,
      detail: detail || null
    });
    renderLog();
  }

  function parseCsv(text) {
    var lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
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

  function amountKey(row, amountCol) {
    var amt = Number(String(row[amountCol]).replace(/,/g, ''));
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
        invalid.push({ rowIndex: idx + 2, row: row, reason: 'Missing value_date or invalid amount' });
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

  function reconcile(sourceRows, bankRows) {
    var source = bucket(sourceRows, 'amount_usd');
    var bank = bucket(bankRows, 'amount_usd');
    var sourceKeys = Object.keys(source.map);
    var bankKeys = Object.keys(bank.map);
    var matched = sourceKeys.filter(function (k) {
      return bank.map[k];
    });
    var onlySource = sourceKeys.filter(function (k) {
      return !bank.map[k];
    });
    var onlyBank = bankKeys.filter(function (k) {
      return !source.map[k];
    });
    var allKeys = {};
    sourceKeys.concat(bankKeys).forEach(function (k) {
      allKeys[k] = true;
    });
    var denom = Math.max(Object.keys(allKeys).length, 1);
    var matchRate = Math.round((1000 * matched.length) / denom) / 10;

    var exceptions = [];
    onlySource.sort().forEach(function (k) {
      var parts = k.split('|');
      exceptions.push({
        id: 'src-' + k,
        side: 'source_only',
        value_date: parts[0],
        amount_usd: parts[1],
        disposition: '',
        note: ''
      });
    });
    onlyBank.sort().forEach(function (k) {
      var parts = k.split('|');
      exceptions.push({
        id: 'bnk-' + k,
        side: 'bank_only',
        value_date: parts[0],
        amount_usd: parts[1],
        disposition: '',
        note: ''
      });
    });
    source.invalid.forEach(function (inv, i) {
      exceptions.push({
        id: 'inv-src-' + i,
        side: 'invalid_source',
        value_date: inv.row.value_date || '',
        amount_usd: inv.row.amount_usd || '',
        disposition: '',
        note: inv.reason
      });
    });
    bank.invalid.forEach(function (inv, i) {
      exceptions.push({
        id: 'inv-bnk-' + i,
        side: 'invalid_bank',
        value_date: inv.row.value_date || '',
        amount_usd: inv.row.amount_usd || '',
        disposition: '',
        note: inv.reason
      });
    });

    return {
      source_rows: sourceRows.length,
      bank_rows: bankRows.length,
      matched_keys: matched.length,
      unmatched_source: onlySource.length,
      unmatched_bank: onlyBank.length,
      match_rate_pct: matchRate,
      quarantine_rows: exceptions.length,
      before_open: Object.keys(allKeys).length,
      exceptions: exceptions,
      invalid_count: source.invalid.length + bank.invalid.length
    };
  }

  function runReconcile() {
    var status = $('#recon-status');
    try {
      var sourceParsed = parseCsv(state.sourceText);
      var bankParsed = parseCsv(state.bankText);
      if (sourceParsed.headers.indexOf('amount_usd') === -1 || sourceParsed.headers.indexOf('value_date') === -1) {
        throw new Error('Book CSV needs value_date and amount_usd columns.');
      }
      if (bankParsed.headers.indexOf('amount_usd') === -1 || bankParsed.headers.indexOf('value_date') === -1) {
        throw new Error('Bank CSV needs value_date and amount_usd columns.');
      }
      var result = reconcile(sourceParsed.rows, bankParsed.rows);
      state.exceptions = result.exceptions;
      state.metrics = result;
      log('reconcile', {
        matched_keys: result.matched_keys,
        quarantine_rows: result.quarantine_rows,
        match_rate_pct: result.match_rate_pct
      });
      renderMetrics(result);
      renderExceptions();
      $('#recon-workspace').hidden = false;
      $('#export-btn').disabled = !allDisposed();
      if (status) {
        status.textContent =
          'Gate complete. ' +
          result.quarantine_rows +
          ' exception(s) require disposition before export.';
        status.classList.remove('error');
      }
    } catch (err) {
      if (status) {
        status.textContent = err.message || String(err);
        status.classList.add('error');
      }
      log('error', { message: String(err.message || err) });
    }
  }

  function allDisposed() {
    return (
      state.exceptions.length > 0 &&
      state.exceptions.every(function (ex) {
        return Boolean(ex.disposition);
      })
    ) || state.exceptions.length === 0;
  }

  function renderMetrics(m) {
    $('#metric-match').textContent = '0% → ' + m.match_rate_pct + '%';
    $('#metric-open').textContent = m.before_open + ' → ' + m.quarantine_rows;
    $('#metric-rows').textContent = m.source_rows + ' book · ' + m.bank_rows + ' bank';
    $('#metric-invalid').textContent = String(m.invalid_count);
  }

  function renderExceptions() {
    var tbody = $('#exception-body');
    tbody.innerHTML = '';
    state.exceptions.forEach(function (ex) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<th scope="row">' +
        escapeHtml(ex.side) +
        '</th><td>' +
        escapeHtml(ex.value_date) +
        '</td><td>' +
        escapeHtml(String(ex.amount_usd)) +
        '</td><td class="disp-cell"></td><td class="note-cell"></td>';
      var select = document.createElement('select');
      select.setAttribute('aria-label', 'Disposition for ' + ex.side + ' ' + ex.value_date);
      select.dataset.id = ex.id;
      DISPOSITIONS.forEach(function (opt) {
        var o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        if (opt.value === ex.disposition) o.selected = true;
        select.appendChild(o);
      });
      select.addEventListener('change', function () {
        ex.disposition = select.value;
        log('disposition_set', { id: ex.id, disposition: ex.disposition });
        $('#export-btn').disabled = !allDisposed();
        updateExportHint();
      });
      tr.querySelector('.disp-cell').appendChild(select);

      var note = document.createElement('input');
      note.type = 'text';
      note.value = ex.note || '';
      note.placeholder = 'Optional note';
      note.addEventListener('change', function () {
        ex.note = note.value.trim();
        log('note_set', { id: ex.id });
      });
      tr.querySelector('.note-cell').appendChild(note);
      tbody.appendChild(tr);
    });
    updateExportHint();
  }

  function updateExportHint() {
    var hint = $('#export-hint');
    if (!hint) return;
    if (!state.exceptions.length) {
      hint.textContent = 'No exceptions — you can export a clean pack.';
      return;
    }
    var open = state.exceptions.filter(function (e) {
      return !e.disposition;
    }).length;
    hint.textContent =
      open === 0
        ? 'All exceptions disposed. Export is unlocked.'
        : open + ' exception(s) still need a disposition.';
  }

  function renderLog() {
    var el = $('#process-log');
    if (!el) return;
    el.textContent = state.log
      .map(function (row) {
        return row.at + '  ' + row.event + (row.detail ? '  ' + JSON.stringify(row.detail) : '');
      })
      .join('\n');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map(function (b) {
        return b.toString(16).padStart(2, '0');
      })
      .join('');
  }

  function sha256(text) {
    var enc = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-256', enc).then(hex);
  }

  function buildPack() {
    var exportedAt = new Date().toISOString();
    return {
      product: 'Checktrail',
      module: 'csv_reconciliation',
      label: 'Educational / synthetic demo — not an assurance service',
      method: 'Exact match on (value_date, amount_usd); remainder quarantined',
      inputs: {
        source_file: state.sourceName || 'book.csv',
        bank_file: state.bankName || 'bank.csv'
      },
      metrics: state.metrics,
      exceptions: state.exceptions.map(function (ex) {
        return {
          side: ex.side,
          value_date: ex.value_date,
          amount_usd: ex.amount_usd,
          disposition: ex.disposition,
          note: ex.note || ''
        };
      }),
      process_log: state.log.slice(),
      exported_at: exportedAt,
      demo_started_at: state.startedAt
    };
  }

  function download(filename, text, type) {
    var blob = new Blob([text], { type: type || 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportPack() {
    if (!allDisposed()) {
      $('#recon-status').textContent = 'Set a disposition on every exception before export.';
      $('#recon-status').classList.add('error');
      return;
    }
    var pack = buildPack();
    var bodyForHash = JSON.stringify(pack, null, 2);
    sha256(bodyForHash).then(function (hash) {
      pack.sha256 = hash;
      pack.sha256_of = 'JSON body excluding sha256 and sha256_of fields';
      log('export', { sha256: hash, exception_count: pack.exceptions.length });
      var finalText = JSON.stringify(pack, null, 2) + '\n';
      download('checktrail-recon-evidence.json', finalText, 'application/json');
      var stamp = new Date().toISOString().replace(/[:.]/g, '-');
      var logText =
        state.log
          .map(function (row) {
            return row.at + '\t' + row.event + '\t' + JSON.stringify(row.detail);
          })
          .join('\n') +
        '\nsha256=' +
        hash +
        '\n';
      download('checktrail-recon-log-' + stamp + '.txt', logText, 'text/plain');
      $('#recon-status').textContent =
        'Evidence pack exported (JSON + log). SHA-256: ' + hash.slice(0, 16) + '…';
      $('#recon-status').classList.remove('error');
      $('#pack-hash').textContent = hash;
    });
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ''));
      };
      reader.onerror = function () {
        reject(new Error('Could not read file.'));
      };
      reader.readAsText(file);
    });
  }

  function loadSample() {
    state.startedAt = new Date().toISOString();
    state.log = [];
    Promise.all([fetch(SAMPLE_SOURCE).then(function (r) {
      if (!r.ok) throw new Error('Missing sample book CSV');
      return r.text();
    }), fetch(SAMPLE_BANK).then(function (r) {
      if (!r.ok) throw new Error('Missing sample bank CSV');
      return r.text();
    })]).then(function (pair) {
      state.sourceText = pair[0];
      state.bankText = pair[1];
      state.sourceName = 'recon-source.csv';
      state.bankName = 'recon-bank.csv';
      $('#source-label').textContent = state.sourceName + ' (bundled sample)';
      $('#bank-label').textContent = state.bankName + ' (bundled sample)';
      log('load_sample', { source: SAMPLE_SOURCE, bank: SAMPLE_BANK });
      runReconcile();
    }).catch(function (err) {
      $('#recon-status').textContent = String(err.message || err);
      $('#recon-status').classList.add('error');
    });
  }

  function wire() {
    $('#load-sample').addEventListener('click', loadSample);
    $('#run-gate').addEventListener('click', function () {
      if (!state.sourceText || !state.bankText) {
        $('#recon-status').textContent = 'Load the sample or upload both CSVs first.';
        $('#recon-status').classList.add('error');
        return;
      }
      runReconcile();
    });
    $('#export-btn').addEventListener('click', exportPack);
    $('#source-file').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      readFile(file).then(function (text) {
        state.sourceText = text;
        state.sourceName = file.name;
        $('#source-label').textContent = file.name;
        log('upload_source', { name: file.name });
      });
    });
    $('#bank-file').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      readFile(file).then(function (text) {
        state.bankText = text;
        state.bankName = file.name;
        $('#bank-label').textContent = file.name;
        log('upload_bank', { name: file.name });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
