import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "AI Services Marketplace — Sovereign AI";
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
                <stop offset="0%" stopColor="#4c85ff" />
                <stop offset="100%" stopColor="#22d3a1" />
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
              fontSize: 22,
              fontWeight: 700,
              color: "#ececef",
              letterSpacing: "0.05em",
            }}
          >
            SOVEREIGN AI
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.1,
              background: "linear-gradient(135deg, #4c85ff, #22d3a1)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            16 AI Marketing Services
          </div>
          <div
            style={{
              fontSize: 38,
              fontWeight: 700,
              lineHeight: 1.1,
              color: "#ececef",
            }}
          >
            Starting at $497/mo
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#858590",
            }}
          >
            Lead generation, reputation management, content creation, AI phone
            agents & more. Each runs 24/7 to grow your business.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            height: 4,
            background: "linear-gradient(135deg, #4c85ff, #22d3a1)",
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
