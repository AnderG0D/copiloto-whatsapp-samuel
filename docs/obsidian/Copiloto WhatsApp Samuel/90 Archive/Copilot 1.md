Idea general de copiloto comercial de WhatsApp

La idea completa sería así:

1. Cliente escribe por WhatsApp  
↓  
2. Evolution API recibe mensaje  
↓  
3. NestJS decide qué hacer  
↓  
4. IA responde / clasifica / extrae datos  
↓  
5. Si el cliente está caliente → avisa a Samuel  
↓  
6. Samuel puede intervenir o controlar inventario desde WhatsApp

Módulos que necesitas

1. Agente automático para clientes

Contesta preguntas tipo:

¿precio?  
¿qué carros tienes?  
¿aceptas crédito?  
¿cuánto de enganche?  
¿dónde están ubicados?  
¿me puedes mandar fotos?

La IA responde según:

inventario  
reglas de Samuel  
historial del cliente  
nivel de interés

2. Inventario editable por WhatsApp

Samuel tendría un chat con la IA tipo admin.

Ejemplos:

/agregar Nissan Versa 2020 rojo automático 180000 enganche 30000

/vendidos Versa 2020

/stock

/cambiar_precio Versa 2020 175000

Entonces la IA modifica la base de datos.

3. Clasificación de clientes

Cada lead se clasifica:

FRÍO  
TIBIO  
CALIENTE

Ejemplo:

FRÍO = solo pregunta precio  
TIBIO = pregunta enganche, mensualidades o ubicación  
CALIENTE = quiere cita, manda documentos, quiere verlo hoy

4. Intervención humana

Cuando la IA detecta duda o cliente caliente:

🚨 Lead caliente  
Cliente: Juan Pérez  
Interés: Versa 2020  
Presupuesto: 180k  
Quiere verlo: hoy  
Resumen: Preguntó enganche y pidió ubicación.

Y se lo manda a Samuel.

5. Modo copiloto para Samuel

Samuel puede preguntarle a la IA:

/resumen_hoy

¿quién está más interesado?

¿qué clientes preguntaron por Versa?

manda mensaje a los calientes

Arquitectura correcta

Evolution API  
↓  
NestJS  
├─ WebhookModule  
├─ WhatsAppModule  
├─ AiModule  
├─ InventoryModule  
├─ LeadsModule  
├─ CommandsModule  
├─ HumanHandoffModule  
└─ ReportsModule  
↓  
PostgreSQL

Base de datos mínima

users_admin  
vehicles  
leads  
messages  
lead_scores  
handoffs  
ai_actions

Lo que yo haría como MVP

Primera versión vendible:

✅ Recibir mensajes de WhatsApp✅ Responder automáticamente✅ Guardar chats✅ Extraer nombre, carro, presupuesto, enganche✅ Clasificar frío/tibio/caliente✅ Avisar a Samuel si está caliente✅ Samuel puede consultar /stock✅ Samuel puede agregar autos con comando

Eso ya se puede cobrar, vato.

Luego versión 2:

✅ Dashboard web✅ Inventario visual✅ Resúmenes diarios✅ Seguimiento automático✅ Embeddings/búsqueda inteligente✅ Multiusuarios

Stack calidad/precio

Para empezar barato:

- VPS barato
- Docker
- Evolution API
- NestJS
- PostgreSQL
- Redis
- Groq/Gemini/OpenRouter

Tu primer milestone técnico debería ser:

WhatsApp → Evolution Webhook → NestJS → guardar mensaje → responder texto fijo  

Después metemos IA y comandos.

Flujo modulos 1 y 3 copiloto comercial WhatsApp:

1. WhatsApp recibe mensaje

2. NestJS recibe webhook de Evolution API

3. Guardar mensaje entrante en Supabase

4. Buscar historial del cliente en Supabase

5. Extraer datos del mensaje actual

6. Actualizar lead en Supabase

7. Calcular score actual

8. Clasificar lead: FRÍO / TIBIO / CALIENTE

9. Guardar score y clasificación en Supabase

10. Mandar a Groq:

    - mensaje actual

    - historial resumido

    - datos del lead

    - score actual

    - clasificación actual

11. Groq genera respuesta

12. Guardar respuesta en Supabase

13. Enviar respuesta por WhatsApp

14. Si es CALIENTE, notificar a Samuel

Scorear lead completo con base en:

- Mensaje actual
- Historial
- Datos extraídos

messages = historial de conversación

leads = estado comercial actual del cliente

Flujo final modulos 1 y 3 copiloto comercial WhatsApp:

1. WhatsApp

 ↓

2. Evolution API

 ↓

3. NestJS Webhook

 ↓

