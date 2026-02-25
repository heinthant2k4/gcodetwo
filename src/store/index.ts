// Zustand Store — Single Source of Truth
// All application state domains in one store
// Editor text is the source of truth — everything else derives from it

import { create } from "zustand";
import { MachineProfile } from "@/lib/types/machine";
import { ParseResult } from "@/lib/types/gcode";
import { Diagnostic } from "@/lib/types/diagnostics";
import { SimulationData, ToolpathSegment } from "@/lib/types/simulation";
import { DEFAULT_MACHINE_PROFILE } from "@/lib/defaults/machine-profile";
import { parseGCode } from "@/lib/gcode/parser";
import { validate } from "@/lib/validation/engine";
import { generateToolpath } from "@/lib/simulation/toolpath";
import { LineEnding, SupportedExtension } from "@/lib/io/file-handler";

// UI Layout state
interface UILayout {
    editorCollapsed: boolean;
    viewerCollapsed: boolean;
    diagnosticsCollapsed: boolean;
    machineProfileCollapsed: boolean;
    viewMode: "3d" | "2d";
    cameraFaceId: string;
    cameraDirection: { x: number; y: number; z: number };
    autoScrollToActiveLine: boolean;
    zAxisUp: boolean;
    showGrid: boolean;
    showRapids: boolean;
    hideFuturePath: boolean;
}

// Simulation playback state
interface SimulationPlayback {
    playing: boolean;
    currentStepIndex: number;
    progress: number;
    elapsedTime: number;
    speed: number;
}

interface ExportState {
    exporting: boolean;
    progress: number; // 0 to 100
}

// Complete store state
interface AppState {
    // Editor domain
    editorText: string;
    editorLineCount: number;
    editorFilename: string;
    editorExtension: SupportedExtension;
    editorLineEnding: LineEnding;
    cursorLine: number;
    hoveredLine: number | null;

    // Machine profile domain
    machineProfile: MachineProfile;

    // Derived data (computed on change, cached)
    parsedGcode: ParseResult;
    diagnostics: Diagnostic[];
    simulationData: SimulationData;

    // Simulation playback
    simulation: SimulationPlayback;

    // UI Layout
    uiLayout: UILayout;
    cameraFitRequestId: number;

    // Actions — editor
    setEditorText: (
        text: string,
        metadata?: Partial<{
            filename: string;
            extension: SupportedExtension;
            lineEnding: LineEnding;
        }>
    ) => void;
    setCursorLine: (line: number) => void;
    setHoveredLine: (line: number | null) => void;

    // Actions — machine profile
    setMachineProfile: (profile: MachineProfile) => void;
    updateMachineProfile: (updates: Partial<MachineProfile>) => void;

    // Export domain
    exportProgress: ExportState;

    // Actions — simulation
    play: () => void;
    pause: () => void;
    stop: () => void;
    stepForward: () => void;
    stepBackward: () => void;
    jumpToStep: (step: number) => void;
    tick: (delta: number) => void;
    setSpeed: (speed: number) => void;

    // Actions — export
    startExport: () => void;
    updateExportProgress: (progress: number) => void;
    finishExport: () => void;

    // Actions — UI layout
    togglePanel: (panel: keyof Pick<UILayout, "editorCollapsed" | "viewerCollapsed" | "diagnosticsCollapsed" | "machineProfileCollapsed">) => void;
    setViewMode: (mode: "3d" | "2d") => void;
    setCameraOrientation: (faceId: string, direction: { x: number; y: number; z: number }) => void;
    setAutoScroll: (enabled: boolean) => void;
    setZAxisUp: (enabled: boolean) => void;
    setViewerOption: (option: "showGrid" | "showRapids" | "hideFuturePath", enabled: boolean) => void;
    requestCameraFit: () => void;
}

// Recompute derived state from editor text + machine profile
function computeDerived(text: string, profile: MachineProfile) {
    const parsedGcode = parseGCode(text);

    // Merge parse errors into diagnostics
    const parseErrorDiagnostics: Diagnostic[] = parsedGcode.errors.map((e) => ({
        severity: "error" as const,
        line: e.line,
        column: e.column,
        endColumn: e.column + 10,
        message: e.message,
        ruleId: "parse-error",
    }));

    const validationResult = validate(parsedGcode.instructions, profile);
    const diagnostics = [...parseErrorDiagnostics, ...validationResult.diagnostics].sort(
        (a, b) => a.line - b.line
    );

    const simulationData = validationResult.isValid
        ? generateToolpath(parsedGcode.instructions)
        : { segments: [], steps: [], totalTime: 0, totalDistance: 0, boundingBox: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } } };

    return { parsedGcode, diagnostics, simulationData };
}

