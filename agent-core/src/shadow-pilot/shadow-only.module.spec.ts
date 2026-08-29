import { getApplicationModules } from '../app.module';
import { EvolutionWebhookModule } from '../webhooks/evolution/evolution-webhook.module';
import { ResponseDraftReviewModule } from '../admin/response-drafts/response-draft-review.module';
import { ShadowPilotModule } from './shadow-pilot.module';
import { ShadowOnlyModule } from './shadow-only.module';

describe('shadow-only application composition', () => {
  it('loads only the Edgar receive-only module in shadow-only mode', () => {
    expect(getApplicationModules({ SHADOW_ONLY_MODE: 'edgar' })).toEqual([
      ShadowOnlyModule,
    ]);
    expect(getApplicationModules({ SHADOW_ONLY_MODE: 'edgar' })).not.toEqual(
      expect.arrayContaining([
        EvolutionWebhookModule,
        ResponseDraftReviewModule,
        ShadowPilotModule,
      ]),
    );
  });

  it('preserves the normal module composition when shadow-only mode is absent', () => {
    expect(getApplicationModules({})).toEqual([
      EvolutionWebhookModule,
      ResponseDraftReviewModule,
      ShadowPilotModule,
    ]);
  });
});
