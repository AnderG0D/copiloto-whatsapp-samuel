import { Injectable } from '@nestjs/common';
import {
  ShadowReceiveOnlyGuard,
  type ShadowReceiveOnlyRejectionReason,
} from './shadow-receive-only.guard';

type ShadowOnlyRejectionReason =
  | ShadowReceiveOnlyRejectionReason
  | 'inactive_shadow_pilot';

@Injectable()
export class ShadowOnlyWebhookService {
  constructor(
    private readonly shadowReceiveOnlyGuard: ShadowReceiveOnlyGuard,
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

    const isEdgar = decision.pilotId === 'shadow-edgar';
    const accepted = isEdgar && decision.accepted;
    const rejectionReason: ShadowOnlyRejectionReason | undefined = isEdgar
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
