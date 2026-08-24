import {
  Injectable,
  Inject,
  InternalServerErrorException,
} from "@nestjs/common";
import { LLMAdapter } from "../adapters/llm-adapter.interface";

@Injectable()
export class QuestionGeneratorService {
  constructor(@Inject("LLM_ADAPTER") private readonly llmAdapter: LLMAdapter) {}

  /**
   * Generates a raw response string from the LLM adapter based on the built prompt.
   */
  async generate(prompt: string, temperature?: number): Promise<string> {
    try {
      const response =
        temperature !== undefined
          ? await this.llmAdapter.generate(prompt, temperature)
          : await this.llmAdapter.generate(prompt);
      if (!response || response.trim().length === 0) {
        throw new Error("Empty response received from LLM adapter");
      }
      return response;
    } catch (error: any) {
      throw new InternalServerErrorException(
        `LLM Question Generation failed: ${error.message || error}`,
      );
    }
  }
}
