import { MetadataRoute } from "next";

import { env } from "@/env.mjs";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: env.APP_URL || "http://localhost:3000",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
  ];
}
