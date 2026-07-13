import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  LeadScoringService,
  type DetectedSignals,
  type LeadClassification,
} from '../../leads/lead-scoring.service';
import type { Json } from '../../types/database.types';

type IncomingWhatsappMessage = {
  instanceName: string;
  phone: string;
  customerName: string | null;
  messageId: string | null;
  text: string;
  rawPayload: any;
};

type SavedIncomingMessage = {
  businessName: string;
  leadId: string;
  duplicated: boolean;
  messageScore?: number;
  leadScore?: number;
  classification?: LeadClassification;
  classificationReason?: string;
  signals?: DetectedSignals;
};

@Injectable()
export class EvolutionWebhookService {
  private readonly logger = new Logger(EvolutionWebhookService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly leadScoringService: LeadScoringService,
  ) {}

  async handleIncomingWebhook(payload: any) {
    const incomingMessage = this.parseIncomingWhatsappMessage(payload);

    if (!incomingMessage) {
      return {
        ok: true,
        ignored: true,
      };
    }

    const savedMessage = await this.saveIncomingMessage(incomingMessage);

    if (!savedMessage) {
      return {
        ok: true,
        ignored: true,
        reason: 'message_not_saved',
      };
    }

    if (savedMessage.duplicated) {
      this.logger.debug(
        [
          '♻️ Mensaje duplicado ignorado',
          `Negocio: ${savedMessage.businessName}`,
          `Instancia: ${incomingMessage.instanceName}`,
          `Teléfono: ${incomingMessage.phone}`,
          `Message ID: ${incomingMessage.messageId ?? 'unknown_message_id'}`,
        ].join(' | '),
      );

      return {
        ok: true,
        received: true,
        saved: false,
        duplicated: true,
      };
    }

    this.logger.log(
      [
        '✅ Mensaje guardado en Supabase',
        `Negocio: ${savedMessage.businessName}`,
        `Instancia: ${incomingMessage.instanceName}`,
        `Cliente: ${incomingMessage.customerName ?? 'unknown_name'}`,
        `Teléfono: ${incomingMessage.phone}`,
        `Message ID: ${incomingMessage.messageId ?? 'unknown_message_id'}`,
        `Texto: ${incomingMessage.text}`,
        `Score mensaje: ${savedMessage.messageScore}`,
        `Score lead: ${savedMessage.leadScore}`,
        `Clasificación: ${savedMessage.classification}`,
        `Razón: ${savedMessage.classificationReason}`,
      ].join(' | '),
    );

    return {
      ok: true,
      received: true,
      saved: true,
      score: savedMessage.leadScore,
      classification: savedMessage.classification,
      classificationReason: savedMessage.classificationReason,
      signals: savedMessage.signals,
    };
  }

  private parseIncomingWhatsappMessage(
    payload: any,
  ): IncomingWhatsappMessage | null {
    const event = this.normalizeEventName(payload?.event);

    if (event !== 'messages.upsert') {
      this.logger.debug(`Evento ignorado: ${payload?.event}`);
      return null;
    }

    const messageData = this.getMessageData(payload?.data);

    if (!messageData) {
      this.logger.warn('Webhook recibido sin data de mensaje');
      return null;
    }

    const fromMe = messageData?.key?.fromMe;
    const remoteJid = messageData?.key?.remoteJid;

    if (fromMe) {
      this.logger.debug(
        'Mensaje ignorado porque fue enviado por la propia instancia',
      );
      return null;
    }

    if (!remoteJid) {
      this.logger.warn('Mensaje ignorado porque no trae remoteJid');
      return null;
    }

    if (remoteJid.endsWith('@g.us')) {
      this.logger.debug(`Mensaje de grupo ignorado: ${remoteJid}`);
      return null;
    }

    const text = this.extractTextFromMessage(messageData?.message);

    if (!text) {
      this.logger.debug('Mensaje ignorado porque no trae texto');
      return null;
    }

    const instanceName =
      payload?.instance ?? process.env.EVOLUTION_INSTANCE_NAME ?? null;

    if (!instanceName) {
      this.logger.warn('Mensaje ignorado porque no trae instanceName');
      return null;
    }

    return {
      instanceName,
      phone: this.extractPhoneFromJid(remoteJid),
      customerName: messageData?.pushName ?? null,
      messageId: messageData?.key?.id ?? null,
      text,
      rawPayload: payload,
    };
  }

