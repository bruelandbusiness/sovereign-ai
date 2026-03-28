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
        {/* Shield/diamond mark — larger version with more detail */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 32 32"
          fill="none"
        >
          {/* Left facet — blue tint, lower opacity */}
          <path
            d="M16 2 L4 10 L4 22 L16 30 L16 19 L10 15 L16 11 Z"
            fill="#4c85ff"
            opacity="0.55"
          />
          {/* Right facet — teal, full opacity */}
          <path
            d="M16 2 L28 10 L28 22 L16 30 L16 19 L22 15 L16 11 Z"
            fill="#22d3a1"
            opacity="0.9"
          />
          {/* Center seam highlight */}
          <path
            d="M16 2 L16 11 L10 15 L16 19 L16 30"
            stroke="#4c85ff"
            strokeWidth="0.5"
            opacity="0.3"
          />
          {/* Outer glow edge — top */}
          <path
            d="M16 2 L4 10"
            stroke="#6a9fff"
            strokeWidth="0.4"
            opacity="0.4"
          />
          <path
            d="M16 2 L28 10"
            stroke="#3be8b0"
            strokeWidth="0.4"
            opacity="0.4"
          />
          {/* Node dots at vertices for "network" feel */}
          <circle cx="16" cy="2" r="1.2" fill="#6a9fff" opacity="0.7" />
          <circle cx="4" cy="10" r="0.9" fill="#4c85ff" opacity="0.5" />
          <circle cx="28" cy="10" r="0.9" fill="#22d3a1" opacity="0.6" />
          <circle cx="16" cy="30" r="1.2" fill="#22d3a1" opacity="0.7" />
          <circle cx="16" cy="15" r="1.4" fill="#ffffff" opacity="0.25" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
