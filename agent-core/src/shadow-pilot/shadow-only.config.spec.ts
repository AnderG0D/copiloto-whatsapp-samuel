import {
  EDGAR_SHADOW_ONLY_MODE,
  getShadowOnlyPilotConfiguration,
  isEdgarShadowOnlyMode,
  SHADOW_ONLY_MODE_ENV,
} from './shadow-only.config';

describe('Edgar shadow-only profile', () => {
  it('recognizes only SHADOW_ONLY_MODE=edgar', () => {
    expect(
      isEdgarShadowOnlyMode({ [SHADOW_ONLY_MODE_ENV]: EDGAR_SHADOW_ONLY_MODE }),
    ).toBe(true);
    expect(isEdgarShadowOnlyMode({ SHADOW_ONLY_MODE: 'samuel' })).toBe(false);
    expect(isEdgarShadowOnlyMode({})).toBe(false);
  });

  it('resolves the dedicated Edgar identity only for the Edgar profile', () => {
    expect(
      getShadowOnlyPilotConfiguration({ SHADOW_ONLY_MODE: 'edgar' }),
    ).toMatchObject({
      id: 'shadow-edgar',
      operatorId: 'operator-shadow-edgar',
      testAccountId: 'test-account-shadow-edgar',
      evolutionInstanceName: 'evolution-shadow-edgar',
      dataNamespace: 'controlled-data-shadow-edgar',
    });
    expect(
      getShadowOnlyPilotConfiguration({ SHADOW_ONLY_MODE: 'samuel' }),
    ).toBeUndefined();
  });
});
