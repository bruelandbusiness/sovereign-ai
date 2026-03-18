import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 180,
          height: 180,
          background: "#0a0a0f",
          borderRadius: 36,
        }}
      >
        <svg
          width="120"
          height="120"
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
      </div>
    ),
    { ...size }
  );
}
