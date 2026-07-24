import { GenerationService } from "../packages/ai-core/src/generation/generation.service";
import { connectPrisma, disconnectPrisma, prisma } from "../packages/database/src";

async function generateQuestionsForTopic(topicId: string, countPerTemplate: number = 5) {
  try {
    await connectPrisma();
    
    // 1. Find the topic
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { concepts: true }
    });

    if (!topic) {
      console.error(`Topic with ID ${topicId} not found.`);
      return;
    }

    console.log(`Found topic: ${topic.name} (${topic.code})`);
    
    // A topic might have concepts associated, or the topic code itself might be used as conceptKey
    const conceptCodes = topic.concepts.map((c: any) => c.code);
    conceptCodes.push(topic.code);
    
    // 2. Find templates for this topic
    const templates = await prisma.template.findMany({
      where: {
        conceptKey: { in: conceptCodes },
        isActive: true
      }
    });

    if (templates.length === 0) {
      console.warn(`No active templates found for topic ${topic.name}.`);
      console.log(`Hint: Make sure templates have their conceptKey set to one of: ${conceptCodes.join(", ")}`);
      return;
    }

    console.log(`Found ${templates.length} templates for this topic. Generating ${countPerTemplate} questions per template...`);

    const generationService = new GenerationService();
    let generatedCount = 0;
    let failedCount = 0;

    for (const template of templates) {
      console.log(`Generating for template: ${template.templateKey} (Difficulty: ${template.difficultyLevel})`);
      
      for (let i = 0; i < countPerTemplate; i++) {
        try {
          const result = await generationService.generateQuestion(
            {
              conceptKey: template.conceptKey,
              difficultyLevel: template.difficultyLevel.toLowerCase() as "easy" | "medium" | "hard",
              questionType: template.questionType || "mcq"
            },
            `script_gen_${Date.now()}_${i}`
          );
          
          if (result && result.validation && result.validation.isValid) {
            await prisma.question.create({
              data: {
                questionText: result.question.questionText,
                answer: result.question.correctAnswer,
                explanation: result.question.solution,
                topicId: topicId,
                difficulty: template.difficultyLevel,
                difficultyScore: 50, // default
                source: "GENERATED",
                templateId: template.id,
                version: 1,
                status: "ACTIVE", // Active so it can be assigned
                metadata: { options: result.question.options },
              }
            });
            
            generatedCount++;
            console.log(`  - Success: Generated question ${i+1}/${countPerTemplate}`);
          } else {
            failedCount++;
            console.error(`  - Failed: Validation failed for question ${i+1}/${countPerTemplate}`);
          }
        } catch (err: any) {
          failedCount++;
          console.error(`  - Failed: ${err.message}`);
        }
      }
    }

    console.log("\n==========================================");
    console.log(`Generation Complete for Topic: ${topic.name}`);
    console.log(`Generated: ${generatedCount} | Failed: ${failedCount}`);
    console.log("==========================================\n");
    
    if (generatedCount > 0) {
      console.log(`You can now go back to the UI and assign topic '${topic.name}' to the section.`);
    }

  } catch (error) {
    console.error("Critical failure during generation:", error);
  } finally {
    await disconnectPrisma();
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const topicId = args[0] || "0b7d886b-ad85-418f-adfa-1eba96d5392a";
  const count = args[1] ? parseInt(args[1], 10) : 5;
  
  generateQuestionsForTopic(topicId, count);
}
