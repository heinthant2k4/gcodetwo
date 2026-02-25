"use client";

// Viewer Controls — Play/Pause/Stop/Step/Scrub + 2D/3D toggle
// Deterministic controls with clear state feedback

import { useAppStore } from "@/store";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function ViewerControls() {
    const simulationPlaying = useAppStore((s) => s.simulation.playing);
    const currentStepIndex = useAppStore((s) => s.simulation.currentStepIndex);
    const speed = useAppStore((s) => s.simulation.speed);
    const exportProgress = useAppStore((s) => s.exportProgress);
    const maxStep = useAppStore((s) => s.simulationData.segments.length);
    const segments = useAppStore((s) => s.simulationData.segments);
    const viewMode = useAppStore((s) => s.uiLayout.viewMode);
    const autoScrollToActiveLine = useAppStore((s) => s.uiLayout.autoScrollToActiveLine);
    const showGrid = useAppStore((s) => s.uiLayout.showGrid);
    const showRapids = useAppStore((s) => s.uiLayout.showRapids);
    const hideFuturePath = useAppStore((s) => s.uiLayout.hideFuturePath);
    const units = useAppStore((s) => s.machineProfile.units);
    const play = useAppStore((s) => s.play);
    const pause = useAppStore((s) => s.pause);
    const stop = useAppStore((s) => s.stop);
    const stepForward = useAppStore((s) => s.stepForward);
    const stepBackward = useAppStore((s) => s.stepBackward);
    const jumpToStep = useAppStore((s) => s.jumpToStep);
    const setViewMode = useAppStore((s) => s.setViewMode);
    const setSpeed = useAppStore((s) => s.setSpeed);
    const setViewerOption = useAppStore((s) => s.setViewerOption);
    const requestCameraFit = useAppStore((s) => s.requestCameraFit);

    const hasData = maxStep > 0;
    const dro = useMemo(() => {
        if (segments.length === 0) {
            return { x: 0, y: 0, z: 0 };
        }

        const idx = Math.min(currentStepIndex, segments.length - 1);
        const seg = segments[idx];
        const pos = currentStepIndex >= segments.length ? seg.endPoint : seg.startPoint;
        return { x: pos.x, y: pos.y, z: pos.z };
    }, [currentStepIndex, segments]);

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-border-500 bg-bg-800 overflow-x-auto" id="playback-controls">
            {/* Transport controls */}
            <div className="flex items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={stop}
                            disabled={!hasData}
                            className="h-7 w-7 p-0 text-text-200 hover:text-text-100 hover:bg-bg-700"
                        >
                            <StopIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">Stop</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={stepBackward}
                            disabled={!hasData || currentStepIndex <= 0}
                            className="h-7 w-7 p-0 text-text-200 hover:text-text-100 hover:bg-bg-700"
                        >
                            <StepBackIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">Step Back (Ctrl+←)</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={simulationPlaying ? pause : play}
                            disabled={!hasData}
                            id="tutorial-play-button"
                            className="h-7 w-7 p-0 text-text-100 hover:bg-bg-700"
                        >
                            {simulationPlaying ? <PauseIcon /> : <PlayIcon />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                        {simulationPlaying ? "Pause" : "Play"} (Shift+Space)
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={stepForward}
                            disabled={!hasData || currentStepIndex >= maxStep}
                            className="h-7 w-7 p-0 text-text-200 hover:text-text-100 hover:bg-bg-700"
                        >
                            <StepForwardIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">Step Forward (Ctrl+→)</TooltipContent>
                </Tooltip>
            </div>

            {/* Scrub slider */}
            <div className="flex-1 mx-2">
                <Slider
                    value={[currentStepIndex]}
                    min={0}
                    max={Math.max(maxStep, 1)}
                    step={1}
                    onValueChange={([v]) => jumpToStep(v)}
                    disabled={!hasData}
                    className="w-full"
                />
            </div>

            {/* Step counter */}
            <span className="text-xs font-code text-text-300 min-w-[60px] text-right tabular-nums">
                {currentStepIndex}/{maxStep}
            </span>

            {/* Separator */}
            <div className="w-px h-4 bg-border-500 mx-1" />

            {/* Speed control */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const speeds = [0.25, 0.5, 1, 2, 4];
                            const idx = speeds.indexOf(speed);
                            const next = speeds[(idx + 1) % speeds.length];
                            setSpeed(next);
                        }}
                        className="h-7 px-1.5 text-xs font-code text-text-300 hover:text-text-100 hover:bg-bg-700 tabular-nums"
                    >
                        {speed}×
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Playback Speed</TooltipContent>
            </Tooltip>

            <div className="w-px h-4 bg-border-500 mx-1" />

            {/* Backplot toggles */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Toggle
                        pressed={showGrid}
                        onPressedChange={(pressed) => setViewerOption("showGrid", pressed)}
                        size="sm"
                        className="h-7 px-2 text-xs font-code text-text-300 data-[state=on]:text-text-100 data-[state=on]:bg-bg-700"
                    >
                        Grid
                    </Toggle>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Show/Hide Grid</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Toggle
                        pressed={showRapids}
                        onPressedChange={(pressed) => setViewerOption("showRapids", pressed)}
                        size="sm"
                        className="h-7 px-2 text-xs font-code text-text-300 data-[state=on]:text-text-100 data-[state=on]:bg-bg-700"
                    >
                        Rapids
                    </Toggle>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Show/Hide Rapid Moves (G0)</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Toggle
                        pressed={!hideFuturePath}
                        onPressedChange={(pressed) => setViewerOption("hideFuturePath", !pressed)}
                        size="sm"
                        className="h-7 px-2 text-xs font-code text-text-300 data-[state=on]:text-text-100 data-[state=on]:bg-bg-700"
                    >
                        Future
                    </Toggle>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Show/Hide Future Toolpath</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={requestCameraFit}
                        disabled={!hasData}
                        className="h-7 px-2 text-xs font-code text-text-300 hover:text-text-100 hover:bg-bg-700"
                    >
                        Fit
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Fit Toolpath to View</TooltipContent>
            </Tooltip>

            {/* 2D/3D toggle */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Toggle
                        pressed={viewMode === "2d"}
                        onPressedChange={(pressed) => setViewMode(pressed ? "2d" : "3d")}
                        size="sm"
                        className="h-7 px-2 text-xs font-code text-text-300 data-[state=on]:text-text-100 data-[state=on]:bg-bg-700"
                    >
                        2D
                    </Toggle>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Toggle 2D/3D (Ctrl+Shift+V)</TooltipContent>
            </Tooltip>

            {/* Auto-scroll toggle */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Toggle
                        pressed={autoScrollToActiveLine}
                        onPressedChange={(pressed) => {
                            useAppStore.getState().setAutoScroll(pressed);
                        }}
                        size="sm"
                        className="h-7 px-2 text-xs font-code text-text-300 data-[state=on]:text-text-100 data-[state=on]:bg-bg-700"
                    >
                        Scroll
                    </Toggle>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Auto-scroll Editor</TooltipContent>
            </Tooltip>

            <div className="w-px h-4 bg-border-500 mx-1" />

            {/* DRO */}
            <div className="flex items-center gap-2 rounded-sm border border-border-500 bg-bg-900 px-2 py-1">
                <span className="text-[11px] font-ui uppercase tracking-wide text-text-300">DRO</span>
                <span className="text-xs font-code tabular-nums text-text-100">X {dro.x.toFixed(3)}</span>
                <span className="text-xs font-code tabular-nums text-text-100">Y {dro.y.toFixed(3)}</span>
                <span className="text-xs font-code tabular-nums text-text-100">Z {dro.z.toFixed(3)}</span>
                <span className="text-[11px] font-code uppercase tracking-wide text-text-300">{units}</span>
            </div>

            {/* Export button */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const canvas = document.querySelector("#viewer-panel canvas");
                            if (!(canvas instanceof HTMLCanvasElement)) {
                                alert("Export failed: viewer canvas not found.");
                                return;
                            }

                            void import("@/lib/export/gif-exporter")
                                .then((mod) => mod.exportSimulationAsGif(canvas))
                                .catch((error) => {
                                    const message =
                                        error instanceof Error && error.message
                                            ? error.message
                                            : "Unable to load exporter module.";
                                    alert(`Export failed: ${message}`);
                                });
                        }}
                        disabled={!hasData || exportProgress.exporting}
                        className="h-7 px-2 text-xs font-ui text-text-300 hover:text-text-100 hover:bg-bg-700"
                    >
                        Export
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Export Simulation (GIF)</TooltipContent>
            </Tooltip>
        </div>
    );
}

// Minimal SVG icons — no decorative elements

function PlayIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <polygon points="3,1 12,7 3,13" />
        </svg>
    );
}

function PauseIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="1" width="3.5" height="12" />
            <rect x="8.5" y="1" width="3.5" height="12" />
        </svg>
    );
}

function StopIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="2" width="10" height="10" />
        </svg>
    );
}

function StepBackIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="1" y="2" width="2" height="10" />
            <polygon points="12,2 5,7 12,12" />
        </svg>
    );
}

function StepForwardIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <polygon points="2,2 9,7 2,12" />
            <rect x="11" y="2" width="2" height="10" />
        </svg>
    );
}
