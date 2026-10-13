CREATE TYPE "public"."hero_attribute" AS ENUM('str', 'agi', 'int', 'all');--> statement-breakpoint
CREATE TYPE "public"."appearance_role" AS ENUM('main', 'supporting', 'cameo');--> statement-breakpoint
CREATE TABLE "appearances" (
	"video_id" text NOT NULL,
	"hero_id" integer NOT NULL,
	"role" "appearance_role" DEFAULT 'main' NOT NULL,
	"note" text,
	"needs_review" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appearances_video_id_hero_id_pk" PRIMARY KEY("video_id","hero_id")
);
--> statement-breakpoint
CREATE TABLE "heroes" (
	"id" integer PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"attribute" "hero_attribute" NOT NULL,
	"image_url" text NOT NULL,
	"icon_url" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "heroes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"youtube_id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"thumbnail_url" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"duration_seconds" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"hero_id" integer NOT NULL,
	"voter_hash" text NOT NULL,
	"vote_day" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appearances" ADD CONSTRAINT "appearances_video_id_videos_youtube_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("youtube_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appearances" ADD CONSTRAINT "appearances_hero_id_heroes_id_fk" FOREIGN KEY ("hero_id") REFERENCES "public"."heroes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_hero_id_heroes_id_fk" FOREIGN KEY ("hero_id") REFERENCES "public"."heroes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appearances_hero_idx" ON "appearances" USING btree ("hero_id");--> statement-breakpoint
CREATE INDEX "videos_published_idx" ON "videos" USING btree ("published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_one_per_day_idx" ON "votes" USING btree ("hero_id","voter_hash","vote_day");--> statement-breakpoint
CREATE INDEX "votes_hero_idx" ON "votes" USING btree ("hero_id");