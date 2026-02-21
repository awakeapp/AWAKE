/**
 * exportUtils.js
 * Generates and triggers CSV file downloads for the Data Export feature.
 */

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
 * Triggers a browser download for a CSV string.
 * @param {string} csv       - CSV content
 * @param {string} filename  - Download filename (without extension)
 */
function downloadCSV(csv, filename) {
    // UTF-8 BOM so Excel opens without encoding issues
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ─────────────── exporters ───────────────

/**
 * Exports Routine history data.
 * Each row = one task from one day.
 * @param {Function} getAllHistory  - from DataContext
 */
export async function exportRoutineData(getAllHistory) {
    const history = await getAllHistory();

    const rows = [];
    for (const day of history) {
        for (const task of (day.data?.tasks || [])) {
            rows.push({
                date: day.data?.date || day.date || '',
                taskName: task.name || '',
                category: task.category || '',
                time: task.time || '',
                status: task.status || '',
            });
        }
    }

    if (rows.length === 0) {
        throw new Error('No routine data found to export.');
    }

    const headers = ['Date', 'Task Name', 'Category', 'Scheduled Time', 'Status'];
    const keys = ['date', 'taskName', 'category', 'time', 'status'];
    downloadCSV(buildCSV(headers, keys, rows), 'routine_export');
}

/**
 * Exports To-Do workspace tasks.
 * @param {Object[]} tasks  - from TaskContext
 */
export function exportTodoData(tasks) {
    if (!tasks || tasks.length === 0) {
        throw new Error('No Todo tasks found to export.');
    }

    const rows = tasks.map(t => ({
        title: t.title || '',
        status: t.status || '',
        priority: t.priority || '',
        category: t.category || '',
        date: t.date || '',
        dueDate: t.dueDate || '',
        description: t.description || '',
        estimatedTime: t.estimatedTime ? `${t.estimatedTime} min` : '',
    }));

    const headers = ['Title', 'Status', 'Priority', 'Category', 'Date', 'Due Date', 'Description', 'Estimated Time'];
    const keys = ['title', 'status', 'priority', 'category', 'date', 'dueDate', 'description', 'estimatedTime'];
    downloadCSV(buildCSV(headers, keys, rows), 'todo_export');
}

/**
 * Exports all Finance transactions with category name lookup.
 * @param {Object[]} transactions  - from FinanceContext
 * @param {Object[]} categories    - from FinanceContext
 * @param {Object[]} accounts      - from FinanceContext
 */
export function exportFinanceData(transactions, categories, accounts) {
    if (!transactions || transactions.length === 0) {
        throw new Error('No financial transactions found to export.');
    }

    const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
    const accMap = Object.fromEntries(accounts.map(a => [a.id, a.name]));

    const rows = transactions.map(t => ({
        date: t.date ? new Date(t.date).toLocaleDateString('en-CA') : '',
        type: t.type || '',
        amount: t.amount || 0,
        category: catMap[t.categoryId] || t.categoryId || '',
        account: accMap[t.accountId] || t.accountId || '',
        description: t.description || t.note || '',
    }));

    const headers = ['Date', 'Type', 'Amount (₹)', 'Category', 'Account', 'Description'];
    const keys = ['date', 'type', 'amount', 'category', 'account', 'description'];
    downloadCSV(buildCSV(headers, keys, rows), 'finance_export');
}

/**
 * Exports Vehicle service records with vehicle name lookup.
 * @param {Object[]} serviceRecords  - from VehicleContext
 * @param {Object[]} vehicles        - from VehicleContext
 */
export function exportVehicleData(serviceRecords, vehicles) {
    if (!serviceRecords || serviceRecords.length === 0) {
        throw new Error('No vehicle service records found to export.');
    }

    const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v.name || v.registrationNumber || v.id]));

    const rows = serviceRecords.map(r => ({
        date: r.date ? new Date(r.date).toLocaleDateString('en-CA') : '',
        vehicle: vehicleMap[r.vehicleId] || r.vehicleId || '',
        serviceType: r.type || '',
        odometer: r.odometer ? `${r.odometer} km` : '',
        cost: r.cost ? `₹${r.cost}` : '₹0',
        notes: r.notes || r.description || '',
    }));

    const headers = ['Date', 'Vehicle', 'Service Type', 'Odometer', 'Cost', 'Notes'];
    const keys = ['date', 'vehicle', 'serviceType', 'odometer', 'cost', 'notes'];
    downloadCSV(buildCSV(headers, keys, rows), 'vehicle_export');
}
