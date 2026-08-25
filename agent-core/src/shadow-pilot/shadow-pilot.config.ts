export type ShadowPilotId = 'shadow-edgar' | 'shadow-samuel';

export type ShadowPilotConfiguration = Readonly<{
  id: ShadowPilotId;
  operatorId: string;
  testAccountId: string;
  evolutionInstanceName: string;
  dataNamespace: string;
}>;

export type ShadowPilotSafetyInvariants = Readonly<{
  sender: false;
  autoSendMessages: false;
  noLeadSend: true;
}>;

export const SHADOW_PILOT_SAFETY_INVARIANTS: ShadowPilotSafetyInvariants =
  Object.freeze({
    sender: false,
    autoSendMessages: false,
    noLeadSend: true,
  });

export const SHADOW_PILOT_ALLOWLIST: readonly ShadowPilotId[] = Object.freeze([
  'shadow-edgar',
  'shadow-samuel',
]);

const SHADOW_PILOTS: readonly ShadowPilotConfiguration[] = Object.freeze(
  SHADOW_PILOT_ALLOWLIST.map((id) => Object.freeze({
    id,
    operatorId: `operator-${id}`,
    testAccountId: `test-account-${id}`,
    evolutionInstanceName: `evolution-${id}`,
    dataNamespace: `controlled-data-${id}`,
  })),
);

export const getShadowPilotConfigurations = (): readonly ShadowPilotConfiguration[] =>
  SHADOW_PILOTS;
