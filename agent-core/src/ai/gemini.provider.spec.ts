import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import type { GenerateTextInput } from './ai.types';
import { GeminiProvider } from './gemini.provider';

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn(),
}));

const SAFE_API_KEY = 'unit-test-api-key-not-a-secret';
const DEFAULT_MODEL = 'gemini-2.5-flash-lite';

type GenerateContent = GoogleGenAI['models']['generateContent'];

describe('GeminiProvider', () => {
  const GoogleGenAIMock = jest.mocked(GoogleGenAI);
  let generateContentMock: jest.MockedFunction<GenerateContent>;

  const createConfigService = (
    overrides: Record<string, string | undefined> = {},
  ): ConfigService => {
    const values: Record<string, string | undefined> = {
      GEMINI_API_KEY: SAFE_API_KEY,
      GEMINI_MODEL: undefined,
      ...overrides,
    };

    return {
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;
  };

  const createProvider = (
    configOverrides: Record<string, string | undefined> = {},
  ) => new GeminiProvider(createConfigService(configOverrides));

  const createInput = (
    overrides: Partial<GenerateTextInput> = {},
  ): GenerateTextInput => ({
    messages: [{ role: 'user', content: 'Hello' }],
    ...overrides,
  });

  const createResponse = (text: string | undefined): GenerateContentResponse =>
    ({
      text,
    }) as GenerateContentResponse;

  beforeEach(() => {
    GoogleGenAIMock.mockReset();
    generateContentMock = jest.fn<GenerateContent>();
    generateContentMock.mockResolvedValue(createResponse('Generated text'));
    GoogleGenAIMock.mockImplementation(
      () =>
        ({
          models: {
            generateContent: generateContentMock,
          },
        }) as unknown as GoogleGenAI,
    );
  });

  it('throws a clear error when GEMINI_API_KEY is not configured', () => {
    expect(() =>
      createProvider({
        GEMINI_API_KEY: undefined,
      }),
    ).toThrow('GEMINI_API_KEY is not configured');
    expect(GoogleGenAIMock).not.toHaveBeenCalled();
  });

  it('initializes GoogleGenAI with the configured safe API key', () => {
    createProvider();

    expect(GoogleGenAIMock).toHaveBeenCalledTimes(1);
    expect(GoogleGenAIMock).toHaveBeenCalledWith({
      apiKey: SAFE_API_KEY,
    });
  });

  it('uses gemini-2.5-flash-lite when GEMINI_MODEL is undefined', async () => {
    const provider = createProvider();

    await provider.generateText(createInput());

    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: DEFAULT_MODEL,
      }),
    );
  });

  it('uses the configured GEMINI_MODEL', async () => {
    const provider = createProvider({
      GEMINI_MODEL: 'gemini-test-model',
    });

    await provider.generateText(createInput());

    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-test-model',
      }),
    );
  });

  it('converts a user message to the user role', async () => {
    const provider = createProvider();

    await provider.generateText(
      createInput({
        messages: [{ role: 'user', content: 'User message' }],
      }),
    );

    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'User message' }],
          },
        ],
      }),
    );
  });

  it('converts an assistant message to the model role', async () => {
    const provider = createProvider();

    await provider.generateText(
      createInput({
        messages: [{ role: 'assistant', content: 'Assistant message' }],
      }),
    );

    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: [
          {
            role: 'model',
            parts: [{ text: 'Assistant message' }],
          },
        ],
      }),
    );
  });

  it('groups all system messages inside systemInstruction', async () => {
    const provider = createProvider();

    await provider.generateText(
      createInput({
        messages: [
          { role: 'system', content: 'First instruction' },
          { role: 'user', content: 'Question' },
          { role: 'system', content: 'Second instruction' },
        ],
      }),
    );

    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        config: {
          systemInstruction: [
            { text: 'First instruction' },
            { text: 'Second instruction' },
          ],
        },
      }),
    );
  });

  it('excludes system messages from contents', async () => {
    const provider = createProvider();

    await provider.generateText(
      createInput({
        messages: [
          { role: 'system', content: 'System instruction' },
          { role: 'user', content: 'Question' },
          { role: 'assistant', content: 'Previous answer' },
        ],
      }),
    );

    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Question' }],
          },
          {
            role: 'model',
            parts: [{ text: 'Previous answer' }],
          },
        ],
      }),
    );
  });

  it('sends temperature and maxOutputTokens when they are defined', async () => {
    const provider = createProvider();

    await provider.generateText(
      createInput({
        temperature: 0.7,
        maxOutputTokens: 256,
      }),
    );

    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        config: {
          temperature: 0.7,
          maxOutputTokens: 256,
        },
      }),
    );
  });

  it('preserves zero values for numeric options', async () => {
    const provider = createProvider();

    await provider.generateText(
      createInput({
        temperature: 0,
        maxOutputTokens: 0,
      }),
    );

    expect(generateContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        config: {
          temperature: 0,
          maxOutputTokens: 0,
        },
      }),
    );
  });

  it('omits numeric options when they are undefined', async () => {
    const provider = createProvider();

    await provider.generateText(
      createInput({
        temperature: undefined,
        maxOutputTokens: undefined,
      }),
    );

    const request = generateContentMock.mock.calls[0][0];

    expect(request.config).not.toHaveProperty('temperature');
    expect(request.config).not.toHaveProperty('maxOutputTokens');
  });

  it('returns generated text without modifying it', async () => {
    const provider = createProvider();
    const generatedText = '  Generated text with whitespace  \n';
    generateContentMock.mockResolvedValue(createResponse(generatedText));

    await expect(provider.generateText(createInput())).resolves.toEqual({
      text: generatedText,
    });
  });

  it.each([undefined, '', '   \n\t'])(
    'rejects an empty text response (%p)',
    async (text) => {
      const provider = createProvider();
      generateContentMock.mockResolvedValue(createResponse(text));

      await expect(provider.generateText(createInput())).rejects.toThrow(
        'Gemini returned an empty text response',
      );
    },
  );

  it('rejects messages: [] before calling generateContent', async () => {
    const provider = createProvider();

    await expect(
      provider.generateText(
        createInput({
          messages: [],
        }),
      ),
    ).rejects.toThrow('Gemini requires at least one user or assistant message');
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it('rejects system-only messages before calling generateContent', async () => {
    const provider = createProvider();

    await expect(
      provider.generateText(
        createInput({
          messages: [
            { role: 'system', content: 'First instruction' },
            { role: 'system', content: 'Second instruction' },
          ],
        }),
      ),
    ).rejects.toThrow('Gemini requires at least one user or assistant message');
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it('propagates errors produced by the SDK', async () => {
    const provider = createProvider();
    const sdkError = new Error('Simulated SDK failure');
    generateContentMock.mockRejectedValue(sdkError);

    await expect(provider.generateText(createInput())).rejects.toBe(sdkError);
  });

  it('passes the expected model, contents, and config to generateContent', async () => {
    const provider = createProvider({
      GEMINI_MODEL: 'gemini-exact-request-model',
    });

    await provider.generateText({
      messages: [
        { role: 'system', content: 'Be concise' },
        { role: 'user', content: 'Question' },
        { role: 'assistant', content: 'Previous answer' },
      ],
      temperature: 0.25,
      maxOutputTokens: 128,
    });

    expect(generateContentMock).toHaveBeenCalledTimes(1);
    expect(generateContentMock).toHaveBeenCalledWith({
      model: 'gemini-exact-request-model',
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Question' }],
        },
        {
          role: 'model',
          parts: [{ text: 'Previous answer' }],
        },
      ],
      config: {
        systemInstruction: [{ text: 'Be concise' }],
        temperature: 0.25,
        maxOutputTokens: 128,
      },
    });
  });
});
