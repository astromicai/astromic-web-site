/**
 * GOOGLE SHEETS INSTRUCTIONS:
 * 
 * 1. Go to sheets.google.com and create a new Sheet named "Astromic Leads".
 * 2. In the first row, add these headers:
 *    A1: timestamp
 *    B1: email
 *    C1: name (optional for contact form)
 *    D1: message (optional for contact form)
 * 
 * 3. Go to Extensions > Apps Script in the menu.
 * 4. Verify that the files on the left side include 'Code.gs'.
 * 5. Delete any existing code in 'Code.gs' and PASTE the code below.
 * 6. Click 'Save' (floppy disk icon).
 * 7. Click 'Deploy' (blue button) > 'New deployment'.
 * 8. Click the gear icon next to 'Select type' and select 'Web app'.
 * 9. Set 'Description' to "Astromic Contact Form".
 * 10. Set 'Execute as' to "Me".
 * 11. Set 'Who has access' to "Anyone" (VERY IMPORTANT).
 * 12. Click 'Deploy'.
 * 13. Authorize the script (Click 'Review permissions' -> Choose account -> Advanced -> Go to ... (unsafe) -> Allow).
 * 14. COPY the "Web app URL" (it ends with /exec).
 * 15. Paste that URL back to me in the chat!
 */

// --- PASTE THIS CODE INTO GOOGLE APPS SCRIPT ---

var sheetName = 'Sheet1'; // Make sure this matches your tab name at bottom of sheet
var scriptProp = PropertiesService.getScriptProperties();

function setup() {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    scriptProp.setProperty('key', doc.getId());
}

function doPost(e) {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        var doc = SpreadsheetApp.openById(scriptProp.getProperty('key'));
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

// --- END CODE ---
