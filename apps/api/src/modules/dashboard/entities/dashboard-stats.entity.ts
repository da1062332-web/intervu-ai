import { ApiProperty } from '@nestjs/swagger';
import { DashboardStats } from '@intervu/shared';

export class DashboardStatsEntity implements DashboardStats {
  @ApiProperty({ example: 12, description: 'Total number of completed/evaluated tests taken by the user' })
  testsTaken!: number;

  @ApiProperty({ example: 84, description: 'Average score of all evaluated tests' })
  averageScore!: number;

  @ApiProperty({ example: 92, description: 'Completion rate of tests started by the user (percentage)' })
  completionRate!: number;

  @ApiProperty({ example: 15, description: 'Total number of test/interview sessions started by the user' })
  totalSessions!: number;
}
