export type AiMessageRole = 'system' | 'user' | 'assistant';

export interface AiMessage {
  role: AiMessageRole;
  content: string;
}

export interface GenerateTextInput {
  messages: AiMessage[];
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateTextOutput {
  text: string;
}
