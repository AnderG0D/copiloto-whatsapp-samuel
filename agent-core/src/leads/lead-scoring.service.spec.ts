import { LeadScoringService } from './lead-scoring.service';

describe('LeadScoringService', () => {
  let service: LeadScoringService;

  beforeEach(() => {
    service = new LeadScoringService();
  });

  const scoreMessage = (message: string, currentLeadScore = 0) =>
    service.scoreMessage({
      message,
      currentLeadScore,
    });

  it.each([
    ['Hola', 'COLD'],
    ['Me interesa una Ranger', 'WARM'],
    ['Cuánto cuesta y la puedo ver hoy?', 'HOT'],
    ['Ya compré, gracias', 'NOT_INTERESTED'],
  ] as const)(
    'classifies "%s" as %s',
    (message, expectedClassification) => {
      const result = scoreMessage(message);

      expect(result.classification).toBe(expectedClassification);
    },
  );

  it('recognizes "la puedo ver" as appointment intent', () => {
    const result = scoreMessage('Cuánto cuesta y la puedo ver hoy?');

    expect(result.signals.appointment).toBe(true);
    expect(result.messageScore).toBe(70);
    expect(result.leadScore).toBe(70);
  });

  it('does not mark unknown vehicle models as vehicle-specific', () => {
    const result = scoreMessage('Me interesa un Yaris');

    expect(result.signals.generalInterest).toBe(true);
    expect(result.signals.vehicleSpecific).toBe(false);
    expect(result.signals.vehicleMentioned).toBeNull();
    expect(result.signals.urgency).toBe(false);
  });

  it('detects short urgency keywords as whole words', () => {
    const result = scoreMessage('Estoy listo ya');

    expect(result.signals.urgency).toBe(true);
    expect(result.messageScore).toBe(20);
  });

  it('normalizes casing and accents before detecting signals', () => {
    const result = scoreMessage('¿CUÁNTO cuesta a CRÉDITO?');

    expect(result.signals.price).toBe(true);
    expect(result.signals.financing).toBe(true);
    expect(result.messageScore).toBe(45);
    expect(result.classification).toBe('WARM');
  });

  it.each([
    ['Quiero agendar una cita'],
    ['Cuando puedo ir?'],
    ['Quiero verla'],
    ['La puedo ver'],
    ['Hagamos test drive'],
  ])('recognizes appointment intent variant "%s"', (message) => {
    const result = scoreMessage(message);

    expect(result.signals.appointment).toBe(true);
    expect(result.messageScore).toBe(30);
    expect(result.classification).toBe('WARM');
  });

  it.each([
    ['No gracias'],
    ['Ya compré otro, gracias'],
    ['Ya no me interesa'],
  ])('classifies disinterest "%s" as NOT_INTERESTED', (message) => {
    const result = scoreMessage(message, 80);

    expect(result.signals.notInterested).toBe(true);
    expect(result.messageScore).toBe(0);
    expect(result.leadScore).toBe(0);
    expect(result.classification).toBe('NOT_INTERESTED');
  });

  it('keeps disinterest dominant over other commercial signals', () => {
    const result = scoreMessage('No me interesa, aunque tenga precio y crédito');

    expect(result.signals.notInterested).toBe(true);
    expect(result.signals.price).toBe(true);
    expect(result.signals.financing).toBe(true);
    expect(result.messageScore).toBe(0);
    expect(result.classification).toBe('NOT_INTERESTED');
  });

  it.each([
    ['Lo necesito hoy'],
    ['Puede ser mañana?'],
    ['Estoy listo ahorita'],
  ])('detects urgency in "%s"', (message) => {
    const result = scoreMessage(message);

    expect(result.signals.urgency).toBe(true);
    expect(result.messageScore).toBe(20);
    expect(result.classification).toBe('COLD');
  });

  it('combines multiple signals into a HOT lead', () => {
    const result = scoreMessage(
      'Me interesa una Ranger 2024 Lariat, cuánto cuesta, tiene financiamiento y enganche?',
    );

    expect(result.signals.generalInterest).toBe(true);
    expect(result.signals.vehicleSpecific).toBe(true);
    expect(result.signals.vehicleMentioned).toBe('Ford Ranger');
    expect(result.signals.modelYearOrVersion).toBe('2024 LARIAT');
    expect(result.signals.price).toBe(true);
    expect(result.signals.financing).toBe(true);
    expect(result.signals.downPayment).toBe(true);
    expect(result.messageScore).toBe(70);
    expect(result.classification).toBe('HOT');
  });

  it('detects XLT without matching the shorter XL version first', () => {
    const result = scoreMessage('Me interesa una Ranger XLT');

    expect(result.signals.vehicleSpecific).toBe(true);
    expect(result.signals.modelYearOrVersion).toBe('XLT');
    expect(result.signals.modelYearOrVersion).not.toBe('XL');
  });

  it('keeps detecting XL as an independent version', () => {
    const result = scoreMessage('Me interesa una Ranger XL');

    expect(result.signals.vehicleSpecific).toBe(true);
    expect(result.signals.modelYearOrVersion).toBe('XL');
  });

  it('caps message score at 70 and lead score at 100', () => {
    const result = scoreMessage(
      'Me interesa una Ranger 2024 XLT, cuánto cuesta, financiamiento, enganche, mensualidad, disponible y la puedo ver hoy?',
      80,
    );

    expect(result.messageScore).toBe(70);
    expect(result.leadScore).toBe(100);
    expect(result.classification).toBe('HOT');
  });
});
