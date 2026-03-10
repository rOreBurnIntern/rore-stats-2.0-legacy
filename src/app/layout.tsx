import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "rORE Stats Dashboard",
  description: "Next.js 14 dashboard initialized with Tailwind CSS and DaisyUI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="coffee">
      <head>
        <link rel="stylesheet" href="/vendor/daisyui/themes.css" />
        <link rel="stylesheet" href="/vendor/daisyui/styled.css" />
      </head>
      <body className="bg-base-200 text-base-content antialiased">{children}</body>
    </html>
  );
}
