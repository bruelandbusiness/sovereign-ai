import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Sovereign AI Pricing — Plans from $497/mo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
            top: -80,
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 60%)",
          }}
        />

        {/* Top: Logo + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg
            width="48"
            height="48"
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
              fontSize: 28,
              fontWeight: 700,
              color: "#ececef",
              letterSpacing: "0.05em",
            }}
          >
            SOVEREIGN AI
          </span>
        </div>

        {/* Center: Pricing headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#8b5cf6",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Pricing
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 72,
                fontWeight: 700,
                lineHeight: 1,
                background: "linear-gradient(135deg, #8b5cf6, #4c85ff)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Plans from $497
            </span>
            <span
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#858590",
              }}
            >
              /mo
            </span>
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#858590",
              marginTop: 4,
            }}
          >
            AI-powered marketing that generates leads, books appointments, and
            grows revenue for home service businesses.
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
