
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const capsuleRoutes = require("./routes/capsuleRoutes");
const { initializeDatabase } = require("./database/db");
const app = express();
const PORT = process.env.PORT || 5000;
const isVercel =
  process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV) || Boolean(process.env.VERCEL_URL);
const isProduction = process.env.NODE_ENV === "production" || isVercel;
const clientUrl = (process.env.CLIENT_URL || "").trim();

if (isProduction && !clientUrl) {
  throw new Error("CLIENT_URL is required in production. Set it to the public frontend origin.");
}

const databaseReady = initializeDatabase();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: clientUrl || "http://localhost:5174",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Vercel imports this Express app as a serverless function. Wait for the
// Neon/SQLite schema initialization before serving any route.
app.use((req, res, next) => {
  databaseReady.then(() => next()).catch(next);
});

// API routes
app.use("/auth", authRoutes);
app.use("/api/capsules", capsuleRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Vercel serves the frontend from the separate client project/CDN.
// Keep this static fallback for non-Vercel single-server deployments only.
if (isProduction && !isVercel) {
  const clientBuildPath = path.join(__dirname, "../client/dist");

  app.use(express.static(clientBuildPath));

  // Support React Router routes
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

app.use((error, req, res, next) => {
  console.error("Unhandled API error:", error.message);
  if (res.headersSent) return next(error);
  res.status(500).json({ message: "Internal server error." });
});

if (!isVercel) {
  databaseReady
    .then(() => {
      app.listen(PORT, () => {
        console.log(`AI Capsule backend running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("Database initialization failed:", error);
      process.exit(1);
    });
}

module.exports = app;
