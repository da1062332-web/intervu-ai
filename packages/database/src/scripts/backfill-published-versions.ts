import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

function calculateVersionHash(payload: any): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

export async function backfillPublishedVersions() {
  console.log("Starting Assessment Versioning Migration & Backfill...");

  // 1. Mark historical/unversioned test instances as legacy
  const unversionedAttempts = await prisma.testInstance.updateMany({
    where: {
      publishedVersionId: null,
      isLegacy: false,
    },
    data: {
      isLegacy: true,
      versionName: "Legacy (Unversioned)",
    },
  });

  console.log(
    `Reconciled ${unversionedAttempts.count} historical test attempts as Legacy (Unversioned).`
  );

  // 2. Process existing PUBLISHED exam configs to initialize V1 snapshots for future attempts
  const publishedConfigs = await prisma.examConfig.findMany({
    where: {
      status: "PUBLISHED",
    },
    include: {
      sections: {
        orderBy: { sectionOrder: "asc" },
        include: {
          sectionTopics: {
            include: {
              topic: true,
              topicWeightage: true,
            },
          },
          questions: {
            include: {
              questionMedia: {
                include: {
                  mediaAsset: true,
                },
                orderBy: { position: "asc" },
              },
            },
          },
        },
      },
      ruleFlags: true,
      difficultyDistribution: true,
      hiringEvaluationConfig: {
        include: {
          sectionMappings: true,
        },
      },
      publishedVersions: true,
    },
  });

  console.log(`Found ${publishedConfigs.length} published exam configs.`);

  for (const config of publishedConfigs) {
    if (config.publishedVersions.length > 0) {
      console.log(
        `Config ${config.name} (${config.id}) already has ${config.publishedVersions.length} published version(s). Skipping initial creation.`
      );
      continue;
    }

    console.log(`Initializing V1 snapshot for config: ${config.name} (${config.id})`);

    const configSnapshot = {
      id: config.id,
      name: config.name,
      code: config.code,
      role: config.role,
      description: config.description,
      durationMinutes: config.durationMinutes,
      totalQuestions: config.totalQuestions,
      sandboxUi: config.sandboxUi,
      difficultyDistribution: config.difficultyDistribution,
      hiringEvaluationConfig: config.hiringEvaluationConfig,
    };

    const scoringRulesSnapshot = {
      negativeMarkingEnabled: config.ruleFlags?.negativeMarkingEnabled ?? false,
      sectionalCutoffEnabled: config.ruleFlags?.sectionalCutoffEnabled ?? false,
      adaptiveDifficultyEnabled: config.ruleFlags?.adaptiveDifficultyEnabled ?? false,
      allowSectionNavigation: config.ruleFlags?.allowSectionNavigation ?? false,
      sectionTimingEnabled: config.ruleFlags?.sectionTimingEnabled ?? false,
      shuffleQuestionsEnabled: config.ruleFlags?.shuffleQuestionsEnabled ?? false,
      shuffleOptionsEnabled: config.ruleFlags?.shuffleOptionsEnabled ?? false,
    };

    const versionDataToHash = {
      configSnapshot,
      scoringRulesSnapshot,
      sections: config.sections.map((s) => ({
        code: s.code,
        name: s.name,
        questionCount: s.questionCount,
        duration: s.sectionDurationMinutes,
        questions: s.questions.map((q) => q.id),
      })),
    };

    const versionHash = calculateVersionHash(versionDataToHash);
    const versionNumber = 1;
    const versionName = `${config.name} — V1`;

    await prisma.$transaction(
      async (tx) => {
        const publishedVersion = await tx.examPublishedVersion.create({
          data: {
            examConfigId: config.id,
            versionNumber,
            versionName,
            status: "ACTIVE",
            versionHash,
            publishedBy: config.createdBy || "system-migration",
            changelogSummary: "Initial publication snapshot created during versioning system rollout.",
            configSnapshot,
            scoringRulesSnapshot,
          },
        });

        const sectionsData = config.sections.map((section) => {
          const topicDistribution = section.sectionTopics.map((st) => ({
            topicId: st.topicId,
            topicName: st.topic.name,
            topicCode: st.topic.code,
            weightagePercentage: st.topicWeightage?.weightagePercentage ?? null,
          }));

          return {
            publishedVersionId: publishedVersion.id,
            sectionCode: section.code,
            sectionName: section.name,
            sectionOrder: section.sectionOrder,
            sectionDurationMinutes: section.sectionDurationMinutes,
            questionCount: section.questionCount,
            isRequired: section.isRequired,
            topicDistributionJson: topicDistribution as any,
          };
        });

        if (sectionsData.length > 0) {
          await tx.examVersionSection.createMany({
            data: sectionsData,
          });
        }

        const questionsData: any[] = [];
        for (const section of config.sections) {
          for (const question of section.questions) {
            const media =
              question.questionMedia?.map((m) => ({
                id: m.mediaAsset.id,
                storageKey: m.mediaAsset.storageKey,
                mimeType: m.mediaAsset.mimeType,
                altText: m.mediaAsset.altText,
                position: m.position,
              })) ?? [];

            let optionsJson: any = [];
            if (question.mcqData && typeof question.mcqData === "object") {
              const mcqObj = question.mcqData as any;
              optionsJson = Array.isArray(mcqObj)
                ? mcqObj
                : mcqObj.options || mcqObj.choices || [];
            }

            const correctAnswerJson = question.answer
              ? { correctOption: question.answer, answer: question.answer }
              : {};

            questionsData.push({
              publishedVersionId: publishedVersion.id,
              sectionCode: section.code,
              originalQuestionId: question.id,
              questionStem: question.questionText || question.questionStatement || "",
              questionType: question.questionType || "MCQ",
              difficulty: (question.difficulty as any) || "MEDIUM",
              optionsJson,
              correctAnswerJson,
              explanation: question.explanation,
              marks: 1.0,
              negativeMarks: config.ruleFlags?.negativeMarkingEnabled ? 0.25 : 0.0,
              mediaAttachmentsJson: media,
              codingDataJson: question.codingData as any,
              metadataJson: {
                conceptId: question.conceptId,
                topicId: question.topicId,
              },
            });
          }
        }

        if (questionsData.length > 0) {
          await tx.examVersionQuestion.createMany({
            data: questionsData,
          });
        }

        await tx.examConfig.update({
          where: { id: config.id },
          data: {
            currentVersionNumber: versionNumber,
            activeVersionId: publishedVersion.id,
          },
        });
      },
      {
        timeout: 60000,
        maxWait: 20000,
      }
    );

    console.log(`Successfully created V1 for ${config.name}`);
  }

  console.log("Assessment versioning backfill complete!");
}

if (require.main === module) {
  backfillPublishedVersions()
    .catch((e) => {
      console.error("Backfill failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
