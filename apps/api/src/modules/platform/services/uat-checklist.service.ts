import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AppLogger } from "@intervu-ai/shared-logger";

@Injectable()
export class UatChecklistService {
  private readonly logger = new AppLogger({ name: "UatChecklistService" });

  constructor(private readonly prisma: PrismaService) {}

  async getPlatformUatStatus() {
    this.logger.debug("Generating platform UAT status");

    const statusList = [];

    // 1. Authentication
    const usersCount = await this.prisma.user.count();
    const hasAdmin = await this.prisma.user.count({ where: { role: "ADMIN" } });
    statusList.push({
      module: "Authentication",
      status:
        usersCount > 0 && hasAdmin > 0
          ? "PASS"
          : usersCount > 0
            ? "WARNING"
            : "FAIL",
      remarks:
        usersCount > 0
          ? hasAdmin > 0
            ? "JWT configured, Admin and users exist"
            : "Users exist but no ADMIN found"
          : "No users exist in the system",
    });

    // 2. Generation (Templates)
    const templatesCount = await this.prisma.template.count();
    statusList.push({
      module: "Generation",
      status:
        templatesCount >= 5 ? "PASS" : templatesCount > 0 ? "WARNING" : "FAIL",
      remarks:
        templatesCount >= 5
          ? `${templatesCount} templates available`
          : templatesCount > 0
            ? `Only ${templatesCount} templates available (recommend >= 5)`
            : "No templates configured",
    });

    // 3. Question Bank
    const questionsCount = await this.prisma.generatedQuestion.count();
    statusList.push({
      module: "Question Bank",
      status:
        questionsCount >= 20 ? "PASS" : questionsCount > 0 ? "WARNING" : "FAIL",
      remarks:
        questionsCount >= 20
          ? "Sufficient questions available"
          : questionsCount > 0
            ? `Only ${questionsCount} questions available`
            : "No questions generated",
    });

    // 4. Assembly (Exam Configs)
    const configsCount = await this.prisma.examConfig.count({
      where: { status: "PUBLISHED" },
    });
    const draftConfigsCount = await this.prisma.examConfig.count({
      where: { status: "DRAFT" },
    });
    statusList.push({
      module: "Assembly",
      status:
        configsCount > 0 ? "PASS" : draftConfigsCount > 0 ? "WARNING" : "FAIL",
      remarks:
        configsCount > 0
          ? `${configsCount} published assessments available`
          : draftConfigsCount > 0
            ? "Only drafts exist, none published"
            : "No assessments assembled",
    });

    // 5. Execution (Test Instances)
    const instancesCount = await this.prisma.testInstance.count();
    const completedInstances = await this.prisma.testInstance.count({
      where: { status: "COMPLETED" },
    });
    statusList.push({
      module: "Execution",
      status: instancesCount > 0 ? "PASS" : "WARNING",
      remarks:
        instancesCount > 0
          ? `${instancesCount} test instances initiated, ${completedInstances} completed`
          : "No test instances initiated yet",
    });

    // 6. Evaluation
    const evaluationsCount = await this.prisma.evaluationResult.count();
    statusList.push({
      module: "Evaluation",
      status:
        evaluationsCount > 0
          ? "PASS"
          : instancesCount > 0
            ? "WARNING"
            : "WARNING",
      remarks:
        evaluationsCount > 0
          ? `${evaluationsCount} evaluation results recorded`
          : "No evaluations recorded yet",
    });

    // 7. Reporting
    const analyticsCount = await this.prisma.evaluationAnalytics.count();
    statusList.push({
      module: "Reporting",
      status: analyticsCount > 0 || evaluationsCount > 0 ? "PASS" : "WARNING",
      remarks:
        analyticsCount > 0 || evaluationsCount > 0
          ? "Reporting APIs are ready with data"
          : "No analytics or evaluation data available for reporting yet",
    });

    return statusList;
  }
}
