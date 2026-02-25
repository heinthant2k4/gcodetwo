// Keyboard Shortcuts Definition
// Deterministic shortcuts — keyboard-first interaction model

export interface KeyboardShortcut {
    id: string;
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    description: string;
    action: string;
}

export const SHORTCUTS: KeyboardShortcut[] = [
    {
        id: "focus-editor",
        key: "1",
        ctrlKey: true,
        shiftKey: true,
        description: "Focus Editor Panel",
        action: "focus-editor",
    },
    {
        id: "focus-viewer",
        key: "2",
        ctrlKey: true,
        shiftKey: true,
        description: "Focus Viewer Panel",
        action: "focus-viewer",
    },
    {
        id: "focus-diagnostics",
        key: "3",
        ctrlKey: true,
        shiftKey: true,
        description: "Focus Diagnostics Panel",
        action: "focus-diagnostics",
    },
    {
        id: "focus-machine",
        key: "4",
        ctrlKey: true,
        shiftKey: true,
        description: "Focus Machine Profile Panel",
        action: "focus-machine",
    },
    {
        id: "toggle-play",
        key: " ",
        ctrlKey: false,
        shiftKey: true,
        description: "Play / Pause Simulation",
        action: "toggle-play",
    },
    {
        id: "stop-simulation",
        key: "Escape",
        description: "Stop Simulation",
        action: "stop-simulation",
    },
    {
        id: "step-forward",
        key: "ArrowRight",
        ctrlKey: true,
        description: "Step Forward",
        action: "step-forward",
    },
    {
        id: "step-backward",
        key: "ArrowLeft",
        ctrlKey: true,
        description: "Step Backward",
        action: "step-backward",
    },
    {
        id: "toggle-view-mode",
        key: "v",
        ctrlKey: true,
        shiftKey: true,
        description: "Toggle 2D/3D View",
        action: "toggle-view-mode",
    },
    {
        id: "fit-view",
        key: "f",
        description: "Fit Toolpath to View",
        action: "fit-view",
    },
    {
        id: "view-front",
        key: "1",
        ctrlKey: true,
        description: "Front View (SolidWorks-style)",
        action: "view-front",
    },
    {
        id: "view-right",
        key: "4",
        ctrlKey: true,
        description: "Right View (SolidWorks-style)",
        action: "view-right",
    },
    {
        id: "view-top",
        key: "5",
        ctrlKey: true,
        description: "Top View (SolidWorks-style)",
        action: "view-top",
    },
    {
        id: "view-iso",
        key: "7",
        ctrlKey: true,
        description: "Isometric View (SolidWorks-style)",
        action: "view-iso",
    },
    {
        id: "toggle-z-up",
        key: "z",
        ctrlKey: true,
        shiftKey: true,
        description: "Toggle Z-axis Up",
        action: "toggle-z-up",
    },
    {
        id: "export-gcode",
        key: "s",
        ctrlKey: true,
        description: "Export G-code File",
        action: "export-gcode",
    },
    {
        id: "open-gcode",
        key: "o",
        ctrlKey: true,
        description: "Open G-code File",
        action: "open-gcode",
    },
];

export function formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    if (shortcut.ctrlKey) parts.push("Ctrl");
    if (shortcut.shiftKey) parts.push("Shift");
    if (shortcut.altKey) parts.push("Alt");

    const keyName =
        shortcut.key === " "
            ? "Space"
            : shortcut.key === "ArrowRight"
                ? "→"
                : shortcut.key === "ArrowLeft"
                    ? "←"
                    : shortcut.key.length === 1
                        ? shortcut.key.toUpperCase()
                        : shortcut.key;

    parts.push(keyName);
    return parts.join("+");
}
