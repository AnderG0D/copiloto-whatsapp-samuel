import { Injectable } from '@nestjs/common';

export type LeadClassification = 'COLD' | 'WARM' | 'HOT';

@Injectable()
export class LeadScoringService {
  calculateMessageScore(message: string): number {
    const text = message.toLowerCase();
    
    let score = 0;
    
    const rules: { keywords: string[]; points: number }[] = [
      {
        keywords: ['precio', 'cuanto cuesta', 'cuánto cuesta', 'costo', 'vale'],
        points: 20,
      },
      {
        keywords: ['financiamiento', 'credito', 'crédito', 'mensualidad', 'enganche'],
        points: 25,
      },
      {
        keywords: ['me interesa', 'estoy interesado', 'info', 'informacion', 'información'],
        points: 20,
      },
      {
        keywords: ['cita', 'verlo', 'lo quiero ver', 'cuando puedo ir', 'agendar'],
        points: 30,
      },
      {
        keywords: ['disponible', 'aun lo tienes', 'aún lo tienes', 'hay disponible'],
        points: 15,
      },
      {
        keywords: ['ford', 'ranger', 'f150', 'f-150', 'mustang', 'bronco', 'explorer'],
        points: 20,
      },
      {
        keywords: ['hoy', 'mañana', 'ahorita', 'urgente'],
        points: 20,
      },
    ];

    for (const rule of rules) {
      const matched = rule.keywords.some((keyword) => text.includes(keyword));
      if (matched) {
        score += rule.points;
      }
    }

    return Math.min(score, 100);
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
}
