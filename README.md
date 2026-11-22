# AI Capsule

AI Capsule is a private prompt library. Sign in with GitHub to save, search, organise, copy, update, and delete your prompt records.

## Stack

- React and Vite frontend
- Node.js and Express API deployed on Vercel
- Neon PostgreSQL for deployed, persistent storage; SQLite for local development
- GitHub OAuth followed by an Express-issued JWT in an HttpOnly cookie

## Local setup

Use a current Node.js LTS release supported by Vite 8. Locally, the server uses SQLite by default and creates `server/database/capsules.sqlite` on startup. A local `DATABASE_URL` may be left blank for SQLite or set to a Neon/PostgreSQL connection string.

1. Install dependencies:

   ```sh
   npm install --prefix server
   npm install --prefix client
   ```

2. Copy `server/.env.example` to `server/.env` and set `JWT_SECRET` and the GitHub OAuth values. For local development, leave `DATABASE_URL` blank to use SQLite, keep `CLIENT_URL=http://localhost:5174`, and set the OAuth callback URL to `http://localhost:5000/auth/github/callback`.

3. Start the API and frontend in separate terminals:

   ```sh
   npm run dev --prefix server
   npm run dev --prefix client
   ```

   Open `http://localhost:5174`. Vite proxies `/auth` and `/api` requests to the Express server on port 5000.

## Vercel + Neon deployment

The frontend and Express API are separate Vercel projects from this repository, and Neon PostgreSQL stores deployed prompt records. Render was initially considered, but its credit-card verification requirement prevented its use; Vercel and Neon were chosen as the alternative cloud deployment.

Create two Vercel projects connected to this repository:

1. **Frontend:** set the Root Directory to `client`. Vercel builds the Vite app from `npm run build` and serves the `dist` directory. Add `VITE_API_BASE_URL` with the API project's public origin, with no trailing slash. The included `client/vercel.json` supports direct navigation to React routes such as `/dashboard`.
2. **API:** set the Root Directory to `server`. Vercel detects the Express app in `index.js` and runs it as a Function. Its Express routes handle `/api/*` and `/auth/*`.

Set these environment variables on the **API project**. Do not commit or share their values:

- `DATABASE_URL`: Neon PostgreSQL's pooled connection URL. This is required on Vercel; an empty value selects SQLite only for local development.
- `CLIENT_URL`: the exact public frontend origin, such as `https://your-frontend.vercel.app`.
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`: the GitHub OAuth app credentials.
- `GITHUB_CALLBACK_URL`: the API origin plus `/auth/github/callback`.
- `JWT_SECRET`: a long, random signing key.
- `COOKIE_SAME_SITE=none`: the frontend and API are separate origins; production cookies are Secure and HttpOnly.

On the **frontend project**, set `VITE_API_BASE_URL` to the API origin. On the GitHub OAuth app, set the Homepage URL to the frontend origin and the callback URL to the API callback above. After changing Vercel environment variables, redeploy so the new values take effect.

**Public frontend URL:** [https://ai-capsule.vercel.app](https://ai-capsule.vercel.app)

**Public API URL:** [https://ai-capsule-api.vercel.app](https://ai-capsule-api.vercel.app)

**Health check:** [https://ai-capsule-api.vercel.app/api/health](https://ai-capsule-api.vercel.app/api/health)

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

The frontend sends credentialed requests to the Express API. Vercel's API project allows the exact frontend origin through CORS. The API verifies the JWT from the `token` cookie before returning prompt data. The authenticated user ID comes from the verified token; the browser cannot choose a record owner. Read, update, and delete queries are scoped to that user.

In production, the session cookie is `HttpOnly`, `Secure`, and `SameSite=None` for the separate Vercel frontend/API origins. OAuth state is checked on the callback.

## Database and storage

The application uses SQLite during local development and creates the `capsules` table in `server/database/capsules.sqlite`. On Vercel, `DATABASE_URL` is required and selects Neon PostgreSQL; the schema is initialized by the Express API. Each record stores the GitHub user ID, project name, prompt title and text, version, category, response summary, usefulness, review/improvement flags, screenshot evidence URL, notes, and creation time. Screenshot evidence is stored as a URL; this app does not upload image files.

## Authentication and persistence verification

### Checks performed

- [x] `GET https://ai-capsule-api.vercel.app/api/health` returned `{"status":"ok"}` when checked on 2026-11-22.
- [x] Unauthenticated `GET https://ai-capsule-api.vercel.app/api/capsules` returned `{"message":"Unauthorized: Please log in."}` when checked on 2026-11-22. The browser check confirmed the response body; it did not capture the raw HTTP status code.

### Checks pending

- [ ] Send a request with an invalid JWT and confirm the API denies it.
- [ ] Complete GitHub OAuth sign-in and sign-out in the deployed app.
- [ ] Create, read, update, and delete a prompt while signed in.
- [ ] Refresh the dashboard after creating a prompt and confirm the record persists in Neon.
- [ ] Sign in as a second GitHub account and confirm the first account's records are not visible or editable.
- [ ] Verify the create and edit forms reject whitespace-only project names, titles, and prompt text.

The checks above are manual deployment checks. Do not mark pending items complete until they have actually been run against the live app.

For the authentication checks, use:

```sh
curl -i https://ai-capsule-api.vercel.app/api/capsules
curl -i -H "Cookie: token=fake-token-123" https://ai-capsule-api.vercel.app/api/capsules
```

Both requests are expected to return `401 Unauthorized`.

## AI-assisted development note

OpenAI Codex assisted with the React interface and code review. During review, the dashboard was found to expect a `{ capsule: ... }` response while the create/update API returned a bare row; the API response shape was made consistent with the dashboard. The `/auth/me` endpoint was also found inside the OAuth callback and moved to router setup so it is registered once. A deployment decision was to use Vercel for the React frontend and Express API with Neon PostgreSQL for persistent cloud storage, while keeping SQLite as the local development default.

One limitation is that the frontend and API are separate Vercel projects, so their public origins and credentialed-cookie settings must remain aligned. The project owner should run the authentication and CRUD checks against the deployed URLs and be prepared to explain the implementation and deployment choices in the recorded demonstration.
