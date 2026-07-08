#!/usr/bin/env node
// Daily Brain — RAW capture (deterministic, unattended).
// Reads every Claude Code session transcript for TODAY (Asia/Riyadh) and distills the
// real conversation — Khalid's messages + Claude's text replies — stripped of tool noise,
// system-reminders, and sidechains. Writes ONE dated raw file. Idempotent: rebuilds today's
// file from scratch each run (so session-end + the launchd catch-all never duplicate).
// This is the black-box recorder; the LLM digest (daily-brain skill) turns it into the brain.
const fs = require("fs");
const path = require("path");

const PROJDIR = path.join(process.env.HOME, ".claude/projects/-Users-khalidalanazi-Desktop");
const OUTDIR  = path.join(process.env.HOME, "Desktop/Khalid-OS/daily-brain-raw");

// today's date in Riyadh (the day we're capturing)
function riyadhYMD(d) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" });
  return f.format(d); // en-CA => YYYY-MM-DD
}
function riyadhTime(d) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Riyadh", hour: "numeric", minute: "2-digit", hour12: true }).format(d);
}
const TARGET = process.argv[2] || riyadhYMD(new Date()); // allow backfill: node capture.js 2026-07-07

function clean(text) {
  if (!text) return "";
  return String(text)
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "")
    .replace(/<local-command-[^>]*>[\s\S]*?<\/local-command-[^>]*>/g, "")
    .replace(/<command-[^>]*>[\s\S]*?<\/command-[^>]*>/g, "")
    .replace(/<ide_selection>[\s\S]*?<\/ide_selection>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
function textOf(msg) {
  if (!msg) return "";
  const c = msg.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.filter(p => p && p.type === "text").map(p => p.text).join("\n");
  return "";
}

const events = []; // {ts, role, text, session}
let files = [];
try { files = fs.readdirSync(PROJDIR).filter(f => f.endsWith(".jsonl")); } catch (e) { process.exit(0); }

for (const file of files) {
  const sid = file.replace(".jsonl", "").slice(0, 8);
  let lines;
  try { lines = fs.readFileSync(path.join(PROJDIR, file), "utf8").split("\n").filter(Boolean); } catch (e) { continue; }
  for (const ln of lines) {
    let o; try { o = JSON.parse(ln); } catch (e) { continue; }
    if (o.type !== "user" && o.type !== "assistant") continue;
    if (o.isSidechain) continue;                       // skip subagent chatter
    if (!o.timestamp) continue;
    if (riyadhYMD(new Date(o.timestamp)) !== TARGET) continue;  // only today (Riyadh)
    let text = clean(textOf(o.message));
    if (!text) continue;                               // tool_result / tool_use-only turns => nothing to keep
    if (o.type === "user" && /^Caveat: The messages below/.test(text)) continue;
    if (text.length > 4000) text = text.slice(0, 4000) + " …[truncated]";
    events.push({ ts: o.timestamp, role: o.type, text, session: sid });
  }
}

events.sort((a, b) => new Date(a.ts) - new Date(b.ts));

let body = `# Daily Brain — RAW capture · ${TARGET}\n\n` +
  `_Auto-captured from ${files.length} Claude Code transcript(s). ${events.length} message(s). Rebuilt ${riyadhTime(new Date())} Riyadh._\n\n`;
if (!events.length) {
  body += "_(no Claude Code conversation captured for this day)_\n";
} else {
  let lastSession = null;
  for (const e of events) {
    if (e.session !== lastSession) { body += `\n---\n**session ${e.session}**\n\n`; lastSession = e.session; }
    const who = e.role === "user" ? "🧑 Khalid" : "🤖 Claude";
    body += `**${who}** · ${riyadhTime(new Date(e.ts))}\n${e.text}\n\n`;
  }
}

try { fs.mkdirSync(OUTDIR, { recursive: true }); } catch (e) {}
const out = path.join(OUTDIR, `${TARGET}.md`);
fs.writeFileSync(out, body);
process.stdout.write(`daily-brain raw: ${events.length} msgs from ${files.length} files -> ${out}\n`);
