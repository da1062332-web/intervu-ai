import { ApiProperty } from "@nestjs/swagger";

export class ErrorDetails {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  message!: string;
}

export class StandardResponseDto<T> {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty()
  data!: T;

  @ApiProperty({ type: ErrorDetails, nullable: true })
  error!: ErrorDetails | null;

  @ApiProperty({ nullable: true })
  meta!: unknown;
}

export class AssemblyBuildDataDto {
  @ApiProperty()
  testInstanceId!: string;
}

export class AssemblyBuildResponseDto extends StandardResponseDto<AssemblyBuildDataDto> {
  @ApiProperty({ type: AssemblyBuildDataDto })
  declare data: AssemblyBuildDataDto;
}

export class TestInstanceQuestionSnapshotDto {
  @ApiProperty()
  questionId!: string;
  @ApiProperty()
  questionOrder!: number;
  @ApiProperty()
  questionSnapshot!: unknown;
}

export class TestInstanceSectionSnapshotDto {
  @ApiProperty()
  sectionId!: string;
  @ApiProperty()
  sectionName!: string;
  @ApiProperty()
  durationSeconds!: number;
  @ApiProperty({ type: [TestInstanceQuestionSnapshotDto] })
  questions!: TestInstanceQuestionSnapshotDto[];
}

export class TestInstanceSnapshotDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  status!: string;
  @ApiProperty({ type: [TestInstanceSectionSnapshotDto] })
  sections!: TestInstanceSectionSnapshotDto[];
}

export class AssemblyGetResponseDto extends StandardResponseDto<TestInstanceSnapshotDto> {
  @ApiProperty({ type: TestInstanceSnapshotDto })
  declare data: TestInstanceSnapshotDto;
}
