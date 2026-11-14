(function () {
  'use strict';

  var core = window.ChecktrailRecon;
  if (!core) {
    console.error('[checktrail] recon-core.js must load before recon-demo.js');
    return;
  }

  var SAMPLE_SOURCE = 'assets/data/recon-source.csv';
  var SAMPLE_BANK = 'assets/data/recon-bank.csv';

  var state = {
    sourceText: '',
    bankText: '',
    sourceName: '',
    bankName: '',
    exceptions: [],
    metrics: null,
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

  function runReconcile() {
    var status = $('#recon-status');
    try {
      var result = core.reconcileCsvTexts(state.sourceText, state.bankText);
      state.exceptions = result.exceptions;
      state.metrics = result;
      log('reconcile', {
        matched_keys: result.matched_keys,
        matched_units: result.matched_units,
        quarantine_rows: result.quarantine_rows,
        match_rate_pct: result.match_rate_pct
      });
      renderMetrics(result);
      renderExceptions();
      $('#recon-workspace').hidden = false;
      syncExportButton();
      if (status) {
        status.textContent =
          'Gate complete. ' +
          result.quarantine_rows +
          ' exception(s). Sign-off export needs a resolving disposition on each (not Investigate / Escalate).';
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

  function syncExportButton() {
    var status = core.signoffStatus(state.exceptions);
    var btn = $('#export-btn');
    if (btn) btn.disabled = !status.signoff_ready;
    updateExportHint(status);
  }

  function renderMetrics(m) {
    $('#metric-match').textContent = '0% → ' + m.match_rate_pct + '%';
    $('#metric-open').textContent = m.before_open + ' → ' + m.quarantine_rows;
    $('#metric-rows').textContent = m.source_rows + ' book · ' + m.bank_rows + ' bank';
    $('#metric-invalid').textContent = String(m.invalid_count);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderExceptions() {
    var tbody = $('#exception-body');
    tbody.innerHTML = '';
    state.exceptions.forEach(function (ex) {
      var tr = document.createElement('tr');
      var surplus =
        ex.surplus_count && ex.surplus_count > 1 ? ' ×' + ex.surplus_count : '';
      tr.innerHTML =
        '<th scope="row">' +
        escapeHtml(ex.side) +
        surplus +
        '</th><td>' +
        escapeHtml(ex.value_date) +
        '</td><td>' +
        escapeHtml(String(ex.amount_usd)) +
        '</td><td class="disp-cell"></td><td class="note-cell"></td>';
      var select = document.createElement('select');
      select.setAttribute('aria-label', 'Disposition for ' + ex.side + ' ' + ex.value_date);
      select.dataset.id = ex.id;
      core.DISPOSITIONS.forEach(function (opt) {
        var o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label + (opt.kind === 'blocking' && opt.value ? ' (blocks sign-off)' : '');
        if (opt.value === ex.disposition) o.selected = true;
        select.appendChild(o);
      });
      select.addEventListener('change', function () {
        ex.disposition = select.value;
        ex.blocks_signoff = core.isBlockingDisposition(ex.disposition);
        log('disposition_set', {
          id: ex.id,
          disposition: ex.disposition,
          kind: core.dispositionKind(ex.disposition)
        });
        syncExportButton();
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
    syncExportButton();
  }

  function updateExportHint(status) {
    var hint = $('#export-hint');
    if (!hint) return;
    status = status || core.signoffStatus(state.exceptions);
    if (!state.exceptions.length) {
      hint.textContent = 'No exceptions — sign-off-ready pack can be exported.';
      return;
    }
    if (status.signoff_ready) {
      hint.textContent =
        'All exceptions have resolving dispositions. Sign-off-ready export is unlocked.';
      return;
    }
    hint.textContent =
      status.blocking_exceptions +
      ' exception(s) still block sign-off (empty, Investigate, or Escalate).';
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
    var status = core.signoffStatus(state.exceptions);
    if (!status.signoff_ready) {
      $('#recon-status').textContent =
        'Sign-off export blocked: set a resolving disposition on every exception (not Investigate / Escalate).';
      $('#recon-status').classList.add('error');
      return;
    }
    var pack = core.buildPackSkeleton({
      exceptions: state.exceptions,
      metrics: state.metrics,
      processLog: state.log,
      sourceName: state.sourceName,
      bankName: state.bankName,
      startedAt: state.startedAt,
      exportedAt: new Date().toISOString()
    });
    var bodyForHash = JSON.stringify(pack, null, 2);
    sha256(bodyForHash).then(function (hash) {
      pack.sha256 = hash;
      pack.sha256_of = 'JSON body excluding sha256 and sha256_of fields';
      log('export', {
        sha256: hash,
        exception_count: pack.exceptions.length,
        signoff_ready: pack.signoff_ready
      });
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
        '\nsignoff_ready=' +
        pack.signoff_ready +
        '\n';
      download('checktrail-recon-log-' + stamp + '.txt', logText, 'text/plain');
      $('#recon-status').textContent =
        'Sign-off-ready pack exported. SHA-256 is of pack JSON (not CSV bytes): ' +
        hash.slice(0, 16) +
        '…';
      $('#recon-status').classList.remove('error');
      $('#pack-hash').textContent = hash;
      unlockPilotCta(hash);
    });
  }

  function unlockPilotCta(hash) {
    var gate = $('#pilot-gate');
    if (gate) {
      gate.hidden = false;
      try {
        gate.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) {
        /* ignore */
      }
    }
    try {
      sessionStorage.setItem('checktrail-demo-exported', '1');
      sessionStorage.setItem('checktrail-demo-sha', hash || '');
    } catch (e) {
      /* ignore */
    }
    if (typeof window.ctTrack === 'function') {
      window.ctTrack('demo_export', { sha256_prefix: (hash || '').slice(0, 16) });
    }
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
    Promise.all([
      fetch(SAMPLE_SOURCE).then(function (r) {
        if (!r.ok) throw new Error('Missing sample book CSV');
        return r.text();
      }),
      fetch(SAMPLE_BANK).then(function (r) {
        if (!r.ok) throw new Error('Missing sample bank CSV');
        return r.text();
      })
    ])
      .then(function (pair) {
        state.sourceText = pair[0];
        state.bankText = pair[1];
        state.sourceName = 'recon-source.csv';
        state.bankName = 'recon-bank.csv';
        $('#source-label').textContent = state.sourceName + ' (bundled sample)';
        $('#bank-label').textContent = state.bankName + ' (bundled sample)';
        log('load_sample', { source: SAMPLE_SOURCE, bank: SAMPLE_BANK });
        runReconcile();
      })
      .catch(function (err) {
        $('#recon-status').textContent = String(err.message || err);
        $('#recon-status').classList.add('error');
      });
  }

  function wire() {
    if (typeof window.ctTrack === 'function') window.ctTrack('demo_view', {});
    try {
      if (sessionStorage.getItem('checktrail-demo-exported') === '1') {
        unlockPilotCta(sessionStorage.getItem('checktrail-demo-sha') || '');
      }
    } catch (e) {
      /* ignore */
    }
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
