import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f5efe4" }}>
        <svg width="180" height="180" viewBox="0 0 32 32">
          <rect x="6" y="8" width="5" height="17" rx="1" fill="#a84a2a" />
          <rect x="12" y="6" width="5" height="19" rx="1" fill="#2f4858" />
          <rect x="18.5" y="9" width="5" height="16" rx="1" fill="#e2a83d" transform="rotate(10 21 17)" />
          <rect x="5" y="25" width="22" height="2" rx="1" fill="#a8663c" />
        </svg>
      </div>
    ),
    size,
  );
}
