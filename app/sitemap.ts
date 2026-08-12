import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const paths = [
    "",
    "/faq",
    "/how-it-works",
    "/strategies/flipkart-gv-cred-gold",
    "/privacy",
    "/terms",
    "/sign-in",
    "/sign-up",
  ]

  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/faq" || path === "/how-it-works" ? 0.8 : 0.5,
  }))
}
