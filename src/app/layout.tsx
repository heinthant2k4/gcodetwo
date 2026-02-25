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
  title: "WebGCode 2 | Professional G-code Editor & 3D Simulator",
  description: "A high-performance, deterministic, and local-only G-code editor, validator, and 3D simulation tool for CNC machinists and engineers. Fast, secure, and reliable.",
  keywords: ["G-code", "CNC", "Simulator", "Editor", "Machining", "Toolpath", "Engineering", "WebGCode", "Manufacturing"],
  authors: [{ name: "Antigravity Team" }],
  openGraph: {
    title: "WebGCode 2 | G-code Editor & Simulator",
    description: "The ultimate tool for CNC G-code validation and simulation.",
    url: "https://webgcode.app", // Placeholder for canonical
    siteName: "WebGCode 2",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WebGCode 2 | G-code Editor & Simulator",
    description: "Local-only G-code validation and 3D toolpath simulation.",
  },
  robots: {
    index: true,
    follow: true,
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
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-ui antialiased`}>
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
