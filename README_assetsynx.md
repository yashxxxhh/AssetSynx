# AssetSynx AI

An intelligent portfolio management system built with React + Node.js. No external AI APIs. No paid services. Works fully offline after `npm install`.

---

## Quick Start

**You need two terminals.**

### Terminal 1 — Backend

```bash
cd backend
npm install
npm start
```

Server runs at `http://localhost:3001`

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm start
```

App opens at `http://localhost:3000`

---

## Project Structure

```
assetsynx/
├── backend/
│   ├── server.js                     ← Express server entry point
│   ├── package.json                  ← only 2 dependencies: express, cors
│   ├── data/
│   │   └── sp500_sample.csv          ← S&P 500 price dataset (AAPL, MSFT, TSLA, SPY, GOOGL)
│   ├── engine/
│   │   ├── graphEngine.js            ← Pearson correlation, BFS clustering, concentration score
│   │   └── mptEngine.js              ← Sharpe ratio, MPT weight optimisation, efficient frontier
│   ├── services/
│   │   ├── dataLoader.js             ← reads CSV into memory, calculates daily returns
│   │   ├── riskService.js            ← volatility (std deviation), Value at Risk
│   │   ├── recommendationService.js  ← combines graph + risk + MPT into recommendations
│   │   └── chatService.js            ← answers portfolio questions, no API needed
│   └── routes/
│       └── api.js                    ← all REST endpoints
│
└── frontend/
    ├── package.json                  ← react, react-scripts, recharts
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js                  ← React entry point
        └── App.jsx                   ← complete application (all pages + components)
```

---

## Features

**Dashboard** — portfolio hero banner, pie chart, correlation graph snapshot, AI recommendations

**Portfolio** — add, edit, delete assets with category filters (Stocks / Crypto / Savings)

**Analytics** — MPT weight optimisation, efficient frontier scatter chart, per-asset Sharpe ratio table

**Graph Insights** — SVG correlation network, cluster detection, pairwise correlation table, VaR panel

**AI Assistant** — chat with your portfolio using plain English questions, all answers are calculated from real data

**Settings** — reset to sample data, clear all data

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check server is running |
| GET | `/api/tickers` | List available tickers in dataset |
| GET | `/api/prices/:ticker` | Price history and stats for one ticker |
| POST | `/api/analyse` | Full portfolio analysis — graph, risk, MPT, recommendations |
| POST | `/api/chat` | Answer a plain English question about the portfolio |

### Example — POST /api/analyse

Request body:
```json
{
  "portfolio": [
    { "id": "1", "name": "Apple Inc.", "sub": "AAPL", "category": "Stocks", "qty": 50, "buyPrice": 150, "curVal": 8750 },
    { "id": "2", "name": "Bitcoin",    "sub": "BTC",  "category": "Crypto", "qty": 2,  "buyPrice": 30000, "curVal": 84000 }
  ]
}
```

Response includes:
- `graph` — nodes, edges, correlation values
- `clusters` — groups of correlated assets
- `risk` — level (High/Medium/Low), score, volatility breakdown
- `var` — daily and monthly Value at Risk at 95% confidence
- `mpt` — current vs suggested weights, Sharpe ratios, efficient frontier
- `recommendations` — prioritised list from all three engines
- `summary` — plain English overview

### Example — POST /api/chat

Request body:
```json
{
  "portfolio": [ ... ],
  "question": "Is my portfolio risky?"
}
```

Questions the chatbot understands:
- risk, safe, dangerous, worried
- diversify, spread, variety
- correlat, cluster, related
- value, worth, total, how much
- alloc, suggest, rebalance, optimise, mpt
- crypto, bitcoin, stocks
- best, top, perform
- var, value at risk, maximum loss
- concentrat, overlap

---

## How the Engines Work

**Graph Engine** (`engine/graphEngine.js`)
Builds a correlation network over your assets. Pearson correlation coefficient is calculated from historical daily returns. Assets with correlation above 0.7 are grouped into clusters using BFS. Graph density becomes the concentration score.

**Risk Engine** (`services/riskService.js`)
Calculates the standard deviation of daily returns for each asset. These are weighted by portfolio allocation to produce a weighted volatility. Value at Risk is estimated using `VaR = portfolio_value × volatility × 1.645` (z-score for 95% confidence).

**MPT Engine** (`engine/mptEngine.js`)
Computes Sharpe ratio per asset: `(expected_return - risk_free_rate) / volatility`. Suggested allocation weights are proportional to each asset's Sharpe ratio, constrained between 5% minimum and 40% maximum per position.

**Chat Service** (`services/chatService.js`)
Keyword-based response engine that reads your real portfolio numbers. No external API. No API key. Works fully offline.

---

## Dataset

The included `sp500_sample.csv` covers 5 tickers (AAPL, MSFT, TSLA, SPY, GOOGL) over 10 trading days.

For broader analysis, replace it with the full S&P 500 dataset from Kaggle:
`https://www.kaggle.com/datasets/camnugent/sandp500`

Same CSV format — the loader will pick up all tickers automatically.

---

## Add Your Own Asset Tickers

When adding an asset in the app, set the **Ticker Symbol** field to a ticker that exists in the CSV (AAPL, MSFT, TSLA, SPY, GOOGL). This enables real price-based correlation calculation.

Assets with unknown tickers still work — the system uses sector-based correlation estimates as a fallback.

---

## No API Keys Required

The previous version used OpenRouter for LLM responses. This version removes that entirely. All analysis and chat responses are generated locally from your portfolio data using the built-in engines. Nothing is sent to any external service.

---

## Roadmap

- Live prices from Alpha Vantage or CoinGecko
- Full Markowitz optimisation with covariance matrix
- MongoDB migration (Store utility is already abstracted for this)
- Temporal graph learning to track how correlations change over time
- Multi-user support with JWT authentication
