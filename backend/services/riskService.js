// services/riskService.js
// Data-driven risk using standard deviation of daily returns
// and Value at Risk at 95% confidence

const { getTicker }                    = require("./dataLoader");
const { buildGraph, detectClusters, getConcentrationScore } = require("../engine/graphEngine");

function stdDeviation(values) {
  if (!values || values.length < 2) return 0;
  const mean     = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  return parseFloat(Math.sqrt(variance).toFixed(4));
}

function getAssetVolatility(ticker) {
  const data = getTicker(ticker);
  if (!data || data.returns.length < 2) return { volatility: 0, source: "no data" };
  return { volatility: stdDeviation(data.returns), source: "calculated", dataPoints: data.returns.length };
}

function calculatePortfolioRisk(portfolio) {
  if (!portfolio || portfolio.length === 0) return { level: "N/A", score: 0, color: "#94a3b8", breakdown: {}, assetVolatilities: [], clusters: [] };

  const totalValue = portfolio.reduce((s, a) => s + a.curVal, 0);
  let weightedVol  = 0;
  const assetVols  = [];

  portfolio.forEach(asset => {
    const weight  = totalValue > 0 ? asset.curVal / totalValue : 0;
    const volData = getAssetVolatility(asset.sub || asset.name);
    weightedVol  += weight * volData.volatility;
    assetVols.push({ name: asset.name, weight: parseFloat((weight * 100).toFixed(2)), volatility: volData.volatility, source: volData.source });
  });

  const graph    = buildGraph(portfolio);
  const conc     = getConcentrationScore(graph);
  const clusters = detectClusters(graph);
  const largest  = Math.max(...clusters.map(c => c.size), 0);

  const volScore    = Math.min(100, weightedVol * 500);
  const clusterScore= Math.min(100, largest * 20);
  const finalScore  = Math.round(volScore * 0.50 + conc.score * 0.30 + clusterScore * 0.20);

  return {
    level:  getRiskLevel(finalScore),
    score:  finalScore,
    color:  getRiskColor(finalScore),
    breakdown: {
      volatilityScore:    Math.round(volScore),
      concentrationScore: conc.score,
      clusterRiskScore:   clusterScore,
      weightedVolatility: parseFloat(weightedVol.toFixed(4)),
    },
    assetVolatilities: assetVols,
    clusters,
  };
}

function calculateVaR(portfolio) {
  const totalValue = portfolio.reduce((s, a) => s + a.curVal, 0);
  const risk       = calculatePortfolioRisk(portfolio);
  const vol        = risk.breakdown.weightedVolatility;
  const daily      = totalValue * vol * 1.645 / 100;
  const monthly    = daily * Math.sqrt(21);
  return {
    daily:   parseFloat(daily.toFixed(2)),
    monthly: parseFloat(monthly.toFixed(2)),
    meaning: `95% chance daily loss won't exceed $${daily.toFixed(0)}`,
  };
}

function getRiskLevel(s) { return s >= 65 ? "High" : s >= 35 ? "Medium" : "Low"; }
function getRiskColor(s) { return s >= 65 ? "#ef4444" : s >= 35 ? "#f59e0b" : "#10b981"; }

module.exports = { calculatePortfolioRisk, getAssetVolatility, calculateVaR, stdDeviation };
