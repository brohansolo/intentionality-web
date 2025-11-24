import { env } from "@/env.mjs";

export const siteConfig = {
  title: "Intentionality",
  description: "Task planning for the very busy, scattered, and inattentive.",
  keywords: [
    "Task Management",
    "Project Management",
    "Productivity",
    "Next.js",
  ],
  url: env.APP_URL || "http://localhost:3000",
  googleSiteVerificationId: env.GOOGLE_SITE_VERIFICATION_ID || "",
};
