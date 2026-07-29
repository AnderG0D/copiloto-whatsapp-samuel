import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('EvolutionWebhookController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
  });

  afterAll(async () => {
    await app.close();
  });
});