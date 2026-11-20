
const express = require("express");
const jwt = require("jsonwebtoken");
const {
  exchangeCodeForToken,
  getGitHubUser,
} = require("../config/auth");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// The dashboard uses this route to restore the signed-in user's session.
router.get("/me", authenticateToken, (req, res) => {
  res.status(200).json({
    user: {
      id: req.user.userId,
      username: req.user.username,
    },
  });
});

// Start GitHub OAuth
router.get("/github", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: "read:user",
    state: require("crypto").randomBytes(32).toString("hex"),
  });

  // Store state for callback verification
  const state = params.get("state");
  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 5 * 60 * 1000,
  });

  res.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
});

// GitHub OAuth callback
router.get("/github/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (req.query.error) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_cancelled`);
    }

    if (
      !code ||
      !state ||
      !req.cookies.oauth_state ||
      state !== req.cookies.oauth_state
    ) {
      return res.status(400).send("Invalid OAuth state.");
    }

    res.clearCookie("oauth_state");

    const accessToken = await exchangeCodeForToken(code);
    const githubUser = await getGitHubUser(accessToken);

    const token = jwt.sign(
      {
        userId: String(githubUser.id),
        username: githubUser.login,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.redirect(
      `${process.env.CLIENT_URL}/dashboard`
    );
  } catch (error) {
    console.error("GitHub OAuth error:", error.message);
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  res.status(200).json({ message: "Logged out successfully." });
});

module.exports = router;
