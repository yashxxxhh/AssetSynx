// engine/graphEngine.js
// Builds a correlation graph over portfolio assets
// Nodes = assets, Edges = Pearson correlation between price returns

const { getTicker } = require("../services/dataLoader");

// Pearson Correlation Coefficient
// Measures how two assets move together: +1 together, 0 independent, -1 opposite
function calculateCorrelation(returnsA, returnsB) {
  const len = Math.min(returnsA.length, returnsB.length);
  if (len < 2) return 0;

  const a = returnsA.slice(0, len);
  const b = returnsB.slice(0, len);

  const meanA = a.reduce((s, v) => s + v, 0) / len;
  const meanB = b.reduce((s, v) => s + v, 0) / len;

  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < len; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num  += da * db;
    denA += da * da;
    denB += db * db;
  }

  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : parseFloat((num / den).toFixed(4));
}

// Build graph from portfolio assets
function buildGraph(portfolio) {
  const nodes = [];
  const edges = [];

  portfolio.forEach(asset => {
    const tickerData = getTicker(asset.sub) || getTicker(asset.name) || null;
    nodes.push({
      id:      asset.id,
      label:   asset.name,
      ticker:  asset.sub || asset.name,
      sector:  tickerData?.sector || asset.category,
      value:   asset.curVal,
      returns: tickerData?.returns || [],
      hasData: !!tickerData,
    });
  });

  // Compare every pair of assets (O(n²) — fine for portfolio size)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      let correlation = 0;
      let reason      = "no data";

      if (a.returns.length > 1 && b.returns.length > 1) {
        correlation = calculateCorrelation(a.returns, b.returns);
        reason      = "price correlation";
      } else if (a.sector === b.sector) {
        correlation = 0.65;
        reason      = "same sector";
      } else {
        correlation = 0.15;
        reason      = "different category";
      }

      if (Math.abs(correlation) >= 0.3) {
        edges.push({
          source:      a.id,
          target:      b.id,
          correlation,
          strength:    getStrengthLabel(correlation),
          reason,
        });
      }
    }
  }

  return { nodes, edges };
}

// BFS-based cluster detection — finds groups of correlated assets
function detectClusters(graph) {
  const { nodes, edges } = graph;
  const assigned  = new Set();
  const clusters  = [];
  const adjacency = {};

  nodes.forEach(n => { adjacency[n.id] = []; });
  edges.filter(e => e.correlation > 0.7).forEach(e => {
    adjacency[e.source].push(e.target);
    adjacency[e.target].push(e.source);
  });

  nodes.forEach(node => {
    if (assigned.has(node.id)) return;
    const cluster = [node.id];
    assigned.add(node.id);
    const queue = [node.id];
    while (queue.length > 0) {
      const cur = queue.shift();
      (adjacency[cur] || []).forEach(nId => {
        if (!assigned.has(nId)) {
          assigned.add(nId);
          cluster.push(nId);
          queue.push(nId);
        }
      });
    }
    clusters.push(cluster);
  });

  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n.label; });

  return clusters.map(c => ({
    assets: c.map(id => nodeMap[id]),
    size:   c.length,
    risk:   c.length > 2 ? "High Concentration" : "Normal",
  }));
}

function getConcentrationScore(graph) {
  const { nodes, edges } = graph;
  if (nodes.length < 2) return { score: 0, label: "N/A" };
  const maxEdges     = (nodes.length * (nodes.length - 1)) / 2;
  const totalCorr    = edges.reduce((s, e) => s + Math.abs(e.correlation), 0);
  const avgCorr      = edges.length > 0 ? totalCorr / edges.length : 0;
  const score        = Math.round((edges.length / maxEdges) * 50 + avgCorr * 50);
  return { score, label: getConcentrationLabel(score), edgeCount: edges.length, avgCorrelation: parseFloat(avgCorr.toFixed(3)) };
}

function getDiversificationScore(graph) {
  const c       = getConcentrationScore(graph);
  const score   = Math.max(0, 100 - c.score);
  const sectors = [...new Set(graph.nodes.map(n => n.sector))];
  return { score, label: getDiversificationLabel(score), sectorCount: sectors.length, sectors };
}

function getStrengthLabel(r)          { const a = Math.abs(r); return a >= 0.8 ? "Very Strong" : a >= 0.6 ? "Strong" : a >= 0.4 ? "Moderate" : "Weak"; }
function getConcentrationLabel(s)     { return s >= 70 ? "Very High" : s >= 50 ? "High" : s >= 30 ? "Moderate" : "Low"; }
function getDiversificationLabel(s)   { return s >= 70 ? "Well Diversified" : s >= 50 ? "Moderately Diversified" : s >= 30 ? "Poorly Diversified" : "Concentrated"; }

module.exports = { buildGraph, calculateCorrelation, detectClusters, getConcentrationScore, getDiversificationScore };
