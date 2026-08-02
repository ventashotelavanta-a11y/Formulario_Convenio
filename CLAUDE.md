# CLAUDE.md — Avanta Hotel & Villas
> Este archivo es específico del proyecto Avanta.
> Para contexto global del ecosistema: lee C:\Proyectos\CLAUDE.md

---

## Proyecto
Hotel boutique + villas con operaciones digitales completas.
**Repo:** `C:\Proyectos\Avanta\Formulario_Convenio\`
**GitHub:** `ventashotelavanta-a11y/Formulario_Convenio`
**Deploy:** Vercel
**Sitio:** avantahotel.com.mx
⚠️ Token GitHub con error 403 — regenerar en github.com/settings/tokens

## Stack
- HTML + Vercel serverless
- Python ReportLab (fuente Kodchasan-Medium)
- Assets: logo_avanta_principal.jpg, pie_de_pagina.jpg
- n8n: 19 workflows activos

## Negocio
Hotel en Carretera Querétaro–SLP Km 23.8, Santa Rosa de Jáuregui, Qro.
- Cotizadores: habitaciones y Sala NOVA
- Convenios corporativos PDF
- Bots: prospección (Sofí), agenda (Ale)
- Marketing automatizado

## Sala NOVA
- Coffee Break Simple: $250/persona
- Coffee Break Continuo: $350/persona (8hrs)
- Solo Renta: $1,900 flat (8hrs)

## Tarifas convenios (tarifas.json)
6 claves: King/Queen × Sin Desayuno / Desayuno Americano / Desayuno Buffet

## Workflows n8n activos
Cotizador_Sala_Nova | Convenio_Avanta_Inicial | auto_posteo | Sofí | Ale | tracking_meta_ads | google_ads | Factura | Creación_Reservación | Envío_Convenios | generador_de_contenido_v2

## Pendientes
- [ ] Token GitHub ventashotelavanta-a11y (error 403)
- [ ] Desplegar Sala NOVA
- [ ] Completar tracking_meta_ads (crear cuenta publicitaria Meta)
- [ ] Poblar buckets MinIO con fotografía y logos
- [ ] Aprobar Meta App

---

## AGENTES PERSONALIZADOS — Enrutamiento Automático

> Claude detecta el tipo de tarea y activa el agente correcto SIN que Ricardo lo pida explícitamente.
> También puedes invocar cualquiera directamente con `/nombre-skill`.

### Router de Agentes

| Si la tarea involucra... | Agente activo automáticamente |
|---|---|
| Workflows n8n, automatizaciones, JSON, triggers, credenciales | **`/n8n-architect`** |
| Copy, anuncios, Meta Ads, Google Ads, estrategia de marketing | **`/marketing-rpc`** |
| Contenido para Instagram, Reels, newsletters, calendarios | **`/content-creator-rpc`** |
| Prompts para Flux/imágenes IA, identidad visual, paleta | **`/graphic-designer-rpc`** |
| HTML, React, Python ReportLab, Vercel, componentes web | **`/web-designer-rpc`** |
| Operaciones del hotel, bots Sofí/Ale, convenios, tarifas | **`/avanta-agent`** |
| Propuestas de consultoría, KPIs hoteleros, diagnósticos | **`/rpc-consulting`** |

### Instrucción de enrutamiento automático
Antes de responder cualquier tarea en este proyecto:
1. Identifica qué tipo de tarea es (ver tabla arriba)
2. Adopta internamente el contexto del agente correspondiente
3. Si la tarea toca múltiples dominios (ej. n8n + marketing), combina ambos agentes
4. Menciona brevemente qué agente estás aplicando al inicio de tu respuesta

### Invocación directa (cuando quieras forzar un agente)
```
/avanta-agent      → operaciones, bots, convenios, tarifas
/n8n-architect     → workflows, automatizaciones, JSON completo
/marketing-rpc     → copy, ads, estrategia de marketing
/content-creator-rpc → contenido redes, Reels, newsletters
/graphic-designer-rpc → prompts Flux, identidad visual
/web-designer-rpc  → HTML, Python, Vercel, componentes
```

---

## SKILLS DE SOPORTE (activas como sombra)

**DESARROLLO**
senior-backend | senior-fullstack | agent-designer | agent-workflow-designer

**MARKETING DIGITAL**
marketing-strategy-pmm | marketing-ideas | campaign-analytics | analytics-tracking | marketing-psychology

**CONTENIDO Y REDES**
content-strategy | social-media-manager | video-content-strategist | copywriting

**PUBLICIDAD**
ad-creative | paid-ads | ab-test-setup | seo-audit

**VENTAS Y CX**
sales-engineer | customer-success-manager | contract-and-proposal-writer | pricing-strategy

**CONVERSIÓN**
page-cro | landing-page-generator | form-cro

**ESTRATEGIA**
ceo-advisor | competitive-intel | competitive-teardown

---

## Reglas de sesión
1. Lee siempre C:\Proyectos\CLAUDE.md para contexto global
2. **Aplicar router de agentes** antes de responder cada tarea
3. Tono: elegante, cálido, aspiracional, premium
4. Paleta: tierra, dorados, blanco roto, verde esmeralda suave
5. Español mexicano por defecto
6. Bloques completos siempre — nunca código fragmentado
7. Para n8n: sin `$env.*`, nombres de nodos ASCII, Airtable → operación `Create`

