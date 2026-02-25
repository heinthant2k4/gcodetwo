"use client";

// Keyboard Shortcuts Hook
// Global keyboard listener — registered at app shell level
// Deterministic shortcuts with clear focus rules

import { useEffect, useCallback } from "react";
import { useAppStore } from "@/store";
import { SHORTCUTS } from "@/lib/keyboard/shortcuts";
import { loadGCodeFile, saveGCodeFile, getBasename } from "@/lib/io/file-handler";

export function useKeyboardShortcuts() {
    const play = useAppStore((s) => s.play);
    const pause = useAppStore((s) => s.pause);
    const stop = useAppStore((s) => s.stop);
    const stepForward = useAppStore((s) => s.stepForward);
    const stepBackward = useAppStore((s) => s.stepBackward);
    const setViewMode = useAppStore((s) => s.setViewMode);
    const editorText = useAppStore((s) => s.editorText);
    const editorFilename = useAppStore((s) => s.editorFilename);
    const editorExtension = useAppStore((s) => s.editorExtension);
    const editorLineEnding = useAppStore((s) => s.editorLineEnding);

    const handleAction = useCallback(
        (action: string) => {
            switch (action) {
                case "focus-editor":
                    document.getElementById("editor-panel")?.querySelector("textarea")?.focus();
                    break;
                case "focus-viewer":
                    document.getElementById("viewer-panel")?.focus();
                    break;
                case "focus-diagnostics":
                    document.getElementById("diagnostics-panel")?.focus();
                    break;
                case "focus-machine":
                    document.getElementById("machine-profile-panel")?.focus();
                    break;
                case "toggle-play": {
                    const simulation = useAppStore.getState().simulation;
                    if (simulation.playing) {
                        pause();
                    } else {
                        play();
                    }
                    break;
                }
                case "stop-simulation":
                    stop();
                    break;
                case "step-forward":
                    stepForward();
                    break;
                case "step-backward":
                    stepBackward();
                    break;
                case "toggle-view-mode": {
                    const uiLayout = useAppStore.getState().uiLayout;
                    setViewMode(uiLayout.viewMode === "3d" ? "2d" : "3d");
                    break;
                }
                case "export-gcode": {
                    saveGCodeFile({
                        content: editorText,
                        basename: editorFilename,
                        extension: editorExtension,
                        lineEnding: editorLineEnding,
                    });
                    break;
                }
                case "open-gcode": {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".gcode,.gc,.ngc,.txt";
                    input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                            const result = await loadGCodeFile(file);
                            if (!result.error) {
                                useAppStore.getState().setEditorText(result.content, {
                                    filename: getBasename(result.filename),
                                    extension: result.extension,
                                    lineEnding: result.lineEnding,
                                });
                            }
                        }
                    };
                    input.click();
                    break;
                }
            }
        },
        [
            play,
            pause,
            stop,
            stepForward,
            stepBackward,
            setViewMode,
            editorText,
            editorFilename,
            editorExtension,
            editorLineEnding,
        ]
    );

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Don't intercept when typing in input fields (except editor)
            const target = e.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.tagName === "SELECT"
            ) {
                // Allow Ctrl+S for save even in inputs
                if (!(e.ctrlKey && e.key === "s")) {
                    return;
                }
            }

            for (const shortcut of SHORTCUTS) {
                const ctrlMatch = shortcut.ctrlKey ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
                const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;
                const altMatch = shortcut.altKey ? e.altKey : !e.altKey;
                const keyMatch = e.key === shortcut.key;

                if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
                    e.preventDefault();
                    handleAction(shortcut.action);
                    return;
                }
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handleAction]);
}
