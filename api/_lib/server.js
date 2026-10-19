// Shared setup for the Vercel serverless functions in /api.
// Files under api/_lib are helpers, not routes (Vercel skips "_" paths).
//
// Environment variables (Vercel -> Project -> Settings -> Environment Variables):
//   GMAIL_USER                 the AgroRent Gmail address (same one Supabase sends from)
//   GMAIL_APP_PASSWORD         a Google "App password" for that account
//   SUPABASE_SERVICE_ROLE_KEY  Supabase -> Project Settings -> API -> service_role (secret!)
//   SUPPORT_INBOX              optional; where help requests go (defaults to GMAIL_USER)
//   APP_URL                    optional; site address used in email links
// SUPABASE_URL is read from VITE_SUPABASE_URL if not set separately.

import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

let admin;
export function getAdmin() {
  if (!admin) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase server credentials are not configured.");
    admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return admin;
}

// The signed-in user making the request, from the "Authorization: Bearer <token>"
// header the app sends, or null if there is none / it is invalid.
export async function getUserFromRequest(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const { data, error } = await getAdmin().auth.getUser(token);
  if (error) return null;
  return data.user;
}

let transport;
export async function sendMail({ to, subject, text, html, replyTo }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("Email is not configured.");
  if (!transport) {
    transport = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  }
  await transport.sendMail({ from: `"AgroRent" <${user}>`, to, subject, text, html, replyTo });
}

export function appUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  return `https://${req.headers.host}`;
}

// Very small per-instance limiter. Serverless instances come and go, so this
// only slows down a burst from one address; it is not a hard guarantee.
const hits = new Map();
export function tooManyRequests(key, limit, windowMs) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > limit;
}

export function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
}
