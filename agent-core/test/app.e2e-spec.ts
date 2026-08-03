import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import type { AiProvider } from './../src/ai/ai-provider.interface';
import { AI_PROVIDER } from './../src/ai/ai.constants';
import { AppModule } from './../src/app.module';

describe('EvolutionWebhookController (e2e)', () => {
  let app: INestApplication<App>;
  const generateTextMock: jest.MockedFunction<AiProvider['generateText']> =
    jest.fn();
  const fakeAiProvider: AiProvider = {
    generateText: generateTextMock,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AI_PROVIDER)
      .useValue(fakeAiProvider)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('POST /webhooks/evolution ignores unrelated events', async () => {
    await request(app.getHttpServer())
      .post('/webhooks/evolution')
      .send({
        event: 'connection.update',
      })
      .expect(200)
      .expect({
        ok: true,
        ignored: true,
      });

    expect(generateTextMock).not.toHaveBeenCalled();
  });

  afterAll(async () => {
    await app.close();
  });
});
