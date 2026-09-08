import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const adminWebOrigin = process.env.ADMIN_WEB_ORIGIN;

  if (adminWebOrigin && isHttpsOrigin(adminWebOrigin)) {
    app.enableCors({
      origin: adminWebOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'DELETE'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

function isHttpsOrigin(value: string): boolean {
  try {
    const origin = new URL(value);

    return origin.protocol === 'https:' && origin.origin === value;
  } catch {
    return false;
  }
}
