import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          background: "#0a0a0f",
          borderRadius: 6,
        }}
      >
        {/* Shield/diamond mark using two triangular halves */}
        <svg
          width="24"
          height="24"
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
          {/* Center highlight for depth */}
          <path
            d="M16 2 L16 11 L10 15 L16 19 L16 30"
            stroke="#4c85ff"
            strokeWidth="1"
            opacity="0.3"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
