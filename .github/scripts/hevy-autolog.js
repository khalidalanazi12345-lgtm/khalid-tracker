// Cloud Hevy → Tracker auto-log. Runs on GitHub Actions (Mac-independent).
// Fetches recent Hevy workouts, and for any that STARTED today (Asia/Riyadh) and are
// finished, POSTs a session to the Apps Script endpoint (Sheet + Calendar). Idempotent:
// sid is derived from the Hevy workout id, so re-runs UPDATE the same row, never duplicate.
const KEY = process.env.HEVY_API_KEY;
const ENDPOINT = process.env.ENDPOINT;
if (!KEY || !ENDPOINT) { console.error('missing HEVY_API_KEY or ENDPOINT'); process.exit(0); }
const TZ = 'Asia/Riyadh';
function parts(iso) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true });
  const o = {}; for (const p of f.formatToParts(new Date(iso))) o[p.type] = p.value;
  return { ymd: `${o.year}-${o.month}-${o.day}`, t12: `${o.hour}:${o.minute} ${o.dayPeriod}` };
}
(async () => {
  let data;
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch('https://api.hevyapp.com/v1/workouts?page=1&pageSize=5', { headers: { 'api-key': KEY } });
      data = await r.json(); if (data && data.workouts) break;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 3000));
  }
  if (!data || !data.workouts) { console.log('no hevy data'); return; }
  const today = parts(new Date().toISOString()).ymd;
  let n = 0;
  for (const w of data.workouts) {
    if (!w.start_time || !w.end_time) continue;
    const s = parts(w.start_time), e = parts(w.end_time);
    if (s.ymd !== today) continue;
    const mins = Math.max(0, Math.round((new Date(w.end_time) - new Date(w.start_time)) / 60000));
    const sid = 'hv' + String(w.id).replace(/[^a-z0-9]/gi, '').slice(0, 18);
    const task = 'Workout — ' + (w.title || 'Workout');
    const payload = { type: 'session', task, title: task, owner: 'Me', kind: 'main', colorId: '10', sid,
      start_time: s.t12, end_time: e.t12, startISO: w.start_time, endISO: w.end_time,
      duration_min: mins, checked: 1, total: 1, output: 'auto-logged from Hevy (cloud)' };
    try { await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) }); console.log('logged', sid, task); n++; }
    catch (e) { console.log('post failed', sid, e.message); }
  }
  console.log('done — logged', n, 'workout(s) for', today);
})();
