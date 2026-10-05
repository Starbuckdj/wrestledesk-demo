import { buildState } from "./data.js";

const KEY = "wrestledesk-demo-v1";

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return buildState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.accounts)) return buildState();
    return parsed;
  } catch {
    return buildState();
  }
}

export function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(KEY);
  return buildState();
}
