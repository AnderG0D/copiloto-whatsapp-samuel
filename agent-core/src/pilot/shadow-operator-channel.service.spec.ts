import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getShadowPilotConfigurations } from '../shadow-pilot/shadow-pilot.config';
import { ShadowPilotService } from '../shadow-pilot/shadow-pilot.service';
import {
  ShadowOperatorChannelAccessDeniedError,
  ShadowOperatorChannelService,
  type ShadowOperatorChannelRequest,
} from './shadow-operator-channel.service';

describe('ShadowOperatorChannelService', () => {
  const service = new ShadowOperatorChannelService(new ShadowPilotService());
  const [edgarPilot, samuelPilot] = getShadowPilotConfigurations();

  const requestFor = (
    pilot: ReturnType<typeof getShadowPilotConfigurations>[number],
  ): ShadowOperatorChannelRequest => ({
    pilotId: pilot.id,
    operatorId: pilot.operatorId,
    testAccountId: pilot.testAccountId,
    evolutionInstanceName: pilot.evolutionInstanceName,
    dataNamespace: pilot.dataNamespace,
    destination: 'operator',
  });

  it('authorizes Edgar only for shadow-edgar', () => {
    expect(service.open(requestFor(edgarPilot)).pilot).toBe(edgarPilot);
  });

  it('authorizes Samuel only for shadow-samuel', () => {
    expect(service.open(requestFor(samuelPilot)).pilot).toBe(samuelPilot);
  });

  it.each([
    { name: 'pilot', request: { ...requestFor(edgarPilot), pilotId: 'shadow-unknown' } },
    {
      name: 'operator',
      request: { ...requestFor(edgarPilot), operatorId: 'operator-unknown' },
    },
    {
      name: 'test account',
      request: {
        ...requestFor(edgarPilot),
        testAccountId: 'test-account-unknown',
      },
    },
    {
      name: 'Evolution instance',
      request: {
        ...requestFor(edgarPilot),
        evolutionInstanceName: 'evolution-unknown',
      },
    },
    {
      name: 'data namespace',
      request: {
        ...requestFor(edgarPilot),
        dataNamespace: 'controlled-data-unknown',
      },
    },
  ])('rejects an unknown $name before opening the channel', ({ request }) => {
    expect(() => service.open(request)).toThrow(
      ShadowOperatorChannelAccessDeniedError,
    );
  });

  it.each([
    {
      name: 'Edgar operator with Samuel pilot',
      request: {
        ...requestFor(samuelPilot),
        operatorId: edgarPilot.operatorId,
      },
    },
    {
      name: 'Samuel account with Edgar pilot',
      request: {
        ...requestFor(edgarPilot),
        testAccountId: samuelPilot.testAccountId,
      },
    },
    {
      name: 'Samuel instance with Edgar pilot',
      request: {
        ...requestFor(edgarPilot),
        evolutionInstanceName: samuelPilot.evolutionInstanceName,
      },
    },
    {
      name: 'Samuel namespace with Edgar pilot',
      request: {
        ...requestFor(edgarPilot),
        dataNamespace: samuelPilot.dataNamespace,
      },
    },
  ])('rejects a cross-pilot combination: $name', ({ request }) => {
    expect(() => service.open(request)).toThrow(
      ShadowOperatorChannelAccessDeniedError,
    );
  });

  it('rejects any destination that is a lead', () => {
    expect(() =>
      service.open({ ...requestFor(edgarPilot), destination: 'lead' }),
    ).toThrow(ShadowOperatorChannelAccessDeniedError);
  });

  it.each([
    ['pilotId', ''],
    ['operatorId', ''],
    ['testAccountId', ''],
    ['evolutionInstanceName', ''],
    ['dataNamespace', ''],
  ] as const)('fails closed for an incomplete %s', (field, value) => {
    expect(() =>
      service.open({ ...requestFor(edgarPilot), [field]: value }),
    ).toThrow(ShadowOperatorChannelAccessDeniedError);
  });

  it('preserves the no-send safety invariants', () => {
    expect(service.open(requestFor(edgarPilot)).safetyInvariants).toEqual({
      sender: false,
      autoSendMessages: false,
      noLeadSend: true,
    });
  });

  it('does not import or call external integration concerns', () => {
    const source = readFileSync(
      join(__dirname, 'shadow-operator-channel.service.ts'),
      'utf8',
    );
    const integrationReferences = source.match(
      /(?:from\s+['"][^'"]*(?:webhooks?|evolution|supabase|ai\/|sender|outbox|axios)[^'"]*['"]|(?:require|import)\s*\(\s*['"][^'"]*(?:webhooks?|evolution|supabase|ai\/|sender|outbox|axios)[^'"]*['"]\s*\)|\b(?:webhooks?|evolution|supabase|ai|sender|outbox|axios)\s*(?:\.|\()|\bfetch\s*\()/gi,
    ) ?? [];

    expect(integrationReferences).toEqual([]);
  });
});
