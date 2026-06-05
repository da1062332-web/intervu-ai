import { ApiProperty } from "@nestjs/swagger";

export class SessionEntity {
  @ApiProperty({ example: "session123456" })
  id!: string;

  @ApiProperty({ example: "Mozilla/5.0 ...", nullable: true })
  userAgent!: string | null;

  @ApiProperty({ example: "127.0.0.1", nullable: true })
  ipAddress!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  expiresAt!: Date;

  @ApiProperty({ example: false })
  isCurrent!: boolean;
}
