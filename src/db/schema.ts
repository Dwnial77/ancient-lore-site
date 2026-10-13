import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const attributeEnum = pgEnum("hero_attribute", ["str", "agi", "int", "all"]);
export const roleEnum = pgEnum("appearance_role", ["main", "supporting", "cameo"]);

export type Attribute = (typeof attributeEnum.enumValues)[number];
export type Role = (typeof roleEnum.enumValues)[number];

export const heroes = pgTable("heroes", {
  // OpenDota hero id
  id: integer("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  attribute: attributeEnum("attribute").notNull(),
  imageUrl: text("image_url").notNull(),
  iconUrl: text("icon_url").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const videos = pgTable(
  "videos",
  {
    youtubeId: text("youtube_id").primaryKey(),
    title: text("title").notNull(),
    thumbnailUrl: text("thumbnail_url").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("videos_published_idx").on(t.publishedAt)],
);

export const appearances = pgTable(
  "appearances",
  {
    videoId: text("video_id")
      .notNull()
      .references(() => videos.youtubeId, { onDelete: "cascade" }),
    heroId: integer("hero_id")
      .notNull()
      .references(() => heroes.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("main"),
    note: text("note"),
    needsReview: boolean("needs_review").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.videoId, t.heroId] }), index("appearances_hero_idx").on(t.heroId)],
);

export const votes = pgTable(
  "votes",
  {
    id: serial("id").primaryKey(),
    heroId: integer("hero_id")
      .notNull()
      .references(() => heroes.id, { onDelete: "cascade" }),
    // HMAC-SHA256 of the visitor IP, salted with SESSION_SECRET. Raw IPs are never stored.
    voterHash: text("voter_hash").notNull(),
    voteDay: date("vote_day").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("votes_one_per_day_idx").on(t.heroId, t.voterHash, t.voteDay),
    index("votes_hero_idx").on(t.heroId),
  ],
);

export type Hero = typeof heroes.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type Appearance = typeof appearances.$inferSelect;
