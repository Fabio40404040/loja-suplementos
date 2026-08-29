# Publicação da Forja Nutrition

O projeto usa três serviços:

- Vercel para o frontend Vite;
- Render para a API Express;
- Supabase para o banco PostgreSQL.

## 1. Criar o banco no Supabase

1. Crie um projeto no Supabase.
2. Abra **Connect** e selecione **Session pooler**.
3. Copie a URI de conexão. Ela será cadastrada como `DATABASE_URL` no Render.

As tabelas `users`, `orders` e `order_items` são criadas automaticamente quando a API inicia.

## 2. Publicar a API no Render

Crie um **Web Service** conectado ao repositório e use:

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Cadastre as variáveis:

```text
DATABASE_URL=URI Session pooler copiada do Supabase
DATABASE_SSL=true
JWT_SECRET=uma chave longa, aleatória e diferente da antiga
FRONTEND_URL=https://seu-projeto.vercel.app
NODE_ENV=production
EXPOSE_RESET_LINK=false
```

Para aceitar mais de um frontend, separe as URLs de `FRONTEND_URL` por vírgulas.

## 3. Conectar o frontend na Vercel

Em **Settings → Environment Variables**, cadastre:

```text
VITE_API_URL=https://sua-api.onrender.com/api
```

Depois faça um novo deploy do frontend.

## 4. Migrar os dados JSON existentes (opcional)

Faça esta etapa uma única vez, no computador local, após preencher `backend/.env` com `DATABASE_URL` e `JWT_SECRET`:

```bash
npm --prefix backend run db:migrate-json
```

O processo mantém os números dos usuários e pedidos e pode ser executado novamente sem duplicar os registros.

Depois de confirmar os dados no Supabase, remova `backend/data/users.json`, `backend/data/orders.json`, `.env` e `backend/.env` do repositório Git. Nunca envie senhas ou conexões do banco para o GitHub.

## Recuperação de senha

O backend gera e armazena tokens seguros, mas não envia e-mail. Para testes locais, o link aparece na tela. Em produção, `EXPOSE_RESET_LINK=false` impede que o token seja devolvido pela API; para completar o fluxo real, conecte posteriormente um serviço de e-mail.
