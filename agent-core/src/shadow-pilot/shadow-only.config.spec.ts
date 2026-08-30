import {
  EDGAR_SHADOW_ONLY_MODE,
  getShadowOnlyPilotConfiguration,
  isShadowOnlyMode,
  isEdgarShadowOnlyMode,
  SAMUEL_SHADOW_ONLY_MODE,
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

  it('recognizes both isolated shadow-only runtime modes', () => {
    expect(
      isShadowOnlyMode({ [SHADOW_ONLY_MODE_ENV]: EDGAR_SHADOW_ONLY_MODE }),
    ).toBe(true);
    expect(
      isShadowOnlyMode({ [SHADOW_ONLY_MODE_ENV]: SAMUEL_SHADOW_ONLY_MODE }),
    ).toBe(true);
    expect(isShadowOnlyMode({ SHADOW_ONLY_MODE: 'normal' })).toBe(false);
  });

  it('resolves the dedicated identity for each isolated profile', () => {
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
    ).toMatchObject({
      id: 'shadow-samuel',
      evolutionInstanceName: 'evolution-shadow-samuel',
    });
    expect(
      getShadowOnlyPilotConfiguration({ SHADOW_ONLY_MODE: 'normal' }),
    ).toBeUndefined();
  });
});
