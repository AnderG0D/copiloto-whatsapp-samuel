import { Injectable } from '@nestjs/common';
import {
  getShadowPilotConfigurations,
  SHADOW_PILOT_SAFETY_INVARIANTS,
  type ShadowPilotConfiguration,
  type ShadowPilotId,
  type ShadowPilotSafetyInvariants,
} from './shadow-pilot.config';

export type ShadowPilotResolutionRequest = Readonly<{
  pilotId: string;
  operatorId: string;
  testAccountId: string;
  evolutionInstanceName: string;
}>;

export class ShadowPilotAccessDeniedError extends Error {
  constructor() {
    super('Shadow pilot access is not authorized');
  }
}

@Injectable()
export class ShadowPilotService {
  listPilotIds(): readonly ShadowPilotId[] {
    return getShadowPilotConfigurations().map((pilot) => pilot.id);
  }

  getSafetyInvariants(): ShadowPilotSafetyInvariants {
    return SHADOW_PILOT_SAFETY_INVARIANTS;
  }

  resolve(
    request: ShadowPilotResolutionRequest,
  ): ShadowPilotConfiguration {
    const pilot = getShadowPilotConfigurations().find(
      (candidate) =>
        candidate.id === request.pilotId &&
        candidate.operatorId === request.operatorId &&
        candidate.testAccountId === request.testAccountId &&
        candidate.evolutionInstanceName === request.evolutionInstanceName,
    );

    if (!pilot) {
      throw new ShadowPilotAccessDeniedError();
    }

    return pilot;
  }
}
