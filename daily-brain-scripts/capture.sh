#!/bin/bash
# Daily Brain raw capture — deterministic, unattended. Rebuilds today's raw transcript file.
# Called by: the SessionEnd hook (every Claude Code session contributes) + a daily launchd
# catch-all (so a day with no clean session-exit is still captured). Idempotent (rebuilds).
# The raw file lives in ~/Desktop/Khalid-OS/daily-brain-raw/ which ops-health backs up to
# cloud every 6h — no git here (avoids racing ops-health's Khalid-OS backup).
NODE="$HOME/.node-runtime/bin/node"; command -v node >/dev/null 2>&1 && NODE=node
"$NODE" "$HOME/.daily-brain/capture.js" "$@" >> "$HOME/.daily-brain/capture.log" 2>&1
exit 0
