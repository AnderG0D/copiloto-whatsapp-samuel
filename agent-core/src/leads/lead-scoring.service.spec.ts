import { LeadScoringService } from './lead-scoring.service';

describe('LeadScoringService', () => {
  let service: LeadScoringService;

  beforeEach(() => {
    service = new LeadScoringService();
  });

  it.each([
    ['Hola', 'COLD'],
    ['Me interesa una Ranger', 'WARM'],
    ['Cuánto cuesta y la puedo ver hoy?', 'HOT'],
    ['Ya compré, gracias', 'NOT_INTERESTED'],
  ] as const)(
    'classifies "%s" as %s',
    (message, expectedClassification) => {
      const result = service.scoreMessage({
        message,
        currentLeadScore: 0,
      });

      expect(result.classification).toBe(expectedClassification);
    },
  );

  it('recognizes "la puedo ver" as appointment intent', () => {
    const result = service.scoreMessage({
      message: 'Cuánto cuesta y la puedo ver hoy?',
      currentLeadScore: 0,
    });

    expect(result.signals.appointment).toBe(true);
    expect(result.messageScore).toBe(70);
    expect(result.leadScore).toBe(70);
  });
});