4. Supabase: guardar inbound message

 ↓

5. Supabase: obtener lead + historial

 ↓

6. NestJS: extraer datos + calcular score + clasificar

 ↓

7. Supabase: actualizar lead

 ↓

8. Groq: generar respuesta con contexto

 ↓

9. Supabase: guardar outbound message

 ↓

10. Evolution API: enviar respuesta

 ↓

11. Cliente recibe WhatsApp

 ↓

12. Si CALIENTE: aviso a Samuel

Idea poderosa:

1. Supabase = memoria.

2. NestJS = cerebro lógico.

3. Groq = cerebro conversacional.

4. Evolution API = boca + oído por WhatsApp.

Hito 1 - Diseño de Base de Datos

SQL BASE DE DATOS

SQL V1
Este SQL crea la base para un CRM con IA para leads: negocios, clientes, mensajes, historial de score y productos/inventario.

1. Extensión pgcrypto

create extension if not exists pgcrypto;

Activa funciones criptográficas en PostgreSQL. Aquí se usa principalmente para:

gen_random_uuid()

Eso genera IDs únicos tipo UUID automáticamente.

1. Tabla negocios

create table negocios (

  id uuid primary key default gen_random_uuid(),

  nombre text not null,

  tipo_negocio text not null check (tipo_negocio in ('autos', 'inmuebles', 'otro')),

  facebook_page_id text unique,

  facebook_page_name text,

  activo boolean default true,

  created_at timestamptz default now(),

  updated_at timestamptz default now()

);

Guarda cada negocio que usará el agente.

Ejemplo:

|   |   |   |
|---|---|---|
|nombre|tipo_negocio|facebook_page_id|
|Autos Samuel|autos|123456789|

Campos importantes:

id uuid primary key default gen_random_uuid()

ID único del negocio.

tipo_negocio text not null check (…)

Solo permite:

'autos', 'inmuebles', 'otro'

O sea, no puedes meter 'restaurantes' si no está permitido.

facebook_page_id text unique

Cada página de Facebook solo puede pertenecer a un negocio.

activo boolean default true

Sirve para apagar o activar un negocio sin borrarlo.

3. Tabla clientes

create table clientes (

  id uuid primary key default gen_random_uuid(),

  negocio_id uuid not null references negocios(id) on delete cascade,

  psid text not null,

  nombre text,

  telefono text,

  email text,

  interes text,

  presupuesto text,

  intencion text,

  urgencia text,

  score int default 0,

  calificacion text default 'no_interesado'

    check (calificacion in ('no_interesado', 'interesado', 'medio', 'muy_interesado')),

  estado text default 'activo'

    check (estado in ('activo', 'seguimiento', 'cerrado', 'descartado')),

  ultimo_mensaje text,

  ultimo_mensaje_at timestamptz,

  created_at timestamptz default now(),

  updated_at timestamptz default now(),

  unique (negocio_id, psid)

);

Guarda los leads/clientes que escriben al negocio.

Cada cliente pertenece a un negocio:

negocio_id uuid not null references negocios(id) on delete cascade

Eso significa: si borras el negocio, también se borran sus clientes.

psid text not null

El PSID es el ID del usuario en Facebook Messenger para esa página.

Datos del lead:

nombre

telefono

email

interes

presupuesto

intencion

urgencia

Aquí se guarda lo que el bot va entendiendo de la conversación.

Ejemplo:

|   |   |   |   |
|---|---|---|---|
|interes|presupuesto|intencion|urgencia|
|Mazda 3|250,000|comprar|esta semana|

Score:

score int default 0

Puntaje del lead.

Ejemplo:

- 0-20: frío
- 30-60: medio
- 70+: muy interesado

Calificación:

calificacion text default 'no_interesado'

    check (calificacion in (…))

Solo permite:

'no_interesado', 'interesado', 'medio', 'muy_interesado'

Estado:

estado text default 'activo'

    check (estado in (…))

Solo permite:

'activo', 'seguimiento', 'cerrado', 'descartado'

Esto sirve para saber en qué fase está el lead.

unique (negocio_id, psid)

Clave importante, we: evita duplicar al mismo cliente dentro del mismo negocio.

4. Tabla mensajes

create table mensajes (

  id uuid primary key default gen_random_uuid(),

  negocio_id uuid not null references negocios(id) on delete cascade,

  cliente_id uuid references clientes(id) on delete cascade,

  psid text not null,

  page_id text,

  message_id text unique,

  rol text not null check (rol in ('cliente', 'bot', 'humano', 'sistema')),

  mensaje text not null,

  score int,

  calificacion text,

  raw jsonb,

  created_at timestamptz default now()

);

Guarda todo el historial de conversación.

