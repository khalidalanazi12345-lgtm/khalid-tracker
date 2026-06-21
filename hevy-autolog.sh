#!/bin/bash
# Hevy → Tracker auto-log. Reads today's finished Hevy workouts and logs each to the
# Production Tracker (Sheet + Calendar) via the Apps Script endpoint. Idempotent: the sid
# is derived from the Hevy workout id, so re-runs UPDATE the same row (never duplicate).
# A DISCARDED Hevy workout is never saved in Hevy → never seen here → never logged. ✓
set -e
KEY=$(grep -m1 HEVY_API_KEY "$HOME/.hevy_key" 2>/dev/null | cut -d= -f2)
[ -z "$KEY" ] && { echo "no hevy key"; exit 0; }
ENDPOINT="https://script.google.com/macros/s/AKfycbxfqJIjFZaBLJE4jjV6jJXELsLfvxFYq96l_V4ffCa3woLiBNYnb6qd0GxBu8b9FxjF/exec"
NODE="$HOME/.node-runtime/bin/node"; command -v node >/dev/null 2>&1 && NODE=node

# fetch last 3 workouts (flaky endpoint → retry)
RAW=""
for i in 1 2 3 4; do
  RAW=$(curl -s -H "api-key: $KEY" "https://api.hevyapp.com/v1/workouts?page=1&pageSize=3" --max-time 25)
  [ "$(printf '%s' "$RAW" | wc -c)" -gt 100 ] && break
  sleep 3
done
[ -z "$RAW" ] && { echo "no hevy data"; exit 0; }

# build one POST payload per workout that STARTED today (Asia/Riyadh), print as TSV: sid<TAB>json
printf '%s' "$RAW" | "$NODE" -e '
const fs=require("fs");
let d; try{ d=JSON.parse(fs.readFileSync(0,"utf8")); }catch(e){ process.exit(0); }
const RIYADH="Asia/Riyadh";
function parts(iso){ const dt=new Date(iso); const f=new Intl.DateTimeFormat("en-US",{timeZone:RIYADH,year:"numeric",month:"2-digit",day:"2-digit",hour:"numeric",minute:"2-digit",hour12:true}); const o={}; for(const p of f.formatToParts(dt)) o[p.type]=p.value; return {ymd:`${o.year}-${o.month}-${o.day}`, t12:`${o.hour}:${o.minute} ${o.dayPeriod}`}; }
const todayF=new Intl.DateTimeFormat("en-US",{timeZone:RIYADH,year:"numeric",month:"2-digit",day:"2-digit"});
const to={}; for(const p of todayF.formatToPartsTo? []:todayF.formatToParts(new Date())) to[p.type]=p.value;
const today=`${to.year}-${to.month}-${to.day}`;
for(const w of (d.workouts||[])){
  if(!w.start_time||!w.end_time) continue;
  const s=parts(w.start_time), e=parts(w.end_time);
  if(s.ymd!==today) continue;                        // only today
  const mins=Math.max(0,Math.round((new Date(w.end_time)-new Date(w.start_time))/60000));
  const sid="hv"+String(w.id).replace(/[^a-z0-9]/gi,"").slice(0,18);
  const task="Workout — "+(w.title||"Workout");
  const payload={type:"session",task,title:task,owner:"Me",kind:"main",colorId:"10",sid,
    start_time:s.t12,end_time:e.t12,startISO:w.start_time,endISO:w.end_time,
    duration_min:mins,checked:1,total:1,output:"auto-logged from Hevy"};
  process.stdout.write(sid+"\t"+JSON.stringify(payload)+"\n");
}
' | while IFS=$'\t' read -r SID JSON; do
  [ -z "$JSON" ] && continue
  curl -s -X POST "$ENDPOINT" -H "Content-Type: application/json" --data "$JSON" --max-time 25 >/dev/null \
    && echo "logged $SID" || echo "post failed $SID"
done
echo "hevy-autolog done $(date)"
