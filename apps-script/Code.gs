// ═══════════════════════════════════════════════════════════════════════════
// DnyanPeth Study Library — Google Apps Script REST API
// Deploy as: Web App | Execute as: Me | Access: Anyone
//
// Sheet: "Student"
// Columns: id | username | email | mobile | aadhar_number | monthly_fee |
//          subscription_start | subscription_end | current_month_paid |
//          month | year | amount | status
//
// ⚠️  Apps Script redirects POST → the body is lost after redirect.
//     SOLUTION: All data (including row/updates) is passed as a JSON
//     string in the URL query param `payload`. This way GET & POST both work.
//
// Endpoints (all via ?action=XXX&payload=JSON):
//   GET ?action=getAll
//   GET ?action=search&payload={"col":"id","val":"123"}
//   GET ?action=searchMulti&payload={"id":"123","month":"1","year":"2026"}
//   GET ?action=insert&payload={"row":{...}}
//   GET ?action=update&payload={"col":"id","val":"123","updates":{...}}
//   GET ?action=updateMulti&payload={"id":"123","month":"1","year":"2026","updates":{...}}
//   GET ?action=delete&payload={"col":"id","val":"123"}
//   GET ?action=deleteMulti&payload={"id":"123"}
// ═══════════════════════════════════════════════════════════════════════════

var SHEET_NAME = 'Student';

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Both GET and POST hit the same handler.
// Payload is always in query param `payload` as a JSON string.
function doGet(e)  { return route(e); }
function doPost(e) { return route(e); }

function route(e) {
  var p      = e.parameter || {};
  var action = p.action;
  var payload = {};
  try { payload = JSON.parse(p.payload || '{}'); } catch(err) { payload = {}; }

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return respond({ success: false, error: 'Sheet "' + SHEET_NAME + '" not found' });

  try {
    if      (action === 'getAll')       return respond(getAllRows(sheet));
    else if (action === 'search')       return respond(searchRows(sheet, payload.col, payload.val));
    else if (action === 'searchMulti')  return respond(searchMultiRows(sheet, payload.id, payload.month, payload.year));
    else if (action === 'insert')       return respond(insertRow(sheet, payload.row || {}));
    else if (action === 'update')       return respond(updateRows(sheet, payload.col, payload.val, payload.updates || {}));
    else if (action === 'updateMulti')  return respond(updateMultiRows(sheet, payload.id, payload.month, payload.year, payload.updates || {}));
    else if (action === 'delete')       return respond(deleteRows(sheet, payload.col, payload.val));
    else if (action === 'deleteMulti')  return respond(deleteByStudentId(sheet, payload.id));
    else return respond({ success: false, error: 'Unknown action: ' + action });
  } catch(err) {
    return respond({ success: false, error: err.message });
  }
}

// ─── Sheet Helpers ───────────────────────────────────────────────────────────

function getHeaders(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
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

function searchRows(sheet, col, val) {
  var all = getAllRows(sheet);
  if (!all.success) return all;
  return {
    success: true,
    data: all.data.filter(function(r) {
      return String(r[col] || '').toLowerCase() === String(val || '').toLowerCase();
    })
  };
}

function searchMultiRows(sheet, id, month, year) {
  var all = getAllRows(sheet);
  if (!all.success) return all;
  return {
    success: true,
    data: all.data.filter(function(r) {
      return String(r.id) === String(id) &&
             String(r.month) === String(month) &&
             String(r.year) === String(year);
    })
  };
}

function insertRow(sheet, rowObj) {
  var headers = getHeaders(sheet);
  var newRow  = headers.map(function(h) { return rowObj[h] !== undefined ? rowObj[h] : ''; });
  sheet.appendRow(newRow);
  SpreadsheetApp.flush();
  return { success: true };
}

function updateRows(sheet, col, val, updates) {
  var headers = getHeaders(sheet);
  var colIdx  = headers.indexOf(col);
  if (colIdx === -1) return { success: false, error: 'Column not found: ' + col };
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, updated: 0 };
  var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
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

function updateMultiRows(sheet, id, month, year, updates) {
  var headers = getHeaders(sheet);
  var idIdx   = headers.indexOf('id');
  var moIdx   = headers.indexOf('month');
  var yrIdx   = headers.indexOf('year');
  if (idIdx === -1) return { success: false, error: 'id column not found' };
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, updated: 0 };
  var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
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

function deleteRows(sheet, col, val) {
  var headers = getHeaders(sheet);
  var colIdx  = headers.indexOf(col);
  if (colIdx === -1) return { success: false, error: 'Column not found: ' + col };
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, deleted: 0 };
  var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
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

function deleteByStudentId(sheet, id) {
  return deleteRows(sheet, 'id', String(id));
}
