"use client";

// G-code Editor — Monaco integration
// Syntax highlighting, error markers, line-to-toolpath interaction

import { useRef, useCallback, useEffect } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import type { editor as MonacoEditor, languages, IDisposable } from "monaco-editor";
import { useAppStore, selectEditorText, selectDiagnostics } from "@/store";
import {
    gcodeLanguageId,
    gcodeLanguageConfig,
    gcodeMonarchTokens,
    gcodeThemeData,
} from "@/lib/editor/gcode-language";

export default function GCodeEditor() {
    const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof import("monaco-editor") | null>(null);

    const text = useAppStore(selectEditorText);
    const diagnostics = useAppStore(selectDiagnostics);
    const setEditorText = useAppStore((s) => s.setEditorText);
    const setCursorLine = useAppStore((s) => s.setCursorLine);
    const setHoveredLine = useAppStore((s) => s.setHoveredLine);

    const handleEditorMount: OnMount = useCallback(
        (editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;

            // Register G-code language
            monaco.languages.register({ id: gcodeLanguageId });
            monaco.languages.setLanguageConfiguration(
                gcodeLanguageId,
                gcodeLanguageConfig as languages.LanguageConfiguration
            );
            monaco.languages.setMonarchTokensProvider(
                gcodeLanguageId,
                gcodeMonarchTokens as languages.IMonarchLanguage
            );

            // Define theme
            monaco.editor.defineTheme("gcode-dark", gcodeThemeData);
            monaco.editor.setTheme("gcode-dark");

            // Set language
            const model = editor.getModel();
            if (model) {
                monaco.editor.setModelLanguage(model, gcodeLanguageId);
            }

            // Track cursor position
            editor.onDidChangeCursorPosition((e) => {
                setCursorLine(e.position.lineNumber);
            });

            // Track mouse hover for toolpath highlighting
            let hoverDisposable: IDisposable | null = null;
            hoverDisposable = editor.onMouseMove((e) => {
                if (e.target.position) {
                    setHoveredLine(e.target.position.lineNumber);
                }
            });

            editor.onMouseLeave(() => {
                setHoveredLine(null);
            });

            // Focus editor
            editor.focus();

            return () => {
                hoverDisposable?.dispose();
            };
        },
        [setCursorLine, setHoveredLine]
    );

    const handleChange: OnChange = useCallback(
        (value) => {
            if (value !== undefined) {
                setEditorText(value);
            }
        },
        [setEditorText]
    );

    // Update error markers when diagnostics change
    useEffect(() => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        if (!editor || !monaco) return;

        const model = editor.getModel();
        if (!model) return;

        const markers: MonacoEditor.IMarkerData[] = diagnostics.map((d) => ({
            severity:
                d.severity === "error"
                    ? monaco.MarkerSeverity.Error
                    : d.severity === "warning"
                        ? monaco.MarkerSeverity.Warning
                        : monaco.MarkerSeverity.Info,
            startLineNumber: d.line,
            startColumn: 1,
            endLineNumber: d.line,
            endColumn: model.getLineMaxColumn(d.line),
            message: d.message,
            source: d.ruleId,
        }));

        monaco.editor.setModelMarkers(model, "gcode-validator", markers);
    }, [diagnostics]);

    // Jump to line function (exposed for diagnostics panel)
    const jumpToLine = useCallback((line: number) => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.revealLineInCenter(line);
        editor.setPosition({ lineNumber: line, column: 1 });
        editor.focus();
    }, []);

    // Expose jumpToLine globally for diagnostics panel
    useEffect(() => {
        (window as unknown as Record<string, unknown>).__gcodeEditorJumpToLine = jumpToLine;
        return () => {
            delete (window as unknown as Record<string, unknown>).__gcodeEditorJumpToLine;
        };
    }, [jumpToLine]);

    return (
        <div className="h-full w-full" id="editor-panel">
            <Editor
                height="100%"
                defaultLanguage="gcode"
                value={text}
                onChange={handleChange}
                onMount={handleEditorMount}
                theme="gcode-dark"
                options={{
                    fontSize: 13,
                    fontFamily: "var(--font-code)",
                    lineNumbers: "on",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    renderLineHighlight: "line",
                    cursorBlinking: "solid",
                    cursorStyle: "line",
                    smoothScrolling: false,
                    wordWrap: "off",
                    tabSize: 2,
                    glyphMargin: true,
                    folding: false,
                    lineDecorationsWidth: 4,
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    scrollbar: {
                        vertical: "auto",
                        horizontal: "auto",
                        verticalScrollbarSize: 6,
                        horizontalScrollbarSize: 6,
                    },
                    padding: { top: 8, bottom: 8 },
                }}
                loading={
                    <div className="flex h-full items-center justify-center bg-bg-900 text-text-300 font-code text-sm">
                        Loading editor…
                    </div>
                }
            />
        </div>
    );
}
