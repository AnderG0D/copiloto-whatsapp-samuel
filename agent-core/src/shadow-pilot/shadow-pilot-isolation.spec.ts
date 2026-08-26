import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  getShadowPilotConfigurations,
  SHADOW_PILOT_ALLOWLIST,
} from './shadow-pilot.config';

type ShadowPilotCompose = Readonly<{
  id: string;
  allowlist: readonly string[];
  operatorId: string;
  testAccountId: string;
  evolutionInstanceName: string;
  dataNamespace: string;
  sender: false;
  autoSendMessages: false;
  noLeadSend: true;
  qr: false;
  contacts: readonly [];
  leads: readonly [];
  externalServices: readonly [];
}>;

const sourceDirectory = __dirname;

function readCompose(fileName: string): ShadowPilotCompose {
  return JSON.parse(
    readFileSync(join(sourceDirectory, fileName), 'utf8'),
  ) as ShadowPilotCompose;
}

describe('shadow pilot isolation manifests', () => {
  const manifests = [
    readCompose('shadow-edgar.compose.json'),
    readCompose('shadow-samuel.compose.json'),
  ];

  it('contains exactly the live allowlisted pilots', () => {
    expect(manifests.map((manifest) => manifest.id)).toEqual(
      SHADOW_PILOT_ALLOWLIST,
    );
    expect(SHADOW_PILOT_ALLOWLIST).toEqual([
      'shadow-edgar',
      'shadow-samuel',
    ]);
  });

  it.each(manifests)('$id has one dedicated operator allowlist entry', (manifest) => {
    expect(manifest.allowlist).toEqual([manifest.operatorId]);
    expect(manifest.allowlist).toHaveLength(1);
    expect(manifest.allowlist[0]).toBe(`operator-${manifest.id}`);
  });

  it('matches every manifest identity to the live service configuration', () => {
    const configurations = getShadowPilotConfigurations();

    for (const manifest of manifests) {
      const configuration = configurations.find(({ id }) => id === manifest.id);

      expect(configuration).toBeDefined();
      expect(manifest.operatorId).toBe(configuration?.operatorId);
      expect(manifest.testAccountId).toBe(configuration?.testAccountId);
      expect(manifest.evolutionInstanceName).toBe(
        configuration?.evolutionInstanceName,
      );
      expect(manifest.dataNamespace).toBe(configuration?.dataNamespace);
    }
  });

  it('keeps account, Evolution, and data namespaces isolated', () => {
    for (const field of [
      'operatorId',
      'testAccountId',
      'evolutionInstanceName',
      'dataNamespace',
    ] as const) {
      expect(new Set(manifests.map((manifest) => manifest[field])).size).toBe(2);
    }
  });

  it.each(manifests)('$id is a no-send, no-contact local manifest', (manifest) => {
    expect(manifest.sender).toBe(false);
    expect(manifest.autoSendMessages).toBe(false);
    expect(manifest.noLeadSend).toBe(true);
    expect(manifest.qr).toBe(false);
    expect(manifest.contacts).toEqual([]);
    expect(manifest.leads).toEqual([]);
    expect(manifest.externalServices).toEqual([]);
  });

});
