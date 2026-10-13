# Ancient Lore — The Archive of Heroes

Website for the **Ancient Lore** YouTube channel (cinematic Dota 2 hero lore).
The home page shows every Dota 2 hero. Heroes with episodes are highlighted; the rest are marked
"Coming soon" and can be voted for.

Stack: Next.js (App Router) · TypeScript · Tailwind CSS · Drizzle ORM · Neon Postgres · Vercel (ISR + Cron).

---

## Using the admin panel

Open **`/admin`** on the live site and log in with your `ADMIN_PASSWORD`.
You stay logged in for 7 days (secure, httpOnly cookie). On shared computers, use **Logout** in the top bar.

### 1. Sync videos
Press **⟳ Sync videos**. This imports every public upload from your channel through the YouTube Data API.
Shorts and live streams are skipped, and videos you already imported get their titles and thumbnails updated.
The sync also runs **automatically every day at 04:00 UTC** (Vercel Cron). It refreshes the hero list from
OpenDota at the same time, so new heroes appear on their own.

### 2. Review auto-suggested heroes
When a *new* video is imported, hero names found in its title are pre-added as **Main** with an amber
**needs review** flag. Lore names like *Yurnero*, *Magina* and *Rylai* count too.

- **✓ Confirm** keeps the hero and **✕** removes it. Press **Save** when you're done.
- **Confirm all & save** confirms every suggestion for that video at once.
- Suggestions you haven't confirmed are **not shown on the public site**.

### 3. Assign heroes to a video
For each video:
1. Click **+ Add hero**, type to search (↑/↓ and Enter work), and pick the hero.
2. Choose the role:
   - **Main**: listed under *Episodes* on the hero's page
   - **Supporting** / **Cameo**: listed under *Also appears in*, with a role badge
3. Optionally add a short note (e.g. `enters in chapter 4`). It's shown on the video card.
4. Press **Save**. The home page and the affected hero pages update immediately.

The **Needs attention** box and the **No heroes** / **Needs review** tabs list the videos you still need to
handle, so nothing slips through.

### 4. Votes
**Votes** in the admin bar lists every hero that has votes, with the total, last-7-days and today's counts.
Visitors can vote once per hero per day. Only a salted hash of their IP is stored, never the IP itself.
Voting for a hero closes automatically once they have a confirmed appearance.

---

## Environment variables

See [`.env.example`](./.env.example).

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string (set by the Vercel ↔ Neon integration) |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `YOUTUBE_CHANNEL_ID` | Channel ID (`UC…`) |
| `ADMIN_PASSWORD` | Password for `/admin` |
| `SESSION_SECRET` | 32+ random characters; signs the admin cookie and salts vote hashes |
| `CRON_SECRET` | Random string; Vercel Cron uses it to authenticate to `/api/cron/sync` |

## Development

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run db:migrate           # apply migrations
npm run dev
```

- `npm run db:generate`: create a new migration after editing `src/db/schema.ts`
- `npm test` · `npm run lint` · `npm run typecheck`
- Migrations run automatically before every build (`npm run build`), so each Vercel deploy keeps the database schema up to date.

## How it works

- **Public pages** (`/` and `/hero/[slug]`) use ISR and revalidate every hour. Admin saves, votes and syncs also revalidate them on demand.
- **Hero data** comes from the OpenDota API (`/api/constants/heroes`). It's cached in the `heroes` table and uses the official Steam CDN images.
- **Auth**: `src/middleware.ts` protects `/admin/*` and `/api/admin/*` with an HS256-signed JWT cookie.
