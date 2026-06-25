import { IsNotEmpty, IsString } from "class-validator";

export class GeneratedQuestionDto {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsString()
  @IsNotEmpty()
  answer!: string;

  @IsString()
  @IsNotEmpty()
  explanation!: string;

  @IsString()
  @IsNotEmpty()
  difficulty!: string;

  @IsString()
  @IsNotEmpty()
  topic!: string;
}
