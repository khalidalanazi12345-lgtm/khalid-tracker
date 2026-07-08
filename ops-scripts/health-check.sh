#!/bin/bash
# Ops health-check + self-heal for Khalid's live automations.
# Tests the systems that silently break, auto-heals what's safe, logs status, desktop-notifies on failure.
# Lives OUTSIDE ~/Desktop on purpose (macOS TCC blocks launchd from Desktop/Documents/Downloads).
DIR="$HOME/.ops-health"; LOG="$DIR/health.log"; STATUS="$DIR/status.json"
mkdir -p "$DIR"
ts(){ date "+%Y-%m-%d %H:%M:%S"; }
note(){ echo "$(ts) | $1" >> "$LOG"; }
FAILS=(); HEALS=()
note "── run start ──"

# 1) Hevy API reachable + key valid
KEY=$(grep -m1 HEVY_API_KEY "$HOME/.hevy_key" 2>/dev/null | cut -d= -f2)
if [ -z "$KEY" ]; then FAILS+=("hevy key missing"); else
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "api-key: $KEY" "https://api.hevyapp.com/v1/workouts/count" --max-time 20)
  if [ "$CODE" = "200" ]; then note "OK hevy API"; else FAILS+=("hevy API HTTP $CODE"); fi
fi

# 2) Apps Script tracker endpoint returns ok
ENDPOINT="https://script.google.com/macros/s/AKfycbxfqJIjFZaBLJE4jjV6jJXELsLfvxFYq96l_V4ffCa3woLiBNYnb6qd0GxBu8b9FxjF/exec"
if curl -s -L "$ENDPOINT?action=recent&days=1&callback=cb&t=$(date +%s)" --max-time 25 | grep -q '"ok":true'; then
  note "OK tracker endpoint"; else FAILS+=("tracker endpoint not ok"); fi

# 3) Mac Hevy launchd job loaded — SELF-HEAL if dead
if launchctl list 2>/dev/null | grep -q com.khalid.hevy-autolog; then note "OK hevy launchd loaded"; else
  if launchctl load "$HOME/Library/LaunchAgents/com.khalid.hevy-autolog.plist" 2>/dev/null; then
    HEALS+=("reloaded dead hevy launchd job"); note "HEALED reloaded hevy launchd"
  else FAILS+=("hevy launchd dead, reload failed"); fi
fi

# 3b) HEVY OUTCOME GUARANTEE (added 2026-07-08). "Job loaded" != "workout logged" — the old check passed
#     GREEN while a real workout silently went unlogged (today-only filter + laptop sleep past midnight).
#     The pattern for EVERY system: don't trust "running", ENSURE the result. Run the idempotent autolog
#     here each pass (sid = workout id → upsert, never duplicates) so the outcome is guaranteed, not assumed.
HVOUT=$(bash "$HOME/.hevy-autolog/hevy-autolog.sh" 2>>"$LOG")
NLOG=$(printf '%s' "$HVOUT" | grep -c '^logged ')
if [ "$NLOG" -gt 0 ]; then HEALS+=("hevy: caught+logged $NLOG workout(s) the 30-min job had missed"); note "HEALED hevy outcome ($NLOG logged)"; else note "OK hevy outcome (tracker current)"; fi

# 3c) Daily Brain capture job loaded — SELF-HEAL if dead (the raw-capture layer feeds the shared brain)
if launchctl list 2>/dev/null | grep -q com.khalid.daily-brain; then note "OK daily-brain launchd loaded"; else
  if launchctl load "$HOME/Library/LaunchAgents/com.khalid.daily-brain.plist" 2>/dev/null; then
    HEALS+=("reloaded dead daily-brain launchd job"); note "HEALED reloaded daily-brain launchd"
  else FAILS+=("daily-brain launchd dead, reload failed"); fi
fi

# 4) Cloud GitHub Action last run succeeded (best-effort: skip silently if gh/keyring unavailable)
GH="$HOME/.local/bin/gh"; command -v gh >/dev/null 2>&1 && GH=gh
CONC=$("$GH" run list --workflow=hevy-sync.yml -R khalidalanazi12345-lgtm/khalid-tracker -L 1 --json conclusion --jq '.[0].conclusion' 2>/dev/null)
if [ -n "$CONC" ]; then
  if [ "$CONC" = "success" ]; then note "OK cloud action"; else FAILS+=("cloud action last run: $CONC"); fi
