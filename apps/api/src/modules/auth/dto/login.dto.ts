import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'candidate@example.com',
    description: 'Registered user email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'StrongPass123',
    description: 'Account password',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
