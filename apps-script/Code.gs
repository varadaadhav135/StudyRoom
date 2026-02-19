// ═══════════════════════════════════════════════════════════════════════════
// DnyanPeth Study Library — Google Apps Script REST API
// Deploy as a Web App (Execute as: Me, Access: Anyone)
//
// Sheet: "Student"
// Columns: row_key | id | username | email | mobile | aadhar_number |
//          monthly_fee | subscription_start | subscription_end |
//          current_month_paid | month | year | amount | status | created_at
//
// Endpoints (all via ?action=XXX query param):
//   GET  ?action=getAll                    → all rows
//   GET  ?action=search&col=COL&val=VAL   → rows where COL == VAL
//   POST ?action=insert                    → body: { row: {...} }
//   POST ?action=update&col=COL&val=VAL   → body: { updates: {...} }
//   POST ?action=delete&col=COL&val=VAL   → deletes matching rows
// ═══════════════════════════════════════════════════════════════════════════

var SHEET_NAME = 'Student';

// ─── CORS helper ────────────────────────────────────────────────────────────
function cors(output) {
  return output
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders && output; // Apps Script handles CORS automatically for Web Apps
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Entry Points ────────────────────────────────────────────────────────────
function doGet(e)  { return route(e, null); }
function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch(err) {}
  return route(e, body);
}

function route(e, body) {
  var params = e.parameter || {};
  var action = params.action;
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var sheet  = ss.getSheetByName(SHEET_NAME);

  try {
    switch(action) {

      case 'getAll':
        return respond(getAllRows(sheet));

      case 'search':
        return respond(searchRows(sheet, params.col, params.val));

      case 'insert':
        return respond(insertRow(sheet, body.row || {}));

      case 'update':
        return respond(updateRows(sheet, params.col, params.val, body.updates || {}));

      case 'delete':
        return respond(deleteRows(sheet, params.col, params.val));

      default:
        return respond({ success: false, error: 'Unknown action: ' + action });
    }
  } catch(err) {
    return respond({ success: false, error: err.message });
  }
}

// ─── Sheet Helpers ───────────────────────────────────────────────────────────

function getHeaders(sheet) {
  var row = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return row.map(function(h) { return String(h).trim(); });
}

function rowToObj(headers, row) {
  var obj = {};
  headers.forEach(function(h, i) { obj[h] = row[i] === undefined ? '' : String(row[i]); });
  return obj;
}

function getAllRows(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, data: [] };
  var headers = getHeaders(sheet);
  var rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var data = rows.map(function(r) { return rowToObj(headers, r); });
  return { success: true, data: data };
}

function searchRows(sheet, col, val) {
  var all = getAllRows(sheet);
  if (!all.success) return all;
  var filtered = all.data.filter(function(r) {
    return String(r[col]).toLowerCase() === String(val).toLowerCase();
  });
  return { success: true, data: filtered };
}

function insertRow(sheet, rowObj) {
  var headers = getHeaders(sheet);
  var newRow = headers.map(function(h) { return rowObj[h] !== undefined ? rowObj[h] : ''; });
  sheet.appendRow(newRow);
  return { success: true };
}

function updateRows(sheet, col, val, updates) {
  var headers = getHeaders(sheet);
  var colIdx = headers.indexOf(col);
  if (colIdx === -1) return { success: false, error: 'Column not found: ' + col };

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, updated: 0 };

  var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var count = 0;

  data.forEach(function(row, rowIdx) {
    if (String(row[colIdx]).toLowerCase() === String(val).toLowerCase()) {
      Object.keys(updates).forEach(function(key) {
        var updateColIdx = headers.indexOf(key);
        if (updateColIdx !== -1) {
          sheet.getRange(rowIdx + 2, updateColIdx + 1).setValue(updates[key]);
        }
      });
      count++;
    }
  });

  return { success: true, updated: count };
}

function deleteRows(sheet, col, val) {
  var headers = getHeaders(sheet);
  var colIdx = headers.indexOf(col);
  if (colIdx === -1) return { success: false, error: 'Column not found: ' + col };

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: true, deleted: 0 };

  var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var count = 0;

  // Delete from bottom to top to avoid index shifting
  for (var i = data.length - 1; i >= 0; i--) {
    if (String(data[i][colIdx]).toLowerCase() === String(val).toLowerCase()) {
      sheet.deleteRow(i + 2);
      count++;
    }
  }

  return { success: true, deleted: count };
}
