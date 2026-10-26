// Looks up @air.hq on the Instagram Graph API (Business Discovery) and adds today's
// count to site/data.json. Runs once a day from .github/workflows/update.yml.
// No dependencies: Node 18+ has fetch built in.

import { readFile, writeFile } from "node:fs/promises";

const DATA = new URL("../site/data.json", import.meta.url);
const API = "https://graph.facebook.com/v26.0";
const { IG_USER_ID, IG_ACCESS_TOKEN, TARGET = "air.hq" } = process.env;

if (!IG_USER_ID || !IG_ACCESS_TOKEN) {
  console.log("::warning::IG_USER_ID or IG_ACCESS_TOKEN is not set. Add both as repository secrets. Skipping today's update.");
  process.exit(0);
}

async function lookup(fields) {
  const url = `${API}/${IG_USER_ID}?fields=business_discovery.username(${TARGET}){${fields.join(",")}}`
    + `&access_token=${encodeURIComponent(IG_ACCESS_TOKEN)}`;
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const err = new Error(body.error?.message || `Instagram API returned HTTP ${res.status}`);
    err.code = body.error?.code;
    throw err;
  }
  return body.business_discovery;
}

let profile;
try {
  profile = await lookup(["followers_count", "media_count", "follows_count"]);
} catch (err) {
  if (err.code !== 100) throw err; // 100 = a field isn't available; retry with the documented ones
  profile = await lookup(["followers_count", "media_count"]);
}
if (!profile || !Number.isFinite(profile.followers_count)) {
  throw new Error("The API answered, but without a follower count.");
}

const data = JSON.parse(await readFile(DATA, "utf8"));
const now = new Date();
const nyDay = d => new Date(d).toLocaleDateString("en-CA", { timeZone: "America/New_York" });

const entry = {
  date: now.toISOString(),
  followers: profile.followers_count,
  posts: profile.media_count,
  ...(Number.isFinite(profile.follows_count) && { following: profile.follows_count }),
  source: "api",
};

// One row per day: a second run on the same New York day replaces that day's row.
const last = data.counts.at(-1);
if (last && last.source === "api" && nyDay(last.date) === nyDay(entry.date)) {
  data.counts[data.counts.length - 1] = entry;
} else {
  data.counts.push(entry);
}
data.updated = now.toISOString();

await writeFile(DATA, JSON.stringify(data, null, 2) + "\n");
console.log(`@${TARGET}: ${entry.followers.toLocaleString("en-US")} followers, ${entry.posts} posts`);
