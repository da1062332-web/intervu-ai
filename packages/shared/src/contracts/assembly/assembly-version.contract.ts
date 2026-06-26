import { AssemblyResponseDto } from "./assembly-response.contract";

export interface AssemblyVersionDto {
  id: string;
  assemblyId: string;
  version: number;
  snapshot: AssemblyResponseDto;
  createdAt: string;
}

export interface CreateAssemblyVersionRequestDto {
  assemblyId: string;
}

export interface RestoreAssemblyVersionRequestDto {
  versionId: string;
}
