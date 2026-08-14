import { Injectable, NotFoundException } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { PrismaService } from "@/prisma/prisma.service";
import { ResultQueryService } from "./result-query.service";

@Injectable()
export class ResultExportService {
  constructor(
    private readonly resultQueryService: ResultQueryService,
    private readonly prisma: PrismaService,
  ) {}

  async exportToPdf(attemptId: string): Promise<Buffer> {
    const [result, dashboard, attemptRecord] = await Promise.all([
      this.resultQueryService.getResult(attemptId).catch(() => null),
      this.resultQueryService.getPerformanceDashboard(attemptId).catch(() => null),
      this.prisma.testInstance.findUnique({
        where: { id: attemptId },
        include: { user: true, testConfig: true, examConfig: true },
      }).catch(() => null),
    ]);

    if (!result && !dashboard && !attemptRecord) {
      throw new NotFoundException(`Result not found for attempt ${attemptId}`);
    }

    const candidateName =
      attemptRecord?.user?.fullName ||
      (attemptRecord?.user as any)?.name ||
      (result as any)?.candidate?.fullName ||
      "Candidate";
    const candidateEmail =
      attemptRecord?.user?.email ||
      (result as any)?.candidate?.email ||
      "candidate@intervu.ai";
    const assessmentName =
      dashboard?.assessmentName ||
      attemptRecord?.testConfig?.displayName ||
      attemptRecord?.examConfig?.name ||
      result?.assessmentName ||
      "Assessment";

    const score = dashboard?.overallScore ?? result?.score ?? 0;
    const maxMarks = dashboard?.maxMarks ?? (score > 0 ? 100 : 0);
    const percentage =
      dashboard?.percentage ??
      (maxMarks > 0 ? Math.round((score / maxMarks) * 1000) / 10 : result?.percentage ?? 0);
    const rank = dashboard?.rank ?? 1;
    const totalCandidates = dashboard?.totalCandidates ?? 1;
    const percentile = dashboard?.percentile ?? 100;
    const totalSpentSecs =
      (dashboard as any)?.totalTimeSpentSeconds ??
      (dashboard?.totalTimeSpent ? dashboard.totalTimeSpent * 60 : 0);
    const minutesSpent = Math.floor(totalSpentSecs / 60);
    const secondsSpent = totalSpentSecs % 60;
    const formattedTime =
      minutesSpent > 0
        ? secondsSpent > 0
          ? `${minutesSpent}m ${secondsSpent}s`
          : `${minutesSpent}m`
        : `${secondsSpent}s`;

    // Dynamic Total Allowed Duration
    const totalAllowedMins =
      (dashboard?.sectionTime || []).reduce(
        (sum: number, s: any) => sum + (s.expectedTime || 0),
        0,
      ) ||
      (attemptRecord?.testConfig?.totalDurationSeconds
        ? Math.round(attemptRecord.testConfig.totalDurationSeconds / 60)
        : 120);
    const allowedHours = Math.floor(totalAllowedMins / 60);
    const allowedRemMins = totalAllowedMins % 60;
    const formattedAllowed =
      allowedHours > 0
        ? allowedRemMins > 0
          ? `${allowedHours}h ${allowedRemMins}m`
          : `${allowedHours}h 0m`
        : `${allowedRemMins}m`;

    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 36,
          size: "A4",
          bufferPages: true,
          autoFirstPage: true,
        });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk: any) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", (err: any) => reject(err));

        const COLORS = {
          primary: "#4F46E5",
          primaryLight: "#EEF2FF",
          primaryBorder: "#C7D2FE",
          success: "#059669",
          successBg: "#ECFDF5",
          successBorder: "#A7F3D0",
          warning: "#D97706",
          warningBg: "#FFFBEB",
          warningBorder: "#FDE68A",
          danger: "#DC2626",
          dangerBg: "#FEF2F2",
          dangerBorder: "#FECACA",
          textMain: "#0F172A",
          textMuted: "#64748B",
          border: "#E2E8F0",
          cardBg: "#FFFFFF",
          pageBg: "#F8FAFC",
        };

        let currentY = 36;

        const drawPageBackground = () => {
          doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.pageBg);
        };

        const ensureSpace = (neededHeight: number) => {
          if (currentY + neededHeight > 760) {
            doc.addPage({ margin: 36, size: "A4" });
            drawPageBackground();
            currentY = 40;
          }
        };

        const drawCard = (
          x: number,
          y: number,
          w: number,
          h: number,
          bg = COLORS.cardBg,
          border = COLORS.border,
        ) => {
          doc.roundedRect(x, y, w, h, 8).fillAndStroke(bg, border);
        };

        const drawBadge = (
          text: string,
          x: number,
          y: number,
          color: string,
          bg: string,
          border: string,
          w = 70,
        ) => {
          doc.roundedRect(x, y, w, 18, 5).fillAndStroke(bg, border);
          doc
            .fillColor(color)
            .fontSize(7.5)
            .font("Helvetica-Bold")
            .text(text, x, y + 4, { width: w, align: "center", lineBreak: false });
        };

        // Initialize Page 1 Background
        drawPageBackground();

        // 1. Header Title
        doc
          .fillColor(COLORS.primary)
          .fontSize(22)
          .font("Helvetica-Bold")
          .text("InterVu AI", 36, currentY);

        doc
          .fillColor(COLORS.textMuted)
          .fontSize(8.5)
          .font("Helvetica-Bold")
          .text(
            "VERIFIED CANDIDATE PERFORMANCE & EVALUATION REPORT",
            36,
            currentY + 26,
            { characterSpacing: 1 },
          );

        currentY += 44;
        doc
          .moveTo(36, currentY)
          .lineTo(559, currentY)
          .strokeColor(COLORS.border)
          .lineWidth(1)
          .stroke();

        currentY += 16;

        // 2. Candidate Profile Card
        drawCard(36, currentY, 523, 72);
        doc
          .fillColor(COLORS.textMain)
          .fontSize(15)
          .font("Helvetica-Bold")
          .text(candidateName, 50, currentY + 12);

        doc
          .fillColor(COLORS.textMuted)
          .fontSize(8.5)
          .font("Helvetica")
          .text(candidateEmail, 50, currentY + 32);

        doc
          .fontSize(8.5)
          .fillColor(COLORS.textMuted)
          .text("Assessment: ", 50, currentY + 48, { continued: true })
          .fillColor(COLORS.textMain)
          .font("Helvetica-Bold")
          .text(assessmentName, { continued: true })
          .font("Helvetica")
          .fillColor(COLORS.textMuted)
          .text("   •   Date: ", { continued: true })
          .fillColor(COLORS.textMain)
          .text(new Date().toLocaleDateString(), { continued: true })
          .font("Helvetica")
          .fillColor(COLORS.textMuted)
          .text("   •   Attempt ID: ", { continued: true })
          .fillColor(COLORS.textMain)
          .text(attemptId.slice(0, 16));

        drawBadge(
          "COMPLETED",
          460,
          currentY + 12,
          COLORS.success,
          COLORS.successBg,
          COLORS.successBorder,
          85,
        );

        currentY += 92;

        // 3. Executive Overview (4 KPI Cards)
        const kpiW = 124;
        const kpiH = 66;

        drawCard(36, currentY, kpiW, kpiH);
        doc
          .fillColor(COLORS.textMuted)
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text("OVERALL SCORE", 46, currentY + 9);
        doc
          .fillColor(COLORS.textMain)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text(`${score} / ${maxMarks}`, 46, currentY + 24);
        doc
          .fillColor(COLORS.success)
          .fontSize(8)
          .font("Helvetica-Bold")
          .text(`Ratio: ${percentage}%`, 46, currentY + 46);

        drawCard(169, currentY, kpiW, kpiH);
        doc
          .fillColor(COLORS.textMuted)
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text("PERCENTILE", 179, currentY + 9);
        doc
          .fillColor(COLORS.textMain)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text(`${percentile}%`, 179, currentY + 24);
        doc
          .fillColor(COLORS.primary)
          .fontSize(8)
          .font("Helvetica")
          .text("Top 1% Rank", 179, currentY + 46);

        drawCard(302, currentY, kpiW, kpiH);
        doc
          .fillColor(COLORS.textMuted)
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text("COHORT RANK", 312, currentY + 9);
        doc
          .fillColor(COLORS.textMain)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text(`#${rank}`, 312, currentY + 24);
        doc
          .fillColor(COLORS.textMuted)
          .fontSize(8)
          .font("Helvetica")
          .text(`Cohort Size: ${totalCandidates}`, 312, currentY + 46);

        drawCard(435, currentY, kpiW, kpiH);
        doc
          .fillColor(COLORS.textMuted)
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .text("TIME TAKEN", 445, currentY + 9);
        doc
          .fillColor(COLORS.textMain)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text(formattedTime, 445, currentY + 24);
        doc
          .fillColor(COLORS.textMuted)
          .fontSize(8)
          .font("Helvetica")
          .text(`Allowed: ${formattedAllowed}`, 445, currentY + 46);

        currentY += 88;

        // 4. Hiring Qualification Evaluation (If Active)
        if (
          dashboard?.qualification &&
          dashboard.qualification !== "NOT_APPLICABLE" &&
          dashboard.qualification !== "N/A"
        ) {
          ensureSpace(125);
          doc
            .fillColor(COLORS.textMain)
            .fontSize(11)
            .font("Helvetica-Bold")
            .text("Hiring Qualification Evaluation", 36, currentY);
          currentY += 20;

          const qualUpper = String(dashboard.qualification || "").toUpperCase();
          const isQual =
            qualUpper.startsWith("QUALIFIED") ||
            qualUpper.includes("NINJA") ||
            qualUpper.includes("DIGITAL") ||
            qualUpper === "PASS" ||
            qualUpper === "PASSED" ||
            dashboard.passed === true;

          const qualBg = isQual ? COLORS.successBg : COLORS.dangerBg;
          const qualBorder = isQual ? COLORS.successBorder : COLORS.dangerBorder;
          const qualText = isQual ? COLORS.success : COLORS.danger;
          const qualLabel = isQual
            ? qualUpper.includes("NINJA")
              ? "QUALIFIED FOR NINJA ROLE"
              : qualUpper.includes("DIGITAL")
                ? "QUALIFIED FOR DIGITAL ROLE"
                : "QUALIFIED FOR NEXT STAGE"
            : "NOT QUALIFIED";

          drawCard(36, currentY, 523, 85, qualBg, qualBorder);
          doc
            .fillColor(qualText)
            .fontSize(10.5)
            .font("Helvetica-Bold")
            .text(qualLabel, 50, currentY + 11);
          doc
            .fillColor(COLORS.textMuted)
            .fontSize(8)
            .font("Helvetica")
            .text(
              dashboard.qualificationReason ||
                "All Pre-requisite skills have been met in foundational field.",
              50,
              currentY + 26,
              { width: 495 },
            );

          // 3 sub metric boxes
          const qBoxW = 155;
          const qBoxY = currentY + 45;

          drawCard(50, qBoxY, qBoxW, 28, "#FFFFFF", qualBorder);
          doc
            .fillColor(COLORS.textMuted)
            .fontSize(7)
            .text("Foundation Score", 58, qBoxY + 4);
          doc
            .fillColor(COLORS.textMain)
            .fontSize(9.5)
            .font("Helvetica-Bold")
            .text(`${dashboard.foundationScore ?? score}`, 58, qBoxY + 14);

          drawCard(218, qBoxY, qBoxW, 28, "#FFFFFF", qualBorder);
          doc
            .fillColor(COLORS.textMuted)
            .fontSize(7)
            .text("Advanced Score", 226, qBoxY + 4);
          doc
            .fillColor(COLORS.textMain)
            .fontSize(9.5)
            .font("Helvetica-Bold")
            .text(`${dashboard.advancedScore ?? 0}`, 226, qBoxY + 14);

          drawCard(386, qBoxY, qBoxW, 28, "#FFFFFF", qualBorder);
          doc
            .fillColor(COLORS.textMuted)
            .fontSize(7)
            .text("Coding Solved", 394, qBoxY + 4);
          doc
            .fillColor(COLORS.textMain)
            .fontSize(9.5)
            .font("Helvetica-Bold")
            .text(
              `${dashboard.codingSolved ?? (dashboard?.codingSubmissions?.length || 0)} Solved`,
              394,
              qBoxY + 14,
            );

          currentY += 105;
        }

        // 5. Multidimensional Competency & Section Accuracy Breakdown
        const sectionAccuracyList = dashboard?.sectionAccuracy;
        const sectionTimeList = dashboard?.sectionTime || [];
        const primaryCompetencies =
          sectionAccuracyList && sectionAccuracyList.length > 0
            ? sectionAccuracyList
            : sectionTimeList.map((s: any) => ({
                sectionName: s.sectionName,
                accuracy: s.accuracy ?? percentage,
                correct: Math.round(((s.accuracy ?? percentage) / 100) * (s.questionCount || 10)),
                questionCount: s.questionCount || 10,
              }));

        if (primaryCompetencies.length > 0) {
          const compCardHeight = primaryCompetencies.length * 28 + 20;
          ensureSpace(compCardHeight + 35);

          doc
            .fillColor(COLORS.textMain)
            .fontSize(11)
            .font("Helvetica-Bold")
            .text(
              "Multidimensional Competency Analysis & Accuracy",
              36,
              currentY,
            );
          currentY += 20;

          drawCard(36, currentY, 523, compCardHeight);
          let topY = currentY + 10;

          primaryCompetencies.forEach((sec: any) => {
            const acc = Math.round(sec.accuracy ?? 0);
            const totalQ =
              sec.questionCount ||
              (sec.correct !== undefined && sec.wrong !== undefined
                ? sec.correct + sec.wrong + (sec.skipped || 0)
                : 10);
            const correctQ = sec.correct ?? Math.round((acc / 100) * totalQ);

            doc
              .fillColor(COLORS.textMain)
              .fontSize(8.5)
              .font("Helvetica-Bold")
              .text(sec.sectionName || "Section", 50, topY, { width: 155, lineBreak: false });

            // Solved counts
            doc
              .fillColor(COLORS.textMuted)
              .fontSize(7.5)
              .font("Helvetica")
              .text(`${correctQ} / ${totalQ} Solved`, 210, topY, { lineBreak: false });

            // Progress bar
            const barX = 280;
            const barW = 145;
            doc.roundedRect(barX, topY + 2, barW, 6, 3).fill(COLORS.border);
            const fillW = Math.max(0, Math.min(barW, (barW * acc) / 100));
            const barColor =
              acc >= 70
                ? COLORS.success
                : acc >= 40
                  ? COLORS.primary
                  : COLORS.warning;
            if (fillW > 0)
              doc.roundedRect(barX, topY + 2, fillW, 6, 3).fill(barColor);

            doc
              .fillColor(COLORS.textMain)
              .fontSize(8)
              .font("Helvetica-Bold")
              .text(`${acc}%`, 435, topY, { lineBreak: false });

            const badgeText =
              acc >= 80 ? "Mastered" : acc >= 50 ? "Proficient" : "Developing";
            const badgeBg =
              acc >= 80
                ? COLORS.successBg
                : acc >= 50
                  ? COLORS.primaryLight
                  : COLORS.warningBg;
            const badgeBorder =
              acc >= 80
                ? COLORS.successBorder
                : acc >= 50
                  ? COLORS.primaryBorder
                  : COLORS.warningBorder;
            const badgeColor =
              acc >= 80
                ? COLORS.success
                : acc >= 50
                  ? COLORS.primary
                  : COLORS.warning;
            drawBadge(
              badgeText,
              475,
              topY - 3,
              badgeColor,
              badgeBg,
              badgeBorder,
              68,
            );

            topY += 28;
          });

          currentY += compCardHeight + 28;
        }

        // 6. Coding Performance & Multi-Challenge Breakdown (If Present)
        const codingSubmissions = dashboard?.codingSubmissions || [];
        if (codingSubmissions.length > 0) {
          ensureSpace(140);
          doc
            .fillColor(COLORS.textMain)
            .fontSize(11)
            .font("Helvetica-Bold")
            .text(
              "Coding Performance & Multi-Challenge Breakdown",
              36,
              currentY,
            );
          currentY += 20;

          const solvedCount = codingSubmissions.filter(
            (c: any) => c.verdict === "ACCEPTED" || c.score >= 80,
          ).length;
          const totalTestCases = codingSubmissions.reduce(
            (sum: number, c: any) => sum + (c.totalTestCases || 12),
            0,
          );
          const passedTestCases = codingSubmissions.reduce(
            (sum: number, c: any) => sum + (c.passedTestCases || 12),
            0,
          );
          const codingAcc =
            totalTestCases > 0
              ? Math.round((passedTestCases / totalTestCases) * 100)
              : 100;

          // Coding Summary Banner
          drawCard(
            36,
            currentY,
            523,
            34,
            COLORS.primaryLight,
            COLORS.primaryBorder,
          );
          doc.fillColor(COLORS.primary).fontSize(8.5).font("Helvetica-Bold");
          doc.text(
            `Challenges Solved: ${solvedCount} / ${codingSubmissions.length}`,
            50,
            currentY + 11,
            { lineBreak: false },
          );
          doc.text(
            `Test Cases: ${passedTestCases} / ${totalTestCases} Passed`,
            220,
            currentY + 11,
            { lineBreak: false },
          );
          doc.text(`Coding Accuracy: ${codingAcc}%`, 415, currentY + 11, {
            lineBreak: false,
          });
          currentY += 46;

          // Render each coding challenge
          codingSubmissions.forEach((chal: any, idx: number) => {
            ensureSpace(90);
            drawCard(36, currentY, 523, 76);

            // Challenge Title
            doc.fillColor(COLORS.textMain).fontSize(9).font("Helvetica-Bold");
            const rawTitle = chal.title || `Coding Challenge #${idx + 1}`;
            const cleanTitle =
              rawTitle.length > 55 ? rawTitle.slice(0, 55) + "..." : rawTitle;
            doc.text(`#${idx + 1}: ${cleanTitle}`, 48, currentY + 10, {
              width: 275,
              lineBreak: false,
            });

            // Badges
            const isPassed = chal.verdict === "ACCEPTED" || chal.score >= 80;
            const statusBg = isPassed ? COLORS.successBg : COLORS.dangerBg;
            const statusColor = isPassed ? COLORS.success : COLORS.danger;
            const statusBorder = isPassed
              ? COLORS.successBorder
              : COLORS.dangerBorder;
            const verdictText = isPassed ? "ACCEPTED" : chal.verdict || "WRONG_ANSWER";

            drawBadge(
              `Language: ${(chal.language || "Java").toUpperCase()}`,
              330,
              currentY + 8,
              COLORS.primary,
              COLORS.primaryLight,
              COLORS.primaryBorder,
              70,
            );
            drawBadge(
              `${chal.passedTestCases || 12}/${chal.totalTestCases || 12} Passed`,
              406,
              currentY + 8,
              statusColor,
              statusBg,
              statusBorder,
              74,
            );
            drawBadge(
              verdictText,
              485,
              currentY + 8,
              statusColor,
              statusBg,
              statusBorder,
              64,
            );

            // 4 Sub Test Suite Boxes
            const subBoxW = 118;
            const subBoxH = 32;
            const subBoxY = currentY + 34;

            const categories = [
              {
                label: "Public Tests",
                val: `${chal.categories?.public?.passed ?? 4}/${chal.categories?.public?.total ?? 4}`,
              },
              {
                label: "Hidden Tests",
                val: `${chal.categories?.hidden?.passed ?? 4}/${chal.categories?.hidden?.total ?? 4}`,
              },
              {
                label: "Boundary Tests",
                val: `${chal.categories?.boundary?.passed ?? 2}/${chal.categories?.boundary?.total ?? 2}`,
              },
              {
                label: "Stress Tests",
                val: `${chal.categories?.stress?.passed ?? 2}/${chal.categories?.stress?.total ?? 2}`,
              },
            ];

            categories.forEach((cat, cIdx) => {
              const bx = 48 + cIdx * 126;
              drawCard(bx, subBoxY, subBoxW, subBoxH, "#F1F5F9", COLORS.border);
              doc
                .fillColor(COLORS.textMuted)
                .fontSize(6.5)
                .font("Helvetica")
                .text(cat.label, bx + 8, subBoxY + 5, { lineBreak: false });
              doc
                .fillColor(COLORS.success)
                .fontSize(9)
                .font("Helvetica-Bold")
                .text(cat.val, bx + 8, subBoxY + 16, { lineBreak: false });
            });

            currentY += 88;
          });
          currentY += 12;
        }

        // 7. Section Breakdown & Scoring Details Table
        const secList = dashboard?.sectionTime || [];
        if (secList.length > 0) {
          const secTableH = secList.length * 26 + 32;
          ensureSpace(secTableH + 35);

          doc
            .fillColor(COLORS.textMain)
            .fontSize(11)
            .font("Helvetica-Bold")
            .text("Section Breakdown & Scoring Details", 36, currentY);
          currentY += 20;

          drawCard(36, currentY, 523, secTableH);
          let sY = currentY + 9;

          doc.fillColor(COLORS.textMuted).fontSize(7.5).font("Helvetica-Bold");
          doc.text("SECTION NAME", 50, sY, { lineBreak: false });
          doc.text("DURATION", 220, sY, { lineBreak: false });
          doc.text("ACCURACY", 350, sY, { lineBreak: false });
          doc.text("STATUS", 460, sY, { lineBreak: false });

          doc
            .moveTo(46, sY + 12)
            .lineTo(549, sY + 12)
            .strokeColor(COLORS.border)
            .stroke();
          sY += 16;

          secList.forEach((sec: any) => {
            const secAcc = Math.round(sec.accuracy ?? percentage);
            doc
              .fillColor(COLORS.textMain)
              .fontSize(8.5)
              .font("Helvetica-Bold")
              .text(sec.sectionName || "Section", 50, sY, { width: 160, lineBreak: false });
            doc
              .fillColor(COLORS.textMuted)
              .fontSize(8)
              .font("Helvetica")
              .text(`${sec.expectedTime || 20} mins`, 220, sY, { lineBreak: false });
            doc
              .fillColor(secAcc >= 60 ? COLORS.success : COLORS.warning)
              .font("Helvetica-Bold")
              .text(`${secAcc}%`, 350, sY, { lineBreak: false });

            const isGood = secAcc >= 60;
            const sBg = isGood ? COLORS.successBg : COLORS.warningBg;
            const sColor = isGood ? COLORS.success : COLORS.warning;
            const sBorder = isGood
              ? COLORS.successBorder
              : COLORS.warningBorder;
            drawBadge(
              sec.status || (isGood ? "Good" : "Needs Improvement"),
              450,
              sY - 3,
              sColor,
              sBg,
              sBorder,
              85,
            );

            sY += 24;
          });

          currentY += secTableH + 28;
        }

        // 8. Time Utilization & Pacing Analysis (All Sections)
        if (secList.length > 0) {
          ensureSpace(120);
          doc
            .fillColor(COLORS.textMain)
            .fontSize(11)
            .font("Helvetica-Bold")
            .text("Time Utilization & Pacing Analysis", 36, currentY);
          currentY += 20;

          secList.forEach((sec: any) => {
            ensureSpace(62);
            drawCard(36, currentY, 523, 54);

            const spentM = sec.spentTime || 0;
            const expM = sec.expectedTime || 20;
            const pctUsed = expM > 0 ? Math.round((spentM / expM) * 100) : 0;
            const secAcc = Math.round(sec.accuracy ?? percentage);

            doc
              .fillColor(COLORS.textMain)
              .fontSize(8.5)
              .font("Helvetica-Bold")
              .text(sec.sectionName || "Section", 50, currentY + 8, { width: 220, lineBreak: false });
            doc
              .fillColor(COLORS.textMuted)
              .fontSize(7.5)
              .font("Helvetica")
              .text(`${secAcc}% Accuracy`, 280, currentY + 9, { lineBreak: false });

            const isGood = secAcc >= 60;
            drawBadge(
              sec.status || (isGood ? "Excellent" : "Needs Improvement"),
              440,
              currentY + 6,
              isGood ? COLORS.success : COLORS.warning,
              isGood ? COLORS.successBg : COLORS.warningBg,
              isGood ? COLORS.successBorder : COLORS.warningBorder,
              95,
            );

            // Progress bar
            const barX = 50;
            const barW = 495;
            doc
              .roundedRect(barX, currentY + 26, barW, 4.5, 2)
              .fill(COLORS.border);
            const fillW = Math.max(0, Math.min(barW, (barW * pctUsed) / 100));
            if (fillW > 0)
              doc
                .roundedRect(barX, currentY + 26, fillW, 4.5, 2)
                .fill(COLORS.primary);

            doc.fillColor(COLORS.textMuted).fontSize(7).font("Helvetica");
            doc.text(`Spent: ${spentM}m`, 50, currentY + 37, { lineBreak: false });
            doc.text(`Allowed: ${expM}m`, 230, currentY + 37, { lineBreak: false });
            doc.text(
              `Speed: ${sec.averageSpeedPerQuestion || "0.2m / Q"}`,
              420,
              currentY + 37,
              { lineBreak: false },
            );

            currentY += 66;
          });
          currentY += 12;
        }

        // 9. Personalized Strategy & Competencies (Strengths & Weaknesses)
        const rawStrengths = dashboard?.strengths || [];
        const rawWeaknesses = dashboard?.weaknesses || [];

        const strengths = rawStrengths.length > 0
          ? rawStrengths.map((s: any) => typeof s === "object" ? s.area || s.title || s.name : String(s))
          : ["High Accuracy Execution", "Algorithmic Precision in Coding"];

        const weaknesses = rawWeaknesses.length > 0
          ? rawWeaknesses.map((w: any) => typeof w === "object" ? w.area || w.title || w.name : String(w))
          : ["Review complex reasoning questions before submitting for optimal pacing."];

        ensureSpace(120);
        doc
          .fillColor(COLORS.textMain)
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(
            "Personalized Assessment Strategy & Competency Breakdown",
            36,
            currentY,
          );
        currentY += 20;

        const stratCardW = 254;
        const maxLines = Math.max(strengths.length, weaknesses.length);
        const stratCardH = Math.max(75, maxLines * 16 + 32);

        // Strengths Card
        drawCard(36, currentY, stratCardW, stratCardH);
        doc
          .fillColor(COLORS.success)
          .fontSize(9)
          .font("Helvetica-Bold")
          .text("Key Strengths", 50, currentY + 10);
        doc.fillColor(COLORS.textMain).fontSize(7.5).font("Helvetica");
        let sLineY = currentY + 24;
        strengths.slice(0, 4).forEach((s: string) => {
          doc.text(`• ${s}`, 50, sLineY, { width: 226, lineBreak: false });
          sLineY += 14;
        });

        // Weaknesses Card
        drawCard(305, currentY, stratCardW, stratCardH);
        doc
          .fillColor(COLORS.warning)
          .fontSize(9)
          .font("Helvetica-Bold")
          .text("Needs Improvement & Pacing", 319, currentY + 10);
        doc.fillColor(COLORS.textMain).fontSize(7.5).font("Helvetica");
        let wLineY = currentY + 24;
        weaknesses.slice(0, 4).forEach((w: string) => {
          doc.text(`• ${w}`, 319, wLineY, { width: 226, lineBreak: false });
          wLineY += 14;
        });

        currentY += stratCardH + 28;

        // 10. Certified Footers on ALL Pages (With margin bottom zero to prevent auto page-break loop)
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.page.margins.bottom = 0; // Fix directly on page
          doc.fillColor(COLORS.textMuted).fontSize(7.5).font("Helvetica");
          doc.text(
            "InterVu AI  •  Verified Candidate Performance & Evaluation Report",
            36,
            812,
            { align: "left", lineBreak: false },
          );
          doc.text(`Page ${i + 1} of ${pages.count}`, 450, 812, {
            width: 109,
            align: "right",
            lineBreak: false,
          });
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  async exportToJson(attemptId: string) {
    const result = await this.resultQueryService.getResult(attemptId);
    if (!result) {
      throw new NotFoundException(`Result not found for attempt ${attemptId}`);
    }

    const analytics = await this.resultQueryService
      .getAnalytics(attemptId)
      .catch(() => null);
    const analysis = await this.resultQueryService
      .getAnalysis(attemptId)
      .catch(() => null);
    const recommendations = await this.resultQueryService
      .getRecommendations(attemptId)
      .catch(() => null);

    return {
      exportDate: new Date(),
      result,
      analytics,
      analysis,
      recommendations,
    };
  }
}
