Hito 2 - Primer Flujo Programable

Evolution-Webhook.service.ts

Código 1 - Recibe mensaje desde wpp hacia el log de nestjs

import { Injectable, Logger } from '@nestjs/common';

@Injectable()

export class EvolutionWebhookService {

  private readonly logger = new Logger(EvolutionWebhookService.name);

  async handleIncomingWebhook(payload: any) {

    const event = this.normalizeEventName(payload?.event);

    if (event !== 'messages.upsert') {

      this.logger.debug(`Evento ignorado: ${payload?.event}`);

      return {

        ok: true,

        ignored: true,

        reason: 'unsupported_event',

      };

    }

    const messageData = this.getMessageData(payload?.data);

    if (!messageData) {

      this.logger.warn('Webhook recibido sin data de mensaje');

      return {

        ok: true,

        ignored: true,

        reason: 'missing_message_data',

      };

    }

    const fromMe = messageData?.key?.fromMe;

    const remoteJid = messageData?.key?.remoteJid;

    if (fromMe) {

      this.logger.debug('Mensaje ignorado porque fue enviado por la propia instancia');

      return {

        ok: true,

        ignored: true,

        reason: 'from_me',

      };

    }

    if (!remoteJid) {

      this.logger.warn('Mensaje ignorado porque no trae remoteJid');

      return {

        ok: true,

        ignored: true,

        reason: 'missing_remote_jid',

      };

    }

    if (remoteJid.endsWith('@g.us')) {

      this.logger.debug(`Mensaje de grupo ignorado: ${remoteJid}`);

      return {

        ok: true,

        ignored: true,

        reason: 'group_message',

      };

    }

    const text = this.extractTextFromMessage(messageData?.message);

    if (!text) {

      this.logger.debug('Mensaje ignorado porque no trae texto');

      return {

        ok: true,

        ignored: true,

        reason: 'empty_text',

      };

    }

    const phone = this.extractPhoneFromJid(remoteJid);

    const instanceName = payload?.instance ?? 'unknown_instance';

    const pushName = messageData?.pushName ?? 'unknown_name';

    const messageId = messageData?.key?.id ?? 'unknown_message_id';

    this.logger.log(

      [

        '📩 Mensaje recibido desde WhatsApp',

        `Instancia: ${instanceName}`,

        `Cliente: ${pushName}`,

        `Teléfono: ${phone}`,

        `Message ID: ${messageId}`,

        `Texto: ${text}`,

      ].join(' | '),

    );

    return {

      ok: true,

      received: true,

    };

  }

  private normalizeEventName(event?: string) {

    return event?.toLowerCase();

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

    return remoteJid

      .replace('@s.whatsapp.net', '')

      .replace('@c.us', '')

      .replace('@lid', '');

  }

}

Código 2 - Recibe mensaje desde wpp hacia el log de nestjs y al final a Supabase
import { Injectable, Logger } from '@nestjs/common';

import { SupabaseService } from '../../supabase/supabase.service';

type IncomingWhatsappMessage = {

  instanceName: string;

  phone: string;

  customerName: string | null;

  messageId: string | null;

  text: string;

  rawPayload: any;

};

@Injectable()

export class EvolutionWebhookService {

  private readonly logger = new Logger(EvolutionWebhookService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

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

    this.logger.log(

      [

        '✅ Mensaje guardado en Supabase',

        `Negocio: ${savedMessage.businessName}`,

        `Instancia: ${incomingMessage.instanceName}`,

        `Cliente: ${incomingMessage.customerName ?? 'unknown_name'}`,

        `Teléfono: ${incomingMessage.phone}`,

        `Message ID: ${incomingMessage.messageId ?? 'unknown_message_id'}`,

        `Texto: ${incomingMessage.text}`,

      ].join(' | '),

    );

    return {

      ok: true,

      received: true,

      saved: true,

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

  private async saveIncomingMessage(message: IncomingWhatsappMessage) {

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

    const { data: lead, error: leadError } = await supabase

      .from('leads')

      .upsert(

        {

          business_id: business.id,

          phone: message.phone,

          name: message.customerName,

          last_message: message.text,

          last_message_at: now,

          updated_at: now,

        },

        {

          onConflict: 'business_id,phone',

        },

      )

      .select('id, business_id, phone, name')

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

    const { error: messageError } = await supabase.from('messages').insert({

      business_id: business.id,

      lead_id: lead.id,

      phone: message.phone,

      direction: 'IN',

      content: message.text,

      external_message_id: message.messageId,

      raw_payload: message.rawPayload,

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

    return {

      businessName: business.name,

      leadId: lead.id,

      duplicated: false,

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

Resultado código 2
Qué debería pasar ahora

Cuando llegue un mensaje de WhatsApp a Samuel:

payload.instance = agent_core_samuel

Nest hace esto:

1. Busca businesses.evolution_instance_name = agent_core_samuel

2. Encuentra Autos Samuel Ford

3. Busca o crea lead por business_id + phone

4. Actualiza last_message y last_message_at

5. Inserta mensaje en messages con direction = IN

6. Guarda raw_payload para debug

En Supabase deberías ver:

businesses:

Autos Samuel Ford

leads:

phone = número del cliente

name = nombre de WhatsApp

last_message = último mensaje recibido

messages:

direction = IN

content = texto recibido

external_message_id = ID del mensaje de WhatsApp

raw_payload = payload completo de Evolution

Y en consola algo así:

✅ Mensaje guardado en Supabase | Negocio: Autos Samuel Ford | Instancia: agent_core_samuel | Cliente: Perla | Teléfono: 521... | Texto: Buenas, me interesa el Ford Mustang

Flujo Hito 2

Tu flujo ya está así:

WhatsApp

  ↓

Evolution API

  ↓

Webhook /webhooks/evolution

  ↓

NestJS

  ↓

Busca negocio por instanceName

  ↓

Crea/actualiza lead

  ↓

Guarda mensaje en Supabase

Avance - Copiloto Samuel

Avance - Copiloto Samuel

Fecha: 22 junio 2026

Se logró guardar mensajes reales de WhatsApp en Supabase.

Flujo confirmado:

WhatsApp → Evolution API → Webhook NestJS → Supabase

Tablas involucradas:

- businesses

- leads

- messages

La instancia agent_core_samuel se usa para identificar el negocio:

Autos Samuel Ford

Problemas resueltos:

- Nest no leía .env → se instaló y configuró @nestjs/config

- Supabase daba permission denied → se dieron permisos/grants a service_role

Estado:

Hito 2 completado.
