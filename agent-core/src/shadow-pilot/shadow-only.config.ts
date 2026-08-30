import {
  getShadowPilotConfigurations,
  type ShadowPilotConfiguration,
  type ShadowPilotId,
} from './shadow-pilot.config';

export const SHADOW_ONLY_MODE_ENV = 'SHADOW_ONLY_MODE';
export const SHADOW_ONLY_ACTIVE_PILOT = Symbol('SHADOW_ONLY_ACTIVE_PILOT');
export const EDGAR_SHADOW_ONLY_MODE = 'edgar';
export const SAMUEL_SHADOW_ONLY_MODE = 'samuel';

export const SHADOW_ONLY_MODES = Object.freeze([
  EDGAR_SHADOW_ONLY_MODE,
  SAMUEL_SHADOW_ONLY_MODE,
] as const);

export function isShadowOnlyMode(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return SHADOW_ONLY_MODES.includes(
    environment[SHADOW_ONLY_MODE_ENV] as (typeof SHADOW_ONLY_MODES)[number],
  );
}

export function isEdgarShadowOnlyMode(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return environment[SHADOW_ONLY_MODE_ENV] === EDGAR_SHADOW_ONLY_MODE;
}

export function getShadowOnlyPilotConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): ShadowPilotConfiguration | undefined {
  if (!isShadowOnlyMode(environment)) {
    return undefined;
  }

  const mode = environment[SHADOW_ONLY_MODE_ENV];
  return getShadowPilotConfigurations().find(
    (pilot) => pilot.id === `shadow-${mode}`,
  );
}

export function getShadowOnlyPilotId(
  environment: NodeJS.ProcessEnv = process.env,
): ShadowPilotId | undefined {
  return getShadowOnlyPilotConfiguration(environment)?.id;
}
