/* FIXED_SCRIPT_WITH_EMAIL.js - User Local Time Version
   * UPDATED: Uses appendRow() to automatically handle infinite rows (bypassing 1000 row limit).
   */
var sheetID = '1B0lx0-Lnd9m_sex0D4rKz4mfOwTWMewGNJcidafOd_Q';

function doPost(e) {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        var doc = SpreadsheetApp.openById(sheetID);
        var sheet;
        var type = "unknown";

        // 1. DETERMINE TARGET + TYPE
        if (e.parameter.email === 'Pageview') {
            type = "visitor";
            sheet = doc.getSheetByName('Visitors');
            if (!sheet) {
                sheet = doc.insertSheet('Visitors');
                sheet.appendRow(['date', 'time', 'email', 'name', 'message', 'ip', 'city', 'country', 'platform', 'screen', 'referrer', 'language', 'timezone']);
            }
        }
        else if (e.parameter.email && (!e.parameter.message || String(e.parameter.message || "").trim() === "")) {
            type = "subscription"; // Hero Form
            sheet = doc.getSheetByName('Subscriptions');
            if (!sheet) {
                sheet = doc.insertSheet('Subscriptions');
                sheet.appendRow(['date', 'time', 'email', 'ip', 'city', 'country', 'platform']);
            }
        }
        else {
            type = "contact"; // Contact Form
            sheet = doc.getSheetByName('Sheet1');
            // Safety: Create Sheet1 if missing
            if (!sheet) {
                sheet = doc.insertSheet('Sheet1');
                // Default headers for contact form
                sheet.appendRow(['timestamp', 'date', 'time', 'name', 'email', 'user_type', 'message', 'ip', 'city', 'country', 'platform']);
            }
        }

        // 2. SAVE DATA (Prefer CLIENT time if available)
        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        // var nextRow = sheet.getLastRow() + 1; // Not needed for appendRow
        var now = new Date();
        var timeZone = Session.getScriptTimeZone();

        var newRow = headers.map(function (header) {
            if (header === 'timestamp') { return Utilities.formatDate(now, timeZone, "yyyy-MM-dd HH:mm:ss"); } // Server log time

            // MAGIC FIX for Client Time:
            if (header === 'date') {
                return e.parameter['date'] || Utilities.formatDate(now, timeZone, "yyyy-MM-dd");
            }
            if (header === 'time') {
                return e.parameter['time'] || Utilities.formatDate(now, timeZone, "hh:mm:ss a");
            }

            return e.parameter[header];
        });

        // CRITICAL FIX: Use appendRow instead of getRange().setValues()
        // appendRow automatically extends the sheet boundaries if needed.
        sheet.appendRow(newRow);

        // 3. SEND EMAIL
        if (type === "subscription") {
            try {
                MailApp.sendEmail({
                    to: e.parameter.email,
                    subject: "✨ Subscription Confirmed: Welcome to Astromic",
                    name: "Astromic Team",
                    htmlBody: `
                  <div style="font-family: sans-serif; color: #333; max-width: 600px;">
                    <h2 style="color: #4a125e;">Subscription Confirmed.</h2>
                    <p>Thank you for joining. Your <strong>1-Year Free Subscription</strong> has been reserved.</p>
                    <div style="background-color: #fce7f3; color: #831843; padding: 15px; border-radius: 6px; margin: 20px 0;">
                      <strong>Status:</strong> Reserved<br>
                      <strong>Tier:</strong> First Year Free
                    </div>
                  </div>
                `
                });
            } catch (err) { console.log("Email Error: " + err); }
        }

        // Return success with the new row number (approximate since appendRow doesn't return it, but getLastRow does)
        return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'row': sheet.getLastRow() })).setMimeType(ContentService.MimeType.JSON);
    }
    catch (e) { return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': e })).setMimeType(ContentService.MimeType.JSON); }
    finally { lock.releaseLock(); }
}