Cada mensaje tiene:

negocio_id

cliente_id

psid

page_id

message_id

message_id text unique

Evita guardar dos veces el mismo mensaje de Facebook.

Rol:

rol text not null check (rol in ('cliente', 'bot', 'humano', 'sistema'))

Define quién mandó el mensaje:

|   |   |
|---|---|
|rol|significado|
|cliente|mensaje del lead|
|bot|respuesta de IA|
|humano|respuesta manual|
|sistema|evento interno|

Contenido:

mensaje text not null

El texto del mensaje.

También guarda:

score

calificacion

raw jsonb

raw jsonb sirve para guardar el payload original de Facebook/Evolution API/etc.

5. Tabla lead_eventos

create table lead_eventos (

  id uuid primary key default gen_random_uuid(),

  negocio_id uuid not null references negocios(id) on delete cascade,

  cliente_id uuid references clientes(id) on delete cascade,

  psid text not null,

  tipo text not null,

  descripcion text,

  score_delta int default 0,

  created_at timestamptz default now()

);

Guarda eventos importantes del lead.

Ejemplo:

|   |   |   |
|---|---|---|
|tipo|descripcion|score_delta|
|pregunto_precio|Preguntó precio del Mazda 3|+10|
|dejo_telefono|Compartió teléfono|+30|
|quiere_cita|Quiere agendar visita|+50|

score_delta int default 0

Cuánto subió o bajó el score por ese evento.

Esta tabla es útil para explicar por qué un lead tiene cierto score.

6. Tabla inventario

create table inventario (

  id uuid primary key default gen_random_uuid(),

  negocio_id uuid not null references negocios(id) on delete cascade,

  tipo text not null,

  titulo text not null,

  precio numeric,

  moneda text default 'MXN',

  descripcion text,

  ubicacion text,

  disponible boolean default true,

  metadata jsonb,

  created_at timestamptz default now(),

  updated_at timestamptz default now()

);

Guarda productos del negocio.

Para autos:

|   |   |   |
|---|---|---|
|tipo|titulo|precio|
|auto|Mazda 3 2020|250000|

Para inmuebles:

|   |   |   |
|---|---|---|
|tipo|titulo|precio|
|casa|Casa en Chihuahua Norte|1800000|

Campos importantes:

precio numeric

moneda text default 'MXN'

disponible boolean default true

metadata jsonb

metadata jsonb sirve para datos extra flexibles.

Ejemplo en autos:

{

  "modelo": "Mazda 3",

  "año": 2020,

  "kilometraje": 65000,

  "transmision": "automatica"

}

7. Índices

Los índices hacen las búsquedas más rápidas.

create index idx_negocios_page_id on negocios(facebook_page_id);

Busca rápido el negocio por página de Facebook.

create index idx_clientes_negocio_psid on clientes(negocio_id, psid);

Busca rápido al cliente por negocio + PSID.

create index idx_mensajes_cliente on mensajes(cliente_id, created_at desc);

Trae rápido el historial de mensajes de un cliente, del más nuevo al más viejo.

create index idx_mensajes_psid on mensajes(psid);

Busca mensajes por PSID.

create index idx_inventario_negocio on inventario(negocio_id);

Busca inventario de un negocio rápido.

En resumen, el flujo sería así, we:

1. Llega mensaje de Facebook/WhatsApp.
2. Se identifica el negocio por page_id.
3. Se busca o crea el cliente por psid.
4. Se guarda el mensaje en mensajes.
5. La IA analiza intención, presupuesto, urgencia, interés.
6. Se actualiza clientes.score y clientes.calificacion.
7. Se guarda un evento en lead_eventos.
8. La IA puede consultar inventario.
9. Se genera respuesta.
10. Se guarda la respuesta del bot en mensajes.

SQL V2

Estas dos tablas son como la versión mínima de tu CRM/agente IA para WhatsApp:

1. leads guarda quién es el cliente/prospecto.
2. messages guarda todo lo que se ha hablado con ese cliente.

O sea:

leads = personas / clientes / prospectos

messages = historial de conversación de cada persona

1. Tabla leads

create table leads (

  id uuid primary key default gen_random_uuid(),

  phone text unique not null,

  name text,

  score int default 0,

  classification text default 'FRIO',

  created_at timestamp default now(),

  updated_at timestamp default now()

);

Esta tabla representa a cada lead, o sea, cada persona que te escribe por WhatsApp.

Un lead podría ser:

Teléfono: +52XXXXXXXXXX

Nombre: Juan

Score: 45

Clasificación: TIBIO

id uuid primary key default gen_random_uuid()

Este es el identificador interno del lead.

Ejemplo:

id = 8f3b2c1e-1234-4abc-9999-abc123xyz

Es mejor usar uuid que un número simple porque:

1, 2, 3, 4…

puede ser más fácil de adivinar o chocar entre sistemas. Con uuid, cada registro tiene un ID único muy difícil de repetir.

El primary key significa que este campo identifica de forma única cada fila.

El default gen_random_uuid() significa que Supabase/PostgreSQL genera el ID automáticamente cuando insertas un lead.

Ejemplo: tú insertas esto:

insert into leads (phone, name)

values ('+52XXXXXXXXXX', 'Juan');

Y la BD automáticamente genera el id.

phone text unique not null

Este es el teléfono del lead.

Ejemplo:

+52XXXXXXXXXX

text significa que se guarda como texto, no como número. Esto está bien porque los teléfonos pueden tener:

- +
- espacios
- códigos de país
- ceros al inicio

unique significa que no puede haber dos leads con el mismo teléfono.

O sea, esto evita duplicados:

Juan - +52XXXXXXXXXX

Juan repetido - +52XXXXXXXXXX

not null significa que el teléfono es obligatorio. No puedes crear un lead sin teléfono.

En tu sistema, esto tiene sentido porque WhatsApp identifica a la persona principalmente por su número.

name text

Este guarda el nombre del lead.

Ejemplo:

Juan Pérez

No tiene not null, entonces puede estar vacío.

Eso está bien porque al principio puede que solo tengas el teléfono, y después el agente puede detectar o preguntar el nombre.

Ejemplo:

Lead recién llegado:

phone = +52XXXXXXXXXX

name = null

Después:

name = Juan

score int default 0

Este guarda el puntaje del lead.

Ejemplo:

score = 0

score = 25

score = 70

score = 100

La idea es que el score mida qué tan interesado está el cliente.

Ejemplo práctico:

Cliente dice: "solo estoy viendo"

score +5

Cliente dice: "¿cuánto cuesta?"

score +15

Cliente dice: "quiero verlo hoy"

score +30

Cliente dice: "tengo el dinero listo"

score +40

Entonces el score te ayuda a saber si el cliente está frío, tibio o caliente.

default 0 significa que cuando se crea un lead nuevo, empieza con score 0.

classification text default 'FRIO'

Este campo guarda la clasificación del lead.

Ejemplos:

FRIO

TIBIO

CALIENTE

NO_INTERESADO

COMPRADOR_SERIO

En tu caso empieza como:

FRIO

porque apenas llegó y todavía no sabes si realmente quiere comprar.

La clasificación normalmente sale del score o de la intención.

Ejemplo:

score 0 - 20 = FRIO

score 21 - 60 = TIBIO

score 61 - 100 = CALIENTE

Entonces podrías tener algo así:

phone: +52XXXXXXXXXX

score: 75

classification: CALIENTE

Eso significa:

Este cliente parece muy interesado, hay que darle seguimiento fuerte.

Aquí te recomendaría después agregar un check, para limitar los valores permitidos:

classification text default 'FRIO'

check (classification in ('FRIO', 'TIBIO', 'CALIENTE', 'NO_INTERESADO'))

Porque ahorita como está, podrías meter por error:

friio

frio

Frío

cliente bueno

asdf

Y eso después ensucia la base de datos.

created_at timestamp default now()

Guarda cuándo se creó el lead.

Ejemplo:

2026-06-10 13:20:00

Sirve para saber cuándo llegó ese cliente por primera vez.

Ejemplo de uso:

¿Cuántos leads llegaron hoy?

¿Cuántos llegaron esta semana?

¿Cuánto tiempo lleva este cliente sin cerrar?

updated_at timestamp default now()

Guarda cuándo se actualizó por última vez el lead.

Ejemplo:

2026-06-10 14:05:00

Sirve para saber cuándo cambió algo del lead:

- score
- classification
- name
- última actividad

Peeero ojo vato: con solo poner default now(), updated_at se llena al crear el registro, pero no se actualiza automáticamente cada vez que modificas el lead.

Para que se actualice solo, necesitas un trigger después.

Por ejemplo, si el cliente pasa de FRIO a CALIENTE, tú quieres que updated_at cambie automáticamente.

2. Tabla messages

create table messages (

  id uuid primary key default gen_random_uuid(),

  lead_id uuid references leads(id),

  phone text not null,

  direction text not null,

  content text not null,

  raw_payload jsonb,

  created_at timestamp default now()

);

Esta tabla guarda cada mensaje enviado o recibido.

Ejemplo:

Cliente: "Hola, me interesa el carro"

Agente: "Hola Juan, claro, ¿qué presupuesto tienes?"

Cliente: "Como 200 mil"

