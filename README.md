# AI Capsule

AI Capsule is a private prompt library. Sign in with GitHub to save, search, organise, copy, update, and delete your prompt records.

## Stack

- React and Vite frontend
- Node.js and Express API
- PostgreSQL database
- GitHub OAuth followed by an Express-issued JWT in an HttpOnly cookie

## Local setup

Use a current Node.js LTS release supported by Vite 8 and a PostgreSQL database. The server creates the `capsules` table on startup.

1. Install dependencies:

   ```sh
   npm install --prefix server
   npm install --prefix client
   ```

2. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL`, `JWT_SECRET`, and the GitHub OAuth values. For local development, keep `CLIENT_URL=http://localhost:5173` and set the OAuth callback URL to `http://localhost:5000/auth/github/callback`.

3. Start the API and frontend in separate terminals:

   ```sh
   npm run dev --prefix server
   npm run dev --prefix client
   ```

   Open `http://localhost:5173`. Vite proxies `/auth` and `/api` requests to the Express server on port 5000.

## Production deployment

The Express app serves the built React site when `NODE_ENV=production`. A single public origin keeps the OAuth redirect and cookie setup straightforward.

Example build command:

```sh
npm install --prefix server && npm install --prefix client && npm run build --prefix client
```

Example start command:

```sh
npm start --prefix server
```

Configure these environment variables in the hosting platform. Do not put their values in this README or commit them:

- `PORT`
- `NODE_ENV=production`
- `CLIENT_URL` (the public app origin)
- `DATABASE_URL` (a persistent PostgreSQL database)
- `JWT_SECRET` (a long, random value)
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL` (the public app origin plus `/auth/github/callback`)

**Public deployment URL:** add the verified URL here after deployment.

## Routes

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/` | Public | Landing page |
| GET | `/login` | Public | Starts GitHub sign-in |
| GET | `/dashboard` | Session required by the UI | Prompt workspace |
| GET | `/auth/github` | Public | Begins the GitHub OAuth redirect |
| GET | `/auth/github/callback` | OAuth callback | Verifies state and issues the application JWT |
| GET | `/auth/me` | JWT required | Returns the signed-in user |
| POST | `/auth/logout` | Public | Clears the session cookie |
| GET | `/api/health` | Public | Returns `{"status":"ok"}` |
| GET | `/api/capsules` | JWT required | List the signed-in user’s prompts |
| POST | `/api/capsules` | JWT required | Create a prompt for the signed-in user |
| PUT | `/api/capsules/:id` | JWT required | Update one of the signed-in user’s prompts |
| DELETE | `/api/capsules/:id` | JWT required | Delete one of the signed-in user’s prompts |

The browser sends same-origin requests with credentials included. The API verifies the JWT from the `token` cookie before returning prompt data. The authenticated user ID comes from the verified token; the browser cannot choose a record owner. Read, update, and delete queries are scoped to that user.

In production, the session cookie is `HttpOnly`, `Secure`, and `SameSite=Lax`. OAuth state is checked on the callback.

## Database and storage

The application connects through `DATABASE_URL` and creates the `capsules` table if it does not exist. Records include the GitHub user ID, project name, prompt title and text, version, category, response summary, usefulness, review/improvement flags, screenshot evidence URL, notes, and creation time. Prompt records persist according to the configured PostgreSQL provider. Screenshot evidence is stored as a URL; this app does not upload image files.

## Required authentication checks

Run these against the deployed public URL before recording the demonstration. Replace `YOUR_PUBLIC_URL` with the actual HTTPS origin.

```sh
curl -i https://YOUR_PUBLIC_URL/api/capsules
curl -i -H "Cookie: token=fake-token-123" https://YOUR_PUBLIC_URL/api/capsules
```

Both requests should return `401 Unauthorized`. **Results:** not recorded in this source archive; add the actual HTTP status and date after running them against the deployed app.

## AI-assisted development note

OpenAI Codex assisted with the React interface and code review. During review, the dashboard was found to expect a `{ capsule: ... }` response while the create/update API returned a bare row; the API response shape was made consistent with the dashboard. The `/auth/me` endpoint was also found inside the OAuth callback and moved to router setup so it is registered once. The implementation keeps Express serving the production React build and uses PostgreSQL, preserving a same-origin session-cookie flow without adding dependencies.

The project owner should review the changes, run the authentication and CRUD checks, and be prepared to explain the implementation and deployment choices in the recorded demonstration.