  private async saveIncomingMessage(
    message: IncomingWhatsappMessage,
  ): Promise<SavedIncomingMessage | null> {
    const supabase = this.supabaseService.client;
    const now = new Date().toISOString();

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, business_type, evolution_instance_name, active')
      .eq('evolution_instance_name', message.instanceName)
      .eq('active', true)
      .single();

    if (businessError || !business) {
      this.logger.warn(
        [
          'No se encontró negocio activo para la instancia',
          `Instancia: ${message.instanceName}`,
          `Error: ${businessError?.message ?? 'business_not_found'}`,
        ].join(' | '),
      );

      return null;
    }

    const leadUpsertPayload: any = {
      business_id: business.id,
      phone: message.phone,
      last_message: message.text,
      last_message_at: now,
      updated_at: now,
    };

    if (message.customerName) {
      leadUpsertPayload.name = message.customerName;
    }

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .upsert(leadUpsertPayload, {
        onConflict: 'business_id,phone',
      })
      .select('id, business_id, phone, name, score, classification')
      .single();

    if (leadError || !lead) {
      this.logger.error(
        [
          'Error al crear/actualizar lead',
          `Negocio: ${business.name}`,
          `Teléfono: ${message.phone}`,
          `Error: ${leadError?.message ?? 'lead_not_saved'}`,
        ].join(' | '),
      );

      return null;
    }

    const scoringResult = this.leadScoringService.scoreMessage({
      message: message.text,
      currentLeadScore: lead.score ?? 0,
      businessType: business.business_type,
    });

    const { error: messageError } = await supabase.from('messages').insert({
      business_id: business.id,
      lead_id: lead.id,
      phone: message.phone,
      direction: 'IN',
      role: 'customer',
      content: message.text,
      external_message_id: message.messageId,
      raw_payload: message.rawPayload,

      score: scoringResult.messageScore,
      classification: scoringResult.classification,
      detected_signals: JSON.parse(
        JSON.stringify(scoringResult.signals),
      ) as Json,
      classification_reason: scoringResult.classificationReason,
    });

    if (messageError) {
      if (messageError.code === '23505') {
        this.logger.debug(
          `Mensaje duplicado ignorado: ${message.messageId ?? 'no_message_id'}`,
        );

        return {
          businessName: business.name,
          leadId: lead.id,
          duplicated: true,
        };
      }

      this.logger.error(
        [
          'Error al guardar mensaje',
          `Negocio: ${business.name}`,
          `Lead ID: ${lead.id}`,
          `Message ID: ${message.messageId ?? 'unknown_message_id'}`,
          `Error: ${messageError.message}`,
        ].join(' | '),
      );

      return null;
    }

    const { error: leadUpdateError } = await supabase
      .from('leads')
      .update({
        score: scoringResult.leadScore,
        classification: scoringResult.classification,
        classification_reason: scoringResult.classificationReason,
        last_message: message.text,
        last_message_at: now,
        updated_at: now,
      })
      .eq('id', lead.id);

    if (leadUpdateError) {
      this.logger.error(
        [
          'Error al actualizar score/clasificación del lead',
          `Negocio: ${business.name}`,
          `Lead ID: ${lead.id}`,
          `Score: ${scoringResult.leadScore}`,
          `Clasificación: ${scoringResult.classification}`,
          `Razón: ${scoringResult.classificationReason}`,
          `Error: ${leadUpdateError.message}`,
        ].join(' | '),
      );

      return null;
    }

    this.logger.debug(
      [
        '📊 Análisis avanzado del lead',
        `Negocio: ${business.name}`,
        `Lead ID: ${lead.id}`,
        `Score mensaje: ${scoringResult.messageScore}`,
        `Score acumulado: ${scoringResult.leadScore}`,
        `Clasificación: ${scoringResult.classification}`,
        `Razón: ${scoringResult.classificationReason}`,
        `Señales: ${JSON.stringify(scoringResult.signals)}`,
      ].join(' | '),
    );

    return {
      businessName: business.name,
      leadId: lead.id,
      duplicated: false,
      messageScore: scoringResult.messageScore,
      leadScore: scoringResult.leadScore,
      classification: scoringResult.classification,
      classificationReason: scoringResult.classificationReason,
      signals: scoringResult.signals,
    };
  }

  private normalizeEventName(event?: string): string | undefined {
    return event?.toLowerCase().replaceAll('_', '.');
  }

  private getMessageData(data: any) {
    if (Array.isArray(data)) {
      return data[0];
    }

    return data;
  }

  private extractTextFromMessage(message: any): string {
    return (
      message?.conversation ||
      message?.extendedTextMessage?.text ||
      message?.imageMessage?.caption ||
      message?.videoMessage?.caption ||
      message?.documentMessage?.caption ||
      ''
    ).trim();
  }

  private extractPhoneFromJid(remoteJid: string): string {
    return remoteJid.split('@')[0];
  }
}
