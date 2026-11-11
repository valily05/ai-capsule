
const API_URL = import.meta.env.VITE_API_URL || "";

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    throw new Error(
      error.message || `Request failed: ${response.status}`
    );
  }

  if (response.status === 204) return null;

  return response.json();
}
