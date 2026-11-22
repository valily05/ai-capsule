
const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const { ensureDatabaseReady } = require("../database/db");

const {
  getCapsules,
  createCapsule,
  updateCapsule,
  deleteCapsule,
} = require("../controllers/capsuleController");

// All capsule routes require JWT authentication
router.use(authenticateToken);

// Wait for schema readiness only after authentication. This preserves 401
// responses during Neon outages while valid sessions receive real DB errors.
router.use(async (req, res, next) => {
  try {
    await ensureDatabaseReady();
    next();
  } catch (error) {
    next(error);
  }
});

router.get("/", getCapsules);
router.post("/", createCapsule);
router.put("/:id", updateCapsule);
router.delete("/:id", deleteCapsule);

module.exports = router;
