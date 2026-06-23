import { ApiProperty } from "@nestjs/swagger";
import { QuestionStatus } from "@prisma/client";

export class QuestionEntity {
  @ApiProperty({ example: "cuid12345" })
  id!: string;

  @ApiProperty({ example: "What is 2 + 2?" })
  questionText!: string;

  @ApiProperty({ example: "4" })
  answer!: string;

  @ApiProperty({ example: "2 + 2 equals 4" })
  explanation!: string;

  @ApiProperty({ example: "topic-cuid" })
  topicId!: string;

  @ApiProperty({ example: "section-cuid" })
  sectionId!: string;

  @ApiProperty({ example: "MEDIUM" })
  difficulty!: string;

  @ApiProperty({ example: 0.5, nullable: true })
  difficultyScore!: number | null;

  @ApiProperty({ example: "GENERATED" })
  source!: string;

  @ApiProperty({ example: "template-cuid", nullable: true })
  templateId!: string | null;

  @ApiProperty({ example: 1 })
  version!: number;

  @ApiProperty({ enum: QuestionStatus, example: "VALIDATED" })
  status!: QuestionStatus;

  @ApiProperty({ example: 0 })
  timesUsed!: number;

  @ApiProperty({ nullable: true })
  lastUsed!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
