import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.json({
    name: "GramFolio — Your Gram Ledger",
    short_name: "GramFolio",
    description: "Track your physical 24K gold portfolio and optimize credit card rewards.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf7",
    theme_color: "#c9a227",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  })
}
