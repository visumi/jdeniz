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

## Publicação

O repositório publica automaticamente o frontend no GitHub Pages e a API no Cloudflare Workers a cada push na branch `main`.

### GitHub Pages

1. Em `Settings > Pages`, selecione `GitHub Actions` como origem do build.
2. Em `Settings > Secrets and variables > Actions > Variables`, cadastre as variáveis públicas do Firebase:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
3. Adicione `visumi.github.io` aos domínios autorizados do Firebase Authentication.

O site ficará disponível em `https://visumi.github.io/jdeniz/`.

### Cloudflare Workers

Em `Settings > Secrets and variables > Actions > Secrets`, cadastre:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `TURSO_URL`
- `TURSO_AUTH_TOKEN`
- `FIREBASE_PROJECT_ID`
- `OWNER_EMAIL`

O workflow sincroniza os quatro últimos segredos no Worker e publica a API em `https://jdeniz-api.isumi.com.br`.
