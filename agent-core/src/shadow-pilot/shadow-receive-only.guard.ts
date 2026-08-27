import { Inject, Injectable } from '@nestjs/common';
import {
  getShadowPilotConfigurations,
  SHADOW_PILOT_SAFETY_INVARIANTS,
  type ShadowPilotId,
  type ShadowPilotSafetyInvariants,
} from './shadow-pilot.config';

const SHADOW_EVOLUTION_INSTANCE_PREFIX = 'evolution-shadow-';
export const SHADOW_RECEIVE_ONLY_RUNTIME_ENV = Symbol(
  'SHADOW_RECEIVE_ONLY_RUNTIME_ENV',
);
const OPERATOR_ALLOWLIST_ENV_NAMES: Record<ShadowPilotId, string> = {
  'shadow-edgar': 'SHADOW_EDGAR_OPERATOR_JIDS',
  'shadow-samuel': 'SHADOW_SAMUEL_OPERATOR_JIDS',
};

export type ShadowReceiveOnlyRejectionReason =
  | 'unknown_shadow_instance'
  | 'invalid_event'
  | 'from_me'
  | 'group_message'
  | 'non_individual_identity'
  | 'non_text_message'
  | 'incomplete_identity'
  | 'operator_not_allowlisted'
  | 'cross_pilot_identity';

export type ShadowReceiveOnlyDecision = Readonly<{
  isShadowInstance: boolean;
  accepted: boolean;
  pilotId?: ShadowPilotId;
  rejectionReason?: ShadowReceiveOnlyRejectionReason;
  safetyInvariants: ShadowPilotSafetyInvariants;
}>;

@Injectable()
export class ShadowReceiveOnlyGuard {
  constructor(
    @Inject(SHADOW_RECEIVE_ONLY_RUNTIME_ENV)
    private readonly runtimeEnvironment: NodeJS.ProcessEnv = process.env,
  ) {}

  evaluate(payload: unknown): ShadowReceiveOnlyDecision {
    const instanceName = this.getInstanceName(payload);

    if (!this.isShadowInstanceName(instanceName)) {
      return this.decision(false, false);
    }

    const pilot = getShadowPilotConfigurations().find(
      (candidate) => candidate.evolutionInstanceName === instanceName,
    );

    if (!pilot) {
      return this.decision(true, false, 'unknown_shadow_instance');
    }

    const event = this.getStringProperty(payload, 'event')
      ?.toLowerCase()
      .replaceAll('_', '.');
    if (event !== 'messages.upsert') {
      return this.decision(true, false, 'invalid_event', pilot.id);
    }

    const messageData = this.getMessageData(payload);
    if (!messageData || messageData.key?.fromMe === true) {
      return this.decision(
        true,
        false,
        messageData?.key?.fromMe === true ? 'from_me' : 'incomplete_identity',
        pilot.id,
      );
    }

    const remoteJid = messageData.key?.remoteJid;
    if (typeof remoteJid !== 'string' || !remoteJid.trim()) {
      return this.decision(true, false, 'incomplete_identity', pilot.id);
    }

    if (remoteJid.endsWith('@g.us')) {
      return this.decision(true, false, 'group_message', pilot.id);
    }

    const operatorIdentity = this.normalizeIndividualJid(remoteJid);
    if (!operatorIdentity) {
      return this.decision(true, false, 'non_individual_identity', pilot.id);
    }

    if (!this.extractText(messageData.message)) {
      return this.decision(true, false, 'non_text_message', pilot.id);
    }

    const configuredOwners = getShadowPilotConfigurations().filter(
      (candidate) =>
        this.getAllowedOperatorIdentities(candidate.id).has(operatorIdentity),
    );

    if (configuredOwners.length === 0) {
      return this.decision(true, false, 'operator_not_allowlisted', pilot.id);
    }

    if (configuredOwners.length !== 1 || configuredOwners[0].id !== pilot.id) {
      return this.decision(true, false, 'cross_pilot_identity', pilot.id);
    }

    return {
      isShadowInstance: true,
      accepted: true,
      pilotId: pilot.id,
      safetyInvariants: SHADOW_PILOT_SAFETY_INVARIANTS,
    };
  }

  private decision(
    isShadowInstance: boolean,
    accepted: boolean,
    rejectionReason?: ShadowReceiveOnlyRejectionReason,
    pilotId?: ShadowPilotId,
  ): ShadowReceiveOnlyDecision {
    return {
      isShadowInstance,
      accepted,
      ...(pilotId && { pilotId }),
      ...(rejectionReason && { rejectionReason }),
      safetyInvariants: SHADOW_PILOT_SAFETY_INVARIANTS,
    };
  }

  private isShadowInstanceName(instanceName: string | undefined): boolean {
    return instanceName?.startsWith(SHADOW_EVOLUTION_INSTANCE_PREFIX) ?? false;
  }

  private getInstanceName(payload: unknown): string | undefined {
    return this.getStringProperty(payload, 'instance');
  }

  private getMessageData(payload: unknown): any | undefined {
    if (!payload || typeof payload !== 'object') {
      return undefined;
    }

    const data = (payload as { data?: unknown }).data;
    return Array.isArray(data) ? data[0] : data;
  }

  private getStringProperty(
    payload: unknown,
    property: string,
  ): string | undefined {
    if (!payload || typeof payload !== 'object') {
      return undefined;
    }

    const value = (payload as Record<string, unknown>)[property];
    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  private extractText(message: any): string {
    return (
      message?.conversation ||
      message?.extendedTextMessage?.text ||
      ''
    ).trim();
  }

  private getAllowedOperatorIdentities(pilotId: ShadowPilotId): Set<string> {
    const configuredValues =
      this.runtimeEnvironment[OPERATOR_ALLOWLIST_ENV_NAMES[pilotId]] ?? '';

    return new Set(
      configuredValues
        .split(',')
        .map((value) => this.normalizeConfiguredOperatorIdentity(value.trim()))
        .filter((value): value is string => Boolean(value)),
    );
  }

  private normalizeIndividualJid(value: string): string | null {
    const match = /^(\d+)@(s\.whatsapp\.net|c\.us)$/.exec(value);
    return match ? `${match[1]}@s.whatsapp.net` : null;
  }

  private normalizeConfiguredOperatorIdentity(value: string): string | null {
    if (/^\d+$/.test(value)) {
      return `${value}@s.whatsapp.net`;
    }

    return this.normalizeIndividualJid(value);
  }
}
