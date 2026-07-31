import {
  GoogleGenAI,
  type Content,
  type GenerateContentConfig,
} from '@google/genai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiProvider } from './ai-provider.interface';
import type { AiMessage, GenerateTextInput } from './ai.types';

const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';

@Injectable()
export class GeminiProvider implements AiProvider {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.model =
      this.configService.get<string>('GEMINI_MODEL') ?? DEFAULT_GEMINI_MODEL;
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateText(input: GenerateTextInput) {
    const contents = this.buildContents(input.messages);

    if (contents.length === 0) {
      throw new Error('Gemini requires at least one user or assistant message');
    }

    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
      config: this.buildConfig(input),
    });
    const text = response.text;

    if (!text?.trim()) {
      throw new Error('Gemini returned an empty text response');
    }

    return { text };
  }

  private buildContents(messages: AiMessage[]): Content[] {
    return messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      }));
  }

  private buildConfig(input: GenerateTextInput): GenerateContentConfig {
    const systemInstruction = input.messages
      .filter((message) => message.role === 'system')
      .map((message) => ({ text: message.content }));

    return {
      ...(systemInstruction.length > 0 && { systemInstruction }),
      ...(input.temperature !== undefined && {
        temperature: input.temperature,
      }),
      ...(input.maxOutputTokens !== undefined && {
        maxOutputTokens: input.maxOutputTokens,
      }),
    };
  }
}
