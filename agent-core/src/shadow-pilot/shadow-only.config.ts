import {
  getShadowPilotConfigurations,
  type ShadowPilotConfiguration,
} from './shadow-pilot.config';

export const SHADOW_ONLY_MODE_ENV = 'SHADOW_ONLY_MODE';
export const EDGAR_SHADOW_ONLY_MODE = 'edgar';

export function isEdgarShadowOnlyMode(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return environment[SHADOW_ONLY_MODE_ENV] === EDGAR_SHADOW_ONLY_MODE;
}

export function getShadowOnlyPilotConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): ShadowPilotConfiguration | undefined {
  if (!isEdgarShadowOnlyMode(environment)) {
    return undefined;
  }

  return getShadowPilotConfigurations().find(
    (pilot) => pilot.id === 'shadow-edgar',
  );
}
