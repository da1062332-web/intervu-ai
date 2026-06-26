const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const configId = "cmqmbu6w40000mo2om5xgh07c";

  try {
    const config = await prisma.examConfig.findUnique({
      where: { id: configId },
      include: {
        sections: {
          include: {
            sectionTopics: {
              include: {
                topic: {
                  include: {
                    concepts: true,
                  },
                },
              },
            },
          },
        },
        difficultyDistribution: true,
        ruleFlags: true,
      },
    });

    console.log("Config loaded:", !!config);
    if (!config) return console.log("Config not found");

    console.log("Sections count:", config.sections?.length);

    // Validate
    let errors = [];
    if (!config.difficultyDistribution) {
      errors.push("No difficulty distribution");
    } else {
      const { easyPercentage, mediumPercentage, hardPercentage } =
        config.difficultyDistribution;
      const total = easyPercentage + mediumPercentage + hardPercentage;
      console.log("Total difficulty:", total);
    }

    if (config.sections.length === 0) {
      console.log("No sections defined");
    }

    for (const section of config.sections) {
      if (!section.sectionTopics || section.sectionTopics.length === 0) {
        console.log(`Section "${section.name}" has no topics`);
      } else {
        const activeTopics = section.sectionTopics.filter(
          (st) => st.topic?.status === "ACTIVE",
        );
        if (activeTopics.length === 0) {
          console.log(
            `Section "${section.name}" has topics but none are ACTIVE`,
          );
        }

        for (const st of section.sectionTopics) {
          if (!st.topic) continue;

          const topicConcepts = st.topic.concepts || [];
          const conceptCodes = topicConcepts.map((c) => c.code);

          const templateCount = await prisma.template.count({
            where: {
              isActive: true,
              deletedAt: null,
              conceptKey: { in: conceptCodes },
            },
          });
          console.log(`Template count for ${st.topic.name}: ${templateCount}`);
        }
      }
    }
  } catch (err) {
    console.error("ERROR REPRODUCED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
