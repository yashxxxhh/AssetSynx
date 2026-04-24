// backend/services/ollamaService.js
// Ollama running on Windows, accessed from WSL
// Uses ollama npm package with custom host IP

const { Ollama } = require("ollama");

// Windows host IP from WSL — run `cat /etc/resolv.conf` in WSL to confirm yours
const ollama = new Ollama({ host: "http://172.29.192.1:11434" });
const MODEL  = "llama3";

// Check if Ollama is reachable
async function checkOllama() {
  try {
    await ollama.list();
    return true;
  } catch {
    return false;
  }
}

// Build system prompt with all portfolio context
function buildSystemPrompt(portfolio, risk, graphInsights, recommendations, mptData) {
  const totalValue = portfolio.reduce((s, a) => s + a.curVal, 0);
  const totalCost  = portfolio.reduce((s, a) => s + a.buyPrice * a.qty, 0);
  const totalGain  = totalValue - totalCost;
  const gainPct    = totalCost > 0 ? ((totalGain / totalCost) * 100).toFixed(1) : 0;

  const assetLines = portfolio.map(a => {
    const cost = a.buyPrice * a.qty;
    const gain = a.curVal - cost;
    const gPct = cost > 0 ? ((gain / cost) * 100).toFixed(1) : 0;
    const pPct = ((a.curVal / totalValue) * 100).toFixed(1);
    return `  - ${a.name} (${a.sub || a.category}): ${pPct}% of portfolio | value $${a.curVal.toLocaleString()} | invested $${cost.toLocaleString()} | gain ${gPct >= 0 ? "+" : ""}${gPct}%`;
  }).join("\n");

  const mptLines = (mptData && mptData.assets && !mptData.error)
    ? mptData.assets.map(a =>
        `  - ${a.name}: now ${a.currentWeight}% → suggested ${a.suggestedWeight}% (${a.change >= 0 ? "+" : ""}${a.change}%) | Sharpe: ${a.metrics?.sharpe || "N/A"}`
      ).join("\n")
    : "  MPT data unavailable.";

  const recLines = (recommendations && recommendations.length > 0)
    ? recommendations.slice(0, 5).map(r =>
        `  [${r.priority.toUpperCase()}] ${r.title} — ${r.detail} (source: ${r.source})`
      ).join("\n")
    : "  No recommendations.";

  const clusterLines = graphInsights?.clusters
    ? graphInsights.clusters.map(c => `  - ${c.assets.join(", ")} → ${c.risk}`).join("\n")
    : "  No cluster data.";

  return `You are AssetSynx AI — an intelligent financial portfolio assistant built with graph-based analysis and Modern Portfolio Theory.

YOU KNOW THESE TECHNIQUES:
- Pearson Correlation Coefficient: measures how two assets move together (-1 to +1)
- BFS Clustering: finds groups of correlated assets using Breadth-First Search
- Graph Density: measures overall portfolio concentration from the correlation network
- Modern Portfolio Theory (MPT): E(Rp) = Σ(wi × Ri) for expected portfolio return
- Sharpe Ratio: (Return - RiskFreeRate) / Volatility — return earned per unit of risk
- Value at Risk (VaR): portfolio × volatility × 1.645 at 95% confidence level
- Standard Deviation: measures daily price volatility

STANDARD TOOLS VS OUR SYSTEM:
- Standard tools: pie charts only, category-based risk rules, no correlation analysis
- Our system: Pearson correlation graph, BFS cluster detection, Sharpe-weighted MPT, data-driven volatility, VaR

COMMUNICATION RULES:
1. Technical question → use formula names and explain them briefly
2. Simple/casual question → plain everyday language with real-life analogies
3. ALWAYS use the actual numbers from the portfolio data below
4. When asked about investing more money → use MPT suggestions and risk data to advise
5. When asked what makes this system different → compare our techniques vs standard tools
6. When given a list of assets → run through the logic of Pearson, Sharpe, risk for those assets
7. Keep answers focused and clear

══════════════════════════════════════════
PORTFOLIO DATA
══════════════════════════════════════════
Total Value:    $${totalValue.toLocaleString()}
Total Invested: $${totalCost.toLocaleString()}
Total Gain:     ${totalGain >= 0 ? "+" : ""}$${Math.abs(totalGain).toLocaleString()} (${gainPct >= 0 ? "+" : ""}${gainPct}%)

HOLDINGS:
${assetLines}

RISK (data-driven volatility engine):
  Level:      ${risk?.level || "Unknown"} (score ${risk?.score || 0}/100)
  Volatility: ${risk?.breakdown?.weightedVolatility || 0} weighted daily std deviation
  Daily VaR:  $${risk?.var?.daily || "N/A"} at 95% confidence

GRAPH ANALYSIS (Pearson correlation network):
  Diversification: ${graphInsights?.diversification?.label || "Unknown"} — ${graphInsights?.diversification?.score || 0}/100
  Concentration:   ${graphInsights?.concentration?.label || "Unknown"} — ${graphInsights?.concentration?.score || 0}/100
  Avg Correlation: ${graphInsights?.concentration?.avgCorrelation || 0}

CORRELATED CLUSTERS (BFS detection):
${clusterLines}

MPT OPTIMISATION (Sharpe-weighted):
${mptLines}

TOP RECOMMENDATIONS (graph + risk + MPT combined):
${recLines}
══════════════════════════════════════════`;
}