Agente: "Perfecto, tengo opciones para ese rango"

Cada uno de esos mensajes sería una fila en messages

id uuid primary key default gen_random_uuid()

Igual que en leads, es el identificador único del mensaje.

Cada mensaje tiene su propio ID.

Ejemplo:

mensaje 1 = uuid...

mensaje 2 = uuid...

mensaje 3 = uuid...

lead_id uuid references leads(id)

Este campo conecta el mensaje con el lead.

Es la relación más importante.

Significa:

Este mensaje pertenece a este lead.

Ejemplo:

Tabla leads:

id: abc-123

phone: +52XXXXXXXXXX

name: Juan

Tabla messages:

lead_id: abc-123

content: Hola, me interesa el carro

Entonces sabes que ese mensaje pertenece a Juan.

references leads(id) significa que lead_id apunta al id de la tabla leads.

Eso crea una relación:

leads 1 ---- muchos messages

O sea:

Un lead puede tener muchos mensajes.

Un mensaje pertenece a un lead.

Visualmente:

leads

------------------------------------------------

id: 111 | phone: +52XXXXXXXXXX | name: Juan

messages

------------------------------------------------

lead_id: 111 | content: Hola

lead_id: 111 | content: Me interesa un carro

lead_id: 111 | content: Tengo 200 mil

phone text not null

Aquí también guardas el teléfono.

Al principio puede parecer repetido porque ya tienes phone en leads.

Pero puede servir por varias razones:

1. Para encontrar mensajes rápido por teléfono.
2. Para guardar el número original que llegó de WhatsApp.
3. Para tener respaldo aunque algo pase con la relación.
4. Para debuggear payloads de Evolution API.

Ejemplo:

phone = +52XXXXXXXXXX

Aunque yo te diría que en una versión más limpia, podrías usar principalmente lead_id y dejar phone como campo auxiliar.

direction text not null

Este campo indica si el mensaje entró o salió.

Ejemplos:

IN

OUT

O:

incoming

outgoing

O:

Cliente

agente

Ejemplo práctico:

direction = IN

content = Hola, me interesa el carro

Significa que el mensaje lo mandó el cliente.

direction = OUT

content = Claro, ¿qué presupuesto tienes?

Significa que el mensaje lo mandó el agente.

Este campo es bien importante para reconstruir la conversación.

Ejemplo:

[IN] Hola

[OUT] Hola, ¿en qué te puedo ayudar?

[IN] Busco una troca

[OUT] ¿Qué presupuesto tienes?

También aquí te conviene poner un check para evitar valores raros:

direction text not null

check (direction in ('IN', 'OUT'))

content text not null

Este es el contenido del mensaje.

Ejemplo:

Hola, me interesa el Versa 2020

Es text porque puede ser corto o largo.

not null significa que siempre debe haber contenido.

Aunque ojo: en WhatsApp también pueden llegar mensajes que no son texto:

- imagen
- audio
- sticker
- ubicación
- documento

Para esos casos después quizá te convenga agregar:

message_type text default 'text'

media_url text

Porque si llega una imagen sin texto, content not null puede quedarse corto.

Por ahora, para empezar con texto, está bien.

raw_payload jsonb

Este campo guarda el payload crudo que manda Evolution API.

Esto es súper útil.

Un payload es básicamente el paquete completo de datos que te manda otro sistema.

Por ejemplo, WhatsApp/Evolution no solo te manda:

Hola

Te manda algo más grande, como:

{

  "event": "messages.upsert",

  "instance": "agent_core",

  "data": {

    "key": {

      "remoteJid": "XXXXXXXXXX@s.whatsapp.net",

      "fromMe": false

    },

    "message": {

      "conversation": "Hola"

    },

    "pushName": "Juan"

  }

}

Entonces tú guardas en content solo el texto limpio:

Pero en raw_payload guardas todo el paquete original.

¿Para qué sirve?

Para debuggear.

Ejemplo:

- ¿Por qué no respondió el bot?
- ¿Qué datos mandó Evolution?
- ¿Venía el nombre del cliente?
- ¿El mensaje era de grupo?
- ¿Era audio, imagen o texto?
- ¿Venía fromMe true o false?

jsonb es un tipo de PostgreSQL para guardar JSON de forma eficiente.

Es mejor que text porque PostgreSQL puede consultar partes del JSON si luego lo necesitas.

created_at timestamp default now()

Guarda cuándo se creó el mensaje.

Ejemplo:

2026-06-10 13:25:00

Sirve para ordenar el historial.

Ejemplo:

select *

from messages

where lead_id = 'abc-123'

order by created_at asc;

Eso te daría la conversación en orden.

Cómo se conectan las dos tablas

La relación es esta:

