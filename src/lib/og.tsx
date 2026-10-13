import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

let font: Promise<Buffer> | null = null;
function cinzel() {
  font ??= readFile(join(process.cwd(), "src/assets/cinzel-700.woff"));
  return font;
}

/** Branded 1200×630 share card: artwork on the right, title on the left. */
export async function ogCard({
  eyebrow,
  title,
  subtitle,
  imageUrl,
  dimImage = false,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  dimImage?: boolean;
}) {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#100D08", position: "relative", fontFamily: "Cinzel" }}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            width={760}
            height={630}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: 760,
              height: 630,
              objectFit: "cover",
              opacity: dimImage ? 0.45 : 0.95,
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            background: "linear-gradient(90deg, #100D08 0%, #100D08 38%, rgba(16,13,8,0.75) 62%, rgba(16,13,8,0.15) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 64px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#EDE3D1", fontSize: 30, letterSpacing: 8 }}>
            <div style={{ display: "flex", width: 18, height: 18, background: "#E0A63C", transform: "rotate(45deg)" }} />
            ANCIENT LORE
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
            <div style={{ display: "flex", color: "#E0A63C", fontSize: 26, letterSpacing: 6, textTransform: "uppercase" }}>
              {eyebrow}
            </div>
            <div style={{ display: "flex", color: "#F6D48F", fontSize: title.length > 18 ? 72 : 96, lineHeight: 1.05, marginTop: 12 }}>
              {title}
            </div>
            <div style={{ display: "flex", width: 160, height: 3, background: "#E0A63C", marginTop: 28, marginBottom: 24 }} />
            <div style={{ display: "flex", color: "#EDE3D1", fontSize: 30 }}>{subtitle}</div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: "Cinzel", data: await cinzel(), weight: 700, style: "normal" }] },
  );
}