const INITIAL_TEXT = `; WebGCode 2 — Sample Program
; 3-axis CNC milling example
G21 ; Set units to millimeters
G90 ; Absolute positioning
G17 ; XY plane selection

; Spindle on
M3 S12000

; Rapid to start position
G0 X10 Y10 Z5

; Plunge
G1 Z-2 F200

; Cut a square
G1 X50 F800
G1 Y50
G1 X10
G1 Y10

; Retract
G0 Z5

; Rapid to second position
G0 X70 Y20

; Plunge
G1 Z-2 F200

; Cut a triangle
G1 X110 F800
G1 X90 Y60
G1 X70 Y20

; Retract and home
G0 Z10
G0 X0 Y0

; Spindle off
M5
M2 ; End program
`;

const initialDerived = computeDerived(INITIAL_TEXT, DEFAULT_MACHINE_PROFILE);
const INITIAL_LINE_COUNT = INITIAL_TEXT.split("\n").length;

export const useAppStore = create<AppState>((set, get) => ({
    // Initial state
    editorText: INITIAL_TEXT,
    editorLineCount: INITIAL_LINE_COUNT,
    editorFilename: "program",
    editorExtension: ".gcode",
    editorLineEnding: "\n",
    cursorLine: 1,
    hoveredLine: null,

    machineProfile: DEFAULT_MACHINE_PROFILE,

    parsedGcode: initialDerived.parsedGcode,
    diagnostics: initialDerived.diagnostics,
    simulationData: initialDerived.simulationData,

    simulation: {
        playing: false,
        currentStepIndex: 0,
        progress: 0,
        elapsedTime: 0,
        speed: 1,
    },

    uiLayout: {
        editorCollapsed: false,
        viewerCollapsed: false,
        diagnosticsCollapsed: false,
        machineProfileCollapsed: false,
        viewMode: "3d",
        cameraFaceId: "tri_1_1_1",
        cameraDirection: { x: 1, y: 1, z: 1 },
        autoScrollToActiveLine: false,
        zAxisUp: true,
        showGrid: true,
        showRapids: true,
        hideFuturePath: false,
    },
    cameraFitRequestId: 0,

    exportProgress: {
        exporting: false,
        progress: 0,
    },

    // Editor actions
    setEditorText: (text, metadata) => {
        const profile = get().machineProfile;
        const derived = computeDerived(text, profile);
        set({
            editorText: text,
            editorLineCount: text === "" ? 1 : text.split("\n").length,
            editorFilename: metadata?.filename ?? get().editorFilename,
            editorExtension: metadata?.extension ?? get().editorExtension,
            editorLineEnding: metadata?.lineEnding ?? get().editorLineEnding,
            ...derived,
            simulation: { ...get().simulation, playing: false, currentStepIndex: 0, progress: 0, elapsedTime: 0 },
        });
    },

    setCursorLine: (line) => set({ cursorLine: line }),
    setHoveredLine: (line) => set({ hoveredLine: line }),

    // Machine profile actions
    setMachineProfile: (profile) => {
        const text = get().editorText;
        const derived = computeDerived(text, profile);
        set({
            machineProfile: profile,
            ...derived,
            simulation: { ...get().simulation, playing: false, currentStepIndex: 0, progress: 0, elapsedTime: 0 },
        });
    },

    updateMachineProfile: (updates) => {
        const current = get().machineProfile;
        const profile = { ...current, ...updates };
        const text = get().editorText;
        const derived = computeDerived(text, profile);
        set({
            machineProfile: profile,
            ...derived,
            simulation: { ...get().simulation, playing: false, currentStepIndex: 0, progress: 0, elapsedTime: 0 },
        });
    },

    // Simulation actions
    play: () =>
        set((s) => ({
            simulation: { ...s.simulation, playing: true },
        })),

    pause: () =>
        set((s) => ({
            simulation: { ...s.simulation, playing: false },
        })),

    stop: () =>
        set((s) => ({
            simulation: { ...s.simulation, playing: false, currentStepIndex: 0, progress: 0, elapsedTime: 0 },
        })),

    stepForward: () =>
        set((s) => {
            const maxStep = s.simulationData.segments.length;
            const nextStep = Math.min(s.simulation.currentStepIndex + 1, maxStep);
            return {
                simulation: {
                    ...s.simulation,
                    playing: false,
                    currentStepIndex: nextStep,
                    progress: nextStep,
                    elapsedTime: s.simulationData.steps[nextStep]?.cumulativeTime ?? 0,
                },
            };
        }),

    stepBackward: () =>
        set((s) => {
            const nextStep = Math.max(s.simulation.currentStepIndex - 1, 0);
            return {
                simulation: {
                    ...s.simulation,
                    playing: false,
                    currentStepIndex: nextStep,
                    progress: nextStep,
                    elapsedTime: s.simulationData.steps[nextStep]?.cumulativeTime ?? 0,
                },
            };
        }),

    jumpToStep: (step: number) =>
        set((s) => {
            const maxStep = s.simulationData.segments.length;
            const clampedStep = Math.max(0, Math.min(step, maxStep));
            return {
                simulation: {
                    ...s.simulation,
                    currentStepIndex: clampedStep,
                    progress: clampedStep,
                    elapsedTime: s.simulationData.steps[clampedStep]?.cumulativeTime ?? 0,
                },
            };
        }),

    tick: (delta: number) =>
        set((s) => {
            if (!s.simulation.playing) return s;
            const maxStep = s.simulationData.segments.length;
            const totalTime = s.simulationData.totalTime;
            if (maxStep === 0 || totalTime <= 0) return s;

            // Deterministic playback clock based on toolpath cumulative time.
            const nextElapsed = s.simulation.elapsedTime + delta * s.simulation.speed;
            if (nextElapsed >= totalTime) {
                return {
                    simulation: {
                        ...s.simulation,
                        playing: false,
                        currentStepIndex: maxStep,
                        progress: maxStep,
                        elapsedTime: totalTime,
                    },
                };
            }

            const steps = s.simulationData.steps;
            let lo = 0;
            let hi = steps.length - 1;
            while (lo <= hi) {
                const mid = (lo + hi) >> 1;
                if (steps[mid].cumulativeTime <= nextElapsed) {
                    lo = mid + 1;
                } else {
                    hi = mid - 1;
                }
            }

            const nextStepIndex = Math.max(0, Math.min(hi, maxStep));
            return {
                simulation: {
                    ...s.simulation,
                    currentStepIndex: nextStepIndex,
                    progress: nextStepIndex,
                    elapsedTime: nextElapsed,
                },
            };
        }),

    setSpeed: (speed: number) =>
        set((s) => ({
            simulation: { ...s.simulation, speed },
        })),

    // Export actions
    startExport: () =>
        set((s) => ({
            exportProgress: { ...s.exportProgress, exporting: true, progress: 0 },
            simulation: { ...s.simulation, playing: false },
        })),

    updateExportProgress: (progress) =>
        set((s) => ({
            exportProgress: { ...s.exportProgress, progress },
        })),

    finishExport: () =>
        set((s) => ({
            exportProgress: { ...s.exportProgress, exporting: false },
        })),

    // UI layout actions
    togglePanel: (panel) =>
        set((s) => ({
            uiLayout: { ...s.uiLayout, [panel]: !s.uiLayout[panel] },
        })),

    setViewMode: (mode: "3d" | "2d") =>
        set((s) => ({
            uiLayout: { ...s.uiLayout, viewMode: mode },
        })),

    setCameraOrientation: (faceId, direction) =>
        set((s) => ({
            uiLayout: { ...s.uiLayout, cameraFaceId: faceId, cameraDirection: direction },
        })),

    setAutoScroll: (enabled: boolean) =>
        set((s) => ({
            uiLayout: { ...s.uiLayout, autoScrollToActiveLine: enabled },
        })),

    setZAxisUp: (enabled: boolean) =>
        set((s) => ({
            uiLayout: { ...s.uiLayout, zAxisUp: enabled },
        })),

    setViewerOption: (option, enabled) =>
        set((s) => ({
            uiLayout: { ...s.uiLayout, [option]: enabled },
        })),

    requestCameraFit: () =>
        set((s) => ({
            cameraFitRequestId: s.cameraFitRequestId + 1,
        })),
}));

