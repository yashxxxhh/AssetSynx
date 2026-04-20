// server.js
// AssetSynx AI Backend
// Run: node server.js OR npm start

const express   = require("express");
const cors      = require("cors");
const path      = require("path");
const { loadCSV } = require("./services/dataLoader");
const apiRoutes = require("./routes/api");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use("/api", apiRoutes);

// Load CSV dataset first, then start server
const CSV_PATH = path.join(__dirname, "data", "sp500_sample.csv");

loadCSV(CSV_PATH)
  .then(() => {
    app.listen(PORT, () => {
      console.log("\n  AssetSynx AI Backend");
      console.log("  ─────────────────────────────────");
      console.log(`  Server:  http://localhost:${PORT}`);
      console.log(`  Health:  http://localhost:${PORT}/api/health`);
      console.log(`  Analyse: POST http://localhost:${PORT}/api/analyse`);
      console.log(`  Chat:    POST http://localhost:${PORT}/api/chat\n`);
    });
  })
  .catch(err => {
    console.error("Failed to load dataset:", err.message);
    process.exit(1);
  });
