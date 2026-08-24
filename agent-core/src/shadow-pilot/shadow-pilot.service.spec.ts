import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  getShadowPilotConfigurations,
  SHADOW_PILOT_ALLOWLIST,
} from './shadow-pilot.config';
import {
  ShadowPilotAccessDeniedError,
  ShadowPilotService,
} from './shadow-pilot.service';

describe('ShadowPilotService', () => {
  const service = new ShadowPilotService();
  const [hiramPilot, samuelPilot] = getShadowPilotConfigurations();

  it('defines exactly the two required isolated pilots', () => {
    expect(service.listPilotIds()).toEqual(['shadow-hiram', 'shadow-samuel']);
    expect(getShadowPilotConfigurations()).toHaveLength(2);
  });

  it('exports a frozen allowlist for exactly the two shadow pilots', () => {
    expect(Object.isFrozen(SHADOW_PILOT_ALLOWLIST)).toBe(true);
    expect(SHADOW_PILOT_ALLOWLIST).toEqual(['shadow-hiram', 'shadow-samuel']);
  });

  it('uses distinct operator, account, instance, and data namespace identifiers', () => {
    expect(hiramPilot.operatorId).not.toBe(samuelPilot.operatorId);
    expect(hiramPilot.testAccountId).not.toBe(samuelPilot.testAccountId);
    expect(hiramPilot.evolutionInstanceName).not.toBe(
      samuelPilot.evolutionInstanceName,
    );
    expect(hiramPilot.dataNamespace).not.toBe(samuelPilot.dataNamespace);
  });

  it.each([hiramPilot, samuelPilot])(
    'resolves only the complete allowed combination for $id',
    (pilot) => {
      expect(
        service.resolve({
          pilotId: pilot.id,
          operatorId: pilot.operatorId,
          testAccountId: pilot.testAccountId,
          evolutionInstanceName: pilot.evolutionInstanceName,
        }),
      ).toBe(pilot);
    },
  );

  it.each([
    {
      name: 'unknown pilot',
      request: { ...hiramPilot, pilotId: 'shadow-unknown' },
    },
    {
      name: 'unknown operator',
      request: { ...hiramPilot, operatorId: 'operator-unknown' },
    },
    {
      name: 'unknown test account',
      request: { ...hiramPilot, testAccountId: 'test-account-unknown' },
    },
    {
      name: 'unknown Evolution instance',
      request: {
        ...hiramPilot,
        evolutionInstanceName: 'evolution-shadow-unknown',
      },
    },
  ])('fails closed for $name', ({ request }) => {
    expect(() => service.resolve(request)).toThrow(ShadowPilotAccessDeniedError);
  });

  it.each([
    {
      name: 'Hiram operator with Samuel pilot',
      request: {
        pilotId: samuelPilot.id,
        operatorId: hiramPilot.operatorId,
        testAccountId: samuelPilot.testAccountId,
        evolutionInstanceName: samuelPilot.evolutionInstanceName,
      },
    },
    {
      name: 'Samuel account with Hiram pilot',
      request: {
        pilotId: hiramPilot.id,
        operatorId: hiramPilot.operatorId,
        testAccountId: samuelPilot.testAccountId,
        evolutionInstanceName: hiramPilot.evolutionInstanceName,
      },
    },
    {
      name: 'Samuel instance with Hiram pilot',
      request: {
        pilotId: hiramPilot.id,
        operatorId: hiramPilot.operatorId,
        testAccountId: hiramPilot.testAccountId,
        evolutionInstanceName: samuelPilot.evolutionInstanceName,
      },
    },
  ])('rejects a cross-pilot identity: $name', ({ request }) => {
    expect(() => service.resolve(request)).toThrow(ShadowPilotAccessDeniedError);
  });

  it('fixes the no-send safety invariants', () => {
    expect(service.getSafetyInvariants()).toEqual({
      sender: false,
      autoSendMessages: false,
      noLeadSend: true,
    });
  });

  it('does not import or use forbidden external integration concerns', () => {
    const sourceDirectory = __dirname;
    const productionSources = [
      'shadow-pilot.config.ts',
      'shadow-pilot.service.ts',
      'shadow-pilot.module.ts',
    ].map((fileName) => readFileSync(join(sourceDirectory, fileName), 'utf8'));
    const integrationReferences = productionSources
      .join('\n')
      .match(
        /(?:from\s+['"][^'"]*(?:webhooks?|supabase|ai\/|sender|outbox|axios)[^'"]*['"]|(?:require|import)\s*\(\s*['"][^'"]*(?:webhooks?|supabase|ai\/|sender|outbox|axios)[^'"]*['"]\s*\)|\b(?:webhooks?|supabase|ai|sender|outbox|axios)\s*(?:\.|\()|\bfetch\s*\()/gi,
      ) ?? [];

    expect(integrationReferences).toEqual([]);
  });
});
