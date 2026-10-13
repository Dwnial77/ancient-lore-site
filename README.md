# Ancient Lore — The Archive of Heroes

Website for the **Ancient Lore** YouTube channel (cinematic Dota 2 hero lore).
The home page shows every Dota 2 hero. Heroes with episodes are highlighted; the rest are marked
"Coming soon" and can be voted for.

Stack: Next.js (App Router) · TypeScript · Tailwind CSS · Drizzle ORM · Neon Postgres · Vercel (ISR).

---

## Using the admin panel

Open **`/admin`** on the live site and log in with your `ADMIN_PASSWORD`.
You stay logged in for 7 days (secure, httpOnly cookie). On shared computers, use **Logout** in the top bar.

### 1. Add videos
Paste one or more YouTube links into **Add videos** (one per line) and press **+ Add videos**.
Any link format works: `youtube.com/watch?v=…`, `youtu.be/…`, `/shorts/…` or `/live/…`.
The title, thumbnail, publish date and duration are filled in automatically. No YouTube API key is needed.

- If YouTube doesn't give the date or duration, the video gets a **Duration missing** badge.
  Click **✎ Edit details** to fix the title, date (`YYYY-MM-DD`) or duration (`18:42` or `1:02:03`), then **Save details**.
- **Delete video** removes a video from the site only; nothing changes on YouTube.
- **↻ Refresh hero list** re-downloads the hero list from OpenDota. Use it when Valve releases a new hero.

### 2. Review auto-suggested heroes
Each video you add is checked for hero names in its title, including lore names like *Yurnero*,
*Magina* and *Rylai*. Any hero it finds is pre-added as **Main** with an amber **needs review** flag.

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

### 4. Topics: "Beyond the Heroes"
Topics are for videos that aren't about a single hero:
- **Series**: a recurring format, e.g. *What If…*
- **World lore**: a character, creature or place, e.g. *Roshan*, *the Shopkeeper*

Create them under **Topics** in the admin bar (name, type, optional short description, optional cover image link,
and the order on the home page). Then tag videos with **+ Add topic** on the Videos page, the same way you add heroes.
A video can have heroes *and* topics, e.g. "What If Juggernaut…" appears both in the *What If* series and on
Juggernaut's page.

Each topic gets a card in **Beyond the Heroes** on the home page and its own page at `/lore/<topic>`.
With no cover image set, the newest episode's thumbnail is used. When you add a video, topic names in its title are
suggested automatically (needs review), just like heroes.

### 5. Votes
**Votes** in the admin bar lists every hero that has votes, with the total, last-7-days and today's counts.
Visitors can vote once per hero per day. Only a salted hash of their IP is stored, never the IP itself.
Voting for a hero closes automatically once they have a confirmed appearance.

---

## Environment variables

See [`.env.example`](./.env.example).

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string (set by the Vercel ↔ Neon integration) |
| `ADMIN_PASSWORD` | Password for `/admin` |
| `SESSION_SECRET` | 32+ random characters; signs the admin cookie and salts vote hashes |
| `YOUTUBE_CHANNEL_ID` | Optional. Channel ID (`UC…`) for the header's YouTube button |

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

- **Videos play inside the site** in a cinematic player (YouTube's privacy-enhanced embed, so views still count). Ctrl/Cmd-click opens YouTube instead.
- **Latest episode** is featured at the top of the home page automatically.
- **Share images**: each page has a generated preview image for Discord, Reddit, Telegram etc. (`opengraph-image.tsx` files).
- **Analytics**: Vercel Web Analytics (`<Analytics />` in the root layout); see the project's Analytics tab.
- **Public pages** (`/`, `/hero/[slug]`, `/lore/[slug]`) use ISR and revalidate every hour. Admin changes and votes also revalidate them on demand.
- **Video details** come from YouTube's public oEmbed endpoint and watch page (`src/lib/youtube.ts`), so no API key is needed.
- **Hero data** comes from the OpenDota API (`/api/constants/heroes`). It's cached in the `heroes` table and uses the official Steam CDN images.
- **Auth**: `src/middleware.ts` protects `/admin/*` and `/api/admin/*` with an HS256-signed JWT cookie.
