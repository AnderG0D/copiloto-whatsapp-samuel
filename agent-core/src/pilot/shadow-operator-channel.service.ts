import { Injectable } from '@nestjs/common';
import {
  type ShadowPilotConfiguration,
  type ShadowPilotSafetyInvariants,
} from '../shadow-pilot/shadow-pilot.config';
import { ShadowPilotService } from '../shadow-pilot/shadow-pilot.service';

export type ShadowOperatorChannelRequest = Readonly<{
  pilotId: string;
  operatorId: string;
  testAccountId: string;
  evolutionInstanceName: string;
  dataNamespace: string;
  destination: 'operator' | 'lead';
}>;

export type ShadowOperatorChannelAccess = Readonly<{
  pilot: ShadowPilotConfiguration;
  safetyInvariants: ShadowPilotSafetyInvariants;
}>;

export class ShadowOperatorChannelAccessDeniedError extends Error {
  constructor() {
    super('Shadow operator channel access is not authorized');
  }
}

@Injectable()
export class ShadowOperatorChannelService {
  constructor(private readonly shadowPilotService: ShadowPilotService) {}

  open(request: ShadowOperatorChannelRequest): ShadowOperatorChannelAccess {
    let pilot: ShadowPilotConfiguration;

    try {
      pilot = this.shadowPilotService.resolve({
        pilotId: request.pilotId,
        operatorId: request.operatorId,
        testAccountId: request.testAccountId,
        evolutionInstanceName: request.evolutionInstanceName,
      });
    } catch {
      throw new ShadowOperatorChannelAccessDeniedError();
    }

    if (
      request.destination !== 'operator' ||
      request.dataNamespace !== pilot.dataNamespace
    ) {
      throw new ShadowOperatorChannelAccessDeniedError();
    }

    return {
      pilot,
      safetyInvariants: this.shadowPilotService.getSafetyInvariants(),
    };
  }
}
