"use client";

// App Shell — Single-screen panel-based layout
// ┌───────────────┬────────────────────────┐
// │ G-code Editor │ Toolpath Visualization │
// │ (Monaco)      │ (Three.js)             │
// ├───────────────┴───────────┬────────────┤
// │ Diagnostics Panel         │ Machine    │
// │                           │ Profile    │
// └───────────────────────────┴────────────┘

import { useCallback, useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAppStore, selectUILayout, selectSimulationData, selectIsValid } from "@/store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import DiagnosticsPanel from "@/components/panels/diagnostics-panel";
import MachineProfilePanel from "@/components/panels/machine-profile-panel";
import ViewerControls from "@/components/viewer/viewer-controls";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Dynamic imports for client-only components
const GCodeEditor = dynamic(
    () => import("@/components/editor/gcode-editor"),
    { ssr: false, loading: () => <PanelLoader label="Editor" /> }
);

const ToolpathViewer = dynamic(
    () => import("@/components/viewer/toolpath-viewer"),
    { ssr: false, loading: () => <PanelLoader label="Viewer" /> }
);

function PanelLoader({ label }: { label: string }) {
    return (
        <div className="flex items-center justify-center h-full bg-bg-900 text-text-300 text-xs font-code">
            Loading {label}…
        </div>
    );
}

// Collapsible panel header
function PanelHeader({
    label,
    collapsed,
    onToggle,
    extra,
}: {
    label: string;
    collapsed: boolean;
    onToggle: () => void;
    extra?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between px-3 py-1 border-b border-border-500 bg-bg-800 select-none">
            <button
                onClick={onToggle}
                className="flex items-center gap-1.5 text-xs font-ui text-text-200 uppercase tracking-wider hover:text-text-100"
            >
                <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="currentColor"
                    className={`transition-transform ${collapsed ? "-rotate-90" : ""}`}
                >
                    <polygon points="2,2 8,5 2,8" />
                </svg>
                {label}
            </button>
            {extra && <div className="flex items-center gap-1">{extra}</div>}
        </div>
    );
}

// Status bar
function StatusBar() {
    const simData = useAppStore(selectSimulationData);
    const isValid = useAppStore(selectIsValid);
    const editorText = useAppStore((s) => s.editorText);
    const cursorLine = useAppStore((s) => s.cursorLine);
    const machineProfile = useAppStore((s) => s.machineProfile);

    const lineCount = editorText.split("\n").length;
    const segmentCount = simData.segments.length;
    const totalDist = simData.totalDistance.toFixed(1);
    const totalTime = simData.totalTime.toFixed(1);

    return (
        <div className="flex items-center justify-between px-3 py-1 border-t border-border-500 bg-bg-800 text-xs font-code text-text-300">
            <div className="flex items-center gap-3">
                <span className={isValid ? "text-semantic-safe" : "text-semantic-error"}>
                    {isValid ? "● Valid" : "● Invalid"}
                </span>
                <span>Ln {cursorLine}/{lineCount}</span>
                <span>{segmentCount} segments</span>
            </div>
            <div className="flex items-center gap-3">
                <span>Distance: {totalDist} {machineProfile.units}</span>
                <span>Time: {totalTime}s</span>
                <span>{machineProfile.units.toUpperCase()}</span>
            </div>
        </div>
    );
}

// Resizable divider
function ResizeDivider({
    direction,
    onResize,
}: {
    direction: "horizontal" | "vertical";
    onResize: (delta: number) => void;
}) {
    const isResizing = useRef(false);
    const lastPos = useRef(0);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            isResizing.current = true;
            lastPos.current = direction === "horizontal" ? e.clientX : e.clientY;

            const handleMouseMove = (ev: MouseEvent) => {
                if (!isResizing.current) return;
                const currentPos = direction === "horizontal" ? ev.clientX : ev.clientY;
                const delta = currentPos - lastPos.current;
                lastPos.current = currentPos;
                onResize(delta);
            };

            const handleMouseUp = () => {
                isResizing.current = false;
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
            document.body.style.userSelect = "none";
        },
        [direction, onResize]
    );

    return (
        <div
            onMouseDown={handleMouseDown}
            className={`flex-shrink-0 bg-border-500 hover:bg-semantic-motion ${direction === "horizontal"
                    ? "w-px cursor-col-resize hover:w-0.5"
                    : "h-px cursor-row-resize hover:h-0.5"
                }`}
            style={{ transition: "background-color 150ms" }}
        />
    );
}

