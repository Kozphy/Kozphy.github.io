/* Browser mirror of the educational Python case at a35303cb179f2d30aa17780e368af55c3f8a476b. */
(function (root) {
  'use strict';
  const snapshot = Object.freeze({
    cashFromOperations: 111482,
    capitalExpenditures: 12715,
    cashAndSecurities: 132420,
    debt: 98657,
    shares: 14773.26
  });
  const baseGrowth = Object.freeze([0.07, 0.06, 0.05, 0.045, 0.04]);
  const defaults = Object.freeze({ discountRate: 0.08, terminalGrowth: 0.025, growthShift: 0 });
  function calculate(options = {}) {
    const settings = { ...defaults, ...options };
    const { discountRate, terminalGrowth, growthShift } = settings;
    if (![discountRate, terminalGrowth, growthShift].every(Number.isFinite)) {
      throw new RangeError('All assumptions must be finite numbers.');
    }
    if (discountRate <= -1 || discountRate <= terminalGrowth) {
      throw new RangeError('Discount rate must exceed terminal growth and be above −100%.');
    }
    const growthRates = baseGrowth.map(rate => rate + growthShift);
    if (growthRates.some(rate => rate <= -1)) {
      throw new RangeError('Annual growth must remain above −100%.');
    }
    const freeCashFlow = snapshot.cashFromOperations - snapshot.capitalExpenditures;
    const netDebt = snapshot.debt - snapshot.cashAndSecurities;
    let value = freeCashFlow;
    const projections = growthRates.map(rate => (value *= 1 + rate));
    const presentValueCashFlows = projections.reduce((sum, amount, index) =>
      sum + amount / Math.pow(1 + discountRate, index + 1), 0);
    const terminalValue = projections[4] * (1 + terminalGrowth) / (discountRate - terminalGrowth);
    const presentValueTerminal = terminalValue / Math.pow(1 + discountRate, 5);
    const enterpriseValue = presentValueCashFlows + presentValueTerminal;
    const equityValue = enterpriseValue - netDebt;
    const valuePerShare = equityValue / snapshot.shares;
    if (![...projections, enterpriseValue, equityValue, valuePerShare].every(Number.isFinite)) {
      throw new RangeError('Assumptions produce a non-finite result.');
    }
    return { ...settings, growthRates, freeCashFlow, netDebt, projections,
      presentValueCashFlows, presentValueTerminal, enterpriseValue, equityValue, valuePerShare };
  }
  function scenarioCsv(options = {}) {
    const result = calculate(options);
    const rows = [
      ['metric', 'value', 'unit', 'type'],
      ['case', 'Apple FY2025 educational portfolio', 'text', 'scope'],
      ['source_revision', 'a35303cb179f2d30aa17780e368af55c3f8a476b', 'git_sha', 'source'],
      ['cash_from_operations', snapshot.cashFromOperations, 'USD_millions', 'input'],
      ['capital_expenditures', snapshot.capitalExpenditures, 'USD_millions', 'input'],
      ['cash_and_securities', snapshot.cashAndSecurities, 'USD_millions', 'input'],
      ['debt', snapshot.debt, 'USD_millions', 'input'],
      ['shares', snapshot.shares, 'millions', 'input'],
      ['discount_rate', result.discountRate, 'decimal', 'assumption'],
      ['terminal_growth', result.terminalGrowth, 'decimal', 'assumption'],
      ['growth_shift', result.growthShift, 'decimal', 'assumption'],
      ...result.growthRates.map((rate, i) => [`growth_year_${i + 1}`, rate, 'decimal', 'assumption']),
      ['fcf_proxy', result.freeCashFlow, 'USD_millions', 'calculated'],
      ['net_debt', result.netDebt, 'USD_millions', 'calculated'],
      ...result.projections.map((amount, i) => [`projected_fcf_year_${i + 1}`, amount, 'USD_millions', 'calculated']),
      ['enterprise_value', result.enterpriseValue, 'USD_millions', 'calculated'],
      ['equity_value', result.equityValue, 'USD_millions', 'calculated'],
      ['value_per_share', result.valuePerShare, 'USD', 'calculated'],
      ['limitation', 'Simplified CFO-minus-capex proxy; frozen shares; educational scenario; not investment advice', 'text', 'scope']
    ];
    return rows.map(row => row.map(item => '"' + String(item).replace(/"/g, '""') + '"').join(',')).join('\r\n') + '\r\n';
  }
  const api = Object.freeze({ snapshot, baseGrowth, defaults, calculate, scenarioCsv });
  root.FinanceCase = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
