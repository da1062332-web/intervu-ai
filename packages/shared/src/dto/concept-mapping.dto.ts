import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  CreateConceptMapping,
  UpdateConceptMapping,
} from "@intervu-ai/contracts";
import {
  CreateConceptMappingSchema,
  UpdateConceptMappingSchema,
} from "@intervu-ai/contracts";
import { z } from "zod";

export class CreateConceptMappingDto implements CreateConceptMapping {
  @ApiProperty({ example: "Distributed Consensus", maxLength: 255 })
  name!: string;

  @ApiProperty({ example: "DIST_CONSENSUS", maxLength: 100 })
  code!: string;

  @ApiPropertyOptional({
    example: "Raft and Paxos algorithms overview",
    maxLength: 1000,
  })
  description?: string | null;

  @ApiPropertyOptional({ example: "ACTIVE" })
  status?: string;

  // Backwards compatibility legacy fields
  conceptName!: string;
  conceptCode!: string;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, CreateConceptMappingDto> {
    return CreateConceptMappingSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, CreateConceptMappingDto>;
  }
}

export class UpdateConceptMappingDto implements UpdateConceptMapping {
  @ApiPropertyOptional({ example: "Updated Distributed Consensus" })
  name?: string;

  @ApiPropertyOptional({ example: "DIST_CONSENSUS_V2" })
  code?: string;

  @ApiPropertyOptional({ example: "Updated description text" })
  description?: string | null;

  @ApiPropertyOptional({ example: "ACTIVE" })
  status?: string;

  @ApiPropertyOptional({ example: true })
  isActive?: boolean;

  // Backwards compatibility legacy fields
  conceptName?: string;
  conceptCode?: string;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateConceptMappingDto> {
    return UpdateConceptMappingSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, UpdateConceptMappingDto>;
  }
}
