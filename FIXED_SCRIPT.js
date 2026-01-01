var sheetName = 'Sheet1';
var scriptProp = PropertiesService.getScriptProperties();

function doPost(e) {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        // I have hardcoded YOUR specific Spreadsheet ID here so it can't fail
        var doc = SpreadsheetApp.openById('1B0lx0-Lnd9m_sex0D4rKz4mfOwTWMewGNJcidafOd_Q');
        var sheet = doc.getSheetByName(sheetName);

        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        var nextRow = sheet.getLastRow() + 1;

        var newRow = headers.map(function (header) {
            if (header === 'timestamp') {
                return new Date();
            }
            return e.parameter[header];
        });

        sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

        return ContentService
            .createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
            .setMimeType(ContentService.MimeType.JSON);
    }

    catch (e) {
        return ContentService
            .createTextOutput(JSON.stringify({ 'result': 'error', 'error': e }))
            .setMimeType(ContentService.MimeType.JSON);
    }

    finally {
        lock.releaseLock();
    }
}
