// services/dataLoader.js
// Reads S&P 500 CSV into memory using Node.js built-ins only
// No external CSV library needed

const fs   = require("fs");
const path = require("path");

// In-memory store: { TICKER: { dates, prices, returns, sector } }
let dataStore = {};

const SECTOR_MAP = {
  AAPL:  "Technology",
  MSFT:  "Technology",
  GOOGL: "Technology",
  TSLA:  "Consumer Discretionary",
  SPY:   "Index",
  AMZN:  "Consumer Discretionary",
  NVDA:  "Technology",
  META:  "Technology",
  JPM:   "Financials",
  JNJ:   "Healthcare",
};

// Parse CSV using only Node.js fs — no csv-parse library
function loadCSV(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const raw     = fs.readFileSync(filePath, "utf-8");
      const lines   = raw.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim());

      const dateIdx  = headers.indexOf("Date");
      const closeIdx = headers.indexOf("Close");
      const nameIdx  = headers.indexOf("Name");

      lines.slice(1).forEach(line => {
        const cols   = line.split(",");
        const ticker = cols[nameIdx]?.trim();
        const date   = cols[dateIdx]?.trim();
        const price  = parseFloat(cols[closeIdx]);

        if (!ticker || !date || isNaN(price)) return;

        if (!dataStore[ticker]) {
          dataStore[ticker] = {
            dates:   [],
            prices:  [],
            returns: [],
            sector:  SECTOR_MAP[ticker] || "Unknown",
          };
        }

        dataStore[ticker].dates.push(date);
        dataStore[ticker].prices.push(price);
      });

      // Calculate daily returns: (today - yesterday) / yesterday * 100
      Object.keys(dataStore).forEach(ticker => {
        const prices  = dataStore[ticker].prices;
        const returns = [0];
        for (let i = 1; i < prices.length; i++) {
          const r = ((prices[i] - prices[i - 1]) / prices[i - 1]) * 100;
          returns.push(parseFloat(r.toFixed(4)));
        }
        dataStore[ticker].returns = returns;
      });

      console.log(`[DataLoader] Loaded ${Object.keys(dataStore).length} tickers from CSV`);
      resolve(dataStore);
    } catch (err) {
      reject(err);
    }
  });
}

function getTicker(ticker)     { return dataStore[ticker?.toUpperCase()] || null; }
function getLatestPrice(ticker){
  const d = getTicker(ticker);
  if (!d || !d.prices.length) return null;
  return {
    ticker,
    price:  d.prices[d.prices.length - 1],
    date:   d.dates[d.dates.length - 1],
    sector: d.sector,
  };
}
function getAllTickers()        { return Object.keys(dataStore); }
function getStore()            { return dataStore; }

module.exports = { loadCSV, getTicker, getLatestPrice, getAllTickers, getStore };