// Template fallback when Ollama is unreachable
function templateFallback(portfolio, risk, graphInsights, recommendations) {
  const totalValue = portfolio.reduce((s, a) => s + a.curVal, 0);
  const topRec     = (recommendations || [])[0];
  const riskLevel  = risk?.level || "Unknown";
  const divLabel   = graphInsights?.diversification?.label || "Unknown";
  const conc       = graphInsights?.concentration?.score || 0;

  return `Your $${totalValue.toLocaleString()} portfolio has a ${riskLevel.toLowerCase()} risk score of ${risk?.score || 0}/100 and is ${divLabel.toLowerCase()} (diversification ${graphInsights?.diversification?.score || 0}/100). Concentration score is ${conc}/100 — ${conc > 60 ? "your assets are too correlated, a crash in one could drag the others" : "concentration is manageable"}. ${topRec ? `Most urgent action: ${topRec.title}. ${topRec.detail}` : "Keep monitoring your allocation monthly."} Tip: Make sure Ollama is running on Windows (ollama serve) for full AI responses.`;
}

// Main export — tries Ollama first, falls back to template
async function getOllamaResponse(question, portfolio, risk, graphInsights, recommendations, mptData) {
  const isRunning = await checkOllama();

  if (!isRunning) {
    console.log("[Ollama] Not reachable at 172.29.192.1:11434 — using template");
    return {
      text:   templateFallback(portfolio, risk, graphInsights, recommendations),
      source: "template (Ollama unreachable — run 'ollama serve' on Windows)",
      model:  null,
    };
  }

  try {
    console.log(`[Ollama] Connected. Sending to ${MODEL}...`);
    const systemPrompt = buildSystemPrompt(portfolio, risk, graphInsights, recommendations, mptData);

    const response = await ollama.chat({
      model:    MODEL,
      messages: [
        { role: "system",  content: systemPrompt },
        { role: "user",    content: question     },
      ],
      options: { temperature: 0.7, num_predict: 400 },
    });

    console.log("[Ollama] Response received");
    return {
      text:   response.message.content.trim(),
      source: `ollama (${MODEL})`,
      model:  MODEL,
    };
  } catch (err) {
    console.error("[Ollama] Error:", err.message);
    return {
      text:   templateFallback(portfolio, risk, graphInsights, recommendations),
      source: "template (ollama error)",
      model:  null,
    };
  }
}

module.exports = { getOllamaResponse, checkOllama };