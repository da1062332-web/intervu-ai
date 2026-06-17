const { z } = require("zod");

const UpdateRuleFlagsSchema = z.object({
  negativeMarkingEnabled: z.boolean(),
  randomizeQuestions: z.boolean(),
  randomizeOptions: z.boolean(),
  calculatorAllowed: z.boolean(),
  sectionLockingEnabled: z.boolean(),
  freeNavigationEnabled: z.boolean(),
});

const mockPutPayload = {
  negativeMarkingEnabled: false,
  randomizeQuestions: false,
  randomizeOptions: false,
  calculatorAllowed: false,
  sectionLockingEnabled: false,
  freeNavigationEnabled: true,
};

const result = UpdateRuleFlagsSchema.safeParse(mockPutPayload);
if (!result.success) {
  console.log("Validation Failed:", result.error.issues);
} else {
  console.log("PUT Body Validation Succeeded!");
}
