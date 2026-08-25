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
  const [edgarPilot, samuelPilot] = getShadowPilotConfigurations();

  it('defines exactly the two required isolated pilots', () => {
    expect(service.listPilotIds()).toEqual(['shadow-edgar', 'shadow-samuel']);
    expect(getShadowPilotConfigurations()).toHaveLength(2);
  });

  it('exports a frozen allowlist for exactly the two shadow pilots', () => {
    expect(Object.isFrozen(SHADOW_PILOT_ALLOWLIST)).toBe(true);
    expect(SHADOW_PILOT_ALLOWLIST).toEqual(['shadow-edgar', 'shadow-samuel']);
  });

  it('uses distinct operator, account, instance, and data namespace identifiers', () => {
    expect(edgarPilot.operatorId).not.toBe(samuelPilot.operatorId);
    expect(edgarPilot.testAccountId).not.toBe(samuelPilot.testAccountId);
    expect(edgarPilot.evolutionInstanceName).not.toBe(
      samuelPilot.evolutionInstanceName,
    );
    expect(edgarPilot.dataNamespace).not.toBe(samuelPilot.dataNamespace);
  });

  it.each([edgarPilot, samuelPilot])(
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
      request: { ...edgarPilot, pilotId: 'shadow-unknown' },
    },
    {
      name: 'unknown operator',
      request: { ...edgarPilot, operatorId: 'operator-unknown' },
    },
    {
      name: 'unknown test account',
      request: { ...edgarPilot, testAccountId: 'test-account-unknown' },
    },
    {
      name: 'unknown Evolution instance',
      request: {
        ...edgarPilot,
        evolutionInstanceName: 'evolution-shadow-unknown',
      },
    },
  ])('fails closed for $name', ({ request }) => {
    expect(() => service.resolve(request)).toThrow(ShadowPilotAccessDeniedError);
  });

  it.each([
    {
      name: 'Edgar operator with Samuel pilot',
      request: {
        pilotId: samuelPilot.id,
        operatorId: edgarPilot.operatorId,
        testAccountId: samuelPilot.testAccountId,
        evolutionInstanceName: samuelPilot.evolutionInstanceName,
      },
    },
    {
      name: 'Samuel account with Edgar pilot',
      request: {
        pilotId: edgarPilot.id,
        operatorId: edgarPilot.operatorId,
        testAccountId: samuelPilot.testAccountId,
        evolutionInstanceName: edgarPilot.evolutionInstanceName,
      },
    },
    {
      name: 'Samuel instance with Edgar pilot',
      request: {
        pilotId: edgarPilot.id,
        operatorId: edgarPilot.operatorId,
        testAccountId: edgarPilot.testAccountId,
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
