"use client";

// Viewer Controls — Play/Pause/Stop/Step/Scrub + 2D/3D toggle
// Deterministic controls with clear state feedback

import { useAppStore, selectSimulation, selectSimulationData, selectUILayout } from "@/store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function ViewerControls() {
    const simulation = useAppStore(selectSimulation);
    const exportProgress = useAppStore((s) => s.exportProgress);
    const simulationData = useAppStore(selectSimulationData);
    const uiLayout = useAppStore(selectUILayout);
    const play = useAppStore((s) => s.play);
    const pause = useAppStore((s) => s.pause);
    const stop = useAppStore((s) => s.stop);
    const stepForward = useAppStore((s) => s.stepForward);
    const stepBackward = useAppStore((s) => s.stepBackward);
    const jumpToStep = useAppStore((s) => s.jumpToStep);
    const setViewMode = useAppStore((s) => s.setViewMode);
    const setSpeed = useAppStore((s) => s.setSpeed);

    const maxStep = simulationData.segments.length;
    const hasData = maxStep > 0;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-border-500 bg-bg-800">
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
                            disabled={!hasData || simulation.currentStepIndex <= 0}
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
                            onClick={simulation.playing ? pause : play}
                            disabled={!hasData}
                            className="h-7 w-7 p-0 text-text-100 hover:bg-bg-700"
                        >
                            {simulation.playing ? <PauseIcon /> : <PlayIcon />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                        {simulation.playing ? "Pause" : "Play"} (Shift+Space)
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={stepForward}
                            disabled={!hasData || simulation.currentStepIndex >= maxStep}
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
                    value={[simulation.currentStepIndex]}
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
                {simulation.currentStepIndex}/{maxStep}
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
                            const idx = speeds.indexOf(simulation.speed);
                            const next = speeds[(idx + 1) % speeds.length];
                            setSpeed(next);
                        }}
                        className="h-7 px-1.5 text-xs font-code text-text-300 hover:text-text-100 hover:bg-bg-700 tabular-nums"
                    >
                        {simulation.speed}×
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Playback Speed</TooltipContent>
            </Tooltip>

            {/* 2D/3D toggle */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Toggle
                        pressed={uiLayout.viewMode === "2d"}
                        onPressedChange={(pressed) => setViewMode(pressed ? "2d" : "3d")}
                        size="sm"
                        className="h-7 px-2 text-xs font-code text-text-300 data-[state=on]:text-text-100 data-[state=on]:bg-bg-700"
                    >
                        2D
                    </Toggle>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Toggle 2D/3D (Ctrl+Shift+V)</TooltipContent>
            </Tooltip>

            {/* Export button */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const canvas = document.querySelector("canvas");
                            if (canvas) {
                                void import("@/lib/export/gif-exporter").then((mod) => {
                                    mod.exportSimulationAsGif(canvas);
                                });
                            }
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
