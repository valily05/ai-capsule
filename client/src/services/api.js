
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");

if (import.meta.env.PROD && !apiBaseUrl) {
  throw new Error("Set VITE_API_BASE_URL to the Vercel API origin before deploying the frontend.");
}

export function apiUrl(endpoint) {
  return `${apiBaseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
}

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(apiUrl(endpoint), {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const requestError = new Error(
      error.message || `Request failed: ${response.status}`
    );
    requestError.status = response.status;
    throw requestError;
  }

  if (response.status === 204) return null;

  return response.json();
}
