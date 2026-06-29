import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";

export const CreateAssemblySchema = z.object({
  configId: z.string(),
});

export class CreateAssemblyDto {
  @ApiProperty({
    description: "The Test Config ID to build the assembly from",
  })
  @IsString()
  @IsNotEmpty()
  configId!: string;
}
