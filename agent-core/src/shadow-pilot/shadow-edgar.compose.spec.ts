import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Edgar shadow-only Compose', () => {
  const compose = readFileSync(
    join(__dirname, '../../../docker-compose.shadow-edgar.yaml'),
    'utf8',
  );
  const primaryCompose = readFileSync(
    join(__dirname, '../../../docker-compose.yaml'),
    'utf8',
  );

  function serviceBlock(serviceName: string): string {
    const serviceStart = compose.indexOf(`  ${serviceName}:`);
    expect(serviceStart).toBeGreaterThanOrEqual(0);

    const serviceContent = compose.slice(serviceStart);
    const nextService = serviceContent.search(
      /\r?\n  [a-zA-Z][a-zA-Z0-9-]*:\r?\n/,
    );

    return nextService === -1
      ? serviceContent
      : serviceContent.slice(0, nextService);
  }

  it('pins the Evolution API image to v2.3.7 in both Compose files', () => {
    const expectedImage = 'evoapicloud/evolution-api:v2.3.7';

    expect(primaryCompose).toContain(`image: ${expectedImage}`);
    expect(compose).toContain(`image: ${expectedImage}`);
  });

  it('does not contain any latest image reference', () => {
    expect(compose).not.toMatch(/latest/i);
  });

  it('defines dedicated services, network, volumes, and ports', () => {
    expect(compose).toContain('shadow-edgar-api:');
    expect(compose).toContain('container_name: copilot_shadow_edgar_api');
    expect(compose).toContain('shadow-edgar-evolution-api:');
    expect(compose).toContain(
      'container_name: copilot_shadow_edgar_evolution_api',
    );
    expect(compose).toContain('shadow-edgar-postgres:');
    expect(compose).toContain('container_name: copilot_shadow_edgar_postgres');
    expect(compose).toContain('shadow-edgar-redis:');
    expect(compose).toContain('container_name: copilot_shadow_edgar_redis');
    expect(compose).toContain('shadow-edgar-net:');
    expect(compose).toContain('name: copilot-shadow-edgar-net');
    expect(compose).toContain('127.0.0.1:3311:3311');
    expect(compose).toContain('127.0.0.1:18081:8080');
    expect(compose).toContain('127.0.0.1:15433:5432');
    expect(compose).toContain('127.0.0.1:16379:6379');
    expect(compose).toContain('name: copilot_shadow_edgar_data');
    expect(compose).toContain('name: copilot_shadow_edgar_evolution_instances');
    expect(compose).toContain('name: copilot_shadow_edgar_postgres_data');
    expect(compose).toContain('name: copilot_shadow_edgar_redis_data');
  });

  it('configures only the Edgar instance and the shadow-only webhook', () => {
    const evolutionService = serviceBlock('shadow-edgar-evolution-api');

    expect(compose).toContain('SHADOW_ONLY_MODE: edgar');
    expect(compose).toContain(
      'SHADOW_EVOLUTION_INSTANCE_NAME: evolution-shadow-edgar',
    );
    expect(compose).toContain('SERVER_NAME: evolution-shadow-edgar');
    expect(compose).toContain(
      'DATABASE_CONNECTION_CLIENT_NAME: evolution-shadow-edgar',
    );
    expect(compose).toContain(
      'WEBHOOK_GLOBAL_URL: http://shadow-edgar-api:3311/webhooks/evolution',
    );
    expect(compose).toContain('WEBHOOK_GLOBAL_ENABLED: "true"');
    expect(compose).toContain('WEBHOOK_EVENTS_MESSAGES_UPSERT: "true"');
    expect(compose).toContain('WEBHOOK_EVENTS_QRCODE_UPDATED: "true"');
    expect(compose).toContain('QRCODE_LIMIT: "30"');
    expect(evolutionService).toContain('SERVER_NAME: evolution-shadow-edgar');
    expect(evolutionService).toContain(
      'WEBHOOK_GLOBAL_URL: http://shadow-edgar-api:3311/webhooks/evolution',
    );
  });

  it('sets the receive-only safety invariants', () => {
    expect(compose).toContain('SENDER: "false"');
    expect(compose).toContain('AUTO_SEND_MESSAGES: "false"');
    expect(compose).toContain('NO_LEAD_SEND: "true"');
    expect(compose).not.toContain('QR: "false"');
  });

  it('keeps Evolution v2 dependencies on the dedicated network and resources', () => {
    const evolutionService = serviceBlock('shadow-edgar-evolution-api');

    expect(compose).toContain('DATABASE_PROVIDER: postgresql');
    expect(compose).toContain('DATABASE_ENABLED: "true"');
    expect(evolutionService).toContain('CACHE_REDIS_ENABLED: "false"');
    expect(evolutionService).toContain(
      'CACHE_REDIS_URI: redis://shadow-edgar-redis:6379/0',
    );
    expect(compose).not.toContain('env_file:');
    expect(compose).not.toContain('external: true');
    expect(compose).not.toMatch(/\n\s+- evolution-net\s*\n/);
    expect(compose).not.toMatch(/\n\s+- evolution_instances:/);
    expect(compose).not.toMatch(/\n\s+- evolution_redis:\/data/);
    expect(compose).not.toMatch(
      /\n\s+- postgres_data:\/var\/lib\/postgresql\/data/,
    );
  });

  it('applies the documented QR-linking workaround only to Edgar Evolution', () => {
    const evolutionService = serviceBlock('shadow-edgar-evolution-api');
    const workaround = {
      CACHE_REDIS_ENABLED: 'false',
      CACHE_LOCAL_ENABLED: 'true',
      DATABASE_SAVE_DATA_CHATS: 'false',
      DATABASE_SAVE_DATA_CONTACTS: 'false',
      DATABASE_SAVE_DATA_HISTORIC: 'false',
      DATABASE_SAVE_DATA_LABELS: 'false',
      CONFIG_SESSION_PHONE_VERSION: '2.3000.1033773198',
    };

    for (const [name, value] of Object.entries(workaround)) {
      expect(evolutionService).toContain(`${name}: "${value}"`);
    }

    expect(evolutionService).toContain(
      'DATABASE_SAVE_DATA_NEW_MESSAGE: "true"',
    );
    expect(evolutionService).toContain(
      'DATABASE_CONNECTION_URI: "postgresql://shadow_edgar:${SHADOW_EDGAR_POSTGRES_PASSWORD_URLENCODED:?Set SHADOW_EDGAR_POSTGRES_PASSWORD_URLENCODED in the environment}@shadow-edgar-postgres:5432/shadow_edgar?schema=public"',
    );
    expect(evolutionService).toContain('QRCODE_LIMIT: "30"');
    expect(evolutionService).not.toContain('CACHE_REDIS_ENABLED: "true"');
    expect(evolutionService).not.toContain('CACHE_LOCAL_ENABLED: "false"');
  });

  it('uses the URL-encoded password only for the Evolution database URI', () => {
    expect(compose).toContain(
      'DATABASE_CONNECTION_URI: "postgresql://shadow_edgar:${SHADOW_EDGAR_POSTGRES_PASSWORD_URLENCODED:?Set SHADOW_EDGAR_POSTGRES_PASSWORD_URLENCODED in the environment}@shadow-edgar-postgres:5432/shadow_edgar?schema=public"',
    );
    expect(compose).toContain(
      'POSTGRES_PASSWORD: "${SHADOW_EDGAR_POSTGRES_PASSWORD:?Set SHADOW_EDGAR_POSTGRES_PASSWORD in the environment}"',
    );
    expect(compose).not.toContain(
      'DATABASE_CONNECTION_URI: "postgresql://shadow_edgar:${SHADOW_EDGAR_POSTGRES_PASSWORD:?Set SHADOW_EDGAR_POSTGRES_PASSWORD in the environment}@shadow-edgar-postgres:5432/shadow_edgar?schema=public"',
    );
  });

  it('does not contain Samuel or unrelated application services', () => {
    expect(compose).not.toMatch(/samuel/i);
    for (const forbiddenService of [
      'supabase:',
      'gemini:',
      'leads:',
      'drafts:',
      'outbox:',
    ]) {
      expect(compose).not.toContain(forbiddenService);
    }
  });

  it('keeps the primary Compose free of Edgar-only services and settings', () => {
    expect(primaryCompose).not.toMatch(/shadow-edgar/i);
    expect(primaryCompose).not.toContain('CONFIG_SESSION_PHONE_VERSION');
    expect(primaryCompose).not.toContain('CACHE_LOCAL_ENABLED');
    expect(primaryCompose).not.toContain('NO_LEAD_SEND');
  });
});
