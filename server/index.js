
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

app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// API routes
app.use("/auth", authRoutes);
app.use("/api/capsules", capsuleRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Serve the React frontend in production
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "../client/dist");

  app.use(express.static(clientBuildPath));

  // Support React Router routes
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`AI Capsule backend running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
    process.exit(1);
  });
