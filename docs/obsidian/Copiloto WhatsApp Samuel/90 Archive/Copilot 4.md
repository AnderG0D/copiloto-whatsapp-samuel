Hito 3 - Score + classification básico avanzado

Sí vato, pueden ser más cosas, pero para que no se vuelva un monstruo, yo lo separaría en niveles.

Lo que te dije era el Hito 3 mínimo viable:

Mensaje entra  
→ se calcula score  
→ se clasifica lead  
→ se actualiza Supabase

Pero el Hito 3 completo/chido sí puede tener más carnita.

Hito 3 — Score + clasificación del lead

Yo lo partiría así:

3.1 Score por mensaje  
3.2 Score acumulado del lead  
3.3 Clasificación COLD/WARM/HOT  
3.4 Razón de clasificación  
3.5 Señales detectadas  
3.6 Historial de cambios  
3.7 Reglas por tipo de negocio  
3.8 Preparar contexto para IA

3.1 Score por mensaje

Cada mensaje individual recibe puntos.

Ejemplo:

"Hola" = 5 puntos  
"Me interesa" = 20 puntos  
"Cuánto cuesta" = 25 puntos  
"Lo puedo ver hoy?" = 40 puntos  
"Quiero financiarlo" = 35 puntos

Esto te dice qué tan fuerte fue ese mensaje específico.

3.2 Score acumulado del lead

El lead no se mide solo por un mensaje, sino por toda su conversación.

Ejemplo:

Mensaje 1: "Hola"                                  +5  
Mensaje 2: "Me interesa una Ranger"   +30  
Mensaje 3: "Cuánto cuesta?"                +25  
Mensaje 4: "La puedo ver hoy?"           +40

Score total: 100  
Clasificación: HOT

Aquí ya no estás viendo mensajes sueltos. Estás viendo intención acumulada.

3.3 Clasificación del lead

Con base en el score total:

0 - 29   → COLD  
30 - 69  → WARM  
70 - 100 → HOT  

Ejemplo:

COLD = apenas preguntó algo general  
WARM = mostró interés real  
HOT  = quiere precio, cita, financiamiento o disponibilidad

3.4 Razón de clasificación

Esto está más chido.

No solo guardas:

classification: HOT

También guardas algo como:

classification_reason:  
"Preguntó por precio, disponibilidad y cita para verlo hoy."

Esto te sirve para que tú, Samuel o el bot entiendan por qué ese lead está caliente.

3.5 Señales detectadas

Puedes detectar señales específicas.

Ejemplo:

intent_price: true  
intent_financing: true  
intent_appointment: true  
intent_availability: false  
intent_vehicle_specific: true

O guardarlo como JSON:

{  
  "price": true,  
  "financing": true,  
  "appointment": true,  
  "urgency": true,  
  "vehicleMentioned": "Ford Ranger"  
}

Esto es muy poderoso porque después Groq puede recibir contexto más limpio.

3.6 Historial de cambios

También puedes registrar cuándo cambió un lead.

Ejemplo:

Antes:  
COLD, score 10

Después:  
WARM, score 45

Después:  
HOT, score 85

Eso te permite saber:

Este lead se calentó después de preguntar por financiamiento.

No es obligatorio ahorita, pero es una mejora bien SaaS.

3.7 Reglas por tipo de negocio

Como tu sistema quiere servir para autos y bienes raíces, las reglas no deberían estar quemadas para siempre solo en código.

Para autos:

- Precio
- Financiamiento
- Enganche
- Mensualidad
- Modelo
- Año
- Kilometraje
- Cita
- Prueba de manejo

Para real estate:

- Renta
- Venta
- Ubicación
- Precio
- Crédito
- Enganche
- Recámara
- Baños
- Visita
- Cita

Entonces el scoring puede depender de:

business.business_type = cars  
business.business_type = real_estate

Ahí tu copiloto empieza a verse más como SaaS real.

3.8 Preparar contexto para IA

El Hito 3 también debe dejar listo algo así:

Lead:  
- Teléfono: 614...  
- Score: 85  
- Clasificación: HOT  
- Intereses detectados: precio, financiamiento, cita  
- Último mensaje: "Cuánto cuesta y lo puedo ver hoy?"

Luego en el Hito 4, cuando metas Groq, le pasas ese contexto y le dices:

Este lead está HOT.

Responde rápido, directo y con intención de cerrar cita.

Entonces sí, el Hito 3 real podría quedar así

🎯 Hito 3 — Score + clasificación del lead

Objetivo:  
Detectar el nivel de interés de cada lead con base en sus mensajes y actualizar su estado comercial.

Incluye:  
☐ Crear LeadScoringService  
☐ Calcular score por mensaje  
☐ Acumular score en leads.score  
☐ Clasificar lead como COLD/WARM/HOT  
☐ Guardar score y classification en messages  
☐ Actualizar score y classification en leads  
☐ Detectar señales: precio, financiamiento, cita, urgencia, modelo  
☐ Guardar razón de clasificación  
☐ Preparar contexto limpio para futura respuesta con IA

Done cuando:  
☐ Un mensaje tipo "Hola" deje lead COLD  
☐ Un mensaje tipo "Me interesa una Ranger" deje lead WARM  
☐ Un mensaje tipo "Cuánto cuesta y la puedo ver hoy?" deje lead HOT  
☐ Supabase muestre score, classification y señales detectadas  
☐ El backend imprima logs claros del cálculo

La neta, tu intuición está bien: sí puede ser más grande.

Pero la versión buena sería:

Primero:  
Score + clasificación básica funcionando

Luego:  
Razones + señales + reglas por negocio

Después:  
IA usando esa clasificación para responder mejor

O sea, no es que sea poquita cosa. Es que conviene hacerlo por capas para no atorarte.

El corazón del Hito 3 es este:

El copiloto deja de solo guardar mensajes  
y empieza a interpretar intención comercial.