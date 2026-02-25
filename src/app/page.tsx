"use client";

import dynamic from "next/dynamic";

const AppShell = dynamic(
  () => import("@/components/layout/app-shell"),
  { ssr: false }
);

export default function Home() {
  return <AppShell />;
}
