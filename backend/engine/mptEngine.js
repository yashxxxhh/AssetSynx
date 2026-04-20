// engine/mptEngine.js
// Modern Portfolio Theory — simplified Sharpe-based optimisation
// E(Rp) = Σ(wi × Ri) | Sharpe = (Return - RiskFree) / Volatility

const { getTicker }    = require("../services/dataLoader");
const { stdDeviation } = require("../services/riskService");

const RISK_FREE_RATE = 0.05; // 5% annual

function getExpectedReturn(ticker) {
  const data = getTicker(ticker);
  if (!data || data.returns.length < 2) return 0;
  const mean = data.returns.reduce((s, v) => s + v, 0) / data.returns.length;
  return parseFloat(mean.toFixed(4));
}

function getAssetMetrics(ticker) {
  const data = getTicker(ticker);
  if (!data || data.returns.length < 2) return { ticker, expectedReturn: 0, volatility: 0, sharpe: 0 };
  const expectedReturn = getExpectedReturn(ticker);
  const volatility     = stdDeviation(data.returns);
  const dailyRF        = RISK_FREE_RATE / 252;
  const sharpe         = volatility > 0 ? parseFloat(((expectedReturn - dailyRF) / volatility).toFixed(4)) : 0;
  return { ticker, expectedReturn, volatility, sharpe, dataPoints: data.returns.length };
}

function getPortfolioMetrics(assets, weights) {
  let ret = 0, varP = 0;
  assets.forEach((asset, i) => {
    const m = getAssetMetrics(asset.sub || asset.name);
    ret  += weights[i] * m.expectedReturn;
    varP += Math.pow(weights[i], 2) * Math.pow(m.volatility, 2);
  });
  const vol   = Math.sqrt(varP);
  const dailyRF = RISK_FREE_RATE / 252;
  const sharpe  = vol > 0 ? (ret - dailyRF) / vol : 0;
  return {
    expectedReturn: parseFloat((ret * 252 * 100).toFixed(2)),
    volatility:     parseFloat((vol * Math.sqrt(252) * 100).toFixed(2)),
    sharpe:         parseFloat(sharpe.toFixed(4)),
  };
}

function optimiseWeights(assets) {
  if (!assets || assets.length === 0) return { assets: [], currentPortfolio: {}, optimisedPortfolio: {}, improvement: {} };

  const metrics  = assets.map(a => ({ ...getAssetMetrics(a.sub || a.name), name: a.name, id: a.id }));
  const totalVal = assets.reduce((s, a) => s + a.curVal, 0);
  const curW     = assets.map(a => totalVal > 0 ? a.curVal / totalVal : 1 / assets.length);

  const sharpeScores = metrics.map(m => Math.max(0, m.sharpe + 2));
  const totalSharpe  = sharpeScores.reduce((s, v) => s + v, 0);

  let sugW = totalSharpe > 0
    ? sharpeScores.map(s => s / totalSharpe)
    : assets.map(() => 1 / assets.length);

  const MIN = 0.05, MAX = 0.40;
  sugW = sugW.map(w => Math.min(MAX, Math.max(MIN, w)));
  const total = sugW.reduce((s, w) => s + w, 0);
  sugW = sugW.map(w => parseFloat((w / total).toFixed(4)));

  const current   = getPortfolioMetrics(assets, curW);
  const optimised = getPortfolioMetrics(assets, sugW);

  return {
    assets: assets.map((a, i) => ({
      id:              a.id,
      name:            a.name,
      ticker:          a.sub || a.name,
      currentWeight:   parseFloat((curW[i] * 100).toFixed(2)),
      suggestedWeight: parseFloat((sugW[i] * 100).toFixed(2)),
      change:          parseFloat(((sugW[i] - curW[i]) * 100).toFixed(2)),
      metrics:         metrics[i],
    })),
    currentPortfolio:   current,
    optimisedPortfolio: optimised,
    improvement: {
      returnDelta: parseFloat((optimised.expectedReturn - current.expectedReturn).toFixed(2)),
      sharpe:      parseFloat((optimised.sharpe - current.sharpe).toFixed(4)),
    },
  };
}

function getEfficientFrontier(assets, numPoints = 20) {
  if (!assets || assets.length < 2) return [];
  const points = [];
  for (let p = 0; p < numPoints; p++) {
    let w   = assets.map(() => Math.random());
    const s = w.reduce((x, v) => x + v, 0);
    w = w.map(v => v / s);
    const m = getPortfolioMetrics(assets, w);
    points.push({ risk: parseFloat(m.volatility.toFixed(2)), return: parseFloat(m.expectedReturn.toFixed(2)), sharpe: parseFloat(m.sharpe.toFixed(4)) });
  }
  return points.sort((a, b) => a.risk - b.risk);
}

module.exports = { optimiseWeights, getAssetMetrics, getPortfolioMetrics, getEfficientFrontier, getExpectedReturn };
