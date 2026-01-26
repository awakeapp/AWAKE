import { jsPDF } from "jspdf";

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
 * Generates a PDF credential report for the user.
 * @param {Object} user - User object { displayName, email, ... }
 * @param {Object} stats - Stats object from getReportData
 */
export const generateCredentialPDF = (user, stats) => {
    const doc = new jsPDF();
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // --- Header / Letterhead ---
    // Blue banner top
    doc.setFillColor(79, 70, 229); // Indigo-600
    doc.rect(0, 0, width, 40, "F");

    // Logo Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("HUMI AWAKE", 20, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Official User Credential Report", 20, 32);

    // --- User Info ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Credential Owner: ${user.displayName || "Valued User"}`, 20, 60);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Email: ${user.email}`, 20, 66);
    doc.text(`Generated on: ${new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}`, 20, 72);

    // --- Stats Section ---
    const startY = 90;

    // Box 1: Total Days
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.roundedRect(20, startY, 50, 30, 3, 3, "FD");
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.text(String(stats.totalDays), 45, startY + 15, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Active Days", 45, startY + 24, { align: "center" });

    // Box 2: Perfect Days
    doc.roundedRect(80, startY, 50, 30, 3, 3, "FD");
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129); // Emerald-500
    doc.setFont("helvetica", "bold");
    doc.text(String(stats.perfectDays), 105, startY + 15, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Perfect Days", 105, startY + 24, { align: "center" });

    // Box 3: Avg Score
    doc.roundedRect(140, startY, 50, 30, 3, 3, "FD");
    doc.setFontSize(20);
    doc.setTextColor(245, 158, 11); // Amber-500
    doc.setFont("helvetica", "bold");
    doc.text(`${stats.averageScore}%`, 165, startY + 15, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Average Score", 165, startY + 24, { align: "center" });

    // --- Verified Seal ---
    // Bottom Right Seal
    const sealX = width - 40;
    const sealY = height - 40;

    // Outer circle
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(1);
    doc.circle(sealX, sealY, 20, "S");

    // Inner circle
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.circle(sealX, sealY, 18, "S");

    // Text inside
    doc.setFontSize(8);
    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.text("VERIFIED", sealX, sealY, { align: "center", angle: 0 });
    doc.text("USER", sealX, sealY + 4, { align: "center", angle: 0 });

    // Stars
    doc.text("* * *", sealX, sealY + 8, { align: "center" });

    // --- Footer Text ---
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("This document certifies the routine performance of the user in Humi Awake.", width / 2, height - 10, { align: "center" });

    // Save
    doc.save(`Awake_Credential_${user.displayName || "User"}.pdf`);
};
