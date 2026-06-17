const { z } = require("zod");

const RuleFlagsResponseSchema = z.object({
  id: z.string().uuid().or(z.literal("")),
  examConfigId: z.string().uuid(),
  negativeMarkingEnabled: z.boolean(),
  randomizeQuestions: z.boolean(),
  randomizeOptions: z.boolean(),
  calculatorAllowed: z.boolean(),
  sectionLockingEnabled: z.boolean(),
  freeNavigationEnabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const mockPayload = {
  id: "",
  examConfigId: "8dd172ee-1c93-4783-804d-c593cb9700da",
  negativeMarkingEnabled: false,
  randomizeQuestions: false,
  randomizeOptions: false,
  calculatorAllowed: false,
  sectionLockingEnabled: false,
  freeNavigationEnabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const result = RuleFlagsResponseSchema.safeParse(mockPayload);
if (!result.success) {
  console.log("Validation Failed:", result.error.issues);
} else {
  console.log("Validation Succeeded!");
}
