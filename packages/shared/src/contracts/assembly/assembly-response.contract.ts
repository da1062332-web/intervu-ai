import { AllocatedSectionDto } from "../../dto/assembled-test.dto";

export interface AssemblyResponseDto {
  id: string;
  configId: string;
  status: string; // "DRAFT" | "VALIDATED" | "PUBLISHED" | "ARCHIVED"
  totalDurationSeconds: number;
  totalQuestions: number;
  sections: AllocatedSectionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface AssemblyListResponseDto {
  items: AssemblyResponseDto[];
  total: number;
}
