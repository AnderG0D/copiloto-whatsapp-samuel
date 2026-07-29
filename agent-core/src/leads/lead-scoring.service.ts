import { Injectable } from '@nestjs/common';

export type LeadClassification = 'COLD' | 'WARM' | 'HOT' | 'NOT_INTERESTED';

export interface DetectedSignals {
  generalInterest: boolean;
  price: boolean;
  financing: boolean;
  downPayment: boolean;
  monthlyPayment: boolean;
  availability: boolean;
  appointment: boolean;
  urgency: boolean;
  vehicleSpecific: boolean;
  vehicleMentioned?: string | null;
  modelYearOrVersion?: string | null;
  notInterested: boolean;
  confusedOrGeneralQuestion: boolean;
}

export interface LeadScoringResult {
  messageScore: number;
  leadScore: number;
  classification: LeadClassification;
  classificationReason: string;
  signals: DetectedSignals;
}

@Injectable()
export class LeadScoringService {
  scoreMessage(params: {
    message: string;
    currentLeadScore: number;
    businessType?: string;
  }): LeadScoringResult {
    const normalizedMessage = this.normalizeMessage(params.message);
    const businessType = params.businessType ?? 'cars';

    const signals = this.detectSignals(normalizedMessage, businessType);
    const messageScore = this.calculateScoreFromSignals(signals);

    const leadScore = signals.notInterested
      ? 0
      : this.calculateLeadScore(params.currentLeadScore, messageScore);

    const classification = this.classifyAdvanced(leadScore, signals);
    const classificationReason = this.buildClassificationReason(
      signals,
      classification,
    );

    return {
      messageScore,
      leadScore,
      classification,
      classificationReason,
      signals,
    };
  }

  calculateMessageScore(message: string): number {
    const normalizedMessage = this.normalizeMessage(message);
    const signals = this.detectSignals(normalizedMessage, 'cars');

    return this.calculateScoreFromSignals(signals);
  }

  calculateLeadScore(previousScore: number, messageScore: number): number {
    const newScore = previousScore + messageScore;
    return Math.min(newScore, 100);
  }

  classify(score: number): LeadClassification {
    if (score >= 70) return 'HOT';
    if (score >= 30) return 'WARM';
    return 'COLD';
  }

