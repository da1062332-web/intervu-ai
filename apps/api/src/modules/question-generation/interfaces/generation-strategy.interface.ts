import { Template } from "@prisma/client";
import { GenerationContext } from "./generation-context.interface";

/**
 * Every concrete strategy (Variable, Dataset, Hybrid) implements this interface.
 * The resolver and registry work only with this contract — never with concrete classes.
 */
export interface IQuestionGenerationStrategy {
  generate(template: Template): Promise<GenerationContext>;
}
