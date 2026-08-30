import { ShadowReceiveOnlyGuard } from './shadow-receive-only.guard';
import { ShadowOnlyWebhookService } from './shadow-only-webhook.service';

describe('ShadowOnlyWebhookService', () => {
  const runtimeEnvironment = {
    SHADOW_EDGAR_OPERATOR_JIDS: '11111111111@s.whatsapp.net',
    SHADOW_SAMUEL_OPERATOR_JIDS: '22222222222@s.whatsapp.net',
  };

  const payloadFor = (instance: string, remoteJid: string) => ({
    event: 'messages.upsert',
    instance,
    data: {
      key: { fromMe: false, remoteJid, id: 'dummy-message-id' },
      message: { conversation: 'mensaje local de prueba' },
    },
  });

  it('accepts Edgar input without persistence or AI side effects', () => {
    const service = new ShadowOnlyWebhookService(
      new ShadowReceiveOnlyGuard(runtimeEnvironment),
    );

    expect(
      service.handleIncomingWebhook(
        payloadFor('evolution-shadow-edgar', '11111111111@s.whatsapp.net'),
      ),
    ).toEqual({
      ok: true,
      received: true,
      shadow: true,
      accepted: true,
      persisted: false,
      pilotId: 'shadow-edgar',
      safetyInvariants: {
        sender: false,
        autoSendMessages: false,
        noLeadSend: true,
      },
    });
  });

  it('rejects Samuel input in the Edgar-only process', () => {
    const service = new ShadowOnlyWebhookService(
      new ShadowReceiveOnlyGuard(runtimeEnvironment),
    );

    expect(
      service.handleIncomingWebhook(
        payloadFor('evolution-shadow-samuel', '22222222222@s.whatsapp.net'),
      ),
    ).toMatchObject({
      shadow: true,
      accepted: false,
      persisted: false,
      pilotId: 'shadow-samuel',
      rejected: true,
      reason: 'inactive_shadow_pilot',
      safetyInvariants: {
        sender: false,
        autoSendMessages: false,
        noLeadSend: true,
      },
    });
  });

  it('accepts Samuel input in the Samuel-only process', () => {
    const service = new ShadowOnlyWebhookService(
      new ShadowReceiveOnlyGuard(runtimeEnvironment),
      'shadow-samuel',
    );

    expect(
      service.handleIncomingWebhook(
        payloadFor('evolution-shadow-samuel', '22222222222@s.whatsapp.net'),
      ),
    ).toMatchObject({
      received: true,
      shadow: true,
      accepted: true,
      persisted: false,
      pilotId: 'shadow-samuel',
    });
  });

  it('does not route regular instances through the normal flow', () => {
    const service = new ShadowOnlyWebhookService(
      new ShadowReceiveOnlyGuard(runtimeEnvironment),
    );

    expect(
      service.handleIncomingWebhook(
        payloadFor('evolution-samuel', '33333333333@s.whatsapp.net'),
      ),
    ).toEqual({
      ok: true,
      ignored: true,
      reason: 'shadow_only_mode',
      safetyInvariants: {
        sender: false,
        autoSendMessages: false,
        noLeadSend: true,
      },
    });
  });
});
