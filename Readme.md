# AssetSynx AI 

## What it does
A full-stack portfolio intelligence system that analyzes investments using historical market data.  
It identifies relationships between assets, measures risk, and suggests optimized allocations.  
Each insight indicates whether it comes from graph analysis, risk modeling, or optimization.

---

## How it works
User assets are evaluated using S&P 500 historical data.

- Backend computes daily returns from price data  
- Graph engine builds relationships using correlation  
- Clusters of highly related assets are detected  
- Risk engine calculates volatility and potential losses  
- Optimization engine applies Modern Portfolio Theory (MPT)  
- Recommendation engine combines all insights  
- Optional chatbot maps queries to these engines  

---

## Core Logic Flow

- Load historical price dataset  
- Convert prices into daily returns  
- Compute correlation between assets  
- Build weighted graph (nodes = assets, edges = correlation)  
- Detect clusters using BFS  
- Calculate concentration and diversification score  
- Compute volatility and portfolio risk  
- Apply MPT for allocation optimization  
- Generate recommendations  

---

## Tech Stack

| Layer        | Technology |
|-------------|-----------|
| Frontend    | React, Tailwind CSS, Recharts |
| Backend     | Node.js, Express |
| Data        | S&P 500 CSV dataset |
| Storage     | LocalStorage (DB-ready abstraction) |
| Graph Logic | Correlation + BFS |
| Risk Engine | Standard Deviation, Value at Risk (VaR) |
| Optimization| Modern Portfolio Theory (MPT), Sharpe Ratio |
| AI Layer    | LLM Based(using ollama ) |

---

