import { Inject, Injectable } from '@nestjs/common';
import {
  ShadowReceiveOnlyGuard,
  type ShadowReceiveOnlyRejectionReason,
} from './shadow-receive-only.guard';
import { SHADOW_ONLY_ACTIVE_PILOT } from './shadow-only.config';
import type { ShadowPilotId } from './shadow-pilot.config';

type ShadowOnlyRejectionReason =
  | ShadowReceiveOnlyRejectionReason
  | 'inactive_shadow_pilot';

@Injectable()
export class ShadowOnlyWebhookService {
  constructor(
    private readonly shadowReceiveOnlyGuard: ShadowReceiveOnlyGuard,
    @Inject(SHADOW_ONLY_ACTIVE_PILOT)
    private readonly activePilotId: ShadowPilotId = 'shadow-edgar',
  ) {}

  handleIncomingWebhook(payload: unknown) {
    const decision = this.shadowReceiveOnlyGuard.evaluate(payload);

    if (!decision.isShadowInstance) {
      return {
        ok: true,
        ignored: true,
        reason: 'shadow_only_mode',
        safetyInvariants: decision.safetyInvariants,
      };
    }

    const isActivePilot = decision.pilotId === this.activePilotId;
    const accepted = isActivePilot && decision.accepted;
    const rejectionReason: ShadowOnlyRejectionReason | undefined = isActivePilot
      ? decision.rejectionReason
      : 'inactive_shadow_pilot';

    return {
      ok: true,
      received: true,
      shadow: true,
      accepted,
      persisted: false,
      ...(decision.pilotId && { pilotId: decision.pilotId }),
      ...(!accepted && {
        rejected: true,
        reason: rejectionReason,
      }),
      safetyInvariants: decision.safetyInvariants,
    };
  }
}
