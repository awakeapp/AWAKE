import { jsPDF } from "jspdf";
import { AWAKE_LOGO } from "./assets";

/**
 * Scans localStorage for user's history and calculates statistics.
 * @param {string} uid - The user's ID.
 * @returns {Object} Stats object { totalDays, perfectDays, averageScore, history }
 */
export const getReportData = (uid) => {
    if (!uid) return null;

    let totalDays = 0;
    let perfectDays = 0;
    let totalScore = 0;
    const history = [];

    // Scan all keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Key format: awake_data_{uid}_{date}
        if (key.startsWith(`awake_data_${uid}_`)) {
            try {
                const raw = localStorage.getItem(key);
                const data = JSON.parse(raw);
                const dateStr = key.replace(`awake_data_${uid}_`, "");

                if (data.tasks && data.tasks.length > 0) {
                    totalDays++;
                    const completed = data.tasks.filter((t) => t.status === "checked").length;
                    const score = Math.round((completed / data.tasks.length) * 100);

                    totalScore += score;
                    if (score === 100) perfectDays++;

                    history.push({
                        date: dateStr,
                        score,
                        completed: completed,
                        total: data.tasks.length
                    });
                }
            } catch (e) {
                console.warn("Skipping invalid data for key", key);
            }
        }
    }

    // Sort history by date descending
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    const averageScore = totalDays > 0 ? Math.round(totalScore / totalDays) : 0;

    return {
        totalDays,
        perfectDays,
        averageScore,
        history
    };
};

/**
 * Generates a modern PDF report for the user.
 * @param {Object} user - User object { displayName, email, ... }
 * @param {Object} stats - Stats object from getReportData
 */
export const generateUserReportPDF = (user, stats) => {
    const doc = new jsPDF();
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // --- Modern Theme Colors ---
    const primaryColor = [79, 70, 229]; // Indigo-600
    const secondaryColor = [15, 23, 42]; // Slate-900
    const accentColor = [16, 185, 129]; // Emerald-500
    const lightBg = [248, 250, 252]; // Slate-50
    const borderColor = [226, 232, 240]; // Slate-200
    const textColor = [51, 65, 85]; // Slate-600

    // --- Template Background ---
    if (REPORT_BACKGROUND) {
        try {
            doc.addImage(REPORT_BACKGROUND, "JPEG", 0, 0, width, height);
        } catch (e) {
            console.error("Failed to add background to PDF", e);
        }
    }

    // Add Logo if available (Straight placement in header)
    if (AWAKE_LOGO) {
        try {
            doc.addImage(AWAKE_LOGO, "PNG", 20, 15, 20, 20);
        } catch (e) {
            console.error("Failed to add logo to PDF", e);
        }
    }

    doc.setTextColor(...secondaryColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("PROGRESS REPORT", 48, 28);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("AWAKE PERFORMANCE ARCHIVE", 48, 35);

    // --- Personal Details Card ---
    const cardY = 60;
    doc.setFillColor(...lightBg);
    doc.roundedRect(20, cardY, width - 40, 45, 5, 5, "F");
    doc.setDrawColor(...borderColor);
    doc.roundedRect(20, cardY, width - 40, 45, 5, 5, "S");

    doc.setTextColor(...secondaryColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(user.displayName || "Valued User", 35, cardY + 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...textColor);
    doc.text(`Email: ${user.email}`, 35, cardY + 23);
    doc.text(`User ID: ${user.uid.substring(0, 12)}...`, 35, cardY + 28);
    doc.text(`Generated: ${new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}`, 35, cardY + 33);

    // --- Stats Grid ---
    const statsY = 115;
    const boxWidth = (width - 50) / 3;
    const boxHeight = 35;

    // Helper for stats boxes
    const drawStatBox = (x, y, value, label, color) => {
        doc.setFillColor(...lightBg);
        doc.roundedRect(x, y, boxWidth, boxHeight, 4, 4, "F");
        doc.setDrawColor(...borderColor);
        doc.roundedRect(x, y, boxWidth, boxHeight, 4, 4, "S");

        doc.setTextColor(...color);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text(String(value), x + boxWidth / 2, y + 18, { align: "center" });

        doc.setTextColor(...textColor);
        doc.setFont("helvetica", "medium");
        doc.setFontSize(9);
        doc.text(label, x + boxWidth / 2, y + 28, { align: "center" });
    };

    drawStatBox(20, statsY, stats.totalDays, "ACTIVE DAYS", primaryColor);
    drawStatBox(25 + boxWidth, statsY, stats.perfectDays, "PERFECT DAYS", accentColor);
    drawStatBox(30 + boxWidth * 2, statsY, `${stats.averageScore}%`, "AVG SCORE", [245, 158, 11]);

    // --- Activity Summary ---
    doc.setTextColor(...secondaryColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Recent Activity", 20, 165);

    // Draw a simple history table
    let currentY = 175;
    const historyToDisplay = stats.history.slice(0, 10); // Last 10 days

    doc.setFillColor(241, 245, 249);
    doc.rect(20, currentY, width - 40, 8, "F");
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Date", 25, currentY + 5.5);
    doc.text("Score", 80, currentY + 5.5);
    doc.text("Status", 130, currentY + 5.5);

    currentY += 10;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textColor);

    historyToDisplay.forEach((day, index) => {
        if (currentY > height - 40) return;

        doc.text(day.date, 25, currentY);
        doc.text(`${day.score}%`, 80, currentY);

        const status = day.score === 100 ? "PERFECT" : (day.score >= 80 ? "EXCELLENT" : (day.score >= 50 ? "GOOD" : "STEADY"));
        const statusColor = day.score === 100 ? accentColor : (day.score >= 50 ? primaryColor : [100, 100, 100]);

        doc.setTextColor(...statusColor);
        doc.setFont("helvetica", "bold");
        doc.text(status, 130, currentY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...textColor);

        doc.setDrawColor(...borderColor);
        doc.line(20, currentY + 2, width - 20, currentY + 2);
        currentY += 8;
    });

    // --- Footer ---
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Official performance record for ${user.displayName || 'the user'}. Data is locally verified.`, width / 2, height - 15, { align: "center" });
    doc.text("HUMI AWAKE - Elevate Your Daily Life", width / 2, height - 10, { align: "center" });

    // --- Final Save & Sanitize ---
    const cleanName = (user.displayName || "User").replace(/[^a-z0-9]/gi, '_');
    doc.save(`Awake_Report_${cleanName}.pdf`);
};
