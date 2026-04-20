// services/recommendationService.js
// Combines graph + risk + MPT signals into ranked recommendations

const { buildGraph, detectClusters, getDiversificationScore, getConcentrationScore } = require("../engine/graphEngine");
const { calculatePortfolioRisk } = require("./riskService");
const { optimiseWeights }        = require("../engine/mptEngine");

function generateRecommendations(portfolio) {
  if (!portfolio || portfolio.length === 0) {
    return [{ priority: "info", icon: "info", title: "Add your first asset", detail: "Start by adding stocks, crypto, or savings to your portfolio.", source: "general" }];
  }

  const recs       = [];
  const totalValue = portfolio.reduce((s, a) => s + a.curVal, 0);
  const graph      = buildGraph(portfolio);
  const clusters   = detectClusters(graph);
  const conc       = getConcentrationScore(graph);
  const div        = getDiversificationScore(graph);
  const risk       = calculatePortfolioRisk(portfolio);
  const byC        = {};
  portfolio.forEach(a => { byC[a.category] = (byC[a.category] || 0) + a.curVal; });

  // Graph signals
  clusters.forEach(c => {
    if (c.size >= 3) recs.push({ priority: "high", icon: "warning", title: "High correlation cluster detected", detail: `${c.assets.join(", ")} move together. A crash in one likely drags the others down.`, source: "graph" });
  });

  if (conc.score >= 60) recs.push({ priority: "high", icon: "warning", title: "Portfolio is highly concentrated", detail: `Concentration score ${conc.score}/100. Your assets are too similar. Add assets from different sectors.`, source: "graph" });

  const sectors = [...new Set(graph.nodes.map(n => n.sector))];
  if (sectors.length < 3) recs.push({ priority: "medium", icon: "tip", title: `Only ${sectors.length} sector(s) represented`, detail: `You are only in ${sectors.join(" and ")}. Adding Healthcare, Bonds, or Consumer Staples improves diversification.`, source: "graph" });

  // Risk signals
  if (risk.level === "High") {
    const worst = risk.assetVolatilities.filter(a => a.volatility > 0).sort((a, b) => b.volatility - a.volatility)[0];
    if (worst) recs.push({ priority: "high", icon: "warning", title: `${worst.name} has high volatility`, detail: `Daily volatility ${worst.volatility.toFixed(3)}% at ${worst.weight}% of portfolio. Consider reducing this position.`, source: "risk" });
  }

  Object.entries(byC).forEach(([cat, val]) => {
    const pct = (val / totalValue) * 100;
    if (pct > 50) recs.push({ priority: "high", icon: "warning", title: `${cat} exceeds 50% of portfolio`, detail: `${pct.toFixed(1)}% in ${cat}. Most advisors recommend no category exceed 40%.`, source: "risk" });
  });

  // MPT signals
  try {
    const mpt = optimiseWeights(portfolio);
    mpt.assets.forEach(a => {
      if (a.change <= -10) recs.push({ priority: "medium", icon: "tip", title: `Reduce ${a.name} allocation`, detail: `MPT suggests ${a.currentWeight}% → ${a.suggestedWeight}%. Lower Sharpe ratio than alternatives.`, source: "mpt" });
      else if (a.change >= 10) recs.push({ priority: "medium", icon: "tip", title: `Increase ${a.name} allocation`, detail: `MPT suggests ${a.currentWeight}% → ${a.suggestedWeight}%. Sharpe ratio: ${a.metrics?.sharpe?.toFixed(2)}.`, source: "mpt" });
    });
  } catch (e) { /* not enough data */ }

  // General
  if (portfolio.length < 4) recs.push({ priority: "low", icon: "tip", title: "Add more assets", detail: `You have ${portfolio.length} asset(s). 8-15 positions provides good diversification.`, source: "general" });

  const savingsPct = ((byC["Savings"] || 0) / totalValue) * 100;
  if (savingsPct < 10) recs.push({ priority: "low", icon: "tip", title: "Build an emergency buffer", detail: `Only ${savingsPct.toFixed(1)}% in savings. Maintain 10-15% in liquid assets.`, source: "general" });

  if (recs.length === 0) recs.push({ priority: "low", icon: "success", title: "Portfolio looks healthy", detail: "Well-diversified with manageable risk. Review monthly.", source: "general" });

  const order = { high: 0, medium: 1, low: 2, info: 3 };
  recs.sort((a, b) => (order[a.priority] || 3) - (order[b.priority] || 3));
  return recs;
}

module.exports = { generateRecommendations };