leads.id  --->  messages.lead_id

Ejemplo:

leads

id: 111

phone: +52XXXXXXXXXX

name: Juan

score: 35

classification: TIBIO

messages

id: aaa

lead_id: 111

direction: IN

content: Hola, me interesa el carro

id: bbb

lead_id: 111

direction: OUT

content: Claro, ¿qué modelo te interesa?

id: ccc

lead_id: 111

direction: IN

content: El Versa 2020

Entonces cuando llegue un mensaje nuevo, tu backend haría algo así:

1. Llega mensaje de WhatsApp.

2. Sacas el phone.

3. Buscas si ya existe un lead con ese phone.

4. Si no existe, lo creas.

5. Guardas el mensaje en messages con ese lead_id.

6. Analizas el mensaje.

7. Actualizas score y classification en leads.

8. Mandas historial + datos del lead a Groq.

9. Guardas la respuesta del bot en messages.

10. Envías respuesta por WhatsApp.

Ese es el ciclo que tú traías:

lee → guarda → scorea → clasifica → responde

Sí, estas tablas van directo con ese flujo.

Ejemplo completo de cómo se vería

Supón que entra este WhatsApp:

Hola, vi el Jetta 2021. ¿Todavía lo tienes? Tengo 250 mil de presupuesto.

Primero se crea o actualiza el lead:

leads

------------------------------------------------

id: 111

phone: +52XXXXXXXXXX

name: Juan

score: 50

classification: TIBIO

created_at: 2026-06-10 13:00

updated_at: 2026-06-10 13:00

Luego se guarda el mensaje:

messages

------------------------------------------------

id: aaa

lead_id: 111

phone: +52XXXXXXXXXX

direction: IN

content: Hola, vi el Jetta 2021. ¿Todavía lo tienes? Tengo 250 mil de presupuesto.

raw_payload: {...todo lo que mandó Evolution...}

created_at: 2026-06-10 13:00

Luego Groq responde:

Claro, sí lo tenemos disponible. ¿Te gustaría verlo hoy o prefieres que te mande más fotos?

Y guardas esa respuesta también:

messages

------------------------------------------------

id: bbb

lead_id: 111

phone: +52XXXXXXXXXX

direction: OUT

content: Claro, sí lo tenemos disponible. ¿Te gustaría verlo hoy o prefieres que te mande más fotos?

raw_payload: null

created_at: 2026-06-10 13:01

Lo bueno de este diseño

Está simple y sirve para arrancar.

Tienes lo necesario para:

- guardar clientes
- guardar historial
- medir interés
- clasificar leads
- dar contexto a la IA
- debuggear mensajes de WhatsApp
- Para una primera versión está muy bien.

Lo que yo ajustaría desde ahorita

Yo le haría estos cambios mínimos:

create table leads (

  id uuid primary key default gen_random_uuid(),

  phone text unique not null,

  name text,

  score int default 0,

  classification text default 'FRIO'

    check (classification in ('FRIO', 'TIBIO', 'CALIENTE', 'NO_INTERESADO')),

  created_at timestamptz default now(),

  updated_at timestamptz default now()

);

create table messages (

  id uuid primary key default gen_random_uuid(),

  lead_id uuid not null references leads(id) on delete cascade,

  phone text not null,

  direction text not null

    check (direction in ('IN', 'OUT')),

  content text not null,

  raw_payload jsonb,

  created_at timestamptz default now()

);

Cambios importantes:

lead_id not null

Para que no existan mensajes huérfanos sin lead.

on delete cascade

Si borras un lead, se borran sus mensajes.

check en classification

Para no meter clasificaciones mal escritas.

check en direction

Para que solo aceptes IN o OUT.

timestamptz

Mejor que timestamp porque guarda fecha con zona horaria.

Para sistemas con WhatsApp, servidores y logs, es mejor.

En corto, vato

Tu diseño dice:

leads = estado actual del cliente

messages = memoria/historial del cliente

leads te dice:

quién es

qué teléfono tiene

cómo se llama

qué tan interesado está

cómo está clasificado

cuándo llegó

cuándo se actualizó

messages te dice:

qué dijo

qué respondió el bot

cuándo pasó

si fue entrada o salida

qué payload crudo llegó de WhatsApp

a qué lead pertenece

Para tu agente IA, estas dos tablas son el núcleo mínimo: identidad del cliente + memoria de conversación.

SQL V3

create extension if not exists pgcrypto;

create table businesses (

  id uuid primary key default gen_random_uuid(),

  name text not null,

  business_type text not null

    check (business_type in ('cars', 'real_estate', 'other')),

  evolution_instance_name text unique,

  active boolean default true,

  created_at timestamptz default now(),

  updated_at timestamptz default now()

);

