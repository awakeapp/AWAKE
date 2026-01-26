
/**
 * HOST: Google Apps Script
 * PURPOSE: Acts as a backend API for the AWAKE App.
 */

const SHEET_NAMES = {
    DAYS: 'Days', // Changed from Routines/Habits to just Days for simple Key-Value store
    LOGS: 'Logs',
    LOCKED_DATES: 'LockedDates'
};

function doGet(e) {
    const data = getAllData();
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    if (!e || !e.postData) {
        return ContentService.createTextOutput(JSON.stringify({ error: "No payload" }))
            .setMimeType(ContentService.MimeType.JSON);
    }

    let payload;
    try {
        payload = JSON.parse(e.postData.contents);
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ error: "Invalid JSON" }))
            .setMimeType(ContentService.MimeType.JSON);
    }

    const result = processMutations(payload);

    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

// --- CORE LOGIC ---

function getAllData() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    return {
        days: getSheetDataAsMap(ss, SHEET_NAMES.DAYS),
        // logs: getSheetDataAsArray(ss, SHEET_NAMES.LOGS), // Optional: load logs if needed
        lockedDates: getSheetSingleColumn(ss, SHEET_NAMES.LOCKED_DATES)
    };
}

function processMutations(payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheets(ss);

    const response = {
        success: true,
        syncedMutationIds: [],
        rejectedMutations: [],
        lockedDates: []
    };

    const lockedDates = getSheetSingleColumn(ss, SHEET_NAMES.LOCKED_DATES);
    response.lockedDates = lockedDates;

    if (payload && payload.mutations && Array.isArray(payload.mutations)) {
        const daysSheet = ss.getSheetByName(SHEET_NAMES.DAYS);

        payload.mutations.forEach(m => {
            // Check Lock
            if (lockedDates.includes(m.date)) {
                response.rejectedMutations.push({
                    mutationId: m.mutationId,
                    date: m.date,
                    reason: 'DATE_LOCKED'
                });
                return;
            }

            try {
                if (m.type === 'UPDATE_DAY') {
                    // Key: date
                    // Data: Full Day Object
                    upsertRow(daysSheet, m.date, m.data);
                    response.syncedMutationIds.push(m.mutationId);
                } else {
                    response.syncedMutationIds.push(m.mutationId);
                }
            } catch (err) {
                console.error("Mutation failed: " + m.mutationId, err);
            }
        });
    }

    // Logs
    if (payload && payload.logs && Array.isArray(payload.logs)) {
        const logsSheet = ss.getSheetByName(SHEET_NAMES.LOGS);
        payload.logs.forEach(log => {
            logsSheet.appendRow([new Date(), JSON.stringify(log)]);
        });
    }

    return response;
}

// --- HELPER FUNCTIONS ---

function ensureSheets(ss) {
    Object.values(SHEET_NAMES).forEach(name => {
        if (!ss.getSheetByName(name)) {
            ss.insertSheet(name);
        }
    });
}

function getSheetDataAsMap(ss, sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return {};

    const data = sheet.getDataRange().getValues();
    if (data.length < 1) return {};

    const map = {};
    data.forEach(row => {
        // Row 0 = Key (Date), Row 1 = JSON
        if (row[0]) {
            try {
                map[row[0]] = JSON.parse(row[1]);
            } catch (e) {
                map[row[0]] = row[1];
            }
        }
    });
    return map;
}

function getSheetSingleColumn(ss, sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];
    const data = sheet.getDataRange().getValues();
    return data.map(r => r[0]).filter(Boolean);
}

function upsertRow(sheet, key, dataObj) {
    const range = sheet.getDataRange();
    const values = range.getValues();
    const stringData = JSON.stringify(dataObj);

    for (let i = 0; i < values.length; i++) {
        if (values[i][0] == key) {
            sheet.getRange(i + 1, 2).setValue(stringData);
            return;
        }
    }
    sheet.appendRow([key, stringData]);
}
