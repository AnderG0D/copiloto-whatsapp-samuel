import {
  ShadowReceiveOnlyGuard,
  type ShadowReceiveOnlyRejectionReason,
} from './shadow-receive-only.guard';

describe('ShadowReceiveOnlyGuard', () => {
  const edgarInstance = 'evolution-shadow-edgar';
  const samuelInstance = 'evolution-shadow-samuel';
  const edgarJid = '11111111111@s.whatsapp.net';
  const samuelJid = '22222222222@s.whatsapp.net';

  const runtimeEnvironment = {
    SHADOW_EDGAR_OPERATOR_JIDS: edgarJid,
    SHADOW_SAMUEL_OPERATOR_JIDS: samuelJid,
  };

  const payloadFor = (instance: string, remoteJid = edgarJid) => ({
    event: 'messages.upsert',
    instance,
    data: {
      key: { fromMe: false, remoteJid, id: 'dummy-message-id' },
      message: { conversation: 'mensaje de prueba' },
    },
  });

  const expectRejected = (
    payload: unknown,
    reason: ShadowReceiveOnlyRejectionReason,
  ) => {
    const decision = new ShadowReceiveOnlyGuard(runtimeEnvironment).evaluate(
      payload,
    );
    expect(decision).toMatchObject({
      isShadowInstance: true,
      accepted: false,
      rejectionReason: reason,
      safetyInvariants: {
        sender: false,
        autoSendMessages: false,
        noLeadSend: true,
      },
    });
  };

  it('accepts only the exact instance and its runtime allowlisted operator', () => {
    expect(
      new ShadowReceiveOnlyGuard(runtimeEnvironment).evaluate(
        payloadFor(edgarInstance),
      ),
    ).toMatchObject({
      isShadowInstance: true,
      accepted: true,
      pilotId: 'shadow-edgar',
      safetyInvariants: {
        sender: false,
        autoSendMessages: false,
        noLeadSend: true,
      },
    });
  });

  it('accepts a phone-only runtime allowlist entry', () => {
    expect(
      new ShadowReceiveOnlyGuard({
        SHADOW_EDGAR_OPERATOR_JIDS: '11111111111',
        SHADOW_SAMUEL_OPERATOR_JIDS: '',
      }).evaluate(payloadFor(edgarInstance)),
    ).toMatchObject({ accepted: true, pilotId: 'shadow-edgar' });
  });

  it('rejects an unknown shadow instance', () => {
    expectRejected(
      payloadFor('evolution-shadow-unknown'),
      'unknown_shadow_instance',
    );
  });

  it('fails closed when the matching allowlist is empty', () => {
    const decision = new ShadowReceiveOnlyGuard({
      SHADOW_EDGAR_OPERATOR_JIDS: '',
      SHADOW_SAMUEL_OPERATOR_JIDS: '',
    }).evaluate(payloadFor(edgarInstance));

    expect(decision).toMatchObject({
      isShadowInstance: true,
      accepted: false,
      rejectionReason: 'operator_not_allowlisted',
    });
  });

  it('rejects an individual JID that is not runtime allowlisted', () => {
    expectRejected(
      payloadFor(edgarInstance, '33333333333@s.whatsapp.net'),
      'operator_not_allowlisted',
    );
  });

  it('rejects an identity that is allowlisted for the other pilot', () => {
    expectRejected(
      payloadFor(edgarInstance, samuelJid),
      'cross_pilot_identity',
    );
  });

  it.each([
    [
      'a group',
      () => ({
        ...payloadFor(edgarInstance),
        data: {
          ...payloadFor(edgarInstance).data,
          key: {
            ...payloadFor(edgarInstance).data.key,
            remoteJid: 'dummy-group@g.us',
          },
        },
      }),
      'group_message',
    ],
    [
      'a fromMe message',
      () => ({
        ...payloadFor(edgarInstance),
        data: {
          ...payloadFor(edgarInstance).data,
          key: { ...payloadFor(edgarInstance).data.key, fromMe: true },
        },
      }),
      'from_me',
    ],
    [
      'an incomplete identity',
      () => ({
        ...payloadFor(edgarInstance),
        data: { ...payloadFor(edgarInstance).data, key: { fromMe: false } },
      }),
      'incomplete_identity',
    ],
  ] as const)('rejects %s', (_scenario, buildPayload, reason) => {
    expectRejected(buildPayload(), reason);
  });

  it('leaves a non-shadow instance for the normal webhook flow', () => {
    expect(
      new ShadowReceiveOnlyGuard(runtimeEnvironment).evaluate(
        payloadFor('regular-instance'),
      ),
    ).toMatchObject({ isShadowInstance: false, accepted: false });
  });
});