// Selectors for optimized re-renders
export const selectEditorText = (s: AppState) => s.editorText;
export const selectEditorLineCount = (s: AppState) => s.editorLineCount;
export const selectCursorLine = (s: AppState) => s.cursorLine;
export const selectHoveredLine = (s: AppState) => s.hoveredLine;
export const selectEditorFilename = (s: AppState) => s.editorFilename;
export const selectEditorExtension = (s: AppState) => s.editorExtension;
export const selectEditorLineEnding = (s: AppState) => s.editorLineEnding;
export const selectMachineProfile = (s: AppState) => s.machineProfile;
export const selectParsedGcode = (s: AppState) => s.parsedGcode;
export const selectDiagnostics = (s: AppState) => s.diagnostics;
export const selectSimulationData = (s: AppState) => s.simulationData;
export const selectSimulation = (s: AppState) => s.simulation;
export const selectUILayout = (s: AppState) => s.uiLayout;

// Derived selectors
export const selectSegments = (s: AppState): ToolpathSegment[] => s.simulationData.segments;
export const selectErrorCount = (s: AppState) =>
    s.diagnostics.filter((d) => d.severity === "error").length;
export const selectWarningCount = (s: AppState) =>
    s.diagnostics.filter((d) => d.severity === "warning").length;
export const selectIsValid = (s: AppState) =>
    s.diagnostics.filter((d) => d.severity === "error").length === 0;
