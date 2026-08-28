import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { ReportAuditService } from "./report-audit.service";
import { AppLogger } from "@intervu-ai/shared-logger";

@Injectable()
export class PdfReportService {
  private readonly logger = new AppLogger({ name: "PdfReportService" });

  constructor(private readonly auditService: ReportAuditService) {}

  async generatePdfReport(attemptId: string, reportData: any): Promise<Buffer> {
    this.logger.debug("Generating PDF report for attempt", { attemptId });

    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 40,
          size: "A4",
          bufferPages: true,
        });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk: any) => chunks.push(chunk));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(chunks);
          this.auditService
            .logPdfExported(attemptId, { sizeBytes: pdfBuffer.length })
            .catch((err: any) =>
              this.logger.error("Failed to log PDF export audit event", err),
            );
          resolve(pdfBuffer);
        });
        doc.on("error", (err: any) => reject(err));

        const COLORS = {
          primary: "#7C3AED",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          textMain: "#0F172A",
          textMuted: "#64748B",
          border: "#E2E8F0",
          cardBg: "#FFFFFF",
          pageBg: "#FAFAFA",
        };

        // Helper: format time
        const formatTimeSpent = (timeInSecs: number) => {
          if (!timeInSecs || timeInSecs <= 0) return "0s";
          const m = Math.floor(timeInSecs / 60);
          const s = Math.round(timeInSecs % 60);
          if (m === 0) return `${s}s`;
          if (s === 0) return `${m}m`;
          return `${m}m ${s}s`;
        };

        const drawCard = (x: number, y: number, w: number, h: number) => {
          doc
            .roundedRect(x, y, w, h, 12)
            .fillAndStroke(COLORS.cardBg, COLORS.border);
        };

        const drawBadge = (
          text: string,
          x: number,
          y: number,
          color: string,
          bg: string,
          w = 60,
        ) => {
          doc.roundedRect(x, y, w, 20, 6).fill(bg);
          doc
            .fillColor(color)
            .fontSize(9)
            .text(text, x, y + 6, { width: w, align: "center" });
        };

        // --- PAGE 1: COVER PAGE ---
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.pageBg);

        // Header
        doc
          .fillColor(COLORS.primary)
          .fontSize(28)
          .font("Helvetica-Bold")
          .text("SkillitriX", 40, 60);
        doc
          .fillColor(COLORS.textMuted)
          .fontSize(12)
          .font("Helvetica")
          .text("CANDIDATE ASSESSMENT REPORT", 40, 95, { characterSpacing: 2 });

        doc
          .moveTo(40, 120)
          .lineTo(555, 120)
          .strokeColor(COLORS.border)
          .lineWidth(1)
          .stroke();

        // BUG-001: Safe null-coalescing for candidate and assessment fields
        const candidateName =
          reportData.candidate?.fullName ||
          reportData.candidateName ||
          "Candidate";
        const candidateEmail =
          reportData.candidate?.email || reportData.email || "N/A";
        const assessmentTitle =
          reportData.assessment?.title ||
          reportData.assessmentName ||
          "Assessment";
        const reportScore = reportData.score ?? 0;
        const reportAccuracy = reportData.accuracy ?? 0;
        const reportTimeTaken = reportData.timeTaken ?? 0;
        const reportPercentile = reportData.percentile ?? 0;
        const reportRank = reportData.rank ?? 0;

        // Candidate Info
        doc
          .fillColor(COLORS.textMain)
          .fontSize(24)
          .font("Helvetica-Bold")
          .text(candidateName, 40, 150);
        doc
          .fillColor(COLORS.textMuted)
          .fontSize(14)
          .font("Helvetica")
          .text(candidateEmail, 40, 180);

        doc
          .fontSize(12)
          .text(`Assessment: `, 40, 220, { continued: true })
          .fillColor(COLORS.textMain)
          .font("Helvetica-Bold")
          .text(assessmentTitle);
        doc
          .fillColor(COLORS.textMuted)
          .font("Helvetica")
          .text(`Submission ID: `, 40, 240, { continued: true })
          .fillColor(COLORS.textMain)
          .text(attemptId);
        doc
          .fillColor(COLORS.textMuted)
          .font("Helvetica")
          .text(`Generated: `, 40, 260, { continued: true })
          .fillColor(COLORS.textMain)
          .text(new Date().toLocaleDateString());

        // Qualification Banner
        const isQualified = reportScore >= 70;
        const qualStatus =
          reportData.qualification?.status ||
          (isQualified ? "QUALIFIED" : "NOT QUALIFIED");
        const bannerColor =
          qualStatus.toUpperCase() === "QUALIFIED" ||
          qualStatus.toUpperCase() === "PASS"
            ? COLORS.success
            : COLORS.danger;

        doc.roundedRect(40, 310, 515, 60, 12).fill(bannerColor);
        doc
          .fillColor("#FFFFFF")
          .fontSize(20)
          .font("Helvetica-Bold")
          .text(qualStatus.toUpperCase(), 40, 332, {
            width: 515,
            align: "center",
          });

        // Performance Summary Cards
        doc
          .fillColor(COLORS.textMain)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Performance Summary", 40, 410);

        const cardWidth = 160;
        const cardHeight = 80;

        // Card 1: Score
        drawCard(40, 440, cardWidth, cardHeight);
        doc
          .fillColor(COLORS.textMuted)
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("OVERALL SCORE", 55, 455);
        doc
          .fillColor(COLORS.textMain)
          .fontSize(24)
          .font("Helvetica-Bold")
          .text(`${reportScore}/100`, 55, 475);

        // Card 2: Accuracy
        drawCard(217, 440, cardWidth, cardHeight);
        doc
          .fillColor(COLORS.textMuted)
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("ACCURACY", 232, 455);
        doc
          .fillColor(COLORS.textMain)
          .fontSize(24)
          .font("Helvetica-Bold")
          .text(`${reportAccuracy}%`, 232, 475);

        // Card 3: Time Taken
        drawCard(395, 440, cardWidth, cardHeight);
        doc
          .fillColor(COLORS.textMuted)
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("TIME TAKEN", 410, 455);
        doc
          .fillColor(COLORS.textMain)
          .fontSize(24)
          .font("Helvetica-Bold")
          .text(formatTimeSpent(reportTimeTaken), 410, 475);

        // Card 4: Percentile
        drawCard(40, 535, cardWidth, cardHeight);
        doc
          .fillColor(COLORS.textMuted)
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("PERCENTILE", 55, 550);
        doc
          .fillColor(COLORS.textMain)
          .fontSize(24)
          .font("Helvetica-Bold")
          .text(`${reportPercentile}th`, 55, 570);

        // Card 5: Rank
        drawCard(217, 535, cardWidth, cardHeight);
        doc
          .fillColor(COLORS.textMuted)
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("GLOBAL RANK", 232, 550);
        doc
          .fillColor(COLORS.textMain)
          .fontSize(24)
          .font("Helvetica-Bold")
          .text(`#${reportRank}`, 232, 570);

        // --- PAGE 2: SECTION PERFORMANCE ---
        doc.addPage({ margin: 40, size: "A4" });
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.pageBg);

        doc
          .fillColor(COLORS.textMain)
          .fontSize(18)
          .font("Helvetica-Bold")
          .text("Section Performance", 40, 50);
        drawCard(40, 80, 515, 300); // Container for section performance

        // Table Header
        let secY = 100;
        doc.fillColor(COLORS.textMuted).fontSize(10).font("Helvetica-Bold");
        doc.text("SECTION NAME", 60, secY);
        doc.text("SCORE", 250, secY);
        doc.text("ACCURACY", 330, secY);
        doc.text("STATUS", 440, secY);
        doc
          .moveTo(40, secY + 20)
          .lineTo(555, secY + 20)
          .strokeColor(COLORS.border)
          .stroke();

        secY += 35;
        if (
          reportData.sectionBreakdown &&
          reportData.sectionBreakdown.length > 0
        ) {
          reportData.sectionBreakdown.forEach((sec: any) => {
            doc
              .fillColor(COLORS.textMain)
              .fontSize(11)
              .font("Helvetica-Bold")
              .text(sec.section || sec.sectionKey || "General", 60, secY, {
                width: 180,
                lineBreak: false,
              });
            doc
              .fillColor(COLORS.textMuted)
              .font("Helvetica")
              .text(`${sec.score || 0}%`, 250, secY);
            doc.text(`${sec.correct || 0}/${sec.total || 0}`, 330, secY);

            const isPass = (sec.score || 0) >= 50;
            const statusTxt = isPass ? "PASS" : "FAIL";
            const sColor = isPass ? COLORS.success : COLORS.danger;
            const sBg = isPass ? "#D1FAE5" : "#FEE2E2"; // Light emerald / Light red
            drawBadge(statusTxt, 440, secY - 4, sColor, sBg, 60);

            // Progress bar
            const barW = 475;
            doc.roundedRect(60, secY + 20, barW, 6, 3).fill(COLORS.border);
            const fillW = Math.max(
              0,
              Math.min(barW, (barW * (sec.score || 50)) / 100),
            );
            if (fillW > 0)
              doc.roundedRect(60, secY + 20, fillW, 6, 3).fill(COLORS.primary);

            secY += 50;
          });
        } else {
          doc
            .fillColor(COLORS.textMuted)
            .font("Helvetica")
            .text("No section data available.", 60, secY);
        }

        // --- STRENGTHS & IMPROVEMENT AREAS ---
        const swY = 410;
        doc
          .fillColor(COLORS.textMain)
          .fontSize(18)
          .font("Helvetica-Bold")
          .text("Strengths & Improvement Areas", 40, swY);

        // Left Card (Strengths)
        drawCard(40, swY + 30, 250, 200);
        doc
          .fillColor(COLORS.success)
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Top Strengths", 55, swY + 45);
        doc.fillColor(COLORS.textMain).fontSize(10).font("Helvetica");
        let sy = swY + 75;
        if (reportData.strengths && reportData.strengths.length > 0) {
          reportData.strengths.slice(0, 3).forEach((s: any) => {
            doc.text(`• ${s.title || s}`, 55, sy, { width: 220 });
            sy += 25;
          });
        } else {
          doc.text("Consistent overall performance.", 55, sy);
        }

        // Right Card (Weaknesses)
        drawCard(305, swY + 30, 250, 200);
        doc
          .fillColor(COLORS.warning)
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Needs Improvement", 320, swY + 45);
        doc.fillColor(COLORS.textMain).fontSize(10).font("Helvetica");
        let wy = swY + 75;
        if (reportData.weaknesses && reportData.weaknesses.length > 0) {
          reportData.weaknesses.slice(0, 3).forEach((w: any) => {
            doc.text(`• ${w.title || w}`, 320, wy, { width: 220 });
            wy += 25;
          });
        } else {
          doc.text("No critical weaknesses detected.", 320, wy);
        }

        // --- PAGE 3: AI RECOMMENDATIONS ---
        doc.addPage({ margin: 40, size: "A4" });
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.pageBg);

        doc
          .fillColor(COLORS.textMain)
          .fontSize(18)
          .font("Helvetica-Bold")
          .text("AI Insights & Recommendations", 40, 50);

        drawCard(40, 80, 515, 300);
        doc
          .fillColor(COLORS.primary)
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Actionable Next Steps", 60, 100);

        let recY = 135;
        if (
          reportData.recommendations &&
          reportData.recommendations.length > 0
        ) {
          reportData.recommendations.slice(0, 4).forEach((rec: any) => {
            doc
              .fillColor(COLORS.textMain)
              .fontSize(11)
              .font("Helvetica-Bold")
              .text(rec.title || "Recommendation", 60, recY);
            doc
              .fillColor(COLORS.textMuted)
              .fontSize(10)
              .font("Helvetica")
              .text(
                rec.description || rec.action || String(rec),
                60,
                recY + 15,
                { width: 475 },
              );
            recY += 45;
          });
        } else {
          doc
            .fillColor(COLORS.textMuted)
            .fontSize(10)
            .font("Helvetica")
            .text(
              "Continue practicing regularly to maintain and improve your skills.",
              60,
              recY,
            );
        }

        // --- FOOTER FOR ALL PAGES ---
        const pages = doc.bufferedPageRange();
        let oldBottomMargin: any = 0;
        if (doc.options.margins) {
          oldBottomMargin = doc.options.margins.bottom;
          doc.options.margins.bottom = 0; // Prevent auto page-break
        }
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fillColor(COLORS.textMuted).fontSize(9).font("Helvetica");
          if (i > 0) {
            // No footer on cover page
            doc.text(`Page ${i + 1} of ${pages.count}`, 40, 810, {
              align: "left",
              lineBreak: false,
            });
            doc.text("SkillitriX - Confidential Report", 40, 810, {
              align: "right",
              lineBreak: false,
            });
          }
        }
        if (doc.options.margins) {
          doc.options.margins.bottom = oldBottomMargin;
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
