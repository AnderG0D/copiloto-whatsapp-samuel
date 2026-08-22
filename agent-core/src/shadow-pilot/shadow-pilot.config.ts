export type ShadowPilotId = 'shadow-hiram' | 'shadow-samuel';

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

const SHADOW_PILOTS: readonly ShadowPilotConfiguration[] = Object.freeze([
  Object.freeze({
    id: 'shadow-hiram' as const,
    operatorId: 'operator-shadow-hiram',
    testAccountId: 'test-account-shadow-hiram',
    evolutionInstanceName: 'evolution-shadow-hiram',
    dataNamespace: 'controlled-data-shadow-hiram',
  }),
  Object.freeze({
    id: 'shadow-samuel' as const,
    operatorId: 'operator-shadow-samuel',
    testAccountId: 'test-account-shadow-samuel',
    evolutionInstanceName: 'evolution-shadow-samuel',
    dataNamespace: 'controlled-data-shadow-samuel',
  }),
]);

export const getShadowPilotConfigurations = (): readonly ShadowPilotConfiguration[] =>
  SHADOW_PILOTS;
