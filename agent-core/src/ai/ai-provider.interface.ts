import type { GenerateTextInput, GenerateTextOutput } from './ai.types';

export interface AiProvider {
  generateText(input: GenerateTextInput): Promise<GenerateTextOutput>;
}