create table leads (

  id uuid primary key default gen_random_uuid(),

  business_id uuid not null references businesses(id) on delete cascade,

  phone text not null,

  name text,

  score int default 0,

  classification text default 'COLD'

    check (classification in ('COLD', 'WARM', 'HOT', 'NOT_INTERESTED')),

  status text default 'ACTIVE'

    check (status in ('ACTIVE', 'FOLLOW_UP', 'CLOSED', 'DISCARDED')),

  last_message text,

  last_message_at timestamptz,

  created_at timestamptz default now(),

  updated_at timestamptz default now(),

  unique (business_id, phone)

);

create table messages (

  id uuid primary key default gen_random_uuid(),

  business_id uuid not null references businesses(id) on delete cascade,

  lead_id uuid not null references leads(id) on delete cascade,

  phone text not null,

  direction text not null

    check (direction in ('IN', 'OUT')),

  content text not null,

  external_message_id text unique,

  raw_payload jsonb,

  created_at timestamptz default now()

);

insert into businesses (

  name,

  business_type,

  evolution_instance_name

)

values (

  'Autos Samuel Ford',

  'cars',

  'agent_core_samuel'

);

create table inventory (

  id uuid primary key default gen_random_uuid(),

  business_id uuid not null references businesses(id) on delete cascade,

  item_type text not null,

  title text not null,

  price numeric,

  currency text default 'MXN',

  description text,

  location text,

  available boolean default true,

  metadata jsonb,

  created_at timestamptz default now(),

  updated_at timestamptz default now()

);

Para tu primera versión SaaS, este diseño ya queda más limpio porque todo gira alrededor de:

businesses → leads → messages

businesses → inventory

O sea:

un negocio tiene muchos leads

un lead tiene muchos mensajes

un negocio tiene inventario

Así ya puedes correrlo para autos, bienes raíces u otro negocio sin meter todavía Facebook ni cosas extra.

La diferencia es esta:

direction = hacia dónde va el mensaje

role = quién generó el mensaje

direction

Este campo responde:

¿El mensaje entró o salió?

Ejemplo:

IN  = mensaje que mandó el cliente al sistema

OUT = mensaje que salió del sistema hacia el cliente

Ejemplo:

IN  | "Hola, me interesa el Jetta"

OUT | "Claro, ¿qué presupuesto tienes?"

Para tu flujo inicial de WhatsApp, con eso basta.

role

Este campo responde:

¿Quién escribió/generó el mensaje?

Ejemplo:

customer = cliente

bot      = IA

human    = asesor humano

system   = sistema interno

Pero sí, se parece a direction.

La diferencia aparece cuando tienes más casos:

OUT + bot    = respuesta automática de la IA

OUT + human  = respuesta escrita por un vendedor humano

IN + customer = mensaje del cliente

IN + system  = raro, casi no aplica

O sea, direction dice si entra o sale, y role dice quién lo hizo.

Tabla leads

interest text,

Sirve después para guardar qué busca el cliente.

Ejemplo autos:

interest = Jetta 2021

Ejemplo inmuebles:

interest = casa de 3 recámaras

budget text,

Sirve cuando el cliente diga:

Tengo 250 mil

Busco algo de 2 millones

Mi presupuesto es 15 mil mensuales

Lo puse como text porque en conversación real el presupuesto puede venir ambiguo:

250k

como 300

entre 1.5 y 2 millones

unos 15 al mes

intent text,

Sirve para saber qué quiere hacer el cliente:

comprar

rentar

cotizar

agendar cita

pedir informes

En autos:

intent = compra

En inmuebles:

intent = renta

urgency text,

Sirve para detectar tiempo de compra:

hoy

esta semana

este mes

solo estoy viendo

Tabla messages

score int,

Este campo guarda el score detectado en ese mensaje específico.

Ejemplo:

Mensaje: "¿Aceptas crédito? Tengo 250 mil de enganche"

score: 30

Entonces en messages.score sería como una “foto” del score generado por ese mensaje.

puedes agregarlo si quieres auditar qué mensaje subió el score.

classification text,

Similar a score.

Esta sería la clasificación detectada en ese mensaje o después de ese mensaje.

Ejemplo:

Mensaje: "quiero verlo hoy"

classification: HOT

Después te puede servir para auditoría, pero no para la primera conexión WhatsApp → Supabase.

Qué representa businesses

Representa esto:

businesses = negocios que usan tu copiloto

Ejemplo:

id: 111

name: Autos Samuel Ford

business_type: cars

active: true

Ese negocio luego tendrá:

leads del negocio de Samuel

messages del negocio de Samuel

inventory del negocio de Samuel

