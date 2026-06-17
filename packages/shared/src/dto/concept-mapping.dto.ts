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
  @ApiProperty({ example: "Distributed Consensus", maxLength: 150 })
  conceptName!: string;

  @ApiProperty({ example: "DIST_CONSENSUS", maxLength: 50 })
  conceptCode!: string;

  @ApiPropertyOptional({
    example: "Raft and Paxos algorithms overview",
    maxLength: 500,
  })
  description?: string | null;

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
  conceptName?: string;

  @ApiPropertyOptional({ example: "DIST_CONSENSUS_V2" })
  conceptCode?: string;

  @ApiPropertyOptional({ example: "Updated description text" })
  description?: string | null;

  @ApiPropertyOptional({ example: true })
  isActive?: boolean;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateConceptMappingDto> {
    return UpdateConceptMappingSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, UpdateConceptMappingDto>;
  }
}
