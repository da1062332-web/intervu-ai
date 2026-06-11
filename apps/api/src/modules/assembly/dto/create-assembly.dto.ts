import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const CreateAssemblySchema = z.object({
  configId: z.string().uuid(),
});

export class CreateAssemblyDto {
  @ApiProperty({ description: 'The Test Config UUID to build the assembly from' })
  @IsUUID()
  @IsNotEmpty()
  configId!: string;
}
