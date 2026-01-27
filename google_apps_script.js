/**
 * HOST: Google Apps Script
 * PURPOSE: Acts as a backend API for the AWAKE App.
 * CONFIG: Set your Spreadsheet ID here.
 */

const SPREADSHEET_ID = '1-_ByIaJbEESPevRozN5v-sojRbcHKevEVAi4UG6Ac_Y';

const SHEET_NAMES = {
    DAYS: 'Days',
    LOGS: 'Logs',
    LOCKED_DATES: 'LockedDates',
    USERS: 'Users',
    MODULES: 'Modules'
};

/**
 * Triggers when the spreadsheet is opened.
 * This ensures the sheet is always professional and updated.
 */
function onOpen() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    migrateSheetNames(ss);
    ensureSheets(ss);
    SpreadsheetApp.getUi()
        .createMenu('🚀 AWAKE Admin')
        .addItem('Force Format Sheets', 'onOpen')
        .addToUi();
}

/**
 * Renames legacy sheets to professional names if they exist.
 */
function migrateSheetNames(ss) {
    const MAPPING = {
        'Users': SHEET_NAMES.USERS,
        'Days': SHEET_NAMES.DAYS,
        'Modules': SHEET_NAMES.MODULES,
        'Logs': SHEET_NAMES.LOGS,
        'LockedDates': SHEET_NAMES.LOCKED_DATES
    };

    Object.entries(MAPPING).forEach(([oldName, newName]) => {
        const oldSheet = ss.getSheetByName(oldName);
        const newSheet = ss.getSheetByName(newName);
        if (oldSheet && !newSheet) {
            oldSheet.setName(newName);
        }
    });
}

function doGet(e) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    ensureSheets(ss); // Initialize structures immediately
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
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    return {
        days: getSheetDataAsMap(ss, SHEET_NAMES.DAYS),
        users: getSheetDataAsMap(ss, SHEET_NAMES.USERS),
        modules: getSheetDataAsMap(ss, SHEET_NAMES.MODULES),
        lockedDates: getSheetSingleColumn(ss, SHEET_NAMES.LOCKED_DATES)
    };
}

function processMutations(payload) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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
        const usersSheet = ss.getSheetByName(SHEET_NAMES.USERS);
        const modulesSheet = ss.getSheetByName(SHEET_NAMES.MODULES);

        payload.mutations.forEach(m => {
            try {
                if (m.type === 'UPDATE_DAY') {
                    // Check Lock
                    if (lockedDates.includes(m.date)) {
                        response.rejectedMutations.push({
                            mutationId: m.mutationId,
                            date: m.date,
                            reason: 'DATE_LOCKED'
                        });
                        return;
                    }
                    // Key: uid_date
                    const key = `${m.uid}_${m.date}`;
                    upsertRow(daysSheet, key, m.data);
                    response.syncedMutationIds.push(m.mutationId);
                } else if (m.type === 'UPDATE_USER') {
                    // Specialized User Upsert for readability
                    upsertUser(usersSheet, m.uid, m.data);
                    response.syncedMutationIds.push(m.mutationId);
                } else if (m.type === 'UPDATE_MODULE') {
                    // Key: uid_moduleName
                    const key = `${m.uid}_${m.moduleName}`;
                    upsertRow(modulesSheet, key, m.data);
                    response.syncedMutationIds.push(m.mutationId);
                } else {
                    response.syncedMutationIds.push(m.mutationId);
                }
            } catch (err) {
                console.error("Mutation failed: " + (m.mutationId || 'unknown'), err);
            }
        });
    }

    // Logs
    if (payload && payload.logs && Array.isArray(payload.logs)) {
        const logsSheet = ss.getSheetByName(SHEET_NAMES.LOGS);
        payload.logs.forEach(log => {
            logsSheet.appendRow([
                new Date().toLocaleString(),
                log.type || '',
                log.user || '',
                log.uid || '',
                log.action || '',
                JSON.stringify(log)
            ]);
        });
    }

    return response;
}

// --- HELPER FUNCTIONS ---

