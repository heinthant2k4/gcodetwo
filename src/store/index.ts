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

// UI Layout state
interface UILayout {
    editorCollapsed: boolean;
    viewerCollapsed: boolean;
    diagnosticsCollapsed: boolean;
    machineProfileCollapsed: boolean;
    viewMode: "3d" | "2d";
}

// Simulation playback state
interface SimulationPlayback {
    playing: boolean;
    currentStep: number;
    speed: number; // multiplier
}

// Complete store state
interface AppState {
    // Editor domain
    editorText: string;
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

    // Actions — editor
    setEditorText: (text: string) => void;
    setCursorLine: (line: number) => void;
    setHoveredLine: (line: number | null) => void;

    // Actions — machine profile
    setMachineProfile: (profile: MachineProfile) => void;
    updateMachineProfile: (updates: Partial<MachineProfile>) => void;

    // Actions — simulation
    play: () => void;
    pause: () => void;
    stop: () => void;
    stepForward: () => void;
    stepBackward: () => void;
    setCurrentStep: (step: number) => void;
    setSpeed: (speed: number) => void;

    // Actions — UI layout
    togglePanel: (panel: keyof Omit<UILayout, "viewMode">) => void;
    setViewMode: (mode: "3d" | "2d") => void;
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

export const useAppStore = create<AppState>((set, get) => ({
    // Initial state
    editorText: INITIAL_TEXT,
    cursorLine: 1,
    hoveredLine: null,

    machineProfile: DEFAULT_MACHINE_PROFILE,

    parsedGcode: initialDerived.parsedGcode,
    diagnostics: initialDerived.diagnostics,
    simulationData: initialDerived.simulationData,

    simulation: {
        playing: false,
        currentStep: 0,
        speed: 1,
    },

    uiLayout: {
        editorCollapsed: false,
        viewerCollapsed: false,
        diagnosticsCollapsed: false,
        machineProfileCollapsed: false,
        viewMode: "3d",
    },

    // Editor actions
    setEditorText: (text) => {
        const profile = get().machineProfile;
        const derived = computeDerived(text, profile);
        set({
            editorText: text,
            ...derived,
            simulation: { ...get().simulation, playing: false, currentStep: 0 },
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
            simulation: { ...get().simulation, playing: false, currentStep: 0 },
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
            simulation: { ...get().simulation, playing: false, currentStep: 0 },
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
            simulation: { ...s.simulation, playing: false, currentStep: 0 },
        })),

    stepForward: () =>
        set((s) => {
            const maxStep = s.simulationData.segments.length;
            return {
                simulation: {
                    ...s.simulation,
                    playing: false,
                    currentStep: Math.min(s.simulation.currentStep + 1, maxStep),
                },
            };
        }),

    stepBackward: () =>
        set((s) => ({
            simulation: {
                ...s.simulation,
                playing: false,
                currentStep: Math.max(s.simulation.currentStep - 1, 0),
            },
        })),

    setCurrentStep: (step) =>
        set((s) => ({
            simulation: { ...s.simulation, currentStep: step },
        })),

    setSpeed: (speed) =>
        set((s) => ({
            simulation: { ...s.simulation, speed },
        })),

    // UI layout actions
    togglePanel: (panel) =>
        set((s) => ({
            uiLayout: { ...s.uiLayout, [panel]: !s.uiLayout[panel] },
        })),

    setViewMode: (mode) =>
        set((s) => ({
            uiLayout: { ...s.uiLayout, viewMode: mode },
        })),
}));

// Selectors for optimized re-renders
export const selectEditorText = (s: AppState) => s.editorText;
export const selectCursorLine = (s: AppState) => s.cursorLine;
export const selectHoveredLine = (s: AppState) => s.hoveredLine;
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
