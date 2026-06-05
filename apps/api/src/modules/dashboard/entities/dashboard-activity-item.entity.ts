import { ApiProperty } from "@nestjs/swagger";
import { DashboardActivityItem } from "@intervu/shared";

export class DashboardActivityItemEntity implements DashboardActivityItem {
  @ApiProperty({
    example: "1",
    description: "Unique identifier for the activity record",
  })
  id!: string;

  @ApiProperty({
    example: "interview_completed",
    description: "Type of activity",
  })
  type!: "interview_completed";

  @ApiProperty({
    example: "Frontend Interview",
    description: "Title of the activity",
  })
  title!: string;

  @ApiProperty({
    example: "2026-06-04T10:30:00Z",
    description: "ISO timestamp of when the activity occurred",
  })
  createdAt!: string;
}
