// services/chatService.js
// Pure template-based chat — no external API needed
// Reads actual portfolio data and returns intelligent answers

const { calculatePortfolioRisk } = require("./riskService");
const { optimiseWeights }        = require("../engine/mptEngine");
const { getDiversificationScore, getConcentrationScore, buildGraph, detectClusters } = require("../engine/graphEngine");

function generateChatResponse(question, portfolio) {
  if (!portfolio || portfolio.length === 0) {
    return "You have no assets yet. Add some stocks, crypto, or savings to get started, then ask me anything about your portfolio.";
  }

  const q          = question.toLowerCase();
  const totalValue = portfolio.reduce((s, a) => s + a.curVal, 0);
  const risk       = calculatePortfolioRisk(portfolio);
  const graph      = buildGraph(portfolio);
  const div        = getDiversificationScore(graph);
  const conc       = getConcentrationScore(graph);
  const clusters   = detectClusters(graph);
  const byC        = {};
  portfolio.forEach(a => { byC[a.category] = (byC[a.category] || 0) + a.curVal; });

  // Risk questions
  if (q.includes("risk") || q.includes("safe") || q.includes("dangerous") || q.includes("worried")) {
    const vols = risk.assetVolatilities.filter(a => a.volatility > 0).sort((a, b) => b.volatility - a.volatility);
    const worst = vols[0];
    return `Your portfolio risk level is **${risk.level}** (score ${risk.score}/100). ` +
      `${risk.level === "High" ? `The main driver is high price volatility${worst ? ` — ${worst.name} has a daily volatility of ${worst.volatility.toFixed(3)}%` : ""}. Consider rebalancing to reduce concentration.` : risk.level === "Medium" ? "Your portfolio is moderately balanced. Keep an eye on correlated holdings." : "Your portfolio is well-managed with low volatility. Good work."}`;
  }

  // Diversification
  if (q.includes("diversif") || q.includes("spread") || q.includes("variety")) {
    return `Your diversification score is **${div.score}/100** (${div.label}). ` +
      `You hold assets across ${div.sectorCount} sector(s): ${div.sectors.join(", ")}. ` +
      `${div.score < 50 ? "Adding assets from different sectors like Healthcare, Bonds, or Commodities would improve this significantly." : "Your portfolio is reasonably spread across sectors."}`;
  }

  // Correlation and clusters
  if (q.includes("correlat") || q.includes("cluster") || q.includes("together") || q.includes("related")) {
    const largeClusters = clusters.filter(c => c.size > 1);
    if (largeClusters.length === 0) return "Your assets appear to be fairly uncorrelated — they tend to move independently, which is good for risk management.";
    return `I found ${largeClusters.length} correlation cluster(s) in your portfolio. ` +
      largeClusters.map(c => `**${c.assets.join(" + ")}** move together (${c.risk})`).join(". ") +
      ". Highly correlated assets don't provide true diversification — a crash in one tends to drag the others.";
  }

  // Total value
  if (q.includes("value") || q.includes("worth") || q.includes("total") || q.includes("how much")) {
    const cost = portfolio.reduce((s, a) => s + a.buyPrice * a.qty, 0);
    const gain = totalValue - cost;
    return `Your total portfolio value is **$${totalValue.toLocaleString()}**. ` +
      `You invested $${cost.toLocaleString()} and your current ${gain >= 0 ? "gain" : "loss"} is ${gain >= 0 ? "+" : ""}$${gain.toLocaleString()} (${cost > 0 ? ((gain / cost) * 100).toFixed(2) : 0}%).`;
  }

  // Allocation / MPT
  if (q.includes("alloc") || q.includes("suggest") || q.includes("rebalanc") || q.includes("optimis") || q.includes("optimiz") || q.includes("mpt")) {
    try {
      const mpt = optimiseWeights(portfolio);
      const changes = mpt.assets.filter(a => Math.abs(a.change) >= 5);
      if (changes.length === 0) return "Your current allocation is close to the MPT-suggested optimal. No major changes needed.";
      return `MPT suggests these changes: ` +
        changes.map(a => `**${a.name}** ${a.change > 0 ? "↑" : "↓"} ${a.currentWeight}% → ${a.suggestedWeight}%`).join(", ") +
        ". This is based on each asset's Sharpe ratio — the return earned per unit of risk taken.";
    } catch (e) {
      return "Not enough price history to run MPT optimisation. Add assets with known ticker symbols (AAPL, MSFT, TSLA, SPY, GOOGL) for full analysis.";
    }
  }

  // Specific category
  if (q.includes("crypto") || q.includes("bitcoin")) {
    const cp = ((byC["Crypto"] || 0) / totalValue) * 100;
    return `Crypto represents **${cp.toFixed(1)}%** of your portfolio ($${(byC["Crypto"] || 0).toLocaleString()}). ${cp > 40 ? "This is above the generally recommended 30% maximum for volatile assets. Consider reducing exposure." : cp > 20 ? "Moderate crypto exposure. Keep an eye on market volatility." : "Conservative crypto allocation. Well within safe limits."}`;
  }

  if (q.includes("stock")) {
    const sp = ((byC["Stocks"] || 0) / totalValue) * 100;
    return `Stocks represent **${sp.toFixed(1)}%** of your portfolio ($${(byC["Stocks"] || 0).toLocaleString()}). ${sp < 30 ? "Consider increasing stock exposure for long-term growth." : sp > 70 ? "High stock concentration. Adding bonds or commodities would reduce risk." : "Healthy stock allocation."}`;
  }

  // Best performer
  if (q.includes("best") || q.includes("top") || q.includes("perform")) {
    const best = [...portfolio].sort((a, b) => (b.curVal - b.buyPrice * b.qty) - (a.curVal - a.buyPrice * a.qty))[0];
    const gain = best.curVal - best.buyPrice * best.qty;
    return `Your best performing asset is **${best.name}** with a gain of $${gain.toLocaleString()} (${best.buyPrice > 0 ? ((gain / (best.buyPrice * best.qty)) * 100).toFixed(2) : 0}%).`;
  }

  // VaR
  if (q.includes("var") || q.includes("value at risk") || q.includes("maximum loss") || q.includes("worst case")) {
    const vol   = risk.breakdown.weightedVolatility;
    const daily = totalValue * vol * 1.645 / 100;
    return `Your Value at Risk (95% confidence) is approximately **$${daily.toFixed(0)} per day**. This means there is a 95% probability your portfolio will not lose more than this amount in a single trading day.`;
  }

  // Concentration
  if (q.includes("concentrat") || q.includes("overlap")) {
    return `Your concentration score is **${conc.score}/100** (${conc.label}). Average correlation between assets is ${conc.avgCorrelation}. ${conc.score > 60 ? "High concentration is a risk — if one asset falls, correlated assets tend to fall too." : "Concentration is manageable at current levels."}`;
  }

  // Default
  return `I can help with your **risk level**, **diversification score**, **asset correlation**, **MPT allocation suggestions**, **total portfolio value**, **best performers**, **crypto/stock exposure**, **Value at Risk**, and **concentration score**. What would you like to explore?`;
}

function generatePortfolioSummary(portfolio) {
  if (!portfolio || portfolio.length === 0) return "No portfolio data available.";

  const totalValue = portfolio.reduce((s, a) => s + a.curVal, 0);
  const cost       = portfolio.reduce((s, a) => s + a.buyPrice * a.qty, 0);
  const gain       = totalValue - cost;
  const risk       = calculatePortfolioRisk(portfolio);
  const graph      = buildGraph(portfolio);
  const div        = getDiversificationScore(graph);
  const conc       = getConcentrationScore(graph);

  return `Your $${totalValue.toLocaleString()} portfolio has a ${risk.level.toLowerCase()} risk score of ${risk.score}/100 and a diversification score of ${div.score}/100 (${div.label.toLowerCase()}). ` +
    `You are ${gain >= 0 ? "up" : "down"} $${Math.abs(gain).toLocaleString()} overall. ` +
    `Concentration score is ${conc.score}/100 — ${conc.score > 60 ? "your assets are highly correlated, consider diversifying." : conc.score > 30 ? "moderate concentration, room to improve." : "well spread across uncorrelated assets."}`;
}

module.exports = { generateChatResponse, generatePortfolioSummary };
