CREATE TYPE "public"."topic_kind" AS ENUM('series', 'character');--> statement-breakpoint
CREATE TABLE "topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" "topic_kind" DEFAULT 'series' NOT NULL,
	"description" text,
	"image_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "video_topics" (
	"video_id" text NOT NULL,
	"topic_id" integer NOT NULL,
	"needs_review" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "video_topics_video_id_topic_id_pk" PRIMARY KEY("video_id","topic_id")
);
--> statement-breakpoint
ALTER TABLE "video_topics" ADD CONSTRAINT "video_topics_video_id_videos_youtube_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("youtube_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_topics" ADD CONSTRAINT "video_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_topics_topic_idx" ON "video_topics" USING btree ("topic_id");