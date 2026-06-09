import { IsUUID, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class StartTestDto {
  @ApiProperty({
    description: "The UUID of the Test Configuration",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  @IsNotEmpty()
  testConfigId!: string;
}
