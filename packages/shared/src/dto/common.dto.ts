import { CommonPaginationSchema } from "../schemas/common.schema";
import { z } from "zod";

export class PaginationDto {
  page?: number;
  limit?: number;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, PaginationDto> {
    return CommonPaginationSchema.safeParse(data);
  }
}
