"use client";

import dynamic from "next/dynamic";

const AppShell = dynamic(
  () => import("@/components/layout/app-shell"),
  { ssr: false }
);

export default function Home() {
  return (
    <>
      {/* SSR-visible semantic content for indexability */}
      <meta name="google-site-verification" content="4shlAVajkqemWjz5hbUuBnLW-AisKV8kKKcyhEdxr2Y" />
      <div className="sr-only">
        <h1>WebGCode 2 | G-code Viewer & CNC Toolpath Simulator</h1>
        <p>
          A professional, browser-based G-code viewer and editor for CNC toolpath simulation.
          Validated against machine profiles for deterministic toolpath visualization.
        </p>
      </div>
      <AppShell />
    </>
  );
}
