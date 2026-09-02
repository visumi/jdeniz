<!-- SEED: re-run $impeccable document once there's code to capture the actual tokens and components. -->
---
name: JDeniz
description: Gestão mobile-first de alunos para profissionais de educação física.
---

# Design System: JDeniz

## Overview

**Creative North Star: "A prancheta de progresso"**

O JDeniz deve parecer uma prancheta digital que acompanha o professor em movimento: direta, legível sob diferentes condições de luz e pronta para registrar a próxima informação sem interromper o atendimento. A interface é profissional e motivadora, mas não clínica nem corporativa.

O sistema adota uma estratégia clara com azul confiável sobre superfícies brancas e neutras frias. A referência é a combinação de progresso esportivo do Strava com a organização pessoal do Apple Health. A experiência rejeita aparência de CRM, planilha e painel administrativo pesado.

**Key Characteristics:**

- Mobile-first e orientado à próxima ação.
- Azul funcional, nunca decoração saturada sem propósito.
- Tipografia SF/system com escala compacta e alta legibilidade.
- Movimento responsivo de 150–250ms, sempre comunicando estado.

## Colors

A paleta é clara, restrita e ancorada em um azul de baixa agressividade, com neutros frios para separar conteúdo sem criar ruído.

### Primary

- **Azul de progresso** (`oklch(0.650 0.100 200)`): ação primária, foco, seleção e marca.

### Neutral

- **Branco de trabalho** (`oklch(1 0 0)`): fundo principal.
- **Superfície fria** (`oklch(0.985 0.008 210)`): painéis e agrupamentos.
- **Tinta azulada** (`oklch(0.18 0.018 220)`): texto principal.
- **Texto secundário legível** (`oklch(0.45 0.025 220)`): descrições e metadados.

### Named Rules

**The Functional Blue Rule.** O azul aparece para indicar ação, seleção, foco ou progresso; nunca como brilho decorativo espalhado pela tela.

## Typography

**Display Font:** SF Pro Display, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif  
**Body Font:** SF Pro Text, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif

**Character:** Uma única família de sistema mantém a leitura rápida no celular e dá ao produto a familiaridade de uma ferramenta nativa, com pesos e escala compacta em vez de títulos exagerados.

### Hierarchy

- **Headline** (700, 2rem, 1.1): título de página e orientação principal.
- **Title** (650, 1.125rem, 1.25): nomes de seções, alunos e blocos de conteúdo.
- **Body** (400, 1rem, 1.5): instruções e conteúdo de leitura.
- **Label** (600, 0.875rem, 1.25): campos, botões e metadados de ação.

## Elevation

O sistema usa camadas tonais e bordas suaves para criar estrutura. Sombras são discretas e reservadas a superfícies que realmente precisam se separar do fluxo, como menus e sheets móveis.

**The Flat-By-Default Rule.** Conteúdo em repouso não flutua; profundidade vem de espaço, contraste de superfície e borda sutil.

## Components

### Buttons

- **Shape:** cantos levemente arredondados (8px), altura mínima de 44px no mobile.
- **Primary:** azul de progresso com texto branco e padding confortável.
- **Hover / Focus:** mudança de tonalidade e anel de foco visível, sem deslocamento ou escala.
- **Secondary / Ghost:** contraste de superfície ou fundo no hover, sem borda decorativa obrigatória.

### Cards / Containers

- **Corner Style:** 12px no máximo para painéis principais.
- **Background:** superfície fria sobre branco de trabalho.
- **Border:** uma borda funcional e discreta quando separar regiões melhora a leitura.
- **Internal Padding:** 16px no mobile e 20–24px em telas maiores.

### Inputs / Fields

- **Style:** fundo branco, borda visível, raio de 8px e altura mínima de 44px.
- **Focus:** borda azul e `ring` acessível.
- **Error / Disabled:** mensagem textual clara e contraste suficiente; nunca depender apenas da cor.

### Navigation

Navegação inferior fixa no mobile com duas ações centrais — Início e Alunos — e sidebar equivalente no desktop. O item ativo usa azul e indicador textual/visual, sem depender apenas de cor.

## Do's and Don'ts

### Do:

- **Do** priorizar leitura e toque no mobile.
- **Do** usar componentes shadcn/ui e tokens semânticos consistentes.
- **Do** manter transições curtas, com alternativa para movimento reduzido.
- **Do** explicar estados vazios com a próxima ação recomendada.

### Don't:

- **Don't** criar aparência de CRM, planilha ou sistema corporativo pesado.
- **Don't** usar cartões idênticos em grade apenas para preencher espaço.
- **Don't** usar gradiente em texto, glassmorphism decorativo ou fundos creme/bege.
- **Don't** usar barras laterais coloridas, botões excessivamente contornados ou animações decorativas.
