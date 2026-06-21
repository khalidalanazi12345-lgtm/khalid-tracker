/***********************************************************************
 * KHALID OS — Apps Script additions  (paste into script.google.com)
 * Makes the tracker fully ZAPIER-FREE: sheet cleanup + note + check-in
 * all run inside Google with full SpreadsheetApp access.
 *
 * HOW TO USE
 * ──────────
 * PART 1 (cleanup — do this NOW, no redeploy needed):
 *   1. Open the tracker's Apps Script project (script.google.com → the
 *      project bound to "Production Tracker Log").
 *   2. Paste the cleanupLog() function below anywhere in Code.gs.
 *   3. Select "cleanupLog" in the function dropdown → click ▶ Run.
 *      (Authorize if asked.) It logs how many rows it removed.
 *   → Re-runnable anytime; it only ever touches the session-log tab.
 *
 * PART 2 (kill Zapier for note + check-in — paste + REDEPLOY once):
 *   1. Paste handleBrainInbox_ and handleCheckin_ below.
 *   2. In your EXISTING doPost(e), add these TWO lines right after the
 *      line that parses the body (var data = JSON.parse(e.postData.contents);):
 *          if (data.type === 'braininbox') return handleBrainInbox_(data);
 *          if (data.type === 'checkin')    return handleCheckin_(data);
 *   3. Deploy → Manage deployments → ✏️ → New version → Deploy
 *      (keeps the same /exec URL).
 *   → After that, the `note` and `check-in` skills post straight here.
 ***********************************************************************/


/* ─────────────────────────  PART 1  ───────────────────────── */
function cleanupLog() {
  var ss = SpreadsheetApp.openById('1SwfKLtOKYIzCeYjRy2pVzs31L3JrYYacjiSUqp_Cstw');

  // Find the session-log tab by its header (A1="date", B1="task") so we
  // NEVER touch Brain Inbox / Notes / AppState / Weekly tabs.
  var sheet = null, tabs = ss.getSheets();
  for (var t = 0; t < tabs.length; t++) {
    var h = tabs[t].getRange(1, 1, 1, 2).getValues()[0];
    if (String(h[0]).toLowerCase() === 'date' && String(h[1]).toLowerCase() === 'task') { sheet = tabs[t]; break; }
  }
  if (!sheet) throw new Error('Session-log tab not found (no header date|task).');

  var last = sheet.getLastRow();
  if (last < 2) { Logger.log('Nothing to clean.'); return; }

  var rows = sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).getValues();
  var seenSid = {}, junk = [];     // junk = 1-based sheet row numbers

  for (var i = 0; i < rows.length; i++) {
    var rowNum = i + 2;
    var date = String(rows[i][0]).trim();     // col A
    var task = String(rows[i][1]).trim();     // col B
    var sid  = String(rows[i][11] || '').trim(); // col L (12) = sid

    var isTest  = /^test/i.test(task);
    var isBlank = (date === '' && task === '');
    var isDupSid = (sid !== '' && seenSid[sid]);

    if (isTest || isBlank || isDupSid) { junk.push(rowNum); }
    else if (sid !== '') { seenSid[sid] = true; }
  }

  // delete bottom-up so row numbers don't shift
  junk.sort(function (a, b) { return b - a; });
  for (var j = 0; j < junk.length; j++) sheet.deleteRow(junk[j]);

  Logger.log('cleanupLog: removed ' + junk.length + ' rows (TEST / blank / duplicate-sid).');
  return 'removed ' + junk.length + ' rows';
}


/* ─────────────────────────  PART 2  ───────────────────────── */
function handleBrainInbox_(data) {
  var ss = SpreadsheetApp.openById('1SwfKLtOKYIzCeYjRy2pVzs31L3JrYYacjiSUqp_Cstw');
  var sh = ss.getSheetByName('Brain Inbox');
  if (!sh) { sh = ss.insertSheet('Brain Inbox'); sh.appendRow(['Timestamp', 'Source', 'Text', 'Status']); }
  sh.appendRow([new Date(), data.source || 'note', data.text || '', 'open']);
  return ContentService.createTextOutput(JSON.stringify({ ok: true, wrote: 'braininbox' }))
                       .setMimeType(ContentService.MimeType.JSON);
}

function handleCheckin_(data) {
  var ss = SpreadsheetApp.openById('1SwfKLtOKYIzCeYjRy2pVzs31L3JrYYacjiSUqp_Cstw');
  var sh = ss.getSheetByName('Business Check-Ins');
  if (!sh) {
    sh = ss.insertSheet('Business Check-Ins');
    sh.appendRow(['Date', 'Content Score', 'Training Done', 'Recovery Score',
                  'Discipline Score', 'Wins', 'Needs Attention', "Tomorrow's Focus", 'Notes']);
  }
  sh.appendRow([data.date || '', data.content || '', data.training || '', data.recovery || '',
                data.discipline || '', data.wins || '', data.needs || '', data.focus || '', data.notes || '']);

  // increment the check-in counter on the Meta tab
  var meta = ss.getSheetByName('Meta');
  if (!meta) { meta = ss.insertSheet('Meta'); meta.appendRow(['checkin_count', 0]); }
  var mv = meta.getRange(1, 1, meta.getLastRow() || 1, 2).getValues();
  var found = false, count = 0;
  for (var r = 0; r < mv.length; r++) {
    if (String(mv[r][0]) === 'checkin_count') { count = Number(mv[r][1] || 0) + 1; meta.getRange(r + 1, 2).setValue(count); found = true; break; }
  }
  if (!found) { meta.appendRow(['checkin_count', 1]); count = 1; }

  return ContentService.createTextOutput(JSON.stringify({ ok: true, wrote: 'checkin', count: count }))
                       .setMimeType(ContentService.MimeType.JSON);
}
