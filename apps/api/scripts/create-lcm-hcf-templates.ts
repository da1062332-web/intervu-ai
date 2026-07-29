import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { TemplateService } from "../src/modules/template-library/services/template.service";
import { TemplateDifficulty } from "@intervu/shared";

interface TemplateDefinition {
  name: string;
  conceptKey: string;
  questionType: string;
  difficulty: TemplateDifficulty;
  generationStrategy: "VARIABLE" | "DATASET" | "HYBRID";
}

const templates: TemplateDefinition[] = [
  {
    name: "Fraction LCM & HCF",
    conceptKey: "FRACTION_LCM_HCF",
    questionType: "MCQ",
    difficulty: TemplateDifficulty.MEDIUM,
    generationStrategy: "VARIABLE",
  },
  {
    name: "LCM & HCF Basics",
    conceptKey: "LCM_HCF_BASICS",
    questionType: "MCQ",
    difficulty: TemplateDifficulty.EASY,
    generationStrategy: "VARIABLE",
  },
  {
    name: "HCF & LCM Relationship",
    conceptKey: "HCF_LCM_RELATION",
    questionType: "MCQ",
    difficulty: TemplateDifficulty.EASY,
    generationStrategy: "VARIABLE",
  },
  {
    name: "Simplification using Reciprocal",
    conceptKey: "SIMPLIFICATION_RECIPROCAL",
    questionType: "MCQ",
    difficulty: TemplateDifficulty.EASY,
    generationStrategy: "VARIABLE",
  },
];

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const templateService = app.get(TemplateService);

  let createdCount = 0;
  const errors: Array<{ name: string; message: string }> = [];

  try {
    for (const template of templates) {
      try {
        await templateService.create({
          name: template.name,
          conceptKey: template.conceptKey,
          questionType: template.questionType,
          difficulty: template.difficulty,
          generationStrategy: template.generationStrategy,
        });
        createdCount += 1;
        console.log(`Created template: ${template.name}`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ name: template.name, message });
        console.error(`Failed to create template ${template.name}: ${message}`);
      }
    }

    console.log(`\nTemplates created: ${createdCount}/${templates.length}`);
    if (errors.length > 0) {
      console.log(`Errors encountered (${errors.length}):`);
      for (const error of errors) {
        console.log(`- ${error.name}: ${error.message}`);
      }
    }
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error("Template creation script failed:", err);
  process.exit(1);
});
