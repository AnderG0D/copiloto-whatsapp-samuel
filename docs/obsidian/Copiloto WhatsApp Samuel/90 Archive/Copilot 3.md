Hito 3 - Score + classification básico

El objetivo ahorita sería este:

Hito 3 — Score + classification básico

Cuando llegue un mensaje nuevo:

1. Leer el texto del mensaje

2. Calcular puntos según palabras clave

3. Sumar esos puntos al score actual del lead

4. Clasificar el lead como COLD, WARM o HOT

5. Guardar score y classification en Supabase

Nada de Groq todavía.

Nada de IA todavía.

Nada de reglas dinámicas en base de datos todavía.

Nada de historial avanzado todavía.

Primero que funcione bien lo básico.

Alcance correcto del Hito 3 básico

Yo lo dejaría así:

✅ Crear LeadScoringService

✅ Detectar palabras clave comerciales

✅ Calcular score del mensaje

✅ Acumular score en leads.score

✅ Clasificar lead:

   COLD = 0 a 29

   WARM = 30 a 69

   HOT  = 70 a 100

✅ Actualizar lead en Supabase

✅ Guardar score/classification también en messages si ya tienes esas columnas

Ejemplo mental

Mensaje:

Hola

Resultado:

score bajo

classification: COLD

Mensaje:

Me interesa una Ford Ranger

Resultado:

score medio

classification: WARM

Mensaje:

Cuánto cuesta y la puedo ver hoy?

Resultado:

score alto

classification: HOT

Tu siguiente acción física

La siguiente acción no es pensar todo el sistema.

Es esta:

☐ Crear archivo LeadScoringService

Después:

☐ Meter reglas simples de score

☐ Inyectar el servicio en el webhook

☐ Después de guardar el mensaje, calcular score

☐ Actualizar leads.score y leads.classification

☐ Probar con 3 mensajes de WhatsApp

Sí, vato: nos enfocamos en lo básico.

Este hito es para que tu copiloto pase de:

solo guardar mensajes

a:

guardar mensajes + entender qué tan interesado viene el lead

La clave, vato: este hito no es hacer el agente inteligente todavía. Este hito es que tu sistema empiece a distinguir:

curioso random → COLD

interesado → WARM

cliente casi listo → HOT

Y con eso ya después Groq va a poder responder diferente dependiendo del tipo de lead.

Tu flujo quedaría así:

WhatsApp

→ Evolution API

→ NestJS

→ Supabase guarda lead + message

→ NestJS calcula score

→ NestJS actualiza lead.score y lead.classification

→ Supabase queda con lead clasificado

Pasos

1 - Regla principal

No uses IA todavía.

Para este hito, usa un sistema sencillo por palabras clave.

Ejemplo para autos:

|   |   |
|---|---|
|"precio"|+15|
|"cuánto cuesta"|+20|
|"financiamiento"|+25|
|"enganche"|+25|
|"mensualidad"|+25|
|"me interesa"|+20|
|"lo quiero ver"|+30|
|"cita"|+30|
|"disponible"|+15|
|"ford"|+10|
|"ranger/f150/mustang"|+20|

Luego conviertes el score en clasificación:

0 - 29   = COLD

30 - 69  = WARM

70 - 100 = HOT

2 - Crear servicio de scoring
Crea un archivo tipo:

src/leads/lead-scoring.service.ts

O si todavía no tienes módulo de leads, puedes meterlo temporalmente en:

src/evolution-webhook/lead-scoring.service.ts

2.1 - Código base lead-scoring.service.ts
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

3 - Conectarlo al módulo
En tu módulo donde recibes el webhook, agrega el service.

3.1 - evolution-webhook.module.ts
import { Module } from '@nestjs/common';

import { EvolutionWebhookController } from './evolution-webhook.controller';

import { EvolutionWebhookService } from './evolution-webhook.service';

import { LeadScoringService } from './lead-scoring.service';

@Module({

  controllers: [EvolutionWebhookController],

  providers: [EvolutionWebhookService, LeadScoringService],

})

export class EvolutionWebhookModule {}

4 - Usarlo después de guardar el mensaje
Tu flujo actual probablemente ya hace algo como:

business encontrado

lead encontrado o creado

message guardado

Después de eso metes:


4.1 - Código después de guardar el mensaje


const messageScore = this.leadScoringService.calculateMessageScore(content);

const newLeadScore = this.leadScoringService.calculateLeadScore(

  lead.score ?? 0,

  messageScore,

);

const classification = this.leadScoringService.classify(newLeadScore);

Luego actualizas el lead:

await this.supabase

  .from('leads')

  .update({

    score: newLeadScore,

    classification,

    last_message: content,

    last_message_at: new Date().toISOString(),

    updated_at: new Date().toISOString(),

  })

  .eq('id', lead.id);

Y opcionalmente actualizas el mensaje también:

await this.supabase

  .from('messages')

  .update({

    score: messageScore,

    classification,

  })

  .eq('id', message.id);


5 - Ejemplo completo dentro del flujo

Más o menos esta parte debería quedar así:

// 1. Calcular score del mensaje

const messageScore = this.leadScoringService.calculateMessageScore(content);

// 2. Calcular nuevo score acumulado del lead

const newLeadScore = this.leadScoringService.calculateLeadScore(

  lead.score ?? 0,

  messageScore,

);

// 3. Clasificar lead

const classification = this.leadScoringService.classify(newLeadScore);

// 4. Guardar mensaje entrante

const { data: message, error: messageError } = await this.supabase

  .from('messages')

  .insert({

    business_id: business.id,

    lead_id: lead.id,

    phone,

    direction: 'IN',

    role: 'customer',

    content,

    raw_payload: payload,

    score: messageScore,

    classification,

  })

  .select()

  .single();

if (messageError) {

  throw messageError;

}

// 5. Actualizar lead

const { error: leadUpdateError } = await this.supabase

  .from('leads')

  .update({

    score: newLeadScore,

    classification,

    last_message: content,

    last_message_at: new Date().toISOString(),

    updated_at: new Date().toISOString(),

  })

  .eq('id', lead.id);

if (leadUpdateError) {

  throw leadUpdateError;

}

6 - Pruebas manuales
Mándate mensajes desde WhatsApp y revisa Supabase.

Ejemplos:

Mensaje 1:

Hola

Resultado esperado:

score bajo

classification: COLD

Mensaje 2:

Me interesa una Ford Ranger

Resultado esperado:

score medio

classification: WARM

Mensaje 3:

Cuánto cuesta la Ford Ranger y puedo verla hoy?

Resultado esperado:

score alto

classification: HOT

7 - Done cuando
Este hito queda terminado cuando puedas mandar un mensaje por WhatsApp y en Supabase veas algo así:

Tabla leads:

phone: 614...

last_message: Cuánto cuesta la Ford Ranger y puedo verla hoy?

score: 80

classification: HOT

Tabla messages:

content: Cuánto cuesta la Ford Ranger y puedo verla hoy?

score: 80

classification: HOT

Código evolution-webhook.service.ts v1
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