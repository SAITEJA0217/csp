const SPREADSHEET_ID = "19-EGi2yC3jPxrNkAkAAKpg2E9mp1JULk3MA9WATrcCw";

function doPost(e) {
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(10000);
    console.log("Received POST request");
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Bookings");
    if (!sheet) {
      return createJsonResponse({ success: false, message: "System Error: Bookings sheet not found." });
    }

    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, message: "No data provided." });
    }

    const data = JSON.parse(e.postData.contents);
    
    // ACTION: CANCEL
    if (data.action === 'cancel') {
      const { bookingId } = data;
      const allData = sheet.getDataRange().getValues();
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][1] === bookingId) {
          sheet.getRange(i + 1, 12).setValue("Cancelled"); // Update status column (L)
          return createJsonResponse({ success: true, message: `Booking ${bookingId} cancelled.` });
        }
      }
      return createJsonResponse({ success: false, message: "Booking ID not found." });
    }

    // ACTION: CHECKIN
    if (data.action === 'checkin') {
      const { bookingId } = data;
      const allData = sheet.getDataRange().getValues();
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][1] === bookingId) {
          // If no CheckInTime header exists, it'll just put it in column M
          const checkInTime = new Date().toISOString();
          sheet.getRange(i + 1, 13).setValue(checkInTime); 
          return createJsonResponse({ success: true, message: `Booking ${bookingId} checked in.` });
        }
      }
      return createJsonResponse({ success: false, message: "Booking ID not found." });
    }

    // ACTION: CREATE BOOKING (Default)
    const { teamName, leaderName, rollNumber, section, phone, email, startup, date, slot } = data;
    
    if (!teamName || !leaderName || !rollNumber || !section || !phone || !email || !startup || !date || !slot) {
      return createJsonResponse({ success: false, message: "All fields are required." });
    }
    
    const allData = sheet.getDataRange().getValues();
    let rowCount = allData.length;
    
    for (let i = 1; i < rowCount; i++) {
      const row = allData[i];
      if (row[2] === teamName && row[11] === "Confirmed") {
        return createJsonResponse({ success: false, message: "Team Name already has a booking." });
      }
      if (row[7] === email && row[11] === "Confirmed") {
        return createJsonResponse({ success: false, message: "Email Address already has a booking." });
      }
      if (row[9] === date && row[10] === slot && row[11] === "Confirmed") {
        return createJsonResponse({ success: false, message: "Selected slot is already booked." });
      }
    }

    const bookingCounter = String(rowCount).padStart(3, '0');
    const bookingId = `CPC-2026-${bookingCounter}`;
    const timestamp = new Date();
    const status = "Confirmed";

    sheet.appendRow([
      timestamp, bookingId, teamName, leaderName, rollNumber, 
      section, phone, email, startup, date, slot, status
    ]);
    
    // Enhanced HTML Email
    const subject = `Booking Confirmed: Case Presentation Contest - ${teamName}`;
    const qrUrl = `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=${encodeURIComponent(bookingId)}`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #4f46e5; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Case Presentation Contest</h1>
          <p style="color: #e0e7ff; margin-top: 10px;">Booking Confirmation</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #334155;">Hi <strong>${leaderName}</strong>,</p>
          <p style="font-size: 16px; color: #334155; line-height: 1.5;">Your slot has been successfully confirmed. Below are your booking details:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8fafc; border-radius: 8px;">
            <tr><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Booking ID</td><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #4f46e5;">${bookingId}</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Team Name</td><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">${teamName}</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Date</td><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">${date}</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Time Slot</td><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">${slot}</td></tr>
            <tr><td style="padding: 12px; color: #64748b;">Venue</td><td style="padding: 12px; font-weight: bold; color: #0f172a;">SOE-7, Malla Reddy University</td></tr>
          </table>

          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 14px; color: #64748b; margin-bottom: 10px;">Show this QR Code at the registration desk:</p>
            <img src="${qrUrl}" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;" />
          </div>

          <p style="font-size: 14px; color: #ef4444; text-align: center; font-weight: bold;">⚠️ Please report 15 minutes before your time slot.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://maps.google.com" style="display: inline-block; background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Open in Google Maps</a>
          </div>
        </div>
      </div>
    `;
    
    try {
      MailApp.sendEmail({
        to: email,
        subject: subject,
        htmlBody: htmlBody
      });
      console.log(`Confirmation email sent to ${email}`);
    } catch (emailError) {
      console.error("Email sending failed: ", emailError);
    }

    return createJsonResponse({ success: true, bookingId: bookingId, message: "Booking Confirmed" });

  } catch (err) {
    return createJsonResponse({ success: false, message: err.message });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Bookings");
    if (!sheet) {
      return createJsonResponse({ success: false, message: "Bookings sheet not found" });
    }

    const allData = sheet.getDataRange().getValues();
    
    // Admin Action: Fetch all records
    if (e.parameter.action === 'getAll') {
      const headers = allData[0];
      const records = [];
      for (let i = 1; i < allData.length; i++) {
        let obj = {};
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = allData[i][j];
        }
        // Handle missing headers gracefully
        if (!obj['CheckInTime'] && allData[i][12]) {
           obj['CheckInTime'] = allData[i][12];
        }
        records.push(obj);
      }
      return createJsonResponse({ success: true, records });
    }

    // Default Action: Fetch booked slots for frontend availability
    const bookedSlots = {
      "24 July 2026": [],
      "25 July 2026": []
    };

    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      const date = row[9];
      const slot = row[10];
      const status = row[11];
      
      if (status === "Confirmed" || status === "Reserved") {
        if (!bookedSlots[date]) bookedSlots[date] = [];
        bookedSlots[date].push(slot);
      }
    }

    return createJsonResponse({ success: true, bookedSlots });
  } catch (err) {
    return createJsonResponse({ success: false, message: err.message });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
