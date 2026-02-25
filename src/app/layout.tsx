import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://webgcode.vercel.app"),
  title: "WebGCode 2 | G-code Viewer & CNC Toolpath Simulator",
  description: "A professional, deterministic G-code viewer and CNC toolpath simulator. Validates code against machine constraints strictly in the browser.",
  keywords: ["G-code Viewer", "CNC Simulator", "Toolpath Visualization", "CNC Machining", "G-code Editor"],
  authors: [{ name: "Heinthant Zaw" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "WebGCode 2 | G-code Viewer & Simulator",
    description: "Deterministic G-code validation and toolpath visualization for CNC machining.",
    url: "/",
    siteName: "WebGCode 2",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "WebGCode 2 | G-code Viewer & Simulator",
    description: "Local-only G-code validation and toolpath visualization.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "4shlAVajkqemWjz5hbUuBnLW-AisKV8kKKcyhEdxr2Y",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-ui antialiased h-screen overflow-hidden`}>
        <div className="h-full flex flex-col">
          <TooltipProvider delayDuration={300}>
            {children}
          </TooltipProvider>
        </div>
      </body>
    </html>
  );
}
