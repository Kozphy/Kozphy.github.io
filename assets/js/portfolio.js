(function () {
  'use strict';
  const model = window.FinanceCase;
  const form = document.getElementById('scenario-form');
  if (!form || !model) return;
  const byId = id => document.getElementById(id);
  const usd = value => '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = value => (value * 100).toFixed(1) + '%';
  const fields = { wacc: byId('wacc'), terminal: byId('terminal'), shift: byId('shift') };
  const read = () => ({ discountRate: Number(fields.wacc.value) / 100,
    terminalGrowth: Number(fields.terminal.value) / 100, growthShift: Number(fields.shift.value) / 100 });
  const ns = 'http://www.w3.org/2000/svg';
  function svgElement(tag, attrs, text) {
    const element = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function drawChart(result) {
    const amounts = [result.freeCashFlow, ...result.projections].map(value => value / 1000);
    const max = Math.max(...amounts) * 1.25;
    const group = byId('chart-bars');
    group.replaceChildren();
    amounts.forEach((amount, i) => {
      const x = 20 + i * 96;
      const height = amount / max * 170;
      group.append(svgElement('rect', { x, y: 185 - height, width: 54, height, rx: 2, class: 'bar' }));
      group.append(svgElement('text', { x: x + 27, y: 175 - height, 'text-anchor': 'middle' }, amount.toFixed(1)));
      group.append(svgElement('text', { x: x + 27, y: 210, 'text-anchor': 'middle' }, i === 0 ? 'FY2025' : 'Year ' + i));
    });
    byId('chart-description').textContent = 'Projected cash-flow proxy in USD billions: ' +
      amounts.map((amount, i) => (i === 0 ? 'FY2025' : 'Year ' + i) + ': ' + amount.toFixed(2)).join('; ') + '.';
  }
  function drawSensitivity(settings) {
    const rates = [settings.discountRate - 0.01, settings.discountRate, settings.discountRate + 0.01];
    const growths = [settings.terminalGrowth - 0.005, settings.terminalGrowth, settings.terminalGrowth + 0.005];
    const head = document.createElement('tr');
    const label = document.createElement('th');
    label.scope = 'col'; label.textContent = 'Discount rate / terminal growth'; head.append(label);
    growths.forEach(growth => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = pct(growth); head.append(th); });
    byId('sensitivity-head').replaceChildren(head);
    const rows = rates.map((rate, row) => {
      const tr = document.createElement('tr');
      const th = document.createElement('th'); th.scope = 'row'; th.textContent = pct(rate); tr.append(th);
      growths.forEach((growth, col) => {
        const td = document.createElement('td');
        td.textContent = usd(model.calculate({ ...settings, discountRate: rate, terminalGrowth: growth }).valuePerShare);
        if (row === 1 && col === 1) td.className = 'current';
        tr.append(td);
      });
      return tr;
    });
    byId('sensitivity-body').replaceChildren(...rows);
  }
  function render() {
    try {
      const settings = read();
      const result = model.calculate(settings);
      byId('wacc-label').textContent = pct(settings.discountRate);
      byId('terminal-label').textContent = pct(settings.terminalGrowth);
      const shift = settings.growthShift * 100;
      byId('shift-label').textContent = (shift >= 0 ? '+' : '') + shift.toFixed(1) + ' pp';
      byId('fcf-result').textContent = usd(result.freeCashFlow / 1000) + 'B';
      byId('cash-result').textContent = usd(-result.netDebt / 1000) + 'B';
      byId('value-result').textContent = usd(result.valuePerShare);
      byId('scenario-note').textContent = 'Selected growth path: ' + result.growthRates.map(pct).join(' / ') +
        '. Discount rate: ' + pct(settings.discountRate) + '; terminal growth: ' + pct(settings.terminalGrowth) +
        '. This is an illustrative model output.';
      drawChart(result);
      drawSensitivity(settings);
      byId('scenario-error').hidden = true;
      byId('export-scenario').disabled = false;
    } catch (error) {
      byId('scenario-error').textContent = 'Unable to calculate this scenario: ' + error.message;
      byId('scenario-error').hidden = false;
      byId('export-scenario').disabled = true;
    }
  }
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', render);
  form.addEventListener('reset', () => setTimeout(render, 0));
  byId('export-scenario').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([model.scenarioCsv(read())], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'zixsa-apple-fy2025-scenario.csv'; document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  byId('scenario-controls').disabled = false;
  render();
})();
