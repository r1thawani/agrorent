// Base API client. There's no backend yet, so every other service in this
// folder currently reads from ../data/mockData instead of calling `request()`
// below. This file exists so that switch is a one-line change per service
// (swap the mock read for `request(...)`) rather than a rewrite — every
// service already returns Promises shaped like what this would return.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `Request to ${path} failed with status ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

// Small helper the mock services use to feel like real network calls
// (so loading states in the UI have something to show during a demo).
export function mockDelay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};
