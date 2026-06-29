import { AssemblyResponseDto } from "./assembly-response.contract";

export interface PublishAssemblyRequestDto {
  assemblyId: string;
}

export interface PublishAssemblyResponseDto {
  success: boolean;
  assembly?: AssemblyResponseDto;
  validationErrors?: string[];
}
