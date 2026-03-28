import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Sovereign AI — AI-Powered Marketing for Home Services";
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
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#0a0a0f",
          padding: 80,
          gap: 32,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient orb */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
          }}
        />

        <svg
          width="64"
          height="64"
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
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#ececef",
            textAlign: "center",
          }}
        >
          SOVEREIGN AI
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#858590",
            textAlign: "center",
          }}
        >
          AI-Powered Marketing for Home Services
        </div>
        <div
          style={{
            display: "flex",
            width: 200,
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
