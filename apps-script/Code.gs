// ═══════════════════════════════════════════════════════════════════════════
// DnyanPeth Study Library — Google Apps Script REST API
// Deploy as a Web App (Execute as: Me, Access: Anyone)
//
// Sheet: "Student"
// Exact columns (row 1 headers):
//   id | username | email | mobile | aadhar_number | monthly_fee |
//   subscription_start | subscription_end | current_month_paid |
//   month | year | amount | status
//
// One row = one student for one month.
// A student with 3 months of history has 3 rows (same id, different month/year).
//
// Endpoints (action via query param, all other params also in query string):
//   GET  ?action=getAll                         → all rows as JSON array
//   GET  ?action=search&col=COL&val=VAL         → rows where COL === VAL
//   GET  ?action=searchMulti&id=X&month=Y&year=Z→ rows matching all 3 conditions
//   POST ?action=insert           body: { row: {...} }
//   POST ?action=update           body: { col, val, updates: {...} }
//   POST ?action=updateMulti      body: { id, month, year, updates: {...} }
//   POST ?action=delete           body: { col, val }
//   POST ?action=deleteMulti      body: { id }   (deletes ALL rows for that id)
// ═══════════════════════════════════════════════════════════════════════════

var SHEET_NAME = 'Student';

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Entry Points ────────────────────────────────────────────────────────────
function doGet(e)  { return route(e, {}); }
function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch(err) { body = {}; }
  return route(e, body);
}

function route(e, body) {
  var p      = e.parameter || {};
  var action = p.action;
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var sheet  = ss.getSheetByName(SHEET_NAME);

  try {
    if      (action === 'getAll')       return respond(getAllRows(sheet));
    else if (action === 'search')       return respond(searchRows(sheet, p.col, p.val));
    else if (action === 'searchMulti')  return respond(searchMultiRows(sheet, p.id, p.month, p.year));
    else if (action === 'insert')       return respond(insertRow(sheet, body.row || {}));
    else if (action === 'update')       return respond(updateRows(sheet, body.col, body.val, body.updates || {}));
    else if (action === 'updateMulti')  return respond(updateMultiRows(sheet, body.id, body.month, body.year, body.updates || {}));
    else if (action === 'delete')       return respond(deleteRows(sheet, body.col, body.val));
    else if (action === 'deleteMulti')  return respond(deleteByStudentId(sheet, body.id));
    else return respond({ success: false, error: 'Unknown action: ' + action });
  } catch(err) {
    return respond({ success: false, error: err.message });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getHeaders(sheet) {
  var row = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return row.map(function(h) { return String(h).trim(); });
}

function rowToObj(headers, row) {
  var obj = {};
  headers.forEach(function(h, i) {
    obj[h] = (row[i] === undefined || row[i] === null) ? '' : String(row[i]);
  });
  return obj;
}

function getAllRows(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, data: [] };
  var headers = getHeaders(sheet);
  var values  = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return { success: true, data: values.map(function(r) { return rowToObj(headers, r); }) };
}

// Search where one column matches a value (case-insensitive)
function searchRows(sheet, col, val) {
  var all = getAllRows(sheet);
  if (!all.success) return all;
  var data = all.data.filter(function(r) {
    return String(r[col] || '').toLowerCase() === String(val || '').toLowerCase();
  });
  return { success: true, data: data };
}

// Search where id AND month AND year all match
function searchMultiRows(sheet, id, month, year) {
  var all = getAllRows(sheet);
  if (!all.success) return all;
  var data = all.data.filter(function(r) {
    return String(r.id)    === String(id) &&
           String(r.month) === String(month) &&
           String(r.year)  === String(year);
  });
  return { success: true, data: data };
}

function insertRow(sheet, rowObj) {
  var headers = getHeaders(sheet);
  var newRow  = headers.map(function(h) { return rowObj[h] !== undefined ? rowObj[h] : ''; });
  sheet.appendRow(newRow);
  SpreadsheetApp.flush();
  return { success: true };
}

// Update rows where one column matches a value
function updateRows(sheet, col, val, updates) {
  var headers = getHeaders(sheet);
  var colIdx  = headers.indexOf(col);
  if (colIdx === -1) return { success: false, error: 'Column not found: ' + col };

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, updated: 0 };

  var data  = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var count = 0;

  data.forEach(function(row, rowIdx) {
    if (String(row[colIdx]).toLowerCase() === String(val || '').toLowerCase()) {
      Object.keys(updates).forEach(function(key) {
        var ci = headers.indexOf(key);
        if (ci !== -1) sheet.getRange(rowIdx + 2, ci + 1).setValue(updates[key]);
      });
      count++;
    }
  });
  SpreadsheetApp.flush();
  return { success: true, updated: count };
}

// Update rows where id AND month AND year all match
function updateMultiRows(sheet, id, month, year, updates) {
  var headers = getHeaders(sheet);
  var idIdx   = headers.indexOf('id');
  var moIdx   = headers.indexOf('month');
  var yrIdx   = headers.indexOf('year');
  if (idIdx === -1) return { success: false, error: 'id column not found' };

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, updated: 0 };

  var data  = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var count = 0;

  data.forEach(function(row, rowIdx) {
    if (String(row[idIdx]) === String(id) &&
        String(row[moIdx]) === String(month) &&
        String(row[yrIdx]) === String(year)) {
      Object.keys(updates).forEach(function(key) {
        var ci = headers.indexOf(key);
        if (ci !== -1) sheet.getRange(rowIdx + 2, ci + 1).setValue(updates[key]);
      });
      count++;
    }
  });
  SpreadsheetApp.flush();
  return { success: true, updated: count };
}

// Delete rows where one column matches a value
function deleteRows(sheet, col, val) {
  var headers = getHeaders(sheet);
  var colIdx  = headers.indexOf(col);
  if (colIdx === -1) return { success: false, error: 'Column not found: ' + col };

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, deleted: 0 };

  var data  = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var count = 0;

  for (var i = data.length - 1; i >= 0; i--) {
    if (String(data[i][colIdx]).toLowerCase() === String(val || '').toLowerCase()) {
      sheet.deleteRow(i + 2);
      count++;
    }
  }
  SpreadsheetApp.flush();
  return { success: true, deleted: count };
}

// Delete ALL rows for a given student id
function deleteByStudentId(sheet, id) {
  return deleteRows(sheet, 'id', String(id));
}
