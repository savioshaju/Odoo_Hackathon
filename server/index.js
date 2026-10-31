// index.js — the main entry point of our server
// This starts the Express server and connects all routes

const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// ── Middleware ─────────────────────────────────
// cors  → allows the React frontend to talk to this server
// json  → lets us read JSON data from request bodies
app.use(cors());
app.use(express.json());

// ── Routes (Kishan's modules) ──────────────────
const productsRouter = require('./routes/products');
app.use('/api/products', productsRouter);

// ── Health check ───────────────────────────────
// Visit http://localhost:5000/health to confirm server is running
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LoopLedger server is running 🚀' });
});

// ── Start the server ───────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
