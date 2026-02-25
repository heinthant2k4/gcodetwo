"use client";

// Export Overlay — Visible during GIF generation
// Blocks interaction and shows progress

import { useAppStore } from "@/store";

export default function ExportOverlay() {
    const exportProgress = useAppStore((s) => s.exportProgress);

    if (!exportProgress.exporting) return null;

    return (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-bg-900/80 backdrop-blur-sm">
            <div className="w-64 space-y-4 text-center">
                <h3 className="text-sm font-ui font-bold text-text-100 uppercase tracking-widest">
                    Generating Export
                </h3>
                <div className="h-1.5 w-full bg-bg-700 rounded-full overflow-hidden border border-border-500">
                    <div
                        className="h-full bg-semantic-motion transition-all duration-300 ease-out"
                        style={{ width: `${exportProgress.progress}%` }}
                    />
                </div>
                <p className="text-xs font-code text-text-300 tabular-nums">
                    {exportProgress.progress}% Processing...
                </p>
                <p className="text-[10px] text-text-300 italic">
                    Capturing deterministic simulation frames.
                </p>
            </div>
        </div>
    );
}
