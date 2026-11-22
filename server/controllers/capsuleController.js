
const { pool } = require("../database/db");

function trimRequiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function trimOptionalString(value) {
  if (typeof value !== "string") return null;
  return value.trim() || null;
}

function normalizeCapsuleInput(body) {
  const input = body && typeof body === "object" && !Array.isArray(body) ? body : {};

  return {
    project_name: trimRequiredString(input.project_name),
    prompt_title: trimRequiredString(input.prompt_title),
    prompt_text: trimRequiredString(input.prompt_text),
    prompt_version: trimOptionalString(input.prompt_version),
    response_summary: trimOptionalString(input.response_summary),
    category: trimOptionalString(input.category),
    usefulness: trimOptionalString(input.usefulness),
    reviewed: input.reviewed === true,
    improved: input.improved === true,
    screenshot_url: trimOptionalString(input.screenshot_url),
    notes: trimOptionalString(input.notes),
  };
}

// GET all capsules belonging to the logged-in user
async function getCapsules(req, res) {
  try {
    const result = await pool.query(
      `SELECT * FROM capsules
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get capsules error:", error);
    res.status(500).json({ message: "Failed to retrieve capsules." });
  }
}

// CREATE a new capsule
async function createCapsule(req, res) {
  try {
    const capsule = normalizeCapsuleInput(req.body);

    if (!capsule.project_name || !capsule.prompt_title || !capsule.prompt_text) {
      return res.status(400).json({
        message: "Project name, prompt title and prompt text are required.",
      });
    }

    const result = await pool.query(
      `INSERT INTO capsules (
        user_id, project_name, prompt_title, prompt_version,
        prompt_text, response_summary, category, usefulness,
        reviewed, improved, screenshot_url, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        req.user.userId,
        capsule.project_name,
        capsule.prompt_title,
        capsule.prompt_version,
        capsule.prompt_text,
        capsule.response_summary,
        capsule.category,
        capsule.usefulness,
        capsule.reviewed,
        capsule.improved,
        capsule.screenshot_url,
        capsule.notes,
      ]
    );

    res.status(201).json({ capsule: result.rows[0] });
  } catch (error) {
    console.error("Create capsule error:", error);
    res.status(500).json({ message: "Failed to create capsule." });
  }
}

// UPDATE an existing capsule
async function updateCapsule(req, res) {
  try {
    const { id } = req.params;
    const capsule = normalizeCapsuleInput(req.body);

    if (!capsule.project_name || !capsule.prompt_title || !capsule.prompt_text) {
      return res.status(400).json({
        message: "Project name, prompt title and prompt text are required.",
      });
    }

    const result = await pool.query(
      `UPDATE capsules SET
        project_name = $1,
        prompt_title = $2,
        prompt_version = $3,
        prompt_text = $4,
        response_summary = $5,
        category = $6,
        usefulness = $7,
        reviewed = $8,
        improved = $9,
        screenshot_url = $10,
        notes = $11
      WHERE id = $12 AND user_id = $13
      RETURNING *`,
      [
        capsule.project_name,
        capsule.prompt_title,
        capsule.prompt_version,
        capsule.prompt_text,
        capsule.response_summary,
        capsule.category,
        capsule.usefulness,
        capsule.reviewed,
        capsule.improved,
        capsule.screenshot_url,
        capsule.notes,
        id,
        req.user.userId,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Capsule not found." });
    }

    res.status(200).json({ capsule: result.rows[0] });
  } catch (error) {
    console.error("Update capsule error:", error);
    res.status(500).json({ message: "Failed to update capsule." });
  }
}

// DELETE an existing capsule
async function deleteCapsule(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM capsules
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Capsule not found." });
    }

    res.status(200).json({ message: "Capsule deleted successfully." });
  } catch (error) {
    console.error("Delete capsule error:", error);
    res.status(500).json({ message: "Failed to delete capsule." });
  }
}

module.exports = {
  getCapsules,
  createCapsule,
  updateCapsule,
  deleteCapsule,
};
