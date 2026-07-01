import { Injectable } from "@nestjs/common";
import PDFDocument = require("pdfkit");
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
          margin: 50,
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

        // ─── 1. COVER PAGE ──────────────────────────────────────────────────
        doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0F172A"); // Dark navy primary background

        doc
          .fillColor("#38BDF8")
          .fontSize(32)
          .text("INTERVU-AI", 50, 180, { wordSpacing: 2 });
        doc
          .fillColor("#FFFFFF")
          .fontSize(28)
          .text("CANDIDATE PERFORMANCE REPORT", 50, 220);

        // Horizontal divider line
        doc
          .moveTo(50, 270)
          .lineTo(500, 270)
          .strokeColor("#38BDF8")
          .lineWidth(3)
          .stroke();

        doc.fillColor("#94A3B8").fontSize(14).text("Assessment Title", 50, 310);
        doc
          .fillColor("#FFFFFF")
          .fontSize(18)
          .text(reportData.assessment.title, 50, 330);

        doc.fillColor("#94A3B8").fontSize(14).text("Prepared For", 50, 390);
        doc
          .fillColor("#FFFFFF")
          .fontSize(18)
          .text(reportData.candidate.fullName, 50, 410);
        doc
          .fillColor("#38BDF8")
          .fontSize(14)
          .text(reportData.candidate.email, 50, 430);

        doc
          .fillColor("#94A3B8")
          .fontSize(12)
          .text(`Generated: ${new Date().toLocaleDateString()}`, 50, 680);
        doc
          .fillColor("#38BDF8")
          .fontSize(12)
          .text("CONFIDENTIAL", 400, 680, { align: "right" });

        // ─── 2. ASSESSMENT SUMMARY ──────────────────────────────────────────
        doc.addPage({ margin: 50, size: "A4" });
        doc.fillColor("#1E293B"); // Back to standard text

        // Page Header
        doc
          .fontSize(20)
          .fillColor("#0F172A")
          .text("Assessment Summary", 50, 50);
        doc
          .moveTo(50, 75)
          .lineTo(545, 75)
          .strokeColor("#CBD5E1")
          .lineWidth(1)
          .stroke();

        // Score Grid
        const gridY = 100;
        doc.rect(50, gridY, 150, 80).fill("#F8FAFC");
        doc.rect(220, gridY, 150, 80).fill("#F8FAFC");
        doc.rect(395, gridY, 150, 80).fill("#F8FAFC");

        doc
          .fillColor("#475569")
          .fontSize(11)
          .text("OVERALL SCORE", 60, gridY + 15);
        doc
          .fillColor("#0F172A")
          .fontSize(24)
          .text(`${reportData.score}%`, 60, gridY + 35);

        doc
          .fillColor("#475569")
          .fontSize(11)
          .text("ACCURACY", 230, gridY + 15);
        doc
          .fillColor("#0F172A")
          .fontSize(24)
          .text(`${reportData.accuracy}%`, 230, gridY + 35);

        doc
          .fillColor("#475569")
          .fontSize(11)
          .text("TIME TAKEN", 405, gridY + 15);
        const mins = Math.floor(reportData.timeTaken / 60);
        const secs = reportData.timeTaken % 60;
        doc
          .fillColor("#0F172A")
          .fontSize(20)
          .text(`${mins}m ${secs}s`, 405, gridY + 38);

        // Rank & Percentile
        doc
          .fillColor("#0F172A")
          .fontSize(12)
          .text(`Global Rank: #${reportData.rank}`, 50, 205);
        doc.text(`Percentile: ${reportData.percentile}th percentile`, 220, 205);

        // Section Breakdown Table
        doc.fontSize(16).text("Section Breakdown", 50, 250);
        doc.moveTo(50, 270).lineTo(545, 270).strokeColor("#E2E8F0").stroke();

        let tableY = 285;
        doc.fontSize(11).fillColor("#64748B");
        doc.text("SECTION NAME", 60, tableY);
        doc.text("SCORE", 250, tableY);
        doc.text("CORRECT / TOTAL", 350, tableY);
        doc.text("TIME SPENT", 470, tableY);

        doc
          .moveTo(50, tableY + 15)
          .lineTo(545, tableY + 15)
          .strokeColor("#E2E8F0")
          .stroke();
        tableY += 25;

        reportData.sectionBreakdown.forEach((sec: any) => {
          doc.fillColor("#0F172A");
          doc.text(sec.section || sec.sectionKey || "General", 60, tableY);
          doc.text(`${sec.score}%`, 250, tableY);
          doc.text(`${sec.correct} / ${sec.total}`, 350, tableY);
          const sMins = Math.floor(sec.timeSpent / 60);
          doc.text(`${sMins}m`, 470, tableY);
          tableY += 25;
        });

        // ─── 3. ANALYTICS & RECOMMENDATIONS ────────────────────────────────
        doc.addPage({ margin: 50, size: "A4" });
        doc
          .fontSize(20)
          .fillColor("#0F172A")
          .text("Detailed Analytics & Recommendations", 50, 50);
        doc
          .moveTo(50, 75)
          .lineTo(545, 75)
          .strokeColor("#CBD5E1")
          .lineWidth(1)
          .stroke();

        // Strengths & Weaknesses
        doc.fontSize(14).text("Key Strengths", 50, 100);
        doc.fontSize(11).fillColor("#16A34A"); // Green
        if (reportData.strengths.length > 0) {
          reportData.strengths.forEach((s: string, idx: number) => {
            doc.text(`\u2022 ${s}`, 60, 120 + idx * 18);
          });
        } else {
          doc.text("Keep practicing to identify standout skills.", 60, 120);
        }

        const weaknessY = 190;
        doc
          .fillColor("#0F172A")
          .fontSize(14)
          .text("Areas for Improvement", 50, weaknessY);
        doc.fontSize(11).fillColor("#DC2626"); // Red
        if (reportData.weaknesses.length > 0) {
          reportData.weaknesses.forEach((w: string, idx: number) => {
            doc.text(`\u2022 ${w}`, 60, weaknessY + 20 + idx * 18);
          });
        } else {
          doc.text(
            "No significant weaknesses detected. Great job!",
            60,
            weaknessY + 20,
          );
        }

        // Action Plan Recommendations
        const recY = 300;
        doc
          .fillColor("#0F172A")
          .fontSize(16)
          .text("Recommended Action Plan", 50, recY);
        doc
          .moveTo(50, recY + 20)
          .lineTo(545, recY + 20)
          .strokeColor("#E2E8F0")
          .stroke();

        let recTextY = recY + 35;
        reportData.recommendations
          .slice(0, 3)
          .forEach((r: any, idx: number) => {
            doc
              .fillColor("#0F172A")
              .fontSize(11)
              .text(`${idx + 1}. [${r.priority}] ${r.title}`, 60, recTextY, {
                bold: true,
              } as any);
            doc
              .fillColor("#475569")
              .fontSize(10)
              .text(r.description, 75, recTextY + 15);
            recTextY += 45;
          });

        // Improvement plan list
        const planY = recTextY + 10;
        doc
          .fillColor("#0F172A")
          .fontSize(14)
          .text("Step-by-Step Path", 50, planY);
        let planTextY = planY + 20;
        reportData.improvementPlan.forEach((planItem: string) => {
          doc.fillColor("#475569").fontSize(10).text(planItem, 60, planTextY);
          planTextY += 18;
        });

        // Footer Page numbering
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fillColor("#94A3B8").fontSize(9);
          // Don't draw footer on cover page
          if (i > 0) {
            doc.text(`Page ${i + 1} of ${pages.count}`, 50, 780, {
              align: "center",
            });
          }
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
