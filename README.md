# JDeniz

Plataforma mobile-first para cadastro e acompanhamento de alunos de um profissional de educação física.

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Firebase Authentication com Google
- Cloudflare Workers
- Turso/libSQL
- TanStack Query

## Desenvolvimento

1. Copie `.env.example` para `.env` e preencha as credenciais do Firebase, API e Turso.
2. Execute `npm install`.
3. Rode `npm run db:migrate` com o banco configurado.
4. Em um terminal, rode `npm run api:dev`.
5. Em outro, rode `npm run dev`.

O frontend fica em `http://localhost:5173` e a API em `http://localhost:8787`.

## Comandos

```bash
npm run dev
npm run typecheck
npm test
npm run api:test
npm run build
```

O frontend usa o mesmo modelo de publicação estática do Playground, com `dist/404.html` gerado para preservar rotas no GitHub Pages.
