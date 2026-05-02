"use strict";

function solveKnapsack(items, capacityHours) {
  const n = items.length;
  const W = Math.floor(capacityHours);

  if (n === 0 || W <= 0) {
    return { selectedItems: [], totalDuration: 0, totalImpact: 0 };
  }

  const dp = new Float64Array(W + 1).fill(0);

  const table = new Float64Array((n + 1) * (W + 1)).fill(0);

  for (let i = 1; i <= n; i++) {
    const { duration, impact } = items[i - 1];
    const wt = Math.floor(duration);

    for (let w = W; w >= wt; w--) {
      const withItem = table[(i - 1) * (W + 1) + (w - wt)] + impact;
      const withoutItem = table[(i - 1) * (W + 1) + w];

      table[i * (W + 1) + w] = withItem > withoutItem ? withItem : withoutItem;
    }

    for (let w = 0; w < wt; w++) {
      table[i * (W + 1) + w] = table[(i - 1) * (W + 1) + w];
    }
  }

  const maxImpact = table[n * (W + 1) + W];

  const picked = [];
  let remainingCap = W;

  for (let i = n; i >= 1; i--) {
    const curr = table[i * (W + 1) + remainingCap];
    const prev = table[(i - 1) * (W + 1) + remainingCap];

    if (curr !== prev) {

      picked.push(items[i - 1]);
      remainingCap -= Math.floor(items[i - 1].duration);
    }
  }

  const totalDuration = picked.reduce((sum, v) => sum + v.duration, 0);

  return {
    selectedItems: picked.reverse(),
    totalDuration,
    totalImpact: maxImpact,
  };
}

module.exports = { solveKnapsack };
