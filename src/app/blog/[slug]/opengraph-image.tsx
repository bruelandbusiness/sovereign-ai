import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/db";

export const alt = "Sovereign AI Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });

  const title = post?.title ?? "Blog Post";
  const author = post?.author ?? "Sovereign AI";
  const category = post?.category ?? "Marketing";

  const fontData = await readFile(
    join(process.cwd(), "public/fonts/PlusJakartaSans-Bold.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: "#0a0a0f",
          padding: 80,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient orbs */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(76,133,255,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: -80,
            left: -40,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
          }}
        />

        {/* Top: Logo + category badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="g"
                  x1="0"
                  y1="0"
                  x2="32"
                  y2="32"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#4c85ff" />
                </linearGradient>
              </defs>
              <path
                d="M16 2 L4 10 L4 20 L16 30 L16 18 L10 14 L16 10 Z"
                fill="url(#g)"
                opacity="0.7"
              />
              <path
                d="M16 2 L28 10 L28 20 L16 30 L16 18 L22 14 L16 10 Z"
                fill="url(#g)"
              />
            </svg>
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#ececef",
                letterSpacing: "0.05em",
              }}
            >
              SOVEREIGN AI
            </span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 16,
              fontWeight: 700,
              color: "#8b5cf6",
              background: "rgba(139,92,246,0.12)",
              padding: "8px 20px",
              borderRadius: 24,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}
          >
            {category}
          </div>
        </div>

        {/* Center: Post title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: title.length > 60 ? 40 : 48,
              fontWeight: 700,
              lineHeight: 1.15,
              color: "#ececef",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 20,
              color: "#858590",
            }}
          >
            <span>By {author}</span>
            <span style={{ color: "#4c85ff" }}>|</span>
            <span>sovereignai.co/blog</span>
          </div>
        </div>

        {/* Bottom: Gradient bar */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: 4,
            background: "linear-gradient(90deg, #8b5cf6, #4c85ff, #22d3a1)",
            borderRadius: 2,
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Plus Jakarta Sans",
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
