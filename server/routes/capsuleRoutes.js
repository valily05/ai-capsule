
const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");

const {
  getCapsules,
  createCapsule,
  updateCapsule,
  deleteCapsule,
} = require("../controllers/capsuleController");

// All capsule routes require JWT authentication
router.use(authenticateToken);

router.get("/", getCapsules);
router.post("/", createCapsule);
router.put("/:id", updateCapsule);
router.delete("/:id", deleteCapsule);

module.exports = router;
