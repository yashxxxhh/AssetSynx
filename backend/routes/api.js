// routes/api.js
// All REST endpoints

const express = require("express");
const router  = express.Router();

const { getTicker, getLatestPrice, getAllTickers } = require("../services/dataLoader");
const { buildGraph, detectClusters, getDiversificationScore, getConcentrationScore } = require("../engine/graphEngine");
const { calculatePortfolioRisk, calculateVaR }    = require("../services/riskService");
const { optimiseWeights, getEfficientFrontier }   = require("../engine/mptEngine");
const { generateRecommendations }                 = require("../services/recommendationService");
const { generateChatResponse, generatePortfolioSummary } = require("../services/chatService");

// GET /api/health
router.get("/health", (req, res) => {
  res.json({ status: "ok", tickers: getAllTickers().length, time: new Date().toISOString() });
});

// GET /api/tickers
router.get("/tickers", (req, res) => {
  res.json({ tickers: getAllTickers() });
});

// GET /api/prices/:ticker
router.get("/prices/:ticker", (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const data   = getTicker(ticker);
  if (!data) return res.status(404).json({ error: `Ticker ${ticker} not found`, available: getAllTickers() });
  const latest = getLatestPrice(ticker);
  res.json({
    ticker,
    sector:  data.sector,
    latest,
    history: { dates: data.dates, prices: data.prices, returns: data.returns },
    stats:   { dataPoints: data.prices.length, minPrice: Math.min(...data.prices), maxPrice: Math.max(...data.prices), avgPrice: parseFloat((data.prices.reduce((s, p) => s + p, 0) / data.prices.length).toFixed(2)) },
  });
});

// POST /api/analyse  — full portfolio analysis
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
    const summary  = generatePortfolioSummary(portfolio);

    let mpt      = null;
    let frontier = [];
    try { mpt      = optimiseWeights(portfolio); }      catch (e) { mpt = { error: "Not enough price data" }; }
    try { frontier = getEfficientFrontier(portfolio); } catch (e) { frontier = []; }

    const recommendations = generateRecommendations(portfolio);

    res.json({
      graph: {
        nodes: graph.nodes.map(n => ({ id: n.id, label: n.label, sector: n.sector, value: n.value })),
        edges: graph.edges,
      },
      clusters,
      diversification: div,
      concentration:   conc,
      risk,
      var:             varData,
      mpt,
      frontier,
      recommendations,
      summary,
    });
  } catch (err) {
    console.error("[/api/analyse]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat  — template-based AI chat
router.post("/chat", (req, res) => {
  const { portfolio, question } = req.body;
  if (!portfolio || !Array.isArray(portfolio)) return res.status(400).json({ error: "portfolio array required" });
  if (!question || typeof question !== "string")  return res.status(400).json({ error: "question string required" });

  try {
    const text = generateChatResponse(question, portfolio);
    res.json({ text, source: "template" });
  } catch (err) {
    console.error("[/api/chat]", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