  private normalizeMessage(message: string): string {
    return message
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private detectSignals(
    message: string,
    businessType: string,
  ): DetectedSignals {
    const notInterested = this.includesAny(message, [
      'ya compre',
      'ya no me interesa',
      'no me interesa',
      'no gracias',
      'despues veo',
      'luego veo',
      'ya compre otro',
      'ya compre carro',
      'ya compre auto',
      'ya consegui',
      'ya consegui carro',
      'ya encontre',
    ]);

    const price = this.includesAny(message, [
      'precio',
      'cuanto cuesta',
      'costo',
      'vale',
      'valor',
      'en cuanto',
      'cuanto sale',
      'que precio',
    ]);

    const financing = this.includesAny(message, [
      'financiamiento',
      'financiado',
      'credito',
      'a credito',
      'me financian',
      'lo puedo financiar',
    ]);

    const downPayment = this.includesAny(message, [
      'enganche',
      'cuanto de enganche',
      'anticipo',
    ]);

    const monthlyPayment = this.includesAny(message, [
      'mensualidad',
      'mensualidades',
      'pago mensual',
      'pagos',
      'cuanto pagaria',
      'cuanto al mes',
    ]);

    const availability = this.includesAny(message, [
      'disponible',
      'hay disponible',
      'todavia lo tienes',
      'aun lo tienes',
      'sigue disponible',
      'lo tienes',
    ]);

    const appointment = this.includesAny(message, [
      'cita',
      'verlo',
      'verla',
      'la puedo ver',
      'lo quiero ver',
      'la quiero ver',
      'cuando puedo ir',
      'puedo ir',
      'agendar',
      'agenda',
      'prueba de manejo',
      'test drive',
    ]);

    const urgency = this.includesAny(message, [
      'hoy',
      'manana',
      'ahorita',
      'urgente',
      'ya',
      'en la tarde',
      'mas tarde',
      'este fin',
      'fin de semana',
    ]);

    const generalInterest = this.includesAny(message, [
      'me interesa',
      'estoy interesado',
      'info',
      'informacion',
      'informes',
      'me puedes dar informacion',
      'quiero informacion',
    ]);

    const confusedOrGeneralQuestion = this.includesAny(message, [
      'como funciona',
      'que es',
      'solo pregunto',
      'solo queria saber',
      'no entiendo',
      'me explicas',
    ]);

    const vehicleMentioned =
      businessType === 'cars' ? this.detectVehicleMention(message) : null;

    const modelYearOrVersion =
      businessType === 'cars' ? this.detectModelYearOrVersion(message) : null;

    return {
      generalInterest,
      price,
      financing,
      downPayment,
      monthlyPayment,
      availability,
      appointment,
      urgency,
      vehicleSpecific: Boolean(vehicleMentioned),
      vehicleMentioned,
      modelYearOrVersion,
      notInterested,
      confusedOrGeneralQuestion,
    };
  }

  private calculateScoreFromSignals(signals: DetectedSignals): number {
    if (signals.notInterested) return 0;

    let score = 0;

    if (signals.generalInterest) score += 10;
    if (signals.vehicleSpecific) score += 20;
    if (signals.modelYearOrVersion) score += 10;
    if (signals.price) score += 20;
    if (signals.financing) score += 25;
    if (signals.downPayment) score += 20;
    if (signals.monthlyPayment) score += 20;
    if (signals.availability) score += 15;
    if (signals.appointment) score += 30;
    if (signals.urgency) score += 20;

    if (signals.confusedOrGeneralQuestion && score < 15) {
      score += 5;
    }

    if (score === 0) {
      score = 5;
    }

    return Math.min(score, 70);
  }

  private classifyAdvanced(
    leadScore: number,
    signals: DetectedSignals,
  ): LeadClassification {
    if (signals.notInterested) return 'NOT_INTERESTED';

    if (leadScore >= 70) return 'HOT';
    if (leadScore >= 30) return 'WARM';

    return 'COLD';
  }

  private buildClassificationReason(
    signals: DetectedSignals,
    classification: LeadClassification,
  ): string {
    if (classification === 'NOT_INTERESTED') {
      return 'El lead expresó rechazo o indicó que ya no está interesado.';
    }

    const reasons: string[] = [];

    if (signals.generalInterest) {
      reasons.push('mostró interés general');
    }

    if (signals.vehicleSpecific && signals.vehicleMentioned) {
      reasons.push(`mencionó un vehículo específico: ${signals.vehicleMentioned}`);
    }

    if (signals.modelYearOrVersion) {
      reasons.push(`mencionó modelo, año o versión: ${signals.modelYearOrVersion}`);
    }

    if (signals.price) {
      reasons.push('preguntó por precio');
    }

    if (signals.financing) {
      reasons.push('mostró interés en financiamiento');
    }

    if (signals.downPayment) {
      reasons.push('preguntó por enganche');
    }

    if (signals.monthlyPayment) {
      reasons.push('preguntó por mensualidad');
    }

    if (signals.availability) {
      reasons.push('preguntó por disponibilidad');
    }

    if (signals.appointment) {
      reasons.push('mostró intención de agendar o ver el vehículo');
    }

    if (signals.urgency) {
      reasons.push('mostró urgencia');
    }

    if (signals.confusedOrGeneralQuestion && reasons.length === 0) {
      reasons.push('hizo una pregunta general o pidió explicación');
    }

    if (reasons.length === 0) {
      return 'El lead envió un mensaje inicial o de bajo contexto comercial.';
    }

    return `El lead ${this.joinReasons(reasons)}.`;
  }

  private includesAny(message: string, keywords: string[]): boolean {
    return keywords.some((keyword) => message.includes(keyword));
  }

  private detectVehicleMention(message: string): string | null {
    const vehicles: { label: string; keywords: string[] }[] = [
      {
        label: 'Ford Ranger',
        keywords: ['ford ranger', 'ranger'],
      },
      {
        label: 'Ford F-150',
        keywords: ['ford f-150', 'ford f150', 'f-150', 'f150'],
      },
      {
        label: 'Ford Mustang',
        keywords: ['ford mustang', 'mustang'],
      },
      {
        label: 'Ford Bronco',
        keywords: ['ford bronco', 'bronco'],
      },
      {
        label: 'Ford Explorer',
        keywords: ['ford explorer', 'explorer'],
      },
      {
        label: 'Ford Escape',
        keywords: ['ford escape', 'escape'],
      },
      {
        label: 'Ford Maverick',
        keywords: ['ford maverick', 'maverick'],
      },
      {
        label: 'Ford Edge',
        keywords: ['ford edge', 'edge'],
      },
      {
        label: 'Ford Territory',
        keywords: ['ford territory', 'territory'],
      },
    ];

    const foundVehicle = vehicles.find((vehicle) =>
      vehicle.keywords.some((keyword) => message.includes(keyword)),
    );

    return foundVehicle?.label ?? null;
  }

  private detectModelYearOrVersion(message: string): string | null {
    const yearMatch = message.match(/\b(19|20)\d{2}\b/);

    const versionKeywords = [
      'xl',
      'xlt',
      'limited',
      'lariat',
      'platinum',
      'raptor',
      'sport',
      'titanium',
      'st-line',
    ];

    const foundVersion = versionKeywords.find((version) =>
      message.includes(version),
    );

    const parts: string[] = [];

    if (yearMatch?.[0]) {
      parts.push(yearMatch[0]);
    }

    if (foundVersion) {
      parts.push(foundVersion.toUpperCase());
    }

    return parts.length > 0 ? parts.join(' ') : null;
  }

  private joinReasons(reasons: string[]): string {
    if (reasons.length === 1) {
      return reasons[0];
    }

    if (reasons.length === 2) {
      return `${reasons[0]} y ${reasons[1]}`;
    }

    return `${reasons.slice(0, -1).join(', ')} y ${
      reasons[reasons.length - 1]
    }`;
  }
}
