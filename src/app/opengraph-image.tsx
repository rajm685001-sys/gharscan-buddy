import { ImageResponse } from "next/og";

export const alt =
  "GharScan Buddy shared household inventory, grocery planning, and meal planning";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#f7faf8",
          color: "#17211c",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 800,
            color: "#047857",
            letterSpacing: "0.08em",
          }}
        >
          GHARSCAN BUDDY
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              maxWidth: 900,
              fontSize: 70,
              lineHeight: 1.05,
              fontWeight: 800,
            }}
          >
            Know what is at home before you shop.
          </div>

          <div
            style={{
              display: "flex",
              maxWidth: 760,
              fontSize: 28,
              lineHeight: 1.35,
              color: "#5d6b63",
            }}
          >
            Shared inventory, grocery planning, and meal decisions for
            households.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#5d6b63",
          }}
        >
          Scan · Track · Plan
        </div>
      </div>
    ),
    {
      width: size.width,
      height: size.height,
    },
  );
}