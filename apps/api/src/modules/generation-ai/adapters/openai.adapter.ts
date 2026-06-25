import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { AppConfigService } from "../../../config/config.service";
import { LLMAdapter } from "./llm-adapter.interface";

@Injectable()
export class OpenAIAdapter implements LLMAdapter {
  constructor(private readonly configService: AppConfigService) {}

  async generate(prompt: string): Promise<string> {
    const apiKey = this.configService.openAiApiKey;
    const model = process.env.OPENAI_MODEL || "gpt-4o";

    if (!apiKey || apiKey === "sk-dummy-key-for-local-development") {
      throw new InternalServerErrorException(
        "OpenAI API Key is not configured properly.",
      );
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `OpenAI API returned status ${response.status}: ${errorText}`,
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("OpenAI API returned an empty message content.");
      }

      return content;
    } catch (error: any) {
      throw new InternalServerErrorException(
        `LLM Generation failed: ${error.message}`,
      );
    }
  }
}
