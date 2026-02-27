/**
 * exportUtils.js
 * Generates and triggers CSV/XLSX file downloads for the Data Export feature.
 */
import * as XLSX from 'xlsx';

// ─────────────── helpers ───────────────

/**
 * Converts an array of objects to a CSV string.
 * @param {string[]} headers  - Column labels (display names)
 * @param {string[]} keys     - Matching object key names
 * @param {Object[]} rows     - Data rows
 * @returns {string} CSV text
 */
function buildCSV(headers, keys, rows) {
    const escape = (value) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const headerRow = headers.map(escape).join(',');
    const dataRows = rows.map(row =>
        keys.map(key => escape(row[key])).join(',')
    );

    return [headerRow, ...dataRows].join('\n');
}

/**
 * Triggers a browser download for a CSV or XLSX file.
 * @param {string|Object[]} data - Content or rows
 * @param {string} filename      - Download filename
 * @param {string} format        - 'csv' or 'xlsx'
 * @param {string[]} headers     - For CSV matching
 * @param {string[]} keys        - For CSV matching
 */
function downloadFile(data, filename, format = 'csv', headers = [], keys = []) {
    const timestamp = new Date().toISOString().slice(0, 10);
    const finalFilename = `${filename}_${timestamp}`;

    if (format === 'xlsx') {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, `${finalFilename}.xlsx`);
    } else {
        const csv = buildCSV(headers, keys, data);
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${finalFilename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// ─────────────── exporters ───────────────

/**
 * Exports Routine history data.
 * Each row = one task from one day.
 * @param {Function} getAllHistory  - from DataContext
 */
export async function exportRoutineData(getAllHistory, format = 'csv') {
    const history = await getAllHistory();
    const rows = [];
    for (const day of history) {
        for (const task of (day.data?.tasks || [])) {
            rows.push({
                Date: day.data?.date || day.date || '',
                'Task Name': task.name || '',
                Category: task.category || '',
                Time: task.time || '',
                Status: task.status || '',
            });
        }
    }

    if (rows.length === 0) throw new Error('No routine data found to export.');

    const headers = ['Date', 'Task Name', 'Category', 'Scheduled Time', 'Status'];
    const keys = ['Date', 'Task Name', 'Category', 'Time', 'Status'];
    downloadFile(rows, 'routine_export', format, headers, keys);
}

export function exportTodoData(tasks, format = 'csv') {
    if (!tasks || tasks.length === 0) throw new Error('No Todo tasks found to export.');

    const rows = tasks.map(t => ({
        Title: t.title || '',
        Status: t.status || '',
        Priority: t.priority || '',
        Category: t.category || '',
        Date: t.date || '',
        'Due Date': t.dueDate || '',
        Description: t.description || '',
        'Est Time': t.estimatedTime ? `${t.estimatedTime} min` : '',
    }));

    const headers = ['Title', 'Status', 'Priority', 'Category', 'Date', 'Due Date', 'Description', 'Est Time'];
    const keys = ['Title', 'Status', 'Priority', 'Category', 'Date', 'Due Date', 'Description', 'Est Time'];
    downloadFile(rows, 'todo_export', format, headers, keys);
}

export function exportFinanceData(transactions, categories, accounts, format = 'csv') {
    if (!transactions || transactions.length === 0) throw new Error('No transactions found.');

    const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
    const accMap = Object.fromEntries(accounts.map(a => [a.id, a.name]));

    const rows = transactions.map(t => ({
        Date: t.date ? new Date(t.date).toLocaleDateString('en-CA') : '',
        Type: t.type || '',
        Amount: t.amount || 0,
        Category: catMap[t.categoryId] || t.categoryId || '',
        Account: accMap[t.accountId] || t.accountId || '',
        Description: t.description || t.note || '',
    }));

    const headers = ['Date', 'Type', 'Amount', 'Category', 'Account', 'Description'];
    const keys = ['Date', 'Type', 'Amount', 'Category', 'Account', 'Description'];
    downloadFile(rows, 'finance_export', format, headers, keys);
}

export function exportVehicleData(serviceRecords, vehicles, format = 'csv') {
    if (!serviceRecords || serviceRecords.length === 0) throw new Error('No vehicle records found.');

    const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v.name || v.id]));

    const rows = serviceRecords.map(r => ({
        Date: r.date ? new Date(r.date).toLocaleDateString('en-CA') : '',
        Vehicle: vehicleMap[r.vehicleId] || r.vehicleId || '',
        'Service Type': r.type || '',
        Odometer: r.odometer ? `${r.odometer} km` : '',
        Cost: r.cost ? `₹${r.cost}` : '₹0',
        Notes: r.notes || r.description || '',
    }));

    const headers = ['Date', 'Vehicle', 'Service Type', 'Odometer', 'Cost', 'Notes'];
    const keys = ['Date', 'Vehicle', 'Service Type', 'Odometer', 'Cost', 'Notes'];
    downloadFile(rows, 'vehicle_export', format, headers, keys);
}