function ensureSheets(ss) {
    const HEADERS = {
        [SHEET_NAMES.DASHBOARD]: ["Module", "Item Count", "Last Update", "Status"],
        [SHEET_NAMES.USERS]: ["UID", "DisplayName", "Email", "Phone", "Password", "Created At", "Full Profile"],
        [SHEET_NAMES.DAYS]: ["Key (UID_Date)", "Data (JSON)", "Last Modified"],
        [SHEET_NAMES.MODULES]: ["Key (UID_Module)", "Data (JSON)", "Last Modified"],
        [SHEET_NAMES.LOGS]: ["Timestamp", "Level", "User / ID", "Action", "Details"],
        [SHEET_NAMES.LOCKED_DATES]: ["Formatted Date"]
    };

    Object.entries(HEADERS).forEach(([name, headers]) => {
        let sheet = ss.getSheetByName(name);
        if (!sheet) {
            sheet = ss.insertSheet(name);
            sheet.appendRow(headers);
        } else {
            // Check if Row 1 is already our header
            const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
            const isHeaderMatch = firstRow.every((val, i) => val === headers[i]);

            if (!isHeaderMatch) {
                sheet.insertRowBefore(1);
                sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
            }
        }
        formatHeader(sheet);
    });

    // Cleanup: Remove default "Sheet1" if it's empty
    const sheet1 = ss.getSheetByName("Sheet1");
    if (sheet1 && sheet1.getLastRow() === 0 && ss.getSheets().length > 1) {
        ss.deleteSheet(sheet1);
    }

    // updateDashboard(ss);
    updateDashboard(ss);
    SpreadsheetApp.flush();
}

function updateDashboard(ss) {
    const dash = ss.getSheetByName(SHEET_NAMES.DASHBOARD);
    if (!dash) return;

    // Clear old data first for a fresh look
    dash.getRange(2, 1, 10, 4).clearContent();

    const rows = [
        ["👥 Total Users", ss.getSheetByName(SHEET_NAMES.USERS).getLastRow() - 1, new Date().toLocaleString(), "OK"],
        ["📅 Daily Entries", ss.getSheetByName(SHEET_NAMES.DAYS).getLastRow() - 1, new Date().toLocaleString(), "Active"],
        ["📦 App Modules", ss.getSheetByName(SHEET_NAMES.MODULES).getLastRow() - 1, new Date().toLocaleString(), "Running"],
        ["📜 System Logs", ss.getSheetByName(SHEET_NAMES.LOGS).getLastRow() - 1, new Date().toLocaleString(), "Healthy"]
    ];

    dash.getRange(2, 1, rows.length, 4).setValues(rows);
    dash.getRange(2, 1, rows.length, 4).setHorizontalAlignment("center").setVerticalAlignment("middle");
}

function formatHeader(sheet) {
    const lastCol = sheet.getLastColumn() || 1;
    const headerRange = sheet.getRange(1, 1, 1, lastCol);

    // Professional Slate Styling
    headerRange.setFontWeight("bold");
    headerRange.setFontColor("#ffffff");
    headerRange.setBackground("#2c3e50");
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");
    headerRange.setWrap(true);

    sheet.setFrozenRows(1);

    // Auto-resize
    sheet.autoResizeColumns(1, lastCol);
    for (let i = 1; i <= lastCol; i++) {
        let width = sheet.getColumnWidth(i);
        if (width < 100) sheet.setColumnWidth(i, 150);
        if (width > 400) sheet.setColumnWidth(i, 400);
    }
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
    const lastMod = new Date().toLocaleString();

    for (let i = 0; i < values.length; i++) {
        if (values[i][0] == key) {
            sheet.getRange(i + 1, 2).setValue(stringData);
            sheet.getRange(i + 1, 3).setValue(lastMod);
            return;
        }
    }
    sheet.appendRow([key, stringData, lastMod]);
}

function upsertUser(sheet, uid, data) {
    const range = sheet.getDataRange();
    const values = range.getValues();

    // Header check/setup if empty
    if (values.length === 1 && values[0][0] === "") {
        sheet.appendRow(["UID", "DisplayName", "Email", "Phone", "Password", "CreatedAt", "FullDataJSON"]);
    }

    const rowData = [
        uid,
        data.displayName || '',
        data.email || '',
        data.phone || '',
        data.password || '',
        new Date(data.createdAt || Date.now()).toLocaleString(),
        JSON.stringify(data)
    ];

    for (let i = 0; i < values.length; i++) {
        if (values[i][0] == uid) {
            sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
            return;
        }
    }
    sheet.appendRow(rowData);
}
