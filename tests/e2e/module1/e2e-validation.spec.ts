import { test, expect } from '@playwright/test';
import { PrismaClient, DifficultyLevel, ConfigStatus, TopicStatus, ConceptStatus, VariableType, RuleType } from '@prisma/client';

const prisma = new PrismaClient();

test.describe.serial('Module 1 Cross-Module Validation E2E Scenarios', () => {
  const testConfigCode = 'E2E_QA_SCENARIOS_CONFIG';
  let configId = '';
  let topicId = '';
  let sectionId = '';

  test.beforeAll(async () => {
    // Clean up any old test run data to ensure a clean state
    const oldConfig = await prisma.examConfig.findUnique({
      where: { code: testConfigCode },
    });
    if (oldConfig) {
      await prisma.examConfig.delete({ where: { id: oldConfig.id } });
    }

    const oldTopic = await prisma.topic.findUnique({
      where: { code: 'E2E_QA_TOPIC' },
    });
    if (oldTopic) {
      await prisma.topic.delete({ where: { id: oldTopic.id } });
    }

    // Clean up E2E templates
    await prisma.template.deleteMany({
      where: {
        templateKey: {
          startsWith: 'E2E_TEMPLATE_',
        },
      },
    });
  });

  test.afterAll(async () => {
    // Disconnect prisma client
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    // Listen for browser logs & errors
    page.on('console', msg => console.log(`[BROWSER CONSOLE] [${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => console.log(`[BROWSER EXCEPTION] ${err.stack || err.message}`));

    // 1. Log in as ADMIN
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@intervu.ai');
    await page.fill('input[type="password"]', 'Intervu123!');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('Scenario 1: Create Config -> Create Section -> Assign Topic -> Assign Weightage -> Config & Knowledge PASS', async ({ page }) => {
    // Step A: Seed Topic and Concept in DB
    const topic = await prisma.topic.create({
      data: {
        name: 'E2E QA Topic',
        code: 'E2E_QA_TOPIC',
        description: 'E2E Topic description',
        status: TopicStatus.ACTIVE,
        concepts: {
          create: {
            name: 'E2E QA Concept',
            code: 'E2E_QA_CONCEPT',
            status: ConceptStatus.ACTIVE,
          },
        },
      },
      include: {
        concepts: true,
      },
    });
    topicId = topic.id;

    // Step B: Create Exam Config
    const examConfig = await prisma.examConfig.create({
      data: {
        name: 'E2E QA Scenarios Config',
        code: testConfigCode,
        role: 'QA Automation Engineer',
        durationMinutes: 45,
        totalQuestions: 5,
        status: ConfigStatus.ACTIVE,
        isActive: true,
        isArchived: false,
        ruleFlags: {
          create: {
            negativeMarkingEnabled: false,
            sectionalCutoffEnabled: false,
          },
        },
        difficultyDistribution: {
          create: {
            easyPercentage: 40,
            mediumPercentage: 60,
            hardPercentage: 0,
          },
        },
      },
    });
    configId = examConfig.id;

    // Step C: Create Section
    const section = await prisma.examSection.create({
      data: {
        examConfigId: configId,
        name: 'E2E QA Section',
        code: 'E2E_QA_SECTION',
        questionCount: 5,
        sectionDurationMinutes: 45,
        sectionOrder: 1,
        isRequired: true,
      },
    });
    sectionId = section.id;

    // Step D: Assign Topic & Weightage (summing to 100)
    await prisma.sectionTopic.create({
      data: {
        sectionId: sectionId,
        topicId: topicId,
      },
    });
    await prisma.topicWeightage.create({
      data: {
        sectionId: sectionId,
        topicId: topicId,
        weightagePercentage: 100,
      },
    });

    // Step E: Navigate to validation dashboard and run validation
    await page.goto('/admin/system-validation');
    
    // Select the new configuration
    await page.selectOption('select#config-select', configId);
    
    // Click "Run Full Validation"
    await page.click('button:has-text("Run Full Validation")');
    
    // Verify results show up
    await page.waitForSelector('span[data-slot="badge"]');

    // Configuration and Knowledge layers should PASS
    const configBadge = page.locator('span[data-slot="badge"]').nth(0);
    const knowledgeBadge = page.locator('span[data-slot="badge"]').nth(1);
    const templatesBadge = page.locator('span[data-slot="badge"]').nth(2);
    const blueprintBadge = page.locator('span[data-slot="badge"]').nth(3);

    await expect(configBadge).toContainText('PASS');
    await expect(knowledgeBadge).toContainText('PASS');
    
    // Templates and Blueprint should FAIL because we haven't seeded templates/blueprints yet
    await expect(templatesBadge).toContainText('FAIL');
    await expect(blueprintBadge).toContainText('FAIL');
  });

  test('Scenario 2: Create Template -> Create Variable -> Create Rule -> Validate Template PASS', async ({ page }) => {
    // Step A: Seed templates for EASY and MEDIUM (required by 40% easy and 60% medium dist in Scenario 1)
    const diffs = [DifficultyLevel.EASY, DifficultyLevel.MEDIUM];
    
    for (const diff of diffs) {
      const templateKey = `E2E_TEMPLATE_${diff}`;
      
      const t = await prisma.template.create({
        data: {
          templateKey,
          conceptKey: 'E2E_QA_CONCEPT',
          difficultyLevel: diff,
          isActive: true,
          name: `E2E Template ${diff}`,
          questionType: 'multiple_choice',
          variables: {
            create: {
              variableName: 'e2e_var',
              variableType: VariableType.NUMBER,
              required: true,
              defaultValue: '10',
            },
          },
          rules: {
            create: {
              id: `E2E_RULE_${diff}`,
              ruleType: RuleType.RANGE,
              ruleConfig: { variableName: 'e2e_var', min: 1, max: 20 },
            },
          },
          solutionTemplate: {
            create: {
              solutionTemplate: 'return e2e_var;',
              explanationTemplate: 'Returns value.',
            },
          },
        },
      });
    }

    // Step B: Navigate and run validation
    await page.goto('/admin/system-validation');
    await page.selectOption('select#config-select', configId);
    await page.click('button:has-text("Run Full Validation")');
    
    await page.waitForSelector('span[data-slot="badge"]');

    // Config, Knowledge, and Templates should now PASS
    const configBadge = page.locator('span[data-slot="badge"]').nth(0);
    const knowledgeBadge = page.locator('span[data-slot="badge"]').nth(1);
    const templatesBadge = page.locator('span[data-slot="badge"]').nth(2);
    const blueprintBadge = page.locator('span[data-slot="badge"]').nth(3);

    await expect(configBadge).toContainText('PASS');
    await expect(knowledgeBadge).toContainText('PASS');
    await expect(templatesBadge).toContainText('PASS');
    
    // Blueprint still FAILS (no blueprint created yet)
    await expect(blueprintBadge).toContainText('FAIL');
  });

  test('Scenario 3 & 4: Create Blueprint -> Assign Style Profile -> Validate Blueprint PASS -> score = 100 (READY)', async ({ page }) => {
    // Step A: Find existing experienced hiring style profile
    let styleProfile = await prisma.styleProfile.findFirst({
      where: { name: 'Experienced Hiring' },
    });

    if (!styleProfile) {
      styleProfile = await prisma.styleProfile.create({
        data: {
          name: 'Experienced Hiring',
          description: 'Experienced hiring template profile',
          profileType: 'lateral',
          active: true,
        },
      });
    }

    // Step B: Create Blueprint linking config and style profile
    const sectionsJson = [
      {
        sectionId: 'E2E_QA_SECTION',
        questionCount: 5,
        difficultyAllocation: { easy: 40, medium: 60, hard: 0 },
        topicAllocations: [
          { topicId: topicId, percentage: 100 }
        ]
      }
    ];

    await prisma.blueprint.create({
      data: {
        configId: configId,
        styleProfileId: styleProfile.id,
        sections: sectionsJson,
      },
    });

    // Step C: Navigate to validation dashboard and run validation
    await page.goto('/admin/system-validation');
    await page.selectOption('select#config-select', configId);
    await page.click('button:has-text("Run Full Validation")');

    await page.waitForSelector('span[data-slot="badge"]');

    // All layers should PASS!
    const configBadge = page.locator('span[data-slot="badge"]').nth(0);
    const knowledgeBadge = page.locator('span[data-slot="badge"]').nth(1);
    const templatesBadge = page.locator('span[data-slot="badge"]').nth(2);
    const blueprintBadge = page.locator('span[data-slot="badge"]').nth(3);

    await expect(configBadge).toContainText('PASS');
    await expect(knowledgeBadge).toContainText('PASS');
    await expect(templatesBadge).toContainText('PASS');
    await expect(blueprintBadge).toContainText('PASS');

    // Score gauge central text should be 100
    const scoreText = page.getByText('100', { exact: true });
    await expect(scoreText).toBeVisible();

    // Verify readiness state description
    const statusText = page.locator('text=System Fully Ready');
    await expect(statusText).toBeVisible();
  });
});