else note "skip cloud-action check (gh unavailable here)"; fi

# 5) AUTO-BACKUP local repos to cloud (Khalid 2026-06-25: EVERYTHING must be backed up to GitHub).
#    Self-heal, don't just surface: commit any uncommitted work + push any unpushed commits.
#    (skills repo is handled by brain-sync — don't double-commit it here.)
backup_repo(){
  local R="$1" NAME="$2" DIRTY AHEAD
  [ -d "$R/.git" ] || { FAILS+=("$NAME git repo missing"); return; }
  DIRTY=$(git -C "$R" status --porcelain 2>/dev/null)
  if [ -n "$DIRTY" ]; then
    git -C "$R" add -A 2>/dev/null
    git -C "$R" commit -q -m "auto-backup $(ts) (ops-health)" 2>/dev/null && HEALS+=("$NAME auto-committed work")
  fi
  AHEAD=$(git -C "$R" log --oneline @{u}.. 2>/dev/null)
  if [ -n "$AHEAD" ]; then
    if git -C "$R" push -q origin HEAD 2>/dev/null; then HEALS+=("$NAME pushed to cloud")
    else FAILS+=("$NAME push to cloud FAILED (still unbacked-up)"); fi
  fi
  [ -z "$DIRTY" ] && [ -z "$AHEAD" ] && note "OK $NAME git clean+pushed"
}
backup_repo "$HOME/nano-veo-engine" "nano-veo-engine"
backup_repo "$HOME/Desktop/Khalid-OS" "Khalid-OS"
backup_repo "$HOME/loom-engine" "loom-engine"

# 6) brain-sync staleness — failure marker present, or sync log stale (>24h = sync may be dead)
BSDIR="$HOME/Desktop/skills"
if [ -f "$BSDIR/.brain-sync-status" ]; then FAILS+=("brain-sync failure marker present (.brain-sync-status)"); fi
if [ -f "$BSDIR/.brain-sync.log" ]; then
  if [ -n "$(find "$BSDIR/.brain-sync.log" -mtime +1 2>/dev/null)" ]; then
    FAILS+=("brain-sync log stale (>24h — sync may be dead)")
  else note "OK brain-sync log fresh"; fi
else FAILS+=("brain-sync log missing (.brain-sync.log)"); fi

# 7) node-runtime presence — engine + selfcheck depend on it
NODEBIN="$HOME/.node-runtime/bin/node"
if [ -x "$NODEBIN" ]; then note "OK node-runtime present+executable"; else FAILS+=("node-runtime missing or not executable ($NODEBIN)"); fi

# verdict
if [ ${#FAILS[@]} -eq 0 ]; then
  printf '{"ts":"%s","status":"green","fails":[],"heals":[%s]}\n' "$(ts)" "$(printf '"%s",' "${HEALS[@]}" | sed 's/,$//')" > "$STATUS"
  note "ALL GREEN${HEALS:+ (healed: ${HEALS[*]})}"
else
  printf '{"ts":"%s","status":"red","fails":[%s],"heals":[%s]}\n' "$(ts)" "$(printf '"%s",' "${FAILS[@]}" | sed 's/,$//')" "$(printf '"%s",' "${HEALS[@]}" | sed 's/,$//')" > "$STATUS"
  note "RED — fails: ${FAILS[*]}${HEALS:+ | healed: ${HEALS[*]}}"
  osascript -e "display notification \"${FAILS[*]}\" with title \"Ops health-check: ${#FAILS[@]} issue(s)\"" 2>/dev/null
  # surface real problems in Khalid's own system (Brain Inbox → recap/app), so he SEES it without a nudge
  curl -s -o /dev/null -X POST "$ENDPOINT" -H "Content-Type: application/json" \
    --data "{\"type\":\"braininbox\",\"source\":\"ops-health\",\"text\":\"⚠️ ops-health: ${FAILS[*]}${HEALS:+ (auto-fixed: ${HEALS[*]})}\"}" --max-time 20 2>/dev/null
fi
note "── run end ──"
