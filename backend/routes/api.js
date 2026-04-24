// backend/routes/api.js

const express = require("express");
const router  = express.Router();

const { getTicker, getLatestPrice, getAllTickers }                   = require("../services/dataLoader");
const { buildGraph, detectClusters, getDiversificationScore, getConcentrationScore } = require("../engine/graphEngine");
const { calculatePortfolioRisk, calculateVaR }                      = require("../services/riskService");
const { optimiseWeights, getEfficientFrontier }                     = require("../engine/mptEngine");
const { generateRecommendations }                                   = require("../services/recommendationService");
const { getOllamaResponse, checkOllama }                            = require("../services/ollamaService");

// GET /api/health
router.get("/health", async (req, res) => {
  const ollamaUp = await checkOllama();
  res.json({
    status:  "ok",
    tickers: getAllTickers().length,
    ollama:  ollamaUp ? "running" : "offline",
    time:    new Date().toISOString(),
  });
});

// GET /api/tickers
router.get("/tickers", (req, res) => {
  res.json({ tickers: getAllTickers() });
});

// GET /api/prices/:ticker
router.get("/prices/:ticker", (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const data   = getTicker(ticker);
  if (!data) return res.status(404).json({ error: `${ticker} not found`, available: getAllTickers() });
  res.json({
    ticker,
    sector:  data.sector,
    latest:  getLatestPrice(ticker),
    history: { dates: data.dates, prices: data.prices, returns: data.returns },
    stats:   { dataPoints: data.prices.length, minPrice: Math.min(...data.prices), maxPrice: Math.max(...data.prices) },
  });
});

// POST /api/analyse — full portfolio analysis
router.post("/analyse", (req, res) => {
  const { portfolio } = req.body;
  if (!portfolio || !Array.isArray(portfolio)) return res.status(400).json({ error: "portfolio array required" });

  try {
    const graph    = buildGraph(portfolio);
    const clusters = detectClusters(graph);
    const div      = getDiversificationScore(graph);
    const conc     = getConcentrationScore(graph);
    const risk     = calculatePortfolioRisk(portfolio);
    const varData  = calculateVaR(portfolio);

    let mpt = null, frontier = [];
    try { mpt      = optimiseWeights(portfolio); }      catch { mpt = { error: "Not enough price data" }; }
    try { frontier = getEfficientFrontier(portfolio); } catch { frontier = []; }

    const recommendations = generateRecommendations(portfolio);

    res.json({
      graph: {
        nodes: graph.nodes.map(n => ({ id: n.id, label: n.label, sector: n.sector, value: n.value })),
        edges: graph.edges,
      },
      clusters,
      diversification: div,
      concentration:   conc,
      risk: { ...risk, var: varData },
      var:  varData,
      mpt,
      frontier,
      recommendations,
    });
  } catch (err) {
    console.error("[/api/analyse]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat — Ollama-powered chat
router.post("/chat", async (req, res) => {
  const { portfolio, question } = req.body;
  if (!portfolio || !Array.isArray(portfolio)) return res.status(400).json({ error: "portfolio array required" });
  if (!question || typeof question !== "string")  return res.status(400).json({ error: "question string required" });

  try {
    // Run all engines to get full context for Ollama
    const graph    = buildGraph(portfolio);
    const clusters = detectClusters(graph);
    const div      = getDiversificationScore(graph);
    const conc     = getConcentrationScore(graph);
    const risk     = calculatePortfolioRisk(portfolio);
    const varData  = calculateVaR(portfolio);
    const recs     = generateRecommendations(portfolio);
    let   mpt      = null;
    try { mpt = optimiseWeights(portfolio); } catch { mpt = null; }

    const graphInsights = { diversification: div, concentration: conc, clusters };

    const result = await getOllamaResponse(
      question,
      portfolio,
      { ...risk, var: varData },
      graphInsights,
      recs,
      mpt
    );

    res.json(result);
  } catch (err) {
    console.error("[/api/chat]", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;