El problema que tienes que resolver

Cuando llega un mensaje desde WhatsApp, NestJS necesita saber:

¿A qué business_id pertenece este mensaje?

Porque si no sabes eso, no puedes guardar bien:

business_id uuid not null references businesses(id)

en leads ni en messages.

Solución simple para tu primer flujo

Para tu primer flujo, puedes hacerlo de 2 formas:

Opción 1: hardcodear un negocio demo

Esta es la más fácil para empezar.

Creas primero un negocio en Supabase:

insert into businesses (name, business_type)

values ('Autos Samuel Ford', 'cars')

returning id;

Eso te devuelve algo así:

id = 9c5c2f2e-aaaa-bbbb-cccc-123456789000

Luego en tu .env de NestJS pones:

DEFAULT_BUSINESS_ID=9c5c2f2e-aaaa-bbbb-cccc-123456789000

Y cuando llegue cualquier mensaje de WhatsApp, tu backend lo guarda con ese business_id.

Flujo:

Mensaje llega de WhatsApp

↓

Evolution API lo manda a NestJS

↓

NestJS usa DEFAULT_BUSINESS_ID

↓

Busca/crea lead con business_id + phone

↓

Guarda message con business_id + lead_id

Para arrancar YA, esta es la mejor opción.

No es SaaS completo todavía, pero tu base de datos ya está lista para SaaS porque business_id ya existe.

Opción 2: identificar negocio por instancia de Evolution API

Esta es mejor si quieres dejar la puerta SaaS más clara desde ahorita.

Evolution API normalmente trabaja con instancias. Por ejemplo:

agent_core_samuel

agent_core_inmobiliaria_norte

agent_core_demo

Entonces puedes guardar en businesses qué instancia de WhatsApp pertenece a qué negocio.

Para eso yo le agregaría un campo a businesses:

evolution_instance_name text unique

Ejemplo:

insert into businesses (

  name,

  business_type,

  evolution_instance_name

)

values (

  'Autos Samuel Ford',

  'cars',

  'agent_core_samuel'

);

Entonces cuando llega un webhook de Evolution, tú lees la instancia:

instance = agent_core_samuel

Y haces:

select *

from businesses

where evolution_instance_name = 'agent_core_samuel'

  and active = true;

Así sabes que ese mensaje pertenece a:

Autos Samuel Ford

Esta opción ya se parece mucho más a SaaS.

Tu flujo mental debería quedar así

businesses = a quién pertenece el WhatsApp conectado

leads = quién escribió a ese negocio

messages = qué se dijo con ese lead

Entonces no pienses todavía:

usuario Samuel creó cuenta, pagó, eligió plan, configuró permisos...

Piensa:

Samuel tiene un business registrado.

Ese business tiene una instancia de WhatsApp.

Todo mensaje de esa instancia cae en ese business.

Tu alcance correcto ahorita sería:

1. Crear un business demo.

2. Recibir webhook de Evolution API.

3. Detectar a qué business pertenece.

4. Sacar el phone del mensaje.

5. Buscar o crear lead.

6. Guardar message.

7. Actualizar last_message del lead.

Eso ya es un hito bien concreto.

Primero que el sistema tenga memoria de conversación. Después que tenga inventario.

evolution_instance_name

En Evolution, una instancia representa un punto de conexión entre un canal de mensajería del cliente y tu proyecto;

además, varios endpoints usan {instance} en la ruta y la respuesta puede traer instanceName.

Por eso tiene sentido guardar ese nombre en tu BD como identificador del negocio.

La idea queda así:

WhatsApp de Samuel

        ↓

Evolution instance: agent_core_samuel

        ↓

Webhook llega a NestJS

        ↓

NestJS lee: instance = agent_core_samuel

        ↓

Busca en businesses

        ↓

Encuentra business_id de Autos Samuel Ford

        ↓

Guarda lead y messages con ese business_id

Para tu flujo programable #1 quedaría así:

1. Evolution recibe mensaje de WhatsApp

2. Evolution manda webhook a NestJS

3. NestJS lee instanceName

4. NestJS busca business por evolution_instance_name

5. NestJS crea o encuentra lead usando business_id + phone

6. NestJS guarda message usando business_id + lead_id

Ejemplo mental:

businesses

-------------------------------------------------------

id          | name                        | evolution_instance_name

abc123 | Autos Samuel Ford  | agent_core_samuel

def456  | Inmobiliaria Norte     | agent_core_inmobiliaria_norte

Si llega webhook con:

{

  "instance": "agent_core_samuel",

  "data": {

    "key": {},

    "message": {}

  }

}

Tu sistema sabe que ese mensaje va para:

Autos Samuel Ford
