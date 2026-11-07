# LPWichtel

LPWichtel is a lightweight Secret Santa web app. It works without email registration and supports shared invitation links, personal participant links, and optional username/password access.

## What the app does

### Create a group

The organizer creates a group with:

- Group name
- Organizer name
- Optional budget
- Optional event date

The API creates three important values:

- Invite link for other participants
- Admin link for the organizer
- Personal link for the organizer as a participant

### Join a group

Participants open the invite link and enter their name. The app creates a personal participant link immediately.

The personal link can be used to:

- Add or update wishes
- Add no-gos and allergies
- See the group status
- Reveal the assigned recipient after the draw

### Optional account login

Participants can create an account from their personal link. The account uses:

- Username
- Password

No email address is used or required.

After registration, participants can use `/login` instead of saving their personal link.

### Draw

The organizer opens the admin link and sees the current participant list.

The draw:

- Requires at least three participants
- Assigns every participant exactly one recipient
- Prevents participants from drawing themselves
- Changes the group status from `OPEN` to `DRAWN`
- Prevents new participants from joining after the draw

## Main routes

### Frontend pages

| Route | Purpose |
|---|---|
| `/` | Landing page and group creation |
| `/join/:inviteCode` | Join a group |
| `/my-santa/:token` | Personal participant page |
| `/register?token=:token` | Create username and password |
| `/login` | Login with username and password |
| `/group/:id/admin?token=:adminToken` | Organizer dashboard |

### Backend API

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/groups` | Create a group and organizer participant |
| `POST` | `/api/groups/join` | Add a participant |
| `POST` | `/api/groups/draw` | Execute the draw |
| `GET` | `/api/me/:token` | Load a participant page |
| `PUT` | `/api/me/:token/wishes` | Save wishes |
| `POST` | `/api/auth/register` | Create a username/password account |
| `POST` | `/api/auth/login` | Login and return the participant link |
| `GET` | `/api/groups/:id/admin?token=...` | Load admin dashboard data |

## Project structure

```text
frontend/
  src/
    App.tsx       Main React application and routes
    styles.css    Global styling and responsive layout
    main.tsx      React entry point
  package.json

backend/
  src/
    server.ts     Express API and draw logic
  prisma/
    schema.prisma Database schema
  package.json

docker-compose.yml Local PostgreSQL service
```

## Technology

- React
- Vite
- TypeScript
- Express
- Prisma
- PostgreSQL
- Framer Motion
- Lucide React

The frontend is a Vite single-page application. The backend is a separate Express service. This is different from a Next.js deployment because the frontend and API are deployed separately.

## Environment variables

Create `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wichtel?schema=public"
PORT=3001
```

For production, replace the local database URL with the PostgreSQL connection string supplied by the hosting provider.

Create `frontend/.env` for a deployed frontend:

```env
VITE_API_URL="https://your-backend-domain.example"
```

If `VITE_API_URL` is not set, the frontend uses `http://localhost:3001`.

## Local development

### 1. Start PostgreSQL

Make sure Docker Desktop is running, then run:

```powershell
docker compose up -d postgres
```

### 2. Install and prepare the backend

```powershell
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
```

### 3. Start the backend

```powershell
cd backend
npm run dev
```

The API runs on:

```text
http://localhost:3001
```

### 4. Start the frontend

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs on the Vite development URL, usually:

```text
http://localhost:5173
```

## Hosting recommendation

Deploy the services separately:

1. PostgreSQL provider
2. Backend service
3. Frontend static site

Suitable providers include Railway, Render, Fly.io, Supabase, Neon, and Vercel. The exact provider is flexible because the app uses a normal PostgreSQL connection string and HTTP API.

## Backend deployment

Use the `backend` directory as the backend project root.

Install command:

```text
npm install
```

Build command:

```text
npm run build
```

Start command:

```text
npm start
```

Required environment variables:

```env
DATABASE_URL=your-production-postgresql-url
PORT=3001
```

Run the production migration once after the database is created:

```text
npx prisma migrate deploy
```

The backend must be publicly reachable over HTTPS, for example:

```text
https://lpwichtel-api.example.com
```

## Frontend deployment

Use the `frontend` directory as the frontend project root.

Install command:

```text
npm install
```

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

Required environment variable:

```env
VITE_API_URL=https://lpwichtel-api.example.com
```

The frontend can be deployed as a static Vite site on Vercel, Netlify, Cloudflare Pages, or a similar provider.

## Important hosting settings

### SPA fallback

The frontend uses client-side routes. The hosting provider must serve `index.html` for these paths:

- `/join/...`
- `/my-santa/...`
- `/register`
- `/login`
- `/group/.../admin`

On Vercel, add a rewrite from all paths to `/index.html` if the provider does not handle Vite history fallback automatically.

### CORS

The backend currently enables CORS for the frontend. For a stricter production setup, replace the open CORS configuration with the exact frontend domain.

### Secrets

Never commit:

- `backend/.env`
- Production database URLs
- Admin links
- Participant links

Only commit `.env.example` files.

## Database schema

The main models are:

- `Group`
  - Name, budget, event date
  - Invite code
  - Admin token
  - Status
- `Participant`
  - Name
  - Personal token
  - Optional username
  - Hashed password
  - Wishes
  - Draw assignment

Passwords are stored as salted `scrypt` hashes. Plain text passwords are never saved.

## Verification before launch

Run both builds:

```powershell
cd frontend
npm run build

cd ..\backend
npm run build
```

Test the complete flow:

1. Create a group
2. Open the invite link in a second browser window
3. Join with at least two additional participants
4. Add wishes for each participant
5. Create a username/password account from a personal link
6. Log in using `/login`
7. Open the admin link
8. Execute the draw
9. Open each personal page and reveal the assigned recipient

## Current limitations

- There is no password reset flow because no email address is collected.
- The organizer admin link is the admin credential. It should be kept private.
- Login currently returns the participant personal token directly to the browser.
- The backend uses Express and Prisma, not Next.js route handlers.
- The frontend and backend need separate deployments.
