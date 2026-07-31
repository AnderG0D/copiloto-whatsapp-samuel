import type {
  DetectedSignals,
  LeadClassification,
} from '../../leads/lead-scoring.service';

export type SafeHistoryRole = 'customer' | 'bot' | 'human';

export interface SafeHistoryMessage {
  role: SafeHistoryRole;
  content: string;
  createdAt: string;
}

export interface ResponseDraftInput {
  business: {
    name: string;
    businessType: string;
  };
  lead: {
    score: number;
    classification: LeadClassification;
    signals: DetectedSignals;
    classificationReason: string;
  };
  currentMessage: string;
  history: SafeHistoryMessage[];
  historyLimit?: number;
}

export interface ResponseDraft {
  text: string;
  status: 'PROPOSED';
}
