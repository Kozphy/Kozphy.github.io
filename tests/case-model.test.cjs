const { test } = require('node:test');
const assert = require('node:assert/strict');
const model = require('../assets/js/case-model.js');
const rounded = value => Number(value.toFixed(2));

test('base cash bridges and per-share result match the pinned Python case', () => {
  const result = model.calculate();
  assert.equal(result.freeCashFlow, 98767);
  assert.equal(result.netDebt, -33763);
  assert.equal(rounded(result.valuePerShare), 143.49);
  assert.equal(rounded(result.enterpriseValue / 1000), 2085.99);
  assert.deepEqual(result.projections.map(rounded), [105680.69, 112021.53, 117622.61, 122915.63, 127832.25]);
});
test('all 15 sensitivity cells match the published Python case assertions', () => {
  const expected = [[160.47, 175.14, 193.47], [145.95, 157.73, 172.13], [133.85, 143.49, 155.05],
    [123.61, 131.62, 141.08], [114.84, 121.58, 129.44]];
  [0.07, 0.075, 0.08, 0.085, 0.09].forEach((discountRate, row) => {
    [0.02, 0.025, 0.03].forEach((terminalGrowth, col) => {
      assert.equal(rounded(model.calculate({ discountRate, terminalGrowth }).valuePerShare), expected[row][col]);
    });
  });
});
test('changing the growth path changes projections and leaves fixed cash bridges unchanged', () => {
  const base = model.calculate();
  const higher = model.calculate({ growthShift: 0.01 });
  assert.ok(higher.valuePerShare > base.valuePerShare);
  assert.equal(higher.freeCashFlow, base.freeCashFlow);
  assert.equal(higher.netDebt, base.netDebt);
  assert.equal(rounded(higher.growthRates[0]), 0.08);
});
test('non-finite assumptions and invalid discount/growth combinations are rejected', () => {
  for (const discountRate of [NaN, Infinity, -Infinity, '0.08', null]) {
    assert.throws(() => model.calculate({ discountRate }), RangeError);
  }
  assert.throws(() => model.calculate({ discountRate: 0.025, terminalGrowth: 0.025 }), RangeError);
  assert.throws(() => model.calculate({ discountRate: 0.02, terminalGrowth: 0.025 }), RangeError);
  assert.throws(() => model.calculate({ growthShift: -1.05 }), RangeError);
  assert.throws(() => model.calculate({ growthShift: Number.MAX_VALUE }), RangeError);
});
test('all UI control boundaries and their sensitivity neighbours remain calculable', () => {
  for (const discountRate of [0.06, 0.12]) for (const terminalGrowth of [0, 0.04]) for (const growthShift of [-0.03, 0.03]) {
    for (const rateShift of [-0.01, 0, 0.01]) for (const terminalShift of [-0.005, 0, 0.005]) {
      assert.ok(Number.isFinite(model.calculate({ discountRate: discountRate + rateShift,
        terminalGrowth: terminalGrowth + terminalShift, growthShift }).valuePerShare));
    }
  }
});
test('scenario exports include selected assumptions and computed outputs, not static base values', () => {
  const csv = model.scenarioCsv({ discountRate: 0.09, terminalGrowth: 0.02, growthShift: 0.01 });
  assert.ok(csv.includes('"discount_rate","0.09","decimal","assumption"'));
  assert.ok(csv.includes('"growth_shift","0.01","decimal","assumption"'));
  const match = csv.match(/"value_per_share","([^"]+)"/);
  assert.equal(Number(match[1]), model.calculate({ discountRate: 0.09, terminalGrowth: 0.02, growthShift: 0.01 }).valuePerShare);
  assert.ok(csv.includes('not investment advice'));
  assert.ok(csv.endsWith('\r\n'));
});
test('scenario runs cannot mutate the frozen source inputs and default assumptions', () => {
  const before = JSON.stringify(model.snapshot);
  model.calculate({ growthShift: 0.03 });
  assert.equal(JSON.stringify(model.snapshot), before);
  assert.ok(Object.isFrozen(model.snapshot));
  assert.ok(Object.isFrozen(model.baseGrowth));
  assert.equal(rounded(model.calculate().valuePerShare), 143.49);
});
