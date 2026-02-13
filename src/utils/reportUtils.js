import { jsPDF } from "jspdf";
import { AWAKE_LOGO } from "./assets";
import BG1_PATH from "../assets/report-background-2.jpg";
import BG2_PATH from "../assets/report-background-1.jpg";

import { FirestoreService } from "../services/firestore-service";

/**
 * Fetches user's history from Firestore and calculates statistics.
 * @param {string} uid - The user's ID.
 * @returns {Promise<Object>} Stats object { totalDays, perfectDays, averageScore, history }
 */
export const getReportData = async (uid) => {
    if (!uid) return null;

    let totalDays = 0;
    let perfectDays = 0;
    let totalScore = 0;
    const history = [];

    try {
        const daysData = await FirestoreService.getCollection(`users/${uid}/days`);

        // Process retrieved documents
        daysData.forEach(data => {
            // Check for valid task data
            if (data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
                totalDays++;
                const completed = data.tasks.filter((t) => t.status === "checked").length;
                const score = Math.round((completed / data.tasks.length) * 100);

                totalScore += score;
                if (score === 100) perfectDays++;

                // Use document ID (which is the date string) if date field missing, or data.date
                const dateStr = data.id || data.date;

                history.push({
                    date: dateStr,
                    score,
                    completed,
                    total: data.tasks.length
                });
            }
        });

    } catch (e) {
        console.error("Failed to fetch report data from Firestore", e);
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

// Helper to load image
const loadImage = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
};

/**
 * Generates a modern PDF report for the user.
 * @param {Object} user - User object { displayName, email, ... }
 * @param {Object} stats - Stats object from getReportData
 */
export const generateUserReportPDF = async (user, stats) => {
    const doc = new jsPDF();
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // --- Load Assets ---
    let bg1, bg2;
    try {
        bg1 = await loadImage(BG1_PATH);
        bg2 = await loadImage(BG2_PATH);
    } catch (e) {
        console.error("Failed to load report backgrounds", e);
    }

    // --- Modern Theme Colors ---
    const primaryColor = [79, 70, 229]; // Indigo-600
    const secondaryColor = [15, 23, 42]; // Slate-900
    const accentColor = [16, 185, 129]; // Emerald-500
    const lightBg = [248, 250, 252]; // Slate-50
    const borderColor = [226, 232, 240]; // Slate-200
    const textColor = [51, 65, 85]; // Slate-600

    // --- Page 1 Background ---
    if (bg1) {
        try {
            doc.addImage(bg1, "JPEG", 0, 0, width, height);
        } catch (e) {
            console.error("Failed to add background 1 to PDF", e);
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
    const historyToDisplay = stats.history; // Show full history

    // Helper to draw table header
    const drawTableHeader = (y) => {
        doc.setFillColor(241, 245, 249);
        doc.rect(20, y, width - 40, 8, "F");
        doc.setTextColor(...secondaryColor);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Date", 25, y + 5.5);
        doc.text("Score", 80, y + 5.5);
        doc.text("Status", 130, y + 5.5);
    };

    drawTableHeader(currentY);
    currentY += 10;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textColor);

    historyToDisplay.forEach((day, index) => {
        // Check for overflow
        if (currentY > height - 30) {
            doc.addPage();
            // Add Page 2+ Background
            if (bg2) {
                try {
                    doc.addImage(bg2, "JPEG", 0, 0, width, height);
                } catch (e) {
                    console.error("Failed to add background 2 to PDF", e);
                }
            }
            currentY = 40; // Reset Y
            drawTableHeader(currentY);
            currentY += 10;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...textColor);
        }

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

    // --- Footer (Only on last page? Or all? Usually last page for signature/record) ---
    // User instruction: "AND OTHER INSTRUCTIONS ARE SAME AS BEFORE"
    // Previous code had footer. I'll add it to the last page.
    if (currentY > height - 20) {
        doc.addPage();
        if (bg2) doc.addImage(bg2, "JPEG", 0, 0, width, height);
    }

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Official performance record for ${user.displayName || 'the user'}. Data is locally verified.`, width / 2, height - 15, { align: "center" });
    doc.text("HUMI AWAKE - Elevate Your Daily Life", width / 2, height - 10, { align: "center" });

    // --- Final Save & Sanitize ---
    const cleanName = (user.displayName || "User").replace(/[^a-z0-9]/gi, '_');
    doc.save(`Awake_Report_${cleanName}.pdf`);
};
