import AppShell from "@/components/layout/app-shell";

export default function Home() {
  return (
    <>
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
