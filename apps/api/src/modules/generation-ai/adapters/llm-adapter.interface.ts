export interface LLMAdapter {
  generate(prompt: string, temperature?: number): Promise<string>;
}
