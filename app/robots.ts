import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/faq", "/how-it-works", "/privacy", "/terms", "/sign-in", "/sign-up"],
        disallow: [
          "/dashboard",
          "/purchases",
          "/holdings",
          "/cashback",
          "/analytics",
          "/timeline",
          "/settings",
          "/feedback",
          "/admin",
          "/import",
          "/export",
          "/reddit-post",
          "/api/",
          "/invite",
          "/set-password",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