// File controls
function FileControls() {
    const setEditorText = useAppStore((s) => s.setEditorText);
    const editorText = useAppStore((s) => s.editorText);

    const handleOpen = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".gcode,.nc,.ngc,.tap,.txt";
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const content = ev.target?.result as string;
                    if (content) setEditorText(content);
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }, [setEditorText]);

    const handleSave = useCallback(() => {
        const blob = new Blob([editorText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "program.gcode";
        a.click();
        URL.revokeObjectURL(url);
    }, [editorText]);

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleOpen}
                        className="h-6 px-2 text-xs text-text-300 hover:text-text-100 hover:bg-bg-700"
                    >
                        Open
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Open File (Ctrl+O)</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSave}
                        className="h-6 px-2 text-xs text-text-300 hover:text-text-100 hover:bg-bg-700"
                    >
                        Save
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Export File (Ctrl+S)</TooltipContent>
            </Tooltip>
        </>
    );
}

export default function AppShell() {
    useKeyboardShortcuts();

    const uiLayout = useAppStore(selectUILayout);
    const togglePanel = useAppStore((s) => s.togglePanel);

    // Resizable proportions
    const [hSplit, setHSplit] = useState(0.45); // horizontal split (editor | viewer)
    const [vSplit, setVSplit] = useState(0.65); // vertical split (top row | bottom row)
    const [bottomHSplit, setBottomHSplit] = useState(0.65); // bottom horizontal (diagnostics | machine)

    const containerRef = useRef<HTMLDivElement>(null);

    const handleHResize = useCallback(
        (delta: number) => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            setHSplit((prev) => Math.max(0.2, Math.min(0.8, prev + delta / width)));
        },
        []
    );

    const handleVResize = useCallback(
        (delta: number) => {
            if (!containerRef.current) return;
            const height = containerRef.current.clientHeight;
            setVSplit((prev) => Math.max(0.3, Math.min(0.85, prev + delta / height)));
        },
        []
    );

    const handleBottomHResize = useCallback(
        (delta: number) => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            setBottomHSplit((prev) => Math.max(0.3, Math.min(0.8, prev + delta / width)));
        },
        []
    );

    return (
        <div className="flex flex-col h-screen w-screen bg-bg-900 overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-3 py-1 border-b border-border-500 bg-bg-800">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-ui font-semibold text-text-100 tracking-tight">
                        WebGCode 2
                    </span>
                    <div className="w-px h-4 bg-border-500" />
                    <FileControls />
                </div>
                <div className="flex items-center gap-1 text-xs text-text-300 font-code">
                    <span>Local</span>
                    <span className="text-semantic-safe">●</span>
                </div>
            </div>

            {/* Main content area */}
            <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden">
                {/* Top row: Editor + Viewer */}
                <div className="flex overflow-hidden" style={{ height: `${vSplit * 100}%` }}>
                    {/* Editor panel */}
                    <div
                        className="overflow-hidden border-r border-border-500 flex flex-col"
                        style={{ width: uiLayout.editorCollapsed ? "32px" : `${hSplit * 100}%` }}
                    >
                        {uiLayout.editorCollapsed ? (
                            <button
                                onClick={() => togglePanel("editorCollapsed")}
                                className="h-full flex items-center justify-center bg-bg-800 text-text-300 hover:text-text-100"
                                style={{ writingMode: "vertical-rl" }}
                            >
                                <span className="text-xs font-ui uppercase tracking-wider py-3">Editor</span>
                            </button>
                        ) : (
                            <>
                                <PanelHeader
                                    label="Editor"
                                    collapsed={uiLayout.editorCollapsed}
                                    onToggle={() => togglePanel("editorCollapsed")}
                                    extra={<FileControls />}
                                />
                                <div className="flex-1 overflow-hidden">
                                    <GCodeEditor />
                                </div>
                            </>
                        )}
                    </div>

                    {!uiLayout.editorCollapsed && !uiLayout.viewerCollapsed && (
                        <ResizeDivider direction="horizontal" onResize={handleHResize} />
                    )}

                    {/* Viewer panel */}
                    <div
                        className="overflow-hidden flex flex-col"
                        style={{
                            width: uiLayout.viewerCollapsed
                                ? "32px"
                                : uiLayout.editorCollapsed
                                    ? "100%"
                                    : `${(1 - hSplit) * 100}%`,
                        }}
                    >
                        {uiLayout.viewerCollapsed ? (
                            <button
                                onClick={() => togglePanel("viewerCollapsed")}
                                className="h-full flex items-center justify-center bg-bg-800 text-text-300 hover:text-text-100"
                                style={{ writingMode: "vertical-rl" }}
                            >
                                <span className="text-xs font-ui uppercase tracking-wider py-3">Viewer</span>
                            </button>
                        ) : (
                            <>
                                <PanelHeader
                                    label="Toolpath"
                                    collapsed={uiLayout.viewerCollapsed}
                                    onToggle={() => togglePanel("viewerCollapsed")}
                                />
                                <div className="flex-1 overflow-hidden">
                                    <ToolpathViewer />
                                </div>
                                <ViewerControls />
                            </>
                        )}
                    </div>
                </div>

                <ResizeDivider direction="vertical" onResize={handleVResize} />

                {/* Bottom row: Diagnostics + Machine Profile */}
                <div className="flex overflow-hidden" style={{ height: `${(1 - vSplit) * 100}%` }}>
                    {/* Diagnostics panel */}
                    <div
                        className="overflow-hidden border-r border-border-500"
                        style={{
                            width: uiLayout.diagnosticsCollapsed
                                ? "32px"
                                : `${bottomHSplit * 100}%`,
                        }}
                    >
                        {uiLayout.diagnosticsCollapsed ? (
                            <button
                                onClick={() => togglePanel("diagnosticsCollapsed")}
                                className="h-full flex items-center justify-center bg-bg-800 text-text-300 hover:text-text-100"
                                style={{ writingMode: "vertical-rl" }}
                            >
                                <span className="text-xs font-ui uppercase tracking-wider py-3">Diagnostics</span>
                            </button>
                        ) : (
                            <DiagnosticsPanel />
                        )}
                    </div>

                    {!uiLayout.diagnosticsCollapsed && !uiLayout.machineProfileCollapsed && (
                        <ResizeDivider direction="horizontal" onResize={handleBottomHResize} />
                    )}

                    {/* Machine Profile panel */}
                    <div
                        className="overflow-hidden"
                        style={{
                            width: uiLayout.machineProfileCollapsed
                                ? "32px"
                                : uiLayout.diagnosticsCollapsed
                                    ? "100%"
                                    : `${(1 - bottomHSplit) * 100}%`,
                        }}
                    >
                        {uiLayout.machineProfileCollapsed ? (
                            <button
                                onClick={() => togglePanel("machineProfileCollapsed")}
                                className="h-full flex items-center justify-center bg-bg-800 text-text-300 hover:text-text-100"
                                style={{ writingMode: "vertical-rl" }}
                            >
                                <span className="text-xs font-ui uppercase tracking-wider py-3">Machine</span>
                            </button>
                        ) : (
                            <MachineProfilePanel />
                        )}
                    </div>
                </div>
            </div>

            {/* Status bar */}
            <StatusBar />
        </div>
    );
}
