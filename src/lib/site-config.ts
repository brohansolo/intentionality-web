import { env } from "@/env.mjs";

export const siteConfig = {
  title: "Intentionality",
  description:
    "A simple task and project management app built with Next.js, TypeScript, and Tailwind CSS.",
  keywords: [
    "Task Management",
    "Project Management",
    "Productivity",
    "Next.js",
  ],
  url: env.APP_URL || "http://localhost:3000",
  googleSiteVerificationId: env.GOOGLE_SITE_VERIFICATION_ID || "",
};
