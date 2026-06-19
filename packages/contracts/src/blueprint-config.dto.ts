import { z } from "zod";

export const CreateBlueprintConfigDtoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  totalQuestions: z
    .number()
    .int()
    .positive("Total questions must be greater than 0"),
  totalDurationMinutes: z
    .number()
    .int()
    .positive("Total duration must be greater than 0"),
  isActive: z.boolean().optional().default(true),
});

export type CreateBlueprintConfigDtoType = z.infer<
  typeof CreateBlueprintConfigDtoSchema
>;
export class CreateBlueprintConfigDto implements CreateBlueprintConfigDtoType {
  name!: string;
  code!: string;
  description?: string;
  totalQuestions!: number;
  totalDurationMinutes!: number;
  isActive!: boolean;
}

export const UpdateBlueprintConfigDtoSchema =
  CreateBlueprintConfigDtoSchema.partial();

export type UpdateBlueprintConfigDtoType = z.infer<
  typeof UpdateBlueprintConfigDtoSchema
>;
export class UpdateBlueprintConfigDto implements UpdateBlueprintConfigDtoType {
  name?: string;
  code?: string;
  description?: string;
  totalQuestions?: number;
  totalDurationMinutes?: number;
  isActive?: boolean;
}

export const AddTopicConfigDtoSchema = z
  .object({
    sectionId: z.string().min(1, "Section ID is required"),
    topicId: z.string().min(1, "Topic ID is required"),
    questionCount: z
      .number()
      .int()
      .positive("Question count must be greater than 0"),
    weightage: z.number().positive("Weightage must be greater than 0"),
    easyCount: z.number().int().nonnegative(),
    mediumCount: z.number().int().nonnegative(),
    hardCount: z.number().int().nonnegative(),
  })
  .refine(
    (data) =>
      data.easyCount + data.mediumCount + data.hardCount === data.questionCount,
    {
      message:
        "Sum of easy, medium, and hard questions must equal total questionCount",
      path: ["easyCount"], // Path to the field where the error will be reported
    },
  );

export type AddTopicConfigDtoType = z.infer<typeof AddTopicConfigDtoSchema>;
export class AddTopicConfigDto implements AddTopicConfigDtoType {
  sectionId!: string;
  topicId!: string;
  questionCount!: number;
  weightage!: number;
  easyCount!: number;
  mediumCount!: number;
  hardCount!: number;
}
