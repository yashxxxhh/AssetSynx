AssetSynx AI 

What it does
A full-stack portfolio intelligence system that analyzes investments using historical market data. It identifies relationships between assets, measures risk, and suggests optimized allocations. Each analysis layer explains whether insights come from correlation (graph), volatility (risk), or optimization (MPT).

How it works
User assets are processed against S&P 500 historical data. The backend computes daily returns and builds a correlation graph where assets are connected based on similarity. A graph engine detects clusters of highly related assets and calculates a concentration score. A risk engine computes volatility using standard deviation and estimates potential loss using Value at Risk. An optimization engine applies Modern Portfolio Theory to generate improved allocation weights based on expected return and Sharpe ratio. A recommendation layer combines outputs from all engines and produces actionable insights. An optional chatbot maps user queries to these engines and returns data-driven explanations.

Core Logic Flow


Load historical price dataset


Convert prices to daily returns


Compute correlation between assets


Build weighted graph (assets as nodes, correlation as edges)


Detect clusters using BFS


Calculate concentration and diversification


Compute volatility and portfolio risk


Apply MPT for optimal allocation


Aggregate insights into recommendations



Tech stack
LayerTechnologyFrontendReact, Tailwind CSS, RechartsBackendNode.js, ExpressDataS&P 500 CSV datasetStorageLocalStorage (abstraction-ready for DB)Graph LogicCorrelation + BFSRisk EngineStandard deviation, VaROptimizationMPT, Sharpe ratioAI LayerRule-based NLP or optional LLM API