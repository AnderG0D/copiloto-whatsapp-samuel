import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Samuel shadow-only Compose', () => {
  const compose = readFileSync(
    join(__dirname, '../../../docker-compose.shadow-samuel.yaml'),
    'utf8',
  );
  const edgarCompose = readFileSync(
    join(__dirname, '../../../docker-compose.shadow-edgar.yaml'),
    'utf8',
  );
  const manifest = JSON.parse(
    readFileSync(join(__dirname, 'shadow-samuel.compose.json'), 'utf8'),
  ) as { qr: boolean };

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

  it('uses only Samuel-specific services, network, volumes, and ports', () => {
    expect(compose).toContain('name: copilot-shadow-samuel');
    expect(compose).toContain('shadow-samuel-api:');
    expect(compose).toContain('shadow-samuel-evolution-api:');
    expect(compose).toContain('shadow-samuel-postgres:');
    expect(compose).toContain('shadow-samuel-redis:');
    expect(compose).toContain('name: copilot-shadow-samuel-net');
    expect(compose).toContain('127.0.0.1:3321:3321');
    expect(compose).toContain('127.0.0.1:18082:8080');
    expect(compose).toContain('127.0.0.1:15434:5432');
    expect(compose).toContain('127.0.0.1:16380:6379');
    expect(compose).toContain('name: copilot_shadow_samuel_data');
    expect(compose).toContain(
      'name: copilot_shadow_samuel_evolution_instances',
    );
    expect(compose).toContain('name: copilot_shadow_samuel_postgres_data');
    expect(compose).toContain('name: copilot_shadow_samuel_redis_data');
    expect(compose).not.toContain('shadow-edgar');
    expect(compose).not.toContain('SHADOW_EDGAR_');
  });

  it('selects the Samuel instance and independently allowlisted operator', () => {
    expect(compose).toContain('SHADOW_ONLY_MODE: samuel');
    expect(compose).toContain(
      'SHADOW_EVOLUTION_INSTANCE_NAME: evolution-shadow-samuel',
    );
    expect(compose).toContain(
      'SHADOW_SAMUEL_OPERATOR_JIDS: "${SHADOW_SAMUEL_OPERATOR_JIDS:-}"',
    );
    expect(compose).toContain('SERVER_NAME: evolution-shadow-samuel');
    expect(compose).toContain(
      'DATABASE_CONNECTION_CLIENT_NAME: evolution-shadow-samuel',
    );
    expect(compose).toContain(
      'WEBHOOK_GLOBAL_URL: http://shadow-samuel-api:3321/webhooks/evolution',
    );
  });

  it('enables QR and the required receive webhook events', () => {
    const evolutionService = serviceBlock('shadow-samuel-evolution-api');

    expect(manifest.qr).toBe(true);
    expect(evolutionService).toContain('WEBHOOK_EVENTS_QRCODE_UPDATED: "true"');
    expect(evolutionService).toContain(
      'WEBHOOK_EVENTS_MESSAGES_UPSERT: "true"',
    );
    expect(evolutionService).toContain(
      'WEBHOOK_EVENTS_CONNECTION_UPDATE: "true"',
    );
    expect(evolutionService).toContain('QRCODE_LIMIT: "30"');
  });

  it('disables all operational persistence and keeps only instance state', () => {
    const evolutionService = serviceBlock('shadow-samuel-evolution-api');
    const persistence = {
      DATABASE_SAVE_DATA_INSTANCE: 'true',
      DATABASE_SAVE_DATA_NEW_MESSAGE: 'false',
      DATABASE_SAVE_MESSAGE_UPDATE: 'false',
      DATABASE_SAVE_DATA_CONTACTS: 'false',
      DATABASE_SAVE_DATA_CHATS: 'false',
      DATABASE_SAVE_DATA_HISTORIC: 'false',
      DATABASE_SAVE_DATA_LABELS: 'false',
      CACHE_REDIS_ENABLED: 'false',
      CACHE_REDIS_SAVE_INSTANCES: 'false',
    };

    for (const [name, value] of Object.entries(persistence)) {
      expect(evolutionService).toContain(`${name}: "${value}"`);
    }

    expect(evolutionService).not.toMatch(
      /DATABASE_SAVE_DATA_(?:NEW_MESSAGE|CONTACTS|CHATS|HISTORIC|LABELS|LEADS):\s*"true"/i,
    );
    expect(evolutionService).not.toMatch(
      /DATABASE_SAVE_MESSAGE_UPDATE:\s*"true"/i,
    );
  });

  it('keeps Samuel fully isolated from Edgar and free of external integrations', () => {
    expect(compose).not.toContain('env_file:');
    expect(compose).not.toContain('external: true');
    expect(compose).not.toMatch(/(?:supabase|gemini|leads|chatwoot|typebot):/i);
    expect(compose).not.toContain('evolution-shadow-edgar');
    expect(compose).not.toContain('copilot_shadow_edgar');

    for (const expression of compose.matchAll(/\$\{([^}]+)\}/g)) {
      expect(expression[1]).toMatch(/:\?|:-/);
    }

    expect(compose).toMatch(
      /AUTHENTICATION_API_KEY:\s*"\$\{SHADOW_SAMUEL_EVOLUTION_API_KEY:\?[^}]+\}"/,
    );
    expect(compose).toMatch(
      /POSTGRES_PASSWORD:\s*"\$\{SHADOW_SAMUEL_POSTGRES_PASSWORD:\?[^}]+\}"/,
    );
    expect(compose).not.toEqual(edgarCompose);
  });

  it('preserves the receive-only safety invariants', () => {
    expect(compose).toContain('SENDER: "false"');
    expect(compose).toContain('AUTO_SEND_MESSAGES: "false"');
    expect(compose).toContain('NO_LEAD_SEND: "true"');
    expect(compose).toContain('WEBHOOK_EVENTS_SEND_MESSAGE: "false"');
    expect(compose).toContain('WEBHOOK_EVENTS_SEND_MESSAGE_UPDATE: "false"');
    expect(compose).toContain('OPENAI_ENABLED: "false"');
    expect(compose).toContain('N8N_ENABLED: "false"');
    expect(compose).toContain('TYPEBOT_ENABLED: "false"');
    expect(compose).toContain('CHATWOOT_ENABLED: "false"');
  });
});
