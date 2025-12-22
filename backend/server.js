// backend/server.js (MINIMO para diagnosticar)
const express = require("express");

const app = express();

app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, source: "backend/server.js" });
});

module.exports = (req, res) => app(req, res);
