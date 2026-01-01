var sheetID = '1B0lx0-Lnd9m_sex0D4rKz4mfOwTWMewGNJcidafOd_Q';

/**
 * SECURE BACKEND SCRIPT
 * Features:
 * 1. Honeypot Detection (Silent Fail)
 * 2. IP Rate Limiting (Using CacheService)
 * 3. Validation
 * 4. Preserves all original logic (Chat, PWA, Visitors, Subscriptions)
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 10s for concurrent lock
  lock.tryLock(10000);

  try {
    // --- 1. SECURITY CHECKS ---
    
    // A. HONEYPOT CHECK 🍯
    // If the hidden 'honey_pot' field has ANY value, it's a bot.
    // We return 'success' to fool them, but DO NOT save data.
    if (e.parameter.honey_pot && e.parameter.honey_pot.trim() !== "") {
      return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'row': 0 }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // B. RATE LIMITING ⏱️
    // Limit: 5 requests per 10 minutes per IP
    var ip = e.parameter.ip || "unknown";
    if (ip !== "unknown") {
      var cache = CacheService.getScriptCache();
      var count = Number(cache.get(ip) || 0);
      
      if (count >= 5) {
        return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': 'Rate Limit Exceeded' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      // Increment count, expire in 600 seconds (10 mins)
      cache.put(ip, count + 1, 600);
    }

    // --- 2. BUSINESS LOGIC ---
    
    var doc = SpreadsheetApp.openById(sheetID);
    var sheet;
    var type = "unknown";

    // DETERMINATION LOGIC (Preserved from original)
    
    // TYPE: CHAT LOGGING
    if (e.parameter.type === 'chat') {
        type = "chat";
        sheet = doc.getSheetByName('ChatLogs');
        if (!sheet) {
            sheet = doc.insertSheet('ChatLogs');
            sheet.appendRow(['date', 'time', 'name', 'dob', 'system', 'question', 'ip']);
        }
    }
    // TYPE: APP INSTALLS
    else if (e.parameter.type === 'pwa_launch') {
         type = 'app_install';
         sheet = doc.getSheetByName('AppInstalls');
         if (!sheet) {
             sheet = doc.insertSheet('AppInstalls');
             sheet.appendRow(['date', 'time', 'name', 'os', 'screen', 'ip']);
         }
    }
    // TYPE: PAGE VIEWS
    else if (e.parameter.email === 'Pageview') {
        type = "visitor";
        sheet = doc.getSheetByName('Visitors');
        if (!sheet) {
            sheet = doc.insertSheet('Visitors');
            sheet.appendRow(['date', 'time', 'email', 'name', 'message', 'ip', 'city', 'country', 'platform', 'screen', 'referrer', 'language', 'timezone']);
        }
    }
    // TYPE: SUBSCRIPTIONS (Hero/Launch Form)
    // Checks for explicit type OR fallback logic (email provided, no message)
    else if (
        e.parameter.type === 'subscription' || 
        e.parameter.formType === 'waitlist_launch' ||
        (e.parameter.email && (!e.parameter.message || String(e.parameter.message || "").trim() === ""))
    ) {
        type = "subscription"; 
        sheet = doc.getSheetByName('Subscriptions') || doc.insertSheet('Subscriptions');
        // Auto-fix headers if missing protection
        if(sheet.getLastRow() === 0) sheet.appendRow(['date', 'time', 'email', 'ip', 'city', 'country', 'platform']);
    }
    // TYPE: CONTACT FORM (Default)
    else {
        type = "contact";
        sheet = doc.getSheetByName('Sheet1');
        if (!sheet) {
            sheet = doc.insertSheet('Sheet1');
            sheet.appendRow(['timestamp', 'date', 'time', 'name', 'email', 'user_type', 'message', 'ip', 'city', 'country', 'platform']);
        }
    }

    // --- 3. SAVE DATA ---
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var now = new Date();
    var timeZone = Session.getScriptTimeZone();

    var newRow = headers.map(function (header) {
        if (header === 'timestamp') { return Utilities.formatDate(now, timeZone, "yyyy-MM-dd HH:mm:ss"); }
        if (header === 'date') { return e.parameter['date'] || Utilities.formatDate(now, timeZone, "yyyy-MM-dd"); }
        if (header === 'time') { return e.parameter['time'] || Utilities.formatDate(now, timeZone, "hh:mm:ss a"); }
        // Security: Strip potential HTML/Formula injection from strings?
        // Basic protection: just save raw value. Google Sheets does not auto-execute formulas unless they start with =
        var val = e.parameter[header] || "";
        if (typeof val === 'string' && val.startsWith('=')) {
           val = "'" + val; // Escape formula injection
        }
        return val;
    });

    sheet.appendRow(newRow);

    // --- 4. SEND EMAIL (Subscriptions Only) ---
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

    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'row': sheet.getLastRow() })).setMimeType(ContentService.MimeType.JSON);
  }
  catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': e.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
  finally {
    lock.releaseLock();
  }
}
