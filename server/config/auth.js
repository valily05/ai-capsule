
const axios = require("axios");

async function exchangeCodeForToken(code) {
  const response = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    },
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.data.access_token) {
    throw new Error("GitHub OAuth token exchange failed");
  }

  return response.data.access_token;
}

async function getGitHubUser(accessToken) {
  const response = await axios.get(
    "https://api.github.com/user",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  return response.data;
}

module.exports = {
  exchangeCodeForToken,
  getGitHubUser,
};
