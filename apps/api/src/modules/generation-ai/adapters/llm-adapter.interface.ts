export interface LLMAdapter {
  generate(prompt: string): Promise<string>;
}